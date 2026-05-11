/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/wish-i-knew/SKILL.md",
    workflow(ctx) {
      if (issueWasOnlyRecallFailure(ctx)) {
        return done("Do not log a skill gap for simple forgetting.");
      }

      const timestamp = currentTimestamp();
      const slug = chooseSlug(ctx);
      writeWishIKnewEntry(ctx, timestamp, slug);
      return continueMainTask(ctx);
    },
    guardrails: [
      function doNotLogClearSkillContentAsGap(ctx) {
        return !issueWasClearlyDocumentedAndForgotten(ctx);
      },
      function commandIssueMustMapToContentGapOrClarityGap(ctx) {
        return hasContentGap(ctx) || hasClarityGap(ctx);
      },
    ],
    template: (
      <MarkdownFile path="docs/superpowers/wishiknew/<timestamp>-<slug>.md">
        <Frontmatter type="wish-i-knew" date="<timestamp>" />
        <Field name="Command invoked" />
        <Field name="What went wrong" />
        <Field name="What information would have prevented this" />
        <Field name="Gap type" />
        <Field name="Candidate skill to update" />
      </MarkdownFile>
    ),
  })
