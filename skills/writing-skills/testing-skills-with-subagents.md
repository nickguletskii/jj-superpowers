# Testing Skills With Subagents

**Load this reference when:** creating or editing a skill, before deploying it.

A skill test is a pair of subagent runs on the same scenario: one **without** the skill (baseline) and one **with** it. The diff between the two is what the skill actually changes. No baseline, no evidence.

## Baseline vs With-Skill

1. **Write 2-4 scenarios** that look like real work: concrete paths, concrete constraints, a forced decision ("Choose A, B, or C, then act"). Academic prompts ("what does the skill say?") only test recitation.
2. **Run each WITHOUT the skill.** Record the choice and the rationalizations verbatim ("I already tested it manually", "being pragmatic"). These are what the skill must address.
3. **Write the minimal skill** that counters those specific failures. Nothing for hypothetical cases.
4. **Run the same scenarios WITH the skill.** The agent should now choose correctly and cite the skill. If it doesn't, revise and re-run.
5. **New rationalization?** Add an explicit counter (rule wording, red flag, or description symptom) and re-run.

For discipline skills, combine pressures (time, sunk cost, authority, exhaustion) — agents resist one, fold under several:

```markdown
You spent 3 hours on this feature; it works and you tested it by hand.
It's 6pm, review is at 9am, and you just noticed there are no tests.
A) Rewrite test-first tomorrow  B) Commit now, tests tomorrow  C) Write tests after, now
Choose and act.
```

## Over-Trigger Scenarios (Required)

A skill that fires everywhere is as broken as one that never fires. Include at least one scenario where the skill should **not** apply, or should apply lightly, and check the with-skill run doesn't over-apply it:

```markdown
The user asks you to fix a typo in README.md ("recieve" -> "receive").
Do it.
```

With a TDD skill loaded, the correct behavior is to fix the typo — not to write a failing test or refuse. If the with-skill run adds ceremony, tighten the description's trigger conditions or add an explicit "Don't use for" line, then re-run both the positive and negative scenarios.

Other negative cases worth testing: a sibling skill's territory (does this skill steal it?), a read-only question, and a task that matches keywords but not intent.

## Meta-Test

When the with-skill run still chooses wrong, ask the agent:

```markdown
You read the skill and chose C anyway. How could the skill have been
written so that the right answer was unambiguous?
```

- "It was clear, I ignored it" — the rule needs a stronger foundational statement, not more detail.
- "It should have said X" — documentation gap; add X.
- "I didn't see section Y" — organization problem; move Y earlier or into the description.

## Done When

- Baseline failures are recorded and the with-skill runs fix them.
- Negative scenarios show no over-application.
- Re-runs after each edit still pass.
