# task_plan.md — Current Blueprint

> Phases, goals, and checklists for the active Blueprint. Must be approved before coding begins.

---

## Status: PHASE 2 COMPLETE — READY FOR PHASE 3

Phase 1 (Blueprint) completed in Session 2. Phase 2 (Link) completed in Session 4.
Next: Phase 3 (Architect) — Electron main process, IPC handlers, PTY manager, renderer.

---

## Phase 1: B — Blueprint (Discovery Checklist)

- [x] North Star answered in `PROJECT.md` §1
- [x] Integrations identified and credentials confirmed in `PROJECT.md` §1
- [x] Source of Truth defined in `PROJECT.md` §1
- [x] Delivery Payload defined in `PROJECT.md` §1
- [x] Behavioral Rules documented in `PROJECT.md` §1
- [x] JSON Data Schema confirmed in `PROJECT.md` §2
- [x] GitHub repos and relevant docs researched (log in `findings.md`)
- [x] Blueprint approved by user

---

## Phase 2: L — Link (Connectivity Checklist)

- [x] Dependencies installed and pinned (`electron@41.0.2`, `@anthropic-ai/sdk@0.39.0`, `openai@4.97.0`, `node-fetch@3.3.2`, `dotenv@16.5.0`, `electron-log@5.3.4`)
- [x] TypeScript project structure created (`src/main/providers/`, `src/renderer/`, `src/preload/`)
- [x] `tsconfig.json` configured (ES2022, CommonJS, strict, outDir: dist/)
- [x] `ProviderInterface` written in `src/main/providers/interface.ts`
- [x] `ClaudeProvider` implemented (`src/main/providers/claude.ts`)
- [x] `OpenAIProvider` implemented (`src/main/providers/openai.ts`)
- [x] `OllamaProvider` implemented (`src/main/providers/ollama.ts`) — includes `listModels()`
- [x] `createProvider()` factory written (`src/main/providers/factory.ts`)
- [x] Architecture SOP written (`architecture/provider-interface.md`)
- [x] Handshake verification scripts built (`tools/handshake-claude.js`, `tools/handshake-openai.js`, `tools/handshake-ollama.js`)
- [x] Unit tests written and passing — 165 tests, 12 suites, 0 failures
- [x] `findings.md` updated with all dependencies, discoveries, and constraints
- [ ] Live API key handshake confirmed (requires user to run `tools/handshake-*.js` scripts with real keys)

---

## Phase 3: A — Architect (Build Checklist)

### 3a — Electron Main Process
- [ ] `src/main/index.ts` — app lifecycle, BrowserWindow creation, menu
- [ ] `src/preload/index.ts` — contextBridge, expose safe IPC API to renderer
- [ ] `src/main/ipc/handlers.ts` — IPC handler registration for all 8 channels

### 3b — PTY Layer (US-0001)
- [ ] Install `node-pty` and pin version
- [ ] `src/main/pty/manager.ts` — PTY spawn, resize (SIGWINCH), kill
- [ ] IPC: `terminal:input` → pty.write, `terminal:output` → pty.onData
- [ ] Shell detection: default to OS default shell, user-configurable

### 3c — AI Interpret Layer (US-0002, US-0003, US-0004)
- [ ] IPC: `ai:interpret` → `createProvider(config).interpret(request)` → return AIResponse
- [ ] IPC: `ai:execute` → PTY write (only after user approval)
- [ ] Command preview card shown before any execution
- [ ] Destructive confirmation modal wired to `requires_confirmation` flag

### 3d — Config Layer (US-0005)
- [ ] Install `keytar` and pin version
- [ ] `src/main/config/store.ts` — read/write config JSON (keys via keytar)
- [ ] IPC: `config:get`, `config:set`, `provider:test`

### 3e — Renderer (US-0006, US-0010, US-0015, US-0016)
- [ ] `src/renderer/index.html` + `src/renderer/index.ts`
- [ ] Terminal display pane (xterm.js integration)
- [ ] AI input bar
- [ ] Command preview card + risk badge
- [ ] Theme selector (startup + settings) — Dark/Light/Auto + 12 color schemes
- [ ] Multi-tab support (splitter mode + full-window mode)
- [ ] Responsive layout (800×600 minimum, SIGWINCH on resize)
- [ ] Font zoom (Cmd/Ctrl +/-/0)

### 3f — Architecture SOPs
- [ ] `architecture/ERROR_TAXONOMY.md` — error categories and handler map
- [ ] `architecture/ipc-channels.md` — all 8 IPC channels documented with payload schemas
- [ ] `architecture/pty-manager.md` — PTY lifecycle and resize protocol

---

## Phase 4: S — Stylize (Refinement Checklist)

- [ ] Output payloads formatted professionally
- [ ] UI/UX compliant with design system in `PROJECT.md` §6
- [ ] WCAG 2.1 AA accessibility audit passed
- [ ] Performance baselines verified
- [ ] User approval received

---

## Phase 5: T — Trigger (Deployment Checklist)

- [ ] `Docs/ROLLBACK.md` completed for this release
- [ ] Production version tagged in Git
- [ ] Database migrations are reversible
- [ ] Smoke test plan defined and executed
- [ ] Monitoring and alerting active
- [ ] Semantic version tag applied
- [ ] `PROJECT.md` Maintenance Log updated
