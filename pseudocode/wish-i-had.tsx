/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/wish-i-had/SKILL.md",
    workflow(ctx) {
      const timestamp = currentTimestamp();
      const slug = chooseSlug(ctx);
      writeWishIHadEntry(ctx, timestamp, slug);
      return continueMainTask(ctx);
    },
    guardrails: [
      function requiresRealMissingAutomation(ctx) {
        return repetitiveManualWorkExists(ctx) && !toolAlreadyExists(ctx);
      },
      function loggingMustNotBlockPrimaryTask(ctx) {
        return taskContinuesAfterWishIHadWrite(ctx);
      },
    ],
    template: (
      <MarkdownFile path="docs/superpowers/wishihad/<timestamp>-<slug>.md">
        <Frontmatter type="wish-i-had" date="<timestamp>" />
        <Field name="Task being performed" />
        <Field name="Tool/script needed" />
        <Field name="What it should do" />
        <Field name="Expected inputs" />
        <Field name="Expected output format" />
      </MarkdownFile>
    ),
  })
