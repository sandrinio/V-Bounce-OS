# Quick Scan Mode

A fast health check that gives you a snapshot of project quality in under 5 minutes. No git history needed — just the current state of the codebase.

## When to Use

- First look at a new project
- "Is my codebase healthy?" type questions
- Quick assessment before deciding if a deep audit is needed

## Steps

### 1. Detect Stack

```bash
# Find project root markers
ls package.json requirements.txt go.mod Cargo.toml composer.json Gemfile pom.xml build.gradle 2>/dev/null
```

Identify: language, framework, package manager, test framework.

### 2. File Size Check

Flag files that are suspiciously large — a signature of AI-generated code dumping logic into monoliths.

```bash
# Find files over 400 lines (adjust for language)
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \
  | grep -v node_modules | grep -v __pycache__ | grep -v .next \
  | while read f; do
    lines=$(wc -l < "$f")
    if [ "$lines" -gt 400 ]; then
      echo "⚠️  $f — $lines lines"
    fi
  done
```

**Thresholds:**
- 🟢 Under 200 lines: Good
- 🟡 200–400 lines: Acceptable but watch it
- 🔴 Over 400 lines: Likely needs decomposition

### 3. Function/Method Size Check

```bash
# For TypeScript/JavaScript — find functions over 50 lines
# This is a heuristic: count lines between function declarations
grep -rn "function \|const .* = \(.*\) =>\|async function\|export default function\|export function" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  . | grep -v node_modules | head -50
```

For Python:
```bash
grep -rn "def " --include="*.py" . | grep -v __pycache__ | head -50
```

Manually spot-check the largest files for functions exceeding 50 lines.

### 4. Dependency Count

```bash
# Node.js
cat package.json | python3 -c "
import sys, json
pkg = json.load(sys.stdin)
deps = len(pkg.get('dependencies', {}))
dev = len(pkg.get('devDependencies', {}))
print(f'Dependencies: {deps}')
print(f'Dev dependencies: {dev}')
print(f'Total: {deps + dev}')
if deps > 30: print('⚠️  High dependency count — review for unnecessary packages')
"

# Python
pip list 2>/dev/null | wc -l
# or
cat requirements.txt 2>/dev/null | grep -v "^#" | grep -v "^$" | wc -l
```

**Thresholds (production deps only):**
- 🟢 Under 15: Lean
- 🟡 15–30: Normal
- 🔴 Over 30: Review for bloat — AI agents over-install

### 5. Dead Import Detection

```bash
# For TypeScript/JavaScript projects with knip installed
npx knip --no-exit-code 2>/dev/null || echo "Install knip: npm install -D knip"

# Quick alternative: find unused exports
npx ts-unused-exports tsconfig.json 2>/dev/null || true
```

For Python:
```bash
# Check if vulture is available, suggest install if not
python3 -m vulture . --min-confidence 80 2>/dev/null || echo "Install vulture: pip install vulture"
```

### 6. Error Handling Audit

```bash
# Find empty or weak catch blocks
echo "=== Empty catch blocks ==="
grep -rn "catch" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -A 2 . \
  | grep -v node_modules \
  | grep -E "catch.*\{$|catch.*\{\s*\}" | head -20

echo ""
echo "=== Console.log-only error handling ==="
grep -rn "catch" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" -A 3 . \
  | grep -v node_modules \
  | grep -B1 "console\.\(log\|error\)" | head -20

echo ""
echo "=== TODO/FIXME/HACK markers ==="
grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.py" . \
  | grep -v node_modules | grep -v __pycache__ | head -20
```

### 7. Test Presence Check

```bash
# Check if tests exist at all
echo "=== Test files ==="
find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -name "*_test.*" \
  | grep -v node_modules | grep -v __pycache__

echo ""
echo "=== Test file count vs source file count ==="
SRC=$(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" \
  | grep -v node_modules | grep -v __pycache__ | grep -v test | grep -v spec | wc -l)
TEST=$(find . -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -name "*_test.*" \
  | grep -v node_modules | grep -v __pycache__ | wc -l)
echo "Source files: $SRC"
echo "Test files: $TEST"
if [ "$TEST" -eq 0 ]; then
  echo "🔴 No tests found"
elif [ "$TEST" -lt "$((SRC / 3))" ]; then
  echo "🟡 Low test coverage — fewer than 1 test file per 3 source files"
else
  echo "🟢 Reasonable test file count"
fi
```

### 8. Architectural Pattern Detection

Scan for common patterns to check consistency:

```bash
echo "=== Framework patterns detected ==="
# React patterns
grep -rl "useEffect\|useState\|useContext" --include="*.tsx" --include="*.jsx" . 2>/dev/null | wc -l | xargs -I{} echo "React hooks files: {}"
grep -rl "class.*extends.*Component" --include="*.tsx" --include="*.jsx" . 2>/dev/null | wc -l | xargs -I{} echo "React class component files: {}"

# API patterns
grep -rl "express\|app\.get\|app\.post\|router\." --include="*.ts" --include="*.js" . 2>/dev/null | wc -l | xargs -I{} echo "Express route files: {}"
grep -rl "NextResponse\|NextRequest" --include="*.ts" --include="*.js" . 2>/dev/null | wc -l | xargs -I{} echo "Next.js API route files: {}"

# State management
grep -rl "createSlice\|configureStore" --include="*.ts" --include="*.js" . 2>/dev/null | wc -l | xargs -I{} echo "Redux files: {}"
grep -rl "create.*store\|zustand" --include="*.ts" --include="*.js" . 2>/dev/null | wc -l | xargs -I{} echo "Zustand files: {}"
grep -rl "useContext\|createContext" --include="*.tsx" --include="*.jsx" . 2>/dev/null | wc -l | xargs -I{} echo "Context API files: {}"
```

If multiple competing patterns are found (e.g., both Redux AND Zustand, or both class components AND hooks), flag as architectural inconsistency.

## Report Output

Use the template from `references/report-template.md` with the **Quick Scan** section. Produce a severity-sorted summary:

- 🔴 **Critical** — Will cause problems soon (no tests, empty error handling, massive files)
- 🟡 **Warning** — Technical debt accumulating (high deps, mild duplication, mixed patterns)
- 🟢 **Healthy** — No action needed

End with a plain-language summary: "If this were a building inspection, here's what I'd flag..."
