---
name: file-organization
description: "**Codebase Cleanliness Standard**: Enforces clean file organization in any codebase. Before creating ANY file, classify it by intent—deliverables go to the project tree, working artifacts go to `/temporary/`. Before committing, review `git diff` to catch misplaced files. Use this skill whenever creating, moving, or committing files. Works with all languages and frameworks. The `/temporary/` folder is git-ignored so working artifacts never get merged. ALWAYS consult this skill when writing files to the repo—it prevents clutter from debug scripts, scratch analysis, throwaway tests, and other AI working artifacts from polluting the codebase."
compatibility: "Git required. Works with any language or framework."
---

## Core Principle

Every file you create has an **intent**. You always know why you're creating it. Use that knowledge.

- **"I'm creating this because the user asked for it / it solves the task"** → Project tree (root, src/, etc.)
- **"I'm creating this to help me work — debug, analyze, test an idea"** → `/temporary/`

This is not about file types or extensions. A `.test.js` file might be a critical part of the test suite, or it might be a throwaway script you wrote to check a theory. The difference is intent.

## Layer 1: Proactive — Decide at Creation Time

Before writing any file, run this mental check:

```
WHY am I creating this file?
│
├─ DELIVERABLE — The user asked for this, or it directly fulfills the task
│  Examples:
│  - "Add input validation" → validation.ts (deliverable)
│  - "Write unit tests for auth" → auth.test.ts (deliverable)
│  - "Create a migration for the new table" → 003_add_users.sql (deliverable)
│  - "Update the README" → README.md (deliverable)
│  → CREATE IN PROJECT TREE
│
└─ WORKING ARTIFACT — I need this to help me understand, debug, or explore
   Examples:
   - Script to reproduce a bug → debug-repro.py (working artifact)
   - Markdown notes analyzing the codebase → analysis.md (working artifact)
   - Quick test to verify an assumption → check-behavior.js (working artifact)
   - Output log from a test run → output.txt (working artifact)
   → CREATE IN /temporary/
```

The question is never "what type of file is this?" — it's **"does this file exist to serve the project, or to serve my working process?"**

## Layer 2: Reactive — Safety Net Before Commit

Before committing, review what you've changed. This catches anything that slipped through Layer 1.

```bash
git diff --name-only
git status
```

For each file in the diff, ask:

1. **Did the user's task require this file?** If no → move to `/temporary/`
2. **Does this file exist in the project already?** If yes, you're editing existing code — that's fine, leave it
3. **Is this a new file I created to help myself work?** If yes → move to `/temporary/`

### Example: "Fix the login bug"

```bash
$ git status
  modified:   src/auth/login.ts          # ← The actual fix. Commit this.
  new file:   debug-login.py             # ← Script I wrote to reproduce the bug. Move to /temporary/
  new file:   test-output.log            # ← Output from my debugging. Move to /temporary/
  modified:   src/auth/login.test.ts     # ← Updated existing test. Commit this.
```

After cleanup:
```bash
$ git status
  modified:   src/auth/login.ts          # ✅ commit
  modified:   src/auth/login.test.ts     # ✅ commit
```

The debug script and log are now safely in `/temporary/`, out of the commit.

### Example: "Add user validation with tests"

```bash
$ git status
  new file:   src/validation/validate.ts       # ← Deliverable. Commit.
  new file:   src/validation/validate.test.ts  # ← User asked for tests. Commit.
  new file:   scratch-regex-test.js            # ← I wrote this to test regex patterns. /temporary/
```

Notice how `validate.test.ts` stays because the user asked for tests — it's a deliverable. But `scratch-regex-test.js` was a working artifact.

## Language-Agnostic — Why Intent Beats File Types

Static file-type rules break across languages:

- Python's `__pycache__/` is already gitignored — don't touch it
- Java's `target/` is a build artifact — handled by existing `.gitignore`
- A Go `vendor/` directory might be intentionally committed
- Database migrations are generated but absolutely committed
- Protocol buffer outputs, GraphQL codegen — generated but part of the codebase
- `dist/` and `build/` directories vary by project

Trying to categorize by extension or directory name is fragile. Instead, the intent check works universally:

**"Did I create this to deliver the task, or to help myself work?"**

This one question works whether you're writing Python, TypeScript, Rust, Go, Java, C#, or anything else.

## Things That Are NEVER Working Artifacts

Don't accidentally move these to `/temporary/`:

- Existing files you modified (they're already tracked in git)
- Test suites the project already has (`tests/`, `__tests__/`, `spec/`)
- CI/CD configs (`.github/workflows/`, `Dockerfile`, etc.)
- Lock files (`package-lock.json`, `Cargo.lock`, `poetry.lock`)
- Migration files (database schema changes)
- Generated code that the project commits (codegen output, protobuf, etc.)
- Config files (`.eslintrc`, `tsconfig.json`, `pyproject.toml`)

If a file already exists in the git tree, it belongs there. Your job is only to route **new files you create** during your working process.

## Git Setup

Add `/temporary/` to `.gitignore` if it's not there already:

```gitignore
# AI/developer working artifacts (never commit)
/temporary/
```

This is a one-time setup. After this, anything in `/temporary/` is invisible to git.

## Quick Reference

```
BEFORE CREATING A FILE:
  "Is this a deliverable?"  → YES → project tree
                             → NO  → /temporary/

BEFORE COMMITTING:
  Run: git diff --name-only
  For each NEW file: "Did the task require this?" → NO → mv to /temporary/
  For MODIFIED files: leave them (they're already tracked)
```

## Why This Matters

Working artifacts in the root folder create real problems: teammates see debug scripts and think they're production code, CI might pick up stray test files, code review gets cluttered with irrelevant changes, and over time the repo becomes a mess of half-finished experiments mixed with real code.

The `/temporary/` folder gives you a safe space to work freely. Use it for anything and everything you need during your process — it never touches the git history and never confuses anyone.
