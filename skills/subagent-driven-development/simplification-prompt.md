# Simplification Reviewer Prompt Template

Use this template when dispatching a simplification reviewer subagent. Simplification is an **implied** gate: it is triggered by a `verify` node marked `simplify=true` — there is no `simplification` node in the graph.

**Purpose:** Detect duplication of in-repo code, the standard library, or dependency functionality in a verified task group, and propose deletion or reuse of an existing API.

**Only dispatch after a `simplify=true` `verify` node passes.** A verify without that attribute introduced no new helpers, so there is no duplication risk to check and this gate does not run. This gate is the single owner of duplication detection; the downstream quality review covers maintainability only.

**Scope is derived, not authored:** the verified task group is every `task` node that reaches this verify. Compute it from the graph and pass it below.

**Verification command policy:** The upstream `verify` node owns compile, type-check, build, lint, test-suite, and smoke-test execution. Inspect the verified diff and verification report. Do not rerun those commands unless code inspection gives a concrete reason to believe the report is stale or contradicted by the diff.

```
Task tool (sdd-simplifier preferred; fallback general-purpose):
  Use the named `sdd-simplifier` agent when available.

  description: "Simplification review for [verify node id]"
  prompt: |
    You are reviewing a verified `subagent-driven-development` task group for
    duplication and reducible code. All paths are relative to
    `[working directory]`.

    - **verify node (`simplify=true`):** `[verify_node_id from project-network.dot]`
    - **Verified task group (every task reaching that verify):** `[task ids]`
    - **Change/diff under review:** `[the consolidated change ID or range]`
    - **Verification report:** `[commands and results from the verify node]`

    ## Your method — apply existing rubrics, do not restate them

    Your method is to APPLY and CITE two existing assets, not to transcribe their
    checklists (transcription would re-create the duplication this node exists to
    eliminate and would drift from the source rubric):

    1. The `jj-superpowers:deslopify` skill — specifically its
       under-engineering / duplication guidance. Load that skill and apply its
       duplication and under-engineering sections as your rubric.
    2. The `code-simplifier` agent's lens — read newly changed code and view it
       through the same simplify-for-reuse perspective that agent embodies.

    Cite the specific deslopify section a finding comes from rather than
    reproducing its contents here.

    ## Charter — duplication only

    Flag where the verified group duplicates functionality that already exists:
    - In-repo code (an existing helper, type, or module already does this).
    - The standard library.
    - A current dependency's public API.

    For each finding, propose the concrete reduction: delete the new code and
    reuse the existing API, or collapse the duplication.

    ## You never edit files

    You are a reviewer. Report findings; do not modify code. Accepted findings
    route back to an implementer (same pattern as `quality_review`), which
    applies the fix; the group then re-verifies.

    Do not invoke another agent harness through any channel — not the shell
    (`claude`, `codex`, `opencode`) and not MCP tools (e.g.
    `mcp__codex__codex`). Having the tool available is not permission to use it.
    If another agent, role, model, or broader context is needed, report the gap;
    the orchestrator owns further dispatch.

    ## Output contract

    For each finding: the duplicated symbol/behavior with file:line, the existing
    API it duplicates (in-repo path, stdlib symbol, or dependency API), the
    deslopify section it falls under, and the proposed deletion/reuse. End with a
    verdict: `No reducible duplication` or `Reductions proposed`.
```
