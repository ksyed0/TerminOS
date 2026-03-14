# PROJECT.md — Project Constitution

> This is the single source of truth for this project's goals, architecture, schemas, rules, and design system. Read this file at the start of every session. Update it whenever a schema changes, a rule is added, or architecture is modified.

---

## § 1. Discovery Questions (Phase 1 — Blueprint)

Answer all five questions before any code is written.

| # | Question | Answer |
|---|----------|--------|
| 1 | **North Star:** What is the singular desired outcome? | _TBD_ |
| 2 | **Integrations:** Which external services are needed? Are credentials ready? | _TBD_ |
| 3 | **Source of Truth:** Where does the primary data live? | _TBD_ |
| 4 | **Delivery Payload:** How and where should the final result be delivered? | _TBD_ |
| 5 | **Behavioral Rules:** How should the system act? (tone, logic constraints, "Do Not" rules) | _TBD_ |

---

## § 2. Data Schema

> Define all input/output JSON shapes before coding begins.

### Input Schema

```json
{
  "_comment": "Define input payload shape here"
}
```

### Output Schema

```json
{
  "_comment": "Define output payload shape here"
}
```

---

## § 3. Architectural Invariants

Rules that must never be violated regardless of feature scope:

- _TBD — add invariants as the project is defined_

---

## § 4. API Design

Base URL: `TBD`
Version: `v1`

All responses follow the envelope structure:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "version": "1.0", "timestamp": "ISO8601" }
}
```

### Endpoints

| Method | Path | Description | Story |
|--------|------|-------------|-------|
| — | — | _TBD_ | — |

---

## § 5. User Profile

> All UI and UX decisions must be validated against this profile.

| Attribute | Value |
|-----------|-------|
| Technical level | _TBD_ |
| Primary device | _TBD_ |
| Usage context | _TBD_ |
| Mental model | _TBD_ |
| Key pain points | _TBD_ |
| Accessibility needs | _TBD_ |

---

## § 6. Design System

> All UI work must comply with these specifications. Do not rely on memory of previous implementations.

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| _TBD_ | — | — | — |

### Colour Palette

| Name | Hex | Usage |
|------|-----|-------|
| _TBD_ | — | — |

### Component Patterns

- _TBD — document reusable component patterns here_

### Reference Implementations

- _TBD — link to named reference screens or components_

---

## § 7. Logging & Monitoring

| Environment | Log destination | Log level |
|-------------|-----------------|-----------|
| Development | Console (human-readable) | DEBUG |
| Production | _TBD_ | INFO |

---

## § 8. Performance Baselines

Inherited from AGENTS.md §17. Override here if project requirements differ:

| Metric | Target |
|--------|--------|
| API response time (p95) | < 500ms |
| Page / screen initial load | < 3 seconds |
| Time to Interactive (web) | < 4 seconds |
| Database query time (p95) | < 100ms |
| Background job | < 30 seconds |

---

## § 9. Maintenance Log

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1.0 | 2026-03-14 | Initial project constitution created | Agent |
