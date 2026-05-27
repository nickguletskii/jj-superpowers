# jj Agent Configuration

This is optional setup for making jj safer and quieter in agent sessions. It is documentation, not a discoverable skill.

Create `jj-superpowers.toml` in the jj config directory:

- Linux: `~/.config/jj/config.d/`
- macOS: `~/Library/Application Support/jj/config.d/` or `~/.config/jj/config.d/`
- Windows: `%APPDATA%\jj\config.d\`

```toml
[[--scope]]
--when.env = { "CLAUDE_CODE_ENV" = "1", "OPENCODE_ENV" = "1", "CODEX_ENV" = "1", "GITHUB_COPILOT_CLI_ENV" = "1" }
--when.env-any = true

[ui]
pager = ""
diff.format = "git"
editor = "/bin/false"
merge-editor = "/bin/false"
conflict-marker-style = "diff3"

[aliases]
l = ["log"]
s = ["show"]
d = ["diff"]
st = ["status"]
ws = ["workspace"]
bm = ["bookmark"]
```

Set the matching environment variable before launching the agent:

- Claude Code: `CLAUDE_CODE_ENV=1`
- OpenCode: `OPENCODE_ENV=1`
- Codex: `CODEX_ENV=1`
- GitHub Copilot CLI: `GITHUB_COPILOT_CLI_ENV=1`

