# Patterns

## Variation and dispatch

Ask what varies and where that variation should live. Prefer adding a new implementation over editing a central switch.

| Situation | Prefer | Avoid |
|-----------|--------|-------|
| Many interchangeable implementations behind one contract | Trait/interface dispatch | Free functions selected by scattered conditionals |
| Behavior varies by policy | Strategy object or generic policy parameter | Repeated `if` branches inside business logic |
| Requests need to be queued, logged, retried, or replayed | Command object / message ADT | Calling helpers in an implicit required order |
| Runtime chooses implementation | Factory at the boundary, dynamic dispatch after selection | Global service locator or implicit fallback |
| Compile time chooses implementation | Generics and static dispatch | Trait objects where no runtime variability exists |
| Need to add behavior to an existing type without editing it | Extension trait/interface | Copy-pasted wrappers |
| Closed set of variants, many operations over them | Visitor or exhaustive match close to the ADT | Duplicate type switches throughout the codebase |

```rust
trait RetryPolicy {
    fn next_delay(&self, attempt: u32) -> Option<Duration>;
}

fn run_with_retry<P: RetryPolicy>(
    policy: &P,
    op: impl Fn() -> Result<(), Error>,
) -> Result<(), Error> {
    let mut attempt = 0;
    loop {
        match op() {
            Ok(()) => return Ok(()),
            Err(err) => match policy.next_delay(attempt) {
                Some(delay) => {
                    std::thread::sleep(delay);
                    attempt += 1;
                }
                None => return Err(err),
            },
        }
    }
}
```

The generic `P` says the orchestration is stable while the policy varies.

Open-closed warning signs: a central `match`/`switch` grows for every new implementation, callers must know provider-specific quirks, or a "default" branch silently handles unknown cases. Factories construct; they must not become a second orchestration layer. Prefer exhaustive matching over visitor when there are only a few operations.

## State and data modeling

- **Sums and products.** Product types say what exists together; sum types say which variant is active. Do not store `authorized: boolean` next to `authorizationId?: string`, and do not rely on comments like "only set when...".
- **Newtypes** when primitives hide meaning or units: `UserId`, `Cents`, `ValidatedEmail`. Validation happens once.
- **Nested over flat.** `RequestContext { auth: AuthContext, tracing: TraceContext }`, not one wide object with duplicated prefixes.
- **Explicit state machines.** A closed state ADT, explicit commands/events, and a transition returning next state + effects/errors. Ordering rules become visible and testable.
- **Immutable by default** for shared values; copy-on-write only when reads dominate and the clone happens on the mutation path.
- **Generics strengthen the model** (`StateMachine<S, Cmd, Err>`), never obscure it (`Context<T1, T2, T3>`).

## Effects and errors

- Compose small stages (parse, validate, enrich, decide, execute effect) and keep I/O near the boundaries.
- Make effects visible in signatures and names. Helpers must not secretly log, cache, retry, or fall back.
- Compose errors with `?`/`map`/`and_then` (Rust) or tagged unions (TypeScript): success flows forward, failures short-circuit explicitly. Avoid `null` plus side-channel logging.
