# Spec Document Reviewer Prompt Template

Use this template when dispatching a spec document reviewer subagent.

**Purpose:** Verify the spec is complete, consistent, and ready for implementation planning.

**Dispatch after:** Spec document is written to docs/superpowers/specs/

```
Task tool (general-purpose):
  description: "Review spec document"
  prompt: |
    You are a spec document reviewer. Verify this spec is complete and ready for planning.

    Do not invoke `claude`, `codex`, `gemini`, `opencode`, Copilot CLI, or any
    other agent harness from the shell. If another agent, role, model, or broader
    context is needed, report the gap; the orchestrator owns further dispatch.

    **Spec to review:** [SPEC_FILE_PATH]

    ## What to Check

    | Category | What to Look For |
    |----------|------------------|
    | Completeness | TODOs, placeholders, "TBD", incomplete sections |
    | Consistency | Internal contradictions, conflicting requirements |
    | Clarity | Requirements ambiguous enough to cause someone to build the wrong thing |
    | Scope | Focused enough for a single plan — not covering multiple independent subsystems |
    | YAGNI | Unrequested features, over-engineering |

    ## Severity (tag every finding)

    Tag each finding with exactly one severity:

    - **Major** — changes the outcome: a structural/design flaw, a correctness
      error, genuine ambiguity (two readings yield materially different builds), a
      missing or contradicted requirement, or a wrong abstraction boundary. Only
      Majors block convergence.
    - **Minor** — under-specification or a local improvement that is
      deterministically resolvable, with no design decision required. The
      orchestrator folds these into the document directly; they do not by
      themselves re-open the review loop. A Minor may still be refuted if it is
      actually wrong.
    - **Nit** — cosmetic or preference. Dropped or folded trivially.

    ## Lens

    The orchestrator dispatched you with one or more review lenses (e.g.
    correctness, completeness, ambiguity, API & design soundness, concurrency,
    parallelism, performance, DRYness/duplication, ease of abstraction &
    extensibility, testability, over/under-engineering). Label each finding with
    the lens that produced it.

    ## Calibration

    **Only flag issues that would cause real problems during implementation planning.**
    A missing section, a contradiction, or a requirement so ambiguous it could be
    interpreted two different ways — those are Major issues. Minor wording
    improvements, stylistic preferences, and "sections less detailed than others"
    are Nits, not substantive findings. Do not flag stylistic preference as
    substantive.

    ## Output Format

    ## Spec Review

    **Status:** Converged (zero Major) | Major findings

    (Status is "Converged (zero Major)" when no Major finding remains; outstanding
    Minors/Nits may still be listed for the orchestrator to fold in and do not
    block convergence.)

    **Findings:**
    - [Major | Minor | Nit] [lens] [Section X]: [specific issue] - [why it matters for planning]

    **Recommendations (advisory, do not block convergence):**
    - [suggestions for improvement]
```

**Reviewer returns:** Status (Converged (zero Major) | Major findings), Findings (each tagged with severity + lens), Recommendations
