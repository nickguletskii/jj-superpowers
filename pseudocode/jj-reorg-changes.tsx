/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/jj-reorg-changes/SKILL.md",
    workflow(ctx) {
      const toorg = listToorgCommits(ctx);
      const assignments = inspectFilesAndGroupDependencies(ctx, toorg);
      const dot = composeDagDot(assignments);

      askUser("Confirm base revision and proposed DAG.");
      presentDag(dot, assignments);
      waitForUser();

      const builtDag = dispatch("jj-dag-builder", { dot, anchors: anchorMap(ctx) });

      for (const node of builtDag.todoNodes) {
        dispatch("jj-coordinator", {
          target: node.jj_id,
          files: assignments[node.id].files,
          description: `toreview: ${node.label}`,
        });
        verifySourceToorgIsEmpty(ctx, assignments[node.id].sourceIds);
      }

      abandonEmptyToorgCommits(ctx, toorg);
      verifyReorganizedDag(ctx);
      return done();
    },
    guardrails: [
      function alwaysUseSafeNonInteractiveJjForms(ctx) {
        return jjCommandsFollowSafetyFlags(ctx);
      },
      function userMustApproveProposedDag(ctx) {
        return userApprovedDag(ctx);
      },
      function toorgCommitsMustBeEmptyBeforeAbandon(ctx) {
        return everyToorgDiffIsEmpty(ctx);
      },
    ],
    template: (
      <DotGraph>
        <Node id="base" type="anchor" label="trunk()" />
        <Node id="plan0" type="plan" label="<feature name>" />
        <Node id="step_a" type="todo" label="<concern A>" />
        <Node id="scope0" type="scope" label="<feature name>" />
        <Node id="at" type="at" label="@" />
      </DotGraph>
    ),
  })
