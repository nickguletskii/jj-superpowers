# Brownfield Bootstrap Checklist

Concrete questions to ask the user during step 3 of the bootstrap loop. Use the question tool, not free-form text. Skip questions whose answers are obvious from the repo scan.

## Audience scope
- Which audiences does this project actually serve? (users / downstream developers / operators / contributors)
  - Skip mdbook sections for audiences that don't apply.

## Partition
- Does the project decompose more naturally as capabilities (vertical, user-visible) or as services (independent deployables) or as crates/packages (library boundaries)?
- Are there obvious cross-cuts (auth, observability, error-model, billing, multi-tenancy) that should be planes?

## Naming
- Glossary seeds: which terms appear across multiple subsystems with project-specific meaning? (e.g., "tenant", "video", "session" — define once, link everywhere)
- ID prefixes: default `REQ` / `INV` acceptable, or does the project want shorter custom prefixes?

## Tooling
- Does the project have an external issue tracker? If yes, which one? Repo/project ID?
- Should `agent_blog` be enabled? (default off — opt in only if you actually plan to read entries)
- Should handoffs be committed to VCS (visible to all collaborators) or kept local (gitignored)?

## Existing docs disposition
- For each long-standing doc (README, ARCHITECTURE, docs/), pick: leave alone / excerpt via writing-specs / queue for rewrite (new entry file under `.agents/tech-debt/docs/<YYYY-MM-DD>/<HHMMSS>-<slug>.md`).
- For each existing `AGENTS.md`: which lines describe layout (move to manifest), which describe behavioral guidance (move to project-specific skills), which are conventions that fit nowhere structured (keep in AGENTS.md)?

## Scope exclusions
- Which paths should be in `excluded_paths`? Common: generated files, vendored deps, build outputs. Resist adding application code here.

## Subsystems detected
- List the subsystem candidates from step 1 and classify each per Step 7 (termination check) in `SKILL.md`.
- Are any worth their own nested `.agents/layout.yaml`? (Rule of thumb: only when the subsystem has materially different conventions from the root.)
