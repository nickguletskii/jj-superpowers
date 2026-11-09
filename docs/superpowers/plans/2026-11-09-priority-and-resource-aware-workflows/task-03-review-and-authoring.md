# Task 3: Review and skill authoring

**Purpose:** Apply risk-based review selection to design review, ad hoc code review, autonomous runs, and skill authoring. Keep the baseline and with-skill evaluations, but make them lightweight simulations against the current tree.

**Reuse:** `## Governing principle`, `## When to verify`, and `## Choosing evidence` from task 01. The spec's "Design work uses the same rule" paragraph and its review triggers. The severity scale in `requesting-code-review` stays the single scale.

**Interfaces and Invariants:**
- `brainstorming`: design approval, the triage tiers, and the planning strategy are unchanged. Step 9 (adversarial review) changes from "about 3 reviewers per round" to independent review aimed at the design's actual risks, with more than one reviewer only for distinct material risks. Routine policy or documentation edits need no reviewer panel. The step table can keep "Adversarial spec review" for Full.
- `requesting-code-review`: the "When" section selects review by concrete risk, using the spec's trigger list in one line or a pointer to the definition. A routine localized change gets self-review plus targeted checks. Re-review covers changed or affected areas only. The severity scale is unchanged.
- `autonomy.md`: under Rush, the same risk selection applies. Risk-required and user- or project-mandated reviews still run, and the safety floor is unchanged.
- `writing-skills` and `testing-skills-with-subagents.md`: baseline versus with-skill stays, as paired decision simulations against the current skill text with results kept outside shipped skill directories. Remove any requirement to check out or build an earlier revision, and any requirement for one evaluation batch per edited file; batch scenarios into a few dispatches. Simulations show intended decisions and don't prove real-world compliance.

**Subtasks:**
- [ ] `brainstorming`: edit step 9 and the "Adversarial review (step 9)" section, keeping the converge rule (zero Critical/Important).
- [ ] `requesting-code-review`: edit "When" and "How" as above.
- [ ] `autonomy.md`: add or adjust the line about review selection under Rush.
- [ ] `writing-skills`: edit "Testing Skills" and the checklist.
- [ ] `testing-skills-with-subagents.md`: edit "Baseline vs With-Skill" and "Done When".
