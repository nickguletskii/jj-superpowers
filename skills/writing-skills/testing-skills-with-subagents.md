# Testing Skills With Subagents

**Load this reference when:** creating or editing a skill, before shipping it.

A skill test is a pair of subagent runs on the same scenario: one **without** the skill (baseline) and one **with** it. The difference between the two is what the skill actually changes.

## Baseline vs With-Skill

1. **Write 2–3 scenarios** that look like real work: concrete paths, concrete constraints, a forced decision ("Choose A, B, or C, then act"). Academic prompts ("what does the skill say?") only test recitation.
2. **Run each without the skill.** Record the choice and the reasoning given ("I already tested it manually", "being pragmatic"). These are what the skill must address.
3. **Write the smallest skill** that addresses those observed failures.
4. **Run the same scenarios with the skill.** The agent should now choose correctly. If it doesn't, revise and re-run.

For discipline skills, combine realistic pressures (time, sunk cost, authority) — agents often handle one and give way under several:

```markdown
You spent 3 hours on this feature; it works and you tested it by hand.
It's 6pm, review is at 9am, and you just noticed there are no tests.
A) Rewrite test-first tomorrow  B) Commit now, tests tomorrow  C) Write tests now
Choose and act.
```

## Should-Not-Fire Scenarios

A skill that fires everywhere is as broken as one that never fires. Include at least one scenario where the skill should not apply, or should apply lightly, and check the with-skill run doesn't over-apply it:

```markdown
The user asks you to fix a typo in README.md ("recieve" -> "receive").
Do it.
```

With a TDD skill loaded, the right behavior is to fix the typo — not to write a failing test or refuse. If the with-skill run adds ceremony, narrow the description's trigger conditions or add a "Don't use for" line, then re-run both positive and negative scenarios.

Other negative cases worth testing: a sibling skill's territory (does this skill steal it?), a read-only question, and a task that matches keywords but not intent.

## When the With-Skill Run Still Fails

Ask the agent how the skill could have made the right answer unambiguous:

```markdown
You read the skill and chose C anyway. How could the skill have been
written so that the right answer was unambiguous?
```

- "It should have said X" — documentation gap; add X.
- "I didn't see section Y" — organization problem; move Y earlier or into the description.
- "It was clear, but I weighed it against Z" — state the reason for the rule, or say explicitly how it trades off against Z.

## Done When

- Baseline failures are recorded and the with-skill runs fix them.
- The should-not-fire scenario shows no over-application.
- Re-runs after each edit still pass.
