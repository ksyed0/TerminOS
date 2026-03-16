'use strict';

const {
  ProviderInterface,
  IntegrationError,
  ValidationError,
  validateAIRequest,
  validateAIResponse,
} = require('./provider-interface');
const http = require('./http-client');

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';
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
  const s = err.statusCode;
  if (s == null) return true;      // network/timeout — retryable
  if (s === 429) return true;
  if (s >= 500) return true;
  return false;                     // 4xx (excl. 429) — not retryable
}

/**
 * @param {{ apiKey: string, model?: string }} opts
 */
function OpenAIProvider({ apiKey, model } = {}) {
  if (!apiKey) throw new Error('OpenAIProvider requires apiKey');
  ProviderInterface.call(this);
  this.apiKey = apiKey;
  this.model = model || DEFAULT_MODEL;
}

OpenAIProvider.prototype = Object.create(ProviderInterface.prototype);
OpenAIProvider.prototype.constructor = OpenAIProvider;

/**
 * Parse and validate the JSON string from choices[0].message.content.
 * @param {string} content
 * @returns {AIResponse}
 */
OpenAIProvider.prototype._parseResponse = function(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_) {
    throw new ValidationError(
      `OpenAI returned non-JSON content: ${content.slice(0, 100)}`,
      { field: 'content' }
    );
  }
  validateAIResponse(parsed);
  return parsed;
};

/**
 * @param {AIRequest} payload
 * @returns {Promise<AIResponse>}
 */
OpenAIProvider.prototype.interpret = async function(payload) {
  validateAIRequest(payload);

  const requestBody = {
    model: this.model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: payload.userInput },
    ],
  };
  const headers = {
    Authorization: `Bearer ${this.apiKey}`,
  };

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { body } = await http.post(ENDPOINT, requestBody, headers);

      let data;
      try {
        data = JSON.parse(body);
      } catch (_) {
        throw new ValidationError('Malformed OpenAI response envelope', { field: 'body' });
      }

      const content =
        data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content;
      if (typeof content !== 'string') {
        throw new ValidationError('Unexpected OpenAI response structure', { field: 'choices' });
      }

      return this._parseResponse(content);
    } catch (err) {
      if (!_isRetryable(err)) {
        if (err.name === 'ValidationError') throw err;
        throw new IntegrationError(
          `OpenAI API error ${err.statusCode}: ${err.message}`,
          { provider: 'openai', attempt: attempt + 1, cause: err }
        );
      }
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await _sleep(BACKOFF_MS[attempt]);
      }
    }
  }

  throw new IntegrationError(
    `OpenAI provider failed after ${MAX_RETRIES + 1} attempts: ${lastErr.message}`,
    { provider: 'openai', attempt: MAX_RETRIES + 1, cause: lastErr }
  );
};

/**
 * Verify connectivity and credentials. Never throws.
 * @returns {Promise<boolean>}
 */
OpenAIProvider.prototype.testConnection = async function() {
  try {
    await this.interpret({ userInput: 'list files in current directory' });
    return true;
  } catch (_) {
    return false;
  }
};

module.exports = { OpenAIProvider };
