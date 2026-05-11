# Design: "I Wish I Knew", "I Wish I Had", and "Doc Wishlist" Systems

## Goal

Give agents and subagents a lightweight mechanism to surface three kinds of gaps:

1. **"I wish I knew"** — command invocation issues that could have been prevented by information in a skill. This covers two sub-cases: (a) the information is genuinely absent from all skills, or (b) a skill has the relevant information but its phrasing or trigger condition wasn't clear enough for the agent to recognise it should be used. Does NOT cover forgetting something a skill already documents clearly.
2. **"I wish I had"** — reusable tools or scripts the agent needed but didn't have, which could become skills or utilities for future sessions.
3. **"Doc wishlist"** — proposed codebase documentation that would have eliminated the need to explore or read lots of code, helping future sessions navigate the project more efficiently.

Agents log these findings to files for the user to review manually. No action is required at log time — agents write and continue.

---

## New Skills

### `skills/wish-i-knew/SKILL.md`

**Trigger:** An agent encounters a command invocation issue that could have been prevented by information in a skill, AND one of the following is true:
- The relevant information is genuinely absent from all existing skills, OR
- A skill has the relevant information but its phrasing or trigger condition wasn't clear enough that the agent recognised it should be used at the right moment.

Do NOT log if the issue simply stems from forgetting something a skill already documents clearly.

**What to write:**
- What command was invoked and what went wrong
- What information would have prevented it
- Which existing skill is the best candidate to receive or improve that information, or "new skill needed" if none applies
- Whether this is a **content gap** (information missing) or a **clarity gap** (information present but not surfaced clearly)
- One-sentence summary for the filename slug

**Output location:** `docs/superpowers/wishiknew/`

**File naming:** `YYYY-MM-DDTHHMMSS-descriptive-slug.md`

**File format:**
```markdown
---
type: wish-i-knew
date: YYYY-MM-DDTHHMMSS
---

**Command invoked:** `<the command that failed or misbehaved>`

**What went wrong:** <description of the failure or unexpected behavior>

**What information would have prevented this:** <what the agent needed to know>

**Gap type:** content gap | clarity gap

**Candidate skill to update:** <skill name, or "new skill needed">
```

**Behavior:** Write file, then continue with the task. Do not block on this.

---

### `skills/wish-i-had/SKILL.md`

**Trigger:** An agent wishes it had a reusable tool or script to perform part of its work — something that doesn't exist yet and would benefit future agents.

**What to write:**
- What task was being performed
- What the tool/script should do
- Expected inputs with format
- Expected output format
- One-sentence summary for the filename slug

**Output location:** `docs/superpowers/wishihad/`

**File naming:** `YYYY-MM-DDTHHMMSS-descriptive-slug.md`

**File format:**
```markdown
---
type: wish-i-had
date: YYYY-MM-DDTHHMMSS
---

**Task being performed:** <what the agent was doing>

**Tool/script needed:** <name or short description>

**What it should do:** <description of the tool's purpose>

**Expected inputs:**
- `<input-name>` (`<format>`): <description>

**Expected output format:** <description of output — format, structure, where it goes>
```

**Behavior:** Write file, then continue with the task. Do not block on this.

---

### `skills/doc-wishlist/SKILL.md`

**Trigger:** An agent spent significant effort exploring or reading code to understand something that a short, focused documentation file could have explained immediately — and no such document exists in the project.

**What to write:**
- What the agent was trying to understand
- How much exploration was required (files read, code traced)
- Proposed document: title, suggested file path in the project, and a brief outline of what it should contain
- One-sentence summary for the filename slug

Each entry proposes one documentation file. If multiple distinct documents were missing, create one entry per document.

**Output location:** `docs/superpowers/docwishlist/`

**File naming:** `YYYY-MM-DDTHHMMSS-descriptive-slug.md`

**File format:**
```markdown
---
type: doc-wishlist
date: YYYY-MM-DDTHHMMSS
---

**What I was trying to understand:** <the question or concept the agent needed to grasp>

**Exploration required:** <files read, code traced, time spent — brief summary>

**Proposed document title:** <a short, descriptive title>

**Proposed file path:** <where it should live in the project, e.g. `docs/architecture/auth-flow.md`>

**Proposed outline:**
- <section or bullet — one line each, enough to convey what the doc should cover>
- ...
```

**Behavior:** Write file, then continue with the task. Do not block on this.

---

## Injection Points

A short "Reporting Gaps" section is added to each of the following files:

### Agent-facing skills (main orchestrators)
- `skills/using-superpowers/SKILL.md`
- `skills/executing-plans/SKILL.md`

### Subagent prompt templates
- `skills/subagent-driven-development/implementer-prompt.md`
- `skills/subagent-driven-development/spec-reviewer-prompt.md`
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

### Injected block (wording varies slightly per context)

```
## Reporting Gaps

**If you encounter a command invocation issue** that could have been prevented by
information in a skill, invoke **superpowers:wish-i-knew** to log it — but only if:
- the relevant information is genuinely absent from existing skills, OR
- a skill has the information but its phrasing or trigger condition wasn't clear
  enough that you recognised you should use it at the right moment.
Do NOT log issues caused by simply forgetting something a skill already documents clearly.

**If you wish you had a reusable tool or script** to help perform your work,
invoke **superpowers:wish-i-had** to log it.

**If you spent significant effort exploring or reading code** to understand something
that a short documentation file could have explained, invoke **superpowers:doc-wishlist**
to propose that document.

Log and continue — do not block your task on this.
```

---

## Output Directories

| Directory | Contents |
|---|---|
| `docs/superpowers/wishiknew/` | "I wish I knew" entries |
| `docs/superpowers/wishihad/` | "I wish I had" entries |
| `docs/superpowers/docwishlist/` | "Doc wishlist" entries |

Both directories are created as needed by the first agent to write an entry.

---

## Out of Scope

- Automated integration of entries into skills (manual review by user)
- Deduplication of entries
- Any tooling to browse or summarize entries
