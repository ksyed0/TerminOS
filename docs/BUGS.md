# BUGS.md — Fixture

BUG-0001: Editor crashes on empty file
Severity: High
Related Story: US-0001
Related Task: TASK-0001
Steps to Reproduce:
  1. Open empty file
Expected: Editor renders
Actual: App crashes
Status: Open
Fix Branch: bugfix/BUG-0001-empty-file-crash
Lesson Encoded: No
Estimated Cost USD: 0.35

---

BUG-0002: Core Terminal Non-Functional
Severity: Critical
Related Story: US-0000 (EPIC-0000)
Steps to Reproduce:
  1. Launch app
  2. Press Cmd+T or click "+" to add tab
Expected: New terminal tab appears with shell prompt
Actual: Nothing happens - no tab created, no output, no response to Return key
Status: Fixed
Fix Branch: bugfix/BUG-0002-terminal-broken
Resolution: 
  - Changed sandbox:false in BrowserWindow (node-pty requires unsandboxed process)
  - Fixed insertBefore() DOM issue (newTabBtn was grandchild, not child)
  - Increased AI timeout to 45s for slower models
  - Added fallback for OpenAI JSON format on unsupported models
