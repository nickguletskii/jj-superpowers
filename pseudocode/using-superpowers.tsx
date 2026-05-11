/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/using-superpowers/SKILL.md",
    workflow(ctx) {
      if (!alreadyBrainstormed(ctx) && aboutToDoCreativeWork(ctx)) {
        invokeSkill("brainstorming", ctx);
      }

      if (mightAnySkillApply(ctx)) {
        const relevantSkills = discoverRelevantSkills(ctx);
        for (const skill of relevantSkills) {
          invokeSkill(skill, ctx);
          announceSkillUsage(skill);
          if (skillHasChecklist(skill)) createTodosFromChecklist(skill);
        }
      }

      return continueMainTask(ctx);
    },
    guardrails: [
      function skillCheckHappensBeforeAction(ctx) {
        return checkedForSkillsBeforeAction(ctx);
      },
      function anyNonZeroChanceRequiresSkillInvocation(ctx) {
        return !skillApplicabilityChance(ctx) || invokedRelevantSkill(ctx);
      },
      function redFlagRationalizationsAreRejected(ctx) {
        return !containsRationalization(ctx);
      },
    ],
    template: (
      <SkillFlow>
        <Decision label="Might any skill apply?" />
        <Action label="Invoke skill" />
        <Action label="Announce skill usage" />
        <Decision label="Has checklist?" />
      </SkillFlow>
    ),
  })
