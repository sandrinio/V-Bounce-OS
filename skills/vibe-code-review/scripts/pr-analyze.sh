#!/bin/bash
# pr-analyze.sh — Analyze a git diff for code quality issues
# Usage: bash scripts/pr-analyze.sh [base-branch]
#
# Defaults to comparing against 'main'. Pass a different branch name if needed.
# Outputs a markdown report to stdout.

set -e

BASE="${1:-main}"
REPORT=""

add() { REPORT="$REPORT$1\n"; }

add "# 🔍 PR Review Report"
add ""
add "**Date:** $(date +%Y-%m-%d)"
add "**Comparing:** \`$BASE...HEAD\`"
add ""

# Get changed files
CHANGED=$(git diff --name-only "$BASE"...HEAD 2>/dev/null || git diff --name-only HEAD~1)
SOURCE_CHANGED=$(echo "$CHANGED" | grep -E '\.(ts|tsx|js|jsx|py|go|rs)$' | grep -v node_modules || true)
FILE_COUNT=$(echo "$CHANGED" | grep -v "^$" | wc -l | tr -d ' ')
DIR_COUNT=$(echo "$CHANGED" | grep -v "^$" | xargs -I{} dirname {} 2>/dev/null | sort -u | wc -l | tr -d ' ')

add "## Change Summary"
add ""
add "- **Files changed:** $FILE_COUNT"
add "- **Directories touched:** $DIR_COUNT"
add "- **Source files in diff:** $(echo "$SOURCE_CHANGED" | grep -v "^$" | wc -l | tr -d ' ')"
add ""

# Stats
STATS=$(git diff --stat "$BASE"...HEAD 2>/dev/null || git diff --stat HEAD~1)
add "\`\`\`"
add "$STATS"
add "\`\`\`"
add ""

# Cross-module impact
if [ "$DIR_COUNT" -gt 5 ]; then
  add "### 🔴 High Cross-Module Impact"
  add ""
  add "This PR touches $DIR_COUNT directories. Consider breaking into smaller, focused PRs."
  add ""
elif [ "$DIR_COUNT" -gt 3 ]; then
  add "### 🟡 Moderate Cross-Module Impact"
  add ""
  add "This PR touches $DIR_COUNT directories."
  add ""
fi

add "## Findings"
add ""

# Check for new dependencies
if echo "$CHANGED" | grep -q "package.json"; then
  NEW_DEPS=$(git diff "$BASE"...HEAD -- package.json 2>/dev/null | grep "^+" | grep -v "^+++" | grep -E '"[^"]+":' || true)
  if [ -n "$NEW_DEPS" ]; then
    add "### 🟡 New Dependencies Detected"
    add ""
    add "\`\`\`"
    add "$NEW_DEPS"
    add "\`\`\`"
    add ""
    add "**What this means:** Every new dependency is a future maintenance burden and potential security risk. Verify each is necessary."
    add ""
  fi
fi

if echo "$CHANGED" | grep -q "requirements.txt"; then
  NEW_PY_DEPS=$(git diff "$BASE"...HEAD -- requirements.txt 2>/dev/null | grep "^+" | grep -v "^+++" || true)
  if [ -n "$NEW_PY_DEPS" ]; then
    add "### 🟡 New Python Dependencies"
    add ""
    add "\`\`\`"
    add "$NEW_PY_DEPS"
    add "\`\`\`"
    add ""
  fi
fi

# Error handling in diff
DIFF_CONTENT=$(git diff "$BASE"...HEAD -- $SOURCE_CHANGED 2>/dev/null || true)
EMPTY_CATCHES=$(echo "$DIFF_CONTENT" | grep "^+" | grep -E "catch.*\{" -A 2 | grep -c "^\+\s*\}" 2>/dev/null || echo "0")
CONSOLE_CATCHES=$(echo "$DIFF_CONTENT" | grep "^+" | grep -B1 -A3 "catch" | grep -c "console\.\(log\|error\)" 2>/dev/null || echo "0")
NEW_TODOS=$(echo "$DIFF_CONTENT" | grep "^+" | grep -ci "TODO\|FIXME\|HACK\|XXX" 2>/dev/null || echo "0")

if [ "$EMPTY_CATCHES" -gt 0 ]; then
  add "### 🔴 Empty Catch Blocks in New Code"
  add ""
  add "Found **$EMPTY_CATCHES** empty catch blocks. Errors will be swallowed silently."
  add ""
  add "**What this means:** Your smoke detectors have dead batteries — failures happen silently."
  add ""
fi

if [ "$CONSOLE_CATCHES" -gt 0 ]; then
  add "### 🟡 Console-Only Error Handling"
  add ""
  add "Found **$CONSOLE_CATCHES** catch blocks that only console.log/error."
  add ""
  add "**What this means:** Errors are acknowledged but not actually handled. In production, nobody reads the console."
  add ""
fi

if [ "$NEW_TODOS" -gt 0 ]; then
  add "### 🟡 TODO/FIXME Markers"
  add ""
  add "Found **$NEW_TODOS** new TODO/FIXME/HACK markers. This is unfinished work entering the codebase."
  add ""
fi

# Test coverage for changed files
add "## Test Coverage for Changed Files"
add ""
UNTESTED=0
TESTED=0
UPDATED=0

for file in $(echo "$SOURCE_CHANGED" | grep -v test | grep -v spec | grep -v "^$"); do
  BASENAME=$(basename "$file" | sed 's/\.\(ts\|tsx\|js\|jsx\|py\|go\|rs\)$//')
  TEST_EXISTS=$(find . -name "${BASENAME}.test.*" -o -name "${BASENAME}.spec.*" -o -name "test_${BASENAME}.*" 2>/dev/null | grep -v node_modules | head -1)
  
  if [ -n "$TEST_EXISTS" ]; then
    if echo "$CHANGED" | grep -q "$(basename "$TEST_EXISTS")"; then
      add "- 🟢 \`$file\` — test exists and was updated"
      UPDATED=$((UPDATED + 1))
    else
      add "- 🟡 \`$file\` — test exists but NOT updated"
      TESTED=$((TESTED + 1))
    fi
  else
    add "- 🔴 \`$file\` — no test file found"
    UNTESTED=$((UNTESTED + 1))
  fi
done

add ""
add "**Summary:** $UPDATED tested & updated, $TESTED tested but stale, $UNTESTED untested"
add ""

# Large files in diff
add "## File Size Check"
add ""
for file in $(echo "$SOURCE_CHANGED" | grep -v "^$"); do
  if [ -f "$file" ]; then
    LINES=$(wc -l < "$file")
    if [ "$LINES" -gt 400 ]; then
      add "- 🔴 \`$file\` — $LINES lines (over 400 threshold)"
    elif [ "$LINES" -gt 200 ]; then
      add "- 🟡 \`$file\` — $LINES lines (approaching threshold)"
    fi
  fi
done
add ""

# Verdict
CRITICAL=0
[ "$EMPTY_CATCHES" -gt 0 ] && CRITICAL=$((CRITICAL + 1))
[ "$UNTESTED" -gt 3 ] && CRITICAL=$((CRITICAL + 1))
[ "$DIR_COUNT" -gt 7 ] && CRITICAL=$((CRITICAL + 1))

if [ "$CRITICAL" -gt 0 ]; then
  add "## Verdict: 🛑 Hold"
  add ""
  add "**$CRITICAL critical issues** should be addressed before merging."
elif [ "$NEW_TODOS" -gt 0 ] || [ "$CONSOLE_CATCHES" -gt 0 ] || [ "$TESTED" -gt 2 ]; then
  add "## Verdict: ⚠️ Ship With Notes"
  add ""
  add "No blocking issues, but address the warnings above soon."
else
  add "## Verdict: ✅ Ship It"
  add ""
  add "No significant issues found in this diff."
fi

# Output
echo -e "$REPORT"
