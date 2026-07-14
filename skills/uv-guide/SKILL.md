---
name: uv-guide
description: Use when running Python scripts with uv, managing Python packages, dependencies, or virtualenvs, or when uv hits sandbox permission or cache errors (such as "Operation not permitted").
---

# uv: Fast Python Package Manager & Script Runner

`uv` is a fast Python package installer and script runner: run scripts with automatic dependency installation, create reproducible isolated environments, and manage projects without pip or poetry.

## Quick Start

### Run a script with dependencies

```bash
uv run script.py arg1 arg2
```

`uv run` installs the script's [PEP 723](https://peps.python.org/pep-0723/) inline dependencies into an isolated environment (one per script) and runs it. **No pyproject.toml needed.**

```python
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "requests>=2.28.0",
#     "rich>=13.0",
# ]
# ///
```

Other supported PEP 723 fields: `authors`, `description`, `keywords`, `license`.

### Install a package

```bash
uv pip install package-name    # into the active/managed venv

# For development, create a venv explicitly:
uv venv .venv
source .venv/bin/activate
uv pip install -e .            # editable install
```

## Installation

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh             # macOS / Linux
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"  # Windows
brew install uv                                             # macOS
apt install uv                                              # Ubuntu (if available)
cargo install uv                                            # via Cargo

uv --version                                                # verify
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `uv run script.py` | Run script with PEP 723 deps |
| `uv run --python 3.11 -c "import sys; print(sys.version)"` | Run inline code on a specific Python |
| `uv run --with pandas -c "..."` | Run with an extra dep, no manifest |
| `uv run httpie https://httpbin.org/get` | Run a tool without installing it globally |
| `uv init` | Initialize a project (creates `pyproject.toml`) |
| `uv venv` | Create virtual environment |
| `uv pip install pkg` | Install package to venv |
| `uv pip list` | List installed packages |
| `uv add pkg` / `uv remove pkg` | Add / remove a project dependency |
| `uv sync` | Install all project dependencies |
| `uv lock` | Create lock file (reproducibility) |
| `uv pip compile` | Compile `requirements.in` → pinned `requirements.txt` lockfile |
| `uv cache dir` / `uv cache clean` | Show / clear the cache |
| `uv run --no-cache script.py` | Bypass the cache |

## Sandboxed Agent Environments

Agent platforms often restrict file writes, cache directories, and network access. **Run `uv` normally first**, then adapt only if the platform blocks something you need.

Symptoms: `uv run` / `uv pip install` / `uv sync` reports `Permission denied` or `Operation not permitted`; package downloads fail on a restricted network; repeated installs are slow because the cache is temporary.

`uv` caches in `~/.cache/uv` by default on Unix-like systems. If that path (or the network) is blocked:

1. **Request the narrowest permission for the exact command you need**, via the platform's approval/escalation flow (Codex) or by allowlisting the cache path. Do not request broad arbitrary Python execution (`python`, `python3`, arbitrary script execution) when the blocked operation is a specific `uv run`, `uv sync`, or `uv pip install`.

   Claude Code allowlists paths with `/sandbox`:
   ```bash
   /sandbox --allow-read ~/.cache/uv --allow-write ~/.cache/uv
   ```

2. **Fall back to a temporary cache** when persistent cache access cannot be granted:
   ```bash
   UV_CACHE_DIR=$TMPDIR uv run script.py
   ```
   Prefer a persistent cache whenever the platform allows one — don't force `$TMPDIR` by default.

For OpenCode and other agent platforms the pattern is the same: run `uv` normally, then request the narrowest permission needed for the package download or cache write.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Command not found: uv` | Install it (see Installation) |
| `Permission denied` / `Operation not permitted` | Sandbox is blocking the cache or network — see above; confirm the path with `uv cache dir` |
| Install is slow | First run downloads and caches; if it persists, `uv cache clean` or `uv run --no-cache script.py` |
| `ModuleNotFoundError` despite installing | Dep missing from the script's PEP 723 block, or the venv isn't active — use `uv run` (auto-installs) or `source .venv/bin/activate` |

## Running Skill Tools

Skill-provided Python tools (CLI utilities, DAG builders, data pipelines) run under `uv run`, which resolves their PEP 723 deps automatically:

```bash
uv run ~/.jj-superpowers/tools/dot-to-jj-dag.py example.dot --anchor-map anchors.txt
```

## Resources

- Official docs: https://docs.astral.sh/uv/
- Install guide: https://docs.astral.sh/uv/getting-started/installation/
- PEP 723: https://peps.python.org/pep-0723/
- GitHub: https://github.com/astral-sh/uv
