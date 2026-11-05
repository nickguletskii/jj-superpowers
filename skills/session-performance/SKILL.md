---
name: session-performance
description: Use when the user asks to analyze a recorded agent session, explain time spent on commands or model requests, or identify workflow bottlenecks from profiling traces.
---

# Session Performance

Explain where an observed session spent time and recommend the smallest workflow changes supported by its evidence. This is an on-demand analysis, not a reason to add checks to ordinary implementation work.

## Read the recording

Find this skill's source in the jj-superpowers checkout, resolving an installed symlink if necessary. The recorder lives at `scripts/session-profile.ts` relative to that checkout; setup and event coverage are documented in `docs/session-profiling.md`. Do not assume a particular installation directory.

Use the requested session. If none was specified, list recordings and select the clearly relevant session, stating the choice; ask if several are equally plausible. The recording root is `JJ_SUPERPOWERS_PROFILE_DIR` or `~/.local/state/jj-superpowers/profiles`.

Include subagent recordings when analyzing the whole run. For new captures, use a dedicated recording root per run and have child agents inherit it; this keeps unrelated sessions out of combined totals. Both summary and export accept a recording root and recursively combine its child-session recordings. Do not combine the global root indiscriminately.

```sh
node <repo>/scripts/session-profile.ts list
node <repo>/scripts/session-profile.ts summary <session-dir>
node <repo>/scripts/session-profile.ts export <session-dir> <trace.json>
node <repo>/scripts/session-profile.ts export <recording-root> <run-trace.json>
```

Start with the summary. Inspect only the events needed to explain its largest costs or ambiguous intervals. Export a Chrome trace for Perfetto when the user wants a timeline or overlap needs closer inspection. If no recording exists, explain how to enable capture for a future session; do not invent measurements or rerun expensive commands to recreate historical timing.

## Interpret timing correctly

- Use interval unions to describe wall time occupied by a category. Summed operation durations describe work across concurrent agents; they can exceed elapsed session time. Categories can also overlap, so their percentages need not add to 100%.
- Call an interval model-request latency only when model boundaries were observed. This includes provider queuing and network latency; it does not separately establish reasoning, prefill, or token-generation time.
- Leave gaps unattributed. They may include model activity, user input, approvals, scheduling, or missing instrumentation. Identify user waits separately only when recorded events support it.
- Report incomplete spans and missing event coverage before drawing conclusions. A background process launch or polling response does not prove the command finished.
- Repeated command strings are candidates for investigation, not proof of wasted work: source, configuration, or test inputs may have changed. Build duration alone does not establish lock contention or a cache miss.

## Recommend changes

Rank the largest measured costs first. For each significant finding, give its duration or share, the relevant operation names or event IDs, and the evidence connecting it to an actionable change. Separate observations from hypotheses and say what measurement would resolve uncertainty.

Consider batching related edits before verification, narrower test targets, avoiding repeated exploration, command overlap, delegation overhead, and excessive serial tool round trips. Preserve necessary verification. Recommend model or effort changes only when the recording and task context support them; use `jj-superpowers:choosing-model-and-effort` for that decision.

Finish with a few prioritized changes and a way to compare the next similar session. Do not claim precise savings without evidence. Analysis does not authorize editing skills, project instructions, harness settings, or source files: present persistent changes for review. Keep stored command output local and quote only the small excerpts needed to substantiate a finding.
