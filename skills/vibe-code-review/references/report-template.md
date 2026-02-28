# Report Template

Use this template structure for all code review outputs. Adapt sections based on the review mode.

## Universal Report Header

```markdown
# 🔍 Vibe Code Review Report

**Project:** [project name]
**Date:** [date]
**Mode:** [Quick Scan | PR Review | Deep Audit | Trend Check]
**Stack:** [detected tech stack]

---
```

## Severity Definitions

Use consistently across all reports:

- 🔴 **Critical** — Must fix before shipping. Active risk to reliability, security, or sustainability.
- 🟡 **Warning** — Technical debt accumulating. Safe for now, but will cause problems if ignored.
- 🟢 **Healthy** — No action needed. Meets or exceeds standards.
- ℹ️ **Info** — Not a problem, but worth knowing about.

## Quick Scan Report Structure

```markdown
## Summary

[2-3 sentence plain-language verdict. Use a building inspection analogy.]

## Findings

### 🔴 Critical Issues
[List each with a one-line description and a plain-language "what this means" explanation]

### 🟡 Warnings  
[Same format]

### 🟢 Healthy Areas
[Brief acknowledgment of what's working well]

## Metrics Snapshot

| Metric | Value | Status |
|--------|-------|--------|
| Source files | X | ℹ️ |
| Total LOC | X | ℹ️ |
| Files over 400 lines | X | 🟢/🟡/🔴 |
| Dependencies | X | 🟢/🟡/🔴 |
| Test files | X | 🟢/🟡/🔴 |
| Empty catch blocks | X | 🟢/🟡/🔴 |
| Architectural patterns | X competing | 🟢/🟡/🔴 |

## Recommended Actions

1. [Highest priority action — what and why]
2. [Second priority]
3. [Third priority]
```

## PR Review Report Structure

```markdown
## Verdict: [✅ Ship It | ⚠️ Ship With Notes | 🛑 Hold]

[One sentence explaining the verdict]

## Change Summary

- **Files changed:** X
- **Lines added/removed:** +X / -X  
- **Directories touched:** X
- **New dependencies:** X

## Findings

### [Each finding with file path and line reference]

**File:** `path/to/file.ts`  
**Severity:** 🔴/🟡  
**Issue:** [description]  
**What this means:** [plain-language explanation]  
**Suggested fix:** [concrete action]

## Checklist

- [ ] No new empty catch blocks
- [ ] New code has corresponding tests
- [ ] No new dependencies without justification
- [ ] Duplication check passed
- [ ] Cross-module impact is acceptable
```

## Deep Audit Report Structure

```markdown
## Executive Summary

[3-5 sentence overview. A non-technical stakeholder should understand the state of the project from this alone.]

## Architecture

### Pattern Map
[Table or list of all detected patterns and their usage counts]

### Consistency Score: [X/10]
[Explanation of competing patterns found]

### Coupling Analysis
[Most-imported modules, circular dependencies, god modules]

## Code Health

### Duplication: [X%]
[Top duplicated blocks with file references]

### Dead Code
[Orphaned files and unused exports]

### File Size Distribution
[How many files fall into each size bucket]

## Reliability

### Error Handling Score: [X/10]
[Empty catches, console-only handling, missing validation]

### Test Quality Score: [X/10]
[Test ratio, assertion quality, weak assertions, snapshot tests]

## Sustainability

### Dependency Health
[Count, known vulnerabilities, unnecessary packages]

### Complexity Hotspots
[Top 5 most complex files/functions]

## Recommendations (Prioritized)

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | [action] | [hours/days] | [what improves] |
| 2 | [action] | [hours/days] | [what improves] |
| 3 | [action] | [hours/days] | [what improves] |

## Plain-Language Summary

If this codebase were a building:
- **Foundation:** [solid/cracking/unstable]
- **Plumbing (data flow):** [clean/leaky/clogged]
- **Electrical (error handling):** [up to code/some dead outlets/fire hazard]
- **Layout (architecture):** [coherent/quirky but functional/maze]
- **Maintenance access:** [easy/tight/sealed shut]
```

## Trend Check Report Structure

```markdown
## Trajectory: [📈 Improving | ➡️ Stable | 📉 Degrading]

[One sentence summary of the overall trend]

## Metrics Over Time

| Date | LOC | Deps | Large Files | Empty Catches | Dup % | Test Ratio |
|------|-----|------|-------------|---------------|-------|------------|
| [date] | X | X | X | X | X% | X |

## Trend Signals

[For each metric that changed significantly, explain what the trend means]

## Recommended Actions

1. [Based on trends, not just current state]
```

## Writing Guidelines

- **Lead with the verdict** — don't bury it
- **Use analogies** — the user may not read code
- **Be specific** — file paths, line numbers, concrete examples
- **Prioritize recommendations** — the user needs to know what to fix first
- **Don't overwhelm** — for Quick Scan, keep to top 5 findings max. Save exhaustive lists for Deep Audit.
- **Celebrate wins** — if something is well-structured, say so. Positive reinforcement matters in vibe coding.
