/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/dot-to-jj-dag/SKILL.md",
    workflow(ctx) {
      parseDotFile(ctx);
      loadAnchorMap(ctx);
      topologicallySortNodes(ctx);

      for (const node of creationOrder(ctx)) {
        if (node.type === "anchor" || node.type === "at") continue;
        createJjNode(ctx, node, { noEdit: true });
        captureChangeId(ctx, node);
      }

      verifyDagShape(ctx);
      emitAnnotatedDot(ctx);
      return done();
    },
    guardrails: [
      function onlyKnownNodeTypes(ctx) {
        return unknownNodeTypes(ctx).length === 0;
      },
      function jjCreationIsAlwaysNonInteractive(ctx) {
        return everyJjNewUsesNoEdit(ctx);
      },
      function finalDagMustBeVerified(ctx) {
        return verificationRan(ctx, "jj log trunk()..@");
      },
    ],
    template: (
      <DotGraph>
        <Node id="trunk" type="anchor" label="trunk()" />
        <Node id="plan0" type="plan" label="feature" />
        <Node id="scope0" type="scope" label="feature" />
        <Node id="at" type="at" label="@" />
      </DotGraph>
    ),
  })
