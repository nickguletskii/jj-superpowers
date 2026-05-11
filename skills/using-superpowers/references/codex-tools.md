# Codex Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Codex equivalent |
|-----------------|------------------|
| `Task` tool (dispatch subagent) | `spawn_agent` with a built-in or custom `agent_type` |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls |
| Task returns result | `wait` |
| Task completes automatically | `close_agent` to free slot |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively — just follow the instructions |
| `Read`, `Write`, `Edit` (files) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tools |

## Subagent Dispatch

Current Codex releases enable subagent workflows by default. If your Codex build
does not expose subagent tools, use the skill's no-subagent fallback path instead
of pretending dispatch succeeded.

Codex custom agents live in `.codex/agents/*.toml` for project-scoped agents or
`~/.codex/agents/*.toml` for personal agents. Each file defines `name`,
`description`, and `developer_instructions`; optional config such as `model`,
`model_reasoning_effort`, and `sandbox_mode` may also be set.

`jj-superpowers` includes Codex agent definitions under `.codex/agents/`. Copy
or symlink them into a project's `.codex/agents/` or your `~/.codex/agents/`
when you want named-agent dispatch outside this repository.

## Named agent dispatch

When a skill says to dispatch a named agent type:

1. If a matching Codex custom agent exists, spawn that `agent_type`.
2. Put only dynamic task context in `message`: file paths, node ids, allowed files,
   reports, and commands.
3. If no custom agent exists, fall back to the skill's prompt-template wrapping.

| Skill instruction | Codex equivalent |
|-------------------|------------------|
| `Task tool (sdd-implementer)` | `spawn_agent(agent_type="sdd-implementer", message=...)` |
| `Task tool (sdd-spec-reviewer)` | `spawn_agent(agent_type="sdd-spec-reviewer", message=...)` |
| `Task tool (sdd-verifier)` | `spawn_agent(agent_type="sdd-verifier", message=...)` |
| `Task tool (sdd-quality-reviewer)` | `spawn_agent(agent_type="sdd-quality-reviewer", message=...)` |
| `Task tool (general-purpose)` with inline prompt | `spawn_agent(message=...)` with the same prompt |

### Message framing

When using a custom agent, `message` is the dynamic invocation payload, not the
role definition. Keep it short and concrete:

```
Graph node: task_03
Task file: docs/superpowers/plans/.../task-03.md
Allowed files:
- src/foo.ts
- tests/foo.test.ts
Context:
- docs/superpowers/plans/.../context/architecture.md
Orchestrator notes:
- ...
```

If falling back to generic agents without a custom agent, wrap the filled prompt
template in clear task-delegation framing and XML tags as before.

## Environment Detection

Skills that set up work scopes or finish branches should detect whether
jj is available before proceeding:

```bash
# Check if this is a jj repository
jj root --no-pager 2>/dev/null && echo "jj" || echo "git"
```

- If jj: use `jujutsu` for version-control operations and `using-jj-worksets` / `jj-reorg-changes` for optional post-implementation history organization
- If git only: use traditional branch workflow

For `finishing-a-development-branch` in sandbox environments where push
is blocked, the agent can still run tests and output suggested bookmark
names and PR descriptions for the user to copy.

## Codex App Finishing

When the sandbox blocks push operations, the agent commits/squashes all
work and informs the user to use the App's native controls:

- **"Create branch"** — names the bookmark, then push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout
