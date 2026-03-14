# PROJECT.md — Project Constitution

> This is the single source of truth for this project's goals, architecture, schemas, rules, and design system. Read this file at the start of every session. Update it whenever a schema changes, a rule is added, or architecture is modified.

---

## § 1. Discovery Questions (Phase 1 — Blueprint)

| # | Question | Answer |
|---|----------|--------|
| 1 | **North Star:** What is the singular desired outcome? | An open source, cross-platform AI-powered terminal emulator (macOS, Windows, Linux). Users type natural language or use voice dictation; the AI interprets intent and executes the required terminal commands. Modeled after Warp terminal. Users can connect to a hosted AI service or bring their own model subscription via OAuth or API key. |
| 2 | **Integrations:** Which external services are needed? Are credentials ready? | Claude API (Anthropic), OpenAI API, Ollama (local models). OAuth for third-party model subscriptions. Local filesystem for config and history. Credentials: user-supplied API keys, stored in OS keychain. |
| 3 | **Source of Truth:** Where does the primary data live? | Local filesystem — config files, command history, session data, theme preferences. |
| 4 | **Delivery Payload:** How and where should the final result be delivered? | Rendered in the Electron terminal emulator window (stdout/stderr streamed to terminal pane). |
| 5 | **Behavioral Rules:** How should the system act? | (1) Always display the exact command before executing — never execute silently. (2) Require explicit user confirmation for any destructive or irreversible operation. (3) Theme mode "auto" reacts to OS dark/light mode changes at runtime. |

---

## § 2. Data Schema

### Config Schema (stored locally as JSON, API keys encrypted via OS keychain)

```json
{
  "ai_provider": "claude | openai | ollama",
  "api_key": "string (encrypted via OS keychain — never stored in plaintext)",
  "model": "string",
  "ollama_host": "string | null",
  "theme_mode": "dark | light | auto",
  "color_scheme": "string (scheme name, e.g. 'Dracula')",
  "font_family": "string (default: 'JetBrains Mono')",
  "font_size": "number (default: 14, range: 10–24)",
  "shell": "string (e.g. '/bin/zsh', 'powershell.exe')"
}
```

### AI Request Payload (renderer → main → AI provider)

```json
{
  "user_input": "string",
  "input_type": "text | voice",
  "shell": "string",
  "cwd": "string",
  "platform": "darwin | win32 | linux",
  "history": ["string"]
}
```

### AI Response Payload (AI provider → main → renderer)

```json
{
  "command": "string",
  "explanation": "string",
  "is_destructive": "boolean",
  "requires_confirmation": "boolean",
  "risk_level": "safe | caution | destructive"
}
```

### Execution Result (PTY → main → renderer)

```json
{
  "command": "string",
  "exit_code": "number",
  "stdout": "string",
  "stderr": "string",
  "duration_ms": "number"
}
```

---

## § 3. Architectural Invariants

Rules that must **never** be violated regardless of feature scope:

1. **Commands are NEVER executed without first displaying them to the user.** No silent execution, ever.
2. **Destructive commands ALWAYS require explicit confirmation** via a separate UI interaction before execution.
3. **API keys are NEVER stored in plaintext.** All credentials use the OS keychain (keytar library).
4. **AI providers are interchangeable.** All providers implement a common `ProviderInterface` — no provider-specific logic outside `tools/providers/`.
5. **The PTY (terminal) layer is completely decoupled from the AI layer.** Neither layer has direct knowledge of the other.
6. **Shell selection is user-configurable and never hardcoded.**
7. **Theme mode "auto" must react to OS-level dark/light mode changes at runtime** without requiring app restart.
8. **No PII is logged, stored in `.tmp/`, or transmitted beyond what is explicitly needed for AI command interpretation.**

---

## § 4. API Design (Electron IPC)

Internal architecture: Electron IPC between renderer process (UI) and main process (PTY, AI, filesystem). No HTTP server in MVP.

### IPC Channels

| Channel | Direction | Description |
|---------|-----------|-------------|
| `terminal:input` | renderer → main | User submits text or voice-transcribed input |
| `terminal:output` | main → renderer | Stream stdout/stderr back to terminal pane |
| `ai:interpret` | renderer → main | Send natural language; receive command + metadata |
| `ai:execute` | renderer → main | User approves command; PTY executes it |
| `config:get` | renderer → main | Read full user config |
| `config:set` | renderer → main | Write/update user config field(s) |
| `provider:test` | renderer → main | Validate API key and model connection |
| `theme:change` | renderer → main | Persist theme mode and color scheme selection |

### Response Envelope (IPC replies)

```json
{
  "success": "boolean",
  "data": {},
  "error": "string | null",
  "meta": { "channel": "string", "timestamp": "ISO8601" }
}
```

---

## § 5. User Profile

> All UI and UX decisions must be validated against this profile before implementation.

| Attribute | Value |
|-----------|-------|
| Technical level | Mixed — from beginners using natural language/voice to developers using custom models and advanced shell features |
| Primary device | Desktop (macOS, Windows, Linux) |
| Usage context | Daily terminal work: file management, git, development workflows, system administration |
| Mental model | "Tell the terminal what I want to achieve, not how to do it" |
| Key pain points | Forgetting exact CLI syntax, fear of destructive commands, context switching to documentation mid-task |
| Accessibility needs | Voice dictation input, readable monospace fonts (configurable size), keyboard-navigable UI, high contrast support, respects OS dark/light mode preference |

---

## § 6. Design System

> All UI work must comply with these specifications. Do not rely on memory of previous implementations — use this as the authoritative reference.

### Theme Modes

Three modes: **Dark** | **Light** | **Auto** (follows OS system preference, updates at runtime)

- Theme selector appears on **first launch** and is accessible at any time via the **Settings menu**
- User selects mode first, then picks a color scheme from the curated list for that mode

---

### Dark Color Schemes

| Scheme | Background | Foreground | Notes |
|--------|-----------|-----------|-------|
| Tomorrow Night | `#1d1f21` | `#c5c8c6` | Muted, classic |
| Dracula | `#282a36` | `#f8f8f2` | Purple accents |
| Monokai | `#272822` | `#f8f8f2` | Vibrant |
| Solarized Dark | `#002b36` | `#839496` | Low-contrast blue |
| Nord | `#2e3440` | `#d8dee9` | Cool arctic |
| One Dark | `#282c34` | `#abb2bf` | Atom-inspired |
| Gruvbox Dark | `#282828` | `#ebdbb2` | Warm retro |

### Light Color Schemes

| Scheme | Background | Foreground | Notes |
|--------|-----------|-----------|-------|
| Tomorrow | `#ffffff` | `#4d4d4c` | Clean, minimal |
| Solarized Light | `#fdf6e3` | `#657b83` | Warm, low-contrast |
| One Light | `#fafafa` | `#383a42` | Atom light |
| Gruvbox Light | `#fbf1c7` | `#3c3836` | Warm retro light |
| GitHub Light | `#ffffff` | `#24292f` | Familiar to devs |

---

### Typography

| Element | Value |
|---------|-------|
| Font family (default) | JetBrains Mono |
| Font size (default) | 14px |
| Font size (range) | 10–24px (user-configurable) |
| Line height | 1.5 |
| Font weight (normal) | 400 |
| Font weight (bold output) | 700 |

---

### AI Status Colors (scheme-independent overlays)

| State | Color | Hex |
|-------|-------|-----|
| AI suggestion / active | Purple | `#7c3aed` |
| Safe command | Green | `#22c55e` |
| Caution command | Amber | `#f59e0b` |
| Destructive command | Red | `#ef4444` |

---

### Core Components

| Component | Description |
|-----------|-------------|
| Terminal pane | Main PTY output display area; resizes dynamically, sends SIGWINCH to PTY |
| AI input bar | Natural language or voice input field, always visible |
| Command preview card | Shows proposed command + explanation + risk badge before execution |
| Risk badge | Color-coded indicator: safe / caution / destructive |
| Confirmation dialog | Modal for destructive commands requiring explicit approval |
| Theme/scheme picker | Mode selector + color scheme grid, accessible from startup and settings |
| Provider selector | AI provider choice + API key entry + connection test |
| Settings panel | Full configuration UI — shell, font, theme, provider, keyboard shortcuts |
| Tab bar | Always visible; supports open/close/reorder; mode toggle (splitter ↔ full-window) |
| Splitter divider | Draggable divider between split panes; minimum pane width 200px |

---

### Multi-Tab Layout Modes

| Mode | Description |
|------|-------------|
| Full-window | One active tab displayed full-window; tab bar for switching |
| Splitter | Two or more panes side-by-side or stacked; draggable dividers |

Tab bar is always visible. Each tab has its own PTY session, working directory, and AI context.

---

### Responsive Layout Rules

- All chrome (tab bar, AI input bar, settings) must remain accessible at minimum window size: **800×600px**
- Terminal pane(s) fill all available space after chrome; no fixed heights or widths
- Splitter panes resize proportionally on window resize
- PTY receives `SIGWINCH` on any resize so CLI tools (vim, htop, etc.) reflow correctly
- Tested resolutions: 800×600, 1280×800, 1920×1080, 2560×1440, ultrawide 3440×1440

---

### Font Zoom Keyboard Shortcuts

| Action | macOS | Windows / Linux |
|--------|-------|-----------------|
| Zoom in | `Cmd` + `+` | `Ctrl` + `+` |
| Zoom out | `Cmd` + `-` | `Ctrl` + `-` |
| Reset to default | `Cmd` + `0` | `Ctrl` + `0` |

- Range: 10–24px. Changes are immediate, persisted to config, and trigger `SIGWINCH`.

---

### Accessibility Requirements

- All color pairs must meet WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for large text and UI components
- Validate every color scheme against these ratios — document results in `findings.md`
- Risk state must never be conveyed by color alone — pair with icon and text label
- All interactive elements must have descriptive `aria-label` or `aria-labelledby`
- Full keyboard navigation required — logical tab order, visible focus indicators
- Respect OS accessibility settings (Dynamic Type, high contrast, reduce motion)

---

## § 7. Logging & Monitoring

| Environment | Log destination | Log level | Format |
|-------------|-----------------|-----------|--------|
| Development | Console (stdout) | DEBUG | Human-readable |
| Production | OS app log dir via `electron-log` | INFO | Structured JSON |

Log level controlled via `LOG_LEVEL` environment variable. Never hardcoded.

---

## § 8. Performance Baselines

| Metric | Target |
|--------|--------|
| AI command interpretation latency (p95) | < 2 seconds |
| Terminal keystroke → display latency | < 16ms (60fps) |
| App cold start time | < 3 seconds |
| PTY command execution start | < 100ms after user approval |
| Theme switch (inc. auto OS change) | < 100ms |

---

## § 9. Maintenance Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1.0 | 2026-03-14 | Initial project constitution scaffold created | Agent (Session 1) |
| 0.2.0 | 2026-03-14 | Discovery complete. Populated §1–§7: goals, schemas, invariants, IPC design, user profile, design system, theme system | Agent (Session 2) |
