---
name: uv-guide
description: Use when running Python scripts with uv, managing Python packages, dependencies, or virtualenvs, or when uv hits sandbox permission or cache errors (such as "Operation not permitted").
---

# uv

## Scripts with inline dependencies

`uv run script.py args` installs the script's [PEP 723](https://peps.python.org/pep-0723/) inline dependencies into an isolated per-script environment and runs it; no `pyproject.toml` needed. Skill-provided Python tools run this way.

```python
# /// script
# requires-python = ">=3.9"
# dependencies = ["requests>=2.28.0", "rich>=13.0"]
# ///
```

## Common commands

| Command | Purpose |
|---------|---------|
| `uv run --python 3.11 -c "..."` | Run inline code on a specific Python |
| `uv run --with pandas -c "..."` | Run with an extra dep, no manifest |
| `uvx --from httpie http ...` | Run a tool without installing it (`--from` when command and package names differ) |
| `uv init` / `uv add pkg` / `uv remove pkg` | Create a project / manage its dependencies |
| `uv sync` / `uv lock` | Install project deps / write the lockfile |
| `uv venv` then `uv pip install [-e .] pkg` | Ad hoc virtualenv |
| `uv pip compile requirements.in` | Pin a `requirements.txt` |
| `uv cache dir` / `uv cache clean` | Show / clear the cache |

If `uv` is missing: `curl -LsSf https://astral.sh/uv/install.sh | sh` (or `brew install uv`, `cargo install uv`). A `ModuleNotFoundError` usually means the dep is missing from the PEP 723 block or the script was run with plain `python` instead of `uv run`.

## Sandboxed agent environments

Run `uv` normally first; adapt only if the platform blocks something. Symptoms: `Permission denied` / `Operation not permitted` from `uv run`, `uv sync`, or `uv pip install`, or downloads failing on a restricted network. The cache lives in `~/.cache/uv` on Unix (confirm with `uv cache dir`).

1. Request the narrowest permission for the exact command — the platform's approval/escalation flow (Codex, OpenCode) or an allowlist entry for the cache path. In Claude Code, ask the user to run `/sandbox` and allow `~/.cache/uv`. Don't ask for broad arbitrary Python execution when the blocked operation is one `uv` command.
2. If persistent cache access can't be granted, fall back to a temporary cache: `UV_CACHE_DIR=$TMPDIR uv run script.py`. Don't force this by default; a persistent cache is much faster.

Docs: https://docs.astral.sh/uv/
