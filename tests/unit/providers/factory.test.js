'use strict';
/**
 * createProvider() factory unit tests.
 * All provider constructors are mocked — no real SDK calls.
 */

jest.mock('../../../src/main/providers/claude.js', () => ({
  ClaudeProvider: jest.fn().mockImplementation((config) => ({
    name: 'Claude (Anthropic)',
    _config: config,
  })),
}));

jest.mock('../../../src/main/providers/openai.js', () => ({
  OpenAIProvider: jest.fn().mockImplementation((config) => ({
    name: 'OpenAI',
    _config: config,
  })),
}));

jest.mock('../../../src/main/providers/ollama.js', () => ({
  OllamaProvider: jest.fn().mockImplementation((config) => ({
    name: 'Ollama',
    _config: config,
  })),
}));

const { createProvider } = require('../../../src/main/providers/factory.js');
const { ClaudeProvider } = require('../../../src/main/providers/claude.js');
const { OpenAIProvider } = require('../../../src/main/providers/openai.js');
const { OllamaProvider } = require('../../../src/main/providers/ollama.js');

beforeEach(() => {
  ClaudeProvider.mockClear();
  OpenAIProvider.mockClear();
  OllamaProvider.mockClear();
});

describe('createProvider()', () => {
  test('instantiates ClaudeProvider for provider: claude', () => {
    const config = { provider: 'claude', model: 'claude-3-5-haiku-20241022', api_key: 'sk-ant-test' };
    const provider = createProvider(config);

    expect(ClaudeProvider).toHaveBeenCalledTimes(1);
    expect(ClaudeProvider).toHaveBeenCalledWith(config);
    expect(provider.name).toBe('Claude (Anthropic)');
  });

  test('instantiates OpenAIProvider for provider: openai', () => {
    const config = { provider: 'openai', model: 'gpt-4o', api_key: 'sk-openai-test' };
    const provider = createProvider(config);

    expect(OpenAIProvider).toHaveBeenCalledTimes(1);
    expect(OpenAIProvider).toHaveBeenCalledWith(config);
    expect(provider.name).toBe('OpenAI');
  });

  test('instantiates OllamaProvider for provider: ollama', () => {
    const config = { provider: 'ollama', model: 'llama3', ollama_host: 'http://localhost:11434' };
    const provider = createProvider(config);

    expect(OllamaProvider).toHaveBeenCalledTimes(1);
    expect(OllamaProvider).toHaveBeenCalledWith(config);
    expect(provider.name).toBe('Ollama');
  });

  test('throws for an unknown provider string', () => {
    const config = { provider: 'gemini' };
    expect(() => createProvider(config)).toThrow('Unknown provider: gemini');
  });

  test('throws with the unknown value in the error message', () => {
    const config = { provider: 'custom-llm' };
    expect(() => createProvider(config)).toThrow('custom-llm');
  });

  test('passes the full config object to the provider constructor', () => {
    const config = {
      provider: 'claude',
      model: 'claude-opus-4-6',
      api_key: 'sk-ant-test',
      theme: 'dark',
      font: 'Fira Code',
    };
    const provider = createProvider(config);
    expect(provider._config).toBe(config);
  });

  test('each call creates a new provider instance', () => {
    const config = { provider: 'claude', model: 'claude-3-5-haiku-20241022', api_key: 'key' };
    createProvider(config);
    createProvider(config);
    expect(ClaudeProvider).toHaveBeenCalledTimes(2);
  });
});
