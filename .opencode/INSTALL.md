# Installing Superpowers for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add jj-superpowers to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["jj-superpowers@git+https://github.com/nickguletskii/jj-superpowers.git"]
}
```

Restart OpenCode. That's it — the plugin auto-installs and registers all skills.

Verify by asking: "Tell me about your jj-superpowers"

## Migrating from the old symlink-based install

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

Use OpenCode's native `skill` tool:

```
use skill tool to list skills
use skill tool to load jj-superpowers/brainstorming
```

## Updating

Superpowers updates automatically when you restart OpenCode.

To pin a specific version:

```json
{
  "plugin": ["jj-superpowers@git+https://github.com/nickguletskii/jj-superpowers.git#v5.0.3"]
}
```

## Troubleshooting

### Plugin not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i jj-superpowers`
2. Verify the plugin line in your `opencode.json`
3. Make sure you're running a recent version of OpenCode

### Skills not found

1. Use `skill` tool to list what's discovered
2. Check that the plugin is loading (see above)

### Tool mapping

When skills reference Claude Code tools:
- `TodoWrite` → `todowrite`
- `Task` with subagents → `@mention` syntax
- `Skill` tool → OpenCode's native `skill` tool
- File operations → your native tools

## Getting Help

- Report issues: https://github.com/nickguletskii/jj-superpowers/issues
- Full documentation: https://github.com/nickguletskii/jj-superpowers/blob/main/docs/README.opencode.md
