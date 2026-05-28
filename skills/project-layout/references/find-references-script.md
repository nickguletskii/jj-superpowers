# `find-references` Helper Script

`project-layout` SHOULD install this script at `.agents/scripts/find-references` during bootstrap (and offer to install it during a docs audit if it's missing). It is the primary deletion-handling aid per design spec §10.4.

**Limits — be honest with the user about what this does NOT cover:**
- Fixed-string `rg`: variant spellings, partial matches, renamed-but-not-grep-able references, and indirect aliases (e.g., a constant re-export) won't be found. Pass each known alias separately if relevant.
- Greps full SPEC.yaml bodies, not just the structured keys — so prose mentions show up alongside structured `references:` entries. Slightly noisier than the design's "frontmatter grep" framing, but cheap.
- Approximate, not authoritative: the script is a fast first pass. For high-stakes deletions, also run `spec-drift-detector` after the deletion to catch orphan references the grep missed.

## What it does

Given a spec ID (e.g., `REQ-VID-014`, `INV-AUTH-003`), a path (e.g., `rust/projx_inference/src/api.rs`), or a slug (e.g., `video-upload`), it greps every artifact category that might reference it and prints the hits.

Categories scanned:
- Spec files (`docs/agent-specs/**/SPEC.yaml` — `owns:`, `code_spec:`, `references.*`, prose sections)
- Glossary and invariants (cross-references to other terms/IDs)
- mdbook chapters (`docs/book/src/**/*.md`)
- `layout.yaml` (`code_map`, `spec_code.modules`, `excluded_paths`)
- Tech-debt queues (`.agents/tech-debt/*.md`)

## Script

Place at `.agents/scripts/find-references` and `chmod +x`. Requires `ripgrep` (`rg`).

```bash
#!/usr/bin/env bash
# find-references — grep every reference to a spec ID, slug, or path.
# Usage: find-references <id-or-path-or-slug>
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: find-references <id-or-path-or-slug>" >&2
  exit 2
fi

target="$1"
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root"

# Read layout.yaml for paths; fall back to conventional defaults.
specs_root="$(awk '/^specs:/,/^[a-z]/{ if ($1=="root:") {print $2; exit} }' .agents/layout.yaml 2>/dev/null || true)"
specs_root="${specs_root:-docs/agent-specs}"
mdbook_root="$(awk '/^mdbook:/,/^[a-z]/{ if ($1=="root:") {print $2; exit} }' .agents/layout.yaml 2>/dev/null || true)"

print_section() { printf '\n=== %s ===\n' "$1"; }

print_section "Layout manifest (.agents/layout.yaml)"
rg --color=never -n -F -- "$target" .agents/layout.yaml 2>/dev/null || echo "(no hits)"

print_section "Spec frontmatter + bodies ($specs_root)"
rg --color=never -n -F -- "$target" "$specs_root" 2>/dev/null || echo "(no hits)"

if [[ -n "$mdbook_root" && -d "$mdbook_root" ]]; then
  print_section "mdbook ($mdbook_root)"
  rg --color=never -n -F -- "$target" "$mdbook_root" 2>/dev/null || echo "(no hits)"
fi

print_section "Tech-debt queues (.agents/tech-debt/)"
if [[ -d .agents/tech-debt ]]; then
  rg --color=never -n -F -- "$target" .agents/tech-debt 2>/dev/null || echo "(no hits)"
else
  echo "(no .agents/tech-debt directory)"
fi

print_section "Project-specific skills (.agents/skills/)"
if [[ -d .agents/skills ]]; then
  rg --color=never -n -F -- "$target" .agents/skills 2>/dev/null || echo "(no hits)"
else
  echo "(no .agents/skills directory)"
fi
```

## Installation during bootstrap

`project-layout` step 5 SHOULD also:
- Create `.agents/scripts/` if absent.
- Write the script content above to `.agents/scripts/find-references`.
- `chmod +x` it.
- Add `.agents/scripts/` to the committed paths (NOT gitignored).
- Mention the helper in the short `AGENTS.md` if it adds < 1 line ("Helpers: `.agents/scripts/`.").

## When to use

- Before deleting any spec, plane, glossary term, invariant, code-spec module, or mdbook chapter — run `find-references <id-or-path>`, resolve each hit, then delete (per design §10.4).
- During drift-detector orphan reports — run the helper to confirm and locate the broken references.
- During any rename — treat the old name as a deletion + recreation; find every reference.

## Anti-patterns

- Don't pipe the output into anything that auto-rewrites the references — agent judgement decides each hit.
- Don't extend the script to do anything more than grep. Keep it small. If the grep needs more structure, write a new helper.
