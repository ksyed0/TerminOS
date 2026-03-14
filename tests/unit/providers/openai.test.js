'use strict';
/**
 * TC-0007, TC-0010, TC-0011 — OpenAIProvider unit tests
 * All OpenAI SDK calls are mocked — no real API calls.
 */

jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    _mockCreate: mockCreate,
  };
});

const OpenAI = require('openai');
const { OpenAIProvider } = require('../../../src/main/providers/openai.js');

const BASE_CONFIG = {
  provider: 'openai',
  api_key: 'sk-test-key',
  model: 'gpt-4o-mini',
};

const BASE_REQUEST = {
  user_input: 'show disk usage',
  input_type: 'text',
  shell: '/bin/bash',
  cwd: '/home/user',
  platform: 'linux',
  history: [],
};

const VALID_RESPONSE = {
  command: 'df -h',
  explanation: 'Shows disk usage in human-readable format.',
  is_destructive: false,
  requires_confirmation: false,
  risk_level: 'safe',
};

function getMockCreate() {
  return OpenAI._mockCreate;
}

beforeEach(() => {
  getMockCreate().mockReset();
});

describe('OpenAIProvider.interpret()', () => {
  test('returns parsed AIResponse on success', async () => {
    getMockCreate().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(VALID_RESPONSE) } }],
    });

    const provider = new OpenAIProvider(BASE_CONFIG);
    const result = await provider.interpret(BASE_REQUEST);

    expect(result).toEqual(VALID_RESPONSE);
  });

  test('requests json_object response format', async () => {
    getMockCreate().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(VALID_RESPONSE) } }],
    });

    const provider = new OpenAIProvider(BASE_CONFIG);
    await provider.interpret(BASE_REQUEST);

    const callArgs = getMockCreate().mock.calls[0][0];
    expect(callArgs.response_format).toEqual({ type: 'json_object' });
  });

  test('includes history in the user message when provided', async () => {
    getMockCreate().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(VALID_RESPONSE) } }],
    });

    const provider = new OpenAIProvider(BASE_CONFIG);
    await provider.interpret({ ...BASE_REQUEST, history: ['git status', 'git diff'] });

    const callArgs = getMockCreate().mock.calls[0][0];
    const userContent = callArgs.messages[1].content;
    expect(userContent).toContain('git status');
  });

  test('throws when API response content is not valid JSON', async () => {
    getMockCreate().mockResolvedValue({
      choices: [{ message: { content: 'not json' } }],
    });

    const provider = new OpenAIProvider(BASE_CONFIG);
    await expect(provider.interpret(BASE_REQUEST)).rejects.toThrow();
  });
});

describe('OpenAIProvider.testConnection()', () => {
  test('returns ok: true when API call succeeds', async () => {
    getMockCreate().mockResolvedValue({
      choices: [{ message: { content: 'pong' } }],
    });

    const provider = new OpenAIProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(true);
    expect(status.provider).toBe('OpenAI');
    expect(status.model).toBe('gpt-4o-mini');
  });

  test('returns ok: false on auth error — does not throw', async () => {
    getMockCreate().mockRejectedValue(new Error('Incorrect API key provided'));

    const provider = new OpenAIProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(false);
    expect(status.error).toContain('Incorrect API key');
  });
});

describe('OpenAIProvider.name', () => {
  test('has correct display name', () => {
    const provider = new OpenAIProvider(BASE_CONFIG);
    expect(provider.name).toBe('OpenAI');
  });
});
