---
name: wish-i-had
description: "Invoke when you find yourself needing a reusable tool or script that doesn't exist yet and would benefit future agents."
---

# I Wish I Had

Log a reusable tool or script that you needed but didn't have.

## When to invoke

Invoke this skill when you find yourself doing something tedious, error-prone, or repetitive that a reusable tool or script could automate — and no such tool exists in the project yet.

## What to do

1. Get the current timestamp: run `date +%Y-%m-%dT%H%M%S`
2. Choose a short slug describing the tool (e.g. `hunk-selector`, `commit-graph-visualizer`)
3. Create the file `docs/superpowers/wishihad/<timestamp>-<slug>.md` with this content:

~~~markdown
---
type: wish-i-had
date: <timestamp>
---

**Task being performed:** <what you were doing>

**Tool/script needed:** <name or short description>

**What it should do:** <description of the tool's purpose>

**Expected inputs:**
- `<input-name>` (`<format>`): <description>
- ... (add more as needed, or write "none" if the tool takes no inputs)

**Expected output format:** <description of output — format, structure, where it goes>
~~~

4. Write the file and **continue with your task**. Do not block on this.
