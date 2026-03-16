'use strict';
/**
 * IPC Handlers — registers all Electron IPC channels between main and renderer.
 * See architecture/ipc-channels.md for full payload schemas.
 */

import { ipcMain, BrowserWindow } from 'electron';
import { PtyManager } from '../pty/manager';
import { ConfigStore } from '../config/store';
import { createProvider } from '../providers/factory';
import type { AIRequest } from '../providers/interface';

const INTERPRET_TIMEOUT_MS = 30_000;

/** Map of tabId → PtyManager. Supports multi-tab. */
const ptyMap = new Map<string, PtyManager>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('E_AI_TIMEOUT')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}
let configStore: ConfigStore;
let mainWindow: BrowserWindow;

/** Called once from main/index.ts after window creation. */
export function registerHandlers(win: BrowserWindow, store: ConfigStore): void {
  mainWindow = win;
  configStore = store;

  // ── terminal:input ──────────────────────────────────────────────────────────
  ipcMain.handle('terminal:input', (_event, payload: { tabId: string; data: string }) => {
    const mgr = ptyMap.get(payload.tabId);
    if (!mgr) return;
    mgr.write(payload.data);
  });

  // ── terminal:resize ──────────────────────────────────────────────────────────
  ipcMain.handle('terminal:resize', (_event, payload: { tabId: string; cols: number; rows: number }) => {
    const mgr = ptyMap.get(payload.tabId);
    if (!mgr) return;
    mgr.resize(payload.cols, payload.rows);
  });

  // ── terminal:spawn (new tab) ─────────────────────────────────────────────────
  ipcMain.handle('terminal:spawn', (_event, payload: { tabId: string; cols?: number; rows?: number }) => {
    if (ptyMap.has(payload.tabId)) return;  // already running

    const cfg = configStore.get();
    const mgr = new PtyManager({
      shell: cfg.shell || undefined,
      cols: payload.cols,
      rows: payload.rows,
    });

    try {
      mgr.spawn();
    } catch (err) {
      return { error: 'E_PTY_SPAWN', message: (err as Error).message, retryable: false };
    }

    mgr.onData((data) => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:output', { tabId: payload.tabId, data });
      }
    });

    mgr.onExit(({ exitCode, signal }) => {
      ptyMap.delete(payload.tabId);
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send('terminal:exit', { tabId: payload.tabId, exitCode, signal });
      }
    });

    ptyMap.set(payload.tabId, mgr);
  });

  // ── terminal:close (tab closed) ──────────────────────────────────────────────
  ipcMain.handle('terminal:close', (_event, payload: { tabId: string }) => {
    const mgr = ptyMap.get(payload.tabId);
    if (mgr) {
      mgr.kill();
      ptyMap.delete(payload.tabId);
    }
  });

  // ── ai:interpret ─────────────────────────────────────────────────────────────
  ipcMain.handle('ai:interpret', async (_event, request: AIRequest) => {
    const cfg = configStore.get();
    const apiKey = await configStore.getApiKey(cfg.provider);

    const providerConfig = {
      provider: cfg.provider,
      model: cfg.model,
      ollama_host: cfg.ollama_host ?? undefined,
      api_key: apiKey ?? undefined,
    };

    try {
      const provider = createProvider(providerConfig);
      return await withTimeout(provider.interpret(request), INTERPRET_TIMEOUT_MS);
    } catch (err) {
      const msg = (err as Error).message;
      const code = msg.includes('E_AI_TIMEOUT') ? 'E_AI_TIMEOUT'
        : msg.includes('401') || msg.includes('auth') || msg.includes('API key') ? 'E_AI_AUTH'
        : msg.includes('429') ? 'E_AI_RATE_LIMIT'
        : msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND') ? 'E_AI_UNAVAILABLE'
        : 'E_AI_INVALID_JSON';
      return { error: code, message: msg, retryable: code !== 'E_AI_AUTH' };
    }
  });

  // ── ai:execute ───────────────────────────────────────────────────────────────
  ipcMain.handle('ai:execute', (_event, payload: { tabId: string; command: string }) => {
    const mgr = ptyMap.get(payload.tabId);
    if (!mgr) return { error: 'E_PTY_SPAWN', message: 'No PTY for tab', retryable: false };
    // Write exactly the confirmed command followed by newline
    mgr.write(payload.command + '\r');
  });

  // ── config:get ───────────────────────────────────────────────────────────────
  ipcMain.handle('config:get', () => {
    return configStore.get();  // api_key is intentionally excluded from AppConfig
  });

  // ── config:set ───────────────────────────────────────────────────────────────
  ipcMain.handle('config:set', async (_event, partial: Record<string, unknown>) => {
    const { api_key, ...safePartial } = partial;
    try {
      configStore.set(safePartial as Parameters<ConfigStore['set']>[0]);
      if (typeof api_key === 'string' && api_key.length > 0) {
        const cfg = configStore.get();
        await configStore.setApiKey(cfg.provider, api_key);
      }
    } catch (err) {
      return { error: 'E_CONFIG_WRITE', message: (err as Error).message, retryable: true };
    }
  });

  // ── provider:test ────────────────────────────────────────────────────────────
  ipcMain.handle('provider:test', async () => {
    const cfg = configStore.get();
    const apiKey = await configStore.getApiKey(cfg.provider);
    const providerConfig = {
      provider: cfg.provider,
      model: cfg.model,
      ollama_host: cfg.ollama_host ?? undefined,
      api_key: apiKey ?? undefined,
    };
    const provider = createProvider(providerConfig);
    return provider.testConnection();  // never throws — returns ConnectionStatus
  });

  // ── theme:change ─────────────────────────────────────────────────────────────
  ipcMain.handle('theme:change', (_event, payload: { mode: 'dark' | 'light' | 'auto'; scheme: string }) => {
    configStore.set({ theme_mode: payload.mode, color_scheme: payload.scheme });
  });
}

/** Kill all active PTYs — called before app.quit(). */
export function killAllPtys(): void {
  for (const [, mgr] of ptyMap) {
    mgr.kill();
  }
  ptyMap.clear();
}
