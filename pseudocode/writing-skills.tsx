/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/writing-skills/SKILL.md",
    workflow(ctx) {
      invokeSkill("test-driven-development", ctx);

      do {
        runPressureScenarioWithoutSkill(ctx);
        documentHowTheAgentFailed(ctx);
        writeMinimalSkillToCloseObservedGap(ctx);
        runPressureScenarioWithSkill(ctx);
        refineSkillToCloseNewLoopholes(ctx);
      } while (!skillReliablyChangesBehavior(ctx));

      packageSupportingFilesOnlyWhenNeeded(ctx);
      return done();
    },
    guardrails: [
      function noSkillAuthoringWithoutObservedBaselineFailure(ctx) {
        return observedFailureWithoutSkill(ctx);
      },
      function descriptionMustOnlyDescribeWhenToUse(ctx) {
        return descriptionFocus(ctx) === "triggering conditions";
      },
      function documentationBeatsNarrative(ctx) {
        return skillContentIsReferenceLike(ctx);
      },
      function onlyCreateSkillsForReusableJudgmentCalls(ctx) {
        return reusableAcrossProjects(ctx) && notMechanicallyEnforceable(ctx);
      },
    ],
    template: (
      <SkillScaffold path="skills/<skill-name>/SKILL.md">
        <Frontmatter name="<skill-name>" description="Use when..." />
        <Section title="Overview" />
        <Section title="When to Use" />
        <Section title="Workflow or Pattern" />
        <Section title="Examples" />
      </SkillScaffold>
    ),
  })
