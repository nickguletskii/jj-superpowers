# Decision simulations

Two read-only subagent runs (Sonnet) answered the same five scenarios: one reading the pre-change skill text (`using-superpowers`, `verification-before-completion`, `subagent-driven-development`, `requesting-code-review` from change `wpxynqtq`), one reading the changed text. One dispatch per arm.

| Scenario | Expected | Baseline | With policy | Result |
|---|---|---|---|---|
| S1 backlog | 4 (explicit), 3 (blocker), 5 (root cause, one fix), 2, then polish 1 and 7; 6 not built | 4, 2, 5, 3, 1, 7 — the blocker came after both bugs; 6 parked by own judgment | 4, 3, 5, 2, 1, 7; 6 parked (guidance called silent on it) | pass; blocker ordering is the measurable change |
| S2a cosmetic reports | queue, don't switch | queue, don't switch (own judgment) | triage, queue in polish, don't switch | pass; no behavior change |
| S2b outage | triage, preempt, keep resume point | switch, note state | triage, switch, resume point, leave unrelated agents | pass |
| S2c explicit redirect | switch at once | switch at once | switch at once | pass |
| S3a batching | finish all four, one targeted run, reuse CI evidence | same | same | pass; already present before (old `verification-before-completion` had batching) |
| S3b pre-existing failures | no parent rebuild | no parent rebuild | no parent rebuild, cites policy | pass |
| S3c regression question | cheap evidence first, then narrow justified comparison | same, own judgment | same, cites policy | pass |
| S4a README typo | direct edit, no review, cheap check | same | same | pass |
| S4b destructive + concurrent change | independent review and targeted checks before integration; batching doesn't remove it | same | same, plus `spec_review` in graph context | pass |
| S5 graph | no `spec_review` on routine tasks; `spec_review` on `task_03`; `design_review` gates consumers of `task_00`; one verify and one group review | `spec_review` on all five tasks | `spec_review` only on `task_03` — but also ran it on `task_00`, reading "shared interface" as a risk trigger | pass after fix |

## Finding and fix

- **S5 ambiguity (Important):** a `stub=true` task is a new shared interface, which is also a risk trigger, so the reader added `spec_review` on top of `design_review`. Fixed in `subagent-driven-development` → Selecting task review: for a `stub=true` task, `design_review` covers the shared-interface risk, and `spec_review` is added only for a different risk. Not re-simulated.
- **S1 item 6 (Minor, not changed):** both arms declined the speculative plugin system by their own judgment. The sorting rules only mention speculative foundations as an exception to "foundational first"; `brainstorming`'s "cut what nobody asked for" already covers declining it.

## Validation scenarios

Scenario S5 exercised the updated `project-network-validation-scenarios.md` cases 2, 8, 12, and 17 (API producer before consumers, non-overlapping tasks sharing one verify, risk-selected review). The with-policy derivation matched their expected behavior apart from the stub ambiguity above.

## Group review fixes and re-run

The group review found that `design_review` was triggered at the acceptance point while the acceptance point included `design_review` (Important), plus Minors: no single home for the review-trigger list, a `**Risk:**` template that invited the stub double-review, a stale `requesting-code-review` description, verify-rerun scope, the historical-run rule in SDD being stricter than the shared policy, the quality reviewer not being told which tasks were already reviewed, verify-routed fix re-entry, the brainstorming tier cell, and stale `docs/testing.md`. All fixed: SDD now names a **filed** point (self-review, filing, any selected `spec_review`; consolidation and `design_review` start here) separate from the **acceptance point** (filed plus `design_review` for a stub); `requesting-code-review` → When is the canonical trigger list. Not changed: the short pointer sentence in `tool-output-discipline` (optional).

A with-policy re-run (one dispatch, Sonnet) answered S5 plus two new cases:

| Scenario | Expected | Result |
|---|---|---|
| S5 graph | stub: no `spec_review`, consolidate when filed, `design_review`, then consumers; routine tasks accepted when filed; `task_03` `spec_review`; quality reviewer told which tasks were already reviewed | pass |
| S6 executor-found risk (`DONE_WITH_CONCERNS`, race) | select `spec_review`, record reason, hold acceptance | pass |
| S7 verify-routed fix | back to implementer, self-review, rerun the affected verify commands, then group review | pass |

The re-run flagged one silence, not a failure: whether `quality_review` re-runs in full if a fix lands after it already ran. "Re-review covers what changed or was affected" answers it in general terms.

Commands: `node --test tests/*.test.ts` (42/42) and `git diff --check` on the committed range before the review fixes; after them, `node scripts/generate-agents.ts` and `node --test tests/generate-agents.test.ts tests/bootstrap-context.test.ts tests/skill-consolidation.test.ts` (6/6).

## Limits

- One run per arm with one model; results show the intended decisions are reachable from the text, not that agents reliably follow them.
- Much of S2–S4 was already handled well by the baseline through general judgment; the policy mainly made those decisions explicit and cited. The clear behavioral deltas are blocker-before-substantive ordering and risk-selected task review.
- Scenario 19 (mid-run report during a graph) was covered only through S2, not simulated inside a graph run.
