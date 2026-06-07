---
type: wish-i-knew
date: 2026-06-08T154726
---

**Command invoked:** `rg -n "Do not invoke `claude`, `codex`, ..."`
**What went wrong:** zsh treated the backticked command names inside the double-quoted search pattern as command substitutions, which attempted to run `claude`, `codex`, `gemini`, and `opencode` during a verification scan.
**What information would have prevented this:** Command guidance should explicitly warn that literal Markdown backticks in shell search patterns must be single-quoted or escaped; otherwise the shell may execute the text inside them.
**Gap type:** clarity gap
**Candidate skill to update:** jj-superpowers:using-superpowers or jj-superpowers:tool-output-discipline
