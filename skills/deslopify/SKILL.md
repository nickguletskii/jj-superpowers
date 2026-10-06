---
name: deslopify
description: Use when the user asks to review and improve code quality, remove slop, deslopify, or clean up unnecessary code — suspicious logic, undocumented invariants, tautological tests, overengineering, or under-engineering/duplication. Also loaded as a rubric by review and planning skills.
---

# Deslopify

Slop is code that is redundant, misleading, needlessly complex, tests the obvious, or hides assumptions. Remove what obscures meaning and keep what carries it.

## Two modes

Work out which mode you're in before you start.

**Rubric mode (no user request needed).** Review and planning nodes load this skill and cite sections from it:

- `subagent-driven-development` simplification nodes (`sdd-simplifier`) apply **section E**. Within a planned graph, E is the only place duplication gets detected.
- `requesting-code-review`, `receiving-code-review`, `writing-plans`, and `executing-plans` apply the **file-size rule** in section F.

In rubric mode you review; you don't clean. Apply only the cited sections and report findings with evidence. Skip the Process below, don't ask a scoping question, and don't edit code. What happens to the findings is up to the caller.

**Sweep mode (only on explicit request).** The user asks you to deslopify, review for quality, or clean up unnecessary code in some scope. Run the full Process. Don't start a sweep on your own initiative, because it would rewrite code nobody asked you to touch.

Use other skills for neighbouring work. Multi-directory dead-code removal or deduplication → `codebase-cleanup`, which has the map/reduce workflow and the deletion approval gates. Choosing which tests to write → `test-driven-development`. Failures → `systematic-debugging`.

## Checklist

### A. Suspicious logic

Code that quietly does something other than what the caller expects. Ordinary bugs like off-by-ones belong to normal review, not here.

- Branches that silently handle a case the code assumes can't happen, e.g. treating `None` as fine when the value should always be present
- Silent fallbacks and defaults (`orElse`, `unwrap_or`, catch-all arms) that hide a real choice or error

**Fix:** Fail fast when an assumption is broken (`Err`, panic, throw). If a fallback really is correct, which is rare, make it explicit and document why.

### B. Undocumented invariants

Code that works only if you "just know" something: implicit assumptions, undocumented preconditions, unwritten state transitions, required call order.

**Fix:** Encode it in types, add assertions, or document it.

### C. Tautological tests

Tests that restate the implementation, check what the compiler already enforces, or can't fail. The criteria are in `test-driven-development` (`what-to-test.md`).

**Fix:** Remove the test or replace it with a test of a real invariant. A badly named test isn't the same as a redundant one.

### D. Overengineering

Abstractions and configurability added for a future that hasn't arrived:

- Abstractions with one implementation; generic interfaces with one use
- Config knobs nobody needs; premature optimization
- Branches that always go one way; feature flags that are permanently on
- Placeholders: TODO stubs, `unimplemented!`, empty `catch` blocks that swallow errors
- Legacy shims and compatibility wrappers that no consumer requires

**Fix:** Remove it until a second use case or a real consumer exists.

### E. Under-engineering and duplication

Duplication that already exists and should be unified:

- The same logic reimplemented for differently named types (use a newtype, traits/interfaces, or generics), and re-copied utilities that already exist elsewhere
- Unnecessary wrapper functions; unused parameters that linters don't catch
- Inconsistent config schemas: similar structs or enum variants that mean the same thing under different names. When schemas can't be shared, at least keep field names consistent.
- Expensive work repeated with no reason to recompute; caches that exist but aren't consulted
- Comments that restate code, run long, or cite transient artifacts. Handle these with `writing-comments`.

Overengineering builds for imagined uses; under-engineering ignores a second use that has already shown up.

**Fix:** Extract the shared abstraction, cache expensive operations, and use the caches that exist.

### F. Poor organization

- **File-size rule (canonical; other skills cite this):** above ~500 lines, check whether the file mixes responsibilities. Above ~1000 lines, assume it has to be split before merge. Split by responsibility, not by line count.
- Flat directories with many files: arrange them as a tree that mirrors the domain.
- Long exhaustive test suites inside implementation files: move them to dedicated test files. Keep only the tests that show invariants or intent next to the code.

## Process (sweep mode)

1. **Scope.** Ask the user what to cover. Suggest recently changed files, or a whole directory if they want depth.
2. **Scan** categories A–F. Read the code before judging it. For each finding, record file, line, and the evidence for why it's slop.
3. **Present** the findings with recommendations. Change nothing until the user approves.
4. **Fix** the approved items.
5. **Verify** that the tests pass and the build is clean.

## Guardrails

- Ask before refactoring code that's about to be replaced, and check compatibility before breaking a public API.
- Leave linter-detectable issues to the linter.
- On caching: don't skip it just because an operation looks cheap, since repeated work adds up (for example, text shaping every frame). If an API offers a caching mechanism, it usually has a reason.
