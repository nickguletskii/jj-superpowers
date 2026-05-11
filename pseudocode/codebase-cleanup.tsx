/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/codebase-cleanup/SKILL.md",
    workflow(ctx) {
      let subagentMode = userAuthorizedSubagents(ctx) && platformSupportsSubagents(ctx);
      if (!subagentMode) {
        subagentMode = askUserToAuthorizeSubagentsOrUseReducedLocalMode(ctx)
          && userAuthorizedSubagents(ctx)
          && platformSupportsSubagents(ctx);
      }

      const scope = askUser("What should be cleaned up?");

      if (isDirectoryPath(scope)) {
        confirmPrimaryScope(ctx, scope);
      } else {
        if (subagentMode) {
          dispatchParallelExplorers(ctx, scope);
        } else {
          runLocalSemanticSearches(ctx, scope);
        }
        presentSemanticMatches(ctx);
        waitForUser();
      }

      if (subagentMode) {
        runForgottenCodeCheck(ctx);
      } else {
        runLocalForgottenCodeSearch(ctx);
      }
      confirmFinalFileSet(ctx);

      const sessionDir = createCodeMapSession(ctx);
      if (subagentMode) {
        mapDirectoriesInParallel(ctx, sessionDir);
        consolidateMaps(ctx, sessionDir);
        reviewMaps(ctx, sessionDir);

        analyzeGroupsInParallel(ctx, sessionDir);
        reviewAnalysis(ctx, sessionDir);
      } else {
        mapDirectoriesLocally(ctx, sessionDir);
        consolidateMapsLocally(ctx, sessionDir);
        reviewMapsLocally(ctx, sessionDir);

        analyzeGroupsLocally(ctx, sessionDir);
        reviewAnalysisLocally(ctx, sessionDir);
      }

      presentConsolidatedFindings(ctx);
      confirmDeletionList(ctx);

      if (subagentMode) {
        runDeletionAgent(ctx);
        reviewDeletion(ctx);
        synthesizeRefactoringRequest(ctx);
      } else {
        applyConfirmedDeletionsLocally(ctx);
        reviewDeletionLocally(ctx);
        synthesizeRefactoringRequestLocally(ctx);
      }

      return invokeSkill("brainstorming", ctx);
    },
    guardrails: [
      function forgottenCodeCheckAlwaysRuns(ctx) {
        return hasRunForgottenCodeCheck(ctx);
      },
      function orchestratorOwnsUserConversation(ctx) {
        return onlyOrchestratorTalksToUser(ctx);
      },
      function deadCodeClaimsNeedEvidence(ctx) {
        return everyDeadCodeClaimHasGrepEvidence(ctx);
      },
      function localModeDeletesOnlyConfirmedItems(ctx) {
        return subagentMode(ctx) || everyDeletionWasConfirmedByUser(ctx);
      },
    ],
    template: (
      <CodeMapSession path="docs/superpowers/code-map/YYYY-MM-DD-HHmm/">
        <DirectoryMap file="by-directory/<dir>.md" />
        <GroupMap file="by-group/<group>.md" />
        <Index file="index.md" />
        <RefactoringRequest file="refactoring-request.md" />
      </CodeMapSession>
    ),
  })
