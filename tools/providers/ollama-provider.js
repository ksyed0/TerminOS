'use strict';

const {
  ProviderInterface,
  IntegrationError,
  ValidationError,
  validateAIRequest,
  validateAIResponse,
} = require('./provider-interface');
const http = require('./http-client');

const DEFAULT_HOST = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3';
const MAX_RETRIES = 3;
const BACKOFF_MS = [1000, 2000, 4000];

const SYSTEM_PROMPT = [
  'You are a terminal command interpreter.',
  "Convert the user's natural language input into a shell command.",
  'Respond ONLY with valid JSON — no markdown fences, no extra text:',
  '{"command":"<shell command>","explanation":"<brief explanation>","riskLevel":"safe|caution|destructive"}',
  'riskLevel: safe = read-only; caution = creates or modifies files/directories; destructive = permanently deletes or overwrites data.',
].join('\n');

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function _isRetryable(err) {
  if (err.name === 'ValidationError') return false;
  if (err.name === 'IntegrationError') return false; // model-not-found etc.
  const s = err.statusCode;
  if (s == null) return true;      // network/ECONNREFUSED/timeout — retryable
  if (s >= 500) return true;
  return false;
}

/**
 * @param {{ host?: string, model?: string }} opts
 */
function OllamaProvider({ host, model } = {}) {
  ProviderInterface.call(this);
  this.host = (host || DEFAULT_HOST).replace(/\/$/, '');
  this.model = model || DEFAULT_MODEL;
}

OllamaProvider.prototype = Object.create(ProviderInterface.prototype);
OllamaProvider.prototype.constructor = OllamaProvider;

/**
 * GET /api/tags — confirm server is up and model is available.
 * @throws {IntegrationError} if server unreachable or model not loaded
 */
OllamaProvider.prototype._ping = async function() {
  const { body } = await http.get(`${this.host}/api/tags`);
  let data;
  try {
    data = JSON.parse(body);
  } catch (_) {
    throw new ValidationError('Malformed Ollama /api/tags response', { field: 'body' });
  }
  const models = (data.models || []).map((m) => m.name);
  if (!models.includes(this.model)) {
    throw new IntegrationError(
      `Ollama model '${this.model}' not found. Available: ${models.join(', ') || 'none'}`,
      { provider: 'ollama' }
    );
  }
};

/**
 * Parse and validate the JSON string from Ollama's response field.
 * @param {string} responseText
 * @returns {AIResponse}
 */
OllamaProvider.prototype._parseResponse = function(responseText) {
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (_) {
    throw new ValidationError(
      `Ollama returned non-JSON response: ${responseText.slice(0, 100)}`,
      { field: 'response' }
    );
  }
  validateAIResponse(parsed);
  return parsed;
};

/**
 * @param {AIRequest} payload
 * @returns {Promise<AIResponse>}
 */
OllamaProvider.prototype.interpret = async function(payload) {
  validateAIRequest(payload);

  const requestBody = {
    model: this.model,
    prompt: `${SYSTEM_PROMPT}\n\nUser: ${payload.userInput}`,
    stream: false,
    format: 'json',
  };

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { body } = await http.post(`${this.host}/api/generate`, requestBody);

      let data;
      try {
        data = JSON.parse(body);
      } catch (_) {
        throw new ValidationError('Malformed Ollama response envelope', { field: 'body' });
      }

      if (typeof data.response !== 'string') {
        throw new ValidationError('Unexpected Ollama response structure', { field: 'response' });
      }

      return this._parseResponse(data.response);
    } catch (err) {
      if (!_isRetryable(err)) {
        if (err.name === 'ValidationError') throw err;
        throw new IntegrationError(
          `Ollama API error: ${err.message}`,
          { provider: 'ollama', attempt: attempt + 1, cause: err }
        );
      }
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await _sleep(BACKOFF_MS[attempt]);
      }
    }
  }

  throw new IntegrationError(
    `Ollama provider failed after ${MAX_RETRIES + 1} attempts: ${lastErr.message}`,
    { provider: 'ollama', attempt: MAX_RETRIES + 1, cause: lastErr }
  );
};

/**
 * Ping server, check model is loaded, then test interpret. Never throws.
 * @returns {Promise<boolean>}
 */
OllamaProvider.prototype.testConnection = async function() {
  try {
    await this._ping();
    await this.interpret({ userInput: 'list files in current directory' });
    return true;
  } catch (_) {
    return false;
  }
};

module.exports = { OllamaProvider };
