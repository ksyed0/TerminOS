'use strict';

jest.mock('../../tools/providers/http-client');

const httpClient = require('../../tools/providers/http-client');
const { OpenAIProvider } = require('../../tools/providers/openai-provider');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_AI_RESPONSE = {
  command: 'ls -la',
  explanation: 'Lists all files including hidden ones',
  riskLevel: 'safe',
};

function openaiBody(content) {
  return JSON.stringify({
    choices: [{ message: { content } }],
    model: 'gpt-4o-mini',
  });
}

const OPENAI_SUCCESS_BODY = openaiBody(JSON.stringify(VALID_AI_RESPONSE));

function makeHttpErr(statusCode, message = `HTTP ${statusCode}`) {
  return Object.assign(new Error(message), { statusCode });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OpenAIProvider', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OpenAIProvider({ apiKey: 'test-openai-key' });
  });

  // ---- constructor ----

  describe('constructor', () => {
    it('throws if apiKey is missing', () => {
      expect(() => new OpenAIProvider({})).toThrow('apiKey');
    });

    it('uses the default model when none is specified', () => {
      expect(provider.model).toBe('gpt-4o-mini');
    });

    it('uses a custom model when specified', () => {
      const p = new OpenAIProvider({ apiKey: 'k', model: 'gpt-4o' });
      expect(p.model).toBe('gpt-4o');
    });
  });

  // ---- interpret() — validation ----

  describe('interpret() — payload validation', () => {
    it('throws ValidationError when payload is null', async () => {
      await expect(provider.interpret(null)).rejects.toMatchObject({ name: 'ValidationError' });
    });

    it('throws ValidationError when userInput is empty', async () => {
      await expect(provider.interpret({ userInput: '' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });
  });

  // ---- interpret() — success ----

  describe('interpret() — success', () => {
    it('returns a parsed AIResponse on a valid OpenAI reply', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: OPENAI_SUCCESS_BODY });
      const result = await provider.interpret({ userInput: 'list files' });
      expect(result.command).toBe('ls -la');
      expect(result.riskLevel).toBe('safe');
    });

    it('extracts content from choices[0].message.content', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: OPENAI_SUCCESS_BODY });
      const result = await provider.interpret({ userInput: 'list files' });
      expect(result.explanation).toBe('Lists all files including hidden ones');
    });

    it('sends Authorization: Bearer header', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: OPENAI_SUCCESS_BODY });
      await provider.interpret({ userInput: 'list files' });
      const [, , headers] = httpClient.post.mock.calls[0];
      expect(headers['Authorization']).toBe('Bearer test-openai-key');
    });

    it('includes response_format: json_object in request body', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: OPENAI_SUCCESS_BODY });
      await provider.interpret({ userInput: 'list files' });
      const [, body] = httpClient.post.mock.calls[0];
      expect(body.response_format).toEqual({ type: 'json_object' });
    });
  });

  // ---- interpret() — retry logic ----

  describe('interpret() — retry logic', () => {
    it('retries on 429 and succeeds on the second attempt', async () => {
      jest.useFakeTimers();
      httpClient.post
        .mockRejectedValueOnce(makeHttpErr(429, 'Rate Limited'))
        .mockResolvedValueOnce({ statusCode: 200, body: OPENAI_SUCCESS_BODY });

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

    it('throws IntegrationError after exhausting all retries on 5xx', async () => {
      jest.useFakeTimers();
      httpClient.post.mockRejectedValue(makeHttpErr(503, 'Service Unavailable'));

      const expectation = expect(
        provider.interpret({ userInput: 'list files' })
      ).rejects.toMatchObject({ name: 'IntegrationError' });
      await jest.runAllTimersAsync();
      await expectation;

      expect(httpClient.post).toHaveBeenCalledTimes(4);
      jest.useRealTimers();
    });
  });

  // ---- interpret() — malformed responses ----

  describe('interpret() — malformed responses', () => {
    it('throws ValidationError when choices content is not JSON', async () => {
      httpClient.post.mockResolvedValueOnce({
        statusCode: 200,
        body: openaiBody('plain text, not json'),
      });
      await expect(provider.interpret({ userInput: 'list files' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });

    it('throws ValidationError when response envelope is malformed', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: 'not-json' });
      await expect(provider.interpret({ userInput: 'list files' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });
  });

  // ---- testConnection() ----

  describe('testConnection()', () => {
    it('returns true when interpret succeeds', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: OPENAI_SUCCESS_BODY });
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
