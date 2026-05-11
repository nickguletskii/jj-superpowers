/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/designing-with-types-and-abstractions/SKILL.md",
    workflow(ctx) {
      inventoryApisStateAndEffects(ctx);
      identifyTrueAxesOfVariation(ctx);
      modelInvariantsWithTypesFirst(ctx);
      chooseDispatchBoundaryDeliberately(ctx);
      makeOwnershipCleanupAndFallbackExplicit(ctx);
      return done();
    },
    guardrails: [
      function illegalStatesShouldBeUnrepresentable(ctx) {
        return invariantsEncodedInTypes(ctx);
      },
      function noUnrequestedSilentFallbacks(ctx) {
        return !introducedSilentFallbacks(ctx);
      },
      function abstractionBudgetMatchesScope(ctx) {
        return abstractionCost(ctx) <= scopeNeed(ctx);
      },
    ],
    template: (
      <TypeDesign>
        <ProductTypes />
        <SumTypes />
        <ExplicitStateMachine />
        <DispatchBoundary />
      </TypeDesign>
    ),
  })
