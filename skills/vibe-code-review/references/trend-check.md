# Trend Check Mode

Compare metrics over time to catch gradual degradation. Individual snapshots tell you the current state — trends tell you the trajectory.

## When to Use

- "Is my codebase getting better or worse?"
- Weekly/monthly quality check-ins
- After a sprint or feature push, compare before/after
- Tracking the "Effort Paradox" — are new features getting harder to add?

## Concept

This mode generates a metrics snapshot and compares it against previous snapshots stored in a `.quality/` directory in the project root. Each snapshot is a JSON file timestamped with the scan date.

## Steps

### 1. Generate Current Snapshot

Run this script to produce a metrics JSON:

```bash
#!/bin/bash
# generate-snapshot.sh — produces a quality metrics snapshot

TIMESTAMP=$(date +%Y-%m-%d)
OUTPUT_DIR=".quality"
OUTPUT_FILE="$OUTPUT_DIR/snapshot-$TIMESTAMP.json"

mkdir -p "$OUTPUT_DIR"

# Count source files
SRC_FILES=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \
  | grep -v node_modules | grep -v __pycache__ | grep -v .next | grep -v dist | grep -v test | grep -v spec | wc -l | tr -d ' ')

# Count test files
TEST_FILES=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -name "*_test.*" \
  | grep -v node_modules | grep -v __pycache__ | wc -l | tr -d ' ')

# Count total lines of code
TOTAL_LOC=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \
  | grep -v node_modules | grep -v __pycache__ | grep -v .next | grep -v dist \
  | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')

# Count dependencies
if [ -f package.json ]; then
  DEPS=$(python3 -c "import json; d=json.load(open('package.json')); print(len(d.get('dependencies',{})))" 2>/dev/null || echo "0")
  DEV_DEPS=$(python3 -c "import json; d=json.load(open('package.json')); print(len(d.get('devDependencies',{})))" 2>/dev/null || echo "0")
else
  DEPS=0
  DEV_DEPS=0
fi

# Count files over 400 lines
LARGE_FILES=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \
  | grep -v node_modules | grep -v __pycache__ | grep -v .next \
  | while read f; do
    lines=$(wc -l < "$f" 2>/dev/null)
    if [ "$lines" -gt 400 ]; then echo "$f"; fi
  done | wc -l | tr -d ' ')

# Count empty catch blocks
EMPTY_CATCHES=$(grep -rn "catch" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -A 2 . \
  | grep -v node_modules | grep -E "catch.*\{$" -A 1 | grep -c "^\s*\}" 2>/dev/null || echo "0")

# Count TODO/FIXME markers
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" . \
  | grep -v node_modules | grep -v __pycache__ | wc -l | tr -d ' ')

# Count directories (proxy for module count)
MODULES=$(find . -maxdepth 2 -type d \
  -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -not -path "*/dist/*" \
  | wc -l | tr -d ' ')

# Duplication percentage (if jscpd available)
DUP_PCT=$(npx jscpd . --min-lines 5 --min-tokens 50 --reporters json --output /tmp/jscpd-trend \
  --ignore "node_modules,dist,build,.next,__pycache__,coverage" 2>/dev/null \
  && python3 -c "import json; d=json.load(open('/tmp/jscpd-trend/jscpd-report.json')); print(d['statistics']['total']['percentage'])" 2>/dev/null || echo "null")

# Write snapshot
cat > "$OUTPUT_FILE" << EOF
{
  "date": "$TIMESTAMP",
  "source_files": $SRC_FILES,
  "test_files": $TEST_FILES,
  "test_ratio": $(python3 -c "print(round($TEST_FILES / max($SRC_FILES, 1), 2))"),
  "total_loc": $TOTAL_LOC,
  "dependencies": $DEPS,
  "dev_dependencies": $DEV_DEPS,
  "large_files_over_400": $LARGE_FILES,
  "empty_catch_blocks": $EMPTY_CATCHES,
  "todo_fixme_count": $TODOS,
  "module_count": $MODULES,
  "duplication_pct": $DUP_PCT
}
EOF

echo "Snapshot saved to $OUTPUT_FILE"
cat "$OUTPUT_FILE" | python3 -m json.tool
```

### 2. Compare Against Previous Snapshots

```bash
#!/bin/bash
# compare-snapshots.sh — compare latest snapshot against previous ones

QUALITY_DIR=".quality"
SNAPSHOTS=$(ls "$QUALITY_DIR"/snapshot-*.json 2>/dev/null | sort)
COUNT=$(echo "$SNAPSHOTS" | wc -l)

if [ "$COUNT" -lt 2 ]; then
  echo "Need at least 2 snapshots to compare. Run a scan first."
  exit 0
fi

LATEST=$(echo "$SNAPSHOTS" | tail -1)
PREVIOUS=$(echo "$SNAPSHOTS" | tail -2 | head -1)

python3 << 'PYEOF'
import json, sys

with open("LATEST_FILE") as f:
    latest = json.load(f)
with open("PREVIOUS_FILE") as f:
    prev = json.load(f)

print(f"Comparing: {prev['date']} → {latest['date']}")
print("=" * 60)

metrics = [
    ("source_files", "Source files", "neutral"),
    ("test_files", "Test files", "higher_better"),
    ("test_ratio", "Test ratio", "higher_better"),
    ("total_loc", "Total LOC", "neutral"),
    ("dependencies", "Dependencies", "lower_better"),
    ("large_files_over_400", "Large files (>400 lines)", "lower_better"),
    ("empty_catch_blocks", "Empty catch blocks", "lower_better"),
    ("todo_fixme_count", "TODO/FIXME markers", "lower_better"),
    ("module_count", "Module count", "neutral"),
    ("duplication_pct", "Duplication %", "lower_better"),
]

for key, label, direction in metrics:
    old = prev.get(key)
    new = latest.get(key)
    if old is None or new is None or old == "null" or new == "null":
        print(f"  {label}: no data")
        continue
    
    old, new = float(old), float(new)
    delta = new - old
    pct = (delta / old * 100) if old != 0 else 0
    
    if direction == "lower_better":
        icon = "🟢" if delta <= 0 else "🔴"
    elif direction == "higher_better":
        icon = "🟢" if delta >= 0 else "🔴"
    else:
        icon = "➡️"
    
    sign = "+" if delta > 0 else ""
    print(f"  {icon} {label}: {old} → {new} ({sign}{delta:.1f}, {sign}{pct:.1f}%)")

PYEOF
```

Replace `LATEST_FILE` and `PREVIOUS_FILE` with actual paths when running.

### 3. Trend Visualization

If the user wants a visual trend, generate a simple markdown table or ASCII chart:

```python
import json, os, glob

snapshots = sorted(glob.glob(".quality/snapshot-*.json"))
if not snapshots:
    print("No snapshots found")
    exit()

data = []
for s in snapshots:
    with open(s) as f:
        data.append(json.load(f))

# Print trend table
print("| Date | LOC | Deps | Large Files | Empty Catches | Duplication | Test Ratio |")
print("|------|-----|------|-------------|---------------|-------------|------------|")
for d in data:
    dup = f"{d.get('duplication_pct', 'N/A')}%" if d.get('duplication_pct') not in (None, 'null') else "N/A"
    print(f"| {d['date']} | {d['total_loc']} | {d['dependencies']} | {d['large_files_over_400']} | {d['empty_catch_blocks']} | {dup} | {d['test_ratio']} |")
```

### Key Trend Signals

| Signal | What It Means | Action |
|--------|---------------|--------|
| LOC rising, test ratio falling | Building without testing | Pause features, write tests |
| Dependencies climbing steadily | AI agents adding packages every session | Audit and remove unused deps |
| Large files increasing | Monoliths forming | Decompose before they calcify |
| Empty catches increasing | Reliability degrading | Add error handling sprint |
| Duplication climbing | AI reinventing existing solutions | Document shared utilities, update AI context |
| Feature time increasing | Architecture is fighting you | Deep audit needed |

### 4. Generate Trend Report

Output a markdown report with:
1. The comparison table
2. Traffic-light summary (🟢🟡🔴) for each metric's trajectory
3. Top 3 recommended actions based on the trends
4. A plain-language summary: "Your codebase is [improving/stable/degrading] in these areas..."

## Automation

Recommend the user add the snapshot script to their CI pipeline or run it weekly:

```bash
# Add to .github/workflows/quality-snapshot.yml or run manually
# The .quality/ directory should be committed to the repo
# so trends persist across machines and sessions
```

This way, every time they come back to review, historical data is already there.
