# Autonomy Level

Load this when the user asks to rush or run autonomously, or when resuming a run whose recorded level is `Rush`. It is the single source of truth for the autonomy levels, the safety floor, the retry constant `N`, and the Rush-resolution table; other skills reference it by name.

The **recommended option** is the lead option at a checkpoint — the one you "Lead with the recommended option" in the decision-checkpoint pattern (first in the ask tool). "Recommended", "lead", and "default" are interchangeable. A checkpoint with **no** designated recommended option is high-impact ambiguity → floor #3 (halt).

Two levels:

- **`Manual`** (default) — every decision-checkpoint pauses and asks, exactly as today.
- **`Rush`** — take the recommended option without pausing, *unless the safety floor trips*. The floor is also an action policy: any action matching it halts even outside a checkpoint (e.g. an irrecoverable deletion mid-implementation).

Rush auto-resolves **user checkpoints only**. Automated review nodes (`spec_review`, `design_review`, `verify`, `quality_review`, `simplification`, and the brainstorming adversarial spec-review loop) **always still run** — Rush removes the human sign-off wait on their results, never the check itself.

**Safety floor (always halts and asks, even in Rush):**

1. **Irrecoverable destruction** — effects not recoverable from version control: deleting untracked data the agent didn't create, discarding the user's uncommitted/dirty work, history-loss, outward-facing sends (publish/send). VCS-recoverable (committed/tracked) deletions proceed.
2. **Structural design flaw** — the `BLOCKED_STRUCTURAL` escalation that returns to brainstorming.
3. **High-impact ambiguity** — materially different outcomes **and** no clearly-recommended option (includes a no-designated-lead option menu and Rush × Agile net scope growth). Bias: when uncertain whether a default is clear, halt.
4. **Stuck review** — a `spec_review`/`verify`/`quality_review`/`simplification` failure still unresolved after `N = 3` automated fix-and-re-review attempts.

**Floor precedence.** Floor #2 (structural) short-circuits floor #4's retry budget: a failure diagnosed structural at *any* attempt escalates immediately, not retried to `N = 3`. The `N = 3` budget applies only to mechanical/local failures. On ambiguity, default to structural.

**`N = 3`** (the canonical constant, defined here; other skills reference it by name): the original failure is attempt 0; Rush makes up to 3 fix-and-re-review attempts; halt on the 3rd. One initial fix + two retries = 3.

**Canonical Rush-resolution table** (single source of truth; consumers reference it by name):

| Checkpoint | Rush resolution |
|------------|-----------------|
| Triage tier proposal | take the proposed tier |
| Planning strategy proposal | take the proposed strategy |
| Execution handoff (subagent vs inline) | subagent-driven when authorized **and** the harness supports named subagents; else inline |
| Spec user-review gate (brainstorming step 10) | auto-pass (automated adversarial spec-review loop still runs) |
| Agile phase boundary | auto-advance + non-blocking trail entry (exception: scope-drift → floor #3 halt) |
| `BLOCKED` / `SCOPE: related` | resolve mechanically per existing `executing-plans` rules (add edge / run producer / split); never defer; non-trivial scope expansion → floor #3 halt |
| `BLOCKED` / `SCOPE: unrelated` | "note as separate task for later" + continue (recorded) |
| `design_review` structural flaw | floor #2 — halt |
| `spec_review`/`verify`/`quality_review`/`simplification` failure | auto-route-back, retry ≤ N=3, then floor #4 — halt (if diagnosed structural at any attempt → floor #2 immediately) |
| Model/effort escalation | earned by a wall → take one step; speculative → floor #3 halt |
| Integration choice (bookmark push / PR / merge) | floor #1 — halt (outward-facing) |

**Activation.** User-initiated ("rush", "autonomous mode") at or after design approval — the Rush boundary is *after* design approval, so clarifying-question and design-approval gates are never auto-resolved. The agent may offer Rush once when ambiguity is low (no nag). Explicit "pause" → `Manual`. A floor halt suspends auto-advance but does not clear the level. **Recording / read order on resume:** `roadmap.md` (Agile, authoritative if present), else the Waterfall design-doc header, else default `Manual`; every transition rewrites the record. Rush is inert at Trivial/Small (their only gate, design approval, is above the boundary); a Trivial/Small task self-escalated to Full becomes Rush- and Agile-eligible.
