#!/usr/bin/env bash
# run_script.sh — Safe wrapper for V-Bounce script execution
# Usage: ./.vbounce/scripts/run_script.sh <script> [args...]
#
# All agents MUST invoke .vbounce scripts through this wrapper.
# Captures exit code, stdout, stderr. On failure, prints a structured
# diagnostic block that agents can parse and act on.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ── Arguments ────────────────────────────────────────────────────────

SCRIPT_NAME="${1:-}"

if [[ -z "$SCRIPT_NAME" ]]; then
  echo "Usage: ./.vbounce/scripts/run_script.sh <script> [args...]"
  echo ""
  echo "Examples:"
  echo "  ./.vbounce/scripts/run_script.sh validate_state.mjs"
  echo "  ./.vbounce/scripts/run_script.sh pre_gate_runner.sh qa .worktrees/STORY-001-01/"
  echo "  ./.vbounce/scripts/run_script.sh complete_story.mjs STORY-001-01"
  exit 1
fi

shift
SCRIPT_ARGS=("$@")

# ── Resolve script path ─────────────────────────────────────────────

SCRIPT_PATH="${SCRIPT_DIR}/${SCRIPT_NAME}"

if [[ ! -f "$SCRIPT_PATH" ]]; then
  echo ""
  echo -e "${RED}┌─ SCRIPT FAILURE ─────────────────────────────────────────┐${NC}"
  echo -e "${RED}│ Script:    ${SCRIPT_NAME}${NC}"
  echo -e "${RED}│ Exit Code: 127 (not found)${NC}"
  echo -e "${RED}│ Error:     ${SCRIPT_PATH} does not exist${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Available scripts:${NC}"
  for f in "${SCRIPT_DIR}"/*.{mjs,sh}; do
    [[ -f "$f" ]] && [[ "$(basename "$f")" != "run_script.sh" ]] && echo -e "${RED}│   $(basename "$f")${NC}"
  done
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Action:    Check script name for typos${NC}"
  echo -e "${RED}└──────────────────────────────────────────────────────────┘${NC}"
  exit 127
fi

# ── Pre-flight checks ───────────────────────────────────────────────

PREFLIGHT_WARNINGS=""

# Check state.json for scripts that need it
NEEDS_STATE=(
  "update_state.mjs" "validate_state.mjs" "complete_story.mjs"
  "close_sprint.mjs" "prep_sprint_context.mjs" "validate_bounce_readiness.mjs"
)

for s in "${NEEDS_STATE[@]}"; do
  if [[ "$SCRIPT_NAME" == "$s" ]]; then
    if [[ ! -f "${ROOT}/.vbounce/state.json" ]]; then
      PREFLIGHT_WARNINGS="${PREFLIGHT_WARNINGS}\n  ⚠ state.json missing — ${SCRIPT_NAME} will fail"
    elif ! node -e "JSON.parse(require('fs').readFileSync('${ROOT}/.vbounce/state.json','utf8'))" 2>/dev/null; then
      PREFLIGHT_WARNINGS="${PREFLIGHT_WARNINGS}\n  ⚠ state.json is invalid JSON — ${SCRIPT_NAME} will fail"
    fi
    break
  fi
done

# Check .vbounce directory exists
if [[ ! -d "${ROOT}/.vbounce" ]]; then
  PREFLIGHT_WARNINGS="${PREFLIGHT_WARNINGS}\n  ⚠ .vbounce/ directory missing"
fi

if [[ -n "$PREFLIGHT_WARNINGS" ]]; then
  echo -e "${YELLOW}Pre-flight warnings:${PREFLIGHT_WARNINGS}${NC}"
  echo ""
fi

# ── Execute ──────────────────────────────────────────────────────────

STDOUT_FILE=$(mktemp)
STDERR_FILE=$(mktemp)
trap 'rm -f "$STDOUT_FILE" "$STDERR_FILE"' EXIT

# Determine runner
RUNNER=""
case "$SCRIPT_NAME" in
  *.mjs) RUNNER="node" ;;
  *.sh)  RUNNER="bash" ;;
  *)     RUNNER="" ;;
esac

if [[ -n "$RUNNER" ]]; then
  $RUNNER "$SCRIPT_PATH" ${SCRIPT_ARGS[@]+"${SCRIPT_ARGS[@]}"} > "$STDOUT_FILE" 2> "$STDERR_FILE"
else
  "$SCRIPT_PATH" ${SCRIPT_ARGS[@]+"${SCRIPT_ARGS[@]}"} > "$STDOUT_FILE" 2> "$STDERR_FILE"
fi
EXIT_CODE=$?

# ── Output ───────────────────────────────────────────────────────────

# Always show stdout
cat "$STDOUT_FILE"

if [[ $EXIT_CODE -eq 0 ]]; then
  # Success — show stderr as warnings if any
  if [[ -s "$STDERR_FILE" ]]; then
    echo ""
    echo -e "${YELLOW}Warnings (stderr):${NC}"
    cat "$STDERR_FILE"
  fi
  exit 0
fi

# ── Failure diagnostic ───────────────────────────────────────────────

STDERR_CONTENT=$(cat "$STDERR_FILE")

echo ""
echo -e "${RED}┌─ SCRIPT FAILURE ─────────────────────────────────────────┐${NC}"
echo -e "${RED}│ Script:    ${SCRIPT_NAME} ${SCRIPT_ARGS[*]+"${SCRIPT_ARGS[*]}"}${NC}"
echo -e "${RED}│ Exit Code: ${EXIT_CODE}${NC}"
echo -e "${RED}│${NC}"

# Show stderr (truncated to 20 lines)
if [[ -n "$STDERR_CONTENT" ]]; then
  echo -e "${RED}│ Stderr:${NC}"
  echo "$STDERR_CONTENT" | head -20 | while IFS= read -r line; do
    echo -e "${RED}│   ${line}${NC}"
  done
  STDERR_LINES=$(echo "$STDERR_CONTENT" | wc -l | tr -d ' ')
  if [[ "$STDERR_LINES" -gt 20 ]]; then
    echo -e "${RED}│   ... (${STDERR_LINES} total lines, truncated)${NC}"
  fi
else
  echo -e "${RED}│ Stderr:    (empty)${NC}"
fi

echo -e "${RED}│${NC}"

# ── Diagnosis ────────────────────────────────────────────────────────

echo -e "${RED}│ Diagnosis:${NC}"

# Check common root causes
if echo "$STDERR_CONTENT" | grep -qi "state.json not found\|state.json missing"; then
  echo -e "${RED}│   Missing state.json — sprint was never initialized${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Fix: Run ./.vbounce/scripts/init_sprint.mjs S-XX D-XX --stories STORY-IDS${NC}"

elif echo "$STDERR_CONTENT" | grep -qi "not valid JSON\|Unexpected token\|SyntaxError"; then
  echo -e "${RED}│   state.json is corrupted (invalid JSON)${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Fix: Run ./.vbounce/scripts/validate_state.mjs to see errors,${NC}"
  echo -e "${RED}│      then repair or regenerate with init_sprint.mjs${NC}"

elif echo "$STDERR_CONTENT" | grep -qi "not found in state.json\|not found in stories"; then
  echo -e "${RED}│   Story ID not registered in state.json${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Fix: Verify the story ID, or add it via update_state.mjs${NC}"

elif echo "$STDERR_CONTENT" | grep -qi "ENOENT\|no such file"; then
  echo -e "${RED}│   A required file or directory is missing${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Fix: Run ./.vbounce/scripts/doctor.mjs to identify missing files${NC}"

elif echo "$STDERR_CONTENT" | grep -qi "permission denied\|EACCES"; then
  echo -e "${RED}│   Permission denied on a file or directory${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Fix: Check file permissions — shell scripts may need chmod +x${NC}"

elif [[ $EXIT_CODE -eq 1 ]]; then
  echo -e "${RED}│   Script reported failure (exit 1) — check stderr above${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Fix: Run ./.vbounce/scripts/doctor.mjs for a full health check${NC}"

else
  echo -e "${RED}│   Unexpected exit code ${EXIT_CODE}${NC}"
  echo -e "${RED}│${NC}"
  echo -e "${RED}│ Fix: Run ./.vbounce/scripts/doctor.mjs for a full health check${NC}"
fi

echo -e "${RED}└──────────────────────────────────────────────────────────┘${NC}"

exit $EXIT_CODE
