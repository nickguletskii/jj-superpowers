---
name: writing-comments
description: Use when writing or editing code comments, when asked for "well-documented" or "well-commented" code, or when cleaning up comments that restate code, run long, or cite transient artifacts (ticket IDs, PR numbers, plan/spec paths, dates). Triggers on "clean up comments", "deslopify comments".
---

# Writing Comments

A comment should add context the code can't carry, and most code needs none. Comment the *why* and the non-obvious, not the *what*, and leave out anything that will go stale. This applies whenever you write code and when you're asked to clean comments up. For wider code cleanup, use `deslopify`.

## 1. No transient artifacts

Provenance belongs in version control and the tracker. In source it turns into dead pointers. Leave these out of comments:

- Ticket, task, Jira, or issue IDs; PR or commit references; review threads
- Paths to handoffs, plans, design docs, or spec files, and phrases like "the design" or "the plan"
- Section cross-references (`§3.2`, "see section 4.2")
- "Created for X", sprint names, authors, dates written
- `TODO(ticket)`. Describe the work instead: `// TODO: revisit caching strategy`

A comment should make sense without opening another document. This skill defines the durable references in-code text may carry, and other skills follow it. These are sync anchors and never replace the explanation:

- A stable in-repo requirement ID: `// impl: REQ-VID-001` (no file path; a ticket ID doesn't qualify)
- A stable ADR or doc anchor: `ADR-0007`, `// See DOCS.md#auth-flow`

## 2. Don't restate the code

If a competent reader gets it from the name, the signature, or the next line, the comment is noise.

```ts
// ❌ restates name + type
/** Maximum number of tokens the bucket can hold. */
private readonly capacity: number;
```

Doc headers that paraphrase the signature (`@param id the id of the user`) count as restatement too. Keep a param or return note only when it carries a constraint or unit the type doesn't (`@param timeout milliseconds; 0 disables`). Tooltips that echo the signature don't help anyone.

## 3. Keep it short

Use the fewest words that work: a phrase over a sentence, one line over a paragraph.

```ts
// ✅
// Clock can jump backward (NTP); treat negative elapsed as zero.
```

If a behavior needs paragraphs, it belongs somewhere else. Other skills follow this placement rule:

- Local to the code in front of the reader → a short comment
- Cross-component or an observable contract, with `.agents/layout.yaml` present → a spec requirement (`writing-specs`)
- Otherwise → module doc or ADR (`documentation`)

## What to comment

Keep a comment when a competent reader would be surprised or misled without it:

- Load-bearing invariants and gotchas (`// negative TTL = never expire: upstream treats <0 as infinite`)
- Units, ranges, and contracts the type doesn't express
- Why a surprising decision was made
- Edge-case, concurrency, or ordering semantics that aren't visible locally
- A permitted anchor from rule 1

"Well-documented" means the fewest comments that carry real context, not the most comments.

## Cleanup mode

1. Check each comment against the three rules.
2. Strip transient artifacts but keep `impl: REQ-` anchors.
3. Delete restatement and shorten verbose prose.
4. Keep load-bearing comments, tightened.
5. Don't delete a comment until you understand it. Read the code first.
