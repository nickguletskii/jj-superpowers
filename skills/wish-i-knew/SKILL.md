---
name: wish-i-knew
description: "Invoke when you encounter a command invocation issue that a skill could have prevented, but only if the information was genuinely missing or unclear in existing skills (not mere forgetting)."
---

# I Wish I Knew

Log a command invocation issue that could have been prevented by clearer or missing skill information.

## When to invoke

**Before invoking, ask yourself:** Did I already know the relevant information and simply fail to apply it? If yes, do not invoke this skill — this is a recall failure, not a skill gap.

Invoke this skill when you encounter a command invocation issue AND one of the following is true:

- The relevant information is **genuinely absent** from all existing skills (content gap), OR
- A skill **has the information** but its phrasing or trigger condition wasn't clear enough that you recognised you should use it at the right moment (clarity gap).

**Do NOT invoke** if the issue stems from simply forgetting something a skill already documents clearly.

## What to do

1. Get the current timestamp: run `date +%Y-%m-%dT%H%M%S`
2. Choose a short slug describing the gap (e.g. `jj-commit-flag-missing`, `revset-syntax-unclear`)
3. Create the file `docs/superpowers/wishiknew/<timestamp>-<slug>.md` with this content:

~~~markdown
---
type: wish-i-knew
date: <timestamp>
---

**Command invoked:** `<the command that failed or misbehaved>`

**What went wrong:** <description of the failure or unexpected behavior>

**What information would have prevented this:** <what you needed to know>

**Gap type:** (content gap / clarity gap — delete the one that does not apply)

**Candidate skill to update:** <skill name, or "new skill needed">
~~~

4. Write the file and **continue with your task**. Do not block on this.
