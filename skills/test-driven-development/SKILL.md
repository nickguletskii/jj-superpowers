---
name: test-driven-development
description: Use when the user or project explicitly requires test-driven development, or when deciding test order and coverage for a behavior change.
---

# Test-Driven Development

Default to implementing behavior changes directly, then add meaningful coverage and run relevant checks. Tests may come afterward; an initial failing test is not a prerequisite for implementation or completion. Honor an explicit request to defer coverage.

Use the test-first cycle below when the user or project explicitly requires TDD. Otherwise, choose test order to suit the task without asking permission to implement first. Not every behavior deserves a test: read `what-to-test.md` before writing one you're unsure about.

## When TDD is required

1. **Red.** Write one test for one behavior, with a name that says what should happen. Use real code; mock only what is slow or external.
2. **Watch it fail.** It should fail (not error) with the expected message, because the feature is missing rather than because of a typo. If it passes, it tests existing behavior; fix the test.
3. **Green.** Write the simplest code that passes. Don't add options or features the test didn't ask for.
4. **Watch the focused test pass.** If it fails, investigate the code and test against the intended behavior. Run broader checks after the coherent implementation chunk, rather than the surrounding suite on every cycle.
5. **Refactor** while green: remove duplication, improve names, extract helpers. Don't add behavior.

```typescript
// Good: names the behavior, exercises real code
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => {
    attempts++;
    if (attempts < 3) throw new Error('fail');
    return 'success';
  };
  expect(await retryOperation(operation)).toBe('success');
  expect(attempts).toBe(3);
});
```

## If the code came first

Keep the implementation. Add tests against independently established requirements, expected results, and meaningful edge cases, then run the relevant checks. A test passing on its first run is acceptable. Do not temporarily revert working code solely to manufacture a red.

## Bugs

Reproduce and understand the bug before fixing it; an automated failing test is useful when it helps establish the cause, but is not mandatory. Add regression coverage when it provides lasting value. For finding the cause, see `systematic-debugging`.

## Good tests

- **One behavior, named for it.** An "and" in the name usually means two tests.
- **Show the intended API.** When you don't know how to test something, write the call you wish existed.
- **Worth having.** Check invariants a careful reader couldn't verify from the source, not what the compiler enforces.

Hard-to-test code is usually a design signal: if you must mock everything, the code is too coupled; if setup is huge, the interface is too complicated.

## Mocks and test doubles

Mocks isolate the code under test; they are never the thing being tested.

- **Assert on real behavior, not the mock.** A test that checks a mock was called proves the mock works. If you can't assert anything without inspecting the mock, don't mock that dependency.
- **Know what the real method does first.** Mocking a high-level method can remove a side effect the test depends on (a config write, a cache fill), so the test passes or fails for the wrong reason. Run against the real implementation first, then mock only the slow or external piece underneath.
- **Mirror the full shape.** A partial mock response hides structural assumptions; downstream code reads a field you omitted and integration breaks while the test passes. Copy the real schema.
- **No test-only methods in production code.** Cleanup and inspection helpers belong in test utilities. If mock setup is longer than the test, an integration test with real components is usually simpler.

```typescript
// Wrong: mocks away the config write the duplicate check depends on
vi.mock('./toolCatalog', () => ({ discoverAndCacheTools: vi.fn() }));
await addServer(config);
await expect(addServer(config)).rejects.toThrow(); // never throws: nothing was written

// Right: mock only the slow process launch; keep the real config write
vi.mock('./serverProcess', () => ({ spawnServer: vi.fn().mockResolvedValue(fakeHandle) }));
await addServer(config);
await expect(addServer(config)).rejects.toThrow(/already registered/);
```

## Common mistakes

- Treating a first-run pass as invalid solely because the test was written after implementation.
- Treating a failure for the wrong reason (import error, typo, bad fixture) as a valid red.
- Writing tests that merely echo the implementation instead of checking the intended behavior.
