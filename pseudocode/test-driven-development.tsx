/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/test-driven-development/SKILL.md",
    workflow(ctx) {
      while (hasNextBehaviorToImplement(ctx)) {
        writeOneMinimalFailingTest(ctx);
        verifyTestFailsForExpectedReason(ctx);

        writeMinimalProductionCode(ctx);
        verifyTargetTestPasses(ctx);
        verifyRelevantSuiteStillPasses(ctx);

        refactorWithoutChangingBehavior(ctx);
        verifySuiteStillGreen(ctx);
      }

      return done();
    },
    guardrails: [
      function noProductionCodeWithoutFailingTest(ctx) {
        return !productionCodeWritten(ctx) || sawTestFailFirst(ctx);
      },
      function testMustTargetBehaviorNotMocks(ctx) {
        return testsRealBehavior(ctx);
      },
      function doNotTestWhatStaticTypesAlreadyGuarantee(ctx) {
        return testsOnlyRuntimeBehaviorOrProvenBoundaryRisk(ctx);
      },
    ],
    template: (
      <RedGreenRefactor>
        <Red>Write failing test</Red>
        <Green>Write minimal code</Green>
        <Refactor>Clean up while staying green</Refactor>
      </RedGreenRefactor>
    ),
  })
