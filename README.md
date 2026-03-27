# jj-superpowers

A personal fork of [superpowers](https://github.com/obra/superpowers) by Jesse Vincent, adapted for jujutsu (jj) repositories and personal workflow preferences.

**Original plugin:** [obra/superpowers](https://github.com/obra/superpowers) — if you're not using jj and want the general-purpose version, use the original.

## What's different from upstream

- **jj workflow** — replaces git worktrees with jj's scope merge DAG (`using-jj-worksets`, `jj-agentic-dev`). One working copy; one scope per session.
- **No visual companion** — brainstorming is text-only.
- **jj skill library** — includes `jj-agentic-dev`, `jj-workspaces`, `jj-hunk`, `jj-split-parallel`, and `jujutsu` reference skills.
- **GitHub Copilot CLI support** — plugin manifest and tool mapping for Copilot CLI.

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do.

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest.

After you've signed off on the design, your agent puts together an implementation plan that's clear enough for an enthusiastic junior engineer with poor taste, no judgement, no project context, and an aversion to testing to follow. It emphasizes true red/green TDD, YAGNI (You Aren't Gonna Need It), and DRY.

Next up, once you say "go", it launches a *subagent-driven-development* process, having agents work through each engineering task, inspecting and reviewing their work, and continuing forward.

## Installation

### Claude Code

Clone and install as a local plugin:

```bash
git clone git@github.com:nickguletskii/jj-superpowers.git ~/.claude/plugins/jj-superpowers
```

Then register in your `~/.claude/settings.json`:

```json
{
  "plugins": ["~/.claude/plugins/jj-superpowers/.claude-plugin"]
}
```

### Codex

```
Fetch and follow instructions from https://raw.githubusercontent.com/nickguletskii/jj-superpowers/refs/heads/main/.codex/INSTALL.md
```

### OpenCode

```
Fetch and follow instructions from https://raw.githubusercontent.com/nickguletskii/jj-superpowers/refs/heads/main/.opencode/INSTALL.md
```

### Gemini CLI

```bash
gemini extensions install https://github.com/nickguletskii/jj-superpowers
```

### GitHub Copilot CLI

See [`.copilot-plugin/INSTALL.md`](.copilot-plugin/INSTALL.md).

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-jj-worksets** - Activates after design approval. Sets up a jj work scope (scope merge DAG) as the isolated unit of work for this session.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development** or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality), or executes in batches with human checkpoints.

5. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (PR/integrate/keep/discard), cleans up jj work scope.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## What's Inside

### Skills Library

**Testing**
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)

**Debugging**
- **systematic-debugging** - 4-phase root cause process (includes root-cause-tracing, defense-in-depth, condition-based-waiting techniques)
- **verification-before-completion** - Ensure it's actually fixed

**Collaboration**
- **brainstorming** - Socratic design refinement
- **writing-plans** - Detailed implementation plans
- **executing-plans** - Batch execution with checkpoints
- **dispatching-parallel-agents** - Concurrent subagent workflows
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **using-jj-worksets** - jj work scope setup (scope merge DAG)
- **finishing-a-development-branch** - PR/integrate decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)

**jujutsu**
- **jj-agentic-dev** - Single-worktree agentic development with scope merge DAG
- **jj-workspaces** - jj workspace isolation (for true filesystem isolation)
- **jj-hunk** - Programmatic hunk selection (jj-hunk tool)
- **jj-split-parallel** - Split one change into parallel siblings
- **jujutsu** - Comprehensive jj reference (daily workflow, revsets, GitLab integration, git→jj mapping)

**Meta**
- **writing-skills** - Create new skills following best practices
- **using-superpowers** - Introduction to the skills system

## Philosophy

- **Test-Driven Development** - Write tests first, always
- **Systematic over ad-hoc** - Process over guessing
- **Complexity reduction** - Simplicity as primary goal
- **Evidence over claims** - Verify before declaring success

## Attribution

This is a fork of [superpowers](https://github.com/obra/superpowers), originally created by [Jesse Vincent](https://blog.fsck.com) and the team at [Prime Radiant](https://primeradiant.com). The original project's philosophy, skill architecture, and most skill content are Jesse's work. This fork adds jj-specific workflows and removes features not needed for personal use.

## License

MIT License - see LICENSE file for details

## Issues

- **Issues**: https://github.com/nickguletskii/jj-superpowers/issues
