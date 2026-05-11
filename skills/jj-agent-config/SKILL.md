---
name: jj-agent-config
description: |
  Sets up Jujutsu (jj) configuration optimized for use in agentic workflows, including disabling the pager, forcing git-style diffs, and adding helpful aliases. Activated via environment variables for specific agents.
---

# jj-agent-config

## Purpose
Configures Jujutsu (jj) for optimal use in agentic workflows by hardening the environment against interactive commands, disabling the pager, forcing git-style diffs, and adding helpful aliases.

## When to Use
Use this skill when:
- The user asks you to configure jj for agentic workflows or AI agents.
- The user wants to optimize jj for use in Claude Code, OpenCode, Codex, or GitHub Copilot CLI.

## How to Apply

1. Create a `jj-superpowers.toml` file in the correct platform-specific jujutsu config directory.
2. Tell the user how to configure their agent environment variables to activate it.

### Step 1: Write the config file

Determine the platform-specific jj config directory:
- Linux: `~/.config/jj/config.d/`
- macOS: `~/Library/Application Support/jj/config.d/` (or `~/.config/jj/config.d/` depending on setup)
- Windows: `%APPDATA%\jj\config.d\`

Create the directory if it doesn't exist.

Write the following content to `jj-superpowers.toml` inside that directory:

```toml
# jj-superpowers.toml - Optimized jj configuration for AI agents
# This configuration only activates when running inside a recognized AI agent.
# See https://docs.jj-vcs.dev/latest/config/

[[--scope]]
--when.env = { "CLAUDE_CODE_ENV" = "1", "OPENCODE_ENV" = "1", "CODEX_ENV" = "1", "GITHUB_COPILOT_CLI_ENV" = "1" }
--when.env-any = true

[ui]
# Disable the pager to ensure full output is returned to the agent
pager = ""

# Force git-style diffs, which are easier for agents to parse and apply via text replacements
diff.format = "git"

# Harden against interactive editors freezing the agent loop
editor = "/bin/false"
merge-editor = "/bin/false"
conflict-marker-style = "diff3"

[aliases]
# Shorthand aliases to reduce token overhead for common agent commands
l = ["log"]
s = ["show"]
d = ["diff"]
st = ["status"]

# Shortcuts for common workflows
ws = ["workspace"]
bm = ["bookmark"]
```

### Step 2: Instruct the user on environment variables

After writing the file, provide the user with clear instructions on how to set the environment variable for their specific agent. For example:

**For Claude Code:**
Set `CLAUDE_CODE_ENV=1` in the environment before launching Claude Code (e.g., `CLAUDE_CODE_ENV=1 claude`). You can also set this in your `.bashrc` or `.zshrc`.

**For OpenCode:**
Set `OPENCODE_ENV=1` in the environment before launching OpenCode (e.g., `OPENCODE_ENV=1 opencode`).

**For Codex:**
Set `CODEX_ENV=1` in the environment before launching Codex (e.g., `CODEX_ENV=1 codex`).

**For GitHub Copilot CLI:**
Set `GITHUB_COPILOT_CLI_ENV=1` in the environment before launching the GitHub Copilot CLI (e.g., `GITHUB_COPILOT_CLI_ENV=1 gh copilot`).
