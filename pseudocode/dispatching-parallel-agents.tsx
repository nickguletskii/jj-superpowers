/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/dispatching-parallel-agents/SKILL.md",
    workflow(ctx) {
      if (!userAuthorizedSubagents(ctx)) {
        return askUserOrWorkLocally(ctx);
      }

      if (hasProjectNetworkDot(ctx)) {
        return invokeSkill("subagent-driven-development", ctx);
      }

      const domains = partitionIntoIndependentProblemDomains(ctx);

      if (!domainsAreIndependent(domains)) {
        return runSingleInvestigation(ctx);
      }

      if (!canWorkInParallel(domains)) {
        return runSequentialAgents(ctx, domains);
      }

      const agents = domains.map((domain) =>
        dispatch("investigator", buildFocusedInvestigationPrompt(domain)),
      );

      review(agents);
      verifyIntegratedResult(ctx);
      return done();
    },
    guardrails: [
      function oneAgentPerIndependentDomain(ctx) {
        return noAgentSpansMultipleUnrelatedDomains(ctx);
      },
      function requiresUserAuthorization(ctx) {
        return userAuthorizedSubagents(ctx);
      },
      function deferPlannedImplementationToGraphWorkflow(ctx) {
        return !hasProjectNetworkDot(ctx);
      },
      function promptsMustBeSelfContained(ctx) {
        return everyAgentPromptHasScopeGoalAndConstraints(ctx);
      },
      function doNotParallelizeSharedStateWork(ctx) {
        return !parallelTasksShareMutableState(ctx);
      },
    ],
    template: (
      <AgentPrompt>
        <Scope />
        <Goal />
        <Constraints />
        <Evidence />
        <ExpectedOutput />
      </AgentPrompt>
    ),
  })
