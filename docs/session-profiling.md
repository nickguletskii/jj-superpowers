# Session profiling

Profiling records what happened; it never skips, deduplicates, rewrites, or reruns commands. The recorder writes local events, a Cargo/Bazel result ledger, and Chrome Trace Event JSON for viewing in [Perfetto](https://ui.perfetto.dev/). Node.js is required for command hooks; Oh My Pi loads its adapter as an extension.

## Enable recording

Choose a directory outside the repository for one work session and set `JJ_SUPERPOWERS_PROFILE_DIR` in the environment **before launching the harness**. Child agents inherit the same directory when the harness propagates environment variables. Using one directory per work session allows a combined parent/subagent trace without mixing unrelated sessions.

```sh
export JJ_SUPERPOWERS_PROFILE_DIR=/tmp/my-work-session-profile
node scripts/profile-adapters.ts config claude-code
node scripts/profile-adapters.ts config codex
node scripts/profile-adapters.ts config antigravity
node scripts/profile-adapters.ts config oh-my-pi
```

Run the relevant config command from the jj-superpowers checkout. It prints configuration with absolute paths to this checkout; moving the checkout requires regenerating it. Commands are quoted for POSIX shells. Keep existing hooks and merge the generated event arrays rather than replacing the settings file. Enable the recorder in one config layer only, to avoid duplicate events. This is separate from the skills/agents installer and is opt-in.

| Harness | Where to place the generated configuration |
|---|---|
| Claude Code | Merge the generated `hooks` into `.claude/settings.json` for a project, or `~/.claude/settings.json` globally. |
| Codex | Merge into `.codex/hooks.json` or `~/.codex/hooks.json`. Review and trust the definitions in `/hooks`. |
| Antigravity | Merge the named `jj-superpowers-profile` entry into `.agents/hooks.json` or `~/.gemini/config/hooks.json`. |
| Oh My Pi | The config output identifies an extension file. Load that file with the harness's extension mechanism; for one launch, `omp --extension /absolute/path/to/jj-superpowers/hooks/profile/oh-my-pi.ts`. |

The generated hooks run synchronously so timestamps approximate invocation boundaries rather than delayed background-hook scheduling. Each command hook starts Node, which adds overhead; timestamps are recorder observation times after scheduling and startup, not exact subprocess start/stop times. They only normalize small event records and write them locally; no tests, builds, repository scans, or network calls are run. Recorder errors are swallowed so they cannot fail an operation. Antigravity requires a neutral `{"decision":"allow"}` for `PreToolUse`; this delegates to its ordinary permission policy and does not auto-approve anything.

## View and analyze

Use the recorder CLI to list recordings, summarize the shared root, and export it:

```sh
node scripts/session-profile.ts list
node scripts/session-profile.ts summary /tmp/my-work-session-profile
node scripts/session-profile.ts export /tmp/my-work-session-profile /tmp/session.trace.json
```

Open the exported JSON in Perfetto via **Open trace file**. Export the shared recording root to include all child session directories in one timeline. Do not combine unrelated recording roots when measuring one work session.

Invoke `session-performance` to interpret the summary and propose workflow improvements. Existing installations that link skills individually need their usual harness installer rerun to discover the new skill. Recorded command output is evidence from a previous invocation, not a guarantee that current source still passes. The analysis skill must assess freshness before citing it.

## Timing and evidence limits

| Harness | Available evidence |
|---|---|
| Claude Code | Tool-call boundaries, supplied Cargo/Bazel responses, turn and subagent lifecycle. No measured provider-request timing from these hooks. |
| Codex | Tool-call boundaries and supplied Cargo/Bazel responses; model request attempts including failures and retries; subagent lifecycle. Unified-exec commands receive their post hook on actual completion, potentially during a later `write_stdin`. |
| Antigravity | Tool-call boundaries, model invocation boundaries, and runtime error strings. Its documented post-tool payload has no command output or exit code, so those fields remain unknown. |
| Oh My Pi | Tool-call boundaries and supplied Cargo/Bazel text/exit metadata, provider request-to-headers intervals, and assistant-message lifecycle intervals. Response headers are not completion of generation. |

These are wall-clock boundaries, not CPU profiles. Model intervals can include network transit, queuing, retries, and harness overhead. Assistant message lifecycle and request-to-headers spans can overlap; they are separate observations and must not be added. Unexplained gaps remain unattributed rather than being labeled LLM thinking. Input/approval wait is not identifiable on every harness.

All adapters retain agent identity where the event provides it. Claude Code and Codex subagent lifecycle hooks share the parent session id but carry the child agent id. Codex's published tool-event schema does not guarantee agent identity; absent identities use an `unattributed` tool lane instead of guessing main-agent ownership. Oh My Pi child factories have independent state and their own session ids; advisor/main identities use `ctx.agent.id` where exposed, and parent-agent identity and parent-session metadata are retained when supplied. Ambiguous overlapping requests without request ids remain incomplete instead of being paired speculatively. Antigravity identifies conversations separately but does not expose a parent-child relation in these hook payloads. A combined recording root preserves separate conversations without inventing that relation.

A tool returning a background job id records a background-start marker, not command completion. If no completion event is exposed later, its command span remains incomplete. Tool-call duration can therefore differ from subprocess lifetime. For Antigravity in particular, `run_command` may return before a process exits and its hooks do not expose the result; its tool boundary must not be interpreted as a completed build.

Command recognition is best-effort matching of visible `cargo`, `bazel`, and `bazelisk` tokens, including compound commands. Shell aliases, scripts invoking builds internally, and dynamic commands may not be recognizable. Only output present in hook payloads can be saved, including any host truncation. All tool timings are recorded; detailed response output is retained only for recognized build commands. Prompt and assistant text are not retained. Commands and build output can still contain sensitive data; keep these local files private and remove recording directories when no longer needed. There is no automatic retention cleanup.

## Compatibility

Adapters target these documented APIs and have fixture coverage, rather than a claim of end-to-end execution in every installed harness version:

- [Claude Code hooks](https://code.claude.com/docs/en/hooks)
- [Codex hooks](https://learn.chatgpt.com/docs/hooks)
- [Antigravity hooks](https://antigravity.google/docs/hooks)
- [Oh My Pi extensions](https://github.com/can1357/oh-my-pi/blob/main/docs/extensions.md)

Older releases may not expose the listed events. Check the harness's hook/extension diagnostics after enabling profiling; a trace with no model events does not establish that model time was zero.
