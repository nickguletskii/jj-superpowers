# Layout and Representation

## Overview

Data layout is part of the design. Choose representation by access pattern, invariants, and compression needs, not by taste.

## Array of Structs vs Struct of Arrays

Prefer Array of Structs when:
- you mostly operate on whole records
- readability matters more than squeezing the hot path
- mutation is per-entity

Prefer Struct of Arrays when:
- hot loops touch only a few fields across many items
- vectorization, cache locality, or compression matters
- columnar processing is the real workload

Do not switch to SoA by taste alone. Use it when profiling or workload shape justifies it.

## Compression and Representation

Representation choices should preserve invariants while fitting the workload:
- dense enums / tagged unions can replace stringly typed variants
- packed IDs and newtypes can make units explicit without wasting space
- snapshots can separate hot operational state from cold metadata

Optimize after the invariants are clear. Correct shape first, optimized representation second.
