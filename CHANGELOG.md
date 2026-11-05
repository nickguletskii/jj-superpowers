# Changelog

## Unreleased

### Added

- `choosing-model-and-effort` skill: dispatch model/effort selection, the Fable provenance rule, and wall-vs-speculative escalation. Carries a `models.md` reference with two benchmark frontiers.
- Node.js TypeScript harness installer for global jj-superpowers links/config across Claude Code, Codex, Agy, Pi, Oh My Pi, and OpenCode.

### Changed

- Coding harness CLI invocation now requires explicit user permission; subagent delegation uses built-in tools, with local fallbacks when unavailable.

- OpenCode support now targets v2: native SDK registries/context hooks, a directory plugin export, and option-preserving migration to `plugins` configuration.

- Maintained JavaScript scripts, hooks, plugins, and tests now use TypeScript, executed directly by Node.js 22.18+. Added `pnpm typecheck` and `pnpm test`.

- `subagent-driven-development` no longer says "Implementations: strongest model"; model and effort are chosen per `choosing-model-and-effort`.
- The no-nested-harness rule now covers **any** delegation channel, not just the shell — MCP tools (e.g. `mcp__codex__codex`) are explicitly included.

### Removed

- Guidance to use external harnesses for reviews, including default ensemble passes and harness-selection references.

- `capturing-workflow-friction` skill and its activation prompts.

## [1.2.0] - 2026-06-10

### Added

- Skill routing permission-friction checks and unused-skill analysis tooling.
- Agent-spec ecosystem workflows, hierarchical spec support, and spec preprocessing/migration utilities.
- Hypothesis-driven improvement workflow and shell backtick guidance.

### Changed

- Consolidated jj workflow skills and removed the pseudocode source tree.

## [5.0.5] - 2026-03-17

### Fixed

- **Brainstorm server ESM fix**: Renamed `server.js` → `server.cjs` so the brainstorming server starts correctly on Node.js 22+ where the root `package.json` `"type": "module"` caused `require()` to fail. ([PR #784](https://github.com/obra/superpowers/pull/784) by @sarbojitrana, fixes [#774](https://github.com/obra/superpowers/issues/774), [#780](https://github.com/obra/superpowers/issues/780), [#783](https://github.com/obra/superpowers/issues/783))
- **Brainstorm owner-PID on Windows**: Skip `BRAINSTORM_OWNER_PID` lifecycle monitoring on Windows/MSYS2 where the PID namespace is invisible to Node.js. Prevents the server from self-terminating after 60 seconds. The 30-minute idle timeout remains as the safety net. ([#770](https://github.com/obra/superpowers/issues/770), docs from [PR #768](https://github.com/obra/superpowers/pull/768) by @lucasyhzhu-debug)
- **stop-server.sh reliability**: Verify the server process actually died before reporting success. Waits up to 2 seconds for graceful shutdown, escalates to `SIGKILL`, and reports failure if the process survives. ([#723](https://github.com/obra/superpowers/issues/723))

### Changed

- **Execution handoff**: Restore user choice between subagent-driven-development and executing-plans after plan writing. Subagent-driven is recommended but no longer mandatory. (Reverts `5e51c3e`)
