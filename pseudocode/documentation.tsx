/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/documentation/SKILL.md",
    workflow(ctx) {
      const needsDoc = struggledToUnderstandCode(ctx);
      if (needsDoc) {
        const confident = understandsDomainWell(ctx);
        if (confident) {
          writeDocumentation(ctx, followingLivingDocumentationRules);
        } else {
          proposeDocWishlistEntry(ctx);
          thenWriteDocumentation(ctx, followingLivingDocumentationRules);
        }
      }
      return continueMainTask(ctx);
    },
    guardrails: [
      function noRedundantDocs(ctx) {
        return !duplicatesWhatCodeOrTypesExpress(ctx);
      },
      function bidirectionalReferences(ctx) {
        return docsReferenceCode(ctx) && codeReferencesDocs(ctx);
      },
      function neverLeaveStaleDocs(ctx) {
        return !hasStaleOrOutdatedDocumentation(ctx);
      },
    ],
    decisionFlowchart: (
      <Flowchart>
        <Decision label="Can it be expressed in types?" yes="Encode in types, no doc" no="Continue" />
        <Decision label="Local to one function/module?" yes="Inline doc comment" no="Continue" />
        <Decision label="Cross-cutting architectural decision?" yes="ADR" no="Continue" />
        <Decision label="About running/debugging/deploying?" yes="Runbook" no="Continue" />
        <Decision label="System-level overview?" yes="Module doc with Mermaid" no="Don't document" />
      </Flowchart>
    ),
  })