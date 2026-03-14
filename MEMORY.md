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

Methods (to be formally defined in `architecture/`):
- `interpret(request: AIRequest): Promise<AIResponse>`
- `testConnection(): Promise<boolean>`

Providers: `ClaudeProvider`, `OpenAIProvider`, `OllamaProvider`

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

> Full details in `Docs/LESSONS.md`.

**Always call `warnSpy.mockRestore()` before asserting on console.warn.** *Learned when a `console.warn` mock in a prior test leaked into the next test because mockRestore() was missing, causing spurious assertion failures.*

**Always use `mockImplementationOnce` (not `mockImplementation`) for throw-once scenarios in tests.** *Learned when a `fs.writeFileSync` mock that threw for all calls broke a subsequent test in the same describe block that expected the write to succeed.*

**xterm.js FitAddon.fit() must be called before `terminal:spawn` IPC.** *Calling spawn before fit sends cols=80 rows=24 defaults; the correct terminal size is only known after fit() runs.*

**API keys must never appear in `config:get` IPC responses.** *ConfigStore.get() returns AppConfig which has no api_key field — this is the correct design. The key lives in keytar only.*
