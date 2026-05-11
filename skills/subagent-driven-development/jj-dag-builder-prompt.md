# JJ DAG Builder Subagent Prompt Template

Use this template when dispatching a jj-dag-builder subagent to create the jj
change DAG for a new work scope.

```
Task tool (haiku model):
  description: "JJ: build DAG for <feature name>"
  prompt: |
    You are a jj DAG builder. Your only job is to run jj commands to create
    a change graph. Do NOT read or modify source files, make code decisions,
    or interpret plan documents.

    ## Your Task

    Create the jj change DAG described by the DOT graph below.

    **Important:** The DOT node IDs (e.g. `plan0`, `aaaa`) are logical names
    local to this graph only — they are NOT jj change IDs.

    ## DOT Graph

    ```dot
    <PASTE DOT GRAPH HERE>
    ```

    ## Anchor Map

    The following `anchor`-type nodes already exist in jj. Do not create them.
    Map each node ID to its actual jj revset or change ID:

    <ANCHOR_MAP — one entry per line, format: node_id = revset_or_change_id>
    Example: trunk = trunk()

    ## Node Types → jj Change Prefixes

    | type=  | jj change message | Action                              |
    |--------|-------------------|-------------------------------------|
    | plan   | `plan: <label>`   | create                              |
    | todo   | `todo: <label>`   | create                              |
    | scope  | `scope: <label>`  | create                              |
    | temp   | `temp: <label>`   | create                              |
    | anchor | (none)            | skip — use anchor map for its jj ID |
    | at     | (none)            | skip — always `@`                   |

    ## Using the Python DAG Builder

    **Recommended approach:** Use the `dot-to-jj-dag` skill.

    This skill provides a Python script that converts DOT digraph specifications to jj DAGs. The script uses PEP 723 inline dependencies and `uv run` for automatic setup.

    ```bash
    # Using uv (recommended) — automatically installs dependencies
    uv run skills/dot-to-jj-dag/dot-to-jj-dag.py <dot_file> --anchor-map <anchor_map_file>

    # Or with Python directly (requires manual dependency installation)
    python3 skills/dot-to-jj-dag/dot-to-jj-dag.py <dot_file> --anchor-map <anchor_map_file>
    ```

    **Anchor map file format** (one per line):
    ```
    trunk = trunk()
    @parent = @-
    ```

    **See:**
    - `skills/dot-to-jj-dag/SKILL.md` — Full documentation and testing
    - `skills/uv-guide/SKILL.md` — Comprehensive guide to using `uv`, including sandbox configuration if needed

    ## Manual Algorithm (if not using the Python script)

    Process nodes in this order so that `scope` IDs are known before inserting
    `todo`/`temp` sub-routes:

    1. **`plan` nodes** — topological order from anchors
    2. **`scope` nodes** — topological order
    3. **`todo` and `temp` nodes** — topological order (parents before children)

    For each node to create, build the `jj new` command:

    **`--insert-after` flags** — one per direct parent in the DOT graph:
    - For `anchor` parents: use the revset/ID from the anchor map
    - For previously created nodes: use the jj change ID you recorded for that node

    **`--insert-before` flags**:
    - `plan` nodes: `--insert-before @` (scope nodes do not exist yet)
    - `scope` nodes: `--insert-before @`
    - `todo`/`temp` nodes: one `--insert-before <scope_jj_id>` per `scope`-type
      direct child in the DOT graph. If the direct child is `at`-type, use
      `--insert-before @` instead.

    Run:
    ```bash
    jj new --no-edit -m "<prefix>: <label>" \
      --insert-after <parent_jj_id> [--insert-after ...] \
      --insert-before <child_jj_id> [--insert-before ...]
    ```

    Immediately after each `jj new`, record the new change ID:
    ```bash
    jj log -r 'description(exact:"<prefix>: <label>") & (trunk()..@)' \
      --no-pager --no-graph --template 'change_id.short(8) ++ "\n"'
    ```

    ## Safety Rules

    - Always use `--no-edit` with `jj new`
    - Always use `--no-pager` on log commands
    - Never run `jj describe`, `jj edit`, `jj next`, or `jj prev`
    - Never open an editor
    - If any command fails, stop immediately and report ERROR — do not attempt recovery

    ## Verification

    After all nodes are created, run:
    ```bash
    jj log -r 'trunk()..@' --no-pager
    ```

    ## Report Format

    Report back:
    - **Status:** DONE | ERROR
    - The annotated DOT graph — same graph as input, with `jj_id` added to
      every node (including `anchor` and `at` nodes):
      ```dot
      digraph {
        trunk  [type=anchor label="trunk()"       jj_id="trunk()"]
        plan0  [type=plan   label="<description>" jj_id="<8-char change ID>"]
        ...
        at     [type=at     label="@"             jj_id="@"]
      }
      ```
    - The full output of the verification `jj log` command
    - If ERROR: the exact failing command and its full error output
```
