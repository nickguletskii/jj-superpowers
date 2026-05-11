/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/subagent-driven-development/SKILL.md",
    workflow(ctx) {
      const plan = loadPlanIndex(ctx, "plan.md");
      const graph = loadProjectNetworkDot(ctx, "project-network.dot");
      validateExecutionGraph(ctx, plan, graph);
      createTodoListFromGraph(graph);

      while (!finalNodeReady(graph)) {
        const readyTasks = readyNodes(graph, { kind: "task" });
        const taskBatch = selectNonConflictingTasks(readyTasks);

        for (const taskNode of taskBatch) {
          let status = dispatch("implementer", buildImplementerPrompt(ctx, taskNode));

          while (status.type === "NEEDS_CONTEXT") {
            provideMissingContext(ctx, taskNode, status);
            status = dispatch("implementer", buildImplementerPrompt(ctx, taskNode));
          }

          while (status.type === "BLOCKED") {
            resolveBlockedStatus(ctx, graph, taskNode, status);
            status = dispatch("implementer", buildImplementerPrompt(ctx, taskNode));
          }

          if (status.type === "DONE_WITH_CONCERNS") {
            assessImplementerConcerns(ctx, taskNode, status);
          }

          requireStatus(status, ["DONE", "DONE_WITH_CONCERNS"]);
          markPassed(taskNode);
          loopUntilTaskSpecReviewPasses(ctx, graph, taskNode);
        }

        for (const verifyNode of readyNodes(graph, { kind: "verify" })) {
          const verification = runVerifyNode(ctx, verifyNode);

          if (!verification.passed) {
            routeFailuresToResponsibleTaskNodes(ctx, graph, verifyNode, verification);
            continue;
          }

          markPassed(verifyNode);
        }

        for (const qualityNode of readyNodes(graph, { kind: "quality_review" })) {
          const review = dispatch(
            "code-quality-reviewer",
            buildQualityReviewPrompt(ctx, graph, qualityNode),
          );

          if (!review.passed) {
            routeReviewFindingsToResponsibleTaskNodes(ctx, graph, qualityNode, review);
            continue;
          }

          markPassed(qualityNode);
        }
      }

      markPassed(finalNode(graph));
      return invokeSkill("finishing-a-development-branch", ctx);
    },
    guardrails: [
      function freshSubagentPerTask(ctx) {
        return taskAgentsAreNotReusedAcrossTasks(ctx);
      },
      function graphGateOrderIsTaskSpecVerifyQualityFinal(ctx) {
        return everyTaskPathMatches(ctx, [
          "task",
          "spec_review",
          "verify",
          "quality_review",
          "final",
        ]);
      },
      function noOverlappingParallelTaskFileScopes(ctx) {
        return readyParallelTaskFileScopesAreDisjoint(ctx);
      },
      function noQualityReviewBeforeVerification(ctx) {
        return qualityReviewNodesOnlyRunAfterVerifyPasses(ctx);
      },
      function implementersMayOnlyUseJjCommit(ctx) {
        return implementerJjCommands(ctx).every((cmd) => cmd.startsWith("jj commit"));
      },
      function blockedStatusMustChangeSomething(ctx) {
        return !blockedRetriedUnchanged(ctx);
      },
    ],
    template: (
      <SubagentPipeline>
        <Implementer prompt="./implementer-prompt.md" />
        <SpecReviewer prompt="./spec-reviewer-prompt.md" />
        <Verifier prompt="./verification-prompt.md" />
        <CodeQualityReviewer prompt="./code-quality-reviewer-prompt.md" />
      </SubagentPipeline>
    ),
  })
