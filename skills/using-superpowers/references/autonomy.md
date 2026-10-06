# Autonomy Level

Owns the autonomy levels, safety floor, retry constant `N`, and Rush-resolution table.

The **recommended option** ("lead", "default") is the one presented first at a checkpoint. A checkpoint with no recommended option counts as high-impact ambiguity (floor #3).

- **`Manual`** (default) — every checkpoint pauses and asks.
- **`Rush`** — take the recommended option without pausing unless the safety floor trips. The floor also applies to actions outside checkpoints (e.g. an irrecoverable deletion mid-implementation).

Rush resolves user checkpoints only. Automated reviews and verify nodes still run; Rush removes only the wait for human sign-off.

**Safety floor — halts and asks even in Rush:**

1. **Irrecoverable destruction** — deleting untracked data the agent didn't create, discarding the user's uncommitted work, history loss, outward-facing sends (publish, push, message). Deletions recoverable from version control proceed.
2. **Structural design flaw** — `BLOCKED_STRUCTURAL`, which returns to brainstorming. A failure diagnosed structural at any attempt escalates immediately rather than consuming the retry budget; when unsure, treat it as structural.
3. **High-impact ambiguity** — materially different outcomes and no clear recommendation (including Rush × Agile net scope growth). When unsure whether the default is clear, halt.
4. **Stuck review** — a review or verify failure still unresolved after `N = 3` fix-and-re-review attempts (the original failure is attempt 0; halt after the 3rd fix).

| Checkpoint | Rush resolution |
|------------|-----------------|
| Triage tier / planning strategy | take the proposal |
| Execution handoff | subagent-driven when authorized and the harness supports named subagents; else inline |
| Spec user-review gate (brainstorming step 10) | auto-pass; the automated review loop still runs |
| Agile phase boundary | auto-advance with a trail entry; scope drift → floor #3 |
| `BLOCKED` / `SCOPE: related` | resolve per `jj-superpowers:subagent-driven-development` (add edge / run producer / split); non-trivial scope expansion → floor #3 |
| `BLOCKED` / `SCOPE: unrelated` | record as a separate later task and continue |
| `design_review` structural flaw | floor #2 |
| Review or verify failure | route back, retry ≤ N, then floor #4 (structural → floor #2 at once) |
| Model/effort escalation | earned by a wall → one step up; speculative → floor #3 |
| Integration (push / PR / merge) | floor #1 |

**Activation.** Rush is user-initiated, and only applies after design approval: clarifying questions and design approval are never auto-resolved. "Pause" returns to `Manual`; a floor halt suspends auto-advance without clearing the level. Record the level in `roadmap.md` (Agile, authoritative) or else the design-doc header; on resume read it in that order, defaulting to `Manual`. Rush is inert at Trivial/Small tiers; a task that escalates to Full becomes eligible.
