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

Description: A microphone button in the AI input bar activates voice capture. Speech is
             transcribed (via Web Speech API or a bundled STT library) and populated into
             the AI input field as text. From that point the existing AI interpret flow
             handles it identically to typed input. No audio is stored or transmitted beyond
             what is required for transcription.

Priority: Medium
Estimate: L
Status: Planned
Dependencies: US-0002

Acceptance Criteria:
  - [ ] AC-0058: A microphone button is visible in the AI input bar
  - [ ] AC-0059: Clicking the mic button activates voice capture and shows a recording indicator
  - [ ] AC-0060: Transcribed text is placed into the AI input field; user can edit before submitting
  - [ ] AC-0061: Clicking the mic button again (or pressing Escape) cancels recording without submitting
  - [ ] AC-0062: If the platform denies microphone permission, a clear actionable error is shown
  - [ ] AC-0063: No audio data is stored to disk or transmitted beyond what the STT library requires
  - [ ] AC-0064: Voice input produces the same AI interpret + command preview flow as typed input

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Tested on macOS, Windows, and Linux
  - [ ] STT library/API pinned and documented in findings.md
  - [ ] Session Close Protocol completed
```

---

### US-0008 (EPIC-0002): Local Model Support via Ollama

```
US-0008 (EPIC-0002): As a user, I want to run AI command interpretation using a locally
hosted model via Ollama, so that I can use the terminal without sending data to external APIs.

Description: Implements OllamaProvider behind the existing ProviderInterface. User configures
             the Ollama host URL and selects a locally available model (fetched from Ollama's
             /api/tags endpoint). All inference runs locally — no data leaves the machine.

Priority: Medium
Estimate: M
Status: Planned
Dependencies: US-0005

Acceptance Criteria:
  - [ ] AC-0065: Selecting "Ollama" as provider shows a host URL field (default: http://localhost:11434)
  - [ ] AC-0066: Available local models are fetched from Ollama and displayed in a dropdown
  - [ ] AC-0067: "Test connection" validates the Ollama host is reachable and the selected model is loaded
  - [ ] AC-0068: AI interpret flow works end-to-end using the local Ollama model
  - [ ] AC-0069: If Ollama is unreachable, a clear error is shown with a link to Ollama setup docs
  - [ ] AC-0070: No request data is sent to any external API when Ollama is the selected provider

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] OllamaProvider implements ProviderInterface with no provider-specific logic outside tools/providers/
  - [ ] Tested with at least two local models (e.g. llama3, mistral)
  - [ ] Session Close Protocol completed
```

---

### US-0009 (EPIC-0002): Command History with AI Context Memory

```
US-0009 (EPIC-0002): As a user, I want the AI to remember recent commands I've run in
this session, so that its suggestions are aware of what I've already done.

Description: The last N executed commands (and their exit codes) are included in the
             AI request payload's "history" field. This gives the AI context to avoid
             repeating commands, reference prior output, and chain operations logically.
             History is scoped to the current tab/session and is not persisted across app restarts.

Priority: Medium
Estimate: M
Status: Planned
Dependencies: US-0002

Acceptance Criteria:
  - [ ] AC-0071: Executed commands are appended to the session history after each execution
  - [ ] AC-0072: The last 20 commands (configurable) are included in every AI request payload
  - [ ] AC-0073: History is scoped per tab — each tab maintains its own independent history
  - [ ] AC-0074: History is not persisted to disk and is cleared when the tab is closed
  - [ ] AC-0075: AI suggestions demonstrably reference prior context (e.g. avoid re-running a completed step)
  - [ ] AC-0076: History does not grow unbounded — oldest entries are dropped once the limit is reached

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] History limit documented in MEMORY.md
  - [ ] Session Close Protocol completed
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

Description: For supported providers (initially Claude and OpenAI), the user can authenticate
             via OAuth instead of entering a raw API key. An in-app browser window handles the
             OAuth flow; the resulting access token is stored in the OS keychain. Token refresh
             is handled automatically in the background.

Priority: Low
Estimate: L
Status: Planned
Dependencies: US-0005

Acceptance Criteria:
  - [ ] AC-0077: "Connect with [Provider]" OAuth option appears alongside the API key field for supported providers
  - [ ] AC-0078: Clicking the OAuth option opens an in-app browser window pointing to the provider's auth URL
  - [ ] AC-0079: On successful auth, the access token is stored in the OS keychain — never in plaintext
  - [ ] AC-0080: The provider connection is marked as active and "Test connection" passes after OAuth
  - [ ] AC-0081: Expired tokens are refreshed automatically without user intervention
  - [ ] AC-0082: User can disconnect (revoke) the OAuth connection from the settings panel

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Security review: no tokens in logs, .tmp/, or config files
  - [ ] OAuth flow tested on macOS, Windows, and Linux
  - [ ] Session Close Protocol completed
```

---

### US-0012 (EPIC-0003): Cross-Platform Packaging & Auto-Update

```
US-0012 (EPIC-0003): As a user, I want to download and install TermnOS as a native app
on macOS, Windows, and Linux, and have it update itself automatically.

Description: Use electron-builder to produce signed installers for macOS (.dmg), Windows
             (.exe NSIS installer), and Linux (.AppImage / .deb). electron-updater handles
             auto-update checks against GitHub Releases. Update is downloaded in the background
             and applied on next launch with user notification.

Priority: Low
Estimate: L
Status: Planned
Dependencies: EPIC-0001 complete

Acceptance Criteria:
  - [ ] AC-0083: electron-builder produces a runnable installer for macOS, Windows, and Linux
  - [ ] AC-0084: Installer is code-signed on macOS (Developer ID) and Windows (Authenticode)
  - [ ] AC-0085: App checks for updates on launch and notifies the user when one is available
  - [ ] AC-0086: Update downloads in the background without blocking the user
  - [ ] AC-0087: User is prompted to restart to apply the update; update is not forced
  - [ ] AC-0088: Auto-update works end-to-end from a GitHub Release asset

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Tested install + update flow on all three platforms
  - [ ] electron-builder and electron-updater pinned in findings.md
  - [ ] Session Close Protocol completed
```

---

### US-0013 (EPIC-0003): Full Settings UI Panel

```
US-0013 (EPIC-0003): As a user, I want a comprehensive settings panel where I can configure
every aspect of the terminal — shell, font, theme, provider, and keyboard shortcuts.

Description: A dedicated settings screen (accessible from menu bar and keyboard shortcut)
             with sections: General (shell, font size, scrollback limit), Appearance (theme
             mode, color scheme), AI Provider (provider selector, API key, model, test connection),
             Keyboard Shortcuts (view and remap), and Advanced (log level, reset to defaults).

Priority: Low
Estimate: M
Status: Planned
Dependencies: US-0005, US-0006

Acceptance Criteria:
  - [ ] AC-0089: Settings panel is accessible via menu bar and a keyboard shortcut (Cmd/Ctrl + ,)
  - [ ] AC-0090: General section: user can change shell path, font family, font size, and scrollback limit
  - [ ] AC-0091: Appearance section: user can change theme mode and color scheme (same picker as US-0006)
  - [ ] AC-0092: AI Provider section: user can switch provider, update API key, select model, and test connection
  - [ ] AC-0093: Keyboard Shortcuts section: user can view all shortcuts; at least 5 are remappable
  - [ ] AC-0094: All changes take effect immediately without restarting the app
  - [ ] AC-0095: "Reset to defaults" restores all settings to factory values after confirmation

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Settings panel is fully keyboard-navigable
  - [ ] Accessibility audit passed (WCAG 2.1 AA)
  - [ ] Session Close Protocol completed
```

---

### US-0014 (EPIC-0003): Plugin / Extension System

```
US-0014 (EPIC-0003): As a developer, I want to build and install plugins that extend
TermnOS functionality, so that the community can contribute new features.

Description: A plugin API that allows third-party packages to register new AI providers,
             commands, themes, and UI panels. Plugins are npm packages installed into a
             designated plugins directory. A plugin manager UI lists installed plugins and
             allows install/uninstall. Plugins run in a sandboxed context with declared
             permissions — they cannot access arbitrary system resources without approval.

Priority: Low
Estimate: XL
Status: Planned
Dependencies: EPIC-0001, EPIC-0002 complete

Acceptance Criteria:
  - [ ] AC-0096: A public Plugin API is documented in architecture/ with stable versioned interfaces
  - [ ] AC-0097: A plugin can register a new AI provider that appears in the provider selector
  - [ ] AC-0098: A plugin can register a new color scheme that appears in the theme picker
  - [ ] AC-0099: Plugins are installed by placing an npm package in the plugins directory
  - [ ] AC-0100: A plugin manager UI lists installed plugins with name, version, and enable/disable toggle
  - [ ] AC-0101: Plugins run in a sandboxed context — they cannot access the filesystem or network beyond declared permissions
  - [ ] AC-0102: A malformed or crashing plugin does not crash the host app — errors are isolated and logged

Definition of Done (DOD):
  - [ ] All AC above are met
  - [ ] Plugin API documented in architecture/PLUGIN_API.md
  - [ ] At least one example plugin built and tested end-to-end
  - [ ] Security review: sandbox isolation verified
  - [ ] Session Close Protocol completed
```
