# Deep Audit Mode

A comprehensive analysis of the entire codebase. This takes longer but gives a complete picture of architectural health, coupling, duplication, and sustainability.

## When to Use

- Before a major release or launch
- When the user suspects the codebase is getting "too complex to change"
- Quarterly or monthly health assessments
- Before hiring a new developer or onboarding someone
- When feature velocity is noticeably declining

## Steps

### 1. Project Census

Get a full picture of the codebase size and shape:

```bash
echo "=== Project Census ==="

# Count files by type
echo "--- Files by extension ---"
find . -type f \
  -not -path "*/node_modules/*" \
  -not -path "*/.next/*" \
  -not -path "*/dist/*" \
  -not -path "*/build/*" \
  -not -path "*/__pycache__/*" \
  -not -path "*/.git/*" \
  -not -path "*/coverage/*" \
  | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20

echo ""
echo "--- Total lines of code ---"
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \
  | grep -v node_modules | grep -v .next | grep -v dist | grep -v __pycache__ \
  | xargs wc -l 2>/dev/null | tail -1

echo ""
echo "--- Directory structure (2 levels) ---"
find . -maxdepth 2 -type d \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/.next/*" \
  | sort
```

### 2. Architectural Consistency Analysis

This is the most important check. AI agents drift between patterns across sessions.

```bash
echo "=== Architectural Pattern Map ==="

# Detect all patterns in use
echo "--- State Management ---"
grep -rl "createSlice\|configureStore\|createStore" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Redux: {} files"
grep -rl "zustand\|create(" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Zustand: {} files"
grep -rl "createContext\|useContext" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Context API: {} files"
grep -rl "makeAutoObservable\|makeObservable" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "MobX: {} files"
grep -rl "@tanstack/react-query\|useQuery\|useMutation" --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "React Query: {} files"

echo ""
echo "--- API Patterns ---"
grep -rl "fetch(" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Raw fetch: {} files"
grep -rl "axios" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Axios: {} files"
grep -rl "ky\b\|import.*from.*'ky'" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Ky: {} files"

echo ""
echo "--- Component Patterns ---"
grep -rl "class.*extends.*Component\|class.*extends.*React" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Class components: {} files"
grep -rl "export default function\|export const.*=.*(" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Functional components: {} files"

echo ""
echo "--- Styling Patterns ---"
find . -name "*.module.css" -o -name "*.module.scss" | grep -v node_modules | wc -l | xargs -I{} echo "CSS Modules: {} files"
grep -rl "styled\." --include="*.ts" --include="*.tsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Styled-components: {} files"
grep -rl "className=\".*tailwind\|className={.*cn(" --include="*.tsx" --include="*.jsx" . 2>/dev/null | grep -v node_modules | wc -l | xargs -I{} echo "Tailwind: {} files"
find . -name "*.css" -not -name "*.module.css" | grep -v node_modules | wc -l | xargs -I{} echo "Plain CSS: {} files"
```

**Analysis rule:** If multiple competing patterns exist for the same concern (e.g., Redux AND Zustand for state, or both class and functional components), flag as architectural inconsistency. One pattern should dominate (>80% usage).

### 3. Full Duplication Analysis

```bash
# Install jscpd if needed
npx jscpd --version 2>/dev/null || npm install -g jscpd

# Run full-project duplication scan
npx jscpd . \
  --min-lines 5 \
  --min-tokens 50 \
  --reporters "console,json" \
  --output /tmp/jscpd-report \
  --ignore "node_modules,dist,build,.next,__pycache__,coverage,*.test.*,*.spec.*" \
  2>/dev/null

# Parse results if JSON available
if [ -f /tmp/jscpd-report/jscpd-report.json ]; then
  python3 -c "
import json
with open('/tmp/jscpd-report/jscpd-report.json') as f:
    data = json.load(f)
    total = data.get('statistics', {}).get('total', {})
    print(f'Total duplicated lines: {total.get(\"duplicatedLines\", 0)}')
    print(f'Duplication percentage: {total.get(\"percentage\", 0):.1f}%')
    dupes = data.get('duplicates', [])
    print(f'Duplicate blocks found: {len(dupes)}')
    for d in dupes[:10]:
        first = d['firstFile']
        second = d['secondFile']
        print(f'  {first[\"name\"]}:{first[\"startLoc\"][\"line\"]} ↔ {second[\"name\"]}:{second[\"startLoc\"][\"line\"]} ({d[\"lines\"]} lines)')
"
fi
```

**Thresholds:**
- 🟢 Under 3%: Excellent
- 🟡 3–8%: Normal, but watch it
- 🔴 Over 8%: Significant duplication — AI is reinventing solutions

### 4. Dependency Graph and Coupling

```bash
# For JavaScript/TypeScript
npx dependency-cruiser --version 2>/dev/null || npm install -g dependency-cruiser

# Generate dependency graph
npx depcruise --include-only "^src" --output-type text src/ 2>/dev/null | head -100

# Count circular dependencies
echo "=== Circular Dependencies ==="
npx depcruise --include-only "^src" --output-type err src/ 2>/dev/null | grep "circular" | head -20

# Identify most-imported modules (coupling hotspots)
echo ""
echo "=== Most-imported modules (coupling hotspots) ==="
grep -rh "from ['\"]" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . \
  | grep -v node_modules \
  | sed "s/.*from ['\"]//;s/['\"].*//" \
  | sort | uniq -c | sort -rn | head -20
```

**What to flag:**
- Circular dependencies (always 🔴)
- Any module imported by more than 30% of files (coupling hotspot)
- God modules that import more than 15 other project modules

### 5. Dead Code Detection

```bash
# JavaScript/TypeScript
echo "=== Dead Code Analysis ==="
npx knip --no-exit-code 2>/dev/null

# If knip unavailable
npx ts-unused-exports tsconfig.json 2>/dev/null

# Count files not imported by anything
echo ""
echo "=== Potentially orphaned files ==="
for file in $(find src -name "*.ts" -o -name "*.tsx" | grep -v test | grep -v spec | grep -v index); do
  BASENAME=$(basename "$file" | sed 's/\.\(ts\|tsx\)$//')
  REFS=$(grep -rl "$BASENAME" --include="*.ts" --include="*.tsx" src/ | grep -v "$file" | wc -l)
  if [ "$REFS" -eq 0 ]; then
    echo "  ⚠️  $file — not imported anywhere"
  fi
done
```

### 6. Error Handling Comprehensive Audit

```bash
echo "=== Error Handling Audit ==="

echo "--- Empty catch blocks ---"
grep -rn "catch" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -A 2 . \
  | grep -v node_modules \
  | grep -E "catch.*\{$" -A 1 | grep "^\-\-$\|^\s*\}" | head -20

echo ""
echo "--- Console-only error handling ---"
grep -rn "catch" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -A 5 . \
  | grep -v node_modules \
  | grep -c "console\.\(log\|error\|warn\)"
echo " instances of console-only error handling"

echo ""
echo "--- Missing try/catch around async operations ---"
# Find await statements not inside try blocks (heuristic)
grep -rn "await " --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . \
  | grep -v node_modules | grep -v test | grep -v spec | wc -l
echo " total await statements"

echo ""
echo "--- Error boundaries (React) ---"
grep -rl "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError" --include="*.tsx" --include="*.jsx" . \
  | grep -v node_modules | wc -l
echo " error boundary implementations"

echo ""
echo "--- API error responses ---"
grep -rn "res\.\(status\|json\)" --include="*.ts" --include="*.js" -B2 -A2 . \
  | grep -v node_modules | grep -E "4[0-9]{2}|5[0-9]{2}" | head -10
echo "(Checking for proper HTTP error status codes)"
```

### 7. Test Quality Assessment

```bash
echo "=== Test Quality Assessment ==="

echo "--- Test file inventory ---"
find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" \
  | grep -v node_modules | grep -v __pycache__

echo ""
echo "--- Assertion patterns ---"
# Check if tests have real assertions or just smoke tests
grep -rn "expect\|assert\|should" --include="*.test.*" --include="*.spec.*" . \
  | grep -v node_modules | wc -l
echo " total assertions"

# Check for weak assertions
echo ""
echo "--- Weak assertions (testing existence, not behavior) ---"
grep -rn "toBeDefined\|toBeTruthy\|not\.toBeNull\|to\.exist" --include="*.test.*" --include="*.spec.*" . \
  | grep -v node_modules | wc -l
echo " weak assertions (only check that something exists)"

# Check for snapshot tests (often low value in AI codebases)
echo ""
grep -rn "toMatchSnapshot\|toMatchInlineSnapshot" --include="*.test.*" --include="*.spec.*" . \
  | grep -v node_modules | wc -l
echo " snapshot tests (often brittle in AI-generated code)"
```

### 8. The "Explain It" Consistency Test

This is unique to vibe-coded projects. Ask the AI to describe the architecture, then compare it against what the code actually shows.

**Instructions for Claude:**
1. Read the project's README, any architecture docs, and the top-level directory structure
2. Write a plain-language architectural description based ONLY on the actual code structure
3. Compare this against any existing documentation
4. Flag contradictions — these mean the codebase has drifted from its intended design

## Report Output

Use `references/report-template.md` with the **Deep Audit** section. The report should be comprehensive enough to hand to a new team member or a code reviewer as a briefing document.

Structure findings into:
- **Architecture** — Pattern map, consistency score, coupling graph
- **Code Health** — Duplication, dead code, file sizes
- **Reliability** — Error handling, test quality
- **Sustainability** — Dependency health, complexity trends
- **Recommendations** — Prioritized action items with effort estimates
