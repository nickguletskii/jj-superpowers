# Verify 1: Repository suite and consistency

**Upstream tasks:** `task_01`, `task_02`, `task_03`, `task_04`, `task_05`

**Primary commands:**
- `node --test tests/*.test.ts`
- `git diff --check`

**Failure diagnostics:**
- On test failures, rerun only the failing file, for example `node --test tests/generate-agents.test.ts`, and report the failing assertion and its message. Don't rerun the whole suite until the owning task's fix lands.

**Expected result:** both primary commands exit 0. Run each once. Do not run the suite on an earlier revision. A failure goes back to the task that owns the file. Related fixes are batched, and only the affected test files are rerun unless the fix touched `scripts/` or `hooks/`.

**Group review scope:** the quality review after this verify is the spec's focused consistency review. It covers:
- that `subagent-driven-development`, `executing-plans`, `writing-plans`, the validation scenarios, and the `sdd-*` agents agree on the gate triggers, the acceptance point, and readiness;
- that other skills point at the shared policy sections instead of restating them;
- that no required review, safety rule, or explicit-requirement rule was weakened;
- whether `evaluation.md` reports any with-policy failure that wasn't resolved.
