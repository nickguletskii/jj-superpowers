# Task 4: Integration

**Purpose:** Bring the agent role definitions and the remaining references in line with the landed policy, regenerate agents, and record the change.

**Reuse:** the final text from tasks 01 to 03; read it before editing. `node scripts/generate-agents.ts` for the generated copies.

**Interfaces and Invariants:**
- `agents/*.md` are canonical. `.codex/agents/` and `.opencode/agents/` are regenerated, never hand-edited.
- Agent changes:
  - `sdd-implementer`: self-review is the routine acceptance check. Mention that a task's `**Risk:**` line means an independent review follows. Run only the checks the task file names.
  - `sdd-spec-reviewer`: description and body say it runs for risk-required task review. Remove "line by line" and the instruction to distrust the implementer's report by default. It reviews the actual changed behavior against the task file and the stated risk.
  - `sdd-quality-reviewer`: becomes the group review of requirements and quality; add requirement coverage to its scope. Keep "reuse the verification report".
  - `sdd-verifier`: description no longer says "after all upstream spec reviews pass"; use "once every upstream task reaches its acceptance point". Add that it never checks out or builds earlier revisions unless the verify file names a justified question.
  - `sdd-jj-coordinator`: "after its spec review passed" becomes "at its acceptance point".
  - `sdd-design-reviewer`: description trigger becomes "after the stub task reaches its acceptance point".
  - `sdd-simplifier` and `code-reviewer`: change only text that contradicts the policy.
- `tool-output-discipline`: add at most two lines. Prefer one command over overlapping check, build, and test commands. A single owner runs contended checks, and others reuse the results. Point at `## Choosing evidence`.
- Targeted search: within `skills/` (and only there besides the files above), search for text that contradicts the policy, for example "spec review" on every task, "line by line", "baseline" meaning an earlier revision, "pre-existing" classification by rebuilding, and "three reviewers". Fix only contradictions. Each fix outside your `files` stays in `scopes` and is listed in your report.
- `CHANGELOG.md`: one entry under `## Unreleased`, in the existing format, summarizing the sorting rules, interruptions, batching and cost-justified evidence, and risk-selected review.
- `README.md`: a short policy summary (no more than about six lines) in `## How it works` or `## Philosophy`, whichever already describes workflow behavior.

**Subtasks:**
- [ ] Edit the agents listed above.
- [ ] Edit `tool-output-discipline`.
- [ ] Run the targeted search and fix the contradictions it finds.
- [ ] Run `node scripts/generate-agents.ts` if any `agents/*.md` changed. Confirm that only the expected generated files changed.
- [ ] Update `CHANGELOG.md` and `README.md`.

**Task-local checks:** `node scripts/generate-agents.ts`. It is a deterministic file generator, not a contended build, and the suite in `verify_01` covers its output.
