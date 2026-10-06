# Verification Prompt Template

Use this template when dispatching a verification subagent for a `verify` node.

**Purpose:** Run the exact commands from a `verify-*.md` file once every upstream task has passed its spec review.

```
Agent tool (model per jj-superpowers:choosing-model-and-effort):
  description: "Verify graph node [verify_node_id]"
  prompt: |
    You are verifying graph node `[verify_node_id]`.

    ## Inputs

    - **Verification file:** `[path/to/verify-NN-name.md]`
    - **Upstream task nodes:** `[task_01, task_02]`
    - **Working directory:** `[directory]`

    ## Your Job

    Run exactly the commands listed in the verification file, in order.
    Do not modify source files.
    Do not add, remove, or substitute commands.
    Do not invoke another agent harness through any channel — not the shell
    (`claude`, `codex`, `opencode`) and not MCP tools (e.g.
    `mcp__codex__codex`). Having the tool available is not permission to use it.
    If another agent, role, model, or broader context is needed, report BLOCKED;
    the orchestrator owns further dispatch.

    Use concise reporting. Prefer the command's quiet, structured, scoped, or filtered
    output when the verification file provides it. If a concise command fails but does
    not explain the problem, expand only the failing scope and say why expansion was
    needed. Do not dump unrelated full build/test logs into the report.

    ## Report Format

    Report:
    - **Status:** PASS | FAIL | BLOCKED
    - Commands run
    - Exit code for each command
    - Relevant output summary
    - Concise failure output, or path to captured logs when full output was needed
    - Likely responsible task node if the failure clearly maps to one upstream task

    Use BLOCKED only when a command cannot be run because required context,
    permissions, dependencies, or environment are missing.
```
