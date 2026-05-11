/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/brainstorming/SKILL.md",
    workflow(ctx) {
      exploreProjectContext(ctx);

      while (!ideaIsUnderstood(ctx)) {
        if (scopeIsTooLarge(ctx)) {
          decomposeIntoSubprojects(ctx);
          focusFirstSubproject(ctx);
        }

        askExactlyOneClarifyingQuestion(ctx);
        waitForUser();
      }

      presentApproaches(ctx, { count: 3, bias: "simple-first" });
      brainstormApiSurfaceAndAbstractions(ctx);

      do {
        presentNextDesignSection(ctx);
        waitForUser();
      } while (!designApproved(ctx));

      if (qualifiesForSmallChangeShortcut(ctx)) {
        const executionPath = askUserToChoose(ctx, [
          "Inline execution",
          "Direct subagent dispatch",
          "Full workflow",
        ]);

        if (executionPath === "Inline execution") {
          return executeInlineWithNamedVerification(ctx);
        }

        if (executionPath === "Direct subagent dispatch") {
          return dispatchBoundedSubagentWithNamedVerification(ctx);
        }
      }

      do {
        writeDesignDoc(ctx, "docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md");
        selfReviewSpec(ctx);
        askUser("Review the spec file before implementation.");
        waitForUser();
      } while (userRequestedSpecChanges(ctx));

      return invokeSkill("writing-plans", ctx);
    },
    guardrails: [
      function noImplementationBeforeApproval(ctx) {
        return designApproved(ctx);
      },
      function shortcutStillRequiresApprovalAndVerification(ctx) {
        return !usingSmallChangeShortcut(ctx) || (designApproved(ctx) && verificationNamed(ctx));
      },
      function oneQuestionPerTurn(ctx) {
        return questionCount(ctx) <= 1;
      },
      function preferSimplestAdequateDesign(ctx) {
        return proposedComplexity(ctx) <= requiredComplexity(ctx);
      },
    ],
    template: (
      <SpecDoc path="docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md">
        <Section title="Architecture" />
        <Section title="Components" />
        <Section title="Data Flow" />
        <Section title="Error Handling" />
        <Section title="Testing" />
      </SpecDoc>
    ),
  })
