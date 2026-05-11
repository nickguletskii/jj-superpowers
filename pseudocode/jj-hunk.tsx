/// <reference path="./_shared.tsx" />

export default defineSkill({
    source: "skills/jj-hunk/SKILL.md",
    workflow(ctx) {
      const hunks = listHunks(ctx);
      const spec = buildSelectionSpec(ctx, hunks);
      previewSelection(ctx, spec);

      switch (requestedAction(ctx)) {
        case "split":
          return runJjHunkSplit(ctx, spec);
        case "commit":
          return runJjHunkCommit(ctx, spec);
        case "squash":
          return runJjHunkSquash(ctx, spec);
        default:
          fail("Unknown jj-hunk action.");
      }
    },
    guardrails: [
      function selectionMustReferenceExistingHunks(ctx) {
        return unknownSelectedHunkIds(ctx).length === 0;
      },
      function specDefaultMustBeExplicit(ctx) {
        return specHasDefaultPolicy(ctx);
      },
      function alwaysInspectHunksBeforeSelecting(ctx) {
        return listedHunksBeforeMutation(ctx);
      },
    ],
    template: (
      <JsonFile name="spec.json">
        <Files>
          <File path="src/foo.rs" hunks={[0, "hunk-7c3d..."]} />
          <File path="src/bar.rs" ids={["hunk-aa12..."]} />
        </Files>
        <Default action="reset" />
      </JsonFile>
    ),
  })
