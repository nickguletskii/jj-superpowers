/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/verification-before-completion/SKILL.md",
    workflow(ctx) {
      const claim = pendingClaim(ctx);
      const command = identifyProofCommand(ctx, claim);
      const result = verify(command);

      if (!result.ok) {
        reportActualStatusWithEvidence(ctx, result);
        return done();
      }

      stateClaimWithEvidence(ctx, claim, result);
      return done();
    },
    guardrails: [
      function noCompletionClaimWithoutFreshVerification(ctx) {
        return !isMakingCompletionClaim(ctx) || freshVerificationExists(ctx);
      },
      function partialVerificationDoesNotCount(ctx) {
        return !isClaimingFullSuccess(ctx) || fullVerificationRan(ctx);
      },
      function neverTrustAgentReportsWithoutIndependentChecks(ctx) {
        return !usesDelegatedWork(ctx) || independentVerificationRan(ctx);
      },
    ],
    template: (
      <VerificationGate>
        <Step>Identify proof command</Step>
        <Step>Run full command</Step>
        <Step>Read full output</Step>
        <Step>State claim only with evidence</Step>
      </VerificationGate>
    ),
  })
