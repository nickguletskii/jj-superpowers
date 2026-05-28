#!/usr/bin/env python3
# /// script
# dependencies = ["pyyaml", "ruamel.yaml"]
# ///
"""Migrate SPEC.md + requirements.yaml → SPEC.yaml for agent-spec capabilities/planes.

Usage:
  uv run --script migrate_spec_to_yaml.py <capability-dir> [<capability-dir> ...]

Each directory must contain SPEC.md. requirements.yaml is optional but used for
level/summary data when present. On success, SPEC.yaml is written and SPEC.md +
requirements.yaml are deleted.
"""

import re
import sys
import io
from pathlib import Path

import yaml
from ruamel.yaml import YAML
from ruamel.yaml.comments import CommentedMap, CommentedSeq
from ruamel.yaml.scalarstring import LiteralScalarString


def ls(text: str) -> LiteralScalarString:
    """Wrap text as a YAML literal block scalar."""
    text = text.strip()
    if not text.endswith("\n"):
        text += "\n"
    return LiteralScalarString(text)


def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---\n"):
        return {}, text
    try:
        end = text.index("\n---\n", 4)
    except ValueError:
        return {}, text
    fm = yaml.safe_load(text[4:end]) or {}
    body = text[end + 5:]
    return fm, body


def parse_sections(body: str) -> dict[str, str]:
    """Extract H2 sections from markdown body."""
    sections: dict[str, str] = {}
    current: str | None = None
    lines: list[str] = []
    for line in body.splitlines():
        if line.startswith("## "):
            if current is not None:
                sections[current] = "\n".join(lines).strip()
            current = line[3:].strip()
            lines = []
        else:
            if current is not None:
                lines.append(line)
    if current is not None:
        sections[current] = "\n".join(lines).strip()
    return sections


_REQ_HEADING = re.compile(r"^### (REQ-[A-Z]+-\d+) — (.+)$")


def parse_requirements_from_md(section: str) -> list[dict]:
    reqs = []
    current_id: str | None = None
    current_summary: str | None = None
    current_lines: list[str] = []

    for line in section.splitlines():
        m = _REQ_HEADING.match(line)
        if m:
            if current_id:
                reqs.append({
                    "id": current_id,
                    "summary": current_summary,
                    "text": "\n".join(current_lines).strip(),
                })
            current_id = m.group(1)
            current_summary = m.group(2)
            current_lines = []
        else:
            if current_id is not None:
                current_lines.append(line)

    if current_id:
        reqs.append({
            "id": current_id,
            "summary": current_summary,
            "text": "\n".join(current_lines).strip(),
        })

    return reqs


def parse_failure_modes_table(section: str) -> list[dict]:
    """Parse a 3-column markdown table into structured failure mode records."""
    modes = []
    table_started = False

    for line in section.splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cols = [c.strip() for c in stripped.split("|") if c.strip()]
        if not table_started:
            table_started = True
            continue  # header row
        if all(set(c) <= {"-", ":"} for c in cols):
            continue  # separator row
        if len(cols) >= 3:
            code = cols[0].strip("`")
            condition = cols[1]
            behavior = cols[2]
            modes.append({"code": code, "condition": condition, "behavior": behavior})

    return modes


_CAP_BARE = re.compile(r"-\s+[`'\"]?([a-z][a-z0-9-]+)[`'\"]?\s+capability")
_CAP_LINK_SPEC = re.compile(r"-\s+\[.+?\]\(.+?/([a-z][a-z0-9-]+)/SPEC\.md\)")
_CAP_BARE_TICK = re.compile(r"-\s+`([a-z][a-z0-9-]+)`\s*$")


def extract_capability_refs(see_also: str) -> list[str]:
    """Extract capability slugs from a See Also section, dropping file paths."""
    found = []
    for line in see_also.splitlines():
        line = line.strip()
        if not line.startswith("-"):
            continue
        # Skip mdbook chapter references
        if "mdbook chapter:" in line:
            continue
        # Skip bare file links (markdown links containing a dot in the display name)
        # Pattern: [`filename.ext`](/path)
        if re.match(r"-\s+\[`[^`]+\.[^`]+`\]", line):
            continue

        m = _CAP_BARE.match(line) or _CAP_LINK_SPEC.match(line)
        if m:
            found.append(m.group(1))
            continue

        m = _CAP_BARE_TICK.match(line)
        if m:
            slug = m.group(1)
            # Only accept if it looks like a capability slug (contains hyphens or is long)
            if "-" in slug or len(slug) > 6:
                found.append(slug)

    return list(dict.fromkeys(found))  # dedupe preserving order


def migrate(cap_dir: Path) -> None:
    spec_md = cap_dir / "SPEC.md"
    req_yaml = cap_dir / "requirements.yaml"
    spec_yaml_out = cap_dir / "SPEC.yaml"

    if not spec_md.exists():
        print(f"SKIP {cap_dir}: no SPEC.md", file=sys.stderr)
        return

    text = spec_md.read_text()
    frontmatter, body = parse_frontmatter(text)
    sections = parse_sections(body)

    # Load requirements.yaml index for level/summary overrides
    req_index: dict[str, dict] = {}
    if req_yaml.exists():
        rdata = yaml.safe_load(req_yaml.read_text()) or {}
        for r in rdata.get("requirements", []):
            req_index[r["id"]] = {"summary": r.get("summary", ""), "level": r.get("level", "MUST")}

    # Parse requirements from SPEC.md prose
    md_reqs = parse_requirements_from_md(sections.get("Normative Requirements", ""))

    # Merge: level/summary from requirements.yaml, text from SPEC.md
    merged_reqs = []
    for r in md_reqs:
        idx = req_index.get(r["id"], {})
        merged_reqs.append({
            "id": r["id"],
            "summary": idx.get("summary") or r["summary"],
            "level": idx.get("level", "MUST"),
            "text": r["text"],
        })

    # Parse failure modes table
    failure_modes = []
    fm_section = sections.get("Failure Modes", "").strip()
    if fm_section:
        failure_modes = parse_failure_modes_table(fm_section)

    # Extract capability refs from See Also
    capability_refs = []
    if "See Also" in sections:
        capability_refs = extract_capability_refs(sections["See Also"])

    # Build SPEC.yaml
    ryaml = YAML()
    ryaml.default_flow_style = False
    ryaml.width = 100
    ryaml.best_sequence_indent = 2

    doc = CommentedMap()
    doc["id"] = frontmatter.get("id", cap_dir.name)
    doc["kind"] = frontmatter.get("kind", "capability")
    doc["status"] = frontmatter.get("status", "draft")
    doc["owns"] = frontmatter.get("owns", [])

    code_spec = frontmatter.get("code_spec", []) or []
    doc["code_spec"] = code_spec

    refs = CommentedMap()
    fm_refs = frontmatter.get("references", {}) or {}
    refs["planes"] = fm_refs.get("planes", []) or []
    refs["capabilities"] = capability_refs
    refs["invariants"] = fm_refs.get("invariants", []) or []
    refs["glossary"] = fm_refs.get("glossary", []) or []
    doc["references"] = refs

    # Prose sections
    purpose = sections.get("Purpose", "").strip()
    if purpose:
        doc["purpose"] = ls(purpose)

    actors = sections.get("Actors & Surfaces", "").strip()
    if actors:
        doc["actors_and_surfaces"] = ls(actors)

    slc = sections.get("State & Lifecycle", "").strip()
    if slc:
        doc["state_and_lifecycle"] = ls(slc)

    # Structured requirements
    req_list = CommentedSeq()
    for r in merged_reqs:
        entry = CommentedMap()
        entry["id"] = r["id"]
        entry["summary"] = r["summary"]
        entry["level"] = r["level"]
        entry["text"] = ls(r["text"]) if r["text"] else ls("(no prose text in source SPEC.md)")
        req_list.append(entry)
    doc["requirements"] = req_list

    # Structured failure modes
    if failure_modes:
        fm_list = CommentedSeq()
        for fm in failure_modes:
            entry = CommentedMap()
            entry["code"] = fm["code"]
            entry["condition"] = fm["condition"]
            entry["behavior"] = ls(fm["behavior"])
            fm_list.append(entry)
        doc["failure_modes"] = fm_list

    # Remaining prose
    sa = sections.get("Scaling Assumptions", "").strip()
    if sa:
        doc["scaling_assumptions"] = ls(sa)

    oos = sections.get("Out of Scope", "").strip()
    if oos:
        doc["out_of_scope"] = ls(oos)

    buf = io.StringIO()
    ryaml.dump(doc, buf)
    spec_yaml_out.write_text(buf.getvalue())
    print(f"  wrote  {spec_yaml_out.relative_to(cap_dir.parent.parent.parent) if cap_dir.parent.parent.parent.exists() else spec_yaml_out}")

    spec_md.unlink()
    req_yaml.unlink() if req_yaml.exists() else None
    print(f"  deleted SPEC.md + requirements.yaml")


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        sys.exit(1)

    for arg in sys.argv[1:]:
        cap_dir = Path(arg)
        if not cap_dir.is_dir():
            print(f"ERROR: not a directory: {cap_dir}", file=sys.stderr)
            continue
        print(f"Migrating {cap_dir.name}...")
        migrate(cap_dir)


if __name__ == "__main__":
    main()
