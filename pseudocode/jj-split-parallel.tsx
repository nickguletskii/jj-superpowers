/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/jj-split-parallel/SKILL.md",
    workflow(ctx) {
      const sessionDir = createSplitSessionDir(ctx);
      const rev = resolveTargetRevision(ctx, "@");
      const mode = askUser("Per-file, per-hunk, or nested?");
      const diffInfo = gatherDiffInfo(ctx, rev, mode, sessionDir);

      proposeGroupings(ctx, diffInfo);
      waitForUser();

      const config = writeSplitConfig(ctx, { rev, mode, sessionDir });
      runSplitScript(ctx, config);

      if (mode === "nested") {
        for (const sibling of siblingsNeedingRefinement(ctx)) {
          refineSiblingByHunk(ctx, sibling);
        }
      }

      verifyParallelSplitResult(ctx);
      return done();
    },
    guardrails: [
      function useOnlyForParallelSiblingTopology(ctx) {
        return desiredTopology(ctx) === "parallel-siblings";
      },
      function filePatternsMustMatchStartOfPath(ctx) {
        return allRegexesRespectReMatchSemantics(ctx);
      },
      function splitFailuresAutoRollback(ctx) {
        return !splitFailed(ctx) || jjUndoRan(ctx);
      },
    ],
    template: (
      <JsonFile name="config.json">
        <Field name="rev" value="<full-change-id>" />
        <Field name="mode" value="file | hunk" />
        <Field name="session_dir" value="<session_dir>" />
        <Array name="groups">
          <Object message="feat: group one" />
          <Object message="chore: remaining" />
        </Array>
      </JsonFile>
    ),
  })
