# jj-superpowers for Codex

Guide for using jj-superpowers with OpenAI Codex via native skill discovery.

## Quick Install

Tell Codex:

```
Fetch and follow instructions from https://raw.githubusercontent.com/nickguletskii/jj-superpowers/refs/heads/main/.codex/INSTALL.md
```

## Manual Installation

### Prerequisites

- OpenAI Codex CLI
- Git

### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/nickguletskii/jj-superpowers.git ~/.codex/jj-superpowers
   ```

2. Install flat skill links and bundled Codex custom agents:
   ```bash
   cd ~/.codex/jj-superpowers
   deno run -A scripts/install-harnesses.ts install --harness codex
   ```

3. Restart Codex.

Current Codex releases enable subagent workflows by default. These custom agents let `subagent-driven-development` dispatch durable role prompts instead of embedding all role instructions in each task message.

### Windows

The automated installer currently targets Linux/macOS symlink semantics. Windows junction support is not implemented.

## How It Works

Codex has native skill discovery — it scans `~/.agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. jj-superpowers skills are made visible as flat per-skill links:

```
~/.agents/skills/using-superpowers/ → ~/.codex/jj-superpowers/skills/using-superpowers/
~/.agents/skills/brainstorming/ → ~/.codex/jj-superpowers/skills/brainstorming/
```

The `using-superpowers` skill is discovered automatically and enforces skill
usage discipline when loaded. Codex does not need a startup hook that pastes the
full skill body into every conversation.

Bundled Codex subagent definitions live under:

```
~/.codex/jj-superpowers/.codex/agents/
```

Codex discovers custom agents from `~/.codex/agents/` or project-local
`.codex/agents/`, so symlink or copy the bundled files there when using named
subagent dispatch.

## Usage

Skills are discovered automatically. Codex activates them when:
- You mention a skill by name (e.g., "use brainstorming")
- The task matches a skill's description
- The `using-superpowers` skill directs Codex to use one

Codex subagents should receive bounded task prompts. They should skip
`using-superpowers` and load only skills directly relevant to the assigned task.
They must not start nested agent sessions by running `codex`, `claude`,
`gemini`, `opencode`, or any other agent harness from the shell; if
more delegation is needed, the orchestrator dispatches it through Codex's native
subagent tool.

If an orchestrator notices jj-superpowers guidance causing wasteful,
contradictory, or unsafe behavior, including conflict with provider system
prompts or model guidance for efficient operation, it should follow the provider
guidance unless the user explicitly overrides that specific behavior. It should
also tell the user what it saw and ask them to notify jj-superpowers
maintainers.

For optional jj config that disables pagers/editors and forces git-style diffs in agent sessions, see `docs/superpowers/jj-agent-config.md`.

### Personal Skills

Create your own skills in `~/.agents/skills/`:

```bash
mkdir -p ~/.agents/skills/my-skill
```

Create `~/.agents/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

The `description` field is how Codex decides when to activate a skill automatically — write it as a clear trigger condition.

## Updating

```bash
cd ~/.codex/jj-superpowers && git pull
```

Skills update instantly through the per-skill symlinks.

## Uninstalling

```bash
cd ~/.codex/jj-superpowers
deno run -A scripts/install-harnesses.ts uninstall --harness codex
```

Optionally delete the clone: `rm -rf ~/.codex/jj-superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\jj-superpowers"`).

## Troubleshooting

### Skills not showing up

1. Verify a skill symlink: `ls -la ~/.agents/skills/using-superpowers`
2. Check source skills exist: `ls ~/.codex/jj-superpowers/skills`
3. Restart Codex — skills are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/nickguletskii/jj-superpowers/issues
- Main documentation: https://github.com/nickguletskii/jj-superpowers
