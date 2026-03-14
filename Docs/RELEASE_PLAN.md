# Docs/RELEASE_PLAN.md — Release Plan & Backlog

> Living document. Update whenever scope, priorities, or architecture change. See AGENTS.md §9 for full format standards.

---

## Release Milestones

| Milestone | Description | Status |
|-----------|-------------|--------|
| **MVP** | Core AI terminal emulator — PTY + AI interpretation + command preview + destructive confirmation + provider setup + theme picker + multi-tab (splitter + full window) + responsive layout + font zoom | Planned |
| **Release 1.1** | Voice dictation + local Ollama models + command history memory | Planned |
| **Release 1.2** | OAuth model subscriptions + cross-platform packaging + full settings UI + plugin system | Planned |

---

## EPIC-0001: Core Terminal Emulator (MVP)

```
EPIC-0001: Core Terminal Emulator
Description: Delivers a functional cross-platform terminal emulator with AI natural language
             command interpretation, safe execution with command preview, destructive command
             confirmation, AI provider configuration, theme selection, multi-tab with splitter
             and full-window modes, responsive layout, and font zoom.
Release Target: MVP
Status: Planned
Dependencies: None
```

---

### US-0001 (EPIC-0001): Terminal Shell Display & PTY Integration

```
US-0001 (EPIC-0001): As a user, I want a functional terminal window with a real PTY,
so that I can run shell commands exactly as I would in a native terminal.

Description: Electron app with an embedded terminal pane connected to a PTY (node-pty).
             Supports user's default shell (bash, zsh, fish, PowerShell). Renders ANSI
             colour codes and escape sequences correctly. Scrollback buffer supported.

Priority: High
Estimate: L
Status: Planned

Acceptance Criteria:
  - [ ] AC-0001: App launches and displays a terminal pane
  - [ ] AC-0002: PTY connects to the user's configured shell on startup
  - [ ] AC-0003: User can type and execute shell commands directly
  - [ ] AC-0004: stdout and stderr render correctly including ANSI colour codes
  - [ ] AC-0005: Scrollback buffer retains at least 1000 lines

Dependencies: None

Definition of Ready (DOR):
  - [ ] Story is understood and estimated
  - [ ] Acceptance criteria are defined and agreed
  - [ ] node-pty package researched and version pinned in findings.md
  - [ ] No blockers exist to begin work

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Unit tests written and passing with ≥80% coverage
  - [ ] Test cases created in TEST_CASES.md
  - [ ] No regressions introduced
  - [ ] Accessibility audit passed (WCAG 2.1 AA)
  - [ ] Performance: keystroke → display latency < 16ms verified
  - [ ] Session Close Protocol completed
```

---

### US-0002 (EPIC-0001): AI Natural Language → Command Interpretation

```
US-0002 (EPIC-0001): As a user, I want to type what I want to do in plain English,
so that the AI translates my intent into the correct terminal command.

Description: AI input bar (always visible) accepts natural language. On submit, sends
             AI request payload to configured provider (Claude/OpenAI). Receives command
             + explanation + risk_level. Displays command preview card before any execution.

Priority: High
Estimate: L
Status: Planned

Acceptance Criteria:
  - [ ] AC-0006: AI input bar is visible and accessible at all times
  - [ ] AC-0007: Submitting natural language sends request to configured AI provider
  - [ ] AC-0008: AI response renders as a command preview card showing: command, explanation, risk badge
  - [ ] AC-0009: Command is NOT executed until user explicitly approves
  - [ ] AC-0010: AI response latency (p95) < 2 seconds on standard connection
  - [ ] AC-0011: Error shown clearly if AI provider is unreachable or returns an error

Dependencies: US-0001 (PTY integration), US-0005 (provider configuration)

Definition of Ready (DOR):
  - [ ] Story is understood and estimated
  - [ ] Acceptance criteria are defined and agreed
  - [ ] ProviderInterface designed and documented in architecture/
  - [ ] No blockers exist to begin work

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Unit tests written and passing with ≥80% coverage
  - [ ] Test cases created in TEST_CASES.md
  - [ ] ProviderInterface documented in architecture/
  - [ ] Session Close Protocol completed
```

---

### US-0003 (EPIC-0001): Command Preview Panel

```
US-0003 (EPIC-0001): As a user, I want to see the exact command the AI will run before
it executes, so that I am always in control and never surprised.

Description: After AI interpretation (US-0002), display a command preview card with:
             the proposed command (in a code block), a plain-English explanation,
             a risk badge (safe/caution/destructive), and Approve / Edit / Cancel actions.

Priority: High
Estimate: M
Status: Planned

Acceptance Criteria:
  - [ ] AC-0012: Command preview card appears after every AI interpretation
  - [ ] AC-0013: Card displays: command text, explanation, risk badge with colour + text label
  - [ ] AC-0014: "Approve" executes the command via PTY
  - [ ] AC-0015: "Edit" makes the command text editable before execution
  - [ ] AC-0016: "Cancel" dismisses the card without executing anything
  - [ ] AC-0017: Risk badge never uses colour as the sole indicator — always pairs with text

Dependencies: US-0002

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Accessibility audit: risk state communicated without colour alone
  - [ ] Keyboard navigation: all three actions (Approve/Edit/Cancel) operable via keyboard
  - [ ] Session Close Protocol completed
```

---

### US-0004 (EPIC-0001): Destructive Command Detection & Confirmation

```
US-0004 (EPIC-0001): As a user, I want the terminal to detect potentially destructive
commands and require my explicit confirmation, so that I never accidentally delete or
overwrite critical data.

Description: When AI response has risk_level = "destructive" or is_destructive = true,
             show a modal confirmation dialog (not just the preview card) that requires
             a deliberate action (e.g. typing "confirm" or clicking a red confirmation button)
             before execution proceeds.

Priority: High
Estimate: M
Status: Planned

Acceptance Criteria:
  - [ ] AC-0018: Destructive commands show a confirmation modal distinct from the standard preview card
  - [ ] AC-0019: Modal clearly communicates the risk and names the specific operation
  - [ ] AC-0020: User must take an explicit deliberate action to confirm (not just pressing Enter)
  - [ ] AC-0021: Pressing Escape or clicking Cancel always aborts — no destructive command executes on ambiguous input
  - [ ] AC-0022: Non-destructive commands do NOT trigger the confirmation modal

Dependencies: US-0003

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Edge case test cases written for: rm -rf, DROP TABLE, format commands, overwrite ops
  - [ ] Session Close Protocol completed
```

---

### US-0005 (EPIC-0001): AI Provider Configuration

```
US-0005 (EPIC-0001): As a user, I want to configure which AI provider I use and enter
my API key securely, so that I can use Claude, OpenAI, or my own model.

Description: Provider selector UI (accessible from startup wizard and settings panel).
             User picks: Claude | OpenAI | Ollama. Enters API key (stored in OS keychain
             via keytar — never in plaintext). For Ollama: enter host URL.
             "Test connection" button validates the key and model.

Priority: High
Estimate: M
Status: Planned

Acceptance Criteria:
  - [ ] AC-0023: User can select AI provider: Claude, OpenAI, or Ollama
  - [ ] AC-0024: API key input field masks the key (password field)
  - [ ] AC-0025: API key is stored in OS keychain — never written to disk in plaintext
  - [ ] AC-0026: "Test connection" button confirms the key and model are valid before saving
  - [ ] AC-0027: Ollama option shows a host URL field (default: http://localhost:11434)
  - [ ] AC-0028: Provider config persists across app restarts

Dependencies: None (can be developed in parallel with US-0001)

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Security review: confirm no API key appears in logs, `.tmp/`, or config files
  - [ ] keytar dependency pinned and documented in findings.md
  - [ ] Session Close Protocol completed
```

---

### US-0006 (EPIC-0001): Theme Selector (Startup & Settings)

```
US-0006 (EPIC-0001): As a user, I want to choose my terminal's appearance on first
launch and from the settings menu, so that the app looks exactly how I want it.

Description: On first launch, display a theme picker before the terminal is shown.
             User selects mode (Dark / Light / Auto), then picks a color scheme from
             the curated list for that mode. Theme applies immediately with live preview.
             Accessible at any time from Settings. "Auto" mode reacts to OS dark/light
             changes at runtime without restart.

Priority: High
Estimate: M
Status: Planned

Acceptance Criteria:
  - [ ] AC-0029: Theme picker appears on first launch before terminal is displayed
  - [ ] AC-0030: User can select Dark, Light, or Auto mode
  - [ ] AC-0031: Selecting a mode shows the curated color schemes for that mode
  - [ ] AC-0032: Live preview updates as the user hovers over schemes
  - [ ] AC-0033: Selected theme persists to config and applies on next launch
  - [ ] AC-0034: "Auto" mode responds to OS dark/light mode changes at runtime (< 100ms)
  - [ ] AC-0035: Theme picker is accessible from the Settings menu at any time
  - [ ] AC-0036: All scheme color pairs validated against WCAG 2.1 AA contrast ratios

Dependencies: None

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] All 12 color schemes (7 dark + 5 light) implemented and contrast-validated
  - [ ] Contrast audit results logged in findings.md
  - [ ] Session Close Protocol completed
```

---

### US-0015 (EPIC-0001): Responsive Layout & Dynamic Resize

```
US-0015 (EPIC-0001): As a user, I want the terminal to adapt fluidly to any window size
or screen resolution, so that it is usable whether the window is small, full-screen,
or on any monitor size.

Description: The entire Electron layout — terminal pane(s), AI input bar, tab bar,
             and any panels — must reflow and resize dynamically as the window is resized.
             No horizontal overflow or clipped content at any common window size.
             Terminal pane(s) must send correct SIGWINCH to PTY on resize so CLI tools
             (vim, htop, etc.) reflow correctly.

Priority: High
Estimate: M
Status: Planned
Dependencies: US-0001, US-0010

Acceptance Criteria:
  - [ ] AC-0046: Terminal pane fills available space at any window width/height
  - [ ] AC-0047: PTY receives SIGWINCH on window resize; CLI tools reflow correctly
  - [ ] AC-0048: AI input bar, tab bar, and all UI chrome remain accessible at minimum window size (800×600)
  - [ ] AC-0049: Splitter panes resize proportionally when the overall window is resized
  - [ ] AC-0050: No horizontal scrollbar appears on the window chrome at any tested resolution
  - [ ] AC-0051: Layout is tested at: 800×600, 1280×800, 1920×1080, 2560×1440, and ultrawide (3440×1440)

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] SIGWINCH tested with vim, htop, and a grid-rendering CLI tool
  - [ ] Session Close Protocol completed
```

---

### US-0016 (EPIC-0001): Font Zoom (Keyboard Shortcut)

```
US-0016 (EPIC-0001): As a user, I want to zoom the terminal font in and out using
keyboard shortcuts, so that I can quickly adjust readability without opening settings.

Description: Platform-appropriate keyboard shortcuts increase or decrease terminal font size:
  - macOS: Cmd + Plus / Cmd + Minus / Cmd + 0 (reset)
  - Windows / Linux: Ctrl + Plus / Ctrl + Minus / Ctrl + 0 (reset)
  Font size is clamped to the allowed range (10–24px). Change is immediate, persisted
  to config, and PTY receives SIGWINCH so terminal content reflows.

Priority: High
Estimate: S
Status: Planned
Dependencies: US-0001, US-0015

Acceptance Criteria:
  - [ ] AC-0052: Cmd/Ctrl + Plus increases font size by 1px (up to max 24px)
  - [ ] AC-0053: Cmd/Ctrl + Minus decreases font size by 1px (down to min 10px)
  - [ ] AC-0054: Cmd/Ctrl + 0 resets font size to default (14px)
  - [ ] AC-0055: Font size change is applied immediately without restart
  - [ ] AC-0056: New font size is persisted to config and restored on next launch
  - [ ] AC-0057: PTY receives SIGWINCH after font resize so terminal content reflows

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Keyboard shortcuts tested on macOS (Cmd) and Windows/Linux (Ctrl)
  - [ ] Session Close Protocol completed
```

---

## EPIC-0002: Voice & Extended AI (Release 1.1)

```
EPIC-0002: Voice & Extended AI
Description: Adds voice dictation input, local model support via Ollama, and command
             history with AI context awareness.
Release Target: Release 1.1
Status: Planned
Dependencies: EPIC-0001
```

---

### US-0007 (EPIC-0002): Voice Dictation Input

```
US-0007 (EPIC-0002): As a user, I want to speak my terminal commands in natural language,
so that I can use the terminal hands-free or more naturally.

Priority: Medium
Estimate: L
Status: Planned
Dependencies: US-0002
```

---

### US-0008 (EPIC-0002): Local Model Support via Ollama

```
US-0008 (EPIC-0002): As a user, I want to run AI command interpretation using a locally
hosted model via Ollama, so that I can use the terminal without sending data to external APIs.

Priority: Medium
Estimate: M
Status: Planned
Dependencies: US-0005
```

---

### US-0009 (EPIC-0002): Command History with AI Context Memory

```
US-0009 (EPIC-0002): As a user, I want the AI to remember recent commands I've run in
this session, so that its suggestions are aware of what I've already done.

Priority: Medium
Estimate: M
Status: Planned
Dependencies: US-0002
```

---

### US-0010 (EPIC-0001): Multi-Tab Terminal Sessions (Splitter & Full-Window)

```
US-0010 (EPIC-0001): As a user, I want multiple terminal tabs that support both
split-pane view with adjustable widths and full-window single-tab view,
so that I can multitask efficiently within the same app window.

Description: Two display modes:
  (1) Splitter mode — two or more terminal panes side-by-side (or stacked) within
      the same window, with draggable dividers to adjust widths/heights.
  (2) Full window mode — one active tab displayed in the full window; switch between
      tabs via tab bar. Each tab has its own independent PTY session.
  Tab bar always visible. Users can open new tabs, close tabs, and drag to reorder.
  Each tab retains its own working directory, history, and AI context.

Priority: High
Estimate: L
Status: Planned
Dependencies: US-0001

Acceptance Criteria:
  - [ ] AC-0037: User can open multiple terminal tabs via keyboard shortcut and tab bar button
  - [ ] AC-0038: Full-window mode: clicking a tab switches the full window to that tab's PTY
  - [ ] AC-0039: Splitter mode: user can split the window horizontally or vertically
  - [ ] AC-0040: Splitter dividers are draggable to adjust pane widths/heights
  - [ ] AC-0041: Each tab/pane maintains its own independent PTY session and working directory
  - [ ] AC-0042: Tabs can be closed (with confirmation if a command is running)
  - [ ] AC-0043: Tabs can be reordered by dragging in the tab bar
  - [ ] AC-0044: Keyboard shortcut to switch between tabs (Cmd+1–9 / Ctrl+1–9)
  - [ ] AC-0045: Mode toggle (splitter ↔ full-window) accessible from tab bar or keyboard shortcut

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Splitter minimum pane width enforced (no pane smaller than 200px)
  - [ ] Session Close Protocol completed
```

---

## EPIC-0003: Distribution & Polish (Release 1.2)

```
EPIC-0003: Distribution & Polish
Description: OAuth model subscriptions, cross-platform packaging with auto-update,
             full settings UI, and a plugin/extension system for community contributions.
Release Target: Release 1.2
Status: Planned
Dependencies: EPIC-0001, EPIC-0002
```

---

### US-0011 (EPIC-0003): OAuth Model Subscription Connection

```
US-0011 (EPIC-0003): As a user, I want to connect to AI model subscriptions using OAuth,
so that I don't have to manually manage API keys for supported providers.

Priority: Low
Estimate: L
Status: Planned
Dependencies: US-0005
```

---

### US-0012 (EPIC-0003): Cross-Platform Packaging & Auto-Update

```
US-0012 (EPIC-0003): As a user, I want to download and install TermnOS as a native app
on macOS, Windows, and Linux, and have it update itself automatically.

Priority: Low
Estimate: L
Status: Planned
Dependencies: EPIC-0001 complete
```

---

### US-0013 (EPIC-0003): Full Settings UI Panel

```
US-0013 (EPIC-0003): As a user, I want a comprehensive settings panel where I can configure
every aspect of the terminal — shell, font, theme, provider, and keyboard shortcuts.

Priority: Low
Estimate: M
Status: Planned
Dependencies: US-0005, US-0006
```

---

### US-0014 (EPIC-0003): Plugin / Extension System

```
US-0014 (EPIC-0003): As a developer, I want to build and install plugins that extend
TermnOS functionality, so that the community can contribute new features.

Priority: Low
Estimate: XL
Status: Planned
Dependencies: EPIC-0001, EPIC-0002 complete
```
