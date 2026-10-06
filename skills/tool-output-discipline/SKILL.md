---
name: tool-output-discipline
description: Use before running builds, test suites, logs, or broad searches — `cargo`, `bazel`, `npm`, `tsc`, `pytest`, `kubectl`, CI and service logs, repo-wide grep — and after any command floods the context. Triggers on truncated or cut-off output, a huge tool result, a permission-gated command that keeps needing approval, or piping a big dump into `grep`/`head`.
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

## Permission-Friendly Commands

Harnesses often gate commands by statically analyzing each invocation; command substitutions, pipes, shell variables, redirects, and compound scripts can trigger approval prompts even when every underlying operation is harmless. Commands that may need network, cache, device, or unsandboxed filesystem permissions must be short, stable, and allowlist-friendly.

- Prefer a direct command or checked-in helper script with named arguments.
- Avoid inline environment assignments, heredocs, command substitution, subshells, redirection-heavy commands, and chained `&&` / `||` logic for permission-gated work.
- Avoid opaque `bash -lc` / `sh -c` wrappers when a direct command or helper script can do the job.
- If a command repeatedly needs approval, create or use a permanent helper script so the harness can whitelist a common prefix.
- In verification plans, name the helper command directly instead of a one-off shell incantation.
- Do not pack discovery, filtering, variable assignment, redirection, and truncation into one clever snippet. Push filtering into the tool's own selectors (path arguments, filesets, include/exclude, `--stat`, `--limit`), then run follow-ups with literal paths, revisions, or IDs copied from the prior output — not hidden in shell variables. The harness output limit is the final guard, not the primary filter.
- When a search pattern contains literal backticks, single-quote it or escape them: inside double quotes, backticks are command substitution.

```sh
# Bad: variable, substitution, pipes, redirects
P=$(rg --files 2>/dev/null | grep -iE 'schema\.rs')
rg -n 'CameraSchema' "$P" 2>&1 | head -40

# Good: one literal, analyzable command
rg -n -m 40 --glob '*[sS]chema.rs' 'CameraSchema'
```

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
| Asking users to approve one-off shell tricks | Use a stable helper script or simple command prefix that can be allowlisted |
