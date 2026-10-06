---
name: systematic-debugging
description: Use when encountering a bug, test failure, build failure, performance problem, or other unexpected behavior, before proposing a fix.
---

# Systematic Debugging

Find the root cause before fixing. A patch at the symptom usually leaves the real defect in place and often creates a new one, and guess-and-check fixes cost more time than investigating. This holds for bugs that look simple too.

The four phases below are guidance for how an investigation usually goes, not gates to clear in order. Skip what the evidence makes unnecessary, but don't propose a fix you can't explain.

## Phase 1: Root cause investigation

- **Read the error completely.** Full stack trace, line numbers, file paths, error codes. Warnings near the failure often name the cause.
- **Check recent changes early; it is cheap.** `jj diff`, `jj log --ignore-working-copy -r 'ancestors(@, 10)'`, and the diff of any suspect change. Look for new dependencies, config changes, and environment differences.
- **Reproduce it.** Find exact steps that trigger it reliably. If it is intermittent, gather more data rather than guessing.
- **Instrument component boundaries** in multi-component systems (client → API → service → database). Log what enters and leaves each boundary and whether config and environment propagate, run once, and investigate the layer where the data first goes wrong. For an upload pipeline: log payload size as the client sends it, as the API receives it, as the service hands it to storage, then run the storage write verbosely.
- **Trace bad values to their origin** when the error surfaces deep in a call chain. Ask who passed the bad value, then who passed it to them, until you reach where it was created. Fix there. See "Root-Cause Tracing" in `techniques.md`.

## Phase 2: Pattern analysis

- Find similar code in the same codebase that works, and list every difference between it and the broken code, including ones that seem irrelevant.
- If you are implementing a known pattern, read the reference implementation fully before adapting it.
- Note what the broken code depends on: other components, settings, environment, assumptions.

## Phase 3: Hypothesis and testing

- State one hypothesis: "X is the root cause because Y."
- Test it with the smallest change that can confirm or refute it, one variable at a time.
- If it is refuted, form a new hypothesis rather than stacking another change on top. Several simultaneous changes make it impossible to tell which one mattered.
- If you don't understand something, say so and research or ask instead of guessing.

## Phase 4: Implementation

1. **Write a failing test** that reproduces the bug, or a one-off script where there is no test framework. See `jj-superpowers:test-driven-development`.
2. **Make one fix** that addresses the root cause. Leave unrelated improvements and refactors for separately.
3. **Verify:** the new test passes, nothing else broke, and the original symptom is gone (`jj-superpowers:verification-before-completion`).
4. **If the fix doesn't work,** return to Phase 1 with what you learned.
5. **After three failed fixes, question the architecture.** Signs: each fix exposes new shared state or coupling somewhere else, fixes need large refactors, or each one creates new symptoms. That points to an unsound design, not another bad hypothesis. Discuss with your human partner before attempting more fixes.

After the root-cause fix, consider guards at the other layers the bad value passed through ("Defense in Depth" in `techniques.md`).

## When there is no root cause in the code

If investigation shows the issue is truly environmental, timing-dependent, or external, document what you investigated, add appropriate handling (retry, timeout, clearer error), and add logging for next time. Most "no root cause" conclusions turn out to be incomplete investigations, so check that first.

## Common mistakes

- Proposing a fix before tracing the data flow, because the cause "is probably X".
- Applying several changes in one run, then being unable to say which one helped.
- Adapting a reference pattern from a partial reading of it.
- Your human partner asking "is that actually happening?" or "will that show us…?" means you assumed instead of gathering evidence. Go back and instrument.

## Supporting material

`techniques.md` covers root-cause tracing, defense in depth, and condition-based waiting for flaky tests. `find-polluter.sh` bisects which test creates an unwanted file or directory.
