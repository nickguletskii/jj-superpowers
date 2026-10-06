# Debugging Techniques

Load the section you need. Each one supports a phase of SKILL.md.

## Root-Cause Tracing (Phase 1)

When an error surfaces deep in a call chain, the line that throws is rarely the line that's wrong. Trace backward:

1. **Symptom:** what failed, with which value? (`git init` ran in the source tree)
2. **Immediate cause:** the call that did it (`execFile('git', ['init'], { cwd: dir })`).
3. **Caller chain:** who passed that value, and who passed it to them? Keep going up.
4. **Original trigger:** the first place the bad value was created (`dir` was `''`, read from a fixture before setup ran; an empty `cwd` means the process cwd).
5. **Fix there,** not where it surfaced.

If you can't follow the chain by reading, instrument the operation **before** it runs:

```typescript
console.error('DEBUG gitInit', { dir, cwd: process.cwd(), stack: new Error().stack });
```

Use `console.error` in tests (loggers are often silenced), then filter the run: `npm test 2>&1 | grep 'DEBUG gitInit'`. Look for test file names and the shared parameter in the stacks.

**Unknown polluting test?** `./find-polluter.sh '<artifact path>' '<test glob>'` runs tests one at a time and stops at the first that creates the artifact.

## Defense in Depth (Phase 4, after the root-cause fix)

One check at the source can be bypassed later by another code path, a refactor, or a mock. Once the root cause is fixed, list every layer the bad value passed through and decide which deserve a guard:

| Layer | Guard |
|---|---|
| Entry point | Reject invalid input at the API boundary (empty, missing, wrong kind) |
| Business logic | Assert the preconditions this operation needs |
| Environment | Refuse dangerous operations in the wrong context (e.g. in tests, no writes outside the temp dir) |
| Instrumentation | Log context before the dangerous operation, for next time |

Test each guard by bypassing the one above it. Guards complement the source fix; they don't replace it. Prefer making the invalid state unrepresentable over adding runtime checks (`jj-superpowers:designing-with-types-and-abstractions`).

## Condition-Based Waiting (flaky tests)

Fixed sleeps guess how long something takes; they pass on fast machines and fail under load. Wait for the condition itself:

```typescript
async function waitFor<T>(cond: () => T | undefined | null | false, what: string, timeoutMs = 5000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = cond();                 // re-read state every iteration
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for ${what} after ${timeoutMs}ms`);
    await new Promise(r => setTimeout(r, 10));
  }
}
await waitFor(() => events.find(e => e.type === 'DONE'), 'DONE event');
```

Always set a timeout with a descriptive error, and don't poll faster than about 10ms. A fixed delay is correct only when testing timed behavior (debounce, ticks). Even then, first wait for the triggering condition, derive the delay from the known interval, and comment why.
