---
name: uv-guide
description: Using uv for Python scripting, package management, and development with sandbox awareness
---

# uv: Fast Python Package Manager & Script Runner

`uv` is a blazingly fast Python package installer and script runner. Use it to:
- Run Python scripts with automatic dependency installation
- Create reproducible isolated environments
- Manage Python projects without slow pip or poetry
- Work safely within sandboxed agent environments

## Quick Start

### Run a Script with Dependencies

```bash
uv run script.py arg1 arg2
```

If the script has [PEP 723](https://peps.python.org/pep-0723/) inline dependencies:
```python
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "requests>=2.28.0",
#     "rich>=13.0",
# ]
# ///
```

`uv run` automatically installs dependencies into an isolated environment and runs it. **No pyproject.toml needed.**

### Install a Package

```bash
# One-time install to a venv
uv venv
source .venv/bin/activate
uv pip install package-name

# Or use uv directly
uv pip install package-name
```

## Installation

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Or via package managers
brew install uv          # macOS
apt install uv           # Ubuntu (if available)
cargo install uv         # Rust (if Cargo installed)
```

**Verify installation:**
```bash
uv --version
```

## Using uv in Sandboxed Agent Environments

Agent platforms often restrict file writes, cache directories, and network access. **Run `uv` normally first**, then adapt only if the platform blocks something you need.

Common symptoms:
- Package downloads fail because network access is restricted
- Cache writes fail because the sandbox blocks uv's cache directory
- Repeated installs are slow because the cache is temporary
- `uv run`, `uv pip install`, or `uv sync` reports `Permission denied` or `Operation not permitted`

### Codex

In Codex, run the needed command normally first:

```bash
uv run script.py
uv pip install package-name
uv sync
```

If dependency downloads fail due to network restrictions, or cache writes fail due to sandbox permissions, rerun the exact needed command through Codex's escalation/approval flow.

Keep approvals scoped to the uv command you need. Do not request broad arbitrary Python execution approval, such as unrestricted `python`, `python3`, or arbitrary script execution, when the blocked operation is a specific `uv run`, `uv sync`, or `uv pip install`.

If the platform cannot grant persistent cache access, use a temporary cache as a workaround:

```bash
UV_CACHE_DIR=$TMPDIR uv run script.py
```

### Claude Code

Claude Code may run with a sandbox that restricts file and network access. Depending on local configuration, the sandbox may allow read/write access to paths such as:
- Current working directory (`.`)
- `$TMPDIR` — temporary files (auto-cleaned)
- `~/.cache/uv` — uv cache
- Other explicitly allowlisted tool caches

`uv` uses a cache directory by default, commonly `~/.cache/uv` on Unix-like systems. If that path is not allowlisted, either ask Claude Code to allow the cache path or use a temporary cache.

If you see permission errors, uv's cache directory might not be in the sandbox allowlist. Ask Claude to add it:

> "I'm getting permission denied when running `uv pip install`. Can you add `~/.cache/uv` to the sandbox allowlist via the `/sandbox` command?"

Claude Code's `/sandbox` command lets you add paths:

```bash
/sandbox --allow-read ~/.cache/uv --allow-write ~/.cache/uv
```

Or use `$TMPDIR` temporarily:

```bash
UV_CACHE_DIR=$TMPDIR uv run script.py
```

### Other Agent Platforms

For OpenCode, Gemini CLI, GitHub Copilot CLI, and other agent environments, check the platform's sandbox and approval documentation. The general pattern is the same: run `uv` normally, then request the narrowest permission needed for package downloads or cache writes if the platform blocks them.

### If You Get Permission Denied

**Symptom:** `Operation not permitted` when running `uv run` or `uv pip install`

**Diagnosis:**

Check if the sandbox is restricting uv:
```bash
# This might fail if uv's cache directory is not writable
uv pip install requests
```

**Solution:**

Use your platform's approval flow to allow the specific blocked `uv` command, configure the platform to allow the uv cache directory, or point uv at a temporary cache:

```bash
UV_CACHE_DIR=$TMPDIR uv run script.py
```

### Best Practices in Sandbox

1. **Use PEP 723 for scripts** — no setup files needed:
   ```python
   # /// script
   # requires-python = ">=3.9"
   # dependencies = ["requests"]
   # ///
   ```

2. **Prefer persistent caches when the platform allows them** — don't force `$TMPDIR` unless you have permission issues or no persistent cache access

3. **Isolate per script** — `uv run` creates isolated environments automatically:
   ```bash
   uv run script1.py  # env1, installed deps
   uv run script2.py  # env2, separate deps (if different)
   ```

4. **For development, use a venv:**
   ```bash
   uv venv .venv
   source .venv/bin/activate
   uv pip install -e .  # editable install
   ```

## Examples

### Example 1: Run a Script with Dependencies (No Setup)

**script.py:**
```python
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "requests>=2.28.0",
#     "click>=8.0",
# ]
# ///

import requests
import click

@click.command()
@click.option('--url', default='https://api.github.com', help='API URL')
def fetch(url):
    response = requests.get(url)
    click.echo(f"Status: {response.status_code}")

if __name__ == "__main__":
    fetch()
```

**Run it:**
```bash
uv run script.py --url https://api.github.com
# Automatically installs requests and click, runs script
```

### Example 2: Create a Project with uv

```bash
# Create project directory
mkdir my-project
cd my-project

# Initialize with uv
uv init

# Check pyproject.toml (auto-created)
cat pyproject.toml

# Add dependencies
uv add requests click

# Create virtual environment
uv venv

# Activate and run
source .venv/bin/activate
python src/my_project/__main__.py
```

### Example 3: Run a One-Off Tool

```bash
# Check Python version
uv run --python 3.11 -c "import sys; print(sys.version)"

# Run a tool without installing it globally
uv run httpie https://httpbin.org/get

# Data processing with pandas
uv run --with pandas -c "import pandas as pd; df = pd.read_csv('data.csv'); print(df.head())"
```

### Example 4: Troubleshoot Sandbox Permissions

**If you see permission errors:**

```bash
# Try with $TMPDIR cache (temporary workaround)
UV_CACHE_DIR=$TMPDIR uv run script.py

# Or use your platform's approval/sandbox flow to allow uv's cache path
```

Once configured, you can use uv normally:
```bash
uv run script.py
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `uv run script.py` | Run script with PEP 723 deps |
| `uv venv` | Create virtual environment |
| `uv pip install pkg` | Install package to venv |
| `uv pip list` | List installed packages |
| `uv add pkg` | Add dependency to project |
| `uv remove pkg` | Remove dependency |
| `uv sync` | Install all project dependencies |
| `uv lock` | Create lock file (reproducibility) |
| `uv compile` | Compile .py to .pyc |

## PEP 723: Inline Script Metadata

PEP 723 lets scripts declare their own dependencies without extra files.

**Syntax:**
```python
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "package-name>=1.0.0",
#     "another-package",
# ]
# ///
```

**Supported fields:**
- `requires-python` — Python version (e.g., `">=3.9"`)
- `dependencies` — List of packages with version specs
- `authors` — Author information
- `description` — Package description
- `keywords` — Keywords
- `license` — License info

**Why use it?**
- Single file, no setup.py or pyproject.toml needed
- Scripts are portable and self-contained
- Works with `uv run` out of the box
- Standard, future-proof approach

## Integration with Skills

Skills that provide Python scripts can use `uv run` for:
- **dot-to-jj-dag** — DAG builder script
- Any CLI tool requiring dependencies
- Data processing pipelines
- Development utilities

**Example from dot-to-jj-dag skill:**
```bash
uv run skills/dot-to-jj-dag/dot-to-jj-dag.py example.dot --anchor-map anchors.txt
```

## Troubleshooting

### "Command not found: uv"

Install uv:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### "Permission denied" on `uv run` or `uv pip install`

In a sandboxed agent environment, this usually means the cache directory is not writable or the needed package download was blocked. Options:

1. **Use the platform approval flow for the specific command:**
   ```bash
   uv run script.py
   uv sync
   uv pip install package-name
   ```

2. **Use $TMPDIR temporarily:**
   ```bash
   UV_CACHE_DIR=$TMPDIR uv run script.py
   ```

3. **Check cache location:**
   ```bash
   uv cache dir
   ```

### Package installation is slow

First run with a new package downloads and caches it. Subsequent runs use cache. If slow persists:

```bash
# Clear cache
uv cache clean

# Or use --no-cache
uv run --no-cache script.py
```

### "ModuleNotFoundError" despite installing

Ensure dependencies are in PEP 723 metadata or installed in active venv:
```bash
# Activate venv if you created one
source .venv/bin/activate

# Or use uv run (auto-installs from PEP 723)
uv run script.py
```

## Resources

- **Official docs:** https://docs.astral.sh/uv/
- **PEP 723:** https://peps.python.org/pep-0723/
- **GitHub:** https://github.com/astral-sh/uv
- **Install guide:** https://docs.astral.sh/uv/getting-started/installation/

## See Also

- **dot-to-jj-dag skill** — Uses `uv run` for programmatic DAG creation
- **Sandboxed agent environments** — Use the platform-specific approval or sandbox controls when network or cache permissions block uv
