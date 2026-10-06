---
name: designing-with-types-and-abstractions
description: Use when designing or refactoring an API, interface, state machine, or concurrent system — and when adding a new backend, provider, plugin, or variant means editing a growing `if`/`match`/`switch`. Triggers on "design the API", "how should I model this", "make illegal states unrepresentable", "extract an interface/trait", "this switch keeps growing", domain state held in booleans/nulls/flags, or choosing a data layout for a hot path.
---

# Designing With Types and Abstractions

## Overview

Model invariants in types before writing implementations: illegal states unrepresentable, effects visible, variation behind abstractions instead of branches. Keep the abstraction budget proportional to the current work; this skill never justifies speculative abstraction.

## Project opinions

1. **No implicit fallbacks.** Do not add a "safe default", catch-and-default, or `default:` branch that swallows unknown cases unless the user explicitly asks. Fallbacks hide real errors, blur the contract, and create branches nobody tests.
2. **Dynamic dispatch only at runtime selection boundaries.** A factory picks the implementation where config or input decides it; dynamic dispatch follows from there. Everywhere else, use generics and static dispatch. No trait objects where nothing varies at runtime.
3. **Tagged unions by default.** Model "or" as a sum type: Rust `enum`/`Result`/`Option`, TypeScript inline discriminated unions. If the codebase already has a consistent `Result`/`Either`, follow it rather than adding a second style. Never mix exceptions, sentinels, and tagged unions in one layer.

## Symptom → pattern

| Symptom | Reach for |
|---------|-----------|
| Behavior varies by backend, provider, plugin, or policy | Trait/interface dispatch, strategy, factory, generics |
| Central switch keeps growing when new variants or operations arrive | Open-closed design, visitor, extension traits/interfaces, or exhaustive matching |
| Requests need to be queued, logged, retried, or replayed as first-class actions | Command pattern, often paired with actors or explicit handlers |
| Domain state lives in booleans, nulls, flat records, or comments | ADTs, newtypes, nested product types, explicit state machines |
| Shared values are copied or mutated unpredictably | Immutable data, snapshots, or targeted copy-on-write |
| Business logic mixes transformation, I/O, and fallback behavior | Functional composition plus explicit effect boundaries |
| Error handling is repetitive or hidden | `Result`/`Option` in Rust; tagged unions in TypeScript; no silent fallback |
| Shared mutable concurrency is fragile | Actor ownership and explicit message types |
| Cleanup is manual or easy to forget | RAII / disposable guards |
| Hot-path memory layout matters | Deliberate AoS vs SoA and representation choices |

Choose a pattern by the axis of variation it solves, not by its name. Dispatch choices, data modeling, and effect boundaries in more detail: [patterns.md](patterns.md).
