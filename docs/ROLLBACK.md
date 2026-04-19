# docs/ROLLBACK.md — Rollback Procedure

> Rollback procedure for each release.

---

## Release: v0.1.0

### Date: 2026-04-18

### Rollback Trigger
- Code Editor (EPIC-0001) crashes on file open
- Syntax highlighting causes memory issues
- File save/load fails

### Steps
1. Revert to previous commit: `git revert HEAD`
2. Rebuild: `npm run build`
3. Test file open/save manually
4. Verify existing terminal tabs still work

### Post-Rollback
- Log incident in `progress.md`
- Open bugfix branch for root cause investigation

---

## Previous Versions

| Version | Tag | Notes |
|---------|-----|-------|
| — | — | First release, no previous |