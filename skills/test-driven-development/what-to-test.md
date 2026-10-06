# What to Test

Load this when deciding whether to write a test, questioning whether a test adds value, or reviewing existing tests for redundancy.

A test earns its keep when it verifies an invariant that isn't obvious from reading the source and that the type system can't enforce. If reading the source is enough to know the code is correct, the test adds only maintenance cost.

## High-value tests

Things a careful reader would have to reason hard about, or that could silently go wrong:

- **Safe wrappers around `unsafe`.** The compiler doesn't check the safety invariants; tests are the only verification.
- **Concurrency and synchronization.** Races, deadlocks, ordering guarantees.
- **Cross-cutting consistency.** "Parse then format is the identity", "output is always sorted", "X produces the same result as Y".
- **Adversarial scenarios.** Fuzzed inputs, conflicting concurrent operations, resource exhaustion, boundaries that aren't apparent.
- **Non-obvious edge cases.** Real corner cases where reasoning fails without careful analysis, not "what if this is None" on a value that is never None.
- **Business rules.** `calculate_discount(price, tier, region)` deserves tests even though `add(a, b)` does not.
- **Bug reproductions, while still relevant.** If a later API change makes the bug structurally impossible, the test may be removable.

## Low-value tests

- **Type-system mirrors.** Required fields exist, return types match, enums are exhaustive.
- **Implementation echoes.** The code says `x + 1` and the test asserts `result == input + 1`.
- **Tautologies.** Assertions that can't fail because the code guarantees them by construction, such as `if let Some(x) = opt { x }` handling `Some`.
- **Obvious from reading.** A getter that returns the field it stores.

## Exception: types erased at runtime

TypeScript types are erased at runtime and Python hints are never enforced. Data crossing a boundary (API responses, user input, `JSON.parse`, `any`/`unknown`, dynamic imports) may not match its declared type. When there is concrete evidence it might, such as an external API that sometimes omits a field or a parse result cast to an interface, test the actual runtime shape. Don't write such tests speculatively.

## Deciding

1. Does the type system already enforce it? Don't test it.
2. Is the behavior obvious from the source? Don't test it.
3. Could it fail silently at runtime, or does data cross a runtime boundary? Test it.
4. Otherwise, test it if the invariant isn't obvious.

When in doubt, ask: would a careful reader need this test to trust the code, or could they verify it by reading the implementation?

To remove existing redundant tests, see `jj-superpowers:deslopify`. For mocks, see "Mocks and test doubles" in `SKILL.md`.
