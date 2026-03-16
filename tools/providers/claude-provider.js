'use strict';

const {
  ProviderInterface,
  IntegrationError,
  ValidationError,
  validateAIRequest,
  validateAIResponse,
} = require('./provider-interface');
const http = require('./http-client');

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-3-5-haiku-20241022';
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

// Returns true if the error warrants a retry attempt.
// 4xx client errors (except 429 rate-limit and 529 overloaded) are not retryable.
function _isRetryable(err) {
  if (err.name === 'ValidationError') return false;
  const s = err.statusCode;
  if (s == null) return true;      // network/timeout — retryable
  if (s === 429 || s === 529) return true;
  if (s >= 500) return true;
  return false;                     // 4xx (excl. 429/529) — not retryable
}

/**
 * @param {{ apiKey: string, model?: string }} opts
 */
function ClaudeProvider({ apiKey, model } = {}) {
  if (!apiKey) throw new Error('ClaudeProvider requires apiKey');
  ProviderInterface.call(this);
  this.apiKey = apiKey;
  this.model = model || DEFAULT_MODEL;
}

ClaudeProvider.prototype = Object.create(ProviderInterface.prototype);
ClaudeProvider.prototype.constructor = ClaudeProvider;

/**
 * Strip optional markdown code fences then parse and validate the JSON content.
 * @param {string} text - Raw text from Claude's content block
 * @returns {AIResponse}
 */
ClaudeProvider.prototype._parseResponse = function(text) {
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  let parsed;
  try {
    parsed = JSON.parse(stripped);
  } catch (_) {
    throw new ValidationError(
      `Claude returned non-JSON content: ${stripped.slice(0, 100)}`,
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
ClaudeProvider.prototype.interpret = async function(payload) {
  validateAIRequest(payload);

  const requestBody = {
    model: this.model,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: payload.userInput }],
  };
  const headers = {
    'x-api-key': this.apiKey,
    'anthropic-version': ANTHROPIC_VERSION,
  };

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { body } = await http.post(ENDPOINT, requestBody, headers);

      // Parse the Anthropic response envelope
      let data;
      try {
        data = JSON.parse(body);
      } catch (_) {
        throw new ValidationError('Malformed Claude response envelope', { field: 'body' });
      }

      const text =
        data &&
        data.content &&
        Array.isArray(data.content) &&
        data.content[0] &&
        data.content[0].text;
      if (typeof text !== 'string') {
        throw new ValidationError('Unexpected Claude response structure', { field: 'content' });
      }

      return this._parseResponse(text);
    } catch (err) {
      if (!_isRetryable(err)) {
        if (err.name === 'ValidationError') throw err;
        throw new IntegrationError(
          `Claude API error ${err.statusCode}: ${err.message}`,
          { provider: 'claude', attempt: attempt + 1, cause: err }
        );
      }
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await _sleep(BACKOFF_MS[attempt]);
      }
    }
  }

  throw new IntegrationError(
    `Claude provider failed after ${MAX_RETRIES + 1} attempts: ${lastErr.message}`,
    { provider: 'claude', attempt: MAX_RETRIES + 1, cause: lastErr }
  );
};

/**
 * Verify connectivity and credentials. Never throws.
 * @returns {Promise<boolean>}
 */
ClaudeProvider.prototype.testConnection = async function() {
  try {
    await this.interpret({ userInput: 'list files in current directory' });
    return true;
  } catch (_) {
    return false;
  }
};

module.exports = { ClaudeProvider };
