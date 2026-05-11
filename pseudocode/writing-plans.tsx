/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/writing-plans/SKILL.md",
    workflow(ctx) {
      announce("using the writing-plans skill");
      mapFileStructureBeforeTasks(ctx);
      writeSharedContextDocs(ctx);
      writeProjectNetworkDot(ctx);
      writePlanIndex(ctx);
      writeTaskFilesWithConcreteStepsAndCommands(ctx);
      writeVerificationFiles(ctx);
      selfReviewPlanAgainstSpec(ctx);
      offerExecutionChoice(ctx, ["Subagent-Driven", "Inline Execution"]);
      return done();
    },
    guardrails: [
      function everyPlanNeedsProjectNetwork(ctx) {
        return fileExists(ctx, "project-network.dot");
      },
      function noPlaceholdersInPlanArtifacts(ctx) {
        return placeholderCount(ctx) === 0;
      },
      function graphHasRequiredGates(ctx) {
        return everyTaskReaches(ctx, ["spec_review", "verify", "quality_review", "final"]);
      },
      function contendedCommandsLiveInVerifyNodes(ctx) {
        return buildTestLintCommandsOnlyAppearInVerifyFiles(ctx);
      },
    ],
    template: (
      <PlanDirectory path="docs/superpowers/plans/YYYY-MM-DD-<feature-name>/">
        <File name="plan.md" />
        <File name="project-network.dot" />
        <Dir name="context">
          <File name="tech-stack.md" />
          <File name="architecture.md" />
          <File name="file-structure.md" optional />
        </Dir>
        <File name="task-01-component-name.md" />
        <File name="verify-01-component-name.md" />
      </PlanDirectory>
    ),
  })
