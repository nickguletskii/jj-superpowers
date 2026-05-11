---
name: tool-output-discipline
description: Use when running CLI tools that may produce noisy, long, human-readable, or hard-to-filter output
---

# Tool Output Discipline

## Overview

Ask tools for the smallest useful output. Prefer structured, quiet, scoped, or filtered output first; expand only for debugging.

**Core principle:** command output is context. Spend it deliberately.

## When to Use

Use before commands that may produce long output:

- Build tools and compilers: `cargo`, `bazel`, `npm`, `tsc`
- Test runners: `pytest`, `cargo test`, `npm test`
- Logs and cluster tools: `kubectl`, service logs, CI logs
- Broad searches, file reads, generated output, package manager output

Do not optimize tiny bounded commands.

## Decision Rule

1. Name the question the command must answer.
2. Pick the shortest command form that answers it.
3. Prefer selectors, quiet flags, JSON output, and filters.
4. If that output is insufficient, expand only the failing scope.
5. If full logs are needed, capture them and report the relevant section.

## Output Patterns

| Need | Prefer | Avoid first |
|------|--------|-------------|
| Pass/fail | quiet command + exit code | verbose default logs |
| Compiler errors | structured diagnostics filtered to errors | full human compiler output |
| Test failure | single test/module selector + quiet mode | whole suite output |
| Search | `rg -n "pattern" path` | broad file dumps |
| JSON-capable CLI | `--json` / `-o json` + `jq` | tables meant for humans |
| Logs | `tail`, time range, grep/rg filter | unbounded log streams |

## Compact Cookbook

Cargo diagnostics. Use this to extract errors, not as the only pass/fail signal unless the shell preserves Cargo's exit status.

```bash
cargo check --message-format json-diagnostic-short -q | jq -crM 'select(.message.level == "error")'
```

Pytest focused failure:

```bash
pytest -q tests/path/test_file.py::test_name
```

JSON CLI filtering:

```bash
kubectl get pods -o json | jq -cr '.items[] | {name: .metadata.name, phase: .status.phase}'
```

Search before reading:

```bash
rg -n "ExactTypeOrFunction" src tests
```

Log slice:

```bash
tail -200 path/to/log | rg -n "ERROR|WARN|panic|failed"
```

## Escalation

Concise output is insufficient:

1. Run the next broader command for the failing package, test, file, or time range.
2. Capture full output only for that scope.
3. Report why expansion was needed.

If a filter such as `jq` is unavailable, use the tool's built-in filtering or quiet mode. Do not block unless the command cannot be meaningfully run.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running default verbose commands out of habit | Check `--help` for quiet, JSON, or summary flags first |
| Dumping full logs into the response | Save logs and quote/summarize only relevant lines |
| Filtering after reading everything into context | Filter in the shell before returning output |
| Treating scoped Cargo as local | `cargo check`, `cargo build`, and `cargo test` usually contend on shared target state; run them at verification gates |
