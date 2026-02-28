# PR Review Mode

Analyze only the changed files in a PR or git diff. This is the scalable daily-driver — it runs on every merge and catches problems before they enter the main branch.

## When to Use

- User wants to review a PR before merging
- User has a set of changed files to evaluate
- User asks "is this diff safe to merge?"
- Continuous integration / pre-merge quality gate

## Input

The user should provide one of:
- A branch name to compare against main/master
- A commit range
- A set of files to review

If no input is given, default to:
```bash
git diff main...HEAD
```

## Steps

### 1. Identify Changed Files

```bash
# Get list of changed files (excluding generated/config)
CHANGED=$(git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD~1)
echo "$CHANGED" | grep -v "package-lock.json\|yarn.lock\|.lock$\|node_modules\|dist/\|build/" 

echo ""
echo "=== Change Summary ==="
echo "Files changed: $(echo "$CHANGED" | wc -l)"
echo "Insertions/Deletions:"
git diff --stat main...HEAD 2>/dev/null || git diff --stat HEAD~1
```

Flag if a PR touches more than 15 files across more than 5 directories — this is a coupling red flag.

### 2. Complexity Delta

For each changed file, measure complexity before and after:

```bash
# For JavaScript/TypeScript — install if needed
npm list -g cr 2>/dev/null || npm install -g complexity-report

# Analyze only changed source files
for file in $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx|js|jsx)$' | grep -v node_modules); do
  if [ -f "$file" ]; then
    echo "=== $file ==="
    cr "$file" 2>/dev/null || npx cr "$file" 2>/dev/null || echo "  (complexity-report not available, skipping)"
  fi
done
```

Alternative approach if cr is not available — count nesting depth as a proxy for complexity:

```bash
for file in $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx|js|jsx|py)$' | grep -v node_modules); do
  if [ -f "$file" ]; then
    MAX_INDENT=$(cat "$file" | sed 's/[^ \t].*//' | awk '{print length}' | sort -rn | head -1)
    LINES=$(wc -l < "$file")
    echo "$file — $LINES lines, max indent: $MAX_INDENT spaces"
    if [ "$MAX_INDENT" -gt 20 ]; then
      echo "  ⚠️  Deep nesting detected — likely complex logic"
    fi
  fi
done
```

### 3. Duplication Check Against Existing Code

This is the most important check for AI-generated code. The agent writing new code may not know what already exists.

```bash
# Install jscpd if not available
npx jscpd --version 2>/dev/null || npm install -g jscpd

# Run duplication detection focused on changed files
# Create a temp file with changed file list
git diff --name-only main...HEAD | grep -E '\.(ts|tsx|js|jsx|py)$' | grep -v node_modules > /tmp/changed_files.txt

# Run jscpd on the whole project but focus report on matches involving changed files
npx jscpd . \
  --min-lines 5 \
  --min-tokens 50 \
  --reporters "console" \
  --ignore "node_modules,dist,build,.next,__pycache__,coverage" \
  2>/dev/null || echo "jscpd not available — manual duplication check needed"
```

If jscpd is not available, do a manual heuristic check:

```bash
# Find function names in changed files and check if they exist elsewhere
for file in $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx|js|jsx)$'); do
  FUNCS=$(grep -oE '(function|const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)' "$file" | awk '{print $2}')
  for func in $FUNCS; do
    MATCHES=$(grep -rl "$func" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . \
      | grep -v node_modules | grep -v "$file" | head -3)
    if [ -n "$MATCHES" ]; then
      echo "⚠️  '$func' in $file also appears in:"
      echo "   $MATCHES"
    fi
  done
done
```

### 4. New Dependency Audit

```bash
# Check if package.json was modified
if git diff --name-only main...HEAD | grep -q "package.json"; then
  echo "=== New Dependencies ==="
  # Show what was added to dependencies
  git diff main...HEAD -- package.json | grep "^+" | grep -v "^+++" | grep -E '"[^"]+":' | head -20
  
  echo ""
  echo "=== Dependency diff ==="
  # Count before and after
  BEFORE=$(git show main:package.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('dependencies',{})))" 2>/dev/null || echo "?")
  AFTER=$(cat package.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('dependencies',{})))")
  echo "Dependencies before: $BEFORE → after: $AFTER"
fi

# Same for Python
if git diff --name-only main...HEAD | grep -q "requirements.txt"; then
  echo "=== New Python Dependencies ==="
  git diff main...HEAD -- requirements.txt | grep "^+" | grep -v "^+++"
fi
```

For each new dependency, ask: Is this necessary? Does the project already have something that does the same thing?

### 5. Error Handling Audit on Diff

```bash
echo "=== Error handling in changed code ==="

# Get the actual diff content
DIFF=$(git diff main...HEAD -- $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx|js|jsx|py)$' | grep -v node_modules))

# Check for empty catch blocks in new code
echo "$DIFF" | grep "^+" | grep -E "catch.*\{" -A 2 | grep -E "^\+\s*\}" | head -10
if [ $? -eq 0 ]; then
  echo "🔴 Empty catch blocks found in new code"
fi

# Check for console.log-only error handling
echo "$DIFF" | grep "^+" | grep -B1 -A3 "catch" | grep "console\.\(log\|error\)" | head -10
if [ $? -eq 0 ]; then
  echo "🟡 Console-only error handling in new code"
fi

# Check for TODO/FIXME in new code
echo "$DIFF" | grep "^+" | grep -i "TODO\|FIXME\|HACK\|XXX" | head -10
if [ $? -eq 0 ]; then
  echo "🟡 TODO/FIXME markers in new code — unfinished work"
fi

# Check for missing null/undefined checks on new function params
echo "$DIFF" | grep "^+" | grep -E "function|=>\s*\{" | head -10
echo "(Review above functions for parameter validation)"
```

### 6. Test Coverage for Changed Files

```bash
echo "=== Test coverage for changed files ==="

for file in $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx|js|jsx)$' | grep -v node_modules | grep -v test | grep -v spec); do
  BASENAME=$(basename "$file" | sed 's/\.\(ts\|tsx\|js\|jsx\)$//')
  TEST_EXISTS=$(find . -name "${BASENAME}.test.*" -o -name "${BASENAME}.spec.*" | grep -v node_modules | head -1)
  
  if [ -n "$TEST_EXISTS" ]; then
    # Check if test file was also updated
    if echo "$CHANGED" | grep -q "$TEST_EXISTS"; then
      echo "🟢 $file — test exists AND was updated"
    else
      echo "🟡 $file — test exists but was NOT updated with this change"
    fi
  else
    echo "🔴 $file — no corresponding test file found"
  fi
done
```

### 7. Coupling Analysis

```bash
echo "=== Cross-module impact ==="

# Count how many different directories the PR touches
DIRS=$(git diff --name-only main...HEAD | grep -v node_modules | xargs -I{} dirname {} | sort -u)
DIR_COUNT=$(echo "$DIRS" | wc -l)
echo "Directories touched: $DIR_COUNT"
echo "$DIRS"

if [ "$DIR_COUNT" -gt 5 ]; then
  echo "🔴 High cross-module impact — this PR reaches across $DIR_COUNT directories"
  echo "   Consider breaking into smaller, focused PRs"
elif [ "$DIR_COUNT" -gt 3 ]; then
  echo "🟡 Moderate cross-module impact"
else
  echo "🟢 Focused change"
fi

echo ""
echo "=== Import analysis on changed files ==="
# Show what each changed file imports
for file in $(git diff --name-only main...HEAD | grep -E '\.(ts|tsx|js|jsx)$' | grep -v node_modules); do
  if [ -f "$file" ]; then
    IMPORTS=$(grep "^import" "$file" | wc -l)
    echo "$file — $IMPORTS imports"
    if [ "$IMPORTS" -gt 15 ]; then
      echo "  ⚠️  High import count — potential coupling issue"
    fi
  fi
done
```

## Report Output

Use `references/report-template.md` with the **PR Review** section. The report must answer one clear question: **"Is this safe to merge?"**

Verdict options:
- ✅ **Ship it** — No blocking issues found
- ⚠️ **Ship with notes** — Minor issues documented, merge is OK but address soon
- 🛑 **Hold** — Blocking issues that should be fixed before merge

Include the specific files and line references for each finding.
