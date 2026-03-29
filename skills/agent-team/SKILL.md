---
name: agent-team
description: "Use when you need to delegate implementation tasks to specialized agents (Developer, QA, Architect, DevOps, Scribe) as the Team Lead. Activates when orchestrating the Bounce phase — delegating stories, monitoring reports, merging completed work, consolidating sprint results, and generating product documentation. Uses git worktrees for story isolation. Works with Claude Code subagents natively; file-based handoffs for other tools."
---

# Agent Team Orchestration

## Overview

This skill defines how the Team Lead delegates work to specialized agents during Phase 2: The Bounce. Each story is isolated in a **git worktree** to prevent cross-contamination. Agents communicate exclusively through structured report files.

**Core principle:** The Team Lead plans and coordinates. It never writes implementation code itself.

## When to Use

- When executing the Bounce phase of a sprint.
- When delegating stories to Developer, QA, Architect, or DevOps agents.
- When consolidating agent reports into a Sprint Report.
- When a story needs to be bounced between agents.
- When merging completed stories or releasing sprints (delegate to DevOps).
- When generating or updating product documentation (delegate to Scribe).

## Agent Roster

| Agent | Config File | Role | Tools | Skills |
|-------|------------|------|-------|--------|
| Developer | `.claude/agents/developer.md` | Feature implementation and debugging | Read, Edit, Write, Bash, Glob, Grep | react-best-practices, lesson |
| QA | `.claude/agents/qa.md` | Adversarial testing and validation | Read, Bash, Glob, Grep | vibe-code-review (Quick Scan, PR Review), lesson |
| Architect | `.claude/agents/architect.md` | Structural integrity and standards | Read, Glob, Grep, Bash | vibe-code-review (Deep Audit, Trend Check), lesson |
| DevOps | `.claude/agents/devops.md` | Git operations, merges, deploys, infra | Read, Edit, Write, Bash, Glob, Grep | lesson |
| Scribe | `.claude/agents/scribe.md` | Product documentation generation | Read, Write, Bash, Glob, Grep | lesson |

---

## Git Worktree Strategy

Every story gets its own worktree. This isolates code changes so a failed fix on Story 01 never contaminates Story 02.

### Branch Model

```
main                                    ← production
└── sprint/S-01                         ← sprint branch (cut from main)
    ├── story/STORY-001-01-login        ← story branch (worktree)
    ├── story/STORY-001-02-auth         ← story branch (worktree)
    └── story/STORY-001-03-api          ← story branch (worktree)
```

### Directory Layout

```
repo/                                   ← main working directory
├── .worktrees/                         ← worktree root (GITIGNORED)
│   ├── STORY-001-01-login/             ← isolated worktree for story
│   │   ├── (full codebase checkout)
│   │   └── .vbounce/                    ← reports live here during bounce
│   │       ├── tasks/
│   │       └── reports/
│   └── STORY-001-02-auth/
│       └── ...
│
└── .vbounce/
    ├── reports/                        ← active working reports (GITIGNORED)
    ├── sprint-report-S-{XX}.md          ← current sprint report (GITIGNORED)
    └── archive/                        ← completed sprint history (COMMITTED TO GIT)
        └── S-01/
            ├── STORY-001-01/           ← all agent reports for this story
            ├── sprint-report-S-{XX}.md  ← final sprint report
            └── sprint-S-{XX}-devops.md  ← release report
```

### V-Bounce State → Git Operations

| V-Bounce State | Git Operation |
|---------------|---------------|
| Sprint starts | `git checkout -b sprint/S-01 main` |
| Ready to Bounce | `git worktree add .worktrees/STORY-{ID}-{StoryName} -b story/STORY-{ID}-{StoryName} sprint/S-01` |
| Bouncing | All work happens inside `.worktrees/STORY-{ID}-{StoryName}/` |
| Done | Merge story branch → sprint branch, `git worktree remove` |
| Sprint Review → Done | Merge sprint branch → main |
| Escalated | Worktree kept but frozen (no new commits) |
| Parking Lot | Worktree removed, branch preserved unmerged |

### Worktree Commands

```bash
# Sprint initialization
git checkout -b sprint/S-01 main

# Create worktree for a story
git worktree add .worktrees/STORY-001-01-login -b story/STORY-001-01-login sprint/S-01
mkdir -p .worktrees/STORY-001-01-login/.vbounce/{tasks,reports}

# List active worktrees
git worktree list

# Merge completed story into sprint branch
git checkout sprint/S-01
git merge story/STORY-001-01-login --no-ff -m "Merge STORY-001-01: {Story Name}"

# Remove worktree after merge
git worktree remove .worktrees/STORY-001-01-login
git branch -d story/STORY-001-01-login

# Merge sprint into main
git checkout main
git merge sprint/S-01 --no-ff -m "Sprint S-01: {Sprint Goal}"
```

---

## Orchestration Patterns

### Pattern 1: Claude Code Subagents (Primary)

The Team Lead spawns agents using Claude Code's Task tool. Each subagent works inside the story's worktree.

**Critical:** Always set the working directory to the worktree when delegating:
```
Lead: "Use the developer subagent. Working directory: .worktrees/STORY-001-01-login/
       Read the story spec at product_plans/sprints/sprint-{XX}/STORY-001-01-login.md
       and implement it.
       Write the implementation report to .vbounce/reports/STORY-001-01-login-dev.md"
```

**Parallel delegation (independent stories in separate worktrees):**
```
Lead: "Use the developer subagent in .worktrees/STORY-001-01-login/"
      AND "Use the developer subagent in .worktrees/STORY-001-02-auth/"
      (safe — each worktree is fully isolated)
```

**Background delegation:**
Press Ctrl+B for long-running agent tasks. Background agents auto-deny unknown permissions.

### Pattern 2: Agent Teams (Experimental)

For sustained parallel coordination with inter-agent messaging. Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Each teammate works in a dedicated worktree.

### Pattern 3: File-Based Handoffs (Cross-Tool Fallback)

For tools without native subagent support (Cursor, Codex, Gemini, Antigravity):

1. Lead writes a task file to `.worktrees/STORY-{ID}-{StoryName}/.vbounce/tasks/STORY-{ID}-{StoryName}-{agent}.md`
2. Open the worktree directory in the target tool (Cursor, Antigravity, etc.)
3. Agent reads the task file, executes, writes report to `.vbounce/reports/`
4. Lead monitors reports from the main repo

---

## The Report Buffer (Hybrid Model)

**During bounce:** Reports live INSIDE the story's worktree at `.worktrees/STORY-{ID}-{StoryName}/.vbounce/reports/`. This keeps reports co-located with the code they describe.

**After story completes:** Reports are archived to the shared `.vbounce/archive/S-{XX}/STORY-{ID}-{StoryName}/` in the main repo before the worktree is removed.

**Sprint Report:** Always written to `.vbounce/sprint-report-S-{XX}.md` in the main repo (not in any worktree).

### Report File Naming

`STORY-{EpicID}-{StoryID}-{agent}[-bounce{N}].md`

Examples:
- `STORY-001-01-login-dev.md` — first Dev report
- `STORY-001-01-login-qa-bounce1.md` — first QA report (found bugs)
- `STORY-001-01-login-dev-bounce2.md` — Dev's fix after QA bounce
- `STORY-001-01-login-qa-bounce2.md` — second QA report (passed)
- `STORY-001-01-login-arch.md` — Architect audit
- `STORY-001-01-login-devops.md` — DevOps merge report
- `STORY-001-01-login-conflict.md` — Spec conflict (if any)
- `sprint-S-01-devops.md` — Sprint release report
- `sprint-S-01-scribe.md` — Documentation generation report

---

## The Bounce Sequence

### Architect Sprint Design Review (Phase 2 → Phase 3 transition)

After doc-manager refines all stories (§1, §2, §3 complete) and BEFORE human confirms Sprint Plan:

1. **Check for Explorer context pack:**
   - If `.vbounce/context-packs/sprint-design-review-S-{XX}-*.md` exists, provide it to the Architect
   - Otherwise, the Architect will read the codebase directly (more tokens, same result)

2. **Spawn Architect subagent** with:
   - All candidate stories' §3 Implementation Guides
   - Roadmap §3 ADRs
   - FLASHCARDS.md
   - Risk Registry
   - Explorer context pack (if available)
   - Sprint Plan file path (for writing §2)
   - Task instruction: "SPRINT DESIGN REVIEW — Write Sprint Plan §2 Execution Strategy. You have WRITE ACCESS to Sprint Plan §2 ONLY."

3. **Architect writes Sprint Plan §2** with:
   - Phase Plan (parallel/sequential grouping)
   - Merge Ordering (based on shared file surface analysis)
   - Shared Surface Warnings (files touched by multiple stories)
   - Execution Mode Recommendations (overrides from default labels)
   - ADR Compliance Notes (flags for story approaches conflicting with ADRs)
   - Risk Flags

4. **Team Lead verifies** §2 was written, then proceeds to human confirmation.

*(Skip this step for sprints with only L1/Fast Track stories.)*

### Step 0: Sprint Setup

**Prerequisite:** Sprint Planning (Phase 2) must be complete. The Sprint Plan must be in "Confirmed" status with human approval before proceeding.

```
0. Pre-sprint check (MANDATORY):
   Verify git working tree is clean before starting:
     git status --porcelain
   If there are uncommitted changes, commit or stash them FIRST.
   Sprint init will fail if the tree is dirty.

1. Cut sprint branch from main:
   git checkout -b sprint/S-01 main
   mkdir -p .vbounce/archive

1b. Initialize sprint state (MANDATORY):
   ./.vbounce/scripts/run_script.sh init_sprint.mjs S-{XX} --stories STORY-ID1,STORY-ID2,...
   - Extract story IDs from the confirmed Sprint Plan §1 table
   - This creates .vbounce/state.json — required by all downstream scripts
   - If state.json already exists for this sprint, the script will warn and overwrite
   - Verify success: run_script.sh validate_state.mjs
   - If this step fails, DO NOT proceed — no scripts will work without state.json

2. Verify Sprint Plan:
   - Sprint Plan status must be "Confirmed" (human-approved in Phase 2)
   - §0 Sprint Readiness Gate must be fully checked
   - §3 Sprint Open Questions must have no unresolved blocking items
   If any check fails, return to Phase 2 (Sprint Planning).

3. If vdocs/_manifest.json exists, read it.
   Understand what's already documented — this informs which stories
   may require doc updates after the sprint.

4. **Hotfix Path** (L1 Trivial tasks only — triaged during Phase 1):
   a. Create `HOTFIX-{Date}-{Name}.md` using the template.
   b. Delegate to Developer (no worktree needed if acting on active branch).
   c. Developer runs `run_script.sh hotfix_manager.sh ledger "{Title}" "{Description}"` after implementation.
   d. Human/Lead verifies manually.
   e. DevOps runs `run_script.sh hotfix_manager.sh sync` to update any active story worktrees.
   f. Update Sprint Plan status to "Done".

5. **Gate Config Check**:
   - If `.vbounce/gate-checks.json` does not exist, run `./.vbounce/scripts/run_script.sh init_gate_config.sh` to auto-detect the project stack and generate default gate checks.
   - If it exists, verify it's current (stack detection may have changed).

6. **Parallel Readiness Check** (before bouncing multiple stories simultaneously):
   - Verify test runner config excludes `.worktrees/` (vitest, jest, pytest, etc.)
   - Verify no shared mutable state between worktrees (e.g., shared temp files, singletons writing to same path)
   - Verify `.gitignore` includes `.worktrees/`
   If any check fails, fix before spawning parallel stories. Intermittent test failures from worktree cross-contamination erode trust in the test suite fast.

7. **Sprint Context File** — create `.vbounce/sprint-context-S-{XX}.md` using the sprint context template (`.vbounce/templates/sprint_context.md`):
   - Populate with cross-cutting rules that ALL agents must follow during this sprint
   - Include: design tokens, UI conventions, shared patterns, locked dependency versions, any active FLASHCARDS.md rules that apply broadly
   - This file is included in EVERY agent task file for this sprint
   - Update it when mid-sprint decisions affect all stories (e.g., "we decided to use X pattern everywhere")

8. Update sprint-{XX}.md: Status → "Active"
```

**Note:** Risk assessment, dependency checks, scope selection, and execution mode decisions all happen during Sprint Planning (Phase 2), not here. Step 0 executes the confirmed plan.

### Step 0.5: Discovery Check (L4 / 🔴 Stories Only)

Before moving any story to Ready to Bounce:

1. For each story with `complexity_label: L4` or `ambiguity: 🔴 High`:
   - Check for linked spikes in `product_plans/backlog/EPIC-{NNN}_{name}/SPIKE-*.md`
   - If no spikes exist → create them (invoke doc-manager ambiguity rubric)
   - If spikes exist but are not Validated/Closed → execute discovery sub-flow
   - See `.vbounce/skills/agent-team/references/discovery.md`

2. Once all spikes are Validated/Closed:
   - Update story `ambiguity` frontmatter (should now be 🟡 or 🟢)
   - Transition: Probing/Spiking → Refinement → Ready to Bounce

### Step 1: Story Initialization
For each story with V-Bounce State "Ready to Bounce":

**1a. Pre-bounce gate (MANDATORY):**
```bash
./.vbounce/scripts/run_script.sh validate_bounce_readiness.mjs STORY-{ID}
```
This checks: state.json exists and story is "Ready to Bounce", story spec has §1/§2/§3, and **git working tree is clean** (no uncommitted changes). If it fails, fix the errors before proceeding. Do NOT skip this step — uncommitted changes will not appear in the worktree.

**1b. Create worktree:**
```bash
git worktree add .worktrees/STORY-{ID}-{StoryName} -b story/STORY-{ID}-{StoryName} sprint/S-01
mkdir -p .worktrees/STORY-{ID}-{StoryName}/.vbounce/{tasks,reports}
```
- Read the full Story spec
- Read FLASHCARDS.md
- Check RISK_REGISTRY.md for risks tagged to this story or its Epic
- If `vdocs/_manifest.json` exists, identify docs relevant to this story's scope (match against manifest descriptions/tags). Include relevant doc references in the task file so the Developer has product context.
- **Adjacent implementation check:** For stories that modify or extend modules touched by earlier stories in this sprint, identify existing implementations the Developer should reuse. Add to the task file: `"Reuse these existing modules: {list with file paths and brief description of what each provides}"`. This prevents agents from independently re-implementing logic that already exists — a common source of duplication when stories run in parallel.
- **Include Sprint Context:** Copy `.vbounce/sprint-context-S-{XX}.md` into the task file or reference it. Every agent must read the sprint context before starting work.
- Create task file in `.worktrees/STORY-{ID}-{StoryName}/.vbounce/tasks/`
- Update state:
  ```bash
  ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} "Bouncing"
  ```
  Then update sprint-{XX}.md §1: V-Bounce State → "Bouncing"

### Step 2: Developer Pass

#### 2a. Check TDD Applicability
Read the story's TDD Red Phase declaration (below §1.3 Out of Scope).
- If "TDD Red Phase: No" → skip to Step 2e (single-pass implementation)
- If "TDD Red Phase: Yes" → proceed to Step 2b

#### 2b. Red Phase (Tests Only)
```
1. Spawn developer subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - Story §1 The Spec + §2 The Truth + §3 Implementation Guide
   - FLASHCARDS.md
   - Relevant react-best-practices rules
   - Adjacent module references (if any)
   - Task instruction: "RED PHASE — Write tests ONLY. Do NOT write implementation code.
     Cover all Gherkin scenarios from §2.1. Write both unit and acceptance/E2E tests.
     Exit when tests are written."
2. After Developer exits:
   - Read Developer's output to identify test file paths
   - Run the test suite in the worktree
   - Verify tests FAIL (expected — no implementation yet)
   - If tests PASS: note as concern in Green phase task (tests may be testing existing behavior)
```

#### 2c. Test Pattern Validation (Team Lead Gate)

Before spawning the Green Phase Developer, the Team Lead validates the Red Phase test output:

```
1. Read every test file written during Red Phase
2. Validate test patterns:
   - Mock setup is correct for the project's test framework (e.g., vi.hoisted vs require, arrow vs function constructors)
   - Import patterns match the project's module system (ESM vs CJS)
   - Test file locations follow project conventions
   - Assertions test meaningful behavior, not implementation details
3. If test patterns have framework incompatibilities:
   - Team Lead fixes the test patterns directly (mock setup, imports, constructors)
   - Document what was changed and why in the Green Phase task file
   - Re-run the test suite to confirm tests still fail (expected) and are discoverable
4. If tests are structurally sound → proceed to 2d
```

**Critical rule:** The Developer NEVER modifies Red Phase tests. Only the Team Lead may fix test patterns between Red and Green phases. This prevents the Green Phase Developer from weakening tests to make implementation easier.

#### 2d. Green Phase (Implementation)
```
1. Spawn developer subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - Story §1 The Spec + §3 Implementation Guide
   - FLASHCARDS.md
   - Relevant react-best-practices rules
   - Adjacent module references (if any)
   - Task instruction: "GREEN PHASE — Implement code to make these tests pass.
     Test files written during Red phase:
     - {file paths from 2b}
     Test run result: {N} tests, 0 passed, {N} failed (as expected)
     Read the test files from disk. Write minimum code to make them pass.
     Then REFACTOR for readability/architecture without breaking tests.
     You MUST NOT modify the test files. If you hit a framework incompatibility
     that prevents tests from passing without changing the test setup, STOP
     and write a blockers report (see circuit breaker rule below)."
   - If Team Lead fixed test patterns in Step 2c, include:
     "Test patterns fixed by Team Lead before this phase:
     - {description of each fix and why it was needed}"
2. Developer writes code and Implementation Report to .vbounce/reports/
3. Lead reads report, verifies completeness
```

#### 2e. Single-Pass (Non-TDD Stories)
For stories declaring "TDD Red Phase: No":
```
1. Spawn developer subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - Story §1 The Spec + §3 Implementation Guide
   - FLASHCARDS.md
   - Relevant react-best-practices rules
   - Adjacent module references (if any)
2. Developer writes code and Implementation Report to .vbounce/reports/
3. Lead reads report, verifies completeness
```

#### 2f. Green Phase Circuit Breaker (Blockers Report Handling)

If the Developer writes a **Blockers Report** instead of an Implementation Report (triggered by the circuit breaker — ~50 tool calls with no progress):

```
1. Team Lead reads .vbounce/reports/STORY-{ID}-{StoryName}-dev-blockers.md
2. Diagnose the blocker category:
   a) TEST PATTERN ISSUE (mock setup, framework compat, import style):
      - Team Lead fixes the test files directly
      - Document fixes in a new Green Phase task file
      - Re-launch Developer at Step 2d with fixed tests + blocker context
   b) SPEC GAP (missing scenario, contradictory requirements, untestable as written):
      - Return story to Refinement (reset bounce counters)
      - Present spec gap to human for resolution
   c) ENVIRONMENT ISSUE (missing dependency, service unavailable, config problem):
      - Present to human with fix options
      - Re-launch Developer after environment is fixed
3. If the same story triggers the circuit breaker 3+ times → Escalate to human
   ```bash
   ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} "Escalated"
   ```
   Update sprint-{XX}.md §1 accordingly. Present all blockers reports as evidence.
```

### Step 3: QA Pass
```
0. Run pre-QA gate scan:
   ./.vbounce/scripts/run_script.sh pre_gate_runner.sh qa .worktrees/STORY-{ID}-{StoryName}/ sprint/S-{XX}
   - If scan FAILS on trivial issues (debug statements, missing JSDoc, TODOs):
     Return to Developer for quick fix. Do NOT spawn QA for mechanical failures.
     If pre-gate scan fails 3+ times → Escalate: present failures to human with options:
       a) Human fixes manually, b) Descope the story, c) Re-assign to a different approach.
   - If scan PASSES: Include scan output path in the QA task file.
1. Spawn qa subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - Developer Implementation Report
   - Pre-QA scan results (.vbounce/reports/pre-qa-scan.txt)
   - Story §2 The Truth (acceptance criteria)
   - FLASHCARDS.md
2. QA validates against Gherkin scenarios, runs vibe-code-review
   (skipping checks already covered by pre-qa-scan.txt)
3. If FAIL:
   - QA writes Bug Report (STORY-{ID}-{StoryName}-qa-bounce{N}.md)
   - Increment bounce counter:
     ```bash
     ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} --qa-bounce
     ```
   - If QA bounce count >= 3:
     ```bash
     ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} "Escalated"
     ```
     Update sprint-{XX}.md §1 accordingly. STOP.
   - Else → Return to Step 2 with Bug Report as input
4. If PASS:
   - QA writes Validation Report
   - Update state:
     ```bash
     ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} "QA Passed"
     ```
     Then update sprint-{XX}.md §1: V-Bounce State → "QA Passed"
```

### Step 4: Architect Pass
```
0. Run pre-Architect gate scan:
   ./.vbounce/scripts/run_script.sh pre_gate_runner.sh arch .worktrees/STORY-{ID}-{StoryName}/ sprint/S-{XX}
   - If scan reveals new dependencies or structural violations:
     Return to Developer for resolution. Do NOT spawn Architect for mechanical failures.
     If pre-gate scan fails 3+ times → Escalate to human (same options as pre-QA escalation).
   - If scan PASSES: Include scan output path in the Architect task file.
1. Spawn architect subagent in .worktrees/STORY-{ID}-{StoryName}/ with:
   - All reports for this story
   - Pre-Architect scan results (.vbounce/reports/pre-arch-scan.txt)
   - Full Story spec + Roadmap §3 ADRs
   - FLASHCARDS.md
2. If FAIL:
   - Increment Architect bounce counter:
     ```bash
     ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} --arch-bounce
     ```
   - If Architect bounce count >= 3:
     ```bash
     ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} "Escalated"
     ```
     Update sprint-{XX}.md §1 accordingly. STOP.
   - Else → Return to Step 2 with Architect feedback as input
3. If PASS:
   - Update state:
     ```bash
     ./.vbounce/scripts/run_script.sh update_state.mjs STORY-{ID} "Architect Passed"
     ```
     Then update sprint-{XX}.md §1: V-Bounce State → "Architect Passed"

*(Note: If the Team Lead assigned this story to the "Fast Track" execution mode, skip Steps 3 and 4 entirely. The Developer passes directly to Step 5: DevOps Story Merge.)*
```

### Step 5: Story Merge (DevOps)
```
0. Verify gate reports exist (MANDATORY before merge):
   - Dev report:  .worktrees/STORY-{ID}-{StoryName}/.vbounce/reports/STORY-{ID}-{StoryName}-dev*.md
   - QA report:   .worktrees/STORY-{ID}-{StoryName}/.vbounce/reports/STORY-{ID}-{StoryName}-qa*.md
   - Arch report: .worktrees/STORY-{ID}-{StoryName}/.vbounce/reports/STORY-{ID}-{StoryName}-arch*.md
   If ANY report is missing, DO NOT proceed with merge.
   Return to Lead with: which reports are missing and which agents need to re-run.
   (Fast Track stories skip QA/Arch — only Dev report required.)
1. Spawn devops subagent with:
   - Story ID and sprint branch name
   - All gate reports (QA PASS + Architect PASS)
   - FLASHCARDS.md
2. DevOps performs:
   - Pre-merge checks (worktree clean, gate reports verified)
   - Archive reports to .vbounce/archive/S-{XX}/STORY-{ID}-{StoryName}/
   - Merge story branch into sprint branch (--no-ff)
   - Post-merge validation (tests + lint + build on sprint branch)
   - Worktree removal and story branch cleanup
3. DevOps writes Merge Report to .vbounce/archive/S-{XX}/STORY-{ID}-{StoryName}/STORY-{ID}-{StoryName}-devops.md
4. If merge conflicts:
   - Simple (imports, whitespace): DevOps resolves directly
   - Complex (logic): DevOps writes Conflict Report, Lead creates fix story
5. If post-merge tests fail:
   - DevOps reverts the merge and writes a Post-Merge Failure Report (what failed, which tests, suspected cause)
   - Lead returns story to Developer with the failure report as input
   - Developer fixes in the original worktree (which is preserved until merge succeeds)
   - Story re-enters the bounce at Step 2 (Dev pass). QA/Arch bounce counts are NOT reset — this is a merge issue, not a gate failure.
   - If post-merge fails 3+ times → Escalate to human
```
Update state and sprint plan atomically:
```bash
./.vbounce/scripts/run_script.sh complete_story.mjs STORY-{ID} --qa-bounces {N} --arch-bounces {N} --correction-tax {N} --notes "{summary}"
```
This updates both state.json and sprint-{XX}.md §1 + §4 in one step.

### Step 5.5: Immediate Lesson Recording
After each story merge, before proceeding to the next story:
```
1. Read Dev report — check `lessons_flagged` field
2. Read QA report — check for lessons flagged during validation
3. For each flagged lesson:
   - Present to the human for approval
   - If approved → record to FLASHCARDS.md immediately (follow lesson skill format)
   - If rejected → note as "No" in Sprint Report §4
4. Do NOT defer this to Step 7 — context decays fast
```

### Step 5.7: User Walkthrough (Post-Delivery Review)
After all stories are merged but BEFORE Sprint Integration Audit:
```
1. Present the user with a summary of what was built (from Dev reports)
2. Ask the user to test the running app and provide feedback
3. Track feedback as one of:
   - "Review Feedback" — UI tweaks, copy changes, minor adjustments
   - "Bug" — something broken that should have been caught
4. Review Feedback items:
   - Do NOT count toward Correction Tax — this is healthy iteration
   - Create quick-fix tasks delegated to Developer on the sprint branch
   - Each fix gets a mini Dev→QA cycle (no Architect pass needed)
5. Bug items:
   - Count toward Correction Tax as "Bug Fix" sub-category
   - Route through normal bounce flow (Dev→QA→Arch if needed)
6. Log all walkthrough items in sprint-{XX}.md §4 Execution Log with event type `UR` (User Review)
7. When user confirms "looks good" or no more feedback → proceed to Step 6
```

This phase gives ad-hoc post-delivery feedback a proper home. Without it, users give feedback after sprint close, which gets tracked as correction tax and skews metrics.

### Step 6: Sprint Integration Audit
After ALL stories are merged into `sprint/S-01`:
```
1. Spawn architect subagent on sprint/S-01 branch
2. First, Architect runs `./.vbounce/scripts/run_script.sh hotfix_manager.sh audit` to check for hotfix drift. If it fails, perform deep audit on flagged files.
3. Run Sprint Integration Audit — Deep Audit on combined changes
4. Check for: duplicate routes, competing state, overlapping migrations
5. If issues found:
   - Present findings to human with severity assessment
   - AI suggests which epic the fix story should belong to
   - Fix stories are added to the BACKLOG (not the current sprint) — they enter the next sprint through normal planning
   - Exception: if the issue blocks the sprint release (e.g., broken build), fix inline on the sprint branch without creating a story
```

### Step 7: Sprint Consolidation
```
1. Read all archived reports in .vbounce/archive/S-{XX}/
2. **Aggregate token usage** from every agent report:
   - Sum `input_tokens`, `output_tokens`, and `total_tokens` fields separately from all agent report YAML frontmatter.
   - If an agent report has `total_tokens: 0` (script failed), use the task notification `total_tokens` from when that agent completed. Task notification totals are the authoritative LLM usage numbers. Note: task notifications only provide a single total — record it as `total_tokens` with input/output marked as "unknown".
   - Cross-check: if `count_tokens.mjs` totals and task notification totals diverge by >20%, prefer task notification totals (they reflect actual API consumption).
   - Also run `vbounce tokens --sprint S-{XX} --json` to get per-story aggregates from story document Token Usage tables as a third data source.
3. Generate Sprint Report to .vbounce/sprint-report-S-{XX}.md:
   - Ensure the Sprint Report starts with a YAML frontmatter block containing:
     ```yaml
     ---
     total_input_tokens: {sum of input tokens}
     total_output_tokens: {sum of output tokens}
     total_tokens_used: {sum of all agent tokens}
     ---
     ```
4. V-Bounce State → "Sprint Review" for all stories
4. Present Sprint Report to human
5. **Lesson Review (non-blocking):**
   Most lessons should already be recorded to FLASHCARDS.md during Step 5.5.
   Review §4 of the Sprint Report — confirm all flagged lessons have a status.
   If any lessons were missed during Step 5.5, present them now and record approved ones.
   This is a review step, not a first-time approval gate.
6. After review → Spawn devops subagent for Sprint Release:
   - Merge sprint/S-01 → main (--no-ff)
   - Tag release: v{VERSION}
   - Run full test suite + build + lint on main
   - Sprint branch cleanup
   - Environment verification (if applicable)
   - DevOps writes Sprint Release Report to .vbounce/archive/S-{XX}/sprint-S-{XX}-devops.md
6. Lead finalizes:
   - Move sprint-report-S-{XX}.md to .vbounce/archive/S-{XX}/
   - Record lessons (with user approval)
   - Update Roadmap §7 Delivery Log to reflect the completed sprint.
7. **Framework Self-Assessment** (aggregated from agent reports):
   - Collect all `## Process Feedback` sections from agent reports in `.vbounce/archive/S-{XX}/`
   - Populate §5 Framework Self-Assessment tables in the Sprint Report by category
   - **Always run** `run_script.sh suggest_improvements.mjs` — every sprint, unconditionally. First sprints generate the most friction.
   - **Verbally present** the top improvement suggestions to the user. Do NOT just embed them in the report — tell the user directly:
     - Summarize each P0/P1 suggestion in plain language (what's broken, why it matters, what to change)
     - For P2/P3 suggestions, give a brief list and note they're in `.vbounce/improvement-suggestions.md`
     - Ask the user: *"Want me to run `/improve` to apply any of these?"*
   - If user approves → read `.vbounce/skills/improve/SKILL.md` and execute the improvement process
8. Product Documentation check (runs on `main` after sprint merge):
   a. **Staleness Detection** — run `./.vbounce/scripts/run_script.sh vdoc_staleness.mjs S-{XX}`
      - Cross-references all Dev Reports' `files_modified` against manifest key files
      - Generates `.vbounce/scribe-task-S-{XX}.md` with targeted list of stale docs
      - Populates Sprint Report §1 "Product Docs Affected" table
      - If no `vdocs/_manifest.json` exists → skip silently (graceful no-op)
   b. **Scribe Task Decision:**
      - If staleness detection found stale docs → offer targeted Scribe task
      - If sprint delivered 3+ features and no vdocs exist → offer vdoc init
      - If any Developer report flagged stale product docs → offer Scribe update
   c. If user approves → spawn scribe subagent on `main` branch with:
      - `.vbounce/scribe-task-S-{XX}.md` (targeted task — when available)
      - Sprint Report (what was built)
      - Dev reports that flagged affected product docs
      - Current _manifest.json (if exists)
      - Mode: "audit" (if docs exist) or "init" (if first time)
   d. Scribe generates/updates docs and writes Scribe Report
      - Documentation is post-implementation — it reflects what was built
      - Scribe commits documentation as a follow-up commit on `main`
```

---

## Cleanup Process

### After Each Story Completes (DevOps handles via Step 5)
1. Archive reports to `.vbounce/archive/S-{XX}/STORY-{ID}-{StoryName}/`
2. Merge story branch into sprint branch (--no-ff)
3. Validate tests/build on sprint branch
4. Remove worktree: `git worktree remove .worktrees/STORY-{ID}-{StoryName}`
5. Delete story branch: `git branch -d story/STORY-{ID}-{StoryName}`
6. Write DevOps Merge Report

### After Sprint Completes (DevOps handles via Step 7)
1. Merge sprint branch into main (--no-ff)
2. Tag release: `git tag -a v{VERSION}`
3. Run full validation (tests + build + lint)
4. Delete sprint branch: `git branch -d sprint/S-{XX}`
5. Verify `.worktrees/` is empty (all worktrees removed)
6. Write Sprint Release Report
7. Lead archives the sprint folder to `archive/` according to doc-manager physical move rules.

### After Release Completes (Team Lead handles)
When ALL sprints in a release are done:
1. Verify all stories in the release are "Done" in the Roadmap §2 Release Plan
2. Add a **Delivery Log** entry to the Roadmap (§7):
   - Release name, date, release tag
   - Release Notes — summarize all sprint reports from this release
   - Key metrics (stories delivered, bounce ratio, correction tax averages)
3. Update Roadmap §2 Release Plan: set the release status to "Delivered"

### Retention
- `.vbounce/archive/` is **committed to git** — full sprint history, all agent reports, audit trail
- `.vbounce/reports/` and `.vbounce/sprint-report.md` are **gitignored** — active working files only
- `product_plans/archive/` retains completed sprints and epics
- `.worktrees/` is **gitignored** — ephemeral, exists only during active bouncing
- Story branches are deleted after merge
- Sprint branches are deleted after merge to main

---

## Sprint Plan Sync

The Team Lead MUST update **both** `state.json` and `sprint-{XX}.md` at every state transition. Run the script first, then update the markdown.

| Action | Script Command | Sprint Plan Update |
|--------|---------------|-------------------|
| Worktree created | `run_script.sh update_state.mjs STORY-{ID} "Bouncing"` | §1: V-Bounce State → "Bouncing" |
| Dev report written | — | No update (still "Bouncing") |
| QA bounce | `run_script.sh update_state.mjs STORY-{ID} --qa-bounce` | §1: Bounce count incremented |
| QA passes | `run_script.sh update_state.mjs STORY-{ID} "QA Passed"` | §1: V-Bounce State → "QA Passed" |
| Architect bounce | `run_script.sh update_state.mjs STORY-{ID} --arch-bounce` | §1: Bounce count incremented |
| Architect passes | `run_script.sh update_state.mjs STORY-{ID} "Architect Passed"` | §1: V-Bounce State → "Architect Passed" |
| DevOps merges story | `run_script.sh complete_story.mjs STORY-{ID} --qa-bounces N --arch-bounces N --correction-tax N` | §1 + §4 updated atomically by script |
| Escalated | `run_script.sh update_state.mjs STORY-{ID} "Escalated"` | §1: Move story to Escalated section |
| Sprint CLOSES | — | Status → "Completed" in frontmatter. Roadmap §7: add Delivery Log entry. |

> **Key rule**: `state.json` and the Sprint Plan must stay in sync. Always run the script command FIRST — if the script fails, do not update the markdown. The Sprint Plan is the human-readable source of truth; `state.json` is the machine-readable source of truth.

---

## Edge Case Handling

### Spec Conflict
Developer writes a Spec Conflict Report. Lead pauses the bounce:
- Remove worktree (preserve branch for reference)
- Return story to Refinement in sprint-{XX}.md and copy it back to backlog/
- After spec is fixed, recreate worktree and restart bounce

### Escalated Stories
When QA bounce count >= 3 OR Architect bounce count >= 3:
- Run `run_script.sh update_state.mjs STORY-{ID} "Escalated"` (if not already done at the transition point)
- Worktree is kept but frozen (no new work)
- Lead writes Escalation Report to `.vbounce/archive/S-{XX}/STORY-{ID}-{StoryName}/escalation.md`
- Human decides: rewrite spec → Refinement, descope → split, kill → Parking Lot
- **If returned to Refinement:** The spec has been rewritten. You MUST reset the QA and Architect bounce counters to 0 for this story. Run `run_script.sh update_state.mjs STORY-{ID} "Refinement"`.
- If killed: Run `run_script.sh update_state.mjs STORY-{ID} "Parking Lot"`. `git worktree remove`, branch preserved unmerged

### Mid-Sprint Change Requests
When the user provides input mid-bounce that isn't a direct answer to an agent question (e.g., "this is broken", "change the approach", "I meant X not Y"), the Team Lead MUST triage it before acting.

> See `.vbounce/skills/agent-team/references/mid-sprint-triage.md` for the full triage flow, routing rules, and logging requirements.

**Quick reference — categories:**
| Category | Route | Bounce Impact |
|----------|-------|---------------|
| **Bug** | Hotfix or bug-fix task in current story | No bounce increment |
| **Spec Clarification** | Update Story spec, continue bounce | No impact |
| **Scope Change** | Pause, update spec, confirm with user | Resets Dev pass |
| **Approach Change** | Update §3 Implementation Guide, re-delegate | Resets Dev pass |

Every change request is logged in `sprint-{XX}.md` §4 Execution Log with event type `CR` and reported in Sprint Report §2.1.

### Mid-Sprint Strategic Changes
Charter and Roadmap are typically **frozen** during active sprints. However, if an emergency requires modifying them:
1. You MUST pause active bouncing across all stories.
2. Delegate to doc-manager to run the **Sprint Impact Analysis Protocol**.
3. Evaluate the active stories in `sprint-{XX}.md` against the new strategy to determine if they are: Unaffected, Require Scope Adjustment, or Invalidated.
4. Only abort stories that are explicitly Invalidated by the human. Unaffected stories may resume bouncing.

### Merge Conflicts
If merging story branch into sprint branch creates conflicts:
- DevOps resolves simple conflicts (import ordering, adjacent edits, whitespace)
- Complex conflicts (logic changes, competing implementations): DevOps writes a Merge Conflict Report, Lead creates a new story to resolve through the normal bounce flow

---

## Script Execution Protocol

**All `.vbounce/scripts/*` invocations MUST go through the wrapper:**

```bash
./.vbounce/scripts/run_script.sh <script-name> [args...]
```

**Never call scripts directly.** The wrapper captures exit codes, stdout, and stderr separately, runs pre-flight checks (e.g. state.json existence), and on failure prints a structured diagnostic block with root cause and suggested fix.

### When a Script Fails

1. **Stop the current step.** Do not retry blindly or continue as if the script succeeded.
2. **Read the diagnostic block.** The wrapper prints the exit code, stderr, root cause, and a suggested fix.
3. **Attempt self-repair (once).** If the fix is within the agent's capability:
   - Missing `state.json` → run `run_script.sh init_sprint.mjs S-{XX} --stories {IDS}`
   - Invalid JSON → run `run_script.sh validate_state.mjs`, repair, retry
   - Missing file/directory → run `run_script.sh doctor.mjs`, fix what's reported, retry
   - Permission denied → `chmod +x` the script, retry
4. **Re-run through the wrapper.** If the retry succeeds, continue the step. Log the failure and fix in the agent report under `## Script Incidents`.
5. **Escalate if retry fails.** Write a **Script Failure Report** in the agent report and return it to the Lead:

```markdown
## Script Incidents

### [FAIL] {script_name} {args}
- **Exit code:** {N}
- **Stderr:** {first 10 lines}
- **Root cause:** {from diagnostic block or agent analysis}
- **Self-repair attempted:** {what was tried}
- **Status:** Resolved / Escalated
- **Suggested fix:** {if escalated — what the Lead or human should do}
```

6. **Lead routes escalated failures:**
   - Infrastructure issue (missing state, corrupt config) → Lead fixes and re-delegates
   - Script bug → Lead presents to human with the Script Failure Report and the diagnostic output
   - Repeated failure (same script fails 3+ times across stories) → Flag in Sprint Report §5 Framework Self-Assessment as a **Blocker**

---

## Critical Rules

- **All scripts go through run_script.sh.** Never invoke `.vbounce/scripts/*.mjs` or `*.sh` directly. The wrapper provides error capture, pre-flight validation, and structured diagnostics that agents depend on for self-repair.
- **The Lead never writes code.** It plans, delegates, monitors, and consolidates.
- **Enforce Sequential Dependencies.** Never parallelize stories where one depends on the other. Wait for merge.
- **One story = one worktree.** Never mix stories in a single worktree.
- **Reports are the only handoff.** No agent communicates with another directly.
- **One bounce = one report.** Every agent pass produces exactly one report file.
- **Archive before remove.** Always copy reports to shared archive before removing a worktree.
- **Sync the Sprint Plan.** Update V-Bounce State in sprint-{XX}.md §1 at EVERY transition. The Sprint Plan is the source of truth DURING the sprint. The Roadmap Delivery Log is updated at sprint close only.
- **Track bounce counts.** QA and Architect bounces are tracked separately per story.
- **Git tracking rules.** `.worktrees/`, `.vbounce/reports/`, and `.vbounce/sprint-report.md` are gitignored (ephemeral). `.vbounce/archive/` is **committed to git** (permanent audit trail).
- **Check risks before bouncing.** Read RISK_REGISTRY.md at sprint start. Flag high-severity risks that affect planned stories.
- **Resolve open questions first.** Read the active `sprint-{XX}.md` §2 Sprint Open Questions at sprint start. Do not bounce stories with unresolved blocking questions.
- **Know what's documented.** If `vdocs/_manifest.json` exists, read it at sprint start. Pass relevant doc references to agents. Offer documentation updates after sprints that deliver new features.
- **Resolve discovery before bouncing.** L4 stories and 🔴 ambiguity stories MUST complete spikes before entering the bounce sequence. See `.vbounce/skills/agent-team/references/discovery.md`.

## Keywords

delegate, orchestrate, subagent, agent team, bounce, sprint, report, worktree, git, isolation, merge, branch, cleanup, archive, delivery plan
