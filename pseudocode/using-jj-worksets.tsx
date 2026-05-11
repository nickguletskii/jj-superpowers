/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/using-jj-worksets/SKILL.md",
    workflow(ctx) {
      showRawToorgHistory(ctx);
      showOrganizedDagShape(ctx);

      if (cleanReviewableHistoryMatters(ctx)) {
        return invokeSkill("jj-reorg-changes", ctx);
      }

      return done("Skip reorganization and continue through finishing workflow.");
    },
    guardrails: [
      function thisSkillIsConceptualEntryPointOnly(ctx) {
        return !attemptsDetailedReorgWithoutDelegating(ctx);
      },
      function alwaysUseSafeJjFlags(ctx) {
        return jjCommandsFollowSafetyFlags(ctx);
      },
    ],
    template: (
      <WorkScopeGraph>
        <RawHistory prefix="toorg:" />
        <OrganizedHistory prefixes={["plan:", "toreview:", "scope:"]} />
      </WorkScopeGraph>
    ),
  })
