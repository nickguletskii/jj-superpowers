# jj-superpowers

A personal fork of [superpowers](https://github.com/obra/superpowers) by Jesse Vincent, adapted for jujutsu (jj) repositories and personal workflow preferences.

**Original plugin:** [obra/superpowers](https://github.com/obra/superpowers) — if you're not using jj and want the general-purpose version, use the original.

## What's different from upstream

- **jj workflow** — keeps one working copy while implementation produces `toorg:` commits; optional organization into a reviewable jj DAG is handled later by `jj-organizing-history`.
- **No visual companion** — brainstorming is text-only.
- **jj skill library** — includes `jj-hunk`, `jj-organizing-history`, and `jujutsu` reference skills.
- **GitHub Copilot CLI support** — plugin manifest and tool mapping for Copilot CLI.

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do.

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest.

After you've signed off on the design, your agent can put together a graph-based implementation plan with `project-network.dot`, task files, and verification gates. Tasks name exact file paths, interfaces and invariants, and verification steps so work can be executed and reviewed in a controlled order.

Next up, once you say "go", the plan is executed through `subagent-driven-development` or `executing-plans`, with agents working through graph nodes, inspecting and reviewing their work, and continuing forward through the verification gates.

## Installation

### Automated local installer

For a cloned checkout, install global links/config for selected harnesses with the Deno installer:

```bash
deno run -A scripts/install-harnesses.ts install --harness codex
deno run -A scripts/install-harnesses.ts install --all
deno run -A scripts/install-harnesses.ts status --all
deno run -A scripts/install-harnesses.ts uninstall --harness codex
```

Supported harness IDs: `claude-code`, `codex`, `agy`, `pi`, `oh-my-pi`, `opencode`.

The installer is self-contained, uses harness plugin/config registration where supported, and only removes managed links/config entries that point back to this checkout.

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

2. **writing-plans** - Optional full workflow with an approved design. Produces a graph-based plan with `project-network.dot`, task files, exact file paths, interfaces/invariants, and verification steps.

3. **subagent-driven-development** or **executing-plans** - Activates with a plan. Dispatches fresh subagents through graph nodes with review gates, or executes in batches with human checkpoints.

4. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

5. **requesting-code-review** - Activates for ad hoc/manual review. Reviews against plan, reports issues by severity. Critical issues block progress.

6. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (PR/integrate/keep/discard), and may use `jj-organizing-history` to organize `toorg:` commits into a reviewable jj DAG.

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
- **dispatching-parallel-agents** - Ad hoc parallel investigations when subagents are authorized
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Responding to feedback
- **jj-organizing-history** - Post-implementation jj DAG organization and history cleanup
- **finishing-a-development-branch** - PR/integrate decision workflow
- **subagent-driven-development** - Fast iteration with two-stage review (spec compliance, then code quality)
- **capturing-workflow-friction** - Log missing guidance, missing helper tools, and doc gaps without blocking work

**jujutsu**
- **jj-hunk** - Programmatic hunk selection (jj-hunk tool)
- **jj-organizing-history** - Organize `toorg:` commits, clean jj history, and split changes
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
