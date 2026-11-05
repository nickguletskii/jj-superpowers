# jj-superpowers

A personal fork of [superpowers](https://github.com/obra/superpowers) by Jesse Vincent, adapted for jujutsu (jj) repositories and personal workflow preferences.

**Original plugin:** [obra/superpowers](https://github.com/obra/superpowers) — if you're not using jj and want the general-purpose version, use the original.

## What's different from upstream

- **jj workflow** — keeps one working copy while implementers file `wip(<run>/<node>)` commits through a locking guard, consolidated per task as reviews pass; optional organization into a reviewable jj DAG is handled later by `jj-organizing-history`.
- **No visual companion** — brainstorming is text-only.
- **jj skill library** — includes `jj-hunk`, `jj-organizing-history`, and `jujutsu` reference skills.

## How it works

It starts from the moment you fire up your coding agent. As soon as it sees that you're building something, it *doesn't* just jump into trying to write code. Instead, it steps back and asks you what you're really trying to do.

Once it's teased a spec out of the conversation, it shows it to you in chunks short enough to actually read and digest.

After you've signed off on the design, your agent can put together a graph-based implementation plan with `project-network.dot`, task files, and verification gates. Tasks name exact file paths, interfaces and invariants, and verification steps so work can be executed and reviewed in a controlled order.

Next up, once you say "go", the plan is executed through `subagent-driven-development` or `executing-plans`, with agents working through graph nodes, inspecting and reviewing their work, and continuing forward through the verification gates.

## Installation

### Automated local installer

For a cloned checkout, install global links/config for selected harnesses with Node.js 22.18 or newer. Node runs the TypeScript installer directly without a build step:

```bash
node scripts/install-harnesses.ts install --harness codex
node scripts/install-harnesses.ts install --all
node scripts/install-harnesses.ts status --all
node scripts/install-harnesses.ts uninstall --harness codex
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

### OpenCode V2

From a local checkout with dependencies installed:

```bash
node scripts/install-harnesses.ts install --harness opencode
```

Restart OpenCode. V2 uses the `plugins` configuration array and loads the checkout's exported TypeScript plugin at `.opencode/plugins/superpowers/index.ts` (`@opencode/plugin` 2.2.5). V1 function plugins are incompatible with V2. See [installation and migration instructions](.opencode/INSTALL.md).

## The Basic Workflow

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **writing-plans** - Optional full workflow with an approved design. Produces a graph-based plan with `project-network.dot`, task files, exact file paths, interfaces/invariants, and verification steps.

3. **subagent-driven-development** or **executing-plans** - Activates with a plan. Dispatches fresh subagents through graph nodes with review gates, or executes in batches with human checkpoints.

4. **Implementation and verification** - Implement a coherent chunk, add meaningful coverage, then run the relevant checks. Use **test-driven-development** when test-first work is explicitly required; keep existing implementations when adding tests afterward.

5. **requesting-code-review** - Activates for ad hoc/manual review. Reviews against plan, reports issues by severity. Critical issues block progress.

6. **Finish** - When every `verify` node passes, the executor confirms no scaffold, divergence, or conflict survives (the Finish step of `subagent-driven-development`), then asks what to integrate: a bookmark + push per `jujutsu`, optionally after `jj-organizing-history` reshapes the commits into a reviewable jj DAG.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.

## Optional session profiling

[Enable passive recording](docs/session-profiling.md) for Claude Code, Codex, Antigravity, or Oh My Pi. Export command, tool, model, and subagent timings to a Chrome trace for Perfetto, then invoke **session-performance** to investigate bottlenecks. Recording never skips or changes commands; missing timing stays unattributed.

## What's Inside

### Skills Library

`using-superpowers` carries a routing map from situation → skill.

**Design & planning**
- **brainstorming** - Socratic design refinement before any creative work
- **writing-plans** - Graph-based implementation plans (`project-network.dot`, task files, verification gates)
- **iterative-planning** - Phase a design that's too large or too uncertain for one up-front plan
- **designing-with-types-and-abstractions** - Interfaces, ADTs, explicit state; make illegal states unrepresentable
- **writing-specs** - Author/amend capability specs, plane specs, glossary, invariants

**Execution**
- **subagent-driven-development** - Execute a `project-network.dot` graph with two-stage review (spec compliance, then code quality)
- **executing-plans** - Batch execution with human checkpoints
- **test-driven-development** - RED-GREEN-REFACTOR cycle (includes testing anti-patterns reference)
- **spec-code-sync** - Keep specs and code in step before any source edit in a `.agents/layout.yaml` project

**Debugging & improvement**
- **systematic-debugging** - 4-phase root cause process (root-cause-tracing, defense-in-depth, condition-based-waiting)
- **hypothesis-driven-improvement** - Converge on open-ended objectives: flaky behavior, metric targets, adversarial review loops
- **verification-before-completion** - Evidence before assertions; batch checks and reuse valid results
- **session-performance** - Analyze recorded command, model, and subagent timing; propose workflow improvements

**Review & integration**
- **requesting-code-review** - Pre-review checklist
- **receiving-code-review** - Respond to feedback with rigor, not performative agreement

**Code & docs quality**
- **deslopify** - Remove slop: suspicious logic, tautological tests, over- and under-engineering
- **codebase-cleanup** - Broad dead-code removal and dedup sweeps with evidence and approval gates
- **documentation** - Write, update, and prune code documentation
- **writing-comments** - Comments that earn their keep; strip restatement and transient references

**jujutsu**
- **jujutsu** - Comprehensive jj reference (daily workflow, revsets, GitLab integration, git→jj mapping)
- **jj-organizing-history** - Organize `wip(...)` commits, clean jj history, and split changes
- **jj-hunk** - Programmatic hunk-level splitting and squashing (jj-hunk tool)

**Project layout & specs**
- **project-layout** - Bootstrap/audit `.agents/layout.yaml`, `AGENTS.md`, spec dirs, project skills
- **spec-drift-detector** - Audit drift between specs, code, citations, and tech-debt queues

**Meta**
- **using-superpowers** - How to find and use skills; situation → skill routing map
- **choosing-model-and-effort** - Pick the cheapest model/effort that clears the task
- **dispatching-parallel-agents** - Ad hoc parallel investigations when subagents are authorized
- **tool-output-discipline** - Ask tools for the smallest useful output; command output is context
- **uv-guide** - Run Python with `uv`; packages, virtualenvs, sandbox/cache permissions
- **writing-skills** - Create new skills following best practices

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
