# MIGRATION_LOG.md — Cross-Platform Change Tracking

> Log every change that must propagate to other platforms or modules. Every entry generates a debt ticket for platforms not yet updated.

---

## Log Format

```
## [DATE] — [Short description]
Files changed: [list]
Applies to: [platforms/modules]
What changed: [old vs. new]
Platform adaptations completed: [list or "N/A"]
Platform adaptations pending: [list or "None"]
```

---

## Entries

## 2026-03-14 — Shell detection defaults added to PtyManager

Files changed: `src/main/pty/manager.ts`
Applies to: macOS, Linux, Windows
What changed: `PtyManager.getDefaultShell()` now falls back to `/bin/zsh` on darwin and `/bin/bash` on linux when `$SHELL` is unset. On Windows falls back to `$COMSPEC` → `cmd.exe`.
Platform adaptations completed: All three platforms handled in the same method.
Platform adaptations pending: None.

## 2026-03-14 — Font zoom keyboard shortcuts (Cmd vs Ctrl)

Files changed: `src/renderer/index.ts`
Applies to: macOS (Cmd), Windows/Linux (Ctrl)
What changed: Font zoom uses `e.metaKey || e.ctrlKey` to support both platforms with a single handler.
Platform adaptations completed: macOS (metaKey) and Windows/Linux (ctrlKey) both handled.
Platform adaptations pending: None — test on Windows when packaging begins (US-0012).

## 2026-03-14 — jest.config.js collectCoverageFrom expanded

Files changed: `jest.config.js`
Applies to: All CI environments, local dev
What changed: `collectCoverageFrom` previously only covered `tools/lib/**/*.js`. Now also covers 7 `dist/` modules compiled from TypeScript source. The 80% global threshold now enforces coverage across both JS utilities and compiled TypeScript.
Platform adaptations completed: CI (`ci.yml`) already runs `npm run test:coverage` — no workflow changes needed.
Platform adaptations pending: None.

## 2026-03-14 — plan-visualizer.yml docs path corrected

Files changed: `.github/workflows/plan-visualizer.yml`
Applies to: GitHub Actions
What changed: `paths:` trigger and `upload-pages-artifact path:` changed from `./docs` (lowercase) to `./Docs` (capital D) to match the actual case-sensitive directory on Linux runners.
Platform adaptations completed: GitHub Actions.
Platform adaptations pending: None.
