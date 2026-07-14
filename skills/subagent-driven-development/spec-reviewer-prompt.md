# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent. The spec review is an **implied** gate: it runs after every `task` node completes, scoped to that one task.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less)

**File scope comes from the graph node, not the task file.** Fill in the same `files`/`scopes` you gave the implementer so the reviewer can check containment.

```
Task tool (general-purpose):
  description: "Review spec compliance for Task N"
  prompt: |
    You are reviewing whether one graph task node implementation matches its task specification.

    ## What Was Requested

    Read the task file to understand what was requested. All paths are relative to `[working directory]`.

    - **Task file:** `[path/to/task-NN-component-name.md]`
    - **Task node:** `[task_node_id from project-network.dot]`
    - **Context:** `[context/tech-stack.md]`, `[context/architecture.md]`
      (include only the context docs that exist for this plan)
    - **Target files** (node's `files`): `[one path per line]`
    - **Allowed directory scopes** (node's `scopes`): `[one path per line, or "None"]`

    The task file does not restate the file scope; the two lists above are its only
    source. An edit outside them is an out-of-scope modification, even if the task
    file's prose seems to invite it.

    ## What Implementer Claims They Built

    [From implementer's report]

    ## CRITICAL: Do Not Trust the Report

    The implementer finished suspiciously quickly. Their report may be incomplete,
    inaccurate, or optimistic. You MUST verify everything independently.

    **DO NOT:**
    - Take their word for what they implemented
    - Trust their claims about completeness
    - Accept their interpretation of requirements

    **DO:**
    - Read the actual code they wrote
    - Compare actual implementation to requirements line by line
    - Check for missing pieces they claimed to implement
    - Look for extra features they didn't mention

    ## Your Job

    Read the implementation code and verify:

    **Missing requirements:**
    - Did they implement everything that was requested?
    - Are there requirements they skipped or missed?
    - Did they claim something works but didn't actually implement it?

    **Extra/unneeded work:**
    - Did they build things that weren't requested?
    - Did they over-engineer or add unnecessary features?
    - Did they add "nice to haves" that weren't in spec?

    **File containment:**
    - Did every change land in a target file, or a supporting file inside an
      allowed directory scope?
    - Did they silently edit an out-of-scope file instead of reporting BLOCKED?

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?
    - Did they implement the right feature but wrong way?

    **Verification command policy:** This is a task-local spec review. Do not run group
    compile, type-check, build, lint, test-suite, or smoke-test commands. Those belong
    to downstream `verify` nodes after all upstream spec reviews pass. You may inspect
    task-local check results from the implementer, but spec compliance comes from
    reading the code against the task file.

    Do not invoke another agent harness through any channel — not the shell
    (`claude`, `codex`, `opencode`) and not MCP tools (e.g.
    `mcp__codex__codex`). Having the tool available is not permission to use it.
    If another agent, role, model, or broader context is needed, report the gap;
    the orchestrator owns further dispatch.

    **Verify by reading code, not by trusting report.**

    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]

    ## Reporting Gaps

    **If you spent significant effort exploring or reading code** to understand something
    that a short documentation file could have explained immediately, invoke
    **jj-superpowers:documentation** to create that document.

    Continue with your review; do not block on reporting gaps.
```
