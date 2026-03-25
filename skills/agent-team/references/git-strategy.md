# Git Strategy Reference

> On-demand reference from agent-team/SKILL.md. Read when setting up worktrees or performing git operations.

## Branch Model

```
main                                    ← production
└── sprint/S-01                         ← sprint branch (cut from main)
    ├── story/STORY-001-01-login        ← story branch (worktree)
    ├── story/STORY-001-02-auth         ← story branch (worktree)
    └── story/STORY-001-03-api          ← story branch (worktree)
```

## Sprint Commands

```bash
# Cut sprint branch
git checkout -b sprint/S-06 main

# Create story worktree
git worktree add .worktrees/STORY-001-01-login -b story/STORY-001-01-login sprint/S-06
mkdir -p .worktrees/STORY-001-01-login/.vbounce/{tasks,reports}

# List active worktrees
git worktree list

# Merge story into sprint
git checkout sprint/S-06
git merge story/STORY-001-01-login --no-ff -m "Merge STORY-001-01: {Story Name}"

# Remove worktree after merge
git worktree remove .worktrees/STORY-001-01-login
git branch -d story/STORY-001-01-login

# Merge sprint into main
git checkout main
git merge sprint/S-06 --no-ff -m "Sprint S-06: {Sprint Goal}"
git tag -a v{VERSION} -m "Release v{VERSION}"
```

## V-Bounce State → Git Operations

| V-Bounce State | Git Operation |
|---------------|---------------|
| Sprint starts | `git checkout -b sprint/S-XX main` |
| Ready to Bounce | `git worktree add .worktrees/STORY-{ID} -b story/STORY-{ID} sprint/S-XX` |
| Bouncing | All work happens inside `.worktrees/STORY-{ID}/` |
| Done | Merge story branch → sprint branch, `git worktree remove` |
| Sprint Review → Done | Merge sprint branch → main |
| Escalated | Worktree kept but frozen (no new commits) |
| Parking Lot | Worktree removed, branch preserved unmerged |
