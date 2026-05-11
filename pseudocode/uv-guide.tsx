/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/uv-guide/SKILL.md",
    workflow(ctx) {
      if (isOneOffScript(ctx)) {
        preferUvRunWithPep723(ctx);
      } else if (needsProjectEnvironment(ctx)) {
        createVenvAndInstallWithUv(ctx);
      }

      if (permissionDeniedFromCache(ctx)) {
        redirectUvCacheOrAdjustSandbox(ctx);
      }

      return done();
    },
    guardrails: [
      function preferUvRunForStandaloneScripts(ctx) {
        return !isStandaloneScript(ctx) || usesUvRun(ctx);
      },
      function sandboxIssuesNeedExplicitCacheHandling(ctx) {
        return !permissionDeniedFromCache(ctx) || cacheHandlingConfigured(ctx);
      },
    ],
    template: (
      <Pep723Script>
        <RequiresPython value=">=3.9" />
        <Dependencies values={["requests", "rich"]} />
      </Pep723Script>
    ),
  })
