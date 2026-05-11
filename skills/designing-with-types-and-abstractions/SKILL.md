---
name: designing-with-types-and-abstractions
description: Use when designing or refactoring APIs, internal interfaces, stateful workflows, or concurrent systems where ad hoc branching, flat data, hidden state, fallback behavior, or imperative orchestration are making the code hard to extend, verify, or optimize
---

# Designing With Types and Abstractions

## Overview

Think in interfaces, algebraic data types, generics, and explicit state before thinking in implementations. Prefer designs where illegal states are unrepresentable, effects are obvious, behavior varies through abstractions instead of branches, and new functionality is added by extension rather than by editing central switches.

Avoid implicit fallbacks unless the user explicitly asks for them.

## When to Use

- Internal APIs are leaking details across modules
- New behavior is being added with `if`/`match`/`switch` branches spread through the codebase
- State is implicit in flags, nullable fields, ordering assumptions, or comments
- Errors are being pushed around manually instead of composed
- Cleanup, ownership, or concurrency behavior is hard to reason about
- Flat structs or objects are hiding real domain structure
- Performance work needs a deliberate data-layout choice

Do not use this skill to justify speculative abstraction. Keep the abstraction budget proportional to the current work scope.

## Core Pattern

1. Inventory the APIs, message shapes, state transitions, and effect boundaries.
2. Identify what truly varies: implementation, state variant, policy, operation, or data layout.
3. Model invariants with types first: ADTs, nested product types, newtypes, generics, explicit state machines.
4. Pick the dispatch boundary deliberately: trait/interface, strategy, factory, visitor, actor, or exhaustive pattern match.
5. Keep ownership, cleanup, and fallback behavior explicit.

## Quick Reference

| Symptom | Reach for | Reference |
|---------|-----------|-----------|
| Behavior varies by backend, provider, plugin, or policy | Trait/interface dispatch, strategy, factory, generics | [variation-and-dispatch.md](variation-and-dispatch.md) |
| Central switch keeps growing when new variants or operations arrive | Open-closed design, visitor, extension traits/interfaces, or exhaustive matching | [variation-and-dispatch.md](variation-and-dispatch.md) |
| Requests need to be queued, logged, retried, or replayed as first-class actions | Command pattern, often paired with actors or explicit handlers | [variation-and-dispatch.md](variation-and-dispatch.md) |
| Domain state lives in booleans, nulls, flat records, or comments | ADTs, newtypes, nested product types, explicit state machines | [state-and-data-modeling.md](state-and-data-modeling.md) |
| Shared values are copied or mutated unpredictably | Immutable data, snapshots, or targeted copy-on-write | [state-and-data-modeling.md](state-and-data-modeling.md) |
| Business logic mixes transformation, I/O, and fallback behavior | Functional composition plus explicit effect boundaries | [effects-and-errors.md](effects-and-errors.md) |
| Error handling is repetitive or hidden | `Result`/`Option` in Rust; tagged unions in TypeScript; no silent fallback | [effects-and-errors.md](effects-and-errors.md) |
| Shared mutable concurrency is fragile | Actor ownership and explicit message types | [concurrency-and-ownership.md](concurrency-and-ownership.md) |
| Cleanup is manual or easy to forget | RAII / disposable guards | [concurrency-and-ownership.md](concurrency-and-ownership.md) |
| Hot-path memory layout matters | Deliberate AoS vs SoA and representation choices | [layout-and-representation.md](layout-and-representation.md) |

## Implementation

- Variation boundaries and dispatch choices: [variation-and-dispatch.md](variation-and-dispatch.md)
- ADTs, newtypes, nested data, and explicit state machines: [state-and-data-modeling.md](state-and-data-modeling.md)
- Functional composition, visible effects, and monadic/tagged-union error handling: [effects-and-errors.md](effects-and-errors.md)
- Actor concurrency and resource ownership: [concurrency-and-ownership.md](concurrency-and-ownership.md)
- Data layout and representation tradeoffs: [layout-and-representation.md](layout-and-representation.md)

Think like a category theorist and mathematician:
- Product types model "and"
- Sum types model "or"
- Functions model allowed transformations
- State machines model legal transitions
- Effects belong at explicit boundaries

## Common Mistakes

- Introducing a helper function instead of introducing the missing interface or ADT
- Encoding state with booleans, nulls, or partially-valid records
- Adding a "safe default" or fallback path nobody requested
- Using dynamic dispatch everywhere instead of only at runtime selection boundaries
- Flattening domain data until invariants disappear
- Hiding cleanup in comments or caller discipline instead of types/ownership
- Choosing a pattern by name instead of by the axis of variation it solves
