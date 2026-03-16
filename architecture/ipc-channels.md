# ipc-channels.md — Electron IPC Channel Reference

> All IPC communication between renderer and main process must use these channels.
> No renderer code may call Node APIs directly — everything goes through contextBridge.

---

## Channel Map

| Channel | Direction | Handler File | Description |
|---------|-----------|--------------|-------------|
| `terminal:input` | renderer → main | `ipc/handlers.ts` | User keystroke / PTY write |
| `terminal:output` | main → renderer | `ipc/handlers.ts` | PTY stdout/stderr stream |
| `terminal:resize` | renderer → main | `ipc/handlers.ts` | Terminal pane resized (cols/rows) |
| `terminal:exit` | main → renderer | `ipc/handlers.ts` | PTY process exited |
| `ai:interpret` | renderer → main | `ipc/handlers.ts` | NL → AI → AIResponse |
| `ai:execute` | renderer → main | `ipc/handlers.ts` | User confirmed — write command to PTY |
| `config:get` | renderer → main | `ipc/handlers.ts` | Read full AppConfig (no plaintext keys) |
| `config:set` | renderer → main | `ipc/handlers.ts` | Write partial AppConfig |
| `provider:test` | renderer → main | `ipc/handlers.ts` | Test AI provider connection |
| `theme:change` | renderer → main | `ipc/handlers.ts` | Persist theme mode + color scheme |

---

## Payload Schemas

### `terminal:input`
```typescript
// renderer → main (invoke)
{ tabId: string; data: string }  // raw keystrokes / paste

// returns: void
```

### `terminal:output`
```typescript
// main → renderer (on)
{ tabId: string; data: string }  // raw PTY output chunk
```

### `terminal:resize`
```typescript
// renderer → main (invoke)
{ tabId: string; cols: number; rows: number }

// returns: void
```

### `terminal:exit`
```typescript
// main → renderer (on)
{ tabId: string; exitCode: number; signal?: string }
```

### `ai:interpret`
```typescript
// renderer → main (invoke)
{
  user_input: string;
  input_type: 'text' | 'voice';
  shell: string;
  cwd: string;
  platform: 'darwin' | 'win32' | 'linux';
  history: string[];
}

// returns: AIResponse | IPCError
{
  command: string;
  explanation: string;
  is_destructive: boolean;
  requires_confirmation: boolean;
  risk_level: 'safe' | 'caution' | 'destructive';
}
```

### `ai:execute`
```typescript
// renderer → main (invoke)
{ tabId: string; command: string }  // tabId routes to correct PTY; command is exactly the AIResponse command

// returns: void — command is written directly to PTY
```

### `config:get`
```typescript
// renderer → main (invoke)
// no payload

// returns: AppConfig (api_key field is OMITTED — never sent to renderer)
{
  provider: string;
  model: string;
  ollama_host: string | null;
  theme_mode: 'dark' | 'light' | 'auto';
  color_scheme: string;
  font_family: string;
  font_size: number;
  shell: string;
}
```

### `config:set`
```typescript
// renderer → main (invoke)
Partial<AppConfig>  // only the fields to change

// When api_key is included: stored in OS keychain, not written to config file
// returns: void | IPCError
```

### `provider:test`
```typescript
// renderer → main (invoke)
// no payload — uses current config

// returns: ConnectionStatus | IPCError
{
  ok: boolean;
  provider: string;
  model: string;
  latency_ms: number;
  error?: string;
}
```

### `theme:change`
```typescript
// renderer → main (invoke)
{ mode: 'dark' | 'light' | 'auto'; scheme: string }

// returns: void — also persisted to config
```

---

## Security Rules

1. `contextIsolation: true` — renderer cannot access Node.js APIs directly
2. `nodeIntegration: false` — enforced in BrowserWindow options
3. `sandbox: true` — renderer runs in Chromium sandbox
4. API keys are **never** included in `config:get` responses
5. IPC handlers do not currently validate payload shape — malformed payloads silently no-op (tracked as BUG-0006; full validation returning E_IPC_PAYLOAD is deferred)
6. `ai:execute` only writes the exact command string from an AIResponse — no shell interpolation
