/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/executing-plans/SKILL.md",
    workflow(ctx) {
      announce("using the executing-plans skill");
      const plan = loadPlan(ctx);
      const graph = loadProjectNetwork(ctx, "project-network.dot");
      const concerns = reviewPlanAndGraphCritically(plan, graph);

      if (concerns.length > 0) {
        raiseConcernsWithPartner(ctx, concerns);
        return waitForUser();
      }

      const validation = validateGraphContract(plan, graph, {
        requirePlanReference: "project-network.dot",
        requireTaskAttributes: ["kind", "file", "files"],
        requireSingleSpecReviewPerTask: true,
        requireSpecBeforeVerifyBeforeQuality: true,
        requireQualityDependsOnVerify: true,
        requireTerminalFinal: true,
        rejectCycles: true,
        rejectOverlappingParallelFileScopes: true,
      });

      if (!validation.valid) {
        stopAndAskForGraphRepair(ctx, validation.errors);
        return waitForUser();
      }

      const execution = createTodoListFromGraphNodes(graph);

      while (!execution.nodePassed("final")) {
        const readyNodes = execution.readyNodes();

        if (readyNodes.length === 0) {
          stopAndAskForGraphRepair(ctx, execution.blockedReason());
          return waitForUser();
        }

        if (hasOverlappingTaskFileScopes(readyNodes)) {
          stopAndAskForGraphRepair(ctx, "parallel-ready task nodes overlap files");
          return waitForUser();
        }

        for (const node of readyNodes) {
          markInProgress(node);

          if (node.kind === "task") {
            const task = readTaskFile(node.file);
            const contextDocs = readRelevantContext(plan.contextDocs, task);
            enforceFileScope(node.files);
            followTaskStepsExactly(task, contextDocs);
            runTaskLocalChecksOnly(task);
            markPassed(node);
            continue;
          }

          if (node.kind === "spec_review") {
            const taskNode = upstreamTask(node, graph);
            performLocalSpecReview(taskNode, {
              taskFile: taskNode.file,
              allowedFiles: taskNode.files,
              taskLocalCheckReport: taskLocalChecks(taskNode),
            });
            markPassed(node);
            continue;
          }

          if (node.kind === "verify") {
            const verificationFile = requireVerifyFile(node);
            runCommandsFromVerifyFileOnly(verificationFile);
            markPassed(node);
            continue;
          }

          if (node.kind === "quality_review") {
            requireUpstreamVerifyPassed(node, graph);
            const review = performQualityReview(ctx, node, {
              mode: subagentsAvailable(ctx) ? "delegated" : "local",
              noteWhenLocal: "quality_review performed locally because subagents are unavailable",
              verificationReport: upstreamVerificationReport(node, graph),
            });

            if (review.hasIssues) {
              stopForQualityReviewIssues(ctx, review);
              return waitForUser();
            }

            markPassed(node);
            continue;
          }

          if (node.kind === "final") {
            requireAllUpstreamNodesPassed(node, graph);
            markPassed(node);
            continue;
          }

          stopAndAskForGraphRepair(ctx, `unknown node kind: ${node.kind}`);
          return waitForUser();
        }
      }

      return invokeSkill("finishing-a-development-branch", ctx);
    },
    guardrails: [
      function graphMustBeValid(ctx) {
        return graphValidation(ctx).valid;
      },
      function verificationBelongsToVerifyNodes(ctx) {
        return groupVerificationCommands(ctx).every((cmd) => cmd.sourceFile.startsWith("verify-"));
      },
      function parallelTasksMustNotOverlapFiles(ctx) {
        return !hasOverlappingTaskFileScopes(readyTaskNodes(ctx));
      },
      function completionRequiresFinalNode(ctx) {
        return finalNodePassed(ctx) && allUpstreamGatesPassed(ctx);
      },
      function qualityReviewFollowsVerification(ctx) {
        return qualityReviews(ctx).every((review) => upstreamVerifyPassed(review.node));
      },
    ],
    template: (
      <PlanExecution>
        <Load file="plan.md" />
        <Load file="project-network.dot" />
        <Validate checks="graph contract, cycles, file-scope overlap" />
        <Read dir="context/" />
        <Execute ready="task nodes" />
        <Review each="spec_review" />
        <Verify from="verify-*.md" />
        <Review each="quality_review" />
        <Finish at="final" />
      </PlanExecution>
    ),
  })
