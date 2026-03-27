# GitHub Copilot CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your Copilot CLI equivalent:

## File Operations

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `Read` (file reading) | `view` |
| `Write` (file creation) | `create` |
| `Edit` (file editing) | `edit` |
| — | `apply_patch` (alternative to `edit`/`create` for larger changes) |

## Shell

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `Bash` (run commands) | `bash` / `powershell` |
| — | `read_bash` / `read_powershell` (read output from a running shell session) |
| — | `write_bash` / `write_powershell` (send input to a shell session) |
| — | `stop_bash` / `stop_powershell` (terminate a shell session) |
| — | `list_bash` / `list_powershell` (list active shell sessions) |

## Search

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `Grep` (search file content) | `grep` / `rg` |
| `Glob` (search files by name) | `glob` |

## Task Tracking

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `TodoWrite` (task tracking) | `update_todo` |

## Subagent Dispatch

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `Task` tool (dispatch subagent) | `task` |
| — | `read_agent` (check background agent status) |
| — | `list_agents` (list available agents) |
| `Skill` tool (invoke a skill) | `skill` |

## Web

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `WebFetch` | `web_fetch` |
| — | `fetch_copilot_cli_documentation` (look up CLI documentation) |

## Memory and State

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| — | `store_memory` (persist facts across sessions) |

## Flow Control

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `ExitPlanMode` | `exit_plan_mode` |
| — | `report_intent` (report planned actions before executing) |
| — | `show_file` (display a file prominently in the UI) |
| — | `task_complete` (signal task done — autopilot mode only) |

## Additional Copilot CLI Tools (no CC equivalent)

| Tool | Purpose |
|------|---------|
| `ask_user` | Request input from the user interactively |
| `sql` | Query session data (experimental) |
| `lsp` | Language server refactoring (experimental) |

## Subagent Dispatch Notes

Copilot CLI's `task` tool dispatches sub-agents similarly to Claude Code's `Task` tool. When a skill references a named agent type like `superpowers:code-reviewer`:

1. Find the agent's prompt file (e.g., `agents/code-reviewer.md` or a skill-local prompt template like `code-quality-reviewer-prompt.md`)
2. Read and fill any template placeholders (`{BASE_SHA}`, `{WHAT_WAS_IMPLEMENTED}`, etc.)
3. Dispatch via `task` with the filled content as the task description

## No Interactive Input

Never run commands that open editors or require interactive input. Always use non-interactive flags:

- `jj describe` → `jj describe -r <id> -m "message"`
- `jj new` → `jj new --no-edit -m "message" ...`
- Always pass `--no-pager` to log/diff commands
