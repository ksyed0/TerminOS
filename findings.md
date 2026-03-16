# findings.md — Research, Discoveries & Constraints

> Log all research results, architectural discoveries, constraints, and dependency justifications here.

---

## Dependencies

### Runtime Dependencies

| Package | Version Pinned | Purpose | Licence | Notes |
|---------|---------------|---------|---------|-------|
| `electron` | 41.0.2 | Cross-platform desktop shell (Chromium + Node.js) | MIT | Upgraded from 33.x — resolves GHSA-vmqv-hx8q-j7mg (ASAR integrity bypass, high severity) |
| `@anthropic-ai/sdk` | 0.39.0 | Official Anthropic SDK for Claude API (messages.create) | MIT | Used in ClaudeProvider; supports streaming, tool use, full type safety |
| `openai` | 4.97.0 | Official OpenAI SDK (chat.completions.create) | MIT | Used in OpenAIProvider; supports response_format: json_object |
| `node-pty` | 1.1.0 | Spawn + manage a shell PTY; sends SIGWINCH on resize | MIT | Used in PtyManager; wraps native PTY (pty.js on Unix, ConPTY on Windows) |
| `keytar` | 7.9.0 | Read/write/delete credentials from OS keychain | MIT | API keys only — never written to config file; falls back to env var if keytar unavailable |
| `xterm` | 5.3.0 | Terminal emulator rendered in DOM canvas | MIT | Renderer only; ANSI/VT100/256-color supported; xterm@5.5.0 not available (notarget) |
| `xterm-addon-fit` | 0.8.0 | Auto-calculates cols/rows from container dimensions | MIT | fit() called before spawn and on every resize event |
| `node-fetch` | 3.3.2 | ESM-compatible fetch polyfill (Node < 18 fallback) | MIT | Ollama provider uses native fetch(); node-fetch reserved for future use |
| `dotenv` | 16.5.0 | `.env` file loader for local development and handshake scripts | MIT | Used by `verify-providers.js` only; never loaded in production Electron build |
| `electron-log` | 5.3.4 | Structured logging for Electron (writes to OS app log dir) | MIT | Replaces console.log in production; INFO level default |

### Dev Dependencies

| Package | Version Pinned | Purpose | Licence | Notes |
|---------|---------------|---------|---------|-------|
| `typescript` | 5.8.3 | TypeScript compiler | Apache-2.0 | Target ES2022, CommonJS modules, strict mode |
| `ts-node` | 10.9.2 | On-demand TypeScript execution (scripts, REPL) | MIT | Used for development scripts; not in test pipeline |
| `@types/node` | 22.15.3 | Node.js type definitions | MIT | Aligned with Node 22 LTS |
| `@types/electron` | 1.6.10 | Electron type stubs | MIT | Supplemental; primary types come from electron package |
| `jest` | 30.3.0 | Unit test runner | MIT | testMatch: `tests/unit/**/*.test.js`; 199 tests passing |
| `eslint` | 10.0.3 | JavaScript/TypeScript linter | MIT | Flat config format (eslint.config.js) |
| `@eslint/js` | 9.39.4 | ESLint core JS ruleset | MIT | Companion to eslint@10 flat config |

---

## Architectural Discoveries

### Phase 2 (Link) — Provider System

**Discovery: ts-jest incompatible with jest@30**
- `ts-jest` latest (29.4.6) does not support `jest@30`. Cannot use ts-jest to run TypeScript tests directly.
- **Resolution:** TypeScript is compiled to `dist/` via `npx tsc`. Jest `moduleNameMapper` redirects `src/...js` imports to `dist/...js` at test runtime. Test script should compile before running Jest.

**Discovery: Ollama has no official Node.js SDK**
- Ollama exposes a plain HTTP REST API. All interaction is via `fetch()`:
  - `GET /api/tags` — list available models
  - `POST /api/chat` — chat completion with `stream: false`
- No SDK dependency needed; native `fetch()` is available in Node 18+ and Electron 41.

**Discovery: OpenAI SDK requires `response_format: { type: 'json_object' }`**
- Without this, the model may return prose instead of JSON even with a JSON system prompt.
- Must also include the word "JSON" in the system prompt per OpenAI's API contract.

**Discovery: Security advisory GHSA-vmqv-hx8q-j7mg**
- Affects `electron < 33.4.4` — ASAR integrity check bypass allows malicious file replacement.
- Fixed in Electron 33.4.4+. We use 41.0.2 (fully covered).
- Residual `npm audit` warning on `yauzl` (used by `@electron/get` download tooling) is a false positive: yauzl is not included in the packaged Electron app binary and is not reachable at runtime.

**Discovery: `tools/providers/` handshake layer uses built-in http/https (no SDK)**
- `http-client.js` wraps Node's built-in `https`/`http` modules — zero new deps for the handshake tools layer.
- Providers in `tools/providers/` use constructor-injected config (no dotenv). Only `verify-providers.js` loads dotenv.
- `ValidationError` is thrown for HTTP-200-but-bad-JSON; `IntegrationError` for transport failures. Only the latter is retried.

---

## Constraints

1. **Branch naming:** Local git proxy at `127.0.0.1:39725` permits pushes only to branches prefixed `claude/`. All feature branches use this prefix regardless of AGENTS.md `feature/US-XXXX` convention.
2. **GitHub CLI not available:** `gh` is not installed. PR creation must be done manually on GitHub web UI.
3. **Push to `main`/`develop` blocked:** The proxy returns HTTP 403 for direct pushes to protected branches. All merges go through GitHub PRs created by the user.
4. **Electron keytar:** `keytar` (OS keychain for API key storage) is not yet installed — planned for Phase 3 (Architect) when the config/IPC layer is built. Until then, API keys may be passed via environment variables for development only.
5. **ts-jest unavailable for jest@30:** See Architectural Discoveries above. TypeScript must be pre-compiled before running tests.

---

## Research

### Provider Interface Design
- Researched Warp terminal AI integration model: commands are always previewed before execution, natural language input is primary, AI context includes shell + cwd + history.
- TermnOS follows the same pattern: `AIRequest` carries `shell`, `cwd`, `platform`, and `history[]`; `AIResponse` always includes `is_destructive` and `requires_confirmation` flags.

### Ollama REST API
- Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
- `/api/tags` returns `{ models: [{ name: string, ... }] }`
- `/api/chat` accepts `{ model, messages, stream, format }` — `format: 'json'` instructs the model to output valid JSON
- Model availability check: `tags.models.some(m => m.name.startsWith(requestedModel))` — handles `:latest` suffix transparently

### Claude API JSON Mode
- Anthropic does not have a `response_format` parameter. JSON output is enforced through the system prompt alone.
- System prompt ends with: `"Respond with ONLY valid JSON, no markdown, no explanation outside the JSON object."`
- This is sufficient for Claude 3+ models with a strict schema description.
