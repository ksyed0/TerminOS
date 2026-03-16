'use strict';
/**
 * TC-0007, TC-0010, TC-0011 — ClaudeProvider unit tests
 * All Anthropic SDK calls are mocked — no real API calls.
 */

jest.mock('@anthropic-ai/sdk', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
    _mockCreate: mockCreate,
  };
});

const Anthropic = require('@anthropic-ai/sdk');
const { ClaudeProvider } = require('../../../src/main/providers/claude.js');

const BASE_CONFIG = {
  provider: 'claude',
  api_key: 'sk-ant-test-key',
  model: 'claude-3-5-haiku-20241022',
};

const BASE_REQUEST = {
  user_input: 'list all files in the current directory',
  input_type: 'text',
  shell: '/bin/zsh',
  cwd: '/home/user',
  platform: 'darwin',
  history: [],
};

const VALID_RESPONSE = {
  command: 'ls -la',
  explanation: 'Lists all files including hidden ones with details.',
  is_destructive: false,
  requires_confirmation: false,
  risk_level: 'safe',
};

function getMockCreate() {
  return Anthropic._mockCreate;
}

beforeEach(() => {
  getMockCreate().mockReset();
});

describe('ClaudeProvider.interpret()', () => {
  test('returns parsed AIResponse on success', async () => {
    getMockCreate().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(VALID_RESPONSE) }],
    });

    const provider = new ClaudeProvider(BASE_CONFIG);
    const result = await provider.interpret(BASE_REQUEST);

    expect(result).toEqual(VALID_RESPONSE);
  });

  test('includes history in the user message when provided', async () => {
    getMockCreate().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(VALID_RESPONSE) }],
    });

    const provider = new ClaudeProvider(BASE_CONFIG);
    await provider.interpret({ ...BASE_REQUEST, history: ['echo hello', 'cd /tmp'] });

    const callArgs = getMockCreate().mock.calls[0][0];
    const userContent = callArgs.messages[0].content;
    expect(userContent).toContain('echo hello');
    expect(userContent).toContain('cd /tmp');
  });

  test('caps history at 20 most recent entries', async () => {
    getMockCreate().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(VALID_RESPONSE) }],
    });

    const history = Array.from({ length: 25 }, (_, i) => `cmd-${i}`);
    const provider = new ClaudeProvider(BASE_CONFIG);
    await provider.interpret({ ...BASE_REQUEST, history });

    const callArgs = getMockCreate().mock.calls[0][0];
    const userContent = callArgs.messages[0].content;
    expect(userContent).not.toContain('cmd-0');
    expect(userContent).toContain('cmd-24');
  });

  test('throws when API response is not valid JSON', async () => {
    getMockCreate().mockResolvedValue({
      content: [{ type: 'text', text: 'not json at all' }],
    });

    const provider = new ClaudeProvider(BASE_CONFIG);
    await expect(provider.interpret(BASE_REQUEST)).rejects.toThrow();
  });

  test('uses correct model from config', async () => {
    getMockCreate().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(VALID_RESPONSE) }],
    });

    const provider = new ClaudeProvider({ ...BASE_CONFIG, model: 'claude-opus-4-6' });
    await provider.interpret(BASE_REQUEST);

    expect(getMockCreate().mock.calls[0][0].model).toBe('claude-opus-4-6');
  });
});

describe('ClaudeProvider.testConnection()', () => {
  test('returns ok: true when API call succeeds', async () => {
    getMockCreate().mockResolvedValue({ content: [] });

    const provider = new ClaudeProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(true);
    expect(status.provider).toBe('Claude (Anthropic)');
    expect(status.model).toBe(BASE_CONFIG.model);
    expect(typeof status.latency_ms).toBe('number');
  });

  test('returns ok: false on API error — does not throw', async () => {
    getMockCreate().mockRejectedValue(new Error('Authentication failed'));

    const provider = new ClaudeProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(false);
    expect(status.error).toContain('Authentication failed');
  });

  test('returns ok: false on network error — does not throw', async () => {
    getMockCreate().mockRejectedValue(new Error('ECONNREFUSED'));

    const provider = new ClaudeProvider(BASE_CONFIG);
    const status = await provider.testConnection();

    expect(status.ok).toBe(false);
    expect(status.error).toBeDefined();
  });
});

describe('ClaudeProvider.name', () => {
  test('has correct display name', () => {
    const provider = new ClaudeProvider(BASE_CONFIG);
    expect(provider.name).toBe('Claude (Anthropic)');
  });
});
