# Concurrency and Ownership

## Overview

When concurrency, ownership, or cleanup matter, make them explicit. One owner is better than many shared mutators. One visible resource lifetime is better than cleanup by convention.

## Actor Pattern

Use an actor when:
- one logical owner should serialize access to mutable state
- work arrives as commands or events
- state transitions and emitted effects should stay coordinated

Core shape:
- message ADT (`Command`, `Event`, `Query`)
- actor owns the state
- callers communicate through channels/mailboxes
- heavy side work happens from snapshots or delegated workers

Good signs:
- mutation happens in one place
- concurrency boundaries are obvious
- tests can drive the actor with messages

Bad signs:
- background tasks poke shared state directly
- locks are spread through unrelated business logic
- compaction, retries, or cleanup happen "somewhere else"

## Ownership and Resource Lifetime

Tie cleanup to ownership.

Use RAII / disposables for:
- file handles
- transactions
- locks and guards
- temporary directories
- subscriptions and timers

The code that acquires a resource should make lifetime visible. Avoid "remember to call cleanup()" APIs unless the language gives you no better option.

## Snapshot-Based Concurrency

If parallel work is needed around shared state:
- keep one owner for the authoritative state
- hand workers immutable snapshots or command messages
- merge results back through explicit transitions

Do not let background tasks mutate shared state directly.
