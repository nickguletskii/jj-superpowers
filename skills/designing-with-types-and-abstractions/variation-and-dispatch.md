# Variation and Dispatch

## Overview

Use abstractions when behavior varies by implementation, policy, or operation. Prefer adding a new implementation over editing a central switch. The key question is: what is varying, and where should that variation live?

## Decision Guide

| Situation | Prefer | Avoid |
|-----------|--------|-------|
| Many interchangeable implementations behind one contract | Trait/interface dispatch | Free functions selected by scattered conditionals |
| Behavior varies by policy | Strategy object or generic policy parameter | Repeated `if` branches inside business logic |
| Requests need to be queued, logged, retried, or replayed | Command object / message ADT | Calling helpers in an implicit required order |
| Runtime chooses implementation | Factory at the boundary, dynamic dispatch after selection | Global service locator or implicit fallback |
| Compile time chooses implementation | Generics and static dispatch | Trait objects where no runtime variability exists |
| Need to add behavior to an existing type without editing it | Extension trait/interface | Copy-pasted wrappers |
| Closed set of variants, many operations over them | Visitor or exhaustive match close to the ADT | Duplicate type switches throughout the codebase |

## Trait / Interface-Based Dispatch

Put implementation-specific logic behind a stable contract.

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
                Some(_) => attempt += 1,
                None => return Err(err),
            },
        }
    }
}
```

The generic `P` says the orchestration is stable while the policy varies.

## Open-Closed Principle

Open for new implementations. Closed to editing stable orchestration.

Good signs:
- adding a new provider means implementing a trait/interface
- adding a new policy means constructing a different strategy
- most call sites do not change when a new implementation arrives

Bad signs:
- a central `match`/`switch` grows for every new implementation
- callers must know provider-specific quirks
- a "default" branch silently handles unknown cases

Do not add fallback behavior unless explicitly requested.

## Strategy Pattern

Use strategy when the algorithm or policy varies but the surrounding flow is stable:
- retry policy
- routing policy
- pricing policy
- conflict resolution policy

Strategy is usually smaller and cheaper than subclassing or branching.

## Factory Pattern

Use factories at construction boundaries:
- runtime config chooses a concrete implementation
- construction requires side effects, caches, or resources
- the rest of the code should depend on a stable contract, not on construction details

Factories construct. They should not become a second orchestration layer.

## Command Pattern

Use command objects or command ADTs when the request itself is a first-class thing:
- queue it
- persist it
- retry it
- log it
- authorize it
- route it to a handler

Command is often the bridge between an external request and the internal state machine or actor.

## Visitor Pattern

Visitor is appropriate when:
- the set of variants is closed
- many operations need to be added over those variants
- you want one place to encode operation-specific logic

Prefer exhaustive pattern matching when:
- there are only a few operations
- the language already gives clean exhaustive matches
- visitor ceremony would obscure the model

## Extension Traits / Interfaces

Use extension traits or narrow extension interfaces when:
- the core type is stable
- a small layer needs extra behavior
- optional capabilities should not bloat the base contract

Keep the base contract minimal. Put optional behavior behind opt-in extensions.

## Generics

Generics are for parametric variation, not for hiding uncertainty.

Reach for generics when:
- the algorithm is the same for many types
- callers know the concrete type
- static dispatch improves clarity or performance

Avoid generics when:
- the real requirement is runtime selection
- type parameters leak everywhere without buying stronger invariants
- the abstraction exists only for a speculative future use
