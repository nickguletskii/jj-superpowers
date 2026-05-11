# Spec Compliance Reviewer Prompt Template

Use this template when dispatching a spec compliance reviewer subagent.

**Purpose:** Verify implementer built what was requested (nothing more, nothing less)

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

    **Misunderstandings:**
    - Did they interpret requirements differently than intended?
    - Did they solve the wrong problem?
    - Did they implement the right feature but wrong way?

    **Verification command policy:** This is a task-local spec review. Do not run group
    compile, type-check, build, lint, test-suite, or smoke-test commands. Those belong
    to downstream `verify` nodes after all upstream spec reviews pass. You may inspect
    task-local check results from the implementer, but spec compliance comes from
    reading the code against the task file.

    **Verify by reading code, not by trusting report.**

    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]

    ## Reporting Gaps

    **If you encounter a command invocation issue** that could have been prevented by
    information in a skill, invoke **jj-superpowers:wish-i-knew** to log it — but only if:
    - the relevant information is genuinely absent from existing skills, OR
    - a skill has the information but its phrasing or trigger condition wasn't clear
      enough that you recognised you should use it at the right moment.
    Do NOT invoke for issues caused by simply forgetting something a skill already documents clearly.

    **If you wish you had a reusable tool or script** to help perform your work,
    invoke **jj-superpowers:wish-i-had** to log it.

    **If you spent significant effort exploring or reading code** to understand something
    that a short documentation file could have explained immediately, invoke
    **jj-superpowers:documentation** to create that document.

    Log and continue — do not block your task on logging.
```
