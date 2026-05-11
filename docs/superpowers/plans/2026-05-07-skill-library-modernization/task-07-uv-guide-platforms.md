# Task 7: `uv-guide` Platform-Neutral Sandbox Guidance

**Files:**
- Modify: `skills/uv-guide/SKILL.md`

**Purpose:** Keep useful uv guidance while avoiding Claude Code-only sandbox instructions as universal advice.

**Interfaces and invariants:**
- Core uv guidance for `uv run`, PEP 723, virtual environments, and dependency caching must remain.
- Platform-specific sandbox guidance must be labeled by platform.
- Claude Code `/sandbox` instructions may remain only in a Claude Code subsection.
- Codex guidance must say that network/cache permission failures should use the platform's escalation path for the exact needed command.
- The guide must not say Claude Code paths or commands are universally available.

**Subtasks:**
- [ ] Rename "Using uv Inside Claude Code's Sandbox" to platform-neutral wording, such as "Using uv in Sandboxed Agent Environments."
- [ ] Keep the general symptoms: package downloads, persistent caches, permission denied, network failures.
- [ ] Add a "Codex" subsection that says:
  - Run `uv` normally first.
  - If dependency downloads fail due to network restrictions or cache writes fail due to sandbox permissions, rerun the needed command using Codex's escalation/approval flow.
  - Keep commands scoped; do not request broad arbitrary Python execution approval.
- [ ] Move `/sandbox --allow-read ...` and Claude Code cache allowlist text into a "Claude Code" subsection.
- [ ] If OpenCode/Gemini/Copilot are mentioned, keep them brief and direct readers to platform docs or generic sandbox behavior.
- [ ] Update final checklist/best practices so it no longer implies `~/.cache/uv` is always preconfigured.

**Task-local checks:**
- Run `rg -n "Claude Code|/sandbox|Codex|sandbox|permission|network|pre-configured|always configured" skills/uv-guide/SKILL.md`.
- Expected: Claude Code-specific commands are confined to a Claude Code subsection; Codex escalation guidance exists; no universal "pre-configured" claim remains.
