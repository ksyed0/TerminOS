'use strict';

import { EditorView } from 'codemirror';
import { basicSetup } from 'codemirror';
import { EditorState, Compartment, Extension } from '@codemirror/state';
import { keymap, ViewUpdate } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { java } from '@codemirror/lang-java';
import { csharp } from '@replit/codemirror-lang-csharp';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';

const languageCompartment = new Compartment();

function getLanguageExtension(filename: string): Extension {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const langs: Record<string, () => unknown> = {
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
  const langFn = langs[ext];
  return langFn ? langFn() as Extension : [];
}

export class EditorTab {
  private view: EditorView;
  private _filename: string;
  private _filePath: string;
  private _isDirty = false;
  private paneEl: HTMLElement;
  private tabEl: HTMLElement;
  private saveBtn: HTMLButtonElement;
  private onDirtyChange?: (dirty: boolean) => void;

  constructor(
    container: HTMLElement,
    content: string,
    filename: string,
    filePath?: string,
    onDirtyChange?: (dirty: boolean) => void
  ) {
    this._filename = filename;
    this._filePath = filePath ?? filename;
    this.paneEl = container;
    this.onDirtyChange = onDirtyChange;
    
    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        oneDark,
        languageCompartment.of(getLanguageExtension(filename)) as Extension,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged && !this._isDirty) {
            this._isDirty = true;
            this.updateDirtyIndicator();
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

  private updateDirtyIndicator(): void {
    const dirtyEl = this.tabEl.querySelector('.editor-tab-dirty') as HTMLElement;
    if (dirtyEl) {
      dirtyEl.style.display = this._isDirty ? 'inline' : 'none';
    }
  }

  get filename(): string {
    return this._filename;
  }

  get filePath(): string {
    return this._filePath;
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
    this.updateDirtyIndicator();
  }

  async save(): Promise<void> {
    if (this._filePath && this._filePath !== this._filename) {
      await window.terminalAPI.saveFile(this._filePath, this.content);
    } else {
      const result = await window.terminalAPI.saveFileAs(this.filename, this.content);
      if (!result.canceled && result.filePath) {
        this._filePath = result.filePath;
        this._filename = result.filePath.split('/').pop() ?? this._filename;
        const nameEl = this.tabEl.querySelector('.editor-tab-name');
        if (nameEl) nameEl.textContent = this._filename;
      }
    }
    this.markClean();
  }

  dispose(): void {
    this.view.destroy();
  }
}