# architecture/ERROR_TAXONOMY.md — Project Error Taxonomy

> Defines the project-wide error hierarchy. All application code must use these categories consistently. See AGENTS.md §13 for full error handling rules.

---

## Error Classes

### ValidationError
**When to use:** Bad input from the user or external system — the data does not conform to the expected shape, type, or business rule.

**Handling:**
- Catch at the boundary (API layer, form validation)
- Return HTTP 400 with a human-readable, actionable message
- Do not log stack trace (expected failure path)

**Example:** Missing required field, value out of allowed range, malformed date string.

---

### IntegrationError
**When to use:** An external service (API, database, third-party tool) failed to respond correctly.

**Handling:**
- Implement exponential backoff retry (parameters in `MEMORY.md`)
- Log with full context: service name, endpoint, response code, correlation_id
- Return HTTP 502/503 to caller after retries exhausted
- Alert monitoring service on repeated failures

**Example:** Database connection timeout, third-party API returned 500, webhook delivery failed.

---

### BusinessLogicError
**When to use:** A domain rule or constraint was violated — the inputs were valid but the requested operation is not permitted.

**Handling:**
- Catch at the service/navigation layer
- Return HTTP 422 with a clear explanation of which rule was violated
- Do not retry — this is a deterministic failure

**Example:** Attempting to close a story that does not meet the DOD, duplicate artefact ID assignment.

---

### SystemError
**When to use:** Unexpected internal failure with no other applicable category. Catch-all; should be rare if other categories are applied correctly.

**Handling:**
- Log with full stack trace and correlation_id
- Return HTTP 500 with a generic user-facing message — never expose internals
- Alert on-call / monitoring immediately
- Investigate root cause and encode fix in `Docs/LESSONS.md`

**Example:** Unhandled exception, null pointer in unexpected code path, file system failure.

---

## HTTP Status Code Reference

| Status | Meaning | Error Class |
|--------|---------|-------------|
| 400 | Bad Request | ValidationError |
| 401 | Unauthorized | SecurityError (extend if needed) |
| 403 | Forbidden | SecurityError (extend if needed) |
| 404 | Not Found | BusinessLogicError |
| 422 | Unprocessable Entity | BusinessLogicError |
| 429 | Too Many Requests | IntegrationError (rate limit) |
| 500 | Internal Server Error | SystemError |
| 502 | Bad Gateway | IntegrationError |
| 503 | Service Unavailable | IntegrationError |
