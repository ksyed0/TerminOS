'use strict';
/**
 * TermnOS Renderer — main entry point.
 * Manages tabs, xterm.js terminals, AI input, theme selector, settings, and font zoom.
 */

import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

import { EditorTab } from './editor-tab';
import {
  DARK_SCHEMES, LIGHT_SCHEMES, ALL_SCHEMES,
  applyScheme, toXtermTheme, schemesForMode, findScheme,
  type ColorScheme,
} from './theme';

import { reorderTab, getTabAtIndex, shouldConfirmClose, SPLIT_VERTICAL_CLASS } from './tabs';
import {
  showPreview as _showPreview, hidePreview, enterEditMode, exitEditMode,
  getEditedCommand, getPendingCommand, isEditMode,
  type PreviewRefs, type PreviewResponse,
} from './preview';

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
  onOutputDispose: (() => void) | null;
}

// ── State ─────────────────────────────────────────────────────────────────────
const tabs: Map<string, Tab> = new Map();
const editorTabs: Map<string, EditorTab> = new Map();
let activeTabId: string | null = null;
let splitTabId: string | null = null;  // second pane in splitter mode
let currentFontSize = 14;
let currentMode: 'dark' | 'light' | 'auto' = 'auto';
let currentScheme: ColorScheme = DARK_SCHEMES[0];
let isFirstRun = false;
const activePtys: Map<string, true> = new Map();
let configuredShell = '/bin/zsh';
const tabHistory: Map<string, string[]> = new Map();

// ── DOM refs ──────────────────────────────────────────────────────────────────
const tabBar         = document.getElementById('tab-bar')!;
const newTabBtn      = document.getElementById('new-tab-btn')!;
const newTabDropdown  = document.querySelector('.new-tab-dropdown') as HTMLElement;
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
const previewEditBtn  = document.getElementById('preview-edit-btn')!;
const previewCancelBtn = document.getElementById('preview-cancel-btn')!;
const previewEditInput = document.getElementById('preview-edit-input') as HTMLTextAreaElement;
const themeOverlay   = document.getElementById('theme-overlay')!;
const themeApplyBtn  = document.getElementById('theme-apply-btn')!;
const schemeGrid     = document.getElementById('scheme-grid')!;
const closeConfirmDialog = document.getElementById('close-confirm-dialog')!;
const closeConfirmBtn    = document.getElementById('close-confirm-btn')!;
const closeKeepBtn       = document.getElementById('close-keep-btn')!;
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

// ── Preview refs ───────────────────────────────────────────────────────────────
const previewRefs: PreviewRefs = {
  previewCard, previewCmd, previewExp, riskBadge, confirmDialog, previewEditInput,
};

// ── ID generation ──────────────────────────────────────────────────────────────
let _tabCounter = 0;
function newTabId(): string { return `tab-${++_tabCounter}`; }

// ── Tab management ─────────────────────────────────────────────────────────────
async function createTab(splitDir: 'horizontal' | 'vertical' | false = false): Promise<string> {
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

  tabEl.draggable = true;

  tabEl.addEventListener('dragstart', (e) => {
    e.dataTransfer!.setData('text/plain', id);
    e.dataTransfer!.effectAllowed = 'move';
    tabEl.classList.add('dragging');
  });

  tabEl.addEventListener('dragend', () => {
    tabEl.classList.remove('dragging');
    tabBar.querySelectorAll('.tab-item').forEach(t => t.classList.remove('drag-over'));
  });

  tabEl.addEventListener('dragover', (e) => {
    if (!e.dataTransfer?.types.includes('text/plain')) return; // ignore external drags
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    tabBar.querySelectorAll('.tab-item').forEach(t => t.classList.remove('drag-over'));
    tabEl.classList.add('drag-over');
  });

  tabEl.addEventListener('drop', (e) => {
    e.preventDefault();
    tabEl.classList.remove('drag-over');
    const draggedId = e.dataTransfer?.getData('text/plain');
    if (draggedId && draggedId !== id) {
      reorderTab(draggedId, id, tabs as unknown as Map<string, { tabEl: HTMLElement; [key: string]: unknown }>, tabBar);
    }
  });

  // Pane element
  const paneEl = document.createElement('div');
  paneEl.className = 'terminal-pane';
  paneEl.id = `pane-${id}`;
  paneEl.setAttribute('role', 'tabpanel');
  paneEl.setAttribute('aria-labelledby', `tab-${id}`);

  // xterm.js
  const terminal = new Terminal({
    fontFamily: `'JetBrains Mono', monospace`,
    fontSize: currentFontSize,
    theme: toXtermTheme(currentScheme),
    cursorBlink: true,
    allowTransparency: false,
    scrollback: 1000,
  });
  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  if (splitDir === 'horizontal' && activeTabId) {
    if (splitTabId) return id; // already split — ignore
    const splitter = document.createElement('div');
    splitter.className = 'pane-splitter';
    splitter.setAttribute('aria-hidden', 'true');
    paneContainer.appendChild(splitter);
    paneContainer.appendChild(paneEl);
    splitTabId = id;
    paneContainer.classList.remove(SPLIT_VERTICAL_CLASS);
    setupSplitterDrag(splitter, paneEl);
  } else if (splitDir === 'vertical' && activeTabId) {
    if (splitTabId) return id; // already split — ignore
    const splitter = document.createElement('div');
    splitter.className = 'pane-splitter-vertical';
    splitter.setAttribute('aria-hidden', 'true');
    paneContainer.appendChild(splitter);
    paneContainer.appendChild(paneEl);
    splitTabId = id;
    paneContainer.classList.add(SPLIT_VERTICAL_CLASS);
    setupSplitterDragVertical(splitter, paneEl);
  } else {
    paneContainer.appendChild(paneEl);
  }

  terminal.open(paneEl);
  // Test hook — expose active terminal for e2e scrollback assertion
  (window as any).__activeTerminal = terminal;

  // Forward PTY output
  const onOutputDispose = window.terminalAPI.onOutput((tabId, data) => {
    if (tabId === id) terminal.write(data);
  });

  const tab: Tab = { id, terminal, fitAddon, paneEl, tabEl, title, onOutputDispose };
  tabs.set(id, tab);

  // Forward keystrokes
  terminal.onData((data) => {
    window.terminalAPI.sendInput(id, data);
  });

  // Spawn PTY
  fitAddon.fit();
  await window.terminalAPI.spawnTerminal(id, terminal.cols, terminal.rows);
  activePtys.set(id, true);

  terminal.focus();
  activateTab(id);
  return id;
}

function createEditorTab(filename: string, content: string, filePath?: string): string {
  const id = newTabId();
  const paneEl = document.createElement('div');
  paneEl.className = 'editor-pane';
  paneEl.id = `pane-${id}`;
  paneContainer.appendChild(paneEl);

  const editor = new EditorTab(paneEl, content, filename, filePath);
  editorTabs.set(id, editor);

  const tabEl = editor.tabElement;
  tabEl.setAttribute('role', 'tab');
  tabEl.dataset.tabId = id;
  tabBar.insertBefore(tabEl, newTabBtn);

  tabEl.addEventListener('click', () => {
    activateTab(id);
  });

  activateTab(id);
  return id;
}

function activateTab(id: string): void {
  const tab = tabs.get(id);
  const editorTab = editorTabs.get(id);

  if (!tab && !editorTab) return;

  if (editorTab) {
    tabs.forEach((t) => {
      t.paneEl.style.display = 'none';
      t.tabEl.classList.remove('active');
    });
    editorTab.element.style.display = '';
    editorTab.tabElement.classList.add('active');
    activeTabId = id;
    (window as any).__activeTerminal = null;
    return;
  }

  if (tab) {
    const prevActiveId = activeTabId;
    tabs.forEach((t, tid) => {
      t.paneEl.style.display = (tid === id || (splitTabId && tid === splitTabId && id === prevActiveId)) ? '' : 'none';
      t.tabEl.setAttribute('aria-selected', tid === id ? 'true' : 'false');
      t.tabEl.classList.toggle('active', tid === id);
      if (splitTabId) {
        const otherSplitId = id === prevActiveId ? splitTabId : prevActiveId;
        if (otherSplitId) {
          const other = tabs.get(otherSplitId!);
          if (other) other.paneEl.style.display = '';
        }
      }
    });

    editorTabs.forEach((et) => {
      et.element.style.display = 'none';
      et.tabElement.classList.remove('active');
    });

    activeTabId = id;
    (window as any).__activeTerminal = tab.terminal ?? null;
    tab.terminal.focus();
  }
}

async function closeTabById(id: string): Promise<void> {
  const tab = tabs.get(id);
  const editorTab = editorTabs.get(id);

  if (editorTab) {
    editorTab.dispose();
    editorTab.element.remove();
    editorTab.tabElement.remove();
    editorTabs.delete(id);

    if (id === activeTabId) {
      const remainingTabs = [...tabs.keys()];
      const remainingEditors = [...editorTabs.keys()];
      if (remainingTabs.length > 0) activateTab(remainingTabs[remainingTabs.length - 1]);
      else if (remainingEditors.length > 0) activateTab(remainingEditors[remainingEditors.length - 1]);
      else activeTabId = null;
    }
    return;
  }

  if (!tab) return;

  if (shouldConfirmClose(id, activePtys)) {
    let confirmed = false;
    closeConfirmDialog.classList.remove('hidden');
    closeKeepBtn.focus();
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        closeKeepBtn.click();
      }
    };
    document.addEventListener('keydown', escHandler);
    await new Promise<void>((resolve) => {
      closeConfirmBtn.addEventListener('click', () => {
        confirmed = true;
        document.removeEventListener('keydown', escHandler);
        closeConfirmDialog.classList.add('hidden');
        resolve();
      }, { once: true });
      closeKeepBtn.addEventListener('click', () => {
        confirmed = false;
        document.removeEventListener('keydown', escHandler);
        closeConfirmDialog.classList.add('hidden');
        resolve();
      }, { once: true });
    });
    if (!confirmed) return;
  }

  activePtys.delete(id);
  await window.terminalAPI.closeTerminal(id);
  tab.terminal.dispose();
  tab.onOutputDispose?.();
  tab.paneEl.remove();
  tab.tabEl.remove();
  tabs.delete(id);
  tabHistory.delete(id);

  if (id === splitTabId) {
    const splitter = paneContainer.querySelector('.pane-splitter, .pane-splitter-vertical') as (HTMLElement & { _cleanup?: () => void }) | null;
    splitter?._cleanup?.();
    splitter?.remove();
    paneContainer.classList.remove(SPLIT_VERTICAL_CLASS);
    splitTabId = null;
  }

  if (id === activeTabId) {
    const remainingTabs = [...tabs.keys()];
    const remainingEditors = [...editorTabs.keys()];
    if (remainingTabs.length > 0) activateTab(remainingTabs[remainingTabs.length - 1]);
    else if (remainingEditors.length > 0) activateTab(remainingEditors[remainingEditors.length - 1]);
    else activeTabId = null;
  }
}

// ── Splitter drag ──────────────────────────────────────────────────────────────
function setupSplitterDrag(splitter: HTMLElement, rightPane: HTMLElement): void {
  const ac = new AbortController();
  const { signal } = ac;
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
  }, { signal });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    fitAllTerminals();
  }, { signal });

  // Store cleanup fn on splitter element for later removal
  (splitter as HTMLElement & { _cleanup?: () => void })._cleanup = () => ac.abort();
}

function setupSplitterDragVertical(splitter: HTMLElement, bottomPane: HTMLElement): void {
  const ac = new AbortController();
  const { signal } = ac;
  let dragging = false;
  let startY = 0;
  let startTop = 0;
  let startBottom = 0;

  splitter.addEventListener('mousedown', (e) => {
    dragging = true;
    startY = e.clientY;
    const topPane = paneContainer.firstElementChild as HTMLElement;
    startTop = topPane.getBoundingClientRect().height;
    startBottom = bottomPane.getBoundingClientRect().height;
    splitter.classList.add('dragging');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    const topPane = paneContainer.firstElementChild as HTMLElement;
    const newTop = Math.max(200, startTop + dy);
    const newBottom = Math.max(200, startBottom - dy);
    topPane.style.flex = 'none';
    topPane.style.height = `${newTop}px`;
    bottomPane.style.flex = 'none';
    bottomPane.style.height = `${newBottom}px`;
    fitAllTerminals();
  }, { signal });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    splitter.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    fitAllTerminals();
  }, { signal });

  // Store cleanup fn on splitter element for later removal
  (splitter as HTMLElement & { _cleanup?: () => void })._cleanup = () => ac.abort();
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
async function submitAIRequest(): Promise<void> {
  const input = aiInput.value.trim();
  if (!input || !activeTabId) return;

  aiInput.value = '';
  aiInput.disabled = true;
  aiSubmitBtn.disabled = true;
  aiSubmitBtn.textContent = '…';

  // Get current context from PTY (we approximate cwd as home for now)
  const request = {
    user_input: input,
    input_type: 'text' as const,
    shell: configuredShell,
    cwd: '~',
    platform: navigator.userAgent.includes('Mac') ? 'darwin'
      : navigator.userAgent.includes('Win') ? 'win32' : 'linux',
    history: tabHistory.get(activeTabId) ?? [],
  };

  let result: unknown;
  try {
    result = await window.terminalAPI.interpret(request);
  } catch (err) {
    const tab = tabs.get(activeTabId);
    tab?.terminal.writeln(`\r\n\x1b[31m[AI Error] ${(err as Error).message}\x1b[0m\r\n`);
    return;
  } finally {
    aiInput.disabled = false;
    aiSubmitBtn.disabled = false;
    aiSubmitBtn.textContent = '↵';
  }

  if (!result || typeof result !== 'object') return;
  const res = result as Record<string, unknown>;

  if ('error' in res) {
    // Show error in active terminal
    const tab = tabs.get(activeTabId);
    tab?.terminal.writeln(`\r\n\x1b[31m[AI Error] ${res.message ?? res.error}\x1b[0m\r\n`);
    return;
  }

  // Show preview card
  showPreview(res as {
    command: string; explanation: string;
    is_destructive: boolean; requires_confirmation: boolean; risk_level: string;
  });
}

function showPreview(response: PreviewResponse): void {
  _showPreview(previewRefs, response);
  previewRunBtn.focus();
}

previewRunBtn.addEventListener('click', async () => {
  let cmd = isEditMode() ? getEditedCommand(previewRefs) : getPendingCommand()?.command;
  if (!cmd || !activeTabId) return;

  // Handle "open" commands - open file in editor
  if (cmd.trim().toLowerCase() === 'open' || cmd.trim().toLowerCase().startsWith('open ')) {
    hidePreview(previewRefs);
    const result = await window.terminalAPI.openFile() as { canceled: boolean; filePath?: string; content?: string };
    if (!result.canceled && result.filePath && result.content) {
      const filename = result.filePath.split('/').pop() ?? 'Untitled';
      createEditorTab(filename, result.content, result.filePath);
    }
    return;
  }

  // Track command in per-tab history (capped at 20)
  const hist = tabHistory.get(activeTabId) ?? [];
  hist.push(cmd);
  if (hist.length > 20) hist.shift();
  tabHistory.set(activeTabId, hist);
  hidePreview(previewRefs);
  window.terminalAPI.executeCommand(activeTabId, cmd);
  const tab = tabs.get(activeTabId);
  tab?.terminal.focus();
});

previewEditBtn.addEventListener('click', () => {
  enterEditMode(previewRefs);
});

previewEditInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation(); // prevent the previewCard keydown from also firing
    exitEditMode(previewRefs);
    previewRunBtn.focus();
  }
});

previewCancelBtn.addEventListener('click', () => {
  hidePreview(previewRefs);
  aiInput.focus();
});

previewCard.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    hidePreview(previewRefs);
    aiInput.focus();
  }
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
    btn.addEventListener('mouseenter', () => {
      applyScheme(scheme);
      applyThemeToTerminals(scheme);
    });
    btn.addEventListener('mouseleave', () => {
      applyScheme(currentScheme);
      applyThemeToTerminals();
    });
    container.appendChild(btn);
  });
}

function applyThemeToTerminals(override?: ColorScheme): void {
  const xtermTheme = toXtermTheme(override ?? currentScheme);
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
  configuredShell = (config.shell as string) ?? '/bin/zsh';
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

const newTabMenu = document.getElementById('new-tab-menu');
const newTabTerminal = document.getElementById('new-tab-terminal');
const newTabEditor = document.getElementById('new-tab-editor');

newTabBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  newTabMenu?.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  newTabMenu?.classList.add('hidden');
});

newTabTerminal?.addEventListener('click', async () => {
  newTabMenu?.classList.add('hidden');
  await createTab();
});

newTabEditor?.addEventListener('click', async () => {
  newTabMenu?.classList.add('hidden');
  const result = await window.terminalAPI.openFile() as { canceled: boolean; filePath?: string; content?: string };
  if (result.canceled || !result.filePath || !result.content) return;
  const filename = result.filePath.split('/').pop() ?? 'Untitled';
  createEditorTab(filename, result.content, result.filePath);
});

// Keyboard shortcuts: Cmd/Ctrl+T = new tab, Cmd/Ctrl+Shift+D = horizontal split,
// Cmd/Ctrl+Shift+E = vertical split, Cmd/Ctrl+1-9 = activate tab by index,
// Cmd/Ctrl+O = open file
document.addEventListener('keydown', async (e) => {
  const isMeta = e.metaKey || e.ctrlKey;
  if (!isMeta) return;
  if (e.key === 't') { e.preventDefault(); createTab(); }
  if (e.shiftKey && e.key === 'd') { e.preventDefault(); createTab('horizontal'); }
  if (e.shiftKey && e.key === 'e') { e.preventDefault(); createTab('vertical'); }
  if (!e.shiftKey && e.key >= '1' && e.key <= '9') {
    e.preventDefault();
    const index = parseInt(e.key, 10) - 1;
    const tabId = getTabAtIndex(index, tabs);
    if (tabId) activateTab(tabId);
  }
  if (e.key === 'o') {
    e.preventDefault();
    const result = await window.terminalAPI.openFile() as { canceled: boolean; filePath?: string; content?: string };
    if (result.canceled || !result.filePath || !result.content) return;
    const filename = result.filePath.split('/').pop() ?? 'Untitled';
    createEditorTab(filename, result.content, result.filePath);
  }
});

// PTY exit notification
window.terminalAPI.onExit((tabId, exitCode) => {
  const tab = tabs.get(tabId);
  if (!tab) return;
  activePtys.delete(tabId);
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
