# Revset Pitfalls

Full language: `jj help -k revsets --ignore-working-copy`. This file covers only the mistakes agents actually make. When running any example, add `--no-pager` (and `--no-graph -T ...` when parsing), per [SKILL.md](../SKILL.md).

## `..` vs `::`

| Revset | Meaning | Includes `x`? |
|---|---|---|
| `x..y` | Ancestors of `y` that are not ancestors of `x` (`::y ~ ::x`), like `git log x..y` | No |
| `x::y` | Descendants of `x` that are also ancestors of `y` (DAG path) | Yes |
| `x..` / `x::` | Everything not reachable from `x` / all descendants of `x` | No / Yes |

- "My unmerged work": `trunk()..@`. `trunk()::@` also includes the trunk commit itself.
- `x::y` is empty when `x` is not an ancestor of `y`; `x..y` is not. Check before feeding either to a rewrite.
- Rebase a whole stack by its roots: `jj rebase -s 'all:roots(trunk()..@)' -o 'trunk()'`.

## `trunk()` resolution and override

`trunk()` resolves to the default remote's default bookmark (recorded at repo init), else `main`/`master`/`trunk` on `upstream`/`origin`. **If none exist it silently evaluates to `root()`**, so `trunk()..@` becomes "all history" and `immutable_heads()` stops protecting anything useful. Check it first:

```bash
jj log --ignore-working-copy --no-pager -r 'trunk()' --no-graph -T 'bookmarks ++ " " ++ change_id.short(8) ++ "\n"'
```

If it is wrong (no remote, a `develop` mainline, a fork), override per repo rather than hard-coding a bookmark everywhere:

```toml
# .jj/repo/config.toml (or `jj config edit --repo`, which opens an editor — have the user run it)
[revset-aliases]
'trunk()' = 'develop@origin'
```

## `description()` is a whole-string glob, not a substring search

String arguments default to `glob:` (jj 0.45), matched against the **entire** value. Descriptions end with `\n`, so `description("fix bug")` matches nothing useful.

| Want | Use |
|---|---|
| Contains text | `description(substring:"fix bug")` or `description(glob:"*fix bug*")` |
| Exact title | `subject(exact:"fix(api): handle 404")` |
| Case-insensitive | `description(substring-i:"fix bug")` |

The same applies to `author()`, `committer()` and `bookmarks()`: `author("alice")` does not match `alice@example.com`; use `author(substring:"alice")`.

Never consolidate or abandon by a repo-wide description search — titles collide across runs and agents. Target change ids you recorded (see safety rule 7 in [SKILL.md](../SKILL.md)).

## Smaller traps

- `jj log -r 3` is a change-id prefix lookup, not "last 3"; use `ancestors(@, 3)`.
- `~` is set difference (`::@ ~ ::main`); `-` is parent (`@-`).
- Dates go inside date functions: `author_date(after:"1 week ago")`, not `after(...)`.
- Test any revset with `jj log -r` before passing it to `rebase`, `squash`, or `abandon`.
