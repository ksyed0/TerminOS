'use strict';
/**
 * Preload script — contextBridge between renderer and main process.
 * Only whitelisted IPC channels are exposed. No raw Node/Electron APIs leak to renderer.
 */

import { contextBridge, ipcRenderer } from 'electron';

export interface TerminalAPI {
  // Terminal
  spawnTerminal(tabId: string, cols?: number, rows?: number): Promise<void>;
  sendInput(tabId: string, data: string): Promise<void>;
  resizeTerminal(tabId: string, cols: number, rows: number): Promise<void>;
  closeTerminal(tabId: string): Promise<void>;
  onOutput(callback: (tabId: string, data: string) => void): () => void;
  onExit(callback: (tabId: string, exitCode: number, signal?: number) => void): () => void;

  // AI
  interpret(request: {
    user_input: string;
    input_type: 'text' | 'voice';
    shell: string;
    cwd: string;
    platform: string;
    history: string[];
  }): Promise<unknown>;
  executeCommand(tabId: string, command: string): Promise<void>;

  // Config
  getConfig(): Promise<Record<string, unknown>>;
  setConfig(partial: Record<string, unknown>): Promise<void>;
  testConnection(): Promise<unknown>;

  // Theme
  changeTheme(mode: 'dark' | 'light' | 'auto', scheme: string): Promise<void>;
}

const terminalAPI: TerminalAPI = {
  // ── Terminal ──────────────────────────────────────────────────────────────────
  spawnTerminal: (tabId, cols, rows) =>
    ipcRenderer.invoke('terminal:spawn', { tabId, cols, rows }),

  sendInput: (tabId, data) =>
    ipcRenderer.invoke('terminal:input', { tabId, data }),

  resizeTerminal: (tabId, cols, rows) =>
    ipcRenderer.invoke('terminal:resize', { tabId, cols, rows }),

  closeTerminal: (tabId) =>
    ipcRenderer.invoke('terminal:close', { tabId }),

  onOutput: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: { tabId: string; data: string }) => {
      callback(payload.tabId, payload.data);
    };
    ipcRenderer.on('terminal:output', listener);
    return () => ipcRenderer.removeListener('terminal:output', listener);
  },

  onExit: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      payload: { tabId: string; exitCode: number; signal?: number },
    ) => {
      callback(payload.tabId, payload.exitCode, payload.signal);
    };
    ipcRenderer.on('terminal:exit', listener);
    return () => ipcRenderer.removeListener('terminal:exit', listener);
  },

  // ── AI ───────────────────────────────────────────────────────────────────────
  interpret: (request) =>
    ipcRenderer.invoke('ai:interpret', request),

  executeCommand: (tabId, command) =>
    ipcRenderer.invoke('ai:execute', { tabId, command }),

  // ── Config ───────────────────────────────────────────────────────────────────
  getConfig: () =>
    ipcRenderer.invoke('config:get'),

  setConfig: (partial) =>
    ipcRenderer.invoke('config:set', partial),

  testConnection: () =>
    ipcRenderer.invoke('provider:test'),

  // ── Theme ────────────────────────────────────────────────────────────────────
  changeTheme: (mode, scheme) =>
    ipcRenderer.invoke('theme:change', { mode, scheme }),
};

contextBridge.exposeInMainWorld('terminalAPI', terminalAPI);
