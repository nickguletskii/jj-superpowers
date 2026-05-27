---
name: capturing-workflow-friction
description: Use when command guidance, reusable tooling, or codebase documentation was missing or unclear during work
---

# Capturing Workflow Friction

Log small maintenance signals without blocking the main task.

## When to Use

Use this skill when one of these happens:

- A command failed or stalled because existing skill guidance was missing or unclear.
- You needed a reusable tool or script that does not exist.
- You spent significant effort tracing code that a focused document should have explained.

Do not use this for simple recall failures or minor lookups.

## Choose the Entry Type

| Situation | Type | Directory |
|---|---|---|
| Missing or unclear command/skill guidance | `wish-i-knew` | `docs/superpowers/wishiknew/` |
| Missing reusable tool or script | `wish-i-had` | `docs/superpowers/wishihad/` |
| Missing focused codebase documentation | `doc-wishlist` | `docs/superpowers/docwishlist/` |

## Process

1. Get a timestamp: `date +%Y-%m-%dT%H%M%S`.
2. Choose a short slug.
3. Create one markdown entry in the matching directory.
4. Continue the original task.

## Templates

### `wish-i-knew`

```markdown
---
type: wish-i-knew
date: <timestamp>
---

**Command invoked:** `<command>`
**What went wrong:** <failure or unexpected behavior>
**What information would have prevented this:** <needed guidance>
**Gap type:** content gap / clarity gap
**Candidate skill to update:** <skill name or "new skill needed">
```

### `wish-i-had`

```markdown
---
type: wish-i-had
date: <timestamp>
---

**Task being performed:** <task>
**Tool/script needed:** <name or description>
**What it should do:** <purpose>
**Expected inputs:** <inputs or "none">
**Expected output format:** <format and destination>
```

### `doc-wishlist`

```markdown
---
type: doc-wishlist
date: <timestamp>
---

**What I was trying to understand:** <question>
**Exploration required:** <files read or paths traced>
**Proposed document title:** <title>
**Proposed file path:** <path>
**Proposed outline:**
- <section>
```
