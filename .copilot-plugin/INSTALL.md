# Installing Superpowers for GitHub Copilot CLI

## Prerequisites

- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli) installed
- Plugin support enabled in your Copilot CLI configuration

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/nickguletskii/jj-superpowers.git ~/.config/gh-copilot/superpowers
   ```

2. **Register the plugin** by pointing Copilot CLI to the `.copilot-plugin/` directory:
   ```bash
   # Add to your Copilot CLI plugin configuration
   gh copilot plugin add ~/.config/gh-copilot/superpowers/.copilot-plugin
   ```

   Consult the [Copilot CLI plugin docs](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating) for the exact registration mechanism for your version.

3. **Restart Copilot CLI** to discover the skills.

## Usage

Use the `skill` tool to invoke skills:

```
skill brainstorming
skill superpowers/test-driven-development
skill superpowers/systematic-debugging
```

## Tool Mapping

When skills reference Claude Code tool names, use the Copilot CLI equivalents.
See `skills/using-superpowers/references/copilot-tools.md` for the full mapping.

Key mappings:
- `Read` → `view`
- `Write` → `create`
- `Edit` → `edit`
- `Bash` → `bash` / `powershell`
- `Task` → `task`
- `TodoWrite` → `update_todo`
- `Skill` → `skill`

## Updating

```bash
cd ~/.config/gh-copilot/superpowers && git pull
```

## Getting Help

- Report issues: https://github.com/nickguletskii/jj-superpowers/issues
