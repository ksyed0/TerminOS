'use strict';
/**
 * ConfigStore — reads/writes AppConfig from disk.
 * API keys are NEVER written to the config file — they go through OS keychain (keytar).
 * If keytar is unavailable (e.g., Linux without libsecret), falls back to env vars.
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export interface AppConfig {
  provider: 'claude' | 'openai' | 'ollama';
  model: string;
  ollama_host: string | null;
  theme_mode: 'dark' | 'light' | 'auto';
  color_scheme: string;
  font_family: string;
  font_size: number;
  shell: string;
}

const DEFAULT_CONFIG: AppConfig = {
  provider: 'ollama',
  model: 'llama3.2',
  ollama_host: 'http://localhost:11434',
  theme_mode: 'auto',
  color_scheme: 'Tomorrow Night',
  font_family: 'JetBrains Mono',
  font_size: 14,
  shell: '',  // empty = auto-detect via PtyManager.getDefaultShell()
};

const KEYCHAIN_SERVICE = 'TermnOS';

function getConfigPath(): string {
  const userDataDir = app.getPath('userData');
  return path.join(userDataDir, 'config.json');
}

let _keytar: typeof import('keytar') | null = null;

async function getKeytar(): Promise<typeof import('keytar') | null> {
  if (_keytar !== null) return _keytar;
  try {
    _keytar = await import('keytar');
    return _keytar;
  } catch {
    console.warn('E_KEYCHAIN_GET: keytar unavailable — falling back to env vars');
    return null;
  }
}

export class ConfigStore {
  private configPath: string;
  private _config: AppConfig;
  private testMode: boolean;

  constructor(configPath?: string, testMode = false) {
    this.configPath = configPath ?? getConfigPath();
    this.testMode = testMode;
    this._config = this._read();
  }

  private _read(): AppConfig {
    try {
      const raw = fs.readFileSync(this.configPath, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('E_CONFIG_READ:', (err as Error).message, '— using defaults');
      }
      return { ...DEFAULT_CONFIG };
    }
  }

  /** Return current config without API keys. */
  get(): AppConfig {
    return { ...this._config };
  }

  /** Persist a partial config update to disk. API keys are excluded from disk writes. */
  set(partial: Partial<AppConfig>): void {
    this._config = { ...this._config, ...partial };
    try {
      fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
      fs.writeFileSync(this.configPath, JSON.stringify(this._config, null, 2), 'utf-8');
    } catch (err) {
      console.error('E_CONFIG_WRITE:', (err as Error).message);
      throw Object.assign(new Error('Failed to save config'), { code: 'E_CONFIG_WRITE' });
    }
  }

  /** Read API key for a provider from OS keychain. */
  async getApiKey(provider: string): Promise<string | null> {
    if (this.testMode) return null;
    const kt = await getKeytar();
    if (!kt) {
      return process.env[`${provider.toUpperCase()}_API_KEY`] ?? null;
    }
    try {
      return await kt.getPassword(KEYCHAIN_SERVICE, provider);
    } catch (err) {
      console.error('E_KEYCHAIN_GET:', (err as Error).message);
      return null;
    }
  }

  /** Store API key for a provider in OS keychain. */
  async setApiKey(provider: string, key: string): Promise<void> {
    if (this.testMode) return;
    const kt = await getKeytar();
    if (!kt) {
      console.warn('E_KEYCHAIN_SET: keytar unavailable — key not persisted');
      return;
    }
    try {
      await kt.setPassword(KEYCHAIN_SERVICE, provider, key);
    } catch (err) {
      console.error('E_KEYCHAIN_SET:', (err as Error).message);
      throw Object.assign(new Error('Failed to store API key'), { code: 'E_KEYCHAIN_SET' });
    }
  }

  /** Remove API key for a provider from OS keychain. */
  async deleteApiKey(provider: string): Promise<void> {
    if (this.testMode) return;
    const kt = await getKeytar();
    if (!kt) return;
    try {
      await kt.deletePassword(KEYCHAIN_SERVICE, provider);
    } catch (err) {
      console.warn('E_KEYCHAIN_GET: deleteApiKey failed:', (err as Error).message);
    }
  }
}
