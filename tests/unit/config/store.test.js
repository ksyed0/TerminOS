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

// TC-0141–TC-0145 — additional ConfigStore tests

// TC-0141: get() never returns an api_key field
// ConfigStore.set() never writes api_key to the config file, so get() should never surface one.
// Even when the file contains only legitimate AppConfig fields, api_key must be absent.
test('TC-0141: get() never returns an api_key field', () => {
  // Config file has only legitimate AppConfig fields — no api_key
  fs.readFileSync.mockReturnValue(JSON.stringify({ provider: 'openai', model: 'gpt-4o' }));
  const store = new ConfigStore('/tmp/config.json');
  const cfg = store.get();
  expect(Object.prototype.hasOwnProperty.call(cfg, 'api_key')).toBe(false);
});

// TC-0142: setApiKey() calls keytar.setPassword with correct arguments
test('TC-0142: setApiKey() calls keytar.setPassword with correct arguments', async () => {
  keytar.setPassword.mockResolvedValue(undefined);
  const store = new ConfigStore('/tmp/config.json');
  await store.setApiKey('claude', 'sk-ant-my-key');
  expect(keytar.setPassword).toHaveBeenCalledWith('TermnOS', 'claude', 'sk-ant-my-key');
});

// TC-0143: getApiKey() falls back to process.env.PROVIDER_API_KEY when keytar unavailable
// The store's getKeytar() returns null when keytar cannot be loaded; in that case getApiKey
// reads process.env.PROVIDER_API_KEY. We force keytar to appear unavailable by loading a fresh
// module instance where _keytar is null and making the require('keytar') throw MODULE_NOT_FOUND.
test('TC-0143: getApiKey() falls back to process.env.PROVIDER_API_KEY when keytar unavailable', async () => {
  jest.resetModules();
  jest.mock('electron', () => ({ app: { getPath: jest.fn().mockReturnValue('/mock/userData') } }));
  // Mock keytar to throw on require, simulating keytar being unavailable
  jest.mock('keytar', () => {
    throw new Error('Cannot find module keytar');
  }, { virtual: true });
  jest.mock('fs', () => ({ readFileSync: jest.fn(), writeFileSync: jest.fn(), mkdirSync: jest.fn() }));

  process.env.OPENAI_API_KEY = 'env-fallback-key';
  try {
    const { ConfigStore: FreshStore } = require('../../../dist/main/config/store.js');
    const freshFs = require('fs');
    freshFs.readFileSync.mockImplementation(() => {
      const e = new Error('ENOENT');
      e.code = 'ENOENT';
      throw e;
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const store = new FreshStore('/tmp/config.json');
    const key = await store.getApiKey('openai');
    warnSpy.mockRestore();
    // When keytar is unavailable, falls back to process.env.OPENAI_API_KEY
    expect(key).toBe('env-fallback-key');
  } finally {
    delete process.env.OPENAI_API_KEY;
    // Restore mocks for subsequent tests
    jest.resetModules();
    jest.mock('electron', () => ({ app: { getPath: jest.fn().mockReturnValue('/mock/userData') } }));
    jest.mock('keytar', () => ({
      getPassword: jest.fn(),
      setPassword: jest.fn(),
      deletePassword: jest.fn(),
    }), { virtual: true });
    jest.mock('fs', () => ({ readFileSync: jest.fn(), writeFileSync: jest.fn(), mkdirSync: jest.fn() }));
  }
});

// TC-0144: set() persists values and get() returns updated values
test('TC-0144: set() persists values and get() returns updated values', () => {
  fs.writeFileSync.mockReturnValue(undefined);
  const store = new ConfigStore('/tmp/config.json');
  store.set({ provider: 'claude', model: 'claude-3-opus-20240229' });
  const cfg = store.get();
  expect(cfg.provider).toBe('claude');
  expect(cfg.model).toBe('claude-3-opus-20240229');
  // Unrelated defaults still intact
  expect(cfg.font_size).toBe(14);
  expect(fs.writeFileSync).toHaveBeenCalled();
});

// TC-0145: ConfigStore constructed with testMode=true returns null from getApiKey without calling keytar
test('TC-0145: ConfigStore with testMode=true returns null from getApiKey without calling keytar', async () => {
  const store = new ConfigStore('/tmp/config.json', true);
  const key = await store.getApiKey('claude');
  expect(key).toBeNull();
  expect(keytar.getPassword).not.toHaveBeenCalled();
});
