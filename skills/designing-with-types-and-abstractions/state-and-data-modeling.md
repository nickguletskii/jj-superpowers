# State and Data Modeling

## Overview

Model the domain first. Product types say what must exist together. Sum types say which variant is active. Good APIs make those facts explicit instead of asking callers to remember them.

## Algebraic Data Types

Think in sums and products:
- product type: a struct/object whose fields all exist together
- sum type: an enum/discriminated union where exactly one variant is active

Use product types to group related data into meaningful nested structures. Use sum types to model mutually exclusive cases, states, commands, and results.

Make illegal states unrepresentable:
- do not store `authorized: boolean` next to `authorizationId?: string`
- do not rely on comments like "this field is only set when..."

## Newtypes

Some languages offer newtypes as zero-cost abstractions (e.g. Rust). Use newtypes when raw primitives hide meaning or units:
- `UserId` instead of `string`
- `Cents` instead of `i64`
- `ValidatedEmail` instead of plain text

Newtypes prevent accidental mixing and let validation happen once.

## Structured Data Over Flat Records

Prefer nested product types over giant flat structs or objects.

Good:
- `RequestContext { auth: AuthContext, tracing: TraceContext }`
- `Order { customer: CustomerInfo, pricing: PricingBreakdown }`

Bad:
- one wide object with twenty unrelated fields
- duplicated prefixes standing in for missing structure

Flat data hides invariants. Structure reveals them.

## Explicit State Machines

If behavior depends on state, model state directly.

Use:
- a closed state ADT
- explicit commands/events
- validated transitions

The basic shape is:
- input command/event
- current state
- transition result: next state + emitted effects/errors

That design makes ordering rules visible and testable.

## Immutable Data and Copy-on-Write

Prefer immutable data by default for shared domain values and transition inputs. Mutation should be local, deliberate, and easy to see.

Immutable data helps when:
- values cross thread or async boundaries
- snapshots make reasoning simpler
- you want structural sharing instead of aliasing bugs

Copy-on-write is appropriate when:
- reads dominate writes
- large values are usually reused unchanged
- cloning everything eagerly would be wasteful

Use COW deliberately:
- preserve a clear immutable API
- clone only on the mutation path
- keep ownership rules obvious

Do not hide repeated expensive cloning behind "safe" helpers.

## Generics and Invariants

Use generics to preserve invariants across reusable code, not to erase the domain.

Good:
- `Repository<TId, TState>` where the type parameters represent real domain distinctions
- `StateMachine<S, Cmd, Err>` when the transition shape is stable

Bad:
- `Context<T1, T2, T3>` where the parameters only obscure meaning

Type parameters should strengthen the model, not weaken readability.
