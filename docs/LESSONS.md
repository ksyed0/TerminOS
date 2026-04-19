# docs/LESSONS.md — Hard-Won Lessons

> Permanent guardrail rules encoded from bugs and debugging.

---

## 2026-04-18

### Lesson 1

**"Never skip AGENTS.md initialization protocol."** 

*Learned when: Started implementing EPIC-0001 without reading PROJECT.md first, didn't use proper branches, didn't write tests alongside code.*

**Rule:** Always follow Protocol 0 at session start. Use brainstorming skill before building features.

---

### Lesson 2

**"OpenAI provider must support custom base URLs for LM Studio."**

*Learned when: User tried to connect to LM Studio on localhost:1234 but OpenAI provider hardcoded api.openai.com.*

**Rule:** Add baseURL support to OpenAI provider for local/regional model servers.

---

### Lesson 3

**"Show provider-specific fields dynamically in settings UI."**

*Learned when: Ollama host field only appeared for Ollama provider, not OpenAI.*

**Rule:** Show the host field for both Ollama and OpenAI providers in settings.

---

### Lesson 4

**"RELEASE_PLAN in wrong location causes test failures."**

*Learned when: tests/unit/parse-release-plan.test.js was hardcoded for 2 epics, we added 6.*

**Rule:** Update test expectations when updating RELEASE_PLAN.

---

*Updated: 2026-04-18*