# Installing Superpowers for Codex

Enable jj-superpowers skills in Codex via native skill discovery. Just clone and symlink.

## Prerequisites

- Git

## Installation

1. **Clone the jj-superpowers repository:**
   ```bash
   git clone https://github.com/nickguletskii/jj-superpowers.git ~/.codex/jj-superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/jj-superpowers/skills ~/.agents/skills/jj-superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\jj-superpowers" "$env:USERPROFILE\.codex\jj-superpowers\skills"
   ```

3. **Restart Codex** (quit and relaunch the CLI) to discover the skills.

## Migrating from old bootstrap

If you installed jj-superpowers before native skill discovery, you need to:

1. **Update the repo:**
   ```bash
   cd ~/.codex/jj-superpowers && git pull
   ```

2. **Create the skills symlink** (step 2 above) — this is the new discovery mechanism.

3. **Remove the old bootstrap block** from `~/.codex/AGENTS.md` — any block referencing `jj-superpowers-codex bootstrap` is no longer needed.

4. **Restart Codex.**

## Verify

```bash
ls -la ~/.agents/skills/jj-superpowers
```

You should see a symlink (or junction on Windows) pointing to your jj-superpowers skills directory.

## Updating

```bash
cd ~/.codex/jj-superpowers && git pull
```

Skills update instantly through the symlink.

## Uninstalling

```bash
rm ~/.agents/skills/jj-superpowers
```

Optionally delete the clone: `rm -rf ~/.codex/jj-superpowers`.
