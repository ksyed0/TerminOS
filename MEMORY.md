# MEMORY.md — Persistent Knowledge Base

> Organized by topic. Update or remove entries that are wrong or outdated. Do not write duplicates. Read this file at the start of every session.

---

## Active Dependencies

| Package | Version | Purpose | Licence |
|---------|---------|---------|---------|
| — | — | _None yet_ | — |

---

## API Signatures

_No APIs defined yet. Add entries as integrations are built._

---

## Retry Parameters

| Operation | Max Retries | Backoff Strategy |
|-----------|------------|-----------------|
| HTTP requests (transient errors) | 4 | Exponential: 2s, 4s, 8s, 16s |
| Git push (network failures) | 4 | Exponential: 2s, 4s, 8s, 16s |

---

## Deprecated Endpoints

_None._

---

## Cached Data

| What | Layer | TTL | Invalidation Strategy |
|------|-------|-----|-----------------------|
| — | — | — | — |

---

## Hard-Won Lessons (Quick Reference)

> Full details in `Docs/LESSONS.md`.

_None yet._

---

## Architecture Notes

_Add topic-specific notes here as the project evolves._
