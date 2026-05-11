# Task 2: Inject "Reporting Gaps" into Main Orchestrator Skills

**Files:**
- Modify: `skills/using-superpowers/SKILL.md`
- Modify: `skills/executing-plans/SKILL.md`

No tests — Markdown files. Verification is reading each file after editing to confirm the section was inserted correctly and the surrounding content is intact.

---

## Edit 1: `skills/using-superpowers/SKILL.md`

The file currently ends with:

```
## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
```

- [ ] **Step 1: Append "Reporting Gaps" section to `skills/using-superpowers/SKILL.md`**

Add the following block at the very end of the file, after the existing last line:

```markdown

## Reporting Gaps

**If you encounter a command invocation issue** that could have been prevented by information in a skill, invoke **superpowers:wish-i-knew** to log it — but only if:
- the relevant information is genuinely absent from existing skills, OR
- a skill has the information but its phrasing or trigger condition wasn't clear enough that you recognised you should use it at the right moment.

Do NOT invoke for issues caused by simply forgetting something a skill already documents clearly.

**If you wish you had a reusable tool or script** to help perform your work, invoke **superpowers:wish-i-had** to log it.

**If you spent significant effort exploring or reading code** to understand something that a short documentation file could have explained immediately, invoke **superpowers:doc-wishlist** to propose that document.

Log and continue — do not block your task on logging.
```

- [ ] **Step 2: Verify `skills/using-superpowers/SKILL.md`**

Read the file. Confirm:
- The "Reporting Gaps" section appears at the end
- The three bullets (wish-i-knew, wish-i-had, doc-wishlist) are present with correct skill names
- The wish-i-knew trigger conditions (content gap OR clarity gap, but NOT recall failure) are stated
- The preceding "User Instructions" section is unchanged

---

## Edit 2: `skills/executing-plans/SKILL.md`

The file currently ends with:

```
## Integration

**Required workflow skills:**
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:finishing-a-development-branch** - Complete development after all tasks
```

- [ ] **Step 3: Append "Reporting Gaps" section to `skills/executing-plans/SKILL.md`**

Add the following block at the very end of the file, after the existing last line:

```markdown

## Reporting Gaps

**If you encounter a command invocation issue** that could have been prevented by information in a skill, invoke **superpowers:wish-i-knew** to log it — but only if:
- the relevant information is genuinely absent from existing skills, OR
- a skill has the information but its phrasing or trigger condition wasn't clear enough that you recognised you should use it at the right moment.

Do NOT invoke for issues caused by simply forgetting something a skill already documents clearly.

**If you wish you had a reusable tool or script** to help perform your work, invoke **superpowers:wish-i-had** to log it.

**If you spent significant effort exploring or reading code** to understand something that a short documentation file could have explained immediately, invoke **superpowers:doc-wishlist** to propose that document.

Log and continue — do not block your task on logging.
```

- [ ] **Step 4: Verify `skills/executing-plans/SKILL.md`**

Read the file. Confirm:
- The "Reporting Gaps" section appears at the end
- The three bullets are present with correct skill names
- The preceding "Integration" section is unchanged
