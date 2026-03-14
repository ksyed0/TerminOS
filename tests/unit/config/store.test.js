'use strict';
/**
 * TC-0121–TC-0133 — ConfigStore unit tests
 * fs, electron app, and keytar are all mocked — no real disk or keychain access.
 */

// Mock electron before any require
jest.mock('electron', () => ({
  app: { getPath: jest.fn().mockReturnValue('/mock/userData') },
}));

// Mock keytar
jest.mock('keytar', () => ({
  getPassword: jest.fn(),
  setPassword: jest.fn(),
  deletePassword: jest.fn(),
}), { virtual: true });

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const fs = require('fs');
const keytar = require('keytar');
const { ConfigStore } = require('../../../dist/main/config/store.js');

const DEFAULT_CONFIG = {
  provider: 'ollama',
  model: 'llama3.2',
  ollama_host: 'http://localhost:11434',
  theme_mode: 'auto',
  color_scheme: 'Tomorrow Night',
  font_family: 'JetBrains Mono',
  font_size: 14,
  shell: '',
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: config file does not exist
  fs.readFileSync.mockImplementation(() => {
    const err = new Error('ENOENT');
    err.code = 'ENOENT';
    throw err;
  });
});

describe('ConfigStore.get()', () => {
  test('returns DEFAULT_CONFIG when config file does not exist', () => {
    const store = new ConfigStore('/tmp/nonexistent/config.json');
    expect(store.get()).toEqual(DEFAULT_CONFIG);
  });

  test('merges persisted config over defaults', () => {
    fs.readFileSync.mockReturnValue(JSON.stringify({ provider: 'openai', model: 'gpt-4o' }));
    const store = new ConfigStore('/tmp/config.json');
    const cfg = store.get();
    expect(cfg.provider).toBe('openai');
    expect(cfg.model).toBe('gpt-4o');
    expect(cfg.font_size).toBe(14);  // default preserved
  });

  test('logs error and returns defaults on corrupt JSON', () => {
    fs.readFileSync.mockReturnValue('not valid json {{');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const store = new ConfigStore('/tmp/config.json');
    expect(store.get()).toEqual(DEFAULT_CONFIG);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('E_CONFIG_READ'), expect.anything(), expect.anything());
    errorSpy.mockRestore();
  });

  test('get() returns a copy — mutations do not affect internal state', () => {
    const store = new ConfigStore('/tmp/config.json');
    const cfg = store.get();
    cfg.provider = 'openai';
    expect(store.get().provider).toBe('ollama');
  });
});

describe('ConfigStore.set()', () => {
  test('persists partial config update to disk', () => {
    const store = new ConfigStore('/tmp/config.json');
    store.set({ provider: 'claude', model: 'claude-3-5-haiku-20241022' });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/tmp/config.json',
      expect.stringContaining('"provider": "claude"'),
      'utf-8',
    );
  });

  test('throws E_CONFIG_WRITE when writeFileSync fails', () => {
    fs.writeFileSync.mockImplementationOnce(() => { throw new Error('EACCES: permission denied'); });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const store = new ConfigStore('/tmp/config.json');
    expect(() => store.set({ font_size: 16 })).toThrow('Failed to save config');
    errorSpy.mockRestore();
  });

  test('get() reflects updated value after set()', () => {
    fs.writeFileSync.mockReturnValue(undefined);
    const store = new ConfigStore('/tmp/config.json');
    store.set({ font_size: 18 });
    expect(store.get().font_size).toBe(18);
  });
});

describe('ConfigStore.getApiKey()', () => {
  test('returns key from keytar', async () => {
    keytar.getPassword.mockResolvedValue('sk-ant-test-key');
    const store = new ConfigStore('/tmp/config.json');
    const key = await store.getApiKey('claude');
    expect(keytar.getPassword).toHaveBeenCalledWith('TermnOS', 'claude');
    expect(key).toBe('sk-ant-test-key');
  });

  test('returns null when key not found in keytar', async () => {
    keytar.getPassword.mockResolvedValue(null);
    const store = new ConfigStore('/tmp/config.json');
    expect(await store.getApiKey('openai')).toBeNull();
  });

  test('logs error and returns null when keytar throws', async () => {
    keytar.getPassword.mockRejectedValue(new Error('keychain locked'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    const store = new ConfigStore('/tmp/config.json');
    expect(await store.getApiKey('claude')).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('E_KEYCHAIN_GET'), 'keychain locked');
    errorSpy.mockRestore();
  });
});

describe('ConfigStore.setApiKey()', () => {
  test('stores key in keytar', async () => {
    keytar.setPassword.mockResolvedValue(undefined);
    const store = new ConfigStore('/tmp/config.json');
    await store.setApiKey('openai', 'sk-test-123');
    expect(keytar.setPassword).toHaveBeenCalledWith('TermnOS', 'openai', 'sk-test-123');
  });

  test('throws E_KEYCHAIN_SET when keytar fails', async () => {
    keytar.setPassword.mockRejectedValue(new Error('keychain write failed'));
    const store = new ConfigStore('/tmp/config.json');
    await expect(store.setApiKey('claude', 'key')).rejects.toThrow('Failed to store API key');
  });
});

describe('ConfigStore.deleteApiKey()', () => {
  test('deletes key from keytar', async () => {
    keytar.deletePassword.mockResolvedValue(true);
    const store = new ConfigStore('/tmp/config.json');
    await store.deleteApiKey('openai');
    expect(keytar.deletePassword).toHaveBeenCalledWith('TermnOS', 'openai');
  });

  test('logs warn but does not throw when delete fails', async () => {
    keytar.deletePassword.mockRejectedValue(new Error('not found'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const store = new ConfigStore('/tmp/config.json');
    await expect(store.deleteApiKey('claude')).resolves.not.toThrow();
    warnSpy.mockRestore();
  });
});
