# Installing jj-superpowers for OpenCode V2

Requires OpenCode V2 and Node.js 22.18 or newer. The plugin targets `@opencode/plugin` 2.2.5.

## Install a local checkout

```bash
git clone https://github.com/nickguletskii/jj-superpowers.git
cd jj-superpowers
npm install
node scripts/install-harnesses.ts install --harness opencode
```

Restart OpenCode. The installer registers the checkout in the global configuration. To configure it manually, add the directory to `opencode.json` or `opencode.jsonc`:

```json
{
  "plugins": ["/absolute/path/jj-superpowers"]
}
```

Use `plugins` (plural). The checkout's package exports load `.opencode/plugins/superpowers/index.ts`; configured local paths must name directories, not individual `.ts` files.

Ask OpenCode to list available skills and check for jj-superpowers. Use the native `skill`, `subagent`, and `shell` tools; do not assume `todowrite` is enabled.

## Migrate an older installation

V1 function plugins are incompatible with V2. Use the implementation in the updated checkout, remove obsolete entries from the old `plugin` array, and register the checkout under `plugins`.

If old files at `~/.config/opencode/plugins/jj-superpowers.js` or `jj-superpowers.ts` are symlinks from the previous installation, remove those links with `unlink`. Inspect project-local `.opencode/plugins/` for duplicate legacy links too. Preserve the checkout and unrelated plugins, skills, and configuration.

See the [OpenCode V1 migration guide](https://opencode.ai/v2/docs/build/plugins/migrate-v1/).

## Update or uninstall

Update the checkout using your normal version-control workflow, install updated dependencies, and restart OpenCode. Restarting does not fetch a new checkout revision.

To remove the installer's managed registration:

```bash
node scripts/install-harnesses.ts uninstall --harness opencode
```

For troubleshooting and usage, see [the OpenCode guide](../docs/README.opencode.md).
