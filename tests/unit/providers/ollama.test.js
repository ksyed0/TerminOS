'use strict';
/**
 * TC-0068–TC-0073 — OllamaProvider unit tests
 * All fetch() calls are mocked — no real Ollama instance required.
 */

const { OllamaProvider } = require('../../../src/main/providers/ollama.js');

const BASE_CONFIG = {
  provider: 'ollama',
  model: 'llama3.2',
  ollama_host: 'http://localhost:11434',
};

const BASE_REQUEST = {
  user_input: 'find all python files',
  input_type: 'text',
  shell: '/bin/zsh',
  cwd: '/home/user/project',
  platform: 'linux',
  history: [],
};

const VALID_RESPONSE = {
  command: 'find . -name "*.py"',
  explanation: 'Finds all Python files recursively from the current directory.',
  is_destructive: false,
  requires_confirmation: false,
  risk_level: 'safe',
};

const TAGS_RESPONSE = {
  models: [
    { name: 'llama3.2:latest' },
    { name: 'mistral:7b' },
  ],
};

function mockFetch(responses) {
  let callIndex = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    const resp = responses[callIndex++] ?? responses[responses.length - 1];
    if (resp instanceof Error) return Promise.reject(resp);
    return Promise.resolve({
      ok: resp.ok ?? true,
      status: resp.status ?? 200,
      statusText: resp.statusText ?? 'OK',
      json: () => Promise.resolve(resp.body),
    });
  });
}

afterEach(() => {
  jest.restoreAllMocks();
  if (global.fetch?.mockRestore) global.fetch.mockRestore();
});

describe('OllamaProvider.interpret()', () => {
  test('returns parsed AIResponse on success', async () => {
    mockFetch([{ body: { message: { content: JSON.stringify(VALID_RESPONSE) } } }]);

    const provider = new OllamaProvider(BASE_CONFIG);
    const result = await provider.interpret(BASE_REQUEST);

    expect(result).toEqual(VALID_RESPONSE);
  });

  test('posts to /api/chat with stream: false', async () => {
    mockFetch([{ body: { message: { content: JSON.stringify(VALID_RESPONSE) } } }]);

    const provider = new OllamaProvider(BASE_CONFIG);
    await provider.interpret(BASE_REQUEST);

    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('http://localhost:11434/api/chat');
    const body = JSON.parse(opts.body);
    expect(body.stream).toBe(false);
    expect(body.model).toBe('llama3.2');
  });

  test('throws when /api/chat returns non-ok status', async () => {
    mockFetch([{ ok: false, status: 500, statusText: 'Internal Server Error' }]);

    const provider = new OllamaProvider(BASE_CONFIG);
    await expect(provider.interpret(BASE_REQUEST)).rejects.toThrow('500');
  });

  test('uses custom ollama_host from config', async () => {
    mockFetch([{ body: { message: { content: JSON.stringify(VALID_RESPONSE) } } }]);

    const provider = new OllamaProvider({ ...BASE_CONFIG, ollama_host: 'http://192.168.1.100:11434' });
    await provider.interpret(BASE_REQUEST);

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('192.168.1.100');
  });
});

describe('OllamaProvider.testConnection()', () => {
  test('returns ok: true when host reachable and model available', async () => {
    mockFetch([{ body: TAGS_RESPONSE }]);

    const provider = new OllamaProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(true);
    expect(status.provider).toBe('Ollama (Local)');
    expect(status.model).toBe('llama3.2');
  });

  test('returns ok: false when host is unreachable — does not throw', async () => {
    mockFetch([new Error('ECONNREFUSED')]);

    const provider = new OllamaProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(false);
    expect(status.error).toContain('ECONNREFUSED');
  });

  test('returns ok: false with available model list when model not found', async () => {
    mockFetch([{ body: { models: [{ name: 'mistral:7b' }] } }]);

    const provider = new OllamaProvider(BASE_CONFIG); // requests llama3.2
    const status = await provider.testConnection();

    expect(status.ok).toBe(false);
    expect(status.error).toContain('llama3.2');
    expect(status.error).toContain('mistral:7b');
  });

  test('returns ok: false when /api/tags returns non-ok — does not throw', async () => {
    mockFetch([{ ok: false, status: 503, statusText: 'Service Unavailable' }]);

    const provider = new OllamaProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(false);
    expect(status.error).toBeDefined();
  });
});

describe('OllamaProvider.listModels()', () => {
  test('returns array of model name strings', async () => {
    mockFetch([{ body: TAGS_RESPONSE }]);

    const provider = new OllamaProvider(BASE_CONFIG);
    const models = await provider.listModels();

    expect(models).toEqual(['llama3.2:latest', 'mistral:7b']);
  });

  test('throws when /api/tags fails', async () => {
    mockFetch([{ ok: false, status: 500 }]);

    const provider = new OllamaProvider(BASE_CONFIG);
    await expect(provider.listModels()).rejects.toThrow();
  });
});

describe('OllamaProvider.name', () => {
  test('has correct display name', () => {
    const provider = new OllamaProvider(BASE_CONFIG);
    expect(provider.name).toBe('Ollama (Local)');
  });
});
