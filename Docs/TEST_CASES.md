# Docs/TEST_CASES.md — Test Case Register

> Human-readable test cases linked to user stories and acceptance criteria. One TC per AC minimum. See AGENTS.md §10 for format standards.

---

## US-0001: Terminal Shell Display & PTY Integration

```
TC-0001: App launches and displays a terminal pane
Related Story: US-0001
Related Task: TASK-0001
Related AC: AC-0001
Type: Functional
Preconditions: TermnOS is installed; no prior config exists
Steps:
  1. Launch the TermnOS application
  2. Observe the main window
Expected Result: A terminal pane is visible and ready for input
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0002: PTY connects to configured shell on startup
Related Story: US-0001
Related Task: TASK-0001
Related AC: AC-0002
Type: Functional
Preconditions: Shell is set to /bin/zsh (macOS default) in config
Steps:
  1. Launch TermnOS
  2. Observe the terminal prompt
Expected Result: Prompt matches the user's configured shell (e.g. zsh prompt character)
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0003: User can type and execute shell commands
Related Story: US-0001
Related Task: TASK-0001
Related AC: AC-0003
Type: Functional
Preconditions: Terminal pane is active
Steps:
  1. Click into the terminal pane
  2. Type: echo "hello world"
  3. Press Enter
Expected Result: "hello world" is printed to the terminal
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0004: stdout and stderr render with ANSI colour codes
Related Story: US-0001
Related Task: TASK-0001
Related AC: AC-0004
Type: Functional
Preconditions: Terminal pane is active
Steps:
  1. Run: ls --color=auto (or equivalent coloured output command)
  2. Observe output
Expected Result: Directory names and file types render with correct ANSI colours
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0005: Scrollback buffer retains at least 1000 lines
Related Story: US-0001
Related Task: TASK-0001
Related AC: AC-0005
Type: Functional
Preconditions: Terminal pane is active
Steps:
  1. Run a command that produces more than 1000 lines of output (e.g. seq 1 1100)
  2. Scroll up to the top of the output
Expected Result: Line 1 is still visible and accessible via scrollback
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0002: AI Natural Language → Command Interpretation

```
TC-0006: AI input bar is always visible
Related Story: US-0002
Related Task: TASK-0002
Related AC: AC-0006
Type: Functional
Preconditions: TermnOS is open with a configured AI provider
Steps:
  1. Launch TermnOS
  2. Resize the window to minimum size (800×600)
  3. Observe whether the AI input bar is visible
Expected Result: AI input bar is visible and accessible at all tested window sizes
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0007: Submitting natural language sends request to AI provider
Related Story: US-0002
Related Task: TASK-0002
Related AC: AC-0007
Type: Functional
Preconditions: Claude or OpenAI provider is configured and connected
Steps:
  1. Type "list all files in the current directory" into the AI input bar
  2. Press Enter or click Submit
Expected Result: A loading indicator appears; an AI response is received
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0008: AI response renders as command preview card
Related Story: US-0002
Related Task: TASK-0002
Related AC: AC-0008
Type: Functional
Preconditions: Previous step (TC-0007) succeeded
Steps:
  1. Submit "list all files in the current directory" to the AI
  2. Observe the rendered result
Expected Result: A preview card appears showing: the command (e.g. ls -la), a plain-English explanation, and a risk badge
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0009: Command is not executed until explicitly approved
Related Story: US-0002
Related Task: TASK-0002
Related AC: AC-0009
Type: Functional
Preconditions: AI has returned a command preview card
Steps:
  1. Observe the command preview card
  2. Do not click Approve
  3. Wait 10 seconds
Expected Result: No command has been executed in the terminal pane
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0010: AI response latency p95 under 2 seconds
Related Story: US-0002
Related Task: TASK-0002
Related AC: AC-0010
Type: Performance
Preconditions: Claude provider configured on a standard broadband connection
Steps:
  1. Submit 20 different natural language prompts
  2. Record time from submit to command preview card appearing
Expected Result: 95th percentile latency is below 2 seconds
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes: Log results to progress.md
```

```
TC-0011: Error shown when AI provider is unreachable
Related Story: US-0002
Related Task: TASK-0002
Related AC: AC-0011
Type: Negative
Preconditions: AI provider API key is valid but network is disconnected
Steps:
  1. Disconnect network
  2. Submit a natural language prompt
Expected Result: A clear human-readable error message is displayed; no crash or silent failure
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0003: Command Preview Panel

```
TC-0012: Command preview card appears after every AI interpretation
Related Story: US-0003
Related Task: TASK-0003
Related AC: AC-0012
Type: Functional
Preconditions: AI provider configured
Steps:
  1. Submit three different natural language prompts in sequence
  2. Observe after each submission
Expected Result: A command preview card appears after each AI response — no exceptions
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0013: Card displays command, explanation, and risk badge with text label
Related Story: US-0003
Related Task: TASK-0003
Related AC: AC-0013
Type: Functional
Preconditions: AI has returned a command preview card
Steps:
  1. Submit "show disk usage" to the AI
  2. Inspect the preview card
Expected Result: Card shows the command (e.g. df -h), a plain-English explanation, and a risk badge with both a colour indicator and a text label (e.g. "Safe")
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0014: Approve executes the command
Related Story: US-0003
Related Task: TASK-0003
Related AC: AC-0014
Type: Functional
Preconditions: Command preview card is showing "echo hello"
Steps:
  1. Click the "Approve" button (or press the approve keyboard shortcut)
Expected Result: "hello" is printed in the terminal pane; the preview card is dismissed
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0015: Edit makes the command text editable before execution
Related Story: US-0003
Related Task: TASK-0003
Related AC: AC-0015
Type: Functional
Preconditions: Command preview card is showing a command
Steps:
  1. Click the "Edit" button
  2. Modify the command text
  3. Click Approve
Expected Result: The modified command (not the original) is executed
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0016: Cancel dismisses the card without executing anything
Related Story: US-0003
Related Task: TASK-0003
Related AC: AC-0016
Type: Functional
Preconditions: Command preview card is showing a command
Steps:
  1. Click "Cancel" (or press Escape)
  2. Observe the terminal
Expected Result: Card is dismissed; no command is executed in the terminal
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0017: Risk badge pairs colour with text — not colour alone
Related Story: US-0003
Related Task: TASK-0003
Related AC: AC-0017
Type: Accessibility
Preconditions: Command preview card is visible with a non-safe risk level
Steps:
  1. Submit a caution-level command prompt (e.g. "stop the web server")
  2. Inspect the risk badge in the preview card
Expected Result: The badge shows both a colour indicator AND a text label (e.g. "Caution") — not colour alone
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0004: Destructive Command Detection & Confirmation

```
TC-0018: Destructive commands show a distinct confirmation modal
Related Story: US-0004
Related Task: TASK-0004
Related AC: AC-0018
Type: Functional
Preconditions: AI provider configured
Steps:
  1. Submit "delete all files in the downloads folder"
  2. Approve the command preview card
Expected Result: A confirmation modal distinct from the standard preview card appears before execution
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0019: Confirmation modal names the specific operation
Related Story: US-0004
Related Task: TASK-0004
Related AC: AC-0019
Type: Functional
Preconditions: A destructive command confirmation modal is displayed
Steps:
  1. Read the modal content
Expected Result: Modal text explicitly names the operation (e.g. "This will permanently delete files in ~/Downloads") — not a generic "are you sure?"
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0020: Confirmation requires a deliberate action — not just Enter
Related Story: US-0004
Related Task: TASK-0004
Related AC: AC-0020
Type: Functional
Preconditions: Destructive confirmation modal is displayed
Steps:
  1. Press Enter without clicking the confirm button
Expected Result: Command is NOT executed; modal remains open
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0021: Escape always aborts a destructive command
Related Story: US-0004
Related Task: TASK-0004
Related AC: AC-0021
Type: Functional
Preconditions: Destructive confirmation modal is displayed
Steps:
  1. Press Escape
  2. Observe the terminal
Expected Result: Modal closes; no command is executed
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0022: Non-destructive commands do not trigger confirmation modal
Related Story: US-0004
Related Task: TASK-0004
Related AC: AC-0022
Type: Functional
Preconditions: AI provider configured
Steps:
  1. Submit "show current directory"
  2. Approve the preview card
Expected Result: Command executes directly after Approve — no confirmation modal appears
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0005: AI Provider Configuration

```
TC-0023: User can select AI provider
Related Story: US-0005
Related Task: TASK-0005
Related AC: AC-0023
Type: Functional
Preconditions: TermnOS is open on the provider setup screen
Steps:
  1. Observe the provider selector
  2. Select each option: Claude, OpenAI, Ollama in turn
Expected Result: Each provider option is selectable and the UI updates to show the relevant configuration fields
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0024: API key input field masks the key
Related Story: US-0005
Related Task: TASK-0005
Related AC: AC-0024
Type: Functional
Preconditions: Claude or OpenAI provider is selected
Steps:
  1. Type a test API key into the key field
  2. Observe the field value
Expected Result: Characters are masked (shown as dots or asterisks) — key is not visible in plaintext
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0025: API key stored in OS keychain — not on disk in plaintext
Related Story: US-0005
Related Task: TASK-0005
Related AC: AC-0025
Type: Security
Preconditions: API key has been saved via the provider config UI
Steps:
  1. Inspect the config file on disk (~/.config/termnos/config.json or equivalent)
  2. Search for the API key string
Expected Result: API key string does not appear in any config file on disk
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes: Verify via OS keychain inspector (Keychain Access on macOS, Credential Manager on Windows)
```

```
TC-0026: Test connection validates key and model before saving
Related Story: US-0005
Related Task: TASK-0005
Related AC: AC-0026
Type: Functional
Preconditions: A valid API key is entered
Steps:
  1. Click "Test connection"
Expected Result: A success indicator appears; config is saved only after a successful test
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0027: Test connection with invalid key shows error
Related Story: US-0005
Related Task: TASK-0005
Related AC: AC-0026
Type: Negative
Preconditions: An invalid API key is entered
Steps:
  1. Click "Test connection"
Expected Result: A clear error is shown; config is not saved
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0028: Ollama option shows host URL field
Related Story: US-0005
Related Task: TASK-0005
Related AC: AC-0027
Type: Functional
Preconditions: Ollama is selected as the provider
Steps:
  1. Observe the configuration panel
Expected Result: A host URL field is shown with default value http://localhost:11434
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0029: Provider config persists across app restarts
Related Story: US-0005
Related Task: TASK-0005
Related AC: AC-0028
Type: Functional
Preconditions: Claude provider is configured and saved
Steps:
  1. Quit TermnOS
  2. Relaunch TermnOS
  3. Open provider configuration
Expected Result: Claude is still the selected provider; connection is active without re-entering the key
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0006: Theme Selector (Startup & Settings)

```
TC-0030: Theme picker appears on first launch
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0029
Type: Functional
Preconditions: TermnOS is launched for the first time (no config)
Steps:
  1. Launch TermnOS
Expected Result: Theme picker screen appears before the terminal pane is shown
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0031: User can select Dark, Light, or Auto mode
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0030
Type: Functional
Preconditions: Theme picker is displayed
Steps:
  1. Click "Dark"
  2. Click "Light"
  3. Click "Auto"
Expected Result: Each mode is selectable; the picker UI updates to reflect the selection
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0032: Selecting a mode shows the correct color schemes for that mode
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0031
Type: Functional
Preconditions: Theme picker is displayed
Steps:
  1. Select "Dark" mode — observe available schemes
  2. Select "Light" mode — observe available schemes
Expected Result: Dark mode shows 7 dark schemes; Light mode shows 5 light schemes; no cross-contamination
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0033: Live preview updates on hover
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0032
Type: Functional
Preconditions: Theme picker is displayed in Dark mode
Steps:
  1. Hover over "Dracula"
  2. Hover over "Nord"
Expected Result: The preview area updates to show the scheme colours in real time without clicking
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0034: Selected theme persists across restarts
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0033
Type: Functional
Preconditions: "Monokai" dark scheme has been selected and saved
Steps:
  1. Quit TermnOS
  2. Relaunch TermnOS
Expected Result: Terminal opens with Monokai applied — no theme picker shown again
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0035: Auto mode reacts to OS dark/light change at runtime
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0034
Type: Functional
Preconditions: "Auto" mode selected; OS is in Dark mode
Steps:
  1. Switch OS to Light mode via system settings
  2. Observe TermnOS within 100ms
Expected Result: TermnOS switches to the configured light color scheme without restart
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0036: Theme picker accessible from Settings menu at any time
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0035
Type: Functional
Preconditions: TermnOS is open with an active terminal session
Steps:
  1. Open Settings
  2. Navigate to Appearance section
Expected Result: Theme mode and color scheme selectors are present and functional
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0037: All color scheme pairs pass WCAG 2.1 AA contrast
Related Story: US-0006
Related Task: TASK-0006
Related AC: AC-0036
Type: Accessibility
Preconditions: All 12 color schemes are implemented
Steps:
  1. Run contrast ratio checks on each scheme's background/foreground pair
Expected Result: All 12 schemes achieve ≥ 4.5:1 contrast ratio for normal text
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes: Log results in findings.md
```

---

## US-0010: Multi-Tab Terminal Sessions (Splitter & Full-Window)

```
TC-0038: User can open multiple tabs via shortcut and tab bar button
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0037
Type: Functional
Preconditions: TermnOS is open with one terminal tab
Steps:
  1. Click the "+" button in the tab bar
  2. Open a second tab via Cmd/Ctrl+T keyboard shortcut
Expected Result: Both methods open a new independent terminal tab
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0039: Full-window mode switches active tab on click
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0038
Type: Functional
Preconditions: Three tabs are open in full-window mode
Steps:
  1. Click tab 2 in the tab bar
  2. Click tab 3
Expected Result: The full terminal window switches to display tab 2, then tab 3
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0040: Splitter mode allows horizontal and vertical splits
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0039
Type: Functional
Preconditions: TermnOS is open
Steps:
  1. Trigger horizontal split (e.g. Cmd/Ctrl+D)
  2. Trigger vertical split (e.g. Cmd/Ctrl+Shift+D)
Expected Result: Horizontal split shows two panes side-by-side; vertical split shows two panes stacked
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0041: Splitter dividers are draggable
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0040
Type: Functional
Preconditions: Two panes are open in splitter mode
Steps:
  1. Click and drag the divider between the two panes
Expected Result: The divider moves and both panes resize accordingly; content in each pane reflows
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0042: Each tab maintains an independent PTY session
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0041
Type: Functional
Preconditions: Two tabs are open
Steps:
  1. In tab 1: cd /tmp
  2. Switch to tab 2
  3. Run pwd
Expected Result: Tab 2 shows its own working directory (not /tmp from tab 1)
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0043: Closing a running tab shows confirmation
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0042
Type: Functional
Preconditions: A tab has a running process (e.g. sleep 30)
Steps:
  1. Click the close (×) button on that tab
Expected Result: A confirmation prompt appears asking whether to kill the running process
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0044: Tabs can be reordered by dragging
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0043
Type: Functional
Preconditions: Three tabs are open
Steps:
  1. Drag tab 3 to the first position in the tab bar
Expected Result: Tab order changes; the previously third tab is now first; PTY sessions are unaffected
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0045: Keyboard shortcut switches between tabs
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0044
Type: Functional
Preconditions: Three tabs are open
Steps:
  1. Press Cmd+2 (macOS) / Ctrl+2 (Windows/Linux)
  2. Press Cmd+3
Expected Result: Focus switches to tab 2, then tab 3
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0046: Mode toggle between splitter and full-window works
Related Story: US-0010
Related Task: TASK-0010
Related AC: AC-0045
Type: Functional
Preconditions: Two tabs are open in full-window mode
Steps:
  1. Click the mode toggle button in the tab bar
  2. Observe layout
  3. Toggle back
Expected Result: Layout switches between full-window and splitter modes without losing any tab sessions
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0015: Responsive Layout & Dynamic Resize

```
TC-0047: Terminal pane fills available space at any window size
Related Story: US-0015
Related Task: TASK-0015
Related AC: AC-0046
Type: Functional
Preconditions: TermnOS is open
Steps:
  1. Resize window to 800×600
  2. Resize window to 1920×1080
  3. Maximise the window
Expected Result: At every size the terminal pane fills all available space below the chrome
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0048: PTY receives SIGWINCH on window resize
Related Story: US-0015
Related Task: TASK-0015
Related AC: AC-0047
Type: Functional
Preconditions: vim is open inside the terminal pane
Steps:
  1. Resize the window
  2. Observe vim's layout
Expected Result: vim redraws to fill the new terminal dimensions immediately
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0049: All UI chrome accessible at minimum window size
Related Story: US-0015
Related Task: TASK-0015
Related AC: AC-0048
Type: Functional
Preconditions: TermnOS is open
Steps:
  1. Resize window to exactly 800×600
  2. Verify AI input bar, tab bar, and menu are visible and operable
Expected Result: No chrome elements are clipped or hidden at 800×600
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0050: Splitter panes resize proportionally on window resize
Related Story: US-0015
Related Task: TASK-0015
Related AC: AC-0049
Type: Functional
Preconditions: Two panes are open with a 60/40 split
Steps:
  1. Resize the window wider by 200px
Expected Result: Both panes grow proportionally maintaining the 60/40 ratio
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0051: No horizontal scrollbar on window chrome at any resolution
Related Story: US-0015
Related Task: TASK-0015
Related AC: AC-0050
Type: Functional
Preconditions: TermnOS is open
Steps:
  1. Test at: 800×600, 1280×800, 1920×1080, 2560×1440, 3440×1440
Expected Result: No horizontal scrollbar appears on the window chrome at any tested resolution
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0052: Layout tested at all specified resolutions
Related Story: US-0015
Related Task: TASK-0015
Related AC: AC-0051
Type: Functional
Preconditions: TermnOS is open
Steps:
  1. Resize to 800×600 — verify no clipping
  2. Resize to 1280×800 — verify no clipping
  3. Resize to 1920×1080 — verify no clipping
  4. Resize to 2560×1440 — verify no clipping
  5. Resize to 3440×1440 — verify no clipping
Expected Result: All resolutions render correctly with no overflow or clipped elements
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0016: Font Zoom (Keyboard Shortcut)

```
TC-0053: Cmd/Ctrl + Plus increases font size by 1px
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0052
Type: Functional
Preconditions: Font size is at default (14px)
Steps:
  1. Press Cmd + Plus (macOS) / Ctrl + Plus (Windows/Linux)
  2. Inspect font size
Expected Result: Font size increases to 15px; terminal content reflows
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0054: Font size does not exceed 24px
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0052
Type: Edge Case
Preconditions: Font size is at 24px (maximum)
Steps:
  1. Press Cmd/Ctrl + Plus
Expected Result: Font size remains at 24px — no further increase
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0055: Cmd/Ctrl + Minus decreases font size by 1px
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0053
Type: Functional
Preconditions: Font size is at 14px
Steps:
  1. Press Cmd + Minus (macOS) / Ctrl + Minus (Windows/Linux)
Expected Result: Font size decreases to 13px
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0056: Font size does not go below 10px
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0053
Type: Edge Case
Preconditions: Font size is at 10px (minimum)
Steps:
  1. Press Cmd/Ctrl + Minus
Expected Result: Font size remains at 10px — no further decrease
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0057: Cmd/Ctrl + 0 resets font size to default
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0054
Type: Functional
Preconditions: Font size has been changed to 20px
Steps:
  1. Press Cmd + 0 (macOS) / Ctrl + 0 (Windows/Linux)
Expected Result: Font size resets to 14px immediately
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0058: Font size change is immediate
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0055
Type: Functional
Preconditions: Terminal is active
Steps:
  1. Press Cmd/Ctrl + Plus
  2. Observe without restarting
Expected Result: Font size change is visible immediately in the terminal without any restart
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0059: Font size persists across app restarts
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0056
Type: Functional
Preconditions: Font size has been set to 18px via zoom shortcut
Steps:
  1. Quit TermnOS
  2. Relaunch TermnOS
Expected Result: Terminal opens with 18px font size
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0060: SIGWINCH sent to PTY after font zoom
Related Story: US-0016
Related Task: TASK-0016
Related AC: AC-0057
Type: Functional
Preconditions: htop is running in the terminal
Steps:
  1. Press Cmd/Ctrl + Plus to increase font size
  2. Observe htop
Expected Result: htop redraws to fit the new terminal column/row dimensions
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0007: Voice Dictation Input

```
TC-0061: Microphone button is visible in the AI input bar
Related Story: US-0007
Related Task: TASK-0007
Related AC: AC-0058
Type: Functional
Preconditions: TermnOS is open with a configured AI provider
Steps:
  1. Observe the AI input bar
Expected Result: A microphone icon/button is visible in or adjacent to the AI input bar
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0062: Microphone button activates voice capture with indicator
Related Story: US-0007
Related Task: TASK-0007
Related AC: AC-0059
Type: Functional
Preconditions: Microphone permission is granted
Steps:
  1. Click the microphone button
Expected Result: A recording indicator appears (e.g. pulsing animation or "Listening..." label)
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0063: Transcribed text appears in AI input field for editing
Related Story: US-0007
Related Task: TASK-0007
Related AC: AC-0060
Type: Functional
Preconditions: Voice capture is active
Steps:
  1. Speak: "list all python files in this directory"
  2. Stop speaking / click the mic button to stop
Expected Result: The transcribed text appears in the AI input field; user can edit it before submitting
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0064: Clicking mic again or pressing Escape cancels recording
Related Story: US-0007
Related Task: TASK-0007
Related AC: AC-0061
Type: Functional
Preconditions: Voice capture is active
Steps:
  1. Click the microphone button again (or press Escape)
Expected Result: Recording stops; input field is cleared; no command is submitted
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0065: Clear error shown when microphone permission is denied
Related Story: US-0007
Related Task: TASK-0007
Related AC: AC-0062
Type: Negative
Preconditions: Microphone permission is denied in OS settings
Steps:
  1. Click the microphone button
Expected Result: A clear error message explains that microphone access is denied and directs the user to OS settings
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0066: No audio stored to disk
Related Story: US-0007
Related Task: TASK-0007
Related AC: AC-0063
Type: Security
Preconditions: A voice dictation session has been completed
Steps:
  1. Inspect .tmp/ and application data directories after a voice session
Expected Result: No audio files are present; only the transcribed text was used
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0067: Voice input triggers the same AI interpret flow as typed input
Related Story: US-0007
Related Task: TASK-0007
Related AC: AC-0064
Type: Functional
Preconditions: Voice dictation has produced transcribed text in the input field
Steps:
  1. Submit the transcribed text
Expected Result: AI interpret flow runs identically to typed input — command preview card appears
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0008: Local Model Support via Ollama

```
TC-0068: Ollama provider shows host URL field with default
Related Story: US-0008
Related Task: TASK-0008
Related AC: AC-0065
Type: Functional
Preconditions: Ollama is selected as provider in settings
Steps:
  1. Observe the provider configuration panel
Expected Result: A "Host URL" field is visible and pre-populated with http://localhost:11434
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0069: Available local models fetched and displayed in dropdown
Related Story: US-0008
Related Task: TASK-0008
Related AC: AC-0066
Type: Functional
Preconditions: Ollama is running locally with at least two models pulled
Steps:
  1. Select Ollama as provider
  2. Click the model dropdown
Expected Result: The dropdown lists the locally available Ollama models
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0070: Test connection validates Ollama host and model
Related Story: US-0008
Related Task: TASK-0008
Related AC: AC-0067
Type: Functional
Preconditions: Ollama is running; a model is selected
Steps:
  1. Click "Test connection"
Expected Result: Success indicator appears confirming host is reachable and model is loaded
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0071: AI interpret works end-to-end with Ollama
Related Story: US-0008
Related Task: TASK-0008
Related AC: AC-0068
Type: Functional
Preconditions: Ollama provider is configured and connected
Steps:
  1. Submit "show all running processes" in the AI input bar
Expected Result: Command preview card appears with a valid command generated by the local Ollama model
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0072: Clear error when Ollama is unreachable
Related Story: US-0008
Related Task: TASK-0008
Related AC: AC-0069
Type: Negative
Preconditions: Ollama is NOT running; Ollama is the selected provider
Steps:
  1. Submit a natural language prompt
Expected Result: A clear error appears with a message that Ollama is unreachable and a link to setup docs
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0073: No external API calls when Ollama is the provider
Related Story: US-0008
Related Task: TASK-0008
Related AC: AC-0070
Type: Security
Preconditions: Ollama provider is configured; network monitoring is active
Steps:
  1. Submit a prompt using the Ollama provider
  2. Inspect outbound network traffic
Expected Result: All requests are made to localhost only — no external API endpoints are called
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0009: Command History with AI Context Memory

```
TC-0074: Executed commands are appended to session history
Related Story: US-0009
Related Task: TASK-0009
Related AC: AC-0071
Type: Functional
Preconditions: AI provider configured; at least one command has been executed
Steps:
  1. Execute "ls -la" via AI
  2. Inspect the AI request payload for the next prompt
Expected Result: The history field in the request payload contains "ls -la"
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0075: Last 20 commands included in AI request payload
Related Story: US-0009
Related Task: TASK-0009
Related AC: AC-0072
Type: Functional
Preconditions: 25 commands have been executed in one tab
Steps:
  1. Submit a 26th prompt and inspect the request payload
Expected Result: History contains the last 20 commands only; the first 5 are absent
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0076: History is scoped per tab
Related Story: US-0009
Related Task: TASK-0009
Related AC: AC-0073
Type: Functional
Preconditions: Two tabs are open; different commands run in each
Steps:
  1. Run "cd /tmp" in tab 1
  2. Switch to tab 2
  3. Submit a prompt and inspect the AI request payload
Expected Result: Tab 2's history does not include "cd /tmp" from tab 1
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0077: History is not persisted to disk
Related Story: US-0009
Related Task: TASK-0009
Related AC: AC-0074
Type: Functional
Preconditions: Commands have been run; app is then quit and relaunched
Steps:
  1. Run 5 commands
  2. Quit TermnOS
  3. Relaunch TermnOS
  4. Submit a prompt and inspect the AI request payload
Expected Result: History field is empty — no commands from the previous session are present
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0078: AI suggestions reference prior context
Related Story: US-0009
Related Task: TASK-0009
Related AC: AC-0075
Type: Functional
Preconditions: "git clone https://github.com/example/repo" has been run in this session
Steps:
  1. Submit: "now install the dependencies"
Expected Result: AI suggests "cd repo && npm install" or equivalent — demonstrating awareness of the clone
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes: Result may vary by model; verify intent is understood
```

```
TC-0079: Oldest history entries are dropped once limit is reached
Related Story: US-0009
Related Task: TASK-0009
Related AC: AC-0076
Type: Edge Case
Preconditions: 21 commands have been executed
Steps:
  1. Execute a 21st command
  2. Inspect the history field in the next AI request
Expected Result: History contains exactly 20 entries; the oldest (first) command has been dropped
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0011: OAuth Model Subscription Connection

```
TC-0080: OAuth option appears alongside API key field
Related Story: US-0011
Related Task: TASK-0011
Related AC: AC-0077
Type: Functional
Preconditions: Claude or OpenAI provider is selected in the provider UI
Steps:
  1. Observe the provider configuration panel
Expected Result: A "Connect with [Provider]" OAuth button is visible alongside the manual API key entry
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0081: OAuth button opens in-app browser to provider auth URL
Related Story: US-0011
Related Task: TASK-0011
Related AC: AC-0078
Type: Functional
Preconditions: Claude is selected; OAuth option is visible
Steps:
  1. Click "Connect with Claude"
Expected Result: An in-app browser window opens pointing to Anthropic's OAuth authorisation URL
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0082: Access token stored in OS keychain after OAuth
Related Story: US-0011
Related Task: TASK-0011
Related AC: AC-0079
Type: Security
Preconditions: OAuth flow completed successfully
Steps:
  1. Inspect config files on disk for the access token string
Expected Result: Access token is not present in any file on disk; it is stored in the OS keychain
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0083: Provider connection active after OAuth
Related Story: US-0011
Related Task: TASK-0011
Related AC: AC-0080
Type: Functional
Preconditions: OAuth completed
Steps:
  1. Click "Test connection"
Expected Result: Success — provider is connected and functional via OAuth token
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0084: Expired token refreshes automatically
Related Story: US-0011
Related Task: TASK-0011
Related AC: AC-0081
Type: Functional
Preconditions: OAuth token has expired (simulated)
Steps:
  1. Submit a prompt
Expected Result: Token is silently refreshed; the prompt succeeds without user intervention
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes: Requires ability to simulate token expiry in test environment
```

```
TC-0085: User can disconnect OAuth connection from settings
Related Story: US-0011
Related Task: TASK-0011
Related AC: AC-0082
Type: Functional
Preconditions: OAuth connection is active
Steps:
  1. Open Settings → AI Provider
  2. Click "Disconnect"
  3. Confirm the action
Expected Result: OAuth connection is revoked; provider shows as not connected; token is removed from keychain
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0012: Cross-Platform Packaging & Auto-Update

```
TC-0086: Installer produced for macOS
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0083
Type: Functional
Preconditions: Build pipeline runs on macOS
Steps:
  1. Run electron-builder for macOS target
  2. Locate the output .dmg file
  3. Install and launch the app
Expected Result: TermnOS installs and runs correctly on macOS from the .dmg
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0087: Installer produced for Windows
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0083
Type: Functional
Preconditions: Build pipeline runs on Windows
Steps:
  1. Run electron-builder for Windows target
  2. Run the .exe installer
  3. Launch the installed app
Expected Result: TermnOS installs and runs correctly on Windows
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0088: Installer produced for Linux
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0083
Type: Functional
Preconditions: Build pipeline runs on Linux
Steps:
  1. Run electron-builder for Linux target (.AppImage or .deb)
  2. Install and run
Expected Result: TermnOS installs and runs correctly on Linux
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0089: macOS installer is code-signed
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0084
Type: Functional
Preconditions: macOS .dmg has been built
Steps:
  1. Run: spctl --assess --verbose /path/to/TermnOS.app
Expected Result: Output shows "accepted" — app passes Gatekeeper
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0090: App notifies user when an update is available
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0085
Type: Functional
Preconditions: A newer version is available on GitHub Releases
Steps:
  1. Launch TermnOS (older version)
Expected Result: A notification or banner appears informing the user of the available update
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0091: Update downloads in background without blocking user
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0086
Type: Functional
Preconditions: Update notification is shown
Steps:
  1. Observe whether the app remains usable during download
Expected Result: Terminal and AI features remain fully functional while the update downloads
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0092: User is prompted to restart — update is not forced
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0087
Type: Functional
Preconditions: Update has downloaded
Steps:
  1. Observe the prompt after download completes
  2. Click "Later"
Expected Result: App continues running the current version; update applies on next restart
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0093: Auto-update works end-to-end from GitHub Release
Related Story: US-0012
Related Task: TASK-0012
Related AC: AC-0088
Type: Functional
Preconditions: A test release is published on GitHub
Steps:
  1. Run an older build
  2. Trigger update check
  3. Download and apply update
  4. Restart
Expected Result: App restarts as the new version; version number in About dialog is updated
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0013: Full Settings UI Panel

```
TC-0094: Settings accessible via menu bar and Cmd/Ctrl+,
Related Story: US-0013
Related Task: TASK-0013
Related AC: AC-0089
Type: Functional
Preconditions: TermnOS is open
Steps:
  1. Press Cmd+, (macOS) / Ctrl+, (Windows/Linux)
  2. Open via menu bar → Settings
Expected Result: Settings panel opens via both methods
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0095: General section allows shell and font configuration
Related Story: US-0013
Related Task: TASK-0013
Related AC: AC-0090
Type: Functional
Preconditions: Settings panel is open
Steps:
  1. Navigate to General section
  2. Change shell path to /bin/bash
  3. Change font size to 16px
  4. Save
Expected Result: New shell is used for the next opened tab; font updates immediately
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0096: Appearance section allows theme and scheme changes
Related Story: US-0013
Related Task: TASK-0013
Related AC: AC-0091
Type: Functional
Preconditions: Settings panel is open
Steps:
  1. Navigate to Appearance
  2. Change theme mode to Light
  3. Select "Tomorrow" scheme
Expected Result: Terminal immediately switches to the Tomorrow light scheme
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0097: AI Provider section allows full provider reconfiguration
Related Story: US-0013
Related Task: TASK-0013
Related AC: AC-0092
Type: Functional
Preconditions: Settings panel is open; Claude is configured
Steps:
  1. Navigate to AI Provider
  2. Switch to OpenAI, enter a key, and test connection
Expected Result: OpenAI becomes the active provider; AI interpret uses OpenAI from this point
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0098: Keyboard Shortcuts section shows all shortcuts
Related Story: US-0013
Related Task: TASK-0013
Related AC: AC-0093
Type: Functional
Preconditions: Settings panel is open
Steps:
  1. Navigate to Keyboard Shortcuts
Expected Result: A complete list of all keyboard shortcuts is displayed; at least 5 have a remap control
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0099: Settings changes take effect immediately
Related Story: US-0013
Related Task: TASK-0013
Related AC: AC-0094
Type: Functional
Preconditions: Settings panel is open
Steps:
  1. Change font size from 14px to 20px in General settings
  2. Observe the terminal pane in the background
Expected Result: Font size updates in the terminal immediately — no restart required
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0100: Reset to defaults restores factory settings after confirmation
Related Story: US-0013
Related Task: TASK-0013
Related AC: AC-0095
Type: Functional
Preconditions: Multiple settings have been changed from defaults
Steps:
  1. Click "Reset to defaults" in Settings
  2. Confirm in the confirmation dialog
Expected Result: All settings return to factory values (14px font, dark/Tomorrow Night, /bin/zsh, etc.)
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

---

## US-0014: Plugin / Extension System

```
TC-0101: Plugin API is documented with stable versioned interfaces
Related Story: US-0014
Related Task: TASK-0014
Related AC: AC-0096
Type: Functional
Preconditions: Plugin system is implemented
Steps:
  1. Open architecture/PLUGIN_API.md
Expected Result: Document describes all public plugin API methods, hooks, and the API version
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0102: Plugin can register a new AI provider
Related Story: US-0014
Related Task: TASK-0014
Related AC: AC-0097
Type: Functional
Preconditions: An example plugin that registers a mock provider is installed
Steps:
  1. Open provider selector in settings
Expected Result: The mock provider registered by the plugin appears in the provider list
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0103: Plugin can register a new color scheme
Related Story: US-0014
Related Task: TASK-0014
Related AC: AC-0098
Type: Functional
Preconditions: An example plugin that registers a custom scheme is installed
Steps:
  1. Open the theme picker
Expected Result: The custom scheme registered by the plugin appears in the scheme list
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0104: Plugin installed by placing npm package in plugins directory
Related Story: US-0014
Related Task: TASK-0014
Related AC: AC-0099
Type: Functional
Preconditions: A valid plugin npm package exists
Steps:
  1. Copy the plugin package to the plugins/ directory
  2. Restart TermnOS
Expected Result: Plugin is loaded and its features are available in the app
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0105: Plugin manager lists installed plugins with enable/disable toggle
Related Story: US-0014
Related Task: TASK-0014
Related AC: AC-0100
Type: Functional
Preconditions: Two plugins are installed
Steps:
  1. Open the plugin manager UI
Expected Result: Both plugins are listed with name, version, and an enable/disable toggle
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0106: Plugins cannot access filesystem or network beyond declared permissions
Related Story: US-0014
Related Task: TASK-0014
Related AC: AC-0101
Type: Security
Preconditions: A plugin that attempts unauthorised filesystem access is installed
Steps:
  1. Activate the plugin and trigger its filesystem access attempt
Expected Result: Access is denied; an error is logged; the host app continues running normally
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```

```
TC-0107: Crashing plugin does not crash the host app
Related Story: US-0014
Related Task: TASK-0014
Related AC: AC-0102
Type: Edge Case
Preconditions: A plugin that throws an unhandled exception on activation is installed
Steps:
  1. Enable the crashing plugin
Expected Result: The plugin fails gracefully; an error is shown in the plugin manager; other plugins and the host app continue working normally
Actual Result:
Status: [ ] Not Run
Defect Raised: None
Notes:
```
