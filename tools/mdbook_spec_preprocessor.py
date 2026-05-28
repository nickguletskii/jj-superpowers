#!/usr/bin/env python3
# /// script
# dependencies = ["pyyaml"]
# ///
"""mdbook preprocessor: renders SPEC.yaml chapters to Markdown.

Protocol note: mdBook sends [PreprocessorContext, Book] on stdin. The Book field
was renamed from 'sections' to 'items' in mdBook 0.4.x — the code detects both.

Installation:
  Copy this file into your project (e.g. docs/tools/mdbook_spec_preprocessor.py).
  In book.toml:
    [preprocessor.agent-specs]
    command = "uv run --script docs/tools/mdbook_spec_preprocessor.py"

  In SUMMARY.md, reference SPEC.yaml files directly:
    - [Camera Status View](../../agent-specs/capabilities/camera-status-view/SPEC.yaml)

The preprocessor intercepts any chapter whose source_path ends in .yaml and
renders it as a structured Markdown page. Non-YAML chapters are passed through
unchanged. On schema validation failure the build fails with a clear message.
"""

import json
import sys
from pathlib import Path

import yaml


# ---------------------------------------------------------------------------
# Schema validation
# ---------------------------------------------------------------------------

REQUIRED_TOP = {"id", "kind", "status", "owns", "purpose", "requirements", "references"}
REQUIRED_REQ = {"id", "summary", "level", "text"}
VALID_LEVELS = {"MUST", "MUST NOT", "SHOULD", "SHOULD NOT", "MAY", "DEPRECATED"}
VALID_KINDS = {"capability", "plane"}
VALID_STATUSES = {"draft", "stable", "deprecated"}


def validate(spec: dict, source: str) -> None:
    missing = REQUIRED_TOP - spec.keys()
    if missing:
        raise ValueError(f"{source}: missing required keys: {', '.join(sorted(missing))}")
    if spec["kind"] not in VALID_KINDS:
        raise ValueError(f"{source}: invalid kind '{spec['kind']}'; expected one of {VALID_KINDS}")
    if spec["status"] not in VALID_STATUSES:
        raise ValueError(f"{source}: invalid status '{spec['status']}'; expected one of {VALID_STATUSES}")
    for i, req in enumerate(spec.get("requirements", [])):
        missing_req = REQUIRED_REQ - req.keys()
        if missing_req:
            raise ValueError(f"{source}: requirement[{i}] missing keys: {', '.join(sorted(missing_req))}")
        if req["level"] not in VALID_LEVELS:
            raise ValueError(
                f"{source}: requirement[{i}] ({req.get('id', '?')}) has invalid level '{req['level']}'"
            )
    for fm in spec.get("failure_modes", []):
        for key in ("code", "condition", "behavior"):
            if key not in fm:
                raise ValueError(f"{source}: failure_mode missing key '{key}': {fm}")

    if "sub_specs" in spec:
        if not isinstance(spec["sub_specs"], list):
            raise ValueError(f"{source}: 'sub_specs' must be a list")
        for leaf in spec["sub_specs"]:
            if not isinstance(leaf, str) or not leaf or "/" in leaf:
                raise ValueError(
                    f"{source}: sub_specs entry '{leaf}' must be a plain name with no slashes"
                )

    if "parent" in spec:
        if "sub_specs" in spec:
            raise ValueError(
                f"{source}: sub-spec (has 'parent:') must not also have 'sub_specs:' — nesting is capped at one level"
            )
        if not isinstance(spec["parent"], str):
            raise ValueError(f"{source}: 'parent' must be a string")
        expected_id_prefix = spec["parent"] + "/"
        spec_id = spec.get("id", "")
        if not spec_id.startswith(expected_id_prefix) or not spec_id[len(expected_id_prefix):]:
            raise ValueError(
                f"{source}: sub-spec id '{spec_id}' must start with '{expected_id_prefix}'"
            )


# ---------------------------------------------------------------------------
# Sub-spec resolution
# ---------------------------------------------------------------------------

def _resolve_sub_spec_paths(spec: dict, parent_yaml_path: Path) -> list[tuple[str, Path]]:
    """Return (leaf_name, path) pairs for each sub_spec entry. Raises on missing files."""
    result = []
    parent_dir = parent_yaml_path.parent
    for leaf in spec.get("sub_specs", []):
        sub_path = parent_dir / leaf / "SPEC.yaml"
        if not sub_path.exists():
            raise FileNotFoundError(
                f"{parent_yaml_path}: sub_specs entry '{leaf}' has no SPEC.yaml at {sub_path}"
            )
        result.append((leaf, sub_path))
    return result


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

def _md_table(headers: list[str], rows: list[list[str]]) -> str:
    widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(cell))
    sep = "| " + " | ".join("-" * w for w in widths) + " |"
    header_row = "| " + " | ".join(h.ljust(widths[i]) for i, h in enumerate(headers)) + " |"
    data_rows = [
        "| " + " | ".join(str(cell).ljust(widths[i]) for i, cell in enumerate(row)) + " |"
        for row in rows
    ]
    return "\n".join([header_row, sep] + data_rows)


def render_spec(spec: dict, sub_spec_paths: list[tuple[str, Path]] | None = None) -> str:
    lines = []
    kind_label = "Capability" if spec["kind"] == "capability" else "Plane"
    lines.append(f"# {kind_label}: {spec['id']}")
    lines.append("")
    status = spec["status"]
    badge = {"draft": "🟡 Draft", "stable": "🟢 Stable", "deprecated": "🔴 Deprecated"}.get(status, status)
    lines.append(f"**Status:** {badge}")
    lines.append("")

    # Purpose
    lines.append("## Purpose")
    lines.append("")
    lines.append(str(spec["purpose"]).strip())
    lines.append("")

    # Actors & Surfaces
    if spec.get("actors_and_surfaces"):
        lines.append("## Actors & Surfaces")
        lines.append("")
        lines.append(str(spec["actors_and_surfaces"]).strip())
        lines.append("")

    # Normative Requirements — summary table + detail blocks
    reqs = spec.get("requirements", [])
    if reqs:
        lines.append("## Normative Requirements")
        lines.append("")
        rows = [[r["id"], r["summary"], r["level"]] for r in reqs]
        lines.append(_md_table(["ID", "Summary", "Level"], rows))
        lines.append("")
        for req in reqs:
            lines.append(f"### {req['id']} — {req['summary']}")
            lines.append("")
            lines.append(str(req["text"]).strip())
            lines.append("")

    # State & Lifecycle
    if spec.get("state_and_lifecycle"):
        lines.append("## State & Lifecycle")
        lines.append("")
        lines.append(str(spec["state_and_lifecycle"]).strip())
        lines.append("")

    # Failure Modes
    fms = spec.get("failure_modes", [])
    if fms:
        lines.append("## Failure Modes")
        lines.append("")
        rows = [[fm["code"], fm["condition"], str(fm["behavior"]).strip()] for fm in fms]
        lines.append(_md_table(["Code", "Condition", "Behavior"], rows))
        lines.append("")

    # Scaling Assumptions
    if spec.get("scaling_assumptions"):
        lines.append("## Scaling Assumptions")
        lines.append("")
        lines.append(str(spec["scaling_assumptions"]).strip())
        lines.append("")

    # Out of Scope
    if spec.get("out_of_scope"):
        lines.append("## Out of Scope")
        lines.append("")
        lines.append(str(spec["out_of_scope"]).strip())
        lines.append("")

    # References
    refs = spec.get("references", {})
    ref_lines = []
    if refs.get("planes"):
        ref_lines.append("- **Planes:** " + ", ".join(f"`{s}`" for s in refs["planes"]))
    if refs.get("capabilities"):
        ref_lines.append("- **Capabilities:** " + ", ".join(f"`{s}`" for s in refs["capabilities"]))
    if refs.get("invariants"):
        ref_lines.append("- **Invariants:** " + ", ".join(refs["invariants"]))
    if refs.get("glossary"):
        ref_lines.append("- **Glossary:** " + ", ".join(refs["glossary"]))
    if ref_lines:
        lines.append("## References")
        lines.append("")
        lines.extend(ref_lines)
        lines.append("")

    # Sub-capabilities (parent specs only)
    if sub_spec_paths:
        lines.append("## Sub-capabilities")
        lines.append("")
        for leaf, sub_path in sub_spec_paths:
            sub_spec = yaml.safe_load(sub_path.read_text())
            if not isinstance(sub_spec, dict):
                raise ValueError(f"{sub_path}: expected a YAML mapping for sub-spec, got {type(sub_spec).__name__}")
            # Extract first sentence of purpose
            purpose_text = str(sub_spec.get("purpose", "")).strip()
            purpose_flat = " ".join(purpose_text.split())
            first_sentence = purpose_flat.split(".")[0].strip() + "." if purpose_flat else ""
            slug = sub_spec.get("id", leaf)
            lines.append(f"- **`{slug}`** — {first_sentence}")
        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Chapter walker
# ---------------------------------------------------------------------------

def process_chapter(chapter: dict, book_root: Path) -> dict:
    source_path = chapter.get("source_path", "")
    if not (source_path.endswith(".yaml") or source_path.endswith(".yml")):
        return chapter

    yaml_path = book_root / "src" / source_path
    if not yaml_path.exists():
        # Try relative to book root directly
        yaml_path = book_root / source_path
    if not yaml_path.exists():
        raise FileNotFoundError(f"SPEC.yaml not found at {yaml_path} (source_path={source_path!r})")

    spec = yaml.safe_load(yaml_path.read_text())
    if not isinstance(spec, dict):
        raise ValueError(f"{yaml_path}: expected a YAML mapping, got {type(spec).__name__}")

    validate(spec, str(yaml_path))
    sub_spec_paths = _resolve_sub_spec_paths(spec, yaml_path)
    chapter = dict(chapter)
    chapter["content"] = render_spec(spec, sub_spec_paths=sub_spec_paths)
    return chapter


def walk_items(items: list, book_root: Path) -> list:
    result = []
    for section in items:
        if "Chapter" in section:
            ch = section["Chapter"]
            ch = process_chapter(ch, book_root)
            if ch.get("sub_items"):
                ch = dict(ch)
                ch["sub_items"] = walk_items(ch["sub_items"], book_root)
            result.append({"Chapter": ch})
        else:
            result.append(section)
    return result


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "supports":
        # We support all renderers
        sys.exit(0)

    raw = sys.stdin.read()
    data = json.loads(raw)

    # mdBook sends [PreprocessorContext, Book] as a JSON array.
    # Detect which element is the book (has 'items') defensively.
    if isinstance(data, list) and len(data) == 2:
        if isinstance(data[1], dict) and "items" in data[1]:
            context, book = data[0], data[1]
        elif isinstance(data[0], dict) and "items" in data[0]:
            book, context = data[0], data[1]
        else:
            print(
                f"mdbook_spec_preprocessor: cannot locate 'items' in received data.\n"
                f"  data[0] keys: {list(data[0].keys()) if isinstance(data[0], dict) else type(data[0]).__name__}\n"
                f"  data[1] keys: {list(data[1].keys()) if isinstance(data[1], dict) else type(data[1]).__name__}",
                file=sys.stderr,
            )
            sys.exit(1)
    else:
        print(
            f"mdbook_spec_preprocessor: expected a 2-element JSON array, got {type(data).__name__} "
            f"({'len=' + str(len(data)) if isinstance(data, (list, dict)) else ''})",
            file=sys.stderr,
        )
        sys.exit(1)

    book_root = Path(context.get("root", "."))

    book["items"] = walk_items(book["items"], book_root)

    print(json.dumps(book))


if __name__ == "__main__":
    main()
