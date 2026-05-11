# Task 3: Inject "Reporting Gaps" into Subagent Prompt Templates

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Modify: `skills/subagent-driven-development/spec-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

No tests — Markdown files. Verification is reading each file after editing to confirm the section was inserted correctly and all surrounding content is intact.

**Important:** `implementer-prompt.md` and `spec-reviewer-prompt.md` contain a large fenced code block (opening ` ``` ` with no language tag) that holds the full prompt text sent to the subagent. The "Reporting Gaps" section must be inserted **inside** this block so the subagent receives these instructions. The code block uses 4-space indentation for all prompt content. `code-quality-reviewer-prompt.md` is different — the block there contains only dispatch parameters, so the injection goes **outside** the block at the end of the file.

---

## Edit 1: `skills/subagent-driven-development/implementer-prompt.md`

The prompt block ends with this content (the SCOPE values section), followed immediately by the closing ` ``` `:

```
    SCOPE values:
    - **related**: the missing thing is caused by another task in this plan
      (e.g. a type a parallel task is adding doesn't exist yet)
    - **unrelated**: a pre-existing gap outside this work scope
      (e.g. a utility function that should exist but doesn't)
```

- [ ] **Step 1: Insert "Reporting Gaps" inside the implementer prompt block**

Find the exact text shown above and replace it with:

```
    SCOPE values:
    - **related**: the missing thing is caused by another task in this plan
      (e.g. a type a parallel task is adding doesn't exist yet)
    - **unrelated**: a pre-existing gap outside this work scope
      (e.g. a utility function that should exist but doesn't)

    ## Reporting Gaps

    **If you encounter a command invocation issue** that could have been prevented by
    information in a skill, invoke **superpowers:wish-i-knew** to log it — but only if:
    - the relevant information is genuinely absent from existing skills, OR
    - a skill has the information but its phrasing or trigger condition wasn't clear
      enough that you recognised you should use it at the right moment.
    Do NOT invoke for issues caused by simply forgetting something a skill already documents clearly.

    **If you wish you had a reusable tool or script** to help perform your work,
    invoke **superpowers:wish-i-had** to log it.

    **If you spent significant effort exploring or reading code** to understand something
    that a short documentation file could have explained immediately, invoke
    **superpowers:doc-wishlist** to propose that document.

    Log and continue — do not block your task on logging.
```

The closing ` ``` ` that was after the SCOPE values remains where it is — after the new "Reporting Gaps" section.

- [ ] **Step 2: Verify `implementer-prompt.md`**

Read the file. Confirm:
- The "Reporting Gaps" section appears inside the fenced code block, before the closing ` ``` `
- The SCOPE values content immediately above it is unchanged
- All three wish skills are named correctly: `superpowers:wish-i-knew`, `superpowers:wish-i-had`, `superpowers:doc-wishlist`
- The content is indented with 4 spaces to match the surrounding prompt text

---

## Edit 2: `skills/subagent-driven-development/spec-reviewer-prompt.md`

The prompt block ends with this content, followed immediately by the closing ` ``` `:

```
    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]
```

- [ ] **Step 3: Insert "Reporting Gaps" inside the spec reviewer prompt block**

Find the exact text shown above and replace it with:

```
    Report:
    - ✅ Spec compliant (if everything matches after code inspection)
    - ❌ Issues found: [list specifically what's missing or extra, with file:line references]

    ## Reporting Gaps

    **If you encounter a command invocation issue** that could have been prevented by
    information in a skill, invoke **superpowers:wish-i-knew** to log it — but only if:
    - the relevant information is genuinely absent from existing skills, OR
    - a skill has the information but its phrasing or trigger condition wasn't clear
      enough that you recognised you should use it at the right moment.
    Do NOT invoke for issues caused by simply forgetting something a skill already documents clearly.

    **If you wish you had a reusable tool or script** to help perform your work,
    invoke **superpowers:wish-i-had** to log it.

    **If you spent significant effort exploring or reading code** to understand something
    that a short documentation file could have explained immediately, invoke
    **superpowers:doc-wishlist** to propose that document.

    Log and continue — do not block your task on logging.
```

The closing ` ``` ` that was after the Report bullets remains where it is — after the new section.

- [ ] **Step 4: Verify `spec-reviewer-prompt.md`**

Read the file. Confirm:
- The "Reporting Gaps" section appears inside the fenced code block, before the closing ` ``` `
- The Report bullets immediately above are unchanged
- All three wish skills are named correctly
- Content is indented with 4 spaces

---

## Edit 3: `skills/subagent-driven-development/code-quality-reviewer-prompt.md`

This file is different. The fenced code block contains only dispatch parameters (agent type, skill template reference, and named fields). The Reporting Gaps section goes **outside** the block, appended after the final line of the file.

The file currently ends with:

```
**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
```

- [ ] **Step 5: Append "Reporting Gaps" to `code-quality-reviewer-prompt.md`**

Add the following at the very end of the file, after the existing last line:

```markdown

**Reporting Gaps:** Also instruct the reviewer to invoke the following skills when applicable — log and continue, do not block the review:
- **superpowers:wish-i-knew** — if they encounter a command invocation issue revealing a genuine content gap or clarity gap in existing skills (not mere forgetting)
- **superpowers:wish-i-had** — if they wish they had a reusable tool or script for part of their review work
- **superpowers:doc-wishlist** — if they spent significant effort exploring code to understand something a short doc could have explained immediately
```

- [ ] **Step 6: Verify `code-quality-reviewer-prompt.md`**

Read the file. Confirm:
- The "Reporting Gaps" section appears at the end of the file, outside the fenced code block
- The preceding "Code reviewer returns" line is unchanged
- All three wish skills are named correctly
- The wording matches the pattern used in the other injections
