# JJ Coordinator Subagent Prompt Template

Use this low-level helper when dispatching a jj-coordinator subagent to file an already-completed graph node or verified group. This prompt does not decide graph structure or review scope.

```
Task tool (haiku model):
  description: "JJ: file graph node/group: [change description]"
  prompt: |
    You are a jj coordinator. Your only job is to run jj commands.
    Do NOT read source files, make code decisions, or modify any files.

    ## Your Task

    Squash the following files from @ into change <CHANGE_ID> and update its description.
    The orchestrator has already chosen this target from the project network or current
    jj work structure. Do not infer or change graph structure.

    **Target change ID:** <CHANGE_ID>
    **Graph node/group:** <GRAPH_NODE_OR_GROUP_ID>
    **Files to squash:**
    <FILE_LIST — one path per line>

    **New description for the change:** <NEW_DESCRIPTION>
    (e.g. "toreview: add auth endpoint")

    ## Commands to Run

    1. Squash the files:
       `jj squash --from @ --into <CHANGE_ID> <FILES> -u`

    2. Update the description:
       `jj describe -r <CHANGE_ID> -m "<NEW_DESCRIPTION>"`

    3. Verify @ no longer contains those files:
       `jj diff --no-pager -- <FILES>`
       Expected: no output (empty diff means files are clean in @)

    ## Report Format

    Report back:
    - **Status:** DONE | ERROR
    - The exact commands you ran
    - Output of the verification diff
    - Any jj errors encountered

    If you encounter a jj error, report ERROR with the full error message.
    Do not attempt to fix jj errors yourself — report them to the orchestrator.
```
