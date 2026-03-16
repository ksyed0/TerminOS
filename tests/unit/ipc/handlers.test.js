'use strict';
/**
 * IPC handler unit tests — ai:interpret and ai:execute channels.
 * All dependencies (electron, factory, store, pty) are mocked.
 * No real API calls, no real PTY spawning.
 */

// ── Shared mock state ────────────────────────────────────────────────────────
const handlerRegistry = {};

const mockInterpret = jest.fn();
const mockProvider = { interpret: mockInterpret };

const mockCreateProvider = jest.fn(() => mockProvider);

const mockConfigGet = jest.fn(() => ({
  provider: 'claude',
  model: 'claude-3-5-haiku-20241022',
  ollama_host: null,
  shell: '/bin/zsh',
}));
const mockGetApiKey = jest.fn().mockResolvedValue('sk-test-api-key');

const mockPtyWrite = jest.fn();
const mockPtySpawn = jest.fn();
const mockPtyOnData = jest.fn();
const mockPtyOnExit = jest.fn();
const mockPtyKill = jest.fn();
const MockPtyManager = jest.fn(() => ({
  spawn: mockPtySpawn,
  write: mockPtyWrite,
  onData: mockPtyOnData,
  onExit: mockPtyOnExit,
  kill: mockPtyKill,
}));

// ── Mocks ─────────────────────────────────────────────────────────────────────
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn((channel, handler) => {
      handlerRegistry[channel] = handler;
    }),
  },
  BrowserWindow: jest.fn(),
}));

jest.mock('../../../src/main/providers/factory.js', () => ({
  createProvider: mockCreateProvider,
}));

jest.mock('../../../src/main/config/store.js', () => ({
  ConfigStore: jest.fn().mockImplementation(() => ({
    get: mockConfigGet,
    getApiKey: mockGetApiKey,
  })),
}));

jest.mock('../../../src/main/pty/manager.js', () => ({
  PtyManager: MockPtyManager,
}));

// ── Fixture data ──────────────────────────────────────────────────────────────
const BASE_REQUEST = {
  user_input: 'list files in downloads',
  input_type: 'text',
  shell: '/bin/zsh',
  cwd: '~',
  platform: 'darwin',
  history: [],
};

const VALID_AI_RESPONSE = {
  command: 'ls ~/Downloads',
  explanation: 'Lists all files in your Downloads directory.',
  is_destructive: false,
  requires_confirmation: false,
  risk_level: 'safe',
};

const MOCK_EVENT = {};

// ── Setup ─────────────────────────────────────────────────────────────────────
let mockConfigStore;
let mockMainWindow;

beforeAll(() => {
  // Create mock window
  mockMainWindow = {
    isDestroyed: jest.fn(() => false),
    webContents: { send: jest.fn() },
  };

  // Create a real ConfigStore mock instance
  mockConfigStore = {
    get: mockConfigGet,
    getApiKey: mockGetApiKey,
  };

  // Register handlers
  const { registerHandlers } = require('../../../src/main/ipc/handlers.js');
  registerHandlers(mockMainWindow, mockConfigStore);
});

beforeEach(() => {
  jest.clearAllMocks();

  // Restore defaults after clearAllMocks
  mockConfigGet.mockReturnValue({
    provider: 'claude',
    model: 'claude-3-5-haiku-20241022',
    ollama_host: null,
    shell: '/bin/zsh',
  });
  mockGetApiKey.mockResolvedValue('sk-test-api-key');
  mockInterpret.mockResolvedValue(VALID_AI_RESPONSE);
  mockCreateProvider.mockReturnValue(mockProvider);
  mockMainWindow.isDestroyed.mockReturnValue(false);
});

// ── ai:interpret tests ────────────────────────────────────────────────────────
describe('ai:interpret handler', () => {
  test('calls provider.interpret() with the incoming request and returns the AIResponse', async () => {
    const result = await handlerRegistry['ai:interpret'](MOCK_EVENT, BASE_REQUEST);

    expect(mockInterpret).toHaveBeenCalledTimes(1);
    expect(mockInterpret).toHaveBeenCalledWith(BASE_REQUEST);
    expect(result).toEqual(VALID_AI_RESPONSE);
  });

  test('passes api_key from keychain to provider factory', async () => {
    mockGetApiKey.mockResolvedValue('sk-secret-key');

    await handlerRegistry['ai:interpret'](MOCK_EVENT, BASE_REQUEST);

    expect(mockGetApiKey).toHaveBeenCalledWith('claude');
    expect(mockCreateProvider).toHaveBeenCalledWith(
      expect.objectContaining({ api_key: 'sk-secret-key' })
    );
  });

  test('returns E_AI_AUTH with retryable: false on 401 auth error', async () => {
    mockInterpret.mockRejectedValue(new Error('401 Unauthorized — invalid API key'));

    const result = await handlerRegistry['ai:interpret'](MOCK_EVENT, BASE_REQUEST);

    expect(result.error).toBe('E_AI_AUTH');
    expect(result.retryable).toBe(false);
  });

  test('returns E_AI_RATE_LIMIT with retryable: true on 429 error', async () => {
    mockInterpret.mockRejectedValue(new Error('429 Too Many Requests'));

    const result = await handlerRegistry['ai:interpret'](MOCK_EVENT, BASE_REQUEST);

    expect(result.error).toBe('E_AI_RATE_LIMIT');
    expect(result.retryable).toBe(true);
  });

  test('returns E_AI_UNAVAILABLE with retryable: true on ECONNREFUSED', async () => {
    mockInterpret.mockRejectedValue(new Error('ECONNREFUSED connect ECONNREFUSED 127.0.0.1:11434'));

    const result = await handlerRegistry['ai:interpret'](MOCK_EVENT, BASE_REQUEST);

    expect(result.error).toBe('E_AI_UNAVAILABLE');
    expect(result.retryable).toBe(true);
  });

  test('returns E_AI_INVALID_JSON with retryable: true on generic/unknown error', async () => {
    mockInterpret.mockRejectedValue(new Error('Unexpected token in JSON'));

    const result = await handlerRegistry['ai:interpret'](MOCK_EVENT, BASE_REQUEST);

    expect(result.error).toBe('E_AI_INVALID_JSON');
    expect(result.retryable).toBe(true);
  });

  test('returns E_AI_TIMEOUT with retryable: true when provider hangs past timeout', async () => {
    jest.useFakeTimers();
    mockInterpret.mockImplementation(() => new Promise(() => {})); // never resolves

    const resultPromise = handlerRegistry['ai:interpret'](MOCK_EVENT, BASE_REQUEST);
    await jest.advanceTimersByTimeAsync(31000);
    const result = await resultPromise;

    expect(result.error).toBe('E_AI_TIMEOUT');
    expect(result.retryable).toBe(true);
    jest.useRealTimers();
  });
});

// ── ai:execute tests ──────────────────────────────────────────────────────────
describe('ai:execute handler', () => {
  const EXEC_TAB_ID = 'tab-exec-1';

  beforeEach(() => {
    // Spawn a fresh PTY after clearAllMocks() has already run (outer beforeEach)
    handlerRegistry['terminal:spawn'](MOCK_EVENT, { tabId: EXEC_TAB_ID, cols: 80, rows: 24 });
  });

  afterEach(() => {
    handlerRegistry['terminal:close'](MOCK_EVENT, { tabId: EXEC_TAB_ID });
  });

  test('mockPtyOnData is called exactly once when PTY is spawned for this test', () => {
    expect(mockPtyOnData).toHaveBeenCalledTimes(1);
  });

  test('writes command + \\r to the correct PTY for the given tabId', () => {
    handlerRegistry['ai:execute'](MOCK_EVENT, { tabId: EXEC_TAB_ID, command: 'ls ~/Downloads' });
    expect(mockPtyWrite).toHaveBeenCalledWith('ls ~/Downloads\r');
  });

  test('returns E_PTY_SPAWN error when no PTY exists for the tabId', () => {
    const result = handlerRegistry['ai:execute'](MOCK_EVENT, { tabId: 'tab-nonexistent-99', command: 'ls' });
    expect(result).toEqual(expect.objectContaining({ error: 'E_PTY_SPAWN' }));
  });
});
