'use strict';
/**
 * TermnOS Renderer — main entry point.
 * Manages tabs, xterm.js terminals, AI input, theme selector, settings, and font zoom.
 */

import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import {
  DARK_SCHEMES, LIGHT_SCHEMES, ALL_SCHEMES,
  applyScheme, toXtermTheme, schemesForMode, findScheme,
  type ColorScheme,
} from './theme';

// ── Globals injected by preload ───────────────────────────────────────────────
declare const window: Window & {
  terminalAPI: import('../preload/index').TerminalAPI;
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tab {
  id: string;
  terminal: Terminal;
  fitAddon: FitAddon;
  paneEl: HTMLElement;
  tabEl: HTMLElement;
  title: string;
}

// ── State ─────────────────────────────────────────────────────────────────────
const tabs: Map<string, Tab> = new Map();
let activeTabId: string | null = null;
let splitTabId: string | null = null;  // second pane in splitter mode
let currentFontSize = 14;
let currentMode: 'dark' | 'light' | 'auto' = 'auto';
let currentScheme: ColorScheme = DARK_SCHEMES[0];
let isFirstRun = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const tabBar         = document.getElementById('tab-bar')!;
const newTabBtn      = document.getElementById('new-tab-btn')!;
const paneContainer  = document.getElementById('pane-container')!;
const aiInput        = document.getElementById('ai-input') as HTMLInputElement;
const aiSubmitBtn    = document.getElementById('ai-submit-btn') as HTMLButtonElement;
const settingsBtn    = document.getElementById('settings-btn')!;
const previewCard    = document.getElementById('preview-card')!;
const previewCmd     = document.getElementById('preview-command')!;
const previewExp     = document.getElementById('preview-explanation')!;
const riskBadge      = document.getElementById('risk-badge')!;
const confirmDialog  = document.getElementById('confirm-dialog')!;
const previewRunBtn  = document.getElementById('preview-run-btn')!;
const previewCancelBtn = document.getElementById('preview-cancel-btn')!;
const themeOverlay   = document.getElementById('theme-overlay')!;
const themeApplyBtn  = document.getElementById('theme-apply-btn')!;
const schemeGrid     = document.getElementById('scheme-grid')!;
const settingsPanel  = document.getElementById('settings-panel')!;
const settingsCloseBtn = document.getElementById('settings-close-btn')!;
const settingsSaveBtn  = document.getElementById('settings-save-btn')!;
const settingsSchemeGrid = document.getElementById('settings-scheme-grid')!;
const providerSelect  = document.getElementById('provider-select') as HTMLSelectElement;
const apiKeyInput     = document.getElementById('api-key-input') as HTMLInputElement;
const modelInput      = document.getElementById('model-input') as HTMLInputElement;
const ollamaHostInput = document.getElementById('ollama-host-input') as HTMLInputElement;
const testConnectionBtn = document.getElementById('test-connection-btn')!;
const connectionStatus  = document.getElementById('connection-status')!;
const shellInput      = document.getElementById('shell-input') as HTMLInputElement;
const fontFamilyInput = document.getElementById('font-family-input') as HTMLInputElement;
const fontSizeInput   = document.getElementById('font-size-input') as HTMLInputElement;

// ── ID generation ──────────────────────────────────────────────────────────────
let _tabCounter = 0;
function newTabId(): string { return `tab-${++_tabCounter}`; }

// ── Tab management ─────────────────────────────────────────────────────────────
async function createTab(makeSplit = false): Promise<string> {
  const id = newTabId();
  const title = `Terminal ${_tabCounter}`;

  // Tab button
  const tabEl = document.createElement('button');
  tabEl.className = 'tab-item';
  tabEl.setAttribute('role', 'tab');
  tabEl.setAttribute('aria-selected', 'false');
  tabEl.setAttribute('aria-controls', `pane-${id}`);
  tabEl.dataset.tabId = id;
  tabEl.innerHTML = `<span class="tab-title">${title}</span><span class="tab-close" aria-label="Close tab">✕</span>`;
  tabBar.insertBefore(tabEl, newTabBtn);

  tabEl.addEventListener('click', (e) => {
    const closeBtn = (e.target as HTMLElement).closest('.tab-close');
    if (closeBtn) { closeTabById(id); return; }
    activateTab(id);
  });

  // Pane element
  const paneEl = document.createElement('div');
  paneEl.className = 'terminal-pane';
  paneEl.id = `pane-${id}`;
  paneEl.setAttribute('role', 'tabpanel');
  paneEl.setAttribute('aria-labelledby', `tab-${id}`);

  // xterm.js
  const terminal = new Terminal({
    fontFamily: currentScheme.bg === '#ffffff' || currentScheme.bg === '#fdf6e3'
      ? `'JetBrains Mono', monospace` : `'JetBrains Mono', monospace`,
    fontSize: currentFontSize,
    theme: toXtermTheme(currentScheme),
    cursorBlink: true,
    allowTransparency: false,
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  if (makeSplit && activeTabId) {
    // Splitter mode: add a split handle then the new pane
    const splitter = document.createElement('div');
    splitter.className = 'pane-splitter';
    splitter.setAttribute('aria-hidden', 'true');
    paneContainer.appendChild(splitter);
    paneContainer.appendChild(paneEl);
    splitTabId = id;
    setupSplitterDrag(splitter, paneEl);
  } else {
    paneContainer.appendChild(paneEl);
  }

  terminal.open(paneEl);

  const tab: Tab = { id, terminal, fitAddon, paneEl, tabEl, title };
  tabs.set(id, tab);

  // Forward PTY output
  window.terminalAPI.onOutput((tabId, data) => {
    if (tabId === id) terminal.write(data);
  });

  // Forward keystrokes
  terminal.onData((data) => {
    window.terminalAPI.sendInput(id, data);
  });

  // Spawn PTY
  fitAddon.fit();
  await window.terminalAPI.spawnTerminal(id, terminal.cols, terminal.rows);

  terminal.focus();
  activateTab(id);
  return id;
}

function activateTab(id: string): void {
  const tab = tabs.get(id);
  if (!tab) return;

  tabs.forEach((t, tid) => {
    const isSplit = splitTabId === tid && tid !== id;
    t.paneEl.style.display = (tid === id || (splitTabId && tid === splitTabId && id === activeTabId)) ? '' : 'none';
    t.tabEl.setAttribute('aria-selected', tid === id ? 'true' : 'false');
    t.tabEl.classList.toggle('active', tid === id);
    // In split mode keep both visible
    if (splitTabId) {
      const otherSplitId = id === activeTabId ? splitTabId : activeTabId;
      if (otherSplitId) {
        const other = tabs.get(otherSplitId!);
        if (other) other.paneEl.style.display = '';
      }
    }
  });

  activeTabId = id;
  tab.terminal.focus();
}

async function closeTabById(id: string): Promise<void> {
  const tab = tabs.get(id);
  if (!tab) return;

  await window.terminalAPI.closeTerminal(id);
  tab.terminal.dispose();
  tab.paneEl.remove();
  tab.tabEl.remove();
  tabs.delete(id);

  if (id === splitTabId) {
    // Remove splitter
    const splitter = paneContainer.querySelector('.pane-splitter');
    splitter?.remove();
    splitTabId = null;
  }

  if (id === activeTabId) {
    const remaining = [...tabs.keys()];
    if (remaining.length > 0) activateTab(remaining[remaining.length - 1]);
    else activeTabId = null;
  }
}

// ── Splitter drag ──────────────────────────────────────────────────────────────
function setupSplitterDrag(splitter: HTMLElement, rightPane: HTMLElement): void {
  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  let startRight = 0;

  splitter.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX;
    const leftPane = paneContainer.firstElementChild as HTMLElement;
    startLeft = leftPane.getBoundingClientRect().width;
    startRight = rightPane.getBoundingClientRect().width;
    splitter.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const leftPane = paneContainer.firstElementChild as HTMLElement;
    const newLeft = Math.max(200, startLeft + dx);
    const newRight = Math.max(200, startRight - dx);
    leftPane.style.flex = 'none';
    leftPane.style.width = `${newLeft}px`;
    rightPane.style.flex = 'none';
    rightPane.style.width = `${newRight}px`;
    fitAllTerminals();
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    fitAllTerminals();
  });
}

// ── Fit and resize ─────────────────────────────────────────────────────────────
function fitAllTerminals(): void {
  tabs.forEach((tab) => {
    if (tab.paneEl.style.display !== 'none') {
      tab.fitAddon.fit();
      window.terminalAPI.resizeTerminal(tab.id, tab.terminal.cols, tab.terminal.rows);
    }
  });
}

// ── Font zoom ──────────────────────────────────────────────────────────────────
function setFontSize(size: number): void {
  currentFontSize = Math.min(24, Math.max(10, size));
  document.documentElement.style.setProperty('--font-size', `${currentFontSize}px`);
  tabs.forEach((tab) => {
    tab.terminal.options.fontSize = currentFontSize;
    tab.fitAddon.fit();
    window.terminalAPI.resizeTerminal(tab.id, tab.terminal.cols, tab.terminal.rows);
  });
}

document.addEventListener('keydown', (e) => {
  const isMeta = e.metaKey || e.ctrlKey;
  if (!isMeta) return;
  if (e.key === '=' || e.key === '+') { e.preventDefault(); setFontSize(currentFontSize + 1); }
  else if (e.key === '-') { e.preventDefault(); setFontSize(currentFontSize - 1); }
  else if (e.key === '0') { e.preventDefault(); setFontSize(14); }
});

// ── Window resize ──────────────────────────────────────────────────────────────
const resizeObserver = new ResizeObserver(() => fitAllTerminals());
resizeObserver.observe(paneContainer);

// ── AI Input ───────────────────────────────────────────────────────────────────
let pendingCommand: { command: string; risk: string } | null = null;

async function submitAIRequest(): Promise<void> {
  const input = aiInput.value.trim();
  if (!input || !activeTabId) return;

  aiInput.value = '';
  aiInput.disabled = true;
  aiSubmitBtn.disabled = true;

  // Get current context from PTY (we approximate cwd as home for now)
  const request = {
    user_input: input,
    input_type: 'text' as const,
    shell: '/bin/zsh',
    cwd: '~',
    platform: navigator.userAgent.includes('Mac') ? 'darwin'
      : navigator.userAgent.includes('Win') ? 'win32' : 'linux',
    history: [],
  };

  const result = await window.terminalAPI.interpret(request);

  aiInput.disabled = false;
  aiSubmitBtn.disabled = false;

  if (!result || typeof result !== 'object') return;
  const res = result as Record<string, unknown>;

  if ('error' in res) {
    // Show error in active terminal
    const tab = tabs.get(activeTabId);
    tab?.terminal.writeln(`\r\n\x1b[31m[AI Error] ${res.message}\x1b[0m\r\n`);
    return;
  }

  // Show preview card
  showPreview(res as { command: string; explanation: string; is_destructive: boolean; requires_confirmation: boolean; risk_level: string });
}

function showPreview(response: {
  command: string; explanation: string;
  is_destructive: boolean; requires_confirmation: boolean; risk_level: string;
}): void {
  previewCmd.textContent = response.command;
  previewExp.textContent = response.explanation;

  riskBadge.textContent = response.risk_level;
  riskBadge.className = `risk-badge ${response.risk_level}`;

  confirmDialog.classList.toggle('hidden', !response.requires_confirmation);
  pendingCommand = { command: response.command, risk: response.risk_level };

  previewCard.classList.remove('hidden');
  previewRunBtn.focus();
}

previewRunBtn.addEventListener('click', () => {
  if (!pendingCommand || !activeTabId) return;
  window.terminalAPI.executeCommand(activeTabId, pendingCommand.command);
  previewCard.classList.add('hidden');
  pendingCommand = null;
  const tab = tabs.get(activeTabId);
  tab?.terminal.focus();
});

previewCancelBtn.addEventListener('click', () => {
  previewCard.classList.add('hidden');
  pendingCommand = null;
  aiInput.focus();
});

aiSubmitBtn.addEventListener('click', submitAIRequest);
aiInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitAIRequest();
});

// ── Theme selector ──────────────────────────────────────────────────────────────
function buildSchemeGrid(container: HTMLElement, schemes: ColorScheme[], selectedName: string): void {
  container.innerHTML = '';
  schemes.forEach((scheme) => {
    const btn = document.createElement('button');
    btn.className = 'scheme-btn';
    btn.setAttribute('role', 'option');
    btn.dataset.scheme = scheme.name;
    btn.style.background = scheme.bg;
    btn.style.color = scheme.fg;
    btn.style.borderColor = scheme.name === selectedName ? 'var(--accent)' : 'transparent';
    btn.textContent = scheme.name;
    btn.setAttribute('aria-selected', scheme.name === selectedName ? 'true' : 'false');
    btn.addEventListener('click', () => {
      container.querySelectorAll('.scheme-btn').forEach(b => {
        (b as HTMLElement).style.borderColor = 'transparent';
        b.setAttribute('aria-selected', 'false');
      });
      btn.style.borderColor = 'var(--accent)';
      btn.setAttribute('aria-selected', 'true');
      currentScheme = scheme;
      applyScheme(scheme);
      applyThemeToTerminals();
    });
    container.appendChild(btn);
  });
}

function applyThemeToTerminals(): void {
  const xtermTheme = toXtermTheme(currentScheme);
  tabs.forEach((tab) => { tab.terminal.options.theme = xtermTheme; });
}

function setupModeButtons(container: HTMLElement, mode: 'dark' | 'light' | 'auto'): void {
  container.querySelectorAll<HTMLButtonElement>('.mode-btn').forEach(btn => {
    const btnMode = btn.dataset.mode as 'dark' | 'light' | 'auto';
    btn.classList.toggle('active', btnMode === mode);
    btn.setAttribute('aria-pressed', String(btnMode === mode));
    btn.addEventListener('click', () => {
      currentMode = btnMode;
      container.querySelectorAll<HTMLButtonElement>('.mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === btnMode);
        b.setAttribute('aria-pressed', String(b.dataset.mode === btnMode));
      });
      const schemes = schemesForMode(currentMode);
      buildSchemeGrid(schemeGrid, schemes, currentScheme.name);
      buildSchemeGrid(settingsSchemeGrid, schemes, currentScheme.name);
    });
  });
}

// ── Settings panel ──────────────────────────────────────────────────────────────

/** Show/hide provider-specific fields based on selected provider. */
function applyProviderVisibility(provider: string): void {
  const isOllama = provider === 'ollama';
  // Ollama host row
  ollamaHostInput.setAttribute('aria-hidden', String(!isOllama));
  ollamaHostInput.disabled = !isOllama;
  (ollamaHostInput as HTMLElement).style.display = isOllama ? '' : 'none';
  // API key row
  apiKeyInput.setAttribute('aria-hidden', String(isOllama));
  apiKeyInput.disabled = isOllama;
  (apiKeyInput as HTMLElement).style.display = isOllama ? 'none' : '';
}

providerSelect.addEventListener('change', () => {
  applyProviderVisibility(providerSelect.value);
});

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

settingsCloseBtn.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});

testConnectionBtn.addEventListener('click', async () => {
  connectionStatus.textContent = 'Testing…';
  connectionStatus.className = 'connection-status';
  // Save current form values before testing so testConnection uses up-to-date config
  const partial: Record<string, unknown> = {
    provider: providerSelect.value,
    model: modelInput.value || undefined,
    ollama_host: ollamaHostInput.value || null,
  };
  if (apiKeyInput.value) partial.api_key = apiKeyInput.value;
  await window.terminalAPI.setConfig(partial);
  const result = await window.terminalAPI.testConnection() as Record<string, unknown>;
  if (result.ok) {
    connectionStatus.textContent = `✓ Connected — ${result.provider} / ${result.model} (${result.latency_ms}ms)`;
    connectionStatus.className = 'connection-status ok';
  } else {
    connectionStatus.textContent = `✗ ${result.error}`;
    connectionStatus.className = 'connection-status fail';
  }
});

settingsSaveBtn.addEventListener('click', async () => {
  const partial: Record<string, unknown> = {
    provider: providerSelect.value,
    model: modelInput.value || undefined,
    ollama_host: ollamaHostInput.value || null,
    shell: shellInput.value || '',
    font_family: fontFamilyInput.value || 'JetBrains Mono',
    font_size: parseInt(fontSizeInput.value, 10) || currentFontSize,
    theme_mode: currentMode,
    color_scheme: currentScheme.name,
  };
  if (apiKeyInput.value) partial.api_key = apiKeyInput.value;
  await window.terminalAPI.setConfig(partial);
  settingsPanel.classList.add('hidden');
  if (partial.font_size) setFontSize(partial.font_size as number);
});

// ── Startup theme overlay ───────────────────────────────────────────────────────
async function init(): Promise<void> {
  const config = await window.terminalAPI.getConfig() as Record<string, unknown>;

  currentMode = (config.theme_mode as 'dark' | 'light' | 'auto') ?? 'auto';
  const schemeName = (config.color_scheme as string) ?? 'Tomorrow Night';
  const schemes = schemesForMode(currentMode);
  currentScheme = findScheme(schemeName, ALL_SCHEMES);
  applyScheme(currentScheme);

  currentFontSize = (config.font_size as number) ?? 14;
  document.documentElement.style.setProperty('--font-size', `${currentFontSize}px`);
  if (config.font_family) {
    document.documentElement.style.setProperty('--font-family', `'${config.font_family}', monospace`);
  }

  // Populate settings panel
  providerSelect.value = (config.provider as string) ?? 'ollama';
  modelInput.value = (config.model as string) ?? '';
  ollamaHostInput.value = (config.ollama_host as string) ?? '';
  shellInput.value = (config.shell as string) ?? '';
  applyProviderVisibility(providerSelect.value);
  fontFamilyInput.value = (config.font_family as string) ?? 'JetBrains Mono';
  fontSizeInput.value = String(currentFontSize);

  setupModeButtons(themeOverlay, currentMode);
  setupModeButtons(settingsPanel, currentMode);
  buildSchemeGrid(schemeGrid, schemes, currentScheme.name);
  buildSchemeGrid(settingsSchemeGrid, schemes, currentScheme.name);

  // Show theme overlay on first run (no color_scheme in config)
  isFirstRun = !config.color_scheme;
  if (isFirstRun) {
    themeOverlay.classList.remove('hidden');
    themeApplyBtn.focus();
  } else {
    await createTab();
  }
}

themeApplyBtn.addEventListener('click', async () => {
  themeOverlay.classList.add('hidden');
  await window.terminalAPI.changeTheme(currentMode, currentScheme.name);
  await createTab();
});

newTabBtn.addEventListener('click', () => createTab());

// Keyboard shortcut: Cmd/Ctrl+T = new tab, Cmd/Ctrl+Shift+D = split
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 't') { e.preventDefault(); createTab(); }
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'd') { e.preventDefault(); createTab(true); }
});

// PTY exit notification
window.terminalAPI.onExit((tabId, exitCode) => {
  const tab = tabs.get(tabId);
  if (!tab) return;
  tab.terminal.writeln(`\r\n\x1b[90m[Process exited with code ${exitCode}]\x1b[0m`);
});

// System theme change (for auto mode)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (currentMode === 'auto') {
    const schemes = schemesForMode('auto');
    currentScheme = findScheme(currentScheme.name, schemes);
    applyScheme(currentScheme);
    applyThemeToTerminals();
  }
});

init();
