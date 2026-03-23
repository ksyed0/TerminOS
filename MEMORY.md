# MEMORY.md — Persistent Knowledge Base

> Organized by topic. Update or remove entries that are wrong or outdated. Do not write duplicates. Read this file at the start of every session.

---

## Project Identity

| Attribute | Value |
|-----------|-------|
| Name | TermnOS |
| Type | Open source cross-platform AI terminal emulator |
| Modeled after | Warp terminal |
| Platforms | macOS, Windows, Linux |
| Tech stack | Electron + TypeScript/Node.js |
| AI backend | Multi-provider: Claude API, OpenAI API, Ollama (local) |
| License | Apache 2.0 |

---

## Architecture: Electron IPC Channels

| Channel | Direction | Description |
|---------|-----------|-------------|
| `terminal:input` | renderer → main | User text or voice input |
| `terminal:output` | main → renderer | Stream PTY stdout/stderr |
| `ai:interpret` | renderer → main | Natural language → AI → command + metadata |
| `ai:execute` | renderer → main | User approves; PTY executes |
| `config:get` | renderer → main | Read user config |
| `config:set` | renderer → main | Write user config |
| `provider:test` | renderer → main | Validate API key + model |
| `theme:change` | renderer → main | Persist theme mode + scheme |

---

## Architecture: ProviderInterface

All AI providers must implement a common interface — no provider-specific logic outside `tools/providers/`. Ensures providers are swappable with zero impact on the rest of the system.

Implemented in `tools/providers/`:
- `provider-interface.js` — abstract base, `IntegrationError`, `ValidationError`, validators
- `http-client.js` — thin `https`/`http` wrapper; single mockable boundary for tests
- `claude-provider.js` — Anthropic Messages API (`claude-3-5-haiku-20241022`)
- `openai-provider.js` — OpenAI Chat Completions API (`gpt-4o-mini`, `json_object` mode)
- `ollama-provider.js` — Ollama `/api/generate` + `/api/tags` ping (`llama3`, localhost)

Methods:
- `interpret(request: AIRequest): Promise<AIResponse>` — natural language → `{ command, explanation, riskLevel }`
- `testConnection(): Promise<boolean>` — connectivity check; never throws

Error taxonomy:
- `ValidationError` — HTTP 200 but malformed/invalid response body; never retried
- `IntegrationError` — connectivity failure; retried 3 times (1s/2s/4s) on 429/529/5xx/network

Retry config: 3 retries (4 total attempts), backoff 1s/2s/4s (per MEMORY.md Retry Parameters)

---

## Architecture: Key Invariants (Quick Reference)

1. Never execute a command without displaying it first
2. Destructive commands require explicit modal confirmation
3. API keys: OS keychain only (keytar) — never plaintext on disk
4. PTY layer fully decoupled from AI layer
5. Shell is user-configurable
6. Theme "auto" reacts to OS changes at runtime

---

## Multi-Tab & Layout System

- **Two modes:** Full-window (tab bar + one active pane) and Splitter (multiple panes with draggable dividers)
- **Minimum pane width:** 200px in splitter mode
- **Minimum window size:** 800×600px — all chrome must remain accessible
- **SIGWINCH:** Must be sent to PTY on every resize (window resize, splitter drag, font zoom)
- **Font zoom:** Cmd/Ctrl + Plus/Minus/0. Range 10–24px. Persisted to config. Triggers SIGWINCH.

---

## Active Dependencies

| Package | Version | Purpose | Licence |
|---------|---------|---------|---------|
| dotenv | 16.5.0 | Load `.env` for dev-time CLI tools (`verify-providers.js`) | MIT |
| electron | 41.0.2 | Cross-platform desktop shell | MIT |
| @anthropic-ai/sdk | 0.39.0 | Claude API provider | MIT |
| openai | 4.97.0 | OpenAI API provider | MIT |
| node-pty | 1.1.0 | PTY integration for terminal shell | MIT |
| keytar | 7.9.0 | OS keychain for API key storage | MIT |
| xterm | 5.3.0 | Terminal renderer in Electron | MIT |
| xterm-addon-fit | 0.8.0 | Auto-fit terminal to container | MIT |
| electron-log | 5.3.4 | Structured logging for production | MIT |

---

## Theme System

**Modes:** Dark | Light | Auto (follows OS)

**Dark schemes (7):** Tomorrow Night, Dracula, Monokai, Solarized Dark, Nord, One Dark, Gruvbox Dark

**Light schemes (5):** Tomorrow, Solarized Light, One Light, Gruvbox Light, GitHub Light

**AI overlay colors (scheme-independent):**
- AI suggestion / active: `#7c3aed` (purple)
- Safe: `#22c55e` (green)
- Caution: `#f59e0b` (amber)
- Destructive: `#ef4444` (red)

**Contrast requirement:** All scheme text pairs must pass WCAG 2.1 AA (4.5:1). Log results in `findings.md`.

---

## Retry Parameters

| Operation | Max Retries | Backoff Strategy |
|-----------|------------|-----------------|
| HTTP requests (transient errors) | 4 | Exponential: 2s, 4s, 8s, 16s |
| Git push (network failures) | 4 | Exponential: 2s, 4s, 8s, 16s |
| AI provider calls (timeout/rate limit) | 3 | Exponential: 1s, 2s, 4s |

---

## Deprecated Endpoints

_None._

---

## Cached Data

| What | Layer | TTL | Invalidation Strategy |
|------|-------|-----|-----------------------|
| — | — | — | _None yet — add as caching is implemented_ |

---

## Hard-Won Lessons (Quick Reference)

> Full details in `docs/LESSONS.md`.

**Always call `warnSpy.mockRestore()` before asserting on console.warn.** *Learned when a `console.warn` mock in a prior test leaked into the next test because mockRestore() was missing, causing spurious assertion failures.*

**Always use `mockImplementationOnce` (not `mockImplementation`) for throw-once scenarios in tests.** *Learned when a `fs.writeFileSync` mock that threw for all calls broke a subsequent test in the same describe block that expected the write to succeed.*

**xterm.js FitAddon.fit() must be called before `terminal:spawn` IPC.** *Calling spawn before fit sends cols=80 rows=24 defaults; the correct terminal size is only known after fit() runs.*

**API keys must never appear in `config:get` IPC responses.** *ConfigStore.get() returns AppConfig which has no api_key field — this is the correct design. The key lives in keytar only.*

---

## Coverage Configuration (jest.config.js)

`collectCoverageFrom` now explicitly lists 7 testable compiled modules:
- `dist/main/config/store.js`
- `dist/main/providers/claude.js`, `openai.js`, `ollama.js`, `factory.js`
- `dist/main/pty/manager.js`
- `dist/renderer/theme.js`

Excluded (untestable without Electron/browser runtime): `dist/main/index.js`, `dist/preload/index.js`, `dist/renderer/index.js`, `dist/main/ipc/handlers.js`.

## Test Mocking Patterns for Electron Modules

- **DOM in Node tests:** Mock `global.document` and `global.window` before `require()`-ing the module under test. Set up before the import, not inside `beforeEach`.
- **Provider mocks:** Use `jest.mock('../../../src/main/providers/X.js', () => ({ XProvider: jest.fn().mockImplementation(...) }))`. The `moduleNameMapper` redirects `src/` → `dist/` transparently.

## CI Workflows (`.github/workflows/`)

| Workflow | Trigger | Key jobs |
|----------|---------|----------|
| `ci.yml` | push/PR to main, develop | lint → build → test:coverage → audit |
| `e2e.yml` | push/PR | install → build → xvfb-run playwright test |
| `plan-visualizer.yml` | push to main/develop (docs/ paths) or workflow_dispatch | generate-plan → upload-pages → deploy-pages |

**Path note:** GitHub Pages artifact path is `./Docs` (capital D) — matches the actual directory.

## Build Pipeline (Session 7+)

```
npm run build
  → tsc                        (compiles src/ → dist/ for main + preload + renderer TS types)
  → node tools/copy-assets.js  (copies src/renderer/index.html + styles.css → dist/renderer/)
  → node tools/bundle-renderer.js  (esbuild bundles src/renderer/index.ts → dist/renderer/index.js IIFE)
```

The renderer is an esbuild IIFE bundle — no `require`/`exports` needed. Works with `sandbox: true` + `nodeIntegration: false`.

## E2E Testing (Session 7+)

- Framework: `@playwright/test` with `_electron` launch API (Spectron deprecated)
- Test file: `tests/e2e/app.spec.ts`
- Run locally: `npm run test:e2e` (or `:headed`)
- Run in CI: `xvfb-run --auto-servernum npm run test:e2e`
- 3 tests: title, xterm.js DOM render (`.xterm-screen`), PTY round-trip (`echo hello_e2e`)
- PTY output verified via `page.evaluate()` IPC accumulator: `window.__e2eOutput`
- Test-mode flag `--test-mode`: skips keytar, passed as Electron arg by Playwright

## Packaging (electron-builder)

- Config: `electron-builder.yml`
- appId: `com.termnos.app`, productName: `TermnOS`
- Mac: dmg + zip (x64 + arm64) | Win: nsis + zip | Linux: AppImage + deb
- Scripts: `npm run dist:mac/win/linux`
- Output dir: `release/${version}/`

## Hard-Won Lessons (Session 7)

- **Electron path bug**: `../../preload/` from `dist/main/` goes to project root, NOT `dist/preload/`. Use `../preload/`.
- **Renderer CommonJS**: `tsc` output uses CommonJS `require()` which is unavailable in `sandbox: true` renderer. Bundle with esbuild into IIFE to fix.
- **xterm.js renderer mode**: In headless CI (Xvfb), xterm.js uses DOM renderer (`xterm-dom-renderer-owner-1`), not canvas. Test for `.xterm-screen` not `.xterm-screen canvas`.
- **PTY round-trip via IPC**: Install `terminalAPI.onOutput()` listener from `page.evaluate()` before typing; accumulate to `window.__e2eOutput`; use `page.waitForFunction()` to poll.
