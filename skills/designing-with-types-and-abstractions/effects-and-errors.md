# Effects and Errors

## Overview

Keep pure transformations separate from effectful boundaries. A function should make its effect story obvious from its signature, name, and return type.

## Functional Composition

Prefer small transformations that compose:
- parse
- validate
- enrich
- decide
- execute effect

Good signs:
- transformation functions are easy to test in isolation
- orchestration reads like data flowing through stages
- effectful code is concentrated near boundaries

Bad signs:
- mutation and I/O are interleaved in every step
- helper functions secretly log, cache, or retry
- correctness depends on hidden call ordering

## Effects Should Be Visible

Prefer boundaries that reveal effects:
- a pure transformation returns data
- an effectful operation returns `Result`, promise, task, or tagged union and is named accordingly
- background work is started deliberately, not as a hidden side effect

Do not hide retries, caching, or fallback behavior inside innocent-looking helpers.

## Monadic Error Handling

Compose errors through `Result`, `Option`, or a tagged union instead of manual branching after every step.

Rust:
- `?` for propagation
- `map`, `and_then`, `or_else`, `transpose` for composition

TypeScript:
- prefer inline discriminated tagged unions by default
- if the codebase already has a consistent `Result`/`Either` abstraction, follow that instead of inventing a second style
- add `map`/`flatMap`-style helpers only when they simplify repeated composition

The goal is predictable composition:
- success flows forward
- failures short-circuit explicitly
- there is no silent fallback path

Avoid:
- `null` plus side-channel error logging
- catch-and-default behavior nobody asked for
- mixing exceptions, sentinels, and tagged unions in the same layer

## No Implicit Fallbacks

Do not add "safe defaults" or fallback behavior unless explicitly requested.

Fallbacks usually:
- hide real errors
- blur the API contract
- create branches nobody tests well
- make effects and failure modes less predictable
