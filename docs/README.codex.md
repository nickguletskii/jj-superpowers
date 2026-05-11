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

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/jj-superpowers/skills ~/.agents/skills/jj-superpowers
   ```

3. Restart Codex.

4. **For named subagent roles** (optional): install the bundled Codex custom agents:
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.codex/jj-superpowers/.codex/agents/sdd-implementer.toml ~/.codex/agents/sdd-implementer.toml
   ln -s ~/.codex/jj-superpowers/.codex/agents/sdd-spec-reviewer.toml ~/.codex/agents/sdd-spec-reviewer.toml
   ln -s ~/.codex/jj-superpowers/.codex/agents/sdd-verifier.toml ~/.codex/agents/sdd-verifier.toml
   ln -s ~/.codex/jj-superpowers/.codex/agents/sdd-quality-reviewer.toml ~/.codex/agents/sdd-quality-reviewer.toml
   ln -s ~/.codex/jj-superpowers/.codex/agents/sdd-jj-coordinator.toml ~/.codex/agents/sdd-jj-coordinator.toml
   ```

   Current Codex releases enable subagent workflows by default. These custom
   agents let `subagent-driven-development` dispatch durable role prompts instead
   of embedding all role instructions in each task message.

### Windows

Use a junction instead of a symlink (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\jj-superpowers" "$env:USERPROFILE\.codex\jj-superpowers\skills"
```

## How It Works

Codex has native skill discovery — it scans `~/.agents/skills/` at startup, parses SKILL.md frontmatter, and loads skills on demand. jj-superpowers skills are made visible through a single symlink:

```
~/.agents/skills/jj-superpowers/ → ~/.codex/jj-superpowers/skills/
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

If an orchestrator notices jj-superpowers guidance causing wasteful,
contradictory, or unsafe behavior, including conflict with provider system
prompts or model guidance for efficient operation, it should follow the provider
guidance unless the user explicitly overrides that specific behavior. It should
also tell the user what it saw and ask them to notify jj-superpowers
maintainers.

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

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/jj-superpowers
```

**Windows (PowerShell):**
```powershell
Remove-Item "$env:USERPROFILE\.agents\skills\jj-superpowers"
```

Optionally delete the clone: `rm -rf ~/.codex/jj-superpowers` (Windows: `Remove-Item -Recurse -Force "$env:USERPROFILE\.codex\jj-superpowers"`).

## Troubleshooting

### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/jj-superpowers`
2. Check skills exist: `ls ~/.codex/jj-superpowers/skills`
3. Restart Codex — skills are discovered at startup

### Windows junction issues

Junctions normally work without special permissions. If creation fails, try running PowerShell as administrator.

## Getting Help

- Report issues: https://github.com/nickguletskii/jj-superpowers/issues
- Main documentation: https://github.com/nickguletskii/jj-superpowers
