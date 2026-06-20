---
name: writing-comments
description: Use when writing or editing code comments, when a request asks for "well-documented" or "well-commented" code, and when cleaning up existing comments. Covers comments that restate the code/signature, verbose multi-sentence prose, and references to transient artifacts (ticket/Jira/task IDs, PR numbers, handoff/spec/doc file paths, "created for X", dates-written). Triggers on "clean up comments", "improve docs", "deslopify comments".
---

# Writing Comments

## Overview

A comment earns its place only by adding context the code cannot carry itself. Most code needs none.

**Core principle:** Comment the *why* and the *non-obvious*. Never the *what*. Never anything that rots.

This is a discipline (applied every time you write code) AND a cleanup mode (applied on request). For broad code cleanup beyond comments → `jj-superpowers:deslopify`.

## The Three Rules

### 1. No transient artifacts

A comment lives as long as the code. Anything that will outlive its referent — or rot into a dead pointer — does not belong in a comment.

**Forbidden in comments:**
- Ticket / task / Jira / issue IDs (`TASK-1029`, `PROJ-991`, `JIRA-44`)
- PR or commit references, review-thread mentions
- Paths to docs/specs/handoffs/agent-blog files (`docs/superpowers/handoffs/...`, `docs/.../design.md §3.2`)
- "Created for X", "Added in sprint Y", author names, dates-written
- `TODO(ticket)` / `FIXME(ticket)` — describe the work, not the tracker

**Why:** These are provenance, and provenance lives in version control, not in the source. Git blame, PR history, and the tracker already hold it. In the code it goes stale, points at deleted files, and adds noise.

**The one carve-out:** stable, in-repo requirement IDs that are part of the spec system (`// impl: REQ-VID-001`) are allowed — they're a maintained index, not transient provenance. A ticket ID is not.

A bare `// TODO: revisit caching strategy` is fine. `// TODO(jira PROJ-991): revisit caching strategy` is not — strip the tracker ref.

### 2. Never restate the code

If a competent reader gets it from the name, the signature, or the next line, the comment is noise.

```ts
// ❌ restates name + type
/** Maximum number of tokens the bucket can hold. */
private readonly capacity: number;

// ❌ restates the line below
// Return the cached user
return cached;

// ✅ no comment needed — the code says it
private readonly capacity: number;
return cached;
```

Doc-comment headers that paraphrase the signature (`@param id the id of the user`, "getUser gets a user by id") are restatement. Drop them; keep only params/returns that carry a *constraint* or *unit* the type doesn't (`@param timeout milliseconds; 0 disables`).

### 3. Short. Simple sentences.

Say it in the fewest words. Prefer a phrase over a sentence, one line over a paragraph. A comment is not an essay.

```ts
// ❌ three sentences for one fact
// Guard against non-monotonic wall clocks (NTP steps, manual clock changes):
// a backward jump yields negative elapsed time, which we treat as zero rather
// than draining tokens. This keeps the accounting stable across clock skew.

// ✅ one line
// Clock can jump backward (NTP); treat negative elapsed as zero.
```

Multi-paragraph comments are a smell. If a behavior genuinely needs that much explanation, the explanation is a *requirement* → see `jj-superpowers:writing-specs`, not a wall of comment.

## What TO comment

Keep the comment when a competent reader would be **surprised or misled** without it:

- Load-bearing invariants and gotchas (`// negative TTL = "never expire": upstream treats any <0 as infinite`)
- Units, ranges, and non-obvious contracts not in the type
- *Why* a surprising decision was made (not what it does)
- Edge-case / concurrency / ordering semantics that aren't visible locally

The test for every comment: **"Does this add something the code can't say?"** If no → delete.

## Cleanup mode

When asked to clean up comments (or as part of `deslopify`):

1. Read each comment against the three rules.
2. **Strip** transient artifacts (rule 1) — keep `impl: REQ-` annotations.
3. **Delete** restatement (rule 2).
4. **Shorten** verbose prose to one or two simple sentences (rule 3).
5. **Keep & tighten** load-bearing comments (the why/non-obvious).
6. Never delete a comment whose meaning you don't understand — read the code first.

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The ticket ID is traceability/provenance" | Provenance lives in git and the tracker. In code it rots into a dead pointer. Strip it. |
| "The reviewer asked for well-documented code" | Well-documented ≠ heavily-commented. The fewest comments that carry real context IS well-documented. |
| "The doc comment helps editor tooltips" | A tooltip that paraphrases the signature adds nothing. Keep only constraints/units the type lacks. |
| "More explanation is safer" | Verbose comments bury the one line that matters and rot faster. Shorter survives. |
| "It links to the design doc for context" | File paths to docs/handoffs go stale on the first move. If the fact matters, it's a spec requirement, not a comment. |
| "I'll keep it as a TODO with the ticket" | Describe the work in the TODO; drop the tracker ref. |

## Red Flags — STOP

- A comment contains `TASK-`, `PROJ-`, `JIRA-`, a PR number, or a `docs/`/`.md` path
- A doc-comment line you could regenerate from the signature
- A comment longer than the code it describes
- `TODO(ticket)` / `FIXME(ticket)`
- "Created for…", a date, or an author name in a comment

**All of these mean: strip, delete, or shorten — per the three rules.**
