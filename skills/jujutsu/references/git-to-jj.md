# Git to Jujutsu Command Mapping

## Core Concept Differences

| Git Concept | Jujutsu Equivalent | Notes |
|-------------|-------------------|-------|
| Commit | Change | Stable change IDs persist across rewrites |
| Staging area (index) | Working copy commit | No staging; working copy is automatically tracked |
| HEAD | `@` | Current working copy change |
| Branch | Bookmark | Same purpose, different terminology |
| Detached HEAD | Normal state | Bookmarks are optional in jj |

## Repository Setup

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git init` | `jj git init` | Creates jj repo backed by git |
| `git clone <url>` | `jj git clone <url>` | Clones and sets up colocated git repo |
| | `jj git init --colocate` | Initialize jj in existing git repo |

## Daily Workflow

### Viewing Status

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git status` | `jj st` or `jj status` | Shows working copy changes |
| `git log` | `jj log` | Shows change history |
| `git log --oneline -10` | `jj log -r 'ancestors(@, 10)'` | Last 10 ancestors |
| `git diff` | `jj diff --git` | Uncommitted changes in working copy |
| `git diff HEAD~1` | `jj diff --git -r @-` | Diff of previous change |
| `git show <commit>` | `jj show <change-id>` | Show specific change |

### Creating Changes

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git add <file>` | (automatic) | Files tracked automatically |
| `git add -A` | (automatic) | All changes tracked automatically |
| `git commit -m "msg"` | `jj describe -m "msg"` | Describe current working copy |
| `git commit -a -m "msg"` | `jj commit -m "msg"` | Shorthand for `jj describe` + `jj new` |
| | `jj new` | Create new working copy change |

**Typical jj workflow:**
```bash
# Edit files
jj describe -m "Change description"   # Describe the change
jj new                                  # Start fresh working copy
# Or use the shorthand:
jj commit -m "Change description"       # Describe + start new change
```

### Branching

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git branch <name>` | `jj bookmark create <name>` | Create bookmark at current change |
| `git checkout <branch>` | `jj new <bookmark>` | Create new change as child of bookmark |
| `git checkout -b <name>` | `jj bookmark create <name>` then `jj new` | Create and start working |
| `git branch -d <name>` | `jj bookmark delete <name>` | Delete bookmark |
| `git branch -l` | `jj bookmark list` | List bookmarks |
| `git branch -f <name> <rev>` | `jj bookmark move <name> --to <rev>` | Move bookmark forward |
| | `jj bookmark move <name> --to <rev> --allow-backwards` | Move bookmark backward or sideways |

### Syncing with Remotes

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git fetch` | `jj git fetch` | Fetch remote changes |
| `git pull` | `jj git fetch` + `jj rebase -o <bookmark>@origin` | Fetch and rebase |
| `git push` | `jj git push` | Push bookmarks to remote |
| `git push -f` | `jj git push --force` | Force push (usually unnecessary) |
| `git push origin <branch>` | `jj git push --bookmark <bookmark>` | Push specific bookmark (auto-tracks on first push) |
| | `jj git push -c @` | Auto-create bookmark from change ID and push |
| | Set `[git.remote.origin]` `auto-track-bookmarks = true` in `.jj/repo/config.toml` | Optional: Configure automatic bookmark tracking |

### Rewriting History

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git commit --amend` | (automatic) | Working copy is always amended |
| `git rebase -i` | `jj split`, `jj squash`, `jj rebase` | Multiple focused commands |
| `git rebase main` | `jj rebase -o main` | Rebase current change |
| `git rebase -i HEAD~3` | `jj split`, `jj squash`, `jj edit` | Interactive editing |
| `git reset --soft HEAD~1` | `jj squash --from @-` | Move parent's diff into working copy |
| `git reset --hard HEAD~1` | `jj abandon @` | Abandon current change |
| `git reset --hard <commit>` | `jj new <change-id>` | Start new from specific change |

### Advanced Operations

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git cherry-pick <commit>` | `jj duplicate <change-id> -o <dest>` | Duplicate onto destination |
| `git stash` | `jj new @-` | Working copy remains as sibling; restore with `jj edit` |
| `git stash pop` | `jj edit <stashed-change>` or `jj undo` | Edit the stashed change or undo |
| `git reflog` | `jj op log` | Operation log |
| `git reset --hard @{1}` | `jj undo` or `jj op restore` | Undo operations |
| `git merge <branch>` | `jj new @ <bookmark>` | Create merge change with multiple parents |
| `git revert <commit>` | `jj revert -r <change-id> -B @` | Create inverse change before @ |

### Navigation

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git log --walk` | `jj next` | Move to next (child) change |
| | `jj prev` | Move to previous (parent) change |
| | `jj next --edit` | Move to child and set as working copy |
| | `jj prev --edit` | Move to parent and set as working copy |

### Conflict Resolution

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git merge` (creates conflicts) | `jj rebase` (creates conflict changes) | Conflicts are first-class |
| Edit conflict markers | `jj resolve` or edit markers | Interactive or manual |
| `git add <file>` (mark resolved) | (automatic) | Resolved when markers removed |
| `git merge --continue` | `jj describe` | Just describe the resolution |

### Viewing History

| Git | Jujutsu | Notes |
|-----|---------|-------|
| `git log --graph` | `jj log` | Graph by default |
| `git log --all` | `jj log -r 'all()'` | All changes |
| `git log main..feature` | `jj log -r 'main..feature'` | Range queries (ancestors of feature, not ancestors of main) |
| `git log --author="Name"` | `jj log -r 'author("Name")'` | Filter by author |
| `git blame <file>` | `jj file annotate <file>` | Show change per line |

## Revset Queries (Powerful!)

Jujutsu uses "revsets" for flexible queries:

```bash
# Current working copy
jj log -r '@'

# Parent of working copy
jj log -r '@-'

# All ancestors of working copy
jj log -r '::@'

# Ancestors up to 10 changes back
jj log -r 'ancestors(@, 10)'

# All changes in bookmark
jj log -r 'bookmark_name'

# Changes not in remote (two-dot range)
jj log -r 'trunk()..@'

# Changes by author
jj log -r 'author("alice")'

# Combine conditions
jj log -r 'author("alice") & ::@'
```

## Key Differences in Philosophy

1. **No staging area**: Jujutsu automatically tracks all changes. This means you can't selectively stage hunks before committing (use `jj split` instead).

2. **Working copy is a commit**: The working copy is always a commit, automatically amended as you edit. This eliminates the mental overhead of "staged vs unstaged vs committed."

3. **Change IDs are stable**: Unlike git commit hashes, jujutsu change IDs persist across rewrites. This makes rebasing and history editing much more intuitive.

4. **Conflicts as first-class objects**: Conflicts can exist in the repository history and be resolved later. You can even rebase conflicted changes.

5. **Operation log is your safety net**: Every jj operation is logged and reversible. Unlike git reflog, this includes all operations, not just branch updates.

6. **Bookmarks are optional**: You can work without bookmarks (branches). They're primarily for sharing with git remotes.

## Migration Tips

- **Start with colocated repos**: Use `jj git init --colocate` in existing git repos to try jj alongside git
- **Trust automatic tracking**: Stop thinking about `git add` - jj handles it
- **Use `jj new` frequently**: Create fresh working copies to separate concerns
- **Use `jj commit`**: Shorthand for `jj describe` + `jj new`, familiar to git users
- **Leverage `jj split`**: Replace git's interactive staging with post-hoc splitting
- **Try `jj absorb`**: Automatically distributes working copy edits to the appropriate ancestor commits
- **Explore revsets**: They're more powerful than git's revision syntax
- **Use `trunk()`**: Built-in alias that auto-detects your main branch
- **Check `jj op log`**: When in doubt, see what operations were run
- **`jj undo` is your friend**: Mistakes are cheap to undo
