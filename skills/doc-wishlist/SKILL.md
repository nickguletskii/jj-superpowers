---
name: doc-wishlist
description: "Invoke when you spent significant effort reading multiple files or tracing execution to understand something a short focused doc could have explained immediately."
---

# Doc Wishlist

Propose a documentation file that would help future agents navigate this codebase more efficiently.

## When to invoke

Invoke this skill when you spent significant effort exploring or reading code to understand something — and a short, focused documentation file could have explained it immediately.

**Do NOT invoke** for minor lookups. The bar is: you read multiple files or traced execution across modules to answer a question that a good doc could have answered in seconds.

Create one entry per proposed document. If multiple distinct documents were missing, invoke this skill once per document.

## What to do

1. Get the current timestamp: run `date +%Y-%m-%dT%H%M%S`
2. Choose a short slug describing the proposed document (e.g. `auth-flow`, `plugin-architecture`)
3. Create the file `docs/superpowers/docwishlist/<timestamp>-<slug>.md` with this content:

~~~markdown
---
type: doc-wishlist
date: <timestamp>
---

**What I was trying to understand:** <the question or concept you needed to grasp>

**Exploration required:** <files read, code traced — brief summary>

**Proposed document title:** <a short, descriptive title>

**Proposed file path:** <where it should live in the project, e.g. `docs/architecture/auth-flow.md`>

**Proposed outline:**
- <section or bullet — one line each, enough to convey what the doc should cover>
- ...
~~~

4. Write the file and **continue with your task**. Do not block on this.
