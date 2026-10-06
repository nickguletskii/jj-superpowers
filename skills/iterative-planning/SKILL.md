---
name: iterative-planning
description: Use when a later phase's tasks can't be written until an earlier phase produces an artifact (API shape, data format, measurement), so work is planned and built one phase at a time. Triggers on "plan in phases", "milestones", "plan the next phase", "roadmap this". Size alone is not a trigger.
---

# Iterative Planning (Agile phase loop)

Plan and build one phase at a time, folding each phase's results into the roadmap before planning the next. Qualifies only when a later phase's tasks depend on something an earlier phase will produce. Ordinary sequencing where every task is already specifiable is a DAG — plan it once with `writing-plans`. A large but fully specifiable graph stays Waterfall.

This skill delegates: `writing-plans` plans each phase; `subagent-driven-development` or `executing-plans` executes it.

## The loop

```
docs/superpowers/plans/YYYY-MM-DD-<feature>/
  roadmap.md            # phase manifest and resume index
  phase-01-<name>/      # normal plan dir: plan.md, project-network.dot, context/, tasks
  phase-02-<name>/
```

1. **Build `roadmap.md` once** from the approved design: ordered phases, each a one-line goal and rough scope — not detailed plans. Record Strategy, Autonomy, and Execution in the header.
2. **For each phase:**
   1. **Plan** it with `writing-plans`, scoped to this phase only; the result is a normal graph reaching its own `final`. Skip that skill's execution handoff.
   2. **Execute** it with the recorded execution skill.
   3. **Fold learnings.** After `final`, add a completion note (new APIs/types, deviations, surprises, follow-ups) to the phase entry, then adjust remaining phases (split, merge, reorder, insert, drop) within the drift guardrail.
   4. **Boundary checkpoint.** Manual: present the phase summary and proposed next phase for approval. Rush: auto-advance per `using-superpowers` `references/autonomy.md`.
3. **All phases `[done]`** → Finish checks (SDD Change Consolidation), then ask the user what to integrate.

**Execution choice.** Decide subagent-driven vs inline once, at roadmap time, and record it in `roadmap.md`'s `Execution:` field. It is required: per-phase handoffs are skipped, so a resumed session has no other source for the choice.

**Phase sizing.** A phase is a vertically sliced, independently verifiable increment delivering a coherent capability. Aim for at least ~3 task nodes so it reaches a real verify node; merge smaller phases unless a hard sequencing boundary forces the split. There is no ceiling: split only where this phase's output is what makes the next phase specifiable, never because the task count feels large. Each phase builds on the integrated result of the previous ones.

**Phase failure.** A phase that can't reach `final` is never skipped, because later phases build on it. Structural failure (`BLOCKED_STRUCTURAL`): mark `[blocked]` and return to brainstorming for that phase's design (floor #2); downstream phases don't start. Mechanical failure that exhausts the retry budget: mark `[blocked]` (floor #4).

**Resume.** `roadmap.md` tracks phase state only (`[planned]`, `[in progress]`, `[blocked]`, `[done]`). Within a phase, readiness is re-derived from the phase graph plus what is filed in jj, as for any plan. A halt mid-phase leaves it `[in progress]`.

**Drift guardrail (Rush).** Against the approved roadmap, floor #3 trips when an inserted phase pursues a goal not traceable to the approved design, or the phase count grows materially (roughly +50%). Reordering, merging, splitting, or dropping within scope, and inserts that decompose an approved goal, are fine.

## `roadmap.md` template

```markdown
# <Feature> Roadmap (Agile)

> **Goal:** <one sentence>
**Strategy:** Agile   **Autonomy:** Rush | Manual   **Execution:** subagent-driven | inline

## Phases
1. [done] phase-01-<name> — <goal>
   - **Learnings:** <new APIs/types, deviations, surprises, follow-ups>
   - **Auto-advanced** (Rush only)
2. [in progress] phase-02-<name> — <goal>
3. [blocked] phase-03-<name> — <goal>
   - **Blocked:** <structural → returned to brainstorming | stuck → retry budget exhausted at verify-NN>
4. [planned] phase-04-<name> — <goal>
```

The Learnings line plus the Auto-advanced marker is the Rush trail entry; there is no separate trail artifact.
