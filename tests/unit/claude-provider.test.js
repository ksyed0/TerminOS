'use strict';

jest.mock('../../tools/providers/http-client');

const httpClient = require('../../tools/providers/http-client');
const { ClaudeProvider } = require('../../tools/providers/claude-provider');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_AI_RESPONSE = {
  command: 'ls -la',
  explanation: 'Lists all files including hidden ones in long format',
  riskLevel: 'safe',
};

/** Simulates the HTTP response body Claude sends back */
function claudeBody(text) {
  return JSON.stringify({
    content: [{ type: 'text', text }],
    model: 'claude-3-5-haiku-20241022',
    role: 'assistant',
  });
}

const CLAUDE_SUCCESS_BODY = claudeBody(JSON.stringify(VALID_AI_RESPONSE));

function makeHttpErr(statusCode, message = `HTTP ${statusCode}`) {
  return Object.assign(new Error(message), { statusCode });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClaudeProvider', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new ClaudeProvider({ apiKey: 'test-api-key' });
  });

  // ---- constructor ----

  describe('constructor', () => {
    it('throws if apiKey is missing', () => {
      expect(() => new ClaudeProvider({})).toThrow('apiKey');
    });

    it('uses the default model when none is specified', () => {
      expect(provider.model).toBe('claude-3-5-haiku-20241022');
    });

    it('uses a custom model when specified', () => {
      const p = new ClaudeProvider({ apiKey: 'k', model: 'claude-3-opus-20240229' });
      expect(p.model).toBe('claude-3-opus-20240229');
    });
  });

  // ---- interpret() — validation ----

  describe('interpret() — payload validation', () => {
    it('throws ValidationError when payload is null', async () => {
      await expect(provider.interpret(null)).rejects.toMatchObject({ name: 'ValidationError' });
    });

    it('throws ValidationError when userInput is empty', async () => {
      await expect(provider.interpret({ userInput: '   ' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });
  });

  // ---- interpret() — success ----

  describe('interpret() — success', () => {
    it('returns a parsed AIResponse on a valid Claude reply', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: CLAUDE_SUCCESS_BODY });
      const result = await provider.interpret({ userInput: 'list files' });
      expect(result.command).toBe('ls -la');
      expect(result.riskLevel).toBe('safe');
    });

    it('strips markdown code fences before parsing', async () => {
      const withFences = claudeBody('```json\n' + JSON.stringify(VALID_AI_RESPONSE) + '\n```');
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: withFences });
      const result = await provider.interpret({ userInput: 'list files' });
      expect(result.command).toBe('ls -la');
    });

    it('sends x-api-key and anthropic-version headers', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: CLAUDE_SUCCESS_BODY });
      await provider.interpret({ userInput: 'list files' });
      const [, , headers] = httpClient.post.mock.calls[0];
      expect(headers['x-api-key']).toBe('test-api-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });
  });

  // ---- interpret() — retry logic ----

  describe('interpret() — retry logic', () => {
    it('retries on 429 and succeeds on the second attempt', async () => {
      jest.useFakeTimers();
      httpClient.post
        .mockRejectedValueOnce(makeHttpErr(429, 'Rate Limited'))
        .mockResolvedValueOnce({ statusCode: 200, body: CLAUDE_SUCCESS_BODY });

      const promise = provider.interpret({ userInput: 'list files' });
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(httpClient.post).toHaveBeenCalledTimes(2);
      expect(result.command).toBe('ls -la');
      jest.useRealTimers();
    });

    it('does NOT retry on 401 (auth failure)', async () => {
      httpClient.post.mockRejectedValue(makeHttpErr(401, 'Unauthorized'));
      await expect(provider.interpret({ userInput: 'list files' })).rejects.toMatchObject({
        name: 'IntegrationError',
      });
      expect(httpClient.post).toHaveBeenCalledTimes(1);
    });

    it('throws IntegrationError after exhausting all retries', async () => {
      jest.useFakeTimers();
      httpClient.post.mockRejectedValue(makeHttpErr(500, 'Internal Server Error'));

      // Set up the rejection expectation BEFORE advancing timers to avoid unhandled rejection
      const expectation = expect(
        provider.interpret({ userInput: 'list files' })
      ).rejects.toMatchObject({ name: 'IntegrationError' });
      await jest.runAllTimersAsync();
      await expectation;

      // MAX_RETRIES = 3 → 4 total attempts (attempt 0..3)
      expect(httpClient.post).toHaveBeenCalledTimes(4);
      jest.useRealTimers();
    });
  });

  // ---- interpret() — malformed responses ----

  describe('interpret() — malformed responses', () => {
    it('throws ValidationError when response content is not JSON', async () => {
      const badBody = claudeBody('not json at all');
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: badBody });
      await expect(provider.interpret({ userInput: 'list files' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });

    it('throws ValidationError when response envelope is malformed', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: 'not-json-envelope' });
      await expect(provider.interpret({ userInput: 'list files' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });

    it('does not retry ValidationError (malformed response is not transient)', async () => {
      const badBody = claudeBody('not json');
      httpClient.post.mockResolvedValue({ statusCode: 200, body: badBody });
      await expect(provider.interpret({ userInput: 'list files' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
      expect(httpClient.post).toHaveBeenCalledTimes(1);
    });
  });

  // ---- testConnection() ----

  describe('testConnection()', () => {
    it('returns true when interpret succeeds', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: CLAUDE_SUCCESS_BODY });
      await expect(provider.testConnection()).resolves.toBe(true);
    });

    it('returns false when interpret fails', async () => {
      httpClient.post.mockRejectedValue(makeHttpErr(401, 'Unauthorized'));
      await expect(provider.testConnection()).resolves.toBe(false);
    });

    it('never throws — always returns a boolean', async () => {
      // Use a non-retryable 401 so there are no timer delays
      httpClient.post.mockRejectedValue(makeHttpErr(401, 'Unauthorized'));
      await expect(provider.testConnection()).resolves.toBe(false);
    });
  });
});
