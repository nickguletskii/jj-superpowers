# Verification Prompt Template

Use this template when dispatching a verification subagent for a `verify` node.

**Purpose:** Run the exact commands from a `verify-*.md` file once all upstream spec reviews have passed.

```
Task tool (cheap model unless debugging is required):
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
