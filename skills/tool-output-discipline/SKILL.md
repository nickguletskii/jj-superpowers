---
name: tool-output-discipline
description: Use before running builds, test suites, logs, or broad searches — `cargo`, `bazel`, `npm`, `tsc`, `pytest`, `kubectl`, CI and service logs, repo-wide grep — and when output gets truncated or floods the context, or a permission-gated command keeps needing approval.
---

# Tool Output Discipline

Command output is context; ask tools for the smallest output that answers the question. Tiny bounded commands don't need this.

Before a build or test run, finish the coherent implementation chunk and check whether valid existing results already answer the question. Run earlier only when a concrete uncertainty blocks further work or an explicit requirement calls for it. See `jj-superpowers:verification-before-completion` for verification timing and evidence reuse.

1. Name the question the command must answer.
2. Use the narrowest form that answers it: selectors, quiet flags, JSON output, filters.
3. If that isn't enough, expand only the failing package, test, file, or time range, capture full output for that scope, and say why you expanded.

| Need | Prefer | Avoid first |
|------|--------|-------------|
| Pass/fail | quiet command + exit code | verbose default logs |
| Compiler errors | structured diagnostics filtered to errors | full human output |
| Test failure | single test selector + quiet mode | whole-suite output |
| Search | `rg -n "pattern" path` | file dumps |
| JSON-capable CLI | `--json` / `-o json` + `jq` | human tables |
| Logs | `tail`, time range, `rg` filter | unbounded streams |

```bash
# Cargo errors only. Not a pass/fail signal on its own unless the shell preserves Cargo's exit status.
cargo check --message-format json-diagnostic-short -q | jq -crM 'select(.message.level == "error")'
pytest -q tests/path/test_file.py::test_name
kubectl get pods -o json | jq -cr '.items[] | {name: .metadata.name, phase: .status.phase}'
tail -200 path/to/log | rg -n "ERROR|WARN|panic|failed"
```

If `jq` or a similar filter is missing, use the tool's own quiet or filter options rather than blocking.

## Permission-friendly commands

Harnesses gate commands by statically analyzing each invocation, so substitutions, pipes, shell variables, redirects, and compound scripts can trigger approval prompts even when every operation is harmless. For anything that may need network, cache, device, or unsandboxed filesystem access:

- Use a direct command or a checked-in helper script with named arguments; avoid inline env assignments, heredocs, `$(...)`, subshells, heavy redirection, `&&`/`||` chains, and `bash -lc` wrappers.
- If a command keeps needing approval, make it a permanent helper script so the harness can allowlist the prefix, and name that helper in verification plans.
- Push filtering into the tool's own selectors (paths, globs, `--stat`, `--limit`), then follow up with literal paths or IDs copied from the output rather than shell variables. The harness output limit is the last guard, not the filter.
- Single-quote patterns containing backticks; inside double quotes they are command substitution.

```sh
# Prompts: variable, substitution, pipes, redirects
P=$(rg --files 2>/dev/null | grep -iE 'schema\.rs')
rg -n 'CameraSchema' "$P" 2>&1 | head -40

# Analyzable
rg -n -m 40 --glob '*[sS]chema.rs' 'CameraSchema'
```

## Common mistakes

- Filtering after the full output is already in context — filter in the command.
- Treating package-scoped `cargo check/build/test` as local: they contend on the shared target directory, so run them at verification gates.
- Pasting full logs into a response instead of saving them and quoting the relevant lines.
