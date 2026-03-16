# Docs/LESSONS.md — Hard-Won Lessons & Permanent Rules

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
