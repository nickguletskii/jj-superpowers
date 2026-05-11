/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/receiving-code-review/SKILL.md",
    workflow(ctx) {
      readFeedbackCompletely(ctx);
      understandOrAskForClarification(ctx);

      if (hasUnclearItems(ctx)) {
        askForClarificationOnAllUnclearItems(ctx);
        return waitForUser();
      }

      verifyFeedbackAgainstCodebaseReality(ctx);
      evaluateEachSuggestionTechnically(ctx);

      for (const item of reviewItems(ctx)) {
        if (feedbackIsCorrect(item)) {
          implementOneItemAtATime(ctx, item);
          testItem(ctx, item);
        } else {
          pushBackWithTechnicalReasoning(ctx, item);
        }
      }

      verifyNoRegressions(ctx);
      return done();
    },
    guardrails: [
      function noPerformativeAgreement(ctx) {
        return !containsPerformativeAgreement(ctx);
      },
      function neverImplementBeforeVerification(ctx) {
        return everyImplementedItemWasVerified(ctx);
      },
      function clarifyAllUnclearItemsBeforeAnyImplementation(ctx) {
        return !hasUnclearItems(ctx) || askedForClarificationFirst(ctx);
      },
    ],
    template: (
      <ReviewReply>
        <ObservedRequirement />
        <VerificationResult />
        <ActionOrPushback />
      </ReviewReply>
    ),
  })
