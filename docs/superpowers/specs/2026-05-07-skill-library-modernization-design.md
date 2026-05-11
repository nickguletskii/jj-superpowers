# Skill Library Modernization Design

## Goal

Bring the skill library, README, and pseudocode back into alignment with the current graph-based planning workflow, current jj history model, and multi-platform subagent boundaries.

## Context

The current skill set has drift in several places:

- README references `jj-agentic-dev`, which is not present in `skills/` or `pseudocode/`.
- README presents `using-jj-worksets` as an after-design setup step, while the actual skill is a post-implementation history organization entry point.
- `writing-plans` now produces `project-network.dot`, `verify-*` files, and graph gates, but `executing-plans` and `pseudocode/subagent-driven-development.tsx` still model older linear task execution.
- `requesting-code-review` assumes per-task review and `toreview:` ids even though graph quality review now owns the planned implementation review path.
- Several subagent-heavy skills do not explicitly account for platforms or conversations where subagents are unavailable or unauthorized.
- `jj-clean-history` references missing skills/commands and overlaps unclearly with `jj-reorg-changes`.
- `uv-guide` is written as Claude Code-specific sandbox guidance despite the repo supporting Codex, OpenCode, Gemini, and Copilot.
- A generated `__pycache__` file is tracked.

## Architecture

This is a targeted modernization pass, not a redesign of the whole skills system.

Keep the existing skill names and directory structure unless a referenced skill is demonstrably absent. Prefer clarifying boundaries over deleting skills:

- `writing-plans` remains the source of graph-based plan structure.
- `subagent-driven-development` remains the subagent executor for `project-network.dot`.
- `executing-plans` becomes the inline or separate-session executor for the same graph model.
- `requesting-code-review` becomes an ad hoc/manual review skill; planned implementation quality gates remain in `subagent-driven-development`.
- `using-jj-worksets` stays as a conceptual post-implementation entry point to `jj-reorg-changes`.
- `jj-clean-history` stays for arbitrary messy jj history outside the `toorg:` implementation workflow.

## Components

### README and Catalog Wording

Update README to remove absent `jj-agentic-dev` references and describe the current jj workflow:

- Implementation produces `toorg:` commits.
- `finishing-a-development-branch` can optionally offer `using-jj-worksets` / `jj-reorg-changes`.
- `writing-plans` produces graph-based plans.
- `subagent-driven-development` and `executing-plans` execute graph plans.

The README should not claim `using-jj-worksets` runs immediately after design approval.

### `executing-plans`

Rewrite `skills/executing-plans/SKILL.md` to execute graph plans inline:

- Read `plan.md` and `project-network.dot`.
- Validate graph shape using the same essential checks as `subagent-driven-development`.
- Execute ready `task` nodes locally, respecting file scope and task-local checks.
- Run `verify-*` files only at `verify` nodes after upstream spec-equivalent local checks pass.
- Use quality review checkpoints at `quality_review` nodes. If subagents are unavailable, perform the review locally with the same review lens and tell the user that review is local.
- Invoke `finishing-a-development-branch` only after the final graph node is reached.

It must not describe old linear task execution as the default.

### `pseudocode/subagent-driven-development.tsx`

Update pseudocode to match the current skill:

- Load `project-network.dot`.
- Validate graph.
- Dispatch ready non-conflicting task implementers.
- Run per-task spec review.
- Run verification nodes as fan-in gates.
- Run group quality review only after verification passes.
- Route failures back to responsible task nodes.
- Finish through `finishing-a-development-branch`.

Remove the stale final whole-implementation reviewer from the pseudocode unless the source skill also reintroduces it.

### `requesting-code-review`

Narrow the skill to ad hoc/manual review:

- Use when the user asks for review, before merge, when stuck, or after a substantial ad hoc change.
- Do not say it is mandatory after every planned graph task.
- Do not assume a `toreview:` change id always exists.
- Allow review by jj revision, explicit diff range, file list, or current `@` diff depending on context.
- Preserve the file-size/decomposition review lens.
- Cross-reference `subagent-driven-development/code-quality-reviewer-prompt.md` as the planned implementation path.

### `codebase-cleanup`

Add an explicit subagent availability and authorization boundary:

- If the user has authorized subagents and the platform supports them, use the existing map/reduce subagent pipeline.
- If not, ask for authorization or use a reduced local mode.
- Reduced local mode should still do scope confirmation, forgotten-code search, evidence-backed findings, and user-confirmed deletion.

### `jj-clean-history`

Clarify this skill’s scope and fix stale references:

- Use it for arbitrary jj history cleanup, not `toorg:` implementation workflow organization.
- Direct `toorg:` post-implementation organization to `jj-reorg-changes`.
- Replace nonexistent `jj-split` references with `jj-hunk` for sequential/manual hunk selection and `jj-split-parallel` for independent sibling extraction.
- Remove or replace the `/jj-bookmarks` mention because no such skill exists in this repo.

### `uv-guide`

Make sandbox guidance platform-neutral:

- Keep core `uv run`, PEP 723, and cache guidance.
- Move Claude Code `/sandbox` instructions into a Claude Code subsection.
- Add Codex guidance: if dependency downloads or cache writes fail due to sandbox/network restrictions, rerun the needed command with the platform’s escalation path.
- Avoid saying Claude Code-specific paths or commands are universal.

### Repo Hygiene

Remove the tracked generated file:

- `skills/dot-to-jj-dag/tests/__pycache__/test_dot_to_jj_dag.cpython-314-pytest-9.0.2.pyc`

Ensure ignore coverage exists for `__pycache__/` and `*.pyc`.

### Maintenance Validation

Add a lightweight maintenance checklist document, preferably:

- `docs/superpowers/skill-maintenance-checklist.md`

It should cover:

- Missing skill names referenced by README, skills, docs, or pseudocode.
- Stale platform-specific terms in generic guidance.
- Pseudocode/source parity for graph workflows.
- Tracked generated files.
- Frontmatter descriptions that summarize workflow instead of trigger conditions.

This can be a checklist rather than an executable script for this pass.

## Data Flow

The modernization flow is:

1. Update source skill/docs text.
2. Update matching pseudocode for changed workflow logic.
3. Remove tracked generated artifact and confirm ignore rules.
4. Run focused text validation using `rg` for stale references.
5. Run `jj status` and `jj diff --stat` to confirm the intended files changed.

No runtime application behavior changes are expected.

## Error Handling

If an update exposes a deeper mismatch, handle it as follows:

- If the mismatch is just stale wording, fix it directly.
- If a referenced skill is missing and no current skill replaces it, remove the reference rather than inventing a new skill.
- If a skill appears redundant but still has a distinct trigger, keep it and narrow its scope.
- If a workflow would require subagents but subagent support is unavailable, document the local fallback or authorization gate.

## Testing and Verification

Verification is text- and repo-hygiene focused:

- `rg -n "jj-agentic-dev|jj-split\\b|/jj-bookmarks|workflow type|Workflow:|project_network_diagram"` over README, skills, docs, and pseudocode should return no stale active references, except historical docs if intentionally left untouched.
- `rg -n "project-network.dot|verify|quality_review"` should show `executing-plans` and `pseudocode/subagent-driven-development.tsx` now reference the graph model.
- `jj file list --no-pager 'glob:**/__pycache__/**'` should show no tracked pycache files.
- `jj status --no-pager` should show only intended modifications.

## Implementation Topology

The work splits into mostly independent units:

1. README/catalog wording.
2. `executing-plans` graph rewrite and matching pseudocode if needed.
3. `subagent-driven-development` pseudocode parity.
4. `requesting-code-review` narrowing.
5. `codebase-cleanup` subagent authorization boundary.
6. `jj-clean-history` stale-reference cleanup.
7. `uv-guide` platform-neutral sandbox update.
8. Repo hygiene and maintenance checklist.

Potential file contention:

- README and maintenance checklist are independent.
- `executing-plans` and `subagent-driven-development` touch different skill files, but both may need shared validation language.
- Pseudocode updates should be grouped with the corresponding source skill when possible.

Because this touches many workflow documents, use the full `writing-plans` workflow rather than the Small Change Shortcut.

## Non-Goals

- Do not rename skill directories in this pass.
- Do not redesign `writing-plans` or `subagent-driven-development`; only align dependents with them.
- Do not add executable validation tooling unless the implementation plan chooses it as a small, bounded addition. A checklist is sufficient.
- Do not rewrite historical plan/spec documents unless they are linked from active docs as current guidance.
