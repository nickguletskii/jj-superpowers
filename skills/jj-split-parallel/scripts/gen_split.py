#!/usr/bin/env python3
"""
Execute a jj parallel split from a config file.

Usage:
  gen_split.py <config.json>

Modes:
  file  — split by file path patterns
  hunk  — split by jj-hunk specs

Config (file mode):
  {
    "rev": "<full-change-id>",
    "mode": "file",
    "files_txt": "<path to jj diff --summary output>",
    "session_dir": "<path for temp spec files>",
    "groups": [
      {"message": "feat: group one", "patterns": ["^src/one/", "^lib/\\\\.rs$"]},
      {"message": "chore: remaining"}
    ]
  }

Config (hunk mode):
  {
    "rev": "<full-change-id>",
    "mode": "hunk",
    "session_dir": "<path for temp spec files>",
    "groups": [
      {
        "message": "feat: group one",
        "spec": {"files": {"src/a.rs": {"hunks": [0, 2]}}, "default": "keep"}
      },
      {"message": "chore: remaining"}
    ]
  }

Rules:
  - Last group (no "patterns" or "spec") receives jj describe, not jj split.
  - Groups are matched in order; first match wins (file mode).
  - Patterns match the destination path (handles renames correctly).
  - Renamed files: both src and dst paths are passed to jj split.
  - Paths containing $ or " are double-quoted in jj fileset syntax.
  - On any jj failure, jj undo is run automatically before exiting.
"""

import json, os, re, subprocess, sys


# ---------------------------------------------------------------------------
# jj wrapper
# ---------------------------------------------------------------------------

def jj(*args, env_extra=None):
    """
    Run jj with args. Prints combined output. On non-zero exit, runs
    jj undo to roll back the last operation and exits with code 1.
    Returns combined stdout+stderr as a string.
    """
    env = {**os.environ, **(env_extra or {})}
    result = subprocess.run(['jj', '--no-pager', *args], capture_output=True, text=True, env=env)
    combined = result.stdout + result.stderr
    print(combined, end='')
    if result.returncode != 0:
        print(f"\nERROR: `jj {' '.join(args)}` exited {result.returncode}", file=sys.stderr)
        print("Running `jj undo` to roll back last operation...", file=sys.stderr)
        print("(If the undo was not needed, run `jj redo` to recover.)", file=sys.stderr)
        subprocess.run(['jj', '--no-pager', 'undo'], check=False)
        sys.exit(1)
    return combined


# ---------------------------------------------------------------------------
# Split helper — always captures the new remaining change ID
# ---------------------------------------------------------------------------

def _extract_remaining(output):
    for line in output.splitlines():
        if line.startswith('Remaining changes:'):
            parts = line.split()
            if len(parts) >= 3:
                return parts[2]
    return None


def split_off_files(rev, msg, paths):
    """
    Split file paths off rev as a new parallel sibling.
    Returns new remaining change ID.
    """
    out = jj('split', '-r', rev, '--parallel', '-m', msg, '--', *paths)
    return _extract_remaining(out) or rev


def split_off_hunks(rev, msg, spec, spec_path):
    """
    Split hunks off rev using a jj-hunk spec file.
    Returns new remaining change ID.
    """
    with open(spec_path, 'w') as f:
        json.dump(spec, f, indent=2)
    out = jj('split', '-r', rev, '--parallel', '--tool=jj-hunk', '-m', msg,
             env_extra={'JJ_HUNK_SELECTION': spec_path})
    return _extract_remaining(out) or rev


# ---------------------------------------------------------------------------
# File-mode helpers
# ---------------------------------------------------------------------------

def _parse_rename(line):
    """Parse 'R path/{old => new}/rest' into (src, dst)."""
    path = line[2:]
    m = re.search(r'\{([^}]*) => ([^}]*)\}', path)
    if m:
        pre, suf = path[:m.start()], path[m.end():]
        return (pre + m.group(1) + suf).strip('/'), (pre + m.group(2) + suf).strip('/')
    return path.strip(), path.strip()


def read_pairs(files_txt):
    """Return list of (src, dst) from jj diff --summary output."""
    pairs = []
    with open(files_txt) as f:
        for line in f:
            line = line.rstrip()
            if not line:
                continue
            if line.startswith('R '):
                pairs.append(_parse_rename(line))
            elif ' ' in line:
                _, path = line.split(' ', 1)
                pairs.append((path, path))
    return pairs


def _jj_quote(p):
    """
    Quote a path for jj's fileset syntax.
    Paths with $ or " need jj-level double-quoting because jj's fileset
    parser treats $ as a special character.
    """
    if '$' in p or '"' in p:
        return '"' + p.replace('\\', '\\\\').replace('"', '\\"') + '"'
    return p


def assign_to_groups(split_groups, pairs):
    """Assign (src, dst) pairs to groups by regex pattern on dst."""
    group_paths = [[] for _ in split_groups]
    for src, dst in pairs:
        for i, g in enumerate(split_groups):
            if any(re.match(pat, dst) for pat in g['patterns']):
                for p in ([dst] if src == dst else [src, dst]):
                    jq = _jj_quote(p)
                    if jq not in group_paths[i]:
                        group_paths[i].append(jq)
                break
    return group_paths


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    with open(sys.argv[1]) as f:
        cfg = json.load(f)

    rev = cfg['rev']
    mode = cfg.get('mode', 'file')
    session_dir = cfg.get('session_dir', os.path.dirname(os.path.abspath(sys.argv[1])))
    groups = cfg['groups']

    split_groups = [g for g in groups if 'patterns' in g or 'spec' in g]
    last_group = next((g for g in groups if 'patterns' not in g and 'spec' not in g), None)

    if mode == 'file':
        pairs = read_pairs(cfg['files_txt'])
        group_paths = assign_to_groups(split_groups, pairs)

        for i, g in enumerate(split_groups):
            paths = group_paths[i]
            if not paths:
                print(f"WARNING: group {i+1} '{g['message']}' matched no files", file=sys.stderr)
                continue
            print(f"\n==> Group {i+1}: {g['message']} ({len(paths)} paths)")
            rev = split_off_files(rev, g['message'], paths)

    elif mode == 'hunk':
        for i, g in enumerate(split_groups):
            print(f"\n==> Group {i+1}: {g['message']}")
            spec_path = os.path.join(session_dir, f'spec_{i+1:02d}.json')
            rev = split_off_hunks(rev, g['message'], g['spec'], spec_path)

    else:
        print(f"Unknown mode: {mode!r}", file=sys.stderr)
        sys.exit(1)

    if last_group:
        print(f"\n==> Describing remaining: {last_group['message']}")
        jj('describe', '-r', rev, '-m', last_group['message'])

    print("\nDone.")


if __name__ == '__main__':
    main()
