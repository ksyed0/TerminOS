# Docs/BUGS.md — Bug & Defect Register

> All bugs and defects tracked here with BUG-XXXX identifiers. See AGENTS.md §9 for format standards.

---

## Open Bugs

_No open bugs._

---

## Closed Bugs

```
BUG-0001: onOutput IPC listener registered per tab but never unsubscribed
Severity: High
Related Story: US-0001
Related Task: TASK-0009
Steps to Reproduce:
  1. Open 3 tabs in sequence, closing each before opening the next
  2. Open a 4th tab and run a command
Expected: One listener handles terminal output for the active tab
Actual: N ghost listeners remain after N tab open/close cycles; all fire on every output
        event, writing to disposed Terminal instances
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0002: submitAIRequest silently swallows IPC rejection — no error feedback shown
Severity: Medium
Related Story: US-0002
Related Task: TASK-0009
Steps to Reproduce:
  1. Simulate window.terminalAPI.interpret() throwing (e.g. preload bridge failure)
  2. Submit a natural language prompt
Expected: Error message shown to user in terminal
Actual: try/finally restores UI; result stays undefined; guard `if (!result) return`
        exits silently — user sees nothing
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0003: activateTab reads stale activeTabId when computing split-pane visibility
Severity: Medium
Related Story: US-0001
Related Task: TASK-0009
Steps to Reproduce:
  1. Open two tabs in split mode
  2. Click to activate the non-active tab
Expected: Both panes remain visible; correct tab is focused
Actual: otherSplitId is computed from the old activeTabId before it is updated, so the
        wrong pane may be hidden on activation
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0004: configuredShell uses || instead of ?? — empty-string auto-detect is silently overridden
Severity: Medium
Related Story: US-0002
Related Task: TASK-0009
Steps to Reproduce:
  1. In Settings, clear the shell field (empty string = auto-detect per DEFAULT_CONFIG comment)
  2. Save and submit a natural language prompt
Expected: Empty string is passed through; shell auto-detection runs
Actual: || coalesces empty string to '/bin/zsh', overriding the user's intent; inconsistent
        with all other config fields in init() which use ??
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0005: architecture/ipc-channels.md schemas missing tabId from 5 channel definitions
Severity: Medium
Related Story: US-0001
Related Task: TASK-0009
Steps to Reproduce:
  1. Read schemas for terminal:input, terminal:resize, terminal:output, terminal:exit, ai:execute
     in architecture/ipc-channels.md
  2. Compare with handlers.ts and preload/index.ts
Expected: Schemas reflect the actual tabId field used in every channel
Actual: tabId is absent from all 5 schemas despite being required by both the handler and preload
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0006: ipc-channels.md Security Rule §5 claims payload validation but handlers implement none
Severity: Medium
Related Story: US-0001
Related Task: TASK-0009
Steps to Reproduce:
  1. Read architecture/ipc-channels.md Security Rules §5
  2. Send a malformed IPC payload (e.g. missing tabId) to any handler
Expected: Handler returns { error: 'E_IPC_PAYLOAD' }
Actual: No validation exists; malformed payloads silently no-op
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0007: ai:interpret handler never emits E_AI_TIMEOUT — hung providers block indefinitely
Severity: Low
Related Story: US-0002
Related Task: TASK-0009
Steps to Reproduce:
  1. Point Ollama host to a server that accepts connections but never responds
  2. Submit a natural language prompt
Expected: E_AI_TIMEOUT returned after a timeout period
Actual: provider.interpret() awaits indefinitely; E_AI_TIMEOUT (documented in
        ERROR_TAXONOMY.md) is never raised
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0008: Error display reads res.message without null guard — shows "[AI Error] undefined"
Severity: Low
Related Story: US-0002
Related Task: TASK-0009
Steps to Reproduce:
  1. Return an IPC error response that has error but omits message
  2. Observe the terminal
Expected: Meaningful error text or fallback to the error code
Actual: Terminal shows "[AI Error] undefined"
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0009: ai:execute test beforeAll/beforeEach interaction — fragile accidental pass
Severity: Low
Related Story: US-0002
Related Task: TASK-0010
Steps to Reproduce:
  1. Add an assertion on mockPtyOnData.toHaveBeenCalled() inside the ai:execute describe block
  2. Run the test suite
Expected: Assertion passes (onData was called during spawn)
Actual: jest.clearAllMocks() in the outer beforeEach clears mockPtyOnData before each test;
        the assertion fails because the call from beforeAll was cleared
Status: Fixed
Fix Branch: feature/US-0002-ai-nl-command-interpret
Lesson Encoded: No
```

```
BUG-0010: e2e scrollback test — xterm.js async render race causes bufferLength = 43
Severity: Medium
Related Story: US-0001
Related Task: TASK-0013
Steps to Reproduce:
  1. Run the AC-0005 e2e test on CI (Ubuntu, headless Electron).
  2. `seq 1 1100` is typed and Enter is pressed.
  3. waitForFunction waits for __e2eOutput to include '1100' (raw PTY bytes).
  4. page.evaluate immediately reads term.buffer.active.length.
Expected: bufferLength >= 1000 (xterm.js scrollback: 1000 is configured).
Actual: bufferLength = 43 (viewport row count). xterm.js had not yet flushed
        its internal async write queue when the evaluate ran.
Status: Fixed
Fix Branch: claude/us-0001-ac0005-scrollback
Fix: Replace two-step approach (wait for raw PTY string, then read buffer) with
     a single waitForFunction that polls term.buffer.active.length >= 1000,
     ensuring xterm.js finishes rendering before the assertion runs.
Lesson Encoded: No
```

```
BUG-0011: e2e scrollback test — stale __e2eOutput accumulator causes false positive / retry timeout
Severity: Low
Related Story: US-0001
Related Task: TASK-0013
Steps to Reproduce:
  1. Tests run in sequence: Test 3 (PTY round-trip) then Test 4 (scrollback).
  2. Test 3 initialises __e2eOutput = '' and registers an onOutput listener.
  3. Test 4 does NOT reset __e2eOutput before typing `seq 1 1100`.
  4. On first attempt: stale data from Test 3 may cause waitForFunction to
     resolve instantly (false positive), then bufferLength assertion fails.
  5. On retry: Playwright restarts state; __e2eOutput is undefined/empty,
     so '1100' must actually arrive — but seq 1 1100 exceeds the 30s test
     timeout on a slow CI runner.
Expected: Each test operates on a clean accumulator; no stale data interference.
Actual: Test 4 inherited __e2eOutput from Test 3, causing inconsistent behaviour
        between first run and retry.
Status: Fixed
Fix Branch: claude/us-0001-ac0005-scrollback
Fix: Reset __e2eOutput = '' at the start of Test 4 before typing the command.
     (BUG-0010 fix also removes the dependency on __e2eOutput for the assertion.)
Lesson Encoded: No
```

---

## Format Reference

```
BUG-[0001]: [Short description of the defect]
Severity: [Critical | High | Medium | Low]
Related Story: US-[XXXX]
Related Task: TASK-[XXXX]
Steps to Reproduce:
  1. [Step]
  2. [Step]
Expected: [What should happen]
Actual: [What actually happened]
Status: [Open | In Progress | Fixed | Verified | Closed]
Fix Branch: [bugfix/BUG-0001-short-description]
Lesson Encoded: [Yes — see Docs/LESSONS.md | No]
```
