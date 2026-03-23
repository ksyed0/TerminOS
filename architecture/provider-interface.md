# architecture/provider-interface.md — AI Provider SOP

**Golden Rule:** If provider logic changes, update this SOP before updating the code.

---

## Purpose

Defines how TermnOS communicates with AI providers to translate natural language into terminal commands. All provider implementations must satisfy the `AIProvider` interface defined in `src/main/providers/interface.ts`.

## Invariants

1. No provider-specific logic may exist outside `src/main/providers/`
2. All callers interact exclusively through `AIProvider` — never with concrete classes directly
3. Providers only **interpret** — they never execute commands
4. `testConnection()` must never throw — always returns `ConnectionStatus`

## Layer Map

```
Renderer (IPC) → ai:interpret
                   ↓
Main Process → IPC handler (src/main/ipc/)
                   ↓
             createProvider(config)   ← factory.ts
                   ↓
             AIProvider.interpret()   ← claude.ts / openai.ts / ollama.ts
                   ↓
             AIResponse → back to renderer
```

## Adding a New Provider

1. Assign next available ID in `docs/ID_REGISTRY.md`
2. Create `src/main/providers/<name>.ts` implementing `AIProvider`
3. Add case to `factory.ts` switch statement
4. Add to `ProviderConfig.provider` union type in `interface.ts`
5. Write unit tests in `tests/unit/providers/test-<name>-provider.test.ts`
6. Document in `findings.md` (package, version, licence)
7. Update `architecture/provider-interface.md` (this file)

## System Prompt Contract

All providers use the same system prompt structure:
- Input: shell, cwd, platform, last 20 commands from history, user_input
- Output: strict JSON matching `AIResponse` schema — no prose, no markdown wrapping

## Error Handling

| Error type | Behaviour |
|-----------|-----------|
| Network / timeout | Caught in provider; returned as `ConnectionStatus { ok: false }` or thrown as `IntegrationError` in interpret() |
| Invalid JSON response | Thrown as `BusinessLogicError` — model did not follow the contract |
| Auth failure (401/403) | Thrown as `IntegrationError` with actionable message |
| Model not found (Ollama) | `testConnection()` returns `ok: false` with list of available models |

## Retry Policy

Transient errors (timeout, 429, 503) in `interpret()` retry up to 3 times with exponential backoff: 1s, 2s, 4s. Document any deviations in `MEMORY.md`.
