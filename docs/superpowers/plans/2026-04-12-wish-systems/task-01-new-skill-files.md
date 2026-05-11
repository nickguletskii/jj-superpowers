# Task 1: Create Three New Skill Files

**Files:**
- Create: `skills/wish-i-knew/SKILL.md`
- Create: `skills/wish-i-had/SKILL.md`
- Create: `skills/doc-wishlist/SKILL.md`

No tests — these are Markdown skill files. Verification is reading each file after writing to confirm content is correct and frontmatter is valid.

---

- [ ] **Step 1: Create `skills/wish-i-knew/SKILL.md`**

Write this exact content:

```markdown
---
name: wish-i-knew
description: Log a command invocation gap — information absent from or insufficiently clear in existing skills that would have prevented a problem. Invoke when you encounter such a gap; do NOT invoke for simply forgetting something a skill already documents clearly.
---

# I Wish I Knew

Log a command invocation issue that could have been prevented by clearer or missing skill information.

## When to invoke

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

**Gap type:** content gap | clarity gap

**Candidate skill to update:** <skill name, or "new skill needed">
~~~

4. Write the file and **continue with your task**. Do not block on this.
```

- [ ] **Step 2: Verify `skills/wish-i-knew/SKILL.md`**

Read the file back and confirm:
- Frontmatter has `name` and `description` fields
- Trigger conditions distinguish content gap / clarity gap / recall failure correctly
- File format section contains all required fields: command invoked, what went wrong, what information would have helped, gap type, candidate skill
- Timestamp instruction and slug convention are present

---

- [ ] **Step 3: Create `skills/wish-i-had/SKILL.md`**

Write this exact content:

```markdown
---
name: wish-i-had
description: Log a reusable tool or script gap — something that would have helped you perform your work and could become a future skill or utility. Invoke when you find yourself doing something that a reusable tool could automate but doesn't exist yet.
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

**Expected output format:** <description of output — format, structure, where it goes>
~~~

4. Write the file and **continue with your task**. Do not block on this.
```

- [ ] **Step 4: Verify `skills/wish-i-had/SKILL.md`**

Read the file back and confirm:
- Frontmatter has `name` and `description` fields
- File format contains all required fields: task being performed, tool name, what it should do, expected inputs with format, expected output format
- Timestamp instruction and slug convention are present

---

- [ ] **Step 5: Create `skills/doc-wishlist/SKILL.md`**

Write this exact content:

```markdown
---
name: doc-wishlist
description: Propose a codebase documentation file that would have eliminated significant code exploration. Invoke when you spent notable effort reading multiple files or tracing execution to understand something a short, focused doc could have explained immediately.
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
```

- [ ] **Step 6: Verify `skills/doc-wishlist/SKILL.md`**

Read the file back and confirm:
- Frontmatter has `name` and `description` fields
- Trigger condition includes the "multiple files or traced execution" bar
- One-entry-per-document rule is stated
- File format contains all required fields: what you were trying to understand, exploration required, proposed title, proposed file path, proposed outline
- Timestamp instruction and slug convention are present
