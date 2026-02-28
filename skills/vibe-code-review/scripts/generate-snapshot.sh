#!/bin/bash
# generate-snapshot.sh — Produces a quality metrics snapshot for trend tracking
# Usage: bash scripts/generate-snapshot.sh [project-path]
#
# Saves a JSON snapshot to .quality/snapshot-YYYY-MM-DD.json in the project root.
# Commit the .quality/ directory to your repo so trends persist.

set -e

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

TIMESTAMP=$(date +%Y-%m-%d)
OUTPUT_DIR=".quality"
OUTPUT_FILE="$OUTPUT_DIR/snapshot-$TIMESTAMP.json"

mkdir -p "$OUTPUT_DIR"

echo "📊 Generating quality snapshot for $(pwd)..."

# Count source files
SRC_FILES=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \
  | grep -v node_modules | grep -v __pycache__ | grep -v .next | grep -v dist | grep -v build \
  | grep -v test | grep -v spec | wc -l | tr -d ' ')

# Count test files
TEST_FILES=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -name "*_test.*" \
  | grep -v node_modules | grep -v __pycache__ | wc -l | tr -d ' ')

# Total lines of code
TOTAL_LOC=$(find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
  -not -path "*/node_modules/*" -not -path "*/__pycache__/*" -not -path "*/.next/*" -not -path "*/dist/*" \
  | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
TOTAL_LOC=${TOTAL_LOC:-0}

# Count dependencies
if [ -f package.json ]; then
  DEPS=$(python3 -c "import json; d=json.load(open('package.json')); print(len(d.get('dependencies',{})))" 2>/dev/null || echo "0")
  DEV_DEPS=$(python3 -c "import json; d=json.load(open('package.json')); print(len(d.get('devDependencies',{})))" 2>/dev/null || echo "0")
elif [ -f requirements.txt ]; then
  DEPS=$(grep -v "^#" requirements.txt | grep -v "^$" | wc -l | tr -d ' ')
  DEV_DEPS=0
elif [ -f go.mod ]; then
  DEPS=$(grep "^\t" go.mod | grep -v "indirect" | wc -l | tr -d ' ')
  DEV_DEPS=0
else
  DEPS=0
  DEV_DEPS=0
fi

# Count files over 400 lines
LARGE_FILES=$(find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
  -not -path "*/node_modules/*" -not -path "*/__pycache__/*" -not -path "*/.next/*" \
  | while read f; do
    lines=$(wc -l < "$f" 2>/dev/null || echo 0)
    if [ "$lines" -gt 400 ]; then echo "$f"; fi
  done | wc -l | tr -d ' ')

# Count empty catch blocks
EMPTY_CATCHES=$(grep -rn "catch" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" -A 2 . \
  2>/dev/null | grep -v node_modules | grep -E "catch.*\{$" -A 1 | grep -c "^\s*\}" 2>/dev/null || echo "0")

# Count TODO/FIXME markers
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" --include="*.go" --include="*.rs" . \
  2>/dev/null | grep -v node_modules | grep -v __pycache__ | wc -l | tr -d ' ')

# Test ratio
TEST_RATIO=$(python3 -c "print(round($TEST_FILES / max($SRC_FILES, 1), 2))")

# Write snapshot
cat > "$OUTPUT_FILE" << EOF
{
  "date": "$TIMESTAMP",
  "source_files": $SRC_FILES,
  "test_files": $TEST_FILES,
  "test_ratio": $TEST_RATIO,
  "total_loc": $TOTAL_LOC,
  "dependencies": $DEPS,
  "dev_dependencies": $DEV_DEPS,
  "large_files_over_400": $LARGE_FILES,
  "empty_catch_blocks": $EMPTY_CATCHES,
  "todo_fixme_count": $TODOS
}
EOF

echo "✅ Snapshot saved to $OUTPUT_FILE"
echo ""
python3 -m json.tool "$OUTPUT_FILE"
