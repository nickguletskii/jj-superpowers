/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/systematic-debugging/SKILL.md",
    workflow(ctx) {
      const phases = [
        "root-cause investigation",
        "pattern analysis",
        "hypothesis and testing",
        "implementation",
      ] as const;

      for (const phase of phases) {
        runDebugPhase(ctx, phase);
        if (!phaseCompleted(ctx, phase)) {
          return fail(`Cannot continue without completing ${phase}.`);
        }
      }

      if (fixAttemptCount(ctx) >= 3 && !bugResolved(ctx)) {
        questionArchitecture(ctx);
        return waitForUser();
      }

      return done();
    },
    guardrails: [
      function noFixesBeforeRootCause(ctx) {
        return rootCauseInvestigated(ctx);
      },
      function oneHypothesisAtATime(ctx) {
        return concurrentHypothesisCount(ctx) <= 1;
      },
      function fixThreeTimesThenEscalateArchitecture(ctx) {
        return fixAttemptCount(ctx) < 3 || architectureDiscussionOccurred(ctx);
      },
    ],
    template: (
      <DebuggingNotebook>
        <Phase name="Investigation" />
        <Phase name="Pattern Analysis" />
        <Phase name="Hypothesis" />
        <Phase name="Implementation" />
      </DebuggingNotebook>
    ),
  })
