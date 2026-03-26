# docs/LESSONS.md — Hard-Won Lessons & Permanent Rules

> Every significant bug fix or debugging session must produce a lesson encoded here. Format: **"[Never/Always] [specific behaviour].** *Learned when [brief description of failure].*"

---

## Lessons

**Always use `mockImplementationOnce` for single-throw mocks in Jest.** *Learned when `fs.writeFileSync.mockImplementation(() => { throw ... })` propagated into all subsequent test cases in the same block, causing a passing test ("get() reflects updated value after set()") to fail because it inherited the throw mock.*

**Spy on `console.warn` with a single-argument matcher when the code logs a single concatenated string.** *Learned when a test asserted `toHaveBeenCalledWith(stringContaining('E_PTY_WRITE'), expect.anything())` but the source code called `console.warn('E_PTY_WRITE: ...')` as one argument. Fix: use single-argument form of toHaveBeenCalledWith.*

**Always call `fitAddon.fit()` before sending `terminal:spawn` to the main process.** *Without fit(), the terminal reports the default 80×24 instead of the actual container dimensions. The PTY is then spawned with the wrong size, causing CLI tools to reflow incorrectly until the next resize event.*

**`contextIsolation: true` and `sandbox: true` must both be set — they are not the same protection.** *contextIsolation prevents renderer from accessing Node globals via the JS prototype chain. sandbox prevents Chromium renderer from directly calling OS APIs. Both are required; one does not imply the other.*

**Mock `global.document` and `global.window` before the module `require()` when testing renderer code in Node.** *Learned when `theme.js` calls `document.documentElement.style.setProperty` and `window.matchMedia` at runtime — the globals must exist before the module is loaded, not just inside test cases.*

**Jest `moduleNameMapper` silently redirects `src/*.js` → `dist/*.js` — always ensure `tsc` has been run before the test suite.** *Missing dist files produce confusing "Cannot find module" errors with no indication that the TypeScript source simply hasn't been compiled yet.*

**Explicitly list testable files in `collectCoverageFrom` rather than using a broad glob.** *A broad `dist/**/*.js` glob would pull in Electron entry points, preload scripts, and IPC handlers that require a full Electron runtime — inflating uncovered-line counts and making the 80% threshold impossible to hit in a Node test environment.*

**Never use `git rebase` across many commits when merging a feature branch with shared docs — use `git merge` instead.** *Rebasing an 8-commit US-0002 branch onto develop caused the same docs conflicts (ID_REGISTRY, BUGS.md) to resurface at every commit. A single `git merge origin/develop` resolves all conflicts once in one merge commit.*

**Never use `--delete-branch` with `gh pr merge` when that branch is the active worktree branch.** *The remote branch deletion succeeds but the local worktree cannot be cleaned up, causing an error. Omit the flag and clean up manually, or detach the worktree HEAD first.*

**Detach a worktree from a branch before squash-merging any PR that targets it.** *`gh pr merge` fails with "branch is already used by worktree" when the target branch (e.g. `develop`) is currently checked out in any worktree. Fix: `git -C .worktrees/US-XXXX checkout --detach HEAD` before merging.*

**`jest.mock()` calls inside `finally` blocks are silently ignored due to Jest hoisting.** *Learned when `jest.resetModules()` teardown placed inside `finally` had no effect. Fix: use a dedicated `describe` block with `beforeEach`/`afterEach` for module-reset tests.*

**Design DOM-dependent modules to accept refs as parameters, not close over globals, to enable Node-environment testing.** *Pure functions that receive `{ buttonEl, inputEl, ... }` objects can be tested in Node by passing plain mock objects — no jsdom required. Applied in `preview.ts` and `tabs.ts`.*

**Use `e.dataTransfer.setData/getData` instead of a module-level drag state variable for HTML5 drag-and-drop.** *A shared `_draggedTabId` variable is cleared when a drag crosses window boundaries, causing drop to silently fail. `dataTransfer` is scoped to the drag gesture itself and survives all cross-boundary scenarios.*

**Always clear `activePtys` (or equivalent tracking maps) in the PTY `onExit` handler, not just on explicit close.** *If the shell exits naturally (e.g. user types `exit`), the PTY entry stays in the map, causing spurious close-confirmation dialogs on subsequent tab operations.*

**When two parallel branches independently assign the same ID range (e.g. BUG-0001/0002), resolve by keeping the branch with the broader canonical set and renumbering the other.** *Both `fix/e2e-scrollback-race` and `feature/US-0002` assigned BUG-0001 and BUG-0002 to entirely different bugs. Resolution: keep US-0002's BUG-0001–0009 as canonical, renumber the e2e bugs as BUG-0010/0011 on develop.*
