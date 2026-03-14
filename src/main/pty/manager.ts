'use strict';
/**
 * PtyManager — wraps node-pty to own the shell process lifecycle.
 * One instance per terminal tab. Never shares a PTY between tabs.
 */

import * as os from 'os';
import * as pty from 'node-pty';

export interface PtyOptions {
  shell?: string;
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: NodeJS.ProcessEnv;
}

export class PtyManager {
  private ptyProcess: pty.IPty | null = null;
  private _shell: string;
  private _cwd: string;
  private _cols: number;
  private _rows: number;

  constructor(options: PtyOptions = {}) {
    this._shell = options.shell ?? PtyManager.getDefaultShell();
    this._cwd = options.cwd ?? os.homedir();
    this._cols = options.cols ?? 80;
    this._rows = options.rows ?? 24;
  }

  /** Determine the default shell for the current platform. */
  static getDefaultShell(): string {
    const platform = process.platform;
    if (platform === 'win32') {
      return process.env.COMSPEC ?? 'cmd.exe';
    }
    return process.env.SHELL ?? (platform === 'darwin' ? '/bin/zsh' : '/bin/bash');
  }

  /** Spawn the shell process. Must be called before write/resize. */
  spawn(): void {
    if (this.ptyProcess) {
      throw new Error('E_PTY_SPAWN: PTY already running');
    }
    this.ptyProcess = pty.spawn(this._shell, [], {
      name: 'xterm-256color',
      cols: this._cols,
      rows: this._rows,
      cwd: this._cwd,
      env: process.env as { [key: string]: string },
    });
  }

  /** Write raw data (keystrokes / commands) to the PTY. */
  write(data: string): void {
    if (!this.ptyProcess) {
      console.warn('E_PTY_WRITE: PTY not running — data discarded');
      return;
    }
    this.ptyProcess.write(data);
  }

  /** Resize the PTY — triggers SIGWINCH in the shell process. */
  resize(cols: number, rows: number): void {
    this._cols = cols;
    this._rows = rows;
    if (!this.ptyProcess) return;
    try {
      this.ptyProcess.resize(cols, rows);
    } catch (err) {
      console.warn('E_PTY_RESIZE:', (err as Error).message);
    }
  }

  /** Register a callback for incoming PTY output. Returns a disposable. */
  onData(callback: (data: string) => void): pty.IDisposable {
    if (!this.ptyProcess) {
      throw new Error('E_PTY_SPAWN: PTY not running — call spawn() first');
    }
    return this.ptyProcess.onData(callback);
  }

  /** Register a callback for PTY exit. Returns a disposable. */
  onExit(callback: (event: { exitCode: number; signal?: number }) => void): pty.IDisposable {
    if (!this.ptyProcess) {
      throw new Error('E_PTY_SPAWN: PTY not running — call spawn() first');
    }
    return this.ptyProcess.onExit(callback);
  }

  /** Kill the shell process and clean up. */
  kill(): void {
    if (!this.ptyProcess) return;
    this.ptyProcess.kill();
    this.ptyProcess = null;
  }

  get shell(): string { return this._shell; }
  get cols(): number { return this._cols; }
  get rows(): number { return this._rows; }
  get isRunning(): boolean { return this.ptyProcess !== null; }
}
