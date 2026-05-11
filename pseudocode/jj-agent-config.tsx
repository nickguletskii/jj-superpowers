/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/jj-agent-config/SKILL.md",
    workflow(ctx) {
      const dir = detectPlatformSpecificJjConfigDir(ctx);
      ensureDirectoryExists(dir);
      writeJjSuperpowersToml(dir);
      explainRequiredEnvironmentVariable(ctx);
      return done();
    },
    guardrails: [
      function configMustLiveInPlatformConfigDir(ctx) {
        return wroteConfigToSupportedJjConfigDir(ctx);
      },
      function editorMustBeDisabledForAgents(ctx) {
        return jjEditorIsNonInteractive(ctx);
      },
    ],
    template: (
      <TomlFile path="<jj-config-dir>/jj-superpowers.toml">
        <Scope whenEnvAny={["CLAUDE_CODE_ENV", "OPENCODE_ENV", "CODEX_ENV", "GITHUB_COPILOT_CLI_ENV"]} />
        <Ui pager="" diffFormat="git" editor="/bin/false" mergeEditor="/bin/false" />
        <Aliases names={["l", "s", "d", "st", "ws", "bm"]} />
      </TomlFile>
    ),
  })
