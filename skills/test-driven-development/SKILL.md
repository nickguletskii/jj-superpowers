---
name: test-driven-development
description: Use when implementing a feature, bugfix, refactor, or other behavior change, before writing the implementation code.
---

# Test-Driven Development

Default to test-first for behavior changes: write the test, watch it fail, write the minimal code that makes it pass, then refactor. A test you never saw fail may not test what you think it does.

Skip it, after checking with your human partner, for throwaway prototypes, generated code, and configuration files. Not every behavior deserves a test at all: read `what-to-test.md` before writing one you're unsure about.

## The cycle

1. **Red.** Write one test for one behavior, with a name that says what should happen. Use real code; mock only what is slow or external.
2. **Watch it fail.** It should fail (not error) with the expected message, because the feature is missing rather than because of a typo. If it passes, it tests existing behavior; fix the test.
3. **Green.** Write the simplest code that passes. Don't add options or features the test didn't ask for.
4. **Watch it pass,** along with the surrounding suite. If the new test fails, fix the code, not the test. Fix anything else you broke now, and keep the output free of new warnings.
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

Don't delete it. Write the test, revert the fix, and watch the test fail for the expected reason. Restore the code and watch it pass. A test that has never failed proves only that it agrees with the code.

## Bugs

Reproduce the bug with a failing test before fixing it; the test proves the fix and guards against regression. For finding the cause, see `systematic-debugging`.

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

- Moving on from a test that passed on its first run; it was never shown to detect anything.
- Treating a failure for the wrong reason (import error, typo, bad fixture) as a valid red.
- Growing the implementation past what the current test requires, leaving untested branches.
