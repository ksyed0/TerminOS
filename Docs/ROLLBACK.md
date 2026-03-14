# Docs/ROLLBACK.md — Rollback Procedures

> A rollback plan must be documented here before any deployment begins. See AGENTS.md §20 for rules and the full pre-deployment checklist.

---

## Pre-Deployment Checklist

- [ ] Current production version is tagged in Git
- [ ] Database migrations are reversible (up + down)
- [ ] Rollback procedure documented below for this release
- [ ] Smoke test plan defined
- [ ] Monitoring and alerting active before traffic switch

---

## Rollback Procedures

_No releases deployed yet. Add a section per release using the template below._

---

## Template

```
Release: [version]
Date: [deployment date]
Rollback trigger: [conditions that would require a rollback]

Steps:
1. [Revert Git tag / redeploy previous version]
2. [Reverse database migrations if applicable]
3. [Invalidate caches if applicable]
4. [Verify smoke tests pass on restored version]
5. [Notify stakeholders]

Post-rollback:
- Log incident in progress.md with timeline, root cause, and resolution.
- Open a bugfix/* branch to address the root cause before re-attempting deployment.
```
