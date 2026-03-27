# Revsets: Querying Changes

Revsets are jujutsu's powerful query language for specifying sets of changes. They're used with many commands like `jj log`, `jj diff`, `jj rebase`, etc.

## Basic Symbols

| Revset | Meaning |
|--------|---------|
| `@` | Current working copy change |
| `@-` | Parent of working copy |
| `@+` | Child of working copy (if unambiguous) |
| `@--` | Grandparent of working copy |

## Functions

### Location-Based

```bash
# Specific change by ID (prefix is enough)
abc123

# Root change of repository
root()

# All changes
all()

# Visible changes (excludes abandoned)
visible()

# Auto-detected main branch (tries main, master, trunk on origin/upstream)
trunk()
```

### Ancestry

```bash
# All ancestors of @ (including @)
::@

# Ancestors up to N generations back
ancestors(@, 10)

# All descendants of a change
<change-id>::

# Range: ancestors of @ but not of main (two-dot operator)
main..@

# DAG range: descendants of main that are also ancestors of @ (includes both endpoints)
main::@
```

### Bookmarks (Branches)

```bash
# Changes in a bookmark
bookmark_name
main
feature-x

# Remote bookmark
main@origin
feature-x@origin

# All bookmarks
bookmarks()

# All remote bookmarks
remote_bookmarks()
```

### Filtering

```bash
# Changes by author
author("alice")
author("alice@example.com")

# Your own changes (matches current user's email)
mine()

# Changes by committer
committer("bob")

# Changes with description matching pattern
description("fix bug")

# Empty changes (no diff from parent)
empty()

# Changes with conflicts
conflicts()

# Changes by date (use author_date/committer_date with date patterns)
author_date(after:"2024-01-01")
author_date(before:"1 week ago")
committer_date(after:"2 days ago")
```

## Operators

### Set Operations

```bash
# Union: changes in A or B
A | B

# Intersection: changes in both A and B
A & B

# Difference: changes in A but not in B
A ~ B

# Example: your changes not yet in main
trunk()..@
```

### Ancestry Operators

```bash
# All ancestors of @ (inclusive)
::@

# All descendants of a change (inclusive)
<change-id>::

# DAG range: descendants of x that are ancestors of y (inclusive both endpoints)
x::y

# Two-dot range: ancestors of y that are NOT ancestors of x (excludes x, includes y)
x..y

# Not ancestors of x (everything after x)
x..

# Ancestors of x excluding root (everything before x)
..x

# Equivalent to set difference: x..y == ::y ~ ::x
# Equivalent to DAG path: x::y == x:: & ::y
```

### Parents and Children

```bash
# Parents of @
@-

# Children of a change (may be multiple)
<change-id>+

# All ancestors of @ up to 5 generations
ancestors(@, 5)

# All descendants of a change
descendants(<change-id>)
```

## Practical Examples

### Viewing Your Work

```bash
# Recent changes in working copy ancestry
jj log -r 'ancestors(@, 10)'

# All your changes not in main
jj log -r 'trunk()..@'

# Your changes by author
jj log -r 'mine()'

# Changes you've created recently
jj log -r 'mine() & author_date(after:"1 day ago")'
```

### Working with Stacks

```bash
# All changes from main to working copy (DAG range, inclusive)
jj log -r 'trunk()::@'

# Changes in current stack not in main (two-dot range)
jj log -r 'trunk()..@'

# Show all bookmarks in your stack
jj log -r 'bookmarks() & ::@'
```

### Finding Specific Changes

```bash
# Changes with "refactor" in description
jj log -r 'description("refactor")'

# Empty changes (candidates for abandoning)
jj log -r 'empty()'

# Conflicted changes
jj log -r 'conflicts()'

# Changes in feature branch but not in main
jj log -r 'main..feature-x'
```

### Rebasing with Revsets

```bash
# Rebase all changes from trunk to current onto updated trunk
jj rebase -s 'all:roots(trunk()..@)' -o trunk()

# Rebase specific change and descendants onto new base
jj rebase -s <change-id> -o <new-base>

# Rebase everything after a specific change
jj rebase -s '<change-id>::@' -o <new-base>
```

### Comparing Changes

```bash
# Diff between two changes
jj diff -r '<change-1>::<change-2>'

# Diff of specific change
jj diff -r <change-id>

# Show all changes in a range
jj show -r 'main::@'
```

## Complex Queries

### Combining Conditions

```bash
# Your changes with "bug" in description
jj log -r 'mine() & description("bug")'

# Changes by alice or bob
jj log -r 'author("alice") | author("bob")'

# Changes in feature branch but not in main or develop
jj log -r '(main | develop)..feature'

# Non-empty changes by you not in main
jj log -r 'mine() & ~empty() & trunk()..@'
```

### Date-Based Queries

```bash
# Changes after a date
jj log -r 'author_date(after:"2024-01-01")'

# Changes in last week
jj log -r 'author_date(after:"1 week ago")'

# Changes between dates
jj log -r 'author_date(after:"2024-01-01") & author_date(before:"2024-02-01")'

# Changes today
jj log -r 'author_date(after:"yesterday")'
```

### Bookmark Queries

```bash
# All changes in feature branches (excluding main)
jj log -r 'bookmarks() ~ trunk()'

# Local bookmarks not pushed (commits not on any remote)
jj log -r 'remote_bookmarks()..'

# Commits not on a specific remote
jj log -r 'remote_bookmarks(remote=origin)..'
```

## Template Expressions

Customize output format using templates:

```bash
# Custom log format
jj log -r '::@' -T 'change_id ++ " " ++ description'

# Show author and description
jj log -T 'author.name() ++ ": " ++ description.first_line()'

# Show bookmark names
jj log -T 'bookmarks ++ " " ++ description.first_line()'
```

## Revset Best Practices

1. **Use `trunk()..@` for "my work"**: Shows changes not yet merged to main
2. **Use `::@` for full ancestry**: Shows all ancestors of working copy
3. **Use `mine()`**: Filters to your own changes by email
4. **Use `trunk()`**: Auto-detects main/master/trunk branch
5. **Use prefixes for change IDs**: `abc` instead of full `abc123def456...`
6. **Test revsets with `jj log -r`**: Verify your query before using in destructive operations
7. **Know the difference**: `x..y` = ancestors of y minus ancestors of x; `x::y` = DAG path from x to y
8. **Remember operators**: `|` (or), `&` (and), `~` (not) for combining conditions

## Common Mistakes

❌ **Don't confuse `..` with `::`**
- `x..y` = ancestors of y that are NOT ancestors of x (like `git log x..y`)
- `x::y` = DAG path: descendants of x that are ancestors of y (inclusive both endpoints)
✅ `main..@` for "my unmerged changes" (excludes main, like git)
✅ `main::@` for "path from main to @" (includes main)

❌ **Don't use `@..@-`**: Use `@` or `@-` directly
✅ **Use**: `jj diff -r @` or `jj diff -r @-`

❌ **Don't confuse `~` (set difference) with `-` (parent)**
✅ **Set difference**: `trunk()..@` or `::@ ~ ::main`
✅ **Parent**: `@-`

❌ **Don't use bare numbers**: `jj log -r 3` doesn't mean "last 3 changes"
✅ **Use**: `jj log -r 'ancestors(@, 3)'`

❌ **Don't use `after()` / `before()` as standalone functions**
✅ **Use**: `author_date(after:"1 week ago")` (date patterns go inside date functions)

## Built-in Aliases

These are defined as aliases and can be overridden in config:

| Alias | Meaning |
|-------|---------|
| `trunk()` | Head of default bookmark (main/master/trunk) on origin/upstream |
| `mine()` | Commits where author email matches current user |
| `visible()` | All visible commits (`::visible_heads()`) |
| `hidden()` | All hidden commits (`~visible()`) |
| `mutable()` | Commits that jj treats as mutable (`~immutable()`) |
| `immutable()` | Commits that jj treats as immutable (`::(immutable_heads() \| root())`) |
| `immutable_heads()` | `trunk() \| tags() \| untracked_remote_bookmarks()` |

Override `trunk()` in config if your main branch has a different name:
```toml
[revset-aliases]
'trunk()' = 'your-bookmark@your-remote'
```

## Quick Reference

```bash
# Where am I?
jj log -r '@'

# Recent history
jj log -r 'ancestors(@, 10)'

# All my unmerged changes
jj log -r 'trunk()..@'

# What needs pushing?
jj log -r 'remote_bookmarks()..'

# Find conflicted changes
jj log -r 'conflicts()'

# Empty changes to clean up
jj log -r 'empty()'

# Changes in stack with bookmarks
jj log -r 'bookmarks() & ::@'

# My changes only
jj log -r 'mine()'
```
