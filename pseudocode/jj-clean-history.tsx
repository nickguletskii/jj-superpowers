/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/jj-clean-history/SKILL.md",
    workflow(ctx) {
      const beginning = recordStartingOperationId(ctx);

      if (!workingCopyIsEmpty(ctx)) {
        fail("Refuse to clean history while @ has uncommitted changes.");
      }

      const mixedCommits = analyzeRangeForMixedConcerns(ctx);
      presentSplitCandidates(ctx, mixedCommits);
      waitForUser();

      for (const commit of confirmedSplitTargets(ctx)) {
        if (needsParallelTopology(commit)) {
          invokeSkill("jj-split-parallel", { ...ctx, commit });
        } else {
          invokeSkill("jj-hunk", { ...ctx, commit });
        }
      }

      verifyHistoryOnlyChanged(beginning, ctx);
      return done();
    },
    guardrails: [
      function neverTargetWorkingCopyForSplit(ctx) {
        return targetRevision(ctx) !== "@";
      },
      function opRestoreNeedsExplicitConfirmation(ctx) {
        return !usesOpRestore(ctx) || userExplicitlyApprovedOpRestore(ctx);
      },
      function finalWorkingTreeMustMatchInitialWorkingTree(ctx) {
        return workingTreeContentUnchanged(ctx);
      },
    ],
    template: (
      <CleanupFlow>
        <Step>Record starting op</Step>
        <Step>Confirm @ is empty</Step>
        <Step>Review mixed commits</Step>
        <Step>Split confirmed commits</Step>
        <Step>Verify only history changed</Step>
      </CleanupFlow>
    ),
  })
