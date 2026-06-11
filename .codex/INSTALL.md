# Installing jj-superpowers for Codex

Enable jj-superpowers skills in Codex via native skill discovery. Clone the repo, then run the local Deno installer to create flat skill links.

## Prerequisites

- Git
- Deno

## Installation

1. **Clone the jj-superpowers repository:**
   ```bash
   git clone https://github.com/nickguletskii/jj-superpowers.git ~/.codex/jj-superpowers
   ```

2. **Install flat skill links and named subagent roles:**
   ```bash
   cd ~/.codex/jj-superpowers
   deno run -A scripts/install-harnesses.ts install --harness codex
   ```

3. **Restart Codex** (quit and relaunch the CLI) to discover the skills and agents.

These custom agents support `subagent-driven-development` named role dispatch.

The installer links each `skills/<name>/` directory directly under `~/.agents/skills/`, because Codex skill discovery expects `~/.agents/skills/<name>/SKILL.md` and does not treat `~/.agents/skills/jj-superpowers/` as a nested plugin namespace.

## Migrating from old bootstrap

If you installed jj-superpowers before native skill discovery, you need to:

1. **Update the repo:**
   ```bash
   cd ~/.codex/jj-superpowers && git pull
   ```

2. **Run the installer** (step 2 above) — it creates the native discovery links.

3. **Remove the old bootstrap block** from `~/.codex/AGENTS.md` — any block referencing `jj-superpowers-codex bootstrap` is no longer needed.

4. **Restart Codex.**

## Verify

```bash
ls -la ~/.agents/skills/using-superpowers
```

You should see a symlink pointing to `~/.codex/jj-superpowers/skills/using-superpowers`.

For named subagent roles, also verify:

```bash
ls ~/.codex/agents/sdd-implementer.toml
```

## Updating

```bash
cd ~/.codex/jj-superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
cd ~/.codex/jj-superpowers
deno run -A scripts/install-harnesses.ts uninstall --harness codex
```

Optionally delete the clone: `rm -rf ~/.codex/jj-superpowers`.
