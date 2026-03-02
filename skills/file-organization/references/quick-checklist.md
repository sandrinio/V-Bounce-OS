# File Organization Quick Checklist

## At File Creation Time

```
WHY am I creating this file?
│
├─ DELIVERABLE (serves the project / user asked for it)
│  → Create in project tree
│
└─ WORKING ARTIFACT (helps me debug / analyze / explore)
   → Create in /temporary/
```

## Before Committing

```bash
git diff --name-only
git status
```

For each file:

| Question | Answer | Action |
|----------|--------|--------|
| Did the user's task require this file? | Yes | Commit |
| Is this an existing file I modified? | Yes | Commit |
| Did I create this to help myself work? | Yes | Move to /temporary/ |
| Not sure? | — | Move to /temporary/ (safer) |

## Never Move These to /temporary/

- Existing tracked files you edited
- Project test suites (`tests/`, `__tests__/`, `spec/`)
- CI/CD configs (`.github/workflows/`, `Dockerfile`)
- Lock files (`package-lock.json`, `Cargo.lock`)
- Migration files
- Generated code the project commits (protobuf, codegen)
- Config files (`.eslintrc`, `tsconfig.json`, etc.)

## Common Working Artifacts (Always /temporary/)

- Debug/repro scripts you wrote to investigate
- Analysis or exploration markdown
- Scratch files testing an idea
- Console output or logs you captured
- Experimental code trying different approaches
- Notes and drafts that aren't official docs
