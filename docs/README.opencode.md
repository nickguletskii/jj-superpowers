# jj-superpowers for OpenCode V2

Use jj-superpowers with [OpenCode V2](https://opencode.ai/v2/docs/). The plugin targets `@opencode/plugin` 2.2.5 and exports its server entrypoint from `.opencode/plugins/superpowers/index.ts`.

## Installation

Install from a local checkout with Node.js 22.18 or newer:

```bash
git clone https://github.com/nickguletskii/jj-superpowers.git
cd jj-superpowers
npm install
node scripts/install-harnesses.ts install --harness opencode
```

Restart OpenCode after installation. The installer registers this checkout in the global OpenCode configuration. You can instead configure a local checkout manually in `opencode.json` or `opencode.jsonc`:

```json
{
  "plugins": ["/absolute/path/jj-superpowers"]
}
```

V2 uses `plugins` (plural). The configured local path names the checkout directory, whose package exports resolve the TypeScript plugin entrypoint; do not configure an individual `.ts` file. See the [OpenCode plugin loading reference](https://opencode.ai/v2/docs/build/plugins/).

Verify by asking OpenCode to list available skills and checking for jj-superpowers skills.

## Migrating from V1

V1 function plugins do not run in V2. Renaming `plugin` to `plugins` or changing a file extension does not port the implementation. This checkout contains the V2 plugin definition. See the [V1 migration guide](https://opencode.ai/v2/docs/build/plugins/migrate-v1/).

Remove obsolete jj-superpowers entries from the old `plugin` array. If these files are old jj-superpowers plugin symlinks, remove those links so OpenCode does not discover a duplicate V1 entrypoint:

```bash
unlink ~/.config/opencode/plugins/jj-superpowers.js
unlink ~/.config/opencode/plugins/jj-superpowers.ts
```

Run only the commands for links that exist and that you have confirmed belong to the old installation. Also inspect project-local `.opencode/plugins/` for old jj-superpowers `.js` or `.ts` symlinks. Keep the cloned checkout: the new configuration points to it. Remove old jj-superpowers skill symlinks or `skills.paths` entries only if they duplicate the plugin's skills; preserve unrelated skills and paths.

Then run the installer above, or add the checkout directory to `plugins` manually.

## Usage

Use OpenCode's native `skill` tool to list available skills and load the desired discovered name. Personal skills can live in `~/.config/opencode/skills/<name>/SKILL.md`; project skills can live in `.opencode/skills/<name>/SKILL.md`.

Bundled subagent roles include `sdd-implementer`, `sdd-spec-reviewer`, `sdd-verifier`, `sdd-quality-reviewer`, and `sdd-jj-coordinator`. Use the V2 `subagent` tool for delegated work. Subagents receive bounded task context and should not start nested harness processes through the shell.

### Tool mapping

When a skill references Claude Code tools, use the corresponding V2 capability:

- `Task` with subagents → `subagent`.
- `Bash` → `shell`.
- `Skill` → `skill`.
- File operations → native OpenCode file tools.

Todos are disabled by default in V2. Do not assume `todowrite` exists; track planned work against its durable plan artifacts.

## Updating

Update the local checkout with your normal version-control workflow, install its updated dependencies, and restart OpenCode. To keep a particular revision, keep the checkout at that revision. Restarting alone does not update the checkout.

## How it works

The package exports a V2 `Plugin.define` definition with a stable ID and `setup(ctx)`. During setup, `ctx.skill.transform` adds the bundled skills and `ctx.agent.transform` adds the bundled subagents without replacing agents already defined under the same names. Each bundled subagent receives its role instructions as system guidance and is marked for subagent use. Compact bootstrap guidance points to the full `using-superpowers` body, which remains available through the skill tool instead of being pasted into every conversation.

If jj-superpowers guidance causes wasteful, contradictory, or unsafe behavior, follow applicable provider guidance and report the conflicting instruction so the library can be improved.

## Troubleshooting

If the plugin does not load, check that you are using OpenCode V2, that `plugins` contains the correct checkout directory, and that dependencies are installed there. Consult OpenCode's plugin diagnostics for an entrypoint or SDK compatibility error. Remove duplicate legacy plugin entries before retrying.

If skills or bundled agents are missing, verify that the plugin loaded and the checkout still contains `skills/` and `agents/`. Restart after installation or configuration changes.

- [Report issues](https://github.com/nickguletskii/jj-superpowers/issues)
- [OpenCode V2 plugin documentation](https://opencode.ai/v2/docs/build/plugins/)
