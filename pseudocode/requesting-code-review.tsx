/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/requesting-code-review/SKILL.md",
    workflow(ctx) {
      const reviewScope = chooseReviewScope(ctx, [
        "jj revision/change id",
        "explicit diff range",
        "file list",
        "current @ diff",
      ]);

      if (reviewScope.kind === "current @ diff") {
        reviewScope.diffCommand = "jj diff --git --color=never --no-pager";
      }

      dispatch("code-reviewer", {
        implemented: whatWasImplemented(ctx),
        requirements: planOrRequirements(ctx),
        reviewScope,
        description: shortDescription(ctx),
        reviewLens: ["correctness", "missing requirements", "file decomposition"],
      });
      actOnReviewerFeedback(ctx);
      return done();
    },
    guardrails: [
      function reviewIsMandatoryAtKeyWorkflowBoundaries(ctx) {
        return !atMandatoryBoundary(ctx) || reviewWasRequested(ctx);
      },
      function graphQualityReviewBelongsToQualityReviewNodes(ctx) {
        return !plannedGraphImplementation(ctx) || usesQualityReviewNode(ctx);
      },
      function reviewScopeMustBeExplicit(ctx) {
        return hasRevision(ctx) || hasDiffRange(ctx) || hasFileList(ctx) || hasCurrentAtDiff(ctx);
      },
      function importantIssuesMustBeFixedBeforeProceeding(ctx) {
        return importantIssues(ctx).length === 0 || importantIssuesFixed(ctx);
      },
      function oversizedTouchedFilesNeedExplicitReview(ctx) {
        return reviewerCheckedFileDecomposition(ctx);
      },
    ],
    template: (
      <CodeReviewRequest>
        <Field name="WHAT_WAS_IMPLEMENTED" />
        <Field name="PLAN_OR_REQUIREMENTS" />
        <Field name="REVIEW_SCOPE" />
        <Field name="DESCRIPTION" />
      </CodeReviewRequest>
    ),
  })
