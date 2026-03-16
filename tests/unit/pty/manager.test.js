'use strict';
/**
 * TC-0108–TC-0120 — PtyManager unit tests
 * node-pty is fully mocked — no real shell is spawned.
 */

jest.mock('node-pty', () => {
  const mockDisposable = { dispose: jest.fn() };
  const mockPty = {
    write: jest.fn(),
    resize: jest.fn(),
    kill: jest.fn(),
    onData: jest.fn().mockReturnValue(mockDisposable),
    onExit: jest.fn().mockReturnValue(mockDisposable),
  };
  return {
    spawn: jest.fn().mockReturnValue(mockPty),
    _mockPty: mockPty,
    _mockDisposable: mockDisposable,
  };
});

const pty = require('node-pty');
const { PtyManager } = require('../../../dist/main/pty/manager.js');

function getMockPty() { return pty._mockPty; }

beforeEach(() => {
  jest.clearAllMocks();
  // Re-mock spawn to return fresh mockPty reference
  pty.spawn.mockReturnValue(pty._mockPty);
});

describe('PtyManager.getDefaultShell()', () => {
  test('returns SHELL env var on non-windows', () => {
    const original = process.env.SHELL;
    process.env.SHELL = '/usr/bin/fish';
    expect(PtyManager.getDefaultShell()).toBe('/usr/bin/fish');
    process.env.SHELL = original;
  });

  test('falls back to /bin/zsh on darwin when SHELL unset', () => {
    const originalShell = process.env.SHELL;
    const originalPlatform = process.platform;
    delete process.env.SHELL;
    Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true });
    expect(PtyManager.getDefaultShell()).toBe('/bin/zsh');
    process.env.SHELL = originalShell;
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });

  test('falls back to /bin/bash on linux when SHELL unset', () => {
    const originalShell = process.env.SHELL;
    const originalPlatform = process.platform;
    delete process.env.SHELL;
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
    expect(PtyManager.getDefaultShell()).toBe('/bin/bash');
    process.env.SHELL = originalShell;
    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true });
  });
});

describe('PtyManager.spawn()', () => {
  test('spawns PTY with correct defaults', () => {
    const mgr = new PtyManager({ shell: '/bin/bash', cols: 100, rows: 30 });
    mgr.spawn();
    expect(pty.spawn).toHaveBeenCalledWith('/bin/bash', [], expect.objectContaining({
      cols: 100,
      rows: 30,
      name: 'xterm-256color',
    }));
    expect(mgr.isRunning).toBe(true);
  });

  test('throws if spawn() called twice', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    mgr.spawn();
    expect(() => mgr.spawn()).toThrow('E_PTY_SPAWN');
  });
});

describe('PtyManager.write()', () => {
  test('writes data to PTY process', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    mgr.spawn();
    mgr.write('ls -la\r');
    expect(getMockPty().write).toHaveBeenCalledWith('ls -la\r');
  });

  test('logs warn and does not throw if PTY not running', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mgr = new PtyManager({ shell: '/bin/bash' });
    expect(() => mgr.write('test')).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('E_PTY_WRITE'));
    warnSpy.mockRestore();
  });
});

describe('PtyManager.resize()', () => {
  test('resizes PTY and updates cols/rows', () => {
    const mgr = new PtyManager({ shell: '/bin/bash', cols: 80, rows: 24 });
    mgr.spawn();
    mgr.resize(120, 40);
    expect(getMockPty().resize).toHaveBeenCalledWith(120, 40);
    expect(mgr.cols).toBe(120);
    expect(mgr.rows).toBe(40);
  });

  test('does not throw if PTY not running — resize is no-op', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    expect(() => mgr.resize(120, 40)).not.toThrow();
    expect(getMockPty().resize).not.toHaveBeenCalled();
  });

  test('logs warn if PTY resize throws', () => {
    getMockPty().resize.mockImplementationOnce(() => { throw new Error('resize failed'); });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const mgr = new PtyManager({ shell: '/bin/bash' });
    mgr.spawn();
    expect(() => mgr.resize(80, 24)).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('E_PTY_RESIZE:', 'resize failed');
    warnSpy.mockRestore();
  });
});

describe('PtyManager.onData()', () => {
  test('registers data callback and returns disposable', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    mgr.spawn();
    const cb = jest.fn();
    const disposable = mgr.onData(cb);
    expect(getMockPty().onData).toHaveBeenCalledWith(cb);
    expect(disposable).toBeDefined();
  });

  test('throws if PTY not running', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    expect(() => mgr.onData(jest.fn())).toThrow('E_PTY_SPAWN');
  });
});

describe('PtyManager.onExit()', () => {
  test('registers exit callback and returns disposable', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    mgr.spawn();
    const cb = jest.fn();
    mgr.onExit(cb);
    expect(getMockPty().onExit).toHaveBeenCalledWith(cb);
  });

  test('throws if PTY not running', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    expect(() => mgr.onExit(jest.fn())).toThrow('E_PTY_SPAWN');
  });
});

describe('PtyManager.kill()', () => {
  test('kills PTY process and sets isRunning to false', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    mgr.spawn();
    expect(mgr.isRunning).toBe(true);
    mgr.kill();
    expect(getMockPty().kill).toHaveBeenCalled();
    expect(mgr.isRunning).toBe(false);
  });

  test('kill() on non-running PTY is safe', () => {
    const mgr = new PtyManager({ shell: '/bin/bash' });
    expect(() => mgr.kill()).not.toThrow();
    expect(getMockPty().kill).not.toHaveBeenCalled();
  });
});
