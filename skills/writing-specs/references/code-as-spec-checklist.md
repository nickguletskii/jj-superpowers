# Code-as-Spec Module Change Procedure

When editing a module registered in `layout.yaml` `spec_code.modules`, the change is atomic across three artifacts. This procedure prevents partial changes that drift the spec.

## The three artifacts

(a) **The code-as-spec module itself** — signature change + RFC2119 doc update in the native doc format.
(b) **Prose sections in `SPEC.yaml`** — any section (purpose, actors_and_surfaces, failure_modes, etc.) that references the changed item must be updated to stay consistent.
(c) **`SPEC.yaml` requirements list** — if a `REQ-`/`INV-` ID is bound to the item, update the summary/level.

All three in one change set.

## Procedure

1. **Identify the bound spec**. Use `layout.yaml` `spec_code.modules.capability` (or `plane`) field. Read that spec's `SPEC.yaml`.
2. **Identify cross-references**. Grep the prose sections of `SPEC.yaml` for the item's identifier (function name, type name, REQ ID).
3. **Plan the edit**. List exactly what changes in (a), (b), (c) before touching files.
4. **Edit (a) first**. Signature + doc comment together. Doc comment uses RFC2119; keep style consistent with sibling items.
5. **Edit (b)**. Update prose references; rephrase REQ entries that depend on the changed signature.
6. **Edit (c)**. Sync `SPEC.yaml` requirements list summaries/levels with the new prose. Re-check IDs.
7. **Validate**. Re-read all three to confirm consistency. If anything is "TBD" or "see other file", the change set is incomplete.

## Things that count as a "signature change"

- Adding/removing a public function, trait method, type, enum variant, constant.
- Changing parameter types, return types, error types.
- Changing visibility (private → public, etc.).
- Renaming a public item.

## Things that do NOT count (private to the module)

- Internal helper changes that don't appear in the public surface.
- Comment/whitespace edits with no semantic impact.

If the module contains anything in the "do NOT count" bucket, **it's the wrong module** — that's implementation, not API surface. Move it elsewhere (per writing-specs SKILL.md rule 1).

## What spec-code-sync detects

If you edit (a) without (b) and (c) in the same change, `spec-code-sync` flags the change as unfinished and reroutes you here. Don't try to land partial atomic changes — they'll bounce.

## Renames

A rename of a public item is a deprecation + new item. Either:
- Keep the old item with a `#[deprecated]` (or equivalent) attribute pointing at the new one, OR
- Hard rename and update the spec's `replaced_by:` on the affected REQ ID.

Pick deliberately. The first is non-breaking for callers; the second is a breaking change that callers must adapt to.
