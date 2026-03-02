# .gitignore Template for File Organization Standard

Add this to your `./.gitignore` file to ensure `/temporary/` never gets committed:

```gitignore
# ============================================
# Local temporary work (NEVER commit)
# ============================================
/temporary/
```

## Why This Matters

The `/temporary/` folder is where agents and developers place all working files that won't be part of the final codebase:
- Debug scripts
- Test experiments
- Analysis documents
- Exploration code
- Generated output

By adding `/temporary/` to `.gitignore`, you ensure:
1. ✅ No clutter in git history
2. ✅ Team members only see production code in the repository
3. ✅ Safe space for experimentation without affecting commits
4. ✅ Reduced cognitive load when browsing the codebase

## Installation

If you don't have a `.gitignore` file yet:
1. Create a new file called `.gitignore` in the root of your repository
2. Add the entry above
3. Commit it: `git add .gitignore && git commit -m "Add temporary folder to gitignore"`

If you already have a `.gitignore`:
1. Open it
2. Add the entry above (preferably in a section labeled "Local temporary work")
3. Commit the change

## Verification

To verify the setup is correct:
```bash
# This should NOT list any files from /temporary/
git status

# This should show that /temporary/ is ignored
git check-ignore -v /temporary/something.txt
```

If `/temporary/` files are appearing in `git status`, double-check that:
- The `.gitignore` entry is spelled correctly (case-sensitive on Linux/Mac)
- The file is committed (not just created but not staged)
- You haven't accidentally added `/temporary/` files with `git add -f`
