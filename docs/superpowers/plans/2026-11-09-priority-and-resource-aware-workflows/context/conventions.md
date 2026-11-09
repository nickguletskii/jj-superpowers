# Editing conventions for this plan

- **Source of truth:** `docs/superpowers/specs/2026-11-09-priority-and-resource-aware-workflows-design.md`. Read it before you edit anything. If the spec and a task file disagree, the spec wins; report the disagreement.
- **Define a policy once.** The shared policy lives in `skills/using-superpowers/SKILL.md` (governing principle, sorting, interruptions) and `skills/verification-before-completion/SKILL.md` (batching, evidence, reporting). Other skills refer to those sections by skill and section name and add only what is specific to their own workflow. Do not paste the sorting buckets or the list of review triggers into other skills.
- **Tone.** Plain, direct guidance in the existing voice of each skill. No coercive framing (no "MUST", "NEVER" in capitals, threats, or "this is critical"). State the reason where it is not obvious. The rules are defaults that agents may depart from with a stated reason, except for safety, explicit user or project requirements, and honest reporting.
- **Keep it short.** Skills are loaded into context. Prefer replacing text to adding it. A net growth of more than about 30% in any one file needs a reason in your report.
- **Preserve structure.** Keep the graph syntax (`task`/`verify`, `files`, `scopes`, `stub`, `simplify`), named agents, file ownership, jj filing, the decision-checkpoint pattern, and the Rush/autonomy mechanics. The only structural change is which reviews run, and when.
- **Risk-selected review vocabulary.** Use these terms consistently:
  - *self-review*: the implementer's own scope and completeness check, which always happens;
  - *risk-required review*: an independent review triggered by one of the spec's risk categories (security or data integrity, substantial concurrency or architecture, shared or public interfaces, material correctness uncertainty, explicit request);
  - *acceptance point*: the moment a task is ready for consumers, which is after self-review and filing, plus any risk-required review, plus design review for `stub=true`;
  - *group review*: the single requirements-and-quality review after a verify node passes.
- **Recording risk.** A task file may carry an optional `**Risk:**` line naming the concrete risk that requires an independent task-level review. The executor may add one when it finds a risk the plan missed. There is no graph attribute, form, or score for this.
- **Generated files.** `.codex/agents/*.toml` and `.opencode/agents/*.md` are generated from `agents/*.md` by `node scripts/generate-agents.ts`. Never edit them by hand.
- **Do not run** builds, lint, or the test suite in tasks 01 to 04. `verify_01` owns the suite.
- **Out of scope:** unrelated wording cleanup, renaming skills or agents, and new skills, scripts, or tests.
