#!/usr/bin/env -S uv run --script
#
# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "networkx[pydot]>=3.6.1",
#     "pydot>=4.0.1",
# ]
# ///
import sys
import re
import subprocess
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

import networkx as nx
import pydot
from networkx.drawing import nx_pydot


@dataclass
class Node:
    id: str
    type: str  # 'plan', 'todo', 'scope', 'temp', 'anchor', 'at'
    label: str
    jj_id: Optional[str] = None

    def __repr__(self):
        return f"Node({self.id}, type={self.type}, label={self.label}, jj_id={self.jj_id})"


def parse_dot_file(dot_path: str) -> Tuple[nx.DiGraph, Dict[str, Node]]:
    """Parse DOT file and extract node metadata."""
    with open(dot_path) as f:
        dot_content = f.read()

    # Parse DOT with pydot and convert to networkx
    pydot_graphs = pydot.graph_from_dot_data(dot_content)
    if not pydot_graphs:
        raise ValueError("No graph found in DOT file")

    pydot_graph = pydot_graphs[0]
    G = nx_pydot.from_pydot(pydot_graph)

    nodes = {}
    for node_id in G.nodes():
        attrs = G.nodes[node_id]
        node_type = attrs.get('type', 'unknown')
        label = attrs.get('label', node_id)
        jj_id = attrs.get('jj_id')

        nodes[node_id] = Node(
            id=node_id,
            type=node_type,
            label=label,
            jj_id=jj_id,
        )

    return G, nodes


def load_anchor_map(anchor_map_path: str) -> Dict[str, str]:
    """Load anchor map file (format: node_id = revset)."""
    anchors = {}
    with open(anchor_map_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' not in line:
                continue
            node_id, revset = line.split('=', 1)
            anchors[node_id.strip()] = revset.strip()
    return anchors


def topological_sort_by_type(G: nx.DiGraph, nodes: Dict[str, Node]) -> List[str]:
    """
    Return node IDs in creation order: plans first, then scopes, then todos/temps.
    Within each group, maintain topological order.
    """
    # Separate nodes by type
    plan_nodes = [n for n in G.nodes() if nodes[n].type == 'plan']
    scope_nodes = [n for n in G.nodes() if nodes[n].type == 'scope']
    todo_temp_nodes = [n for n in G.nodes() if nodes[n].type in ('todo', 'temp')]
    anchor_nodes = [n for n in G.nodes() if nodes[n].type == 'anchor']
    at_nodes = [n for n in G.nodes() if nodes[n].type == 'at']

    # Within each group, maintain topological order
    result = []
    try:
        for group in [plan_nodes, scope_nodes, todo_temp_nodes]:
            subgraph = G.subgraph(group)
            result.extend(nx.topological_sort(subgraph))
    except nx.NetworkXError as e:
        print(f"Error: Graph is not a DAG (contains cycles): {e}", file=sys.stderr)
        sys.exit(1)

    # Anchors and 'at' nodes come last (they already exist)
    result.extend(anchor_nodes)
    result.extend(at_nodes)

    return result


def run_jj_command(cmd: List[str], dry_run: bool = False) -> Tuple[int, str]:
    """Run a jj command and return (returncode, output)."""
    if dry_run:
        print(f"[DRY RUN] {' '.join(cmd)}")
        return 0, ""

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
        )
        return result.returncode, result.stdout + result.stderr
    except Exception as e:
        return 1, str(e)


def get_change_id_from_description(description: str, dry_run: bool = False) -> Optional[str]:
    """Query jj for the change ID of a recently created change by description."""
    if dry_run:
        # In dry-run, generate a fake 8-char ID
        import hashlib
        h = hashlib.md5(description.encode()).hexdigest()
        return h[:8]

    cmd = [
        'jj', 'log',
        '-r', f'description(exact:"{description}") & (trunk()..@)',
        '--no-pager',
        '--no-graph',
        '--template', 'change_id.short(8) ++ "\\n"',
    ]
    code, output = run_jj_command(cmd, dry_run=False)
    if code != 0:
        return None
    lines = output.strip().split('\n')
    return lines[0] if lines and lines[0] else None


def build_jj_dag(
    G: nx.DiGraph,
    nodes: Dict[str, Node],
    anchor_map: Dict[str, str],
    dry_run: bool = False,
) -> Dict[str, str]:
    """
    Build the jj DAG by creating nodes in topological order.
    Returns mapping of node_id -> jj_id.
    """
    created_jj_ids = {}

    # Pre-populate anchors from anchor_map
    for node_id, jj_id in anchor_map.items():
        if node_id in nodes:
            created_jj_ids[node_id] = jj_id
            nodes[node_id].jj_id = jj_id

    creation_order = topological_sort_by_type(G, nodes)

    for node_id in creation_order:
        node = nodes[node_id]

        # Skip nodes that already exist (anchors, 'at')
        if node.type in ('anchor', 'at'):
            continue

        # Skip if already created
        if node_id in created_jj_ids:
            continue

        # Build jj new command
        prefix = node.type
        message = f"{prefix}: {node.label}"

        # Get parent nodes (predecessors in the graph)
        parents = list(G.predecessors(node_id))
        insert_after_flags = []
        for parent in parents:
            if parent in created_jj_ids:
                insert_after_flags.append('--insert-after')
                insert_after_flags.append(created_jj_ids[parent])
            elif parent in anchor_map:
                insert_after_flags.append('--insert-after')
                insert_after_flags.append(anchor_map[parent])

        # Get child nodes (successors in the graph)
        children = list(G.successors(node_id))
        insert_before_flags = []
        for child in children:
            if nodes[child].type == 'scope':
                # For scope children, we'll use their jj_id after they're created
                # For now, defer this
                pass
            elif nodes[child].type == 'at':
                insert_before_flags.append('--insert-before')
                insert_before_flags.append('@')

        # Simplistic approach: if no explicit insert_before, use '@'
        if not insert_before_flags:
            insert_before_flags = ['--insert-before', '@']

        # Build the full command
        cmd = ['jj', 'new', '--no-edit', '-m', message] + insert_after_flags + insert_before_flags

        # Run the command
        code, output = run_jj_command(cmd, dry_run=dry_run)
        if code != 0:
            print(f"Error creating {node_id}: {output}", file=sys.stderr)
            sys.exit(1)

        # Capture the change ID
        jj_id = get_change_id_from_description(message, dry_run=dry_run)
        if not jj_id:
            print(f"Warning: Could not determine jj_id for {node_id}", file=sys.stderr)
            jj_id = "?"
        else:
            created_jj_ids[node_id] = jj_id
            node.jj_id = jj_id
            print(f"✓ Created {node_id} ({prefix}): {jj_id}")

    return created_jj_ids


def verify_dag(dry_run: bool = False) -> str:
    """Verify the DAG by running jj log."""
    cmd = ['jj', 'log', '-r', 'trunk()..@', '--no-pager']
    code, output = run_jj_command(cmd, dry_run=dry_run)
    if code != 0:
        return f"Error: {output}"
    return output


def output_annotated_dot(nodes: Dict[str, Node], G: nx.DiGraph) -> str:
    """Generate DOT output with jj_id annotations."""
    lines = ['digraph {']
    for node_id in G.nodes():
        node = nodes[node_id]
        jj_id = node.jj_id or '?'
        lines.append(
            f'  {node_id} [type={node.type} label="{node.label}" jj_id="{jj_id}"]'
        )
    for src, dst in G.edges():
        lines.append(f'  {src} -> {dst}')
    lines.append('}')
    return '\n'.join(lines)


def check_jj_available() -> bool:
    """Check if jj command is available."""
    try:
        result = subprocess.run(['jj', '--version'], capture_output=True, text=True)
        return result.returncode == 0
    except FileNotFoundError:
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Convert a DOT digraph to a jj change DAG',
        epilog='Run with: uv run dot-to-jj-dag.py <dot_file> [--anchor-map <file>] [--dry-run]',
    )
    parser.add_argument('dot_file', help='Path to DOT file')
    parser.add_argument(
        '--anchor-map', help='Path to anchor map file (node_id = revset)'
    )
    parser.add_argument(
        '--dry-run', action='store_true', help='Print commands without running'
    )
    args = parser.parse_args()

    # Check jj availability (unless dry-run)
    if not args.dry_run and not check_jj_available():
        print(
            "Error: jj command not found.\n"
            "Please ensure jj (Jujutsu) is installed and in PATH.\n"
            "Visit: https://github.com/martinvonz/jj",
            file=sys.stderr,
        )
        sys.exit(1)

    # Parse DOT file
    try:
        G, nodes = parse_dot_file(args.dot_file)
    except Exception as e:
        print(f"Error parsing DOT file: {e}", file=sys.stderr)
        sys.exit(1)

    # Load anchor map
    anchor_map = {}
    if args.anchor_map:
        try:
            anchor_map = load_anchor_map(args.anchor_map)
        except Exception as e:
            print(f"Error loading anchor map: {e}", file=sys.stderr)
            sys.exit(1)

    # Build DAG
    created_ids = build_jj_dag(G, nodes, anchor_map, dry_run=args.dry_run)

    # Verify
    if not args.dry_run:
        print("\nVerification (jj log trunk()..@):")
        print(verify_dag(dry_run=False))

    # Output annotated DOT
    print("\nAnnotated DOT (with jj_id):")
    print(output_annotated_dot(nodes, G))

    print("\nDone!")


if __name__ == '__main__':
    main()
