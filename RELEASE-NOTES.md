# jj-superpowers Release Notes

## v1.0.0 (2026-03-27)

Initial release of jj-superpowers — a personal fork of [superpowers v5.0.6](https://github.com/obra/superpowers) by Jesse Vincent.

### What's changed from upstream

**jj workflow replaces git worktrees**
- Replaced `using-git-worktrees` with `using-jj-worksets`: sets up a jj scope merge DAG (one `@`, one `scope:` merge per session) instead of creating isolated working directories
- `finishing-a-development-branch` updated to use `jj bookmark create`, `jj git push`, and `jj abandon` instead of `git worktree remove` and `git merge`
- All cross-skill references updated from `using-git-worktrees` to `using-jj-worksets`
- Work scope anchoring question added to `using-jj-worksets`: asks whether to place the new scope on top of `@-`, in parallel to an existing work set, or from `trunk()` before creating any changes

**jj skill library added**
- `jj-agentic-dev` — single-worktree agentic development with scope merge DAG (pre-plans full change DAG, squashes work into pre-planned changes)
- `jj-workspaces` — jj workspace isolation for cases requiring true filesystem isolation
- `jj-hunk` — programmatic hunk selection via the `jj-hunk` tool (non-interactive alternative to `jj split -i`)
- `jj-split-parallel` — split one jj change into parallel siblings by file or hunk, with Python automation script
- `jujutsu` — comprehensive jj reference including daily workflow, revsets, git→jj mapping, and GitLab integration guide

**Brainstorming simplified**
- Removed visual companion feature (browser-based mockup/diagram tool)
- Brainstorming is now text-only; 8 steps instead of 9

**GitHub Copilot CLI support**
- Added `.copilot-plugin/plugin.json` manifest
- Added `skills/using-superpowers/references/copilot-tools.md` with full tool mapping
- `using-superpowers` skill updated to mention Copilot CLI as a supported platform

**Authorship and branding**
- Forked from `obra/superpowers` → `nickguletskii/jj-superpowers`
- Plugin manifests updated: name `jj-superpowers`, author Nick Guletskii
- All upstream URLs updated to `github.com/nickguletskii/jj-superpowers`
- README rewritten to describe the fork; upstream credited
