# Code Editor Tab Design — TerminOS

**Date:** 2026-04-18  
**Epic:** EPIC-0001 — Code Editing  
**Status:** Approved

## Overview

Add a new code editor tab type using CodeMirror 6, alongside existing terminal tabs. Users can open files in a dedicated editor tab with syntax highlighting for multiple languages.

## Architecture

### Tab Types

| Type | Tab Icon | Description |
|------|---------|-------------|
| Terminal | 🖥️ | xterm.js PTY session |
| Code Editor | 📄 | CodeMirror 6 instance |

### Components

1. **Tab bar dropdown** — New tab button shows menu: "Terminal" / "Code Editor"
2. **Editor tab** — Header with filename, save button (dirty state), close button
3. **Editor pane** — CodeMirror 6 instance with language mode
4. **Status bar** — Language, line:column, file encoding

### File Opening Methods

| Method | Trigger |
|--------|---------|
| Menu | Click new tab → "Code Editor" |
| AI Input | Type `open ` |
| Keyboard | Cmd+O / Ctrl+O |

### Language Detection

| Extension | CodeMirror Mode |
|----------|----------------|
| .ts, .tsx | application/typescript |
| .js, .jsx | javascript |
| .py | python |
| .json | application/json |
| .html | htmlmixed |
| .css | css |
| .md | markdown |
| .java | text/x-java |
| .cs | text/x-csharp |
| .c, .h | text/x-csrc |
| .cpp, .hpp | text/x-c++src |
| .dart | dart |
| .yaml, .yml | yaml |

## Data Flow

```
User triggers open (dropdown/AI/shortcut)
    ↓
dialog.showOpenDialog() — native file picker
    ↓
fs.readFile() → file content
    ↓
detectLanguage(filePath) → mode
    ↓
new EditorTab(content, mode)
    ↓
CodeMirror renders in new tab
```

## UI Layout

```
[Tab Bar] ───────────────────────────────────
| + ▼ | Terminal 1 | Untitled.ts 📄 |      |
|------|------------|----------------|-----|
[Editor Pane] ──────────────────────────────
| ● Untitled.ts | Save | ✕ |
|────────────────────────────────────────|
| import { foo } from './bar';          |
|                                          |
| console.log('hello');                |
|_____________________________________|
[Status Bar] ─────────────────────────
| TypeScript | Ln 3, Col 12 | UTF-8 |
```

## Acceptance Criteria

- [ ] AC-0001: File picker opens (via any trigger method)
- [ ] AC-0002: Content loads in editor
- [ ] AC-0003: TypeScript highlighted correctly
- [ ] AC-0004: JavaScript highlighted correctly
- [ ] AC-0005: Python highlighted correctly
- [ ] AC-0006: JSON highlighted correctly
- [ ] AC-0007: HTML/CSS highlighted correctly
- [ ] AC-0008: Markdown highlighted correctly (preview mode)
- [ ] AC-0010: Java highlighted correctly
- [ ] AC-0011: C# highlighted correctly
- [ ] AC-0012: C/C++ highlighted correctly
- [ ] AC-0013: Dart highlighted correctly

## Technical Notes

- Use `@codemirror/lang-*` packages for language support
- Lazy-load language packages to minimize bundle
- Use Electron's `dialog.showOpenDialog` for native file picker
- Track dirty state for save prompt before close

## Dependencies

- `@codemirror/view`
- `@codemirror/state`
- `@codemirror/lang-javascript`
- `@codemirror/lang-python`
- `@codemirror/lang-html`
- `@codemirror/lang-css`
- `@codemirror/lang-json`
- `@codemirror/lang-markdown`
- `@codemirror/lang-java`
- `@codemirror/lang-csharp`
- `@codemirror/lang-cpp`
- `y-codemirror.next` (for Flutter/Dart sync)

## Implementation Priority

1. Core editor tab with single language (JS/TS)
2. Add remaining language support
3. Add save/discard functionality
4. Add AI integration