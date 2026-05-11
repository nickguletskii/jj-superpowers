/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/doc-wishlist/SKILL.md",
    workflow(ctx) {
      const timestamp = currentTimestamp();
      const slug = chooseSlug(ctx);
      writeDocWishlistEntry(ctx, timestamp, slug);
      return continueMainTask(ctx);
    },
    guardrails: [
      function requiresMeaningfulExploration(ctx) {
        return filesReadCount(ctx) > 1 || tracedAcrossModules(ctx);
      },
      function neverBlockOnWishlistLogging(ctx) {
        return taskContinuesAfterWishlistWrite(ctx);
      },
    ],
    template: (
      <MarkdownFile path="docs/superpowers/docwishlist/<timestamp>-<slug>.md">
        <Frontmatter type="doc-wishlist" date="<timestamp>" />
        <Field name="What I was trying to understand" />
        <Field name="Exploration required" />
        <Field name="Proposed document title" />
        <Field name="Proposed file path" />
        <BulletList name="Proposed outline" />
      </MarkdownFile>
    ),
  })
