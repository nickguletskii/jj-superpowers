# jj-superpowers for OpenCode

Complete guide for using jj-superpowers with [OpenCode.ai](https://opencode.ai).

## Installation

Add jj-superpowers to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["jj-superpowers@git+https://github.com/nickguletskii/jj-superpowers.git"]
}
```

Restart OpenCode. The plugin auto-installs via Bun and registers all skills automatically.

Verify by asking: "Tell me about your jj-superpowers"

### Migrating from the old symlink-based install

If you previously installed jj-superpowers using `git clone` and symlinks, remove the old setup:

```bash
# Remove old symlinks
rm -f ~/.config/opencode/plugins/jj-superpowers.js
rm -rf ~/.config/opencode/skills/jj-superpowers

# Optionally remove the cloned repo
rm -rf ~/.config/opencode/jj-superpowers

# Remove skills.paths from opencode.json if you added one for jj-superpowers
```

Then follow the installation steps above.

## Usage

### Finding Skills

Use OpenCode's native `skill` tool to list all available skills:

```
use skill tool to list skills
```

### Loading a Skill

```
use skill tool to load jj-superpowers/brainstorming
```

### Personal Skills

Create your own skills in `~/.config/opencode/skills/`:

```bash
mkdir -p ~/.config/opencode/skills/my-skill
```

Create `~/.config/opencode/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.opencode/skills/` within your project.

**Skill Priority:** Project skills > Personal skills > jj-superpowers skills

## Updating

Superpowers updates automatically when you restart OpenCode. The plugin is re-installed from the git repository on each launch.

To pin a specific version, use a branch or tag:

```json
{
  "plugin": ["jj-superpowers@git+https://github.com/nickguletskii/jj-superpowers.git#v5.0.3"]
}
```

## How It Works

The plugin does three things:

1. **Injects compact bootstrap context** via the message transform hook, adding jj-superpowers awareness without pasting full skill bodies into every conversation.
2. **Registers the skills directory** via the `config` hook, so OpenCode discovers all jj-superpowers skills without symlinks or manual config.
3. **Registers bundled subagents** from `agents/*.md`, including the `sdd-*` roles used by `subagent-driven-development`.

The full `using-superpowers` skill stays available through OpenCode's native
skill tool. Subagents get bounded task prompts and should not load
`using-superpowers` unless the task explicitly asks them to work on skill
orchestration itself.

If an orchestrator notices jj-superpowers guidance causing wasteful,
contradictory, or unsafe behavior, including conflict with provider system
prompts or model guidance for efficient operation, it should follow the provider
guidance unless the user explicitly overrides that specific behavior. It should
also tell the user what it saw and ask them to notify jj-superpowers
maintainers.

### Tool Mapping

Skills written for Claude Code are automatically adapted for OpenCode:

- `TodoWrite` → `todowrite`
- `Task` with subagents → OpenCode's `@mention` system or Task tool with the named subagent
- `Skill` tool → OpenCode's native `skill` tool
- File operations → Native OpenCode tools

### Subagent Roles

`subagent-driven-development` prefers these named OpenCode subagents when they
are available:

- `@sdd-implementer`
- `@sdd-spec-reviewer`
- `@sdd-verifier`
- `@sdd-quality-reviewer`
- `@sdd-jj-coordinator`

Project-specific OpenCode agent files can also live in `.opencode/agents/`.

## Troubleshooting

### Plugin not loading

1. Check OpenCode logs: `opencode run --print-logs "hello" 2>&1 | grep -i jj-superpowers`
2. Verify the plugin line in your `opencode.json` is correct
3. Make sure you're running a recent version of OpenCode

### Skills not found

1. Use OpenCode's `skill` tool to list available skills
2. Check that the plugin is loading (see above)
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

### Bootstrap not appearing

1. Check OpenCode version supports `experimental.chat.system.transform` hook
2. Restart OpenCode after config changes

## Getting Help

- Report issues: https://github.com/nickguletskii/jj-superpowers/issues
- Main documentation: https://github.com/nickguletskii/jj-superpowers
- OpenCode docs: https://opencode.ai/docs/
