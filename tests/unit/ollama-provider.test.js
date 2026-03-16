'use strict';

jest.mock('../../tools/providers/http-client');

const httpClient = require('../../tools/providers/http-client');
const { OllamaProvider } = require('../../tools/providers/ollama-provider');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_AI_RESPONSE = {
  command: 'ls -la',
  explanation: 'Lists all files including hidden ones',
  riskLevel: 'safe',
};

function ollamaGenerateBody(responseText) {
  return JSON.stringify({ response: responseText });
}

function ollamaTagsBody(modelNames) {
  return JSON.stringify({ models: modelNames.map((name) => ({ name })) });
}

const GENERATE_SUCCESS_BODY = ollamaGenerateBody(JSON.stringify(VALID_AI_RESPONSE));
const TAGS_WITH_MODEL_BODY = ollamaTagsBody(['llama3', 'mistral']);

function makeHttpErr(statusCode, message = `HTTP ${statusCode}`) {
  return Object.assign(new Error(message), { statusCode });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OllamaProvider', () => {
  let provider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new OllamaProvider({ host: 'http://localhost:11434', model: 'llama3' });
  });

  // ---- constructor ----

  describe('constructor', () => {
    it('uses default host and model when none provided', () => {
      const p = new OllamaProvider();
      expect(p.host).toBe('http://localhost:11434');
      expect(p.model).toBe('llama3');
    });

    it('strips trailing slash from host', () => {
      const p = new OllamaProvider({ host: 'http://localhost:11434/' });
      expect(p.host).toBe('http://localhost:11434');
    });

    it('accepts a custom host and model', () => {
      const p = new OllamaProvider({ host: 'http://192.168.1.5:11434', model: 'mistral' });
      expect(p.host).toBe('http://192.168.1.5:11434');
      expect(p.model).toBe('mistral');
    });
  });

  // ---- _ping() ----

  describe('_ping()', () => {
    it('resolves when server is up and model is available', async () => {
      httpClient.get.mockResolvedValueOnce({ statusCode: 200, body: TAGS_WITH_MODEL_BODY });
      await expect(provider._ping()).resolves.toBeUndefined();
    });

    it('throws IntegrationError when model is not in /api/tags', async () => {
      httpClient.get.mockResolvedValueOnce({
        statusCode: 200,
        body: ollamaTagsBody(['mistral']), // llama3 not present
      });
      await expect(provider._ping()).rejects.toMatchObject({
        name: 'IntegrationError',
        message: expect.stringContaining("llama3"),
      });
    });

    it('throws when GET /api/tags fails (server down)', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));
      await expect(provider._ping()).rejects.toThrow('ECONNREFUSED');
    });
  });

  // ---- interpret() ----

  describe('interpret() — validation', () => {
    it('throws ValidationError when payload is null', async () => {
      await expect(provider.interpret(null)).rejects.toMatchObject({ name: 'ValidationError' });
    });

    it('throws ValidationError when userInput is empty', async () => {
      await expect(provider.interpret({ userInput: '' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });
  });

  describe('interpret() — success', () => {
    it('returns a parsed AIResponse', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: GENERATE_SUCCESS_BODY });
      const result = await provider.interpret({ userInput: 'list files' });
      expect(result.command).toBe('ls -la');
      expect(result.riskLevel).toBe('safe');
    });

    it('sends stream: false in request body', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: GENERATE_SUCCESS_BODY });
      await provider.interpret({ userInput: 'list files' });
      const [, body] = httpClient.post.mock.calls[0];
      expect(body.stream).toBe(false);
    });

    it('sends format: json in request body', async () => {
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: GENERATE_SUCCESS_BODY });
      await provider.interpret({ userInput: 'list files' });
      const [, body] = httpClient.post.mock.calls[0];
      expect(body.format).toBe('json');
    });
  });

  describe('interpret() — retry logic', () => {
    it('retries on connection refused (ECONNREFUSED)', async () => {
      jest.useFakeTimers();
      const connErr = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
      httpClient.post
        .mockRejectedValueOnce(connErr)
        .mockResolvedValueOnce({ statusCode: 200, body: GENERATE_SUCCESS_BODY });

      const promise = provider.interpret({ userInput: 'list files' });
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(httpClient.post).toHaveBeenCalledTimes(2);
      expect(result.command).toBe('ls -la');
      jest.useRealTimers();
    });

    it('throws IntegrationError after exhausting all retries', async () => {
      jest.useFakeTimers();
      const connErr = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
      httpClient.post.mockRejectedValue(connErr);

      const expectation = expect(
        provider.interpret({ userInput: 'list files' })
      ).rejects.toMatchObject({ name: 'IntegrationError' });
      await jest.runAllTimersAsync();
      await expectation;

      expect(httpClient.post).toHaveBeenCalledTimes(4);
      jest.useRealTimers();
    });
  });

  describe('interpret() — malformed responses', () => {
    it('throws ValidationError when response field is not JSON', async () => {
      httpClient.post.mockResolvedValueOnce({
        statusCode: 200,
        body: ollamaGenerateBody('not valid json'),
      });
      await expect(provider.interpret({ userInput: 'list files' })).rejects.toMatchObject({
        name: 'ValidationError',
      });
    });
  });

  // ---- testConnection() ----

  describe('testConnection()', () => {
    it('returns true when ping succeeds and interpret succeeds', async () => {
      httpClient.get.mockResolvedValueOnce({ statusCode: 200, body: TAGS_WITH_MODEL_BODY });
      httpClient.post.mockResolvedValueOnce({ statusCode: 200, body: GENERATE_SUCCESS_BODY });
      await expect(provider.testConnection()).resolves.toBe(true);
    });

    it('returns false when ping fails (server down)', async () => {
      httpClient.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(provider.testConnection()).resolves.toBe(false);
    });

    it('returns false when model is not found', async () => {
      httpClient.get.mockResolvedValueOnce({
        statusCode: 200,
        body: ollamaTagsBody(['mistral']), // llama3 not available
      });
      await expect(provider.testConnection()).resolves.toBe(false);
    });

    it('never throws — always returns a boolean', async () => {
      // model-not-found is a non-retryable IntegrationError — no timer delays
      httpClient.get.mockResolvedValueOnce({
        statusCode: 200,
        body: ollamaTagsBody([]), // empty model list → model-not-found
      });
      await expect(provider.testConnection()).resolves.toBe(false);
    });
  });
});
