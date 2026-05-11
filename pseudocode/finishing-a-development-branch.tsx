/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/finishing-a-development-branch/SKILL.md",
    workflow(ctx) {
      runPreflightDagChecks(ctx);
      if (!preflightPassed(ctx)) fail("Resolve DAG issues before integration.");

      if (hasToorgCommits(ctx)) {
        showCurrentHistory(ctx);
        askUser("Organize toorg commits before proceeding?");
        waitForUser();
        if (userChoseReorg(ctx)) invokeSkill("jj-reorg-changes", ctx);
      }

      runProjectTests(ctx);
      if (!testsPassed(ctx)) fail("Cannot integrate while tests fail.");

      identifyIntegrationChanges(ctx);
      requestUserReviewForEachImplementationCommit(ctx);
      waitForUser();
      renameReviewCommitsToSemanticDescriptions(ctx);

      presentIntegrationOptions(ctx, [
        "Create PR",
        "Integrate to trunk",
        "Keep as-is",
        "Discard this work",
      ]);
      waitForUser();

      executeChosenIntegrationPath(ctx);
      cleanupScopeArtifactsIfNeeded(ctx);
      return done();
    },
    guardrails: [
      function dirtyDagBlocksIntegration(ctx) {
        return preflightPassed(ctx);
      },
      function testsMustPassBeforeOptions(ctx) {
        return testsPassed(ctx);
      },
      function commitReviewRequiresExplicitUserConfirmation(ctx) {
        return userConfirmedReviewedCommits(ctx);
      },
      function discardRequiresExactConfirmation(ctx) {
        return !discardRequested(ctx) || exactDiscardConfirmationReceived(ctx);
      },
    ],
    template: (
      <ChoicePrompt>
        <Option index={1}>Create PR</Option>
        <Option index={2}>Integrate to trunk</Option>
        <Option index={3}>Keep as-is</Option>
        <Option index={4}>Discard this work</Option>
      </ChoicePrompt>
    ),
  })
