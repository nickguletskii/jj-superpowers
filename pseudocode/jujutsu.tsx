/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/jujutsu/SKILL.md",
    workflow(ctx) {
      if (!repoUsesJj(ctx) && !userExplicitlyRequestedJj(ctx)) {
        return done("Skill not needed.");
      }

      replaceGitWorkflowWithJjWorkflow(ctx);
      forceNonInteractiveJjForms(ctx);

      if (needsRepositorySetup(ctx)) {
        gatherRepoFacts(ctx);
        updateClaudeMdWithJjGuidance(ctx);
      }

      if (rewritingHistory(ctx)) {
        captureOldWorkingCopyCommit(ctx);
        performRewrite(ctx);
        verifyGraphShapeAndContentStability(ctx);
      }

      return done();
    },
    guardrails: [
      function noRawGitUnlessUserExplicitlyAsked(ctx) {
        return !usesRawGit(ctx) || userExplicitlyRequestedGit(ctx);
      },
      function mayMoveAtOnlyWithPermission(ctx) {
        return !movesWorkingCopy(ctx) || userExplicitlyAllowedMovingAt(ctx);
      },
      function everyEditorOpeningCommandMustBeNonInteractive(ctx) {
        return allJjMutationsHaveMessageFlags(ctx);
      },
    ],
    template: (
      <ClaudeMd>
        <Section title="Version Control">Use jj instead of git.</Section>
        <Section title="Main branch">{`<detected trunk()>`}</Section>
        <Section title="Build">{`<detected build command>`}</Section>
        <Section title="Test">{`<detected test command>`}</Section>
      </ClaudeMd>
    ),
  })
