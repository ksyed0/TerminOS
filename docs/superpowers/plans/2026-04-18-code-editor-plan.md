# Code Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add CodeMirror 6 editor tab type to TerminOS for opening and editing code files with syntax highlighting.

**Architecture:** Extend tab system with new EditorTab class. Use CodeMirror 6 with language packages. Detect language from file extension. Support multiple file open triggers (dropdown, AI, Cmd+O).

**Tech Stack:** CodeMirror 6, @codemirror/lang-javascript, @codemirror/lang-python, @codemirror/lang-html, @codemirror/lang-css, @codemirror/lang-json, @codemirror/lang-markdown, @codemirror/lang-java, @codemirror/lang-csharp, @codemirror/lang-cpp

---

## Task Overview

| Task | Description | Files |
|------|-------------|-------|
| 1 | Install CodeMirror 6 packages | package.json |
| 2 | Create EditorTab class | src/renderer/editor-tab.ts |
| 3 | Add language detection utility | src/renderer/language-detect.ts |
| 4 | Enable file picker IPC | src/main/ipc/handlers.ts, src/preload/index.ts |
| 5 | Add new tab dropdown to UI | src/renderer/index.html, src/renderer/index.ts |
| 6 | Add Cmd+O shortcut | src/renderer/index.ts |
| 7 | Wire up AI "open" command | src/renderer/preview.ts |
| 8 | Add save/discard functionality | src/renderer/editor-tab.ts |
| 9 | Test and verify | Manual test |

---

## File Structure

### New Files
- `src/renderer/editor-tab.ts` — EditorTab class wrapping CodeMirror
- `src/renderer/language-detect.ts` — Language detection from file extension

### Modified Files
- `package.json` — Add CodeMirror dependencies
- `src/renderer/index.ts` — Add EditorTab to tab system, shortcuts
- `src/renderer/index.html` — New tab dropdown menu
- `src/renderer/preview.ts` — AI "open file" command handling
- `src/main/ipc/handlers.ts` — File read/write IPC handlers
- `src/preload/index.ts` — Expose file picker to renderer

---

## Tasks

### Task 1: Install CodeMirror 6 Packages

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add CodeMirror dependencies to package.json**

Add these to dependencies:
```json
"@codemirror/view": "^6.26.0",
"@codemirror/state": "^6.4.0",
"@codemirror/commands": "^6.3.3",
"@codemirror/language": "^6.10.0",
"@codemirror/autocomplete": "^6.12.0",
"@codemirror/lang-javascript": "^6.2.1",
"@codemirror/lang-python": "^6.1.4",
"@codemirror/lang-html": "^6.4.8",
"@codemirror/lang-css": "^6.2.1",
"@codemirror/lang-json": "^6.0.1",
"@codemirror/lang-markdown": "^6.2.4",
"@codemirror/lang-java": "^6.0.1",
"@codemirror/lang-csharp": "^6.0.2",
"@codemirror/lang-cpp": "^6.0.2",
"@codemirror/theme-one-dark": "^6.1.2"
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add CodeMirror 6 dependencies"
```

---

### Task 2: Create EditorTab Class

**Files:**
- Create: `src/renderer/editor-tab.ts`

- [ ] **Step 1: Create EditorTab class**

```typescript
'use strict';

import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { java } from '@codemirror/lang-java';
import { csharp } from '@codemirror/lang-csharp';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

import { getCurrentScheme, toXtermTheme } from './theme';
import type { ColorScheme } from './theme';

const languageCompartment = new Compartment();

function getLanguageExtension(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, () => ReturnType<typeof javascript>> = {
    'ts': javascript,
    'tsx': javascript,
    'js': javascript,
    'jsx': javascript,
    'py': python,
    'html': html,
    'htm': html,
    'css': css,
    'scss': css,
    'json': json,
    'md': markdown,
    'java': java,
    'cs': csharp,
    'c': cpp,
    'cpp': cpp,
    'h': cpp,
    'hpp': cpp,
  };
  const langFn = map[ext];
  return langFn ? langFn() : [];
}

export class EditorTab {
  private view: EditorView;
  private _filename: string;
  private _isDirty = false;
  private paneEl: HTMLElement;
  private tabEl: HTMLElement;
  private saveBtn: HTMLButtonElement;

  constructor(
    container: HTMLElement,
    content: string,
    filename: string,
    onDirtyChange?: (dirty: boolean) => void
  ) {
    this._filename = filename;
    this.paneEl = container;
    
    const themeCompartment = new Compartment();
    
    const state = EditorState.create(content, {
      extensions: [
        basicSetup,
        themeCompartment.of(oneDark),
        languageCompartment.of(getLanguageExtension(filename)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !this._isDirty) {
            this._isDirty = true;
            onDirtyChange?.(true);
          }
        }),
      ],
    });

    this.view = new EditorView({
      state,
      parent: container,
    });

    this.tabEl = this.createTabElement();
    this.saveBtn = this.createSaveButton();
  }

  private createTabElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'editor-tab-header';
    el.innerHTML = `
      <span class="editor-tab-icon">📄</span>
      <span class="editor-tab-name">${this._filename}</span>
      <span class="editor-tab-dirty" style="display: ${this._isDirty ? 'inline' : 'none'}">●</span>
    `;
    return el;
  }

  private createSaveButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'editor-save-btn';
    btn.textContent = 'Save';
    btn.addEventListener('click', () => this.save());
    return btn;
  }

  get filename(): string {
    return this._filename;
  }

  get isDirty(): boolean {
    return this._isDirty;
  }

  get content(): string {
    return this.view.state.doc.toString();
  }

  get element(): HTMLElement {
    return this.paneEl;
  }

  get tabElement(): HTMLElement {
    return this.tabEl;
  }

  get saveButton(): HTMLButtonElement {
    return this.saveBtn;
  }

  markClean(): void {
    this._isDirty = false;
    const dirtyEl = this.tabEl.querySelector('.editor-tab-dirty') as HTMLElement;
    if (dirtyEl) dirtyEl.style.display = 'none';
  }

  async save(): Promise<void> {
    // TODO: Wire to IPC for file save
    this.markClean();
  }

  dispose(): void {
    this.view.destroy();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/editor-tab.ts
git commit -m "feat: add EditorTab class with CodeMirror 6"
```

---

### Task 3: Language Detection Utility

**Files:**
- Create: `src/renderer/language-detect.ts`

- [ ] **Step 1: Create language detect utility**

```typescript
'use strict';

interface LanguageInfo {
  name: string;
  extension: string;
}

const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  'ts': { name: 'TypeScript', extension: 'application/typescript' },
  'tsx': { name: 'TypeScript', extension: 'application/typescript' },
  'js': { name: 'JavaScript', extension: 'javascript' },
  'jsx': { name: 'JavaScript', extension: 'javascript' },
  'py': { name: 'Python', extension: 'python' },
  'json': { name: 'JSON', extension: 'application/json' },
  'html': { name: 'HTML', extension: 'htmlmixed' },
  'htm': { name: 'HTML', extension: 'htmlmixed' },
  'css': { name: 'CSS', extension: 'css' },
  'scss': { name: 'SCSS', extension: 'css' },
  'md': { name: 'Markdown', extension: 'markdown' },
  'java': { name: 'Java', extension: 'text/x-java' },
  'cs': { name: 'C#', extension: 'text/x-csharp' },
  'c': { name: 'C', extension: 'text/x-csrc' },
  'cpp': { name: 'C++', extension: 'text/x-c++src' },
  'h': { name: 'C Header', extension: 'text/x-csrc' },
  'hpp': { name: 'C++ Header', extension: 'text/x-c++src' },
  'dart': { name: 'Dart', extension: 'dart' },
};

export function detectLanguage(filename: string): LanguageInfo | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return LANGUAGE_MAP[ext] ?? null;
}

export function getAllLanguages(): LanguageInfo[] {
  return Object.values(LANGUAGE_MAP);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/language-detect.ts
git commit -m "feat: add language detection utility"
```

---

### Task 4: File Picker IPC

**Files:**
- Modify: `src/main/ipc/handlers.ts:1-50`
- Modify: `src/preload/index.ts:1-30`

- [ ] **Step 1: Add file open handler to main process**

Add to `src/main/ipc/handlers.ts`:
```typescript
ipcMain.handle('dialog:openFile', async () => {
  const { dialog, BrowserWindow } = require('electron');
  const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
    properties: ['openFile'],
    filters: [
      { name: 'Code', extensions: ['ts', 'tsx', 'js', 'jsx', 'py', 'json', 'html', 'css', 'md', 'java', 'cs', 'c', 'cpp', 'h', 'dart'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }
  const filePath = result.filePaths[0];
  const content = require('fs').readFileSync(filePath, 'utf-8');
  return { canceled: false, filePath, content };
});
```

- [ ] **Step 2: Expose to preload**

Add to `src/preload/index.ts`:
```typescript
contextBridge.exposeInMainWorld('terminalAPI', {
  // ...existing API...
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
});
```

- [ ] **Step 3: Commit**

```bash
git add src/main/ipc/handlers.ts src/preload/index.ts
git commit -m "feat: add file picker IPC for opening files"
```

---

### Task 5: Add New Tab Dropdown to UI

**Files:**
- Modify: `src/renderer/index.html:48-50`
- Modify: `src/renderer/index.ts:98-130`

- [ ] **Step 1: Update tab bar HTML**

Replace new tab button with dropdown:
```html
<div class="new-tab-dropdown">
  <button id="new-tab-btn" class="new-tab-btn" aria-label="New tab" title="New tab">+</button>
  <div class="new-tab-menu hidden">
    <button class="menu-item" data-type="terminal">Terminal</button>
    <button class="menu-item" data-type="editor">Code Editor</button>
  </div>
</div>
```

- [ ] **Step 2: Add dropdown toggle logic in index.ts**

Add after tab creation:
```typescript
// New tab dropdown
const newTabDropdown = document.querySelector('.new-tab-dropdown');
const newTabMenu = document.querySelector('.new-tab-menu');
const menuItems = document.querySelectorAll('.menu-item');

newTabBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  newTabMenu.classList.toggle('hidden');
});

document.addEventListener('click', () => {
  newTabMenu.classList.add('hidden');
});

menuItems.forEach(item => {
  item.addEventListener('click', async (e) => {
    const type = (e.target as HTMLElement).dataset.type;
    if (type === 'editor') {
      await openEditorTab();
    } else {
      await createTab();
    }
    newTabMenu.classList.add('hidden');
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/index.html src/renderer/index.ts
git commit -m "feat: add new tab dropdown menu"
```

---

### Task 6: Add Cmd+O Shortcut

**Files:**
- Modify: `src/renderer/index.ts:690-710`

- [ ] **Step 1: Add keyboard shortcut**

Add to existing keydown handler in index.ts:
```typescript
// Cmd+O = open file
if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
  e.preventDefault();
  await openEditorTab();
}
```

Add the openEditorTab function:
```typescript
async function openEditorTab(): Promise<void> {
  const result = await window.terminalAPI.openFile() as {
    canceled: boolean;
    filePath?: string;
    content?: string;
  };
  if (result.canceled || !result.filePath || !result.content) return;
  
  const filename = result.filePath.split('/').pop() ?? 'Untitled';
  // Create editor tab with content
  const editorTab = createEditorTab(filename, result.content);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/index.ts
git commit -m "feat: add Cmd+O shortcut to open file"
```

---

### Task 7: Wire up AI "open" Command

**Files:**
- Modify: `src/renderer/preview.ts`

- [ ] **Step 1: Check if 'open' command in preview**

The existing preview.ts handles AI commands. Add open file handling:
```typescript
// In preview response handler, add:
if (response.command.startsWith('open ') || response.command === 'open') {
  const filename = response.command.replace('open ', '').trim();
  await window.terminalAPI.openFile();
  return;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/preview.ts
git commit -m "feat: handle AI 'open' command"
```

---

### Task 8: Add Save/Discard Functionality

**Files:**
- Modify: `src/renderer/editor-tab.ts`
- Modify: `src/main/ipc/handlers.ts`

- [ ] **Step 1: Add file save IPC handler**

In handlers.ts:
```typescript
ipcMain.handle('file:save', async (_event, { filePath, content }) => {
  require('fs').writeFileSync(filePath, content, 'utf-8');
  return { ok: true };
});
```

- [ ] **Step 2: Update EditorTab save method**

Update editor-tab.ts save():
```typescript
async save(filePath?: string): Promise<void> {
  const path = filePath ?? this._filePath;
  if (!path) {
    // Show save dialog
    const result = await window.terminalAPI.saveFile(this.content, this.filename);
    if (result.canceled) return;
    this._filePath = result.filePath;
  }
  await window.terminalAPI.saveFile(this.content, path);
  this.markClean();
}
```

- [ ] **Step 3: Add close confirmation for dirty editor tabs**

Add check before close in index.ts: if EditorTab.isDirty, show confirm dialog.

- [ ] **Step 4: Commit**

```bash
git add src/renderer/editor-tab.ts src/main/ipc/handlers.ts
git commit -m "feat: add save functionality to editor tabs"
```

---

### Task 9: Manual Test

- [ ] **Step 1: Build and test**

Run: `npm run build`

- [ ] **Step 2: Open app**

Run: `npm start`

- [ ] **Step 3: Test file open**

1. Click "+" → select "Code Editor" — file picker should open
2. Press Cmd+O — file picker should open
3. Open .ts file — syntax highlighting works

- [ ] **Step 4: Verify languages**

- .ts files → TypeScript highlighting
- .py files → Python highlighting
- .java files → Java highlighting

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "test: verify code editor functionality"
```

---

## Execution

**Plan complete.** Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task with review between tasks

2. **Inline Execution** - Execute tasks in this session with checkpoints

Which approach?