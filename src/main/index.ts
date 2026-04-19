'use strict';
/**
 * Electron main process entry point.
 * Lifecycle: app ready → create window → register IPC → load renderer.
 */

import { app, BrowserWindow, nativeTheme } from 'electron';
import * as path from 'path';
import { ConfigStore } from './config/store';
import { registerHandlers, killAllPtys } from './ipc/handlers';

/** True when launched with --test-mode (e.g. by Playwright e2e tests). */
export const TEST_MODE = process.argv.includes('--test-mode');

let mainWindow: BrowserWindow | null = null;
let configStore: ConfigStore;

function createWindow(): void {
  const cfg = configStore.get();

  // Apply system theme mode before window creation
  if (cfg.theme_mode === 'dark') nativeTheme.themeSource = 'dark';
  else if (cfg.theme_mode === 'light') nativeTheme.themeSource = 'light';
  else nativeTheme.themeSource = 'system';

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1d1f21',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,  // Required for node-pty native module
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Register all IPC handlers
  registerHandlers(mainWindow, configStore);

  // Load renderer
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {
  configStore = new ConfigStore(undefined, TEST_MODE);
  createWindow();

  // macOS: re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  killAllPtys();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
