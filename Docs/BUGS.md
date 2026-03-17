# Docs/BUGS.md — Bug & Defect Register

> All bugs and defects tracked here with BUG-XXXX identifiers. See AGENTS.md §9 for format standards.

---

## Open Bugs

_No open bugs._

---

## Closed Bugs

```
BUG-0001: e2e scrollback test — xterm.js async render race causes bufferLength = 43
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
BUG-0002: e2e scrollback test — stale __e2eOutput accumulator causes false positive / retry timeout
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
     (BUG-0001 fix also removes the dependency on __e2eOutput for the assertion.)
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
