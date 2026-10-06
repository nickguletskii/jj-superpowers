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
- Paths to transient files — handoffs, plans, design docs, agent-blog files, spec file paths (`docs/superpowers/handoffs/...`, `docs/.../design.md §3.2`) — or "the design"/"the plan". Planning artifacts are ephemeral; a comment that leans on one rots the moment the plan is archived
- Internal section/paragraph cross-references — no `§`, no "see section 4.2", no design-doc subsection numbers. The code is the artifact; a comment may not outsource its meaning to a numbered heading.
- "Created for X", "Added in sprint Y", author names, dates-written
- `TODO(ticket)` / `FIXME(ticket)` — describe the work, not the tracker

**Why:** These are provenance, and provenance lives in version control, not in the source. Git blame, PR history, and the tracker already hold it. In the code it goes stale, points at deleted files, and adds noise.

**A comment must be self-contained:** it explains the code in front of the reader without sending them to another document to make sense.

**The permitted durable references** — a *sync anchor*, never a substitute for the self-contained explanation. This skill is canonical for what in-code text may reference; other skills defer to this list:
- A stable, in-repo requirement ID from the spec system (`// impl: REQ-VID-001`) — a maintained index, not transient provenance. A ticket ID is not. No file path on the anchor.
- A stable ADR or doc anchor (`// See DOCS.md#auth-flow`, `ADR-0007`). Never a transient path (handoffs, plans, tickets).

Write the explanation first, then add the anchor if the code satisfies a normative requirement.

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

Multi-paragraph comments are a smell. If a behavior genuinely needs that much explanation, move it out of the comment per the placement rule below.

**Placement rule** (where a non-obvious *why* or ordering fact goes; other skills defer to this):
- Local to the code in front of the reader → a short comment.
- Cross-component or an observable contract, and `.agents/layout.yaml` exists → a spec requirement (`jj-superpowers:writing-specs`).
- Otherwise → module doc or ADR (`jj-superpowers:documentation`).

## What TO comment

Keep the comment when a competent reader would be **surprised or misled** without it:

- Load-bearing invariants and gotchas (`// negative TTL = "never expire": upstream treats any <0 as infinite`)
- Units, ranges, and non-obvious contracts not in the type
- *Why* a surprising decision was made (not what it does)
- Edge-case / concurrency / ordering semantics that aren't visible locally
- A permitted anchor from rule 1 (`impl: REQ-…`, ADR/doc anchor) — cross-referencing only, never the explanation itself.

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
| "It links to the design doc for context" | File paths to docs/handoffs go stale on the first move. If the fact matters, state it in the comment or move it per the placement rule. |
| "I'll keep it as a TODO with the ticket" | Describe the work in the TODO; drop the tracker ref. |

## Red Flags — STOP

- A comment contains `TASK-`, `PROJ-`, `JIRA-`, a PR number, or a path to a handoff/plan/design file
- A doc-comment line you could regenerate from the signature
- A comment longer than the code it describes
- `TODO(ticket)` / `FIXME(ticket)`
- "Created for…", a date, or an author name in a comment

**All of these mean: strip, delete, or shorten — per the three rules.**
