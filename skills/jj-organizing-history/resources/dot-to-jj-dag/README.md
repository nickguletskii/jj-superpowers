# dot-to-jj-dag.py

Utility script for creating jj change DAGs from DOT graph specifications. This is tool documentation, not a discoverable skill.

Run with `uv`:

```bash
uv run skills/jj-organizing-history/resources/dot-to-jj-dag/dot-to-jj-dag.py <dot_file> --anchor-map <anchor_map_file>
```

Useful options:

- `--dry-run` prints commands without executing them.
- `--anchor-map <file>` maps anchor node ids to jj revsets such as `trunk = trunk()`.

The script parses DOT nodes with `type` values such as `plan`, `todo`, `scope`, `temp`, `anchor`, and `at`, creates the jj changes, and prints annotated DOT with assigned `jj_id` values.
