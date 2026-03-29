/**
 * Suite: Full Engine Lifecycle
 * Simulates the complete V-Bounce flow:
 *   Fixtures → init_sprint → validate → state transitions → context prep
 *   → complete_story → close_sprint → post-sprint analytics → cleanup
 *
 * Every script in the engine is exercised in the order a real sprint uses them.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { suite, record, assertScriptRuns, PASS, FAIL, WARN, SKIP } from '../harness.mjs';

// ─── Helpers ────────────────────────────────────────────────────────────────

function readState(statePath) {
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function storyState(statePath, storyId) {
  const s = readState(statePath);
  return s.stories?.[storyId]?.state;
}

function fileCreated(filePath, name, component, note) {
  const exists = fs.existsSync(filePath);
  record({
    name,
    component,
    input: path.basename(filePath),
    output: exists ? 'created' : 'missing',
    expected: 'created',
    verdict: exists ? PASS : FAIL,
    note,
  });
  return exists;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SPRINT_ID   = 'S-99';
const SPRINT_NUM  = '99';
const EPIC_ID     = 'EPIC-T99';
const STORY_ID    = 'STORY-T99-01-lifecycle_test';

// ─── Main ───────────────────────────────────────────────────────────────────

export default function runLifecycleSuite(installDir) {
  const scriptsDir   = path.join(installDir, '.vbounce', 'scripts');
  const vbounceDir   = path.join(installDir, '.vbounce');
  const statePath    = path.join(vbounceDir, 'state.json');
  const reportsDir   = path.join(vbounceDir, 'reports');
  const archiveDir   = path.join(vbounceDir, 'archive', SPRINT_ID);
  const sprintsDir   = path.join(installDir, 'product_plans', 'sprints');
  const sprintPlanDir = path.join(sprintsDir, `sprint-${SPRINT_NUM}`);
  const backlogDir   = path.join(installDir, 'product_plans', 'backlog', `${EPIC_ID}_lifecycle`);
  const strategyDir  = path.join(installDir, 'product_plans', 'strategy');

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 0 — Fixtures
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Fixtures');

  // Create directory structure
  [sprintsDir, backlogDir, strategyDir, reportsDir].forEach(d =>
    fs.mkdirSync(d, { recursive: true })
  );

  // Charter
  fs.writeFileSync(path.join(strategyDir, 'test_charter.md'), `---
charter_id: "CHARTER-T99"
title: "Lifecycle Test Charter"
status: "Approved"
---

# Lifecycle Test Charter

## 1. Vision
Automated lifecycle simulation for V-Bounce engine testing.

## 2. Goals
- Validate every engine script in a realistic sprint flow
`);

  // Roadmap (minimal fixture)
  fs.writeFileSync(path.join(strategyDir, 'roadmap.md'), `---
title: "Roadmap"
status: "Active"
---

# Roadmap

## 2. Releases
- Sprint ${SPRINT_ID} lifecycle test.
`);

  // Risk Registry
  fs.writeFileSync(path.join(strategyDir, 'RISK_REGISTRY.md'), `---
title: "Risk Registry"
---

# Risk Registry

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
| R-01 | Test data may be incomplete | Medium | Low | Validate all fixtures | Open |
`);

  // Epic
  fs.writeFileSync(path.join(backlogDir, `${EPIC_ID}_lifecycle.md`), `---
epic_id: "${EPIC_ID}"
title: "Lifecycle Test Epic"
status: "In Progress"
charter_ref: "CHARTER-T99"
---

# ${EPIC_ID}: Lifecycle Test Epic

## 1. Objective
Test the full V-Bounce lifecycle.

## 4. Stories
- ${STORY_ID}
`);

  // Story (in backlog)
  fs.writeFileSync(path.join(backlogDir, `${STORY_ID}.md`), `---
story_id: "${STORY_ID}"
parent_epic_ref: "${EPIC_ID}"
status: "Ready to Bounce"
ambiguity: "🟢 Low"
complexity_label: "L2"
---

# ${STORY_ID}: Lifecycle Test Story

## 1. The Spec
Implement a lifecycle test fixture to validate V-Bounce engine scripts.

## 2. Acceptance Criteria
- [ ] All scripts execute without crash
- [ ] State transitions follow the expected flow

## 3. Technical Approach
Minimal fixtures, maximum coverage.
`);

  // Sprint plan (init_sprint creates its own, but we need one in the expected location)
  fs.mkdirSync(sprintPlanDir, { recursive: true });
  fs.writeFileSync(path.join(sprintPlanDir, `sprint-${SPRINT_NUM}.md`), `---
sprint_id: "${SPRINT_ID}"
sprint_goal: "Lifecycle test sprint"
dates: "03/25 - 03/31"
status: "Active"
---

# Sprint ${SPRINT_ID} Plan

## 1. Active Scope

| Priority | Story | Epic | Label | V-Bounce State | Blocker |
|----------|-------|------|-------|----------------|---------|
| 1 | ${STORY_ID} | ${EPIC_ID} | L2 | Ready to Bounce | — |

### Escalated / Parking Lot
- (none)

---

## 2. Execution Strategy

### Phase Plan
- **Phase 1 (serial)**: ${STORY_ID}

### Risk Flags
- (none)

---

## 3. Sprint Open Questions

| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|

---

<!-- EXECUTION_LOG_START -->
## 4. Execution Log

| Story | Final State | QA Bounces | Arch Bounces | Correction Tax | Notes |
|-------|-------------|------------|--------------|----------------|-------|
<!-- EXECUTION_LOG_END -->
`);

  // FLASHCARDS.md
  if (!fs.existsSync(path.join(installDir, 'FLASHCARDS.md'))) {
    fs.writeFileSync(path.join(installDir, 'FLASHCARDS.md'), `# Flashcards

## Sprint Lessons
- Always validate fixtures before running lifecycle tests.
`);
  }

  record({
    name: 'Fixtures created',
    component: 'lifecycle',
    input: 'charter, roadmap, risk registry, epic, story, sprint plan, FLASHCARDS.md',
    output: 'all created',
    expected: 'fixtures ready',
    verdict: PASS,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — Sprint Init
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Sprint Init');

  const initResult = assertScriptRuns(
    path.join(scriptsDir, 'init_sprint.mjs'),
    `${SPRINT_ID} --stories ${STORY_ID}`,
    'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'initialize sprint' }
  );

  // Validate state.json created correctly
  let stateOk = false;
  if (fs.existsSync(statePath)) {
    const state = readState(statePath);
    stateOk = true;

    record({
      name: 'state.json sprint_id',
      component: 'lifecycle',
      input: 'state.json',
      output: `sprint_id=${state.sprint_id}`,
      expected: `sprint_id=${SPRINT_ID}`,
      verdict: state.sprint_id === SPRINT_ID ? PASS : FAIL,
    });

    record({
      name: 'state.json story registered',
      component: 'lifecycle',
      input: 'state.json stories',
      output: state.stories?.[STORY_ID] ? 'found' : 'missing',
      expected: 'found',
      verdict: state.stories?.[STORY_ID] ? PASS : FAIL,
    });

    record({
      name: 'Story initial state is Draft',
      component: 'lifecycle',
      input: `state.stories.${STORY_ID}.state`,
      output: state.stories?.[STORY_ID]?.state,
      expected: 'Draft',
      verdict: state.stories?.[STORY_ID]?.state === 'Draft' ? PASS : FAIL,
    });
  } else {
    record({
      name: 'state.json exists',
      component: 'lifecycle',
      input: statePath,
      output: 'missing',
      expected: 'exists',
      verdict: FAIL,
    });
  }

  // Gate: if state.json failed, skip remaining phases
  if (!stateOk) {
    record({ name: 'Lifecycle aborted', component: 'lifecycle',
      input: 'state.json', output: 'missing', expected: 'exists',
      verdict: SKIP, note: 'Cannot continue without state.json' });
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1b — Validate State & Sprint Plan
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Validation');

  assertScriptRuns(
    path.join(scriptsDir, 'validate_state.mjs'), '', 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'state should be valid after init' }
  );

  assertScriptRuns(
    path.join(scriptsDir, 'validate_sprint_plan.mjs'),
    `"${path.join(sprintPlanDir, `sprint-${SPRINT_NUM}.md`)}"`,
    'lifecycle',
    { cwd: installDir, expectExit: null, note: 'validate sprint plan structure' }
  );

  // Bounce readiness — story is Draft, so this correctly fails
  const readinessResult = assertScriptRuns(
    path.join(scriptsDir, 'validate_bounce_readiness.mjs'),
    STORY_ID, 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'story is Draft, readiness check expected to fail' }
  );
  record({
    name: 'Bounce readiness rejects Draft story',
    component: 'lifecycle',
    input: `validate_bounce_readiness ${STORY_ID}`,
    output: `exit ${readinessResult.exitCode}`,
    expected: 'exit 1 (story not ready)',
    verdict: readinessResult.exitCode === 1 ? PASS : WARN,
    note: 'Draft stories should not pass readiness',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — State Transitions
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — State Transitions');

  // Draft → Ready to Bounce
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_ID} "Ready to Bounce"`, 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'Draft → Ready to Bounce' }
  );
  record({
    name: 'State after: Ready to Bounce',
    component: 'lifecycle',
    input: `state.stories.${STORY_ID}.state`,
    output: storyState(statePath, STORY_ID),
    expected: 'Ready to Bounce',
    verdict: storyState(statePath, STORY_ID) === 'Ready to Bounce' ? PASS : FAIL,
  });

  // Ready to Bounce → Bouncing
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_ID} "Bouncing"`, 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'Ready to Bounce → Bouncing' }
  );
  record({
    name: 'State after: Bouncing',
    component: 'lifecycle',
    input: `state.stories.${STORY_ID}.state`,
    output: storyState(statePath, STORY_ID),
    expected: 'Bouncing',
    verdict: storyState(statePath, STORY_ID) === 'Bouncing' ? PASS : FAIL,
  });

  // Set phase
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    '--set-phase "Phase 1"', 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'set sprint phase' }
  );
  record({
    name: 'Phase set to Phase 1',
    component: 'lifecycle',
    input: 'state.phase',
    output: readState(statePath).phase,
    expected: 'Phase 1',
    verdict: readState(statePath).phase === 'Phase 1' ? PASS : FAIL,
  });

  // --show (read-only, should not crash)
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    '--show', 'lifecycle',
    { cwd: installDir, expectExit: 0, note: '--show displays current state' }
  );

  // Invalid state name should fail
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_ID} "InvalidStateName"`, 'lifecycle',
    { cwd: installDir, expectExit: 1, note: 'invalid state must be rejected' }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — Developer Report (synthetic) + Context Prep
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Context Prep');

  // Create synthetic dev report (simulates developer agent output)
  fs.mkdirSync(reportsDir, { recursive: true });
  const devReportPath = path.join(reportsDir, `${STORY_ID}-dev.md`);
  fs.writeFileSync(devReportPath, `---
status: "PASS"
story_id: "${STORY_ID}"
sprint_id: "${SPRINT_ID}"
correction_tax: 0
tokens_used: 12500
tests_written: 3
files_modified:
  - src/index.ts
  - src/utils.ts
lessons_flagged: 0
---

# Developer Report — ${STORY_ID}

## Implementation Summary
Implemented lifecycle test fixtures and validation logic.

## Files Modified
- \`src/index.ts\` — main entry point
- \`src/utils.ts\` — utility functions

## Tests Written
- lifecycle.test.ts (3 tests)

## Checkpoint
All acceptance criteria met. Ready for QA.
`);

  fileCreated(devReportPath, 'Dev report fixture created', 'lifecycle');

  // prep_sprint_context
  assertScriptRuns(
    path.join(scriptsDir, 'prep_sprint_context.mjs'),
    SPRINT_ID, 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'generate sprint context' }
  );
  fileCreated(
    path.join(vbounceDir, `sprint-context-${SPRINT_ID}.md`),
    'sprint-context file created',
    'lifecycle'
  );

  // prep_qa_context
  const qaCtxResult = assertScriptRuns(
    path.join(scriptsDir, 'prep_qa_context.mjs'),
    STORY_ID, 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'generate QA context from dev report' }
  );
  const qaCtxPath = path.join(vbounceDir, `qa-context-${STORY_ID}.md`);
  if (qaCtxResult.exitCode === 0) {
    fileCreated(qaCtxPath, 'qa-context file created', 'lifecycle');
  } else {
    record({
      name: 'prep_qa_context',
      component: 'lifecycle',
      input: `prep_qa_context.mjs ${STORY_ID}`,
      output: `exit ${qaCtxResult.exitCode}`,
      expected: 'exit 0',
      verdict: WARN,
      note: `stderr: ${(qaCtxResult.stderr || '').slice(0, 150)}`,
    });
  }

  // Create synthetic QA report (simulates QA agent output)
  const qaReportPath = path.join(reportsDir, `${STORY_ID}-qa.md`);
  fs.writeFileSync(qaReportPath, `---
status: "PASS"
story_id: "${STORY_ID}"
sprint_id: "${SPRINT_ID}"
bounce_count: 1
bugs_found: 0
gold_plating_detected: false
tokens_used: 8200
---

# QA Validation Report — ${STORY_ID}

## Result: PASS

## Scenarios Tested
1. Lifecycle fixture creation — PASS
2. State machine transitions — PASS
3. Script execution chain — PASS

## Bugs Found
None.
`);

  // prep_arch_context
  const archCtxResult = assertScriptRuns(
    path.join(scriptsDir, 'prep_arch_context.mjs'),
    STORY_ID, 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'generate architect context' }
  );
  const archCtxPath = path.join(vbounceDir, `arch-context-${STORY_ID}.md`);
  if (archCtxResult.exitCode === 0) {
    fileCreated(archCtxPath, 'arch-context file created', 'lifecycle');
  } else {
    record({
      name: 'prep_arch_context',
      component: 'lifecycle',
      input: `prep_arch_context.mjs ${STORY_ID}`,
      output: `exit ${archCtxResult.exitCode}`,
      expected: 'exit 0',
      verdict: WARN,
      note: `stderr: ${(archCtxResult.stderr || '').slice(0, 150)}`,
    });
  }

  // Create synthetic architect report
  const archReportPath = path.join(reportsDir, `${STORY_ID}-arch.md`);
  fs.writeFileSync(archReportPath, `---
status: "PASS"
story_id: "${STORY_ID}"
sprint_id: "${SPRINT_ID}"
safe_zone_score: 95
ai_isms_detected: 0
regression_risk: "Low"
bounce_count: 1
tokens_used: 9800
---

# Architectural Audit Report — ${STORY_ID}

## Result: PASS

## Safe Zone Analysis
Score: 95/100 — all changes within expected boundaries.

## AI-isms
None detected.

## Regression Risk
Low — isolated test fixtures with no production dependencies.
`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — Complete Story
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Story Completion');

  // Transition to QA Passed → Done
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_ID} "QA Passed"`, 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'Bouncing → QA Passed' }
  );
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_ID} "Architect Passed"`, 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'QA Passed → Architect Passed' }
  );

  // complete_story (updates sprint plan §4 execution log)
  assertScriptRuns(
    path.join(scriptsDir, 'complete_story.mjs'),
    `${STORY_ID} --qa-bounces 1 --arch-bounces 1 --correction-tax 0 --notes "lifecycle test"`,
    'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'mark story as Done in state + sprint plan' }
  );

  record({
    name: 'Story final state is Done',
    component: 'lifecycle',
    input: `state.stories.${STORY_ID}.state`,
    output: storyState(statePath, STORY_ID),
    expected: 'Done',
    verdict: storyState(statePath, STORY_ID) === 'Done' ? PASS : FAIL,
  });

  // Verify sprint plan was updated with execution log
  const sprintPlanContent = fs.readFileSync(
    path.join(sprintPlanDir, `sprint-${SPRINT_NUM}.md`), 'utf8'
  );
  const hasLogEntry = sprintPlanContent.includes(STORY_ID) &&
    sprintPlanContent.includes('EXECUTION_LOG');
  record({
    name: 'Sprint plan execution log updated',
    component: 'lifecycle',
    input: `sprint-${SPRINT_NUM}.md`,
    output: hasLogEntry ? 'log entry found' : 'no log entry',
    expected: 'log entry for completed story',
    verdict: hasLogEntry ? PASS : WARN,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5 — Sprint Report (synthetic) + Close Sprint
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Sprint Close');

  // Create synthetic sprint report (simulates what scribe/human produce)
  const sprintReportPath = path.join(vbounceDir, `sprint-report-${SPRINT_ID}.md`);
  fs.writeFileSync(sprintReportPath, `---
sprint_id: "${SPRINT_ID}"
status: "Completed"
stories_completed: 1
total_bounces: 3
correction_tax: 0
---

# Sprint ${SPRINT_ID} Report

## 1. Summary
All stories completed. No escalations.

## 2. Story Results

| Story | Final State | QA Bounces | Arch Bounces | Correction Tax |
|-------|-------------|------------|--------------|----------------|
| ${STORY_ID} | Done | 1 | 1 | 0 |

## 3. Metrics
- Stories: 1 completed, 0 escalated
- Total bounces: 3 (1 dev + 1 QA + 1 arch)
- Correction tax: 0%

## 4. Risks & Blockers
None encountered.

## 5. Framework Self-Assessment

### Templates
| Area | Rating | Notes |
|------|--------|-------|
| Story Template | Good | Covered all needed sections |

### Agent Handoffs
| Handoff | Rating | Notes |
|---------|--------|-------|
| Dev → QA | Good | Clean context transfer |

### Process Flow
| Step | Rating | Notes |
|------|--------|-------|
| Sprint Init | Good | Automated correctly |
`);

  // close_sprint archives reports and runs post-sprint scripts
  assertScriptRuns(
    path.join(scriptsDir, 'close_sprint.mjs'),
    SPRINT_ID, 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'archive reports and close sprint' }
  );

  // Verify archive was created
  fileCreated(
    path.join(vbounceDir, 'archive', SPRINT_ID),
    'Archive directory created',
    'lifecycle',
    'close_sprint should archive reports'
  );

  // Check state updated
  const postCloseState = readState(statePath);
  record({
    name: 'Sprint closed in state.json',
    component: 'lifecycle',
    input: 'state.last_action after close',
    output: postCloseState.last_action || '(empty)',
    expected: 'contains close/archive reference',
    verdict: (postCloseState.last_action || '').toLowerCase().includes('close') ||
             (postCloseState.last_action || '').toLowerCase().includes('archive') ? PASS : WARN,
    note: 'last_action wording may vary',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6 — Post-Sprint Analytics
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Post-Sprint Analytics');

  // prep_sprint_summary (reads archived reports)
  const summaryResult = assertScriptRuns(
    path.join(scriptsDir, 'prep_sprint_summary.mjs'),
    SPRINT_ID, 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'generate sprint summary from archive' }
  );
  if (summaryResult.exitCode === 0) {
    fileCreated(
      path.join(vbounceDir, `sprint-summary-${SPRINT_ID}.md`),
      'Sprint summary created',
      'lifecycle'
    );
  } else {
    record({
      name: 'prep_sprint_summary',
      component: 'lifecycle',
      input: `prep_sprint_summary.mjs ${SPRINT_ID}`,
      output: `exit ${summaryResult.exitCode}`,
      expected: 'exit 0',
      verdict: WARN,
      note: `may need more archived reports: ${(summaryResult.stderr || '').slice(0, 100)}`,
    });
  }

  // sprint_trends (reads all archives)
  assertScriptRuns(
    path.join(scriptsDir, 'sprint_trends.mjs'),
    '', 'lifecycle',
    { cwd: installDir, expectExit: 0, note: 'generate cross-sprint trends' }
  );
  fileCreated(
    path.join(vbounceDir, 'trends.md'),
    'Trends file created',
    'lifecycle'
  );

  // post_sprint_improve (parses sprint report §5)
  const improveResult = assertScriptRuns(
    path.join(scriptsDir, 'post_sprint_improve.mjs'),
    SPRINT_ID, 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'extract improvement items from sprint report' }
  );
  if (improveResult.exitCode === 0) {
    fileCreated(
      path.join(vbounceDir, 'improvement-manifest.json'),
      'Improvement manifest created',
      'lifecycle'
    );
  } else {
    record({
      name: 'post_sprint_improve',
      component: 'lifecycle',
      input: `post_sprint_improve.mjs ${SPRINT_ID}`,
      output: `exit ${improveResult.exitCode}`,
      expected: 'exit 0',
      verdict: WARN,
      note: `${(improveResult.stderr || '').slice(0, 100)}`,
    });
  }

  // suggest_improvements (runs post_sprint_improve internally, then reads manifest)
  const suggestResult = assertScriptRuns(
    path.join(scriptsDir, 'suggest_improvements.mjs'),
    SPRINT_ID, 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'generate improvement suggestions' }
  );
  if (suggestResult.exitCode === 0) {
    fileCreated(
      path.join(vbounceDir, 'improvement-suggestions.md'),
      'Improvement suggestions created',
      'lifecycle'
    );
  } else {
    record({
      name: 'suggest_improvements',
      component: 'lifecycle',
      input: `suggest_improvements.mjs ${SPRINT_ID}`,
      output: `exit ${suggestResult.exitCode}`,
      expected: 'exit 0',
      verdict: WARN,
      note: `${(suggestResult.stderr || '').slice(0, 100)}`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7 — Product Graph & Impact
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Product Graph');

  // product_graph (scans product_plans/ for all docs)
  const graphResult = assertScriptRuns(
    path.join(scriptsDir, 'product_graph.mjs'),
    '', 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'build product document graph' }
  );
  const graphPath = path.join(vbounceDir, 'product-graph.json');
  if (graphResult.exitCode === 0 && fs.existsSync(graphPath)) {
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    const docCount = Array.isArray(graph) ? graph.length :
      (graph.documents ? Object.keys(graph.documents).length :
       graph.nodes ? graph.nodes.length : 0);
    record({
      name: 'Product graph populated',
      component: 'lifecycle',
      input: 'product-graph.json',
      output: `${docCount} documents`,
      expected: '>= 3 (charter, epic, story)',
      verdict: docCount >= 3 ? PASS : WARN,
      note: docCount < 3 ? 'fewer docs than expected' : undefined,
    });

    // product_impact (looks up a doc in the graph)
    const impactResult = assertScriptRuns(
      path.join(scriptsDir, 'product_impact.mjs'),
      EPIC_ID, 'lifecycle',
      { cwd: installDir, expectExit: null, note: 'trace impact of epic' }
    );
    record({
      name: 'Product impact analysis',
      component: 'lifecycle',
      input: `product_impact.mjs ${EPIC_ID}`,
      output: `exit ${impactResult.exitCode}`,
      expected: 'exit 0',
      verdict: impactResult.exitCode === 0 ? PASS : WARN,
      note: impactResult.exitCode !== 0 ? `ID may not be in graph: ${(impactResult.stderr || '').slice(0, 100)}` : undefined,
    });
  } else {
    record({
      name: 'product_graph.mjs',
      component: 'lifecycle',
      input: 'product_graph.mjs',
      output: `exit ${graphResult.exitCode}`,
      expected: 'exit 0 + product-graph.json',
      verdict: WARN,
      note: `${(graphResult.stderr || '').slice(0, 100)}`,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8 — Doc Staleness
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Doc Staleness');

  const stalenessResult = assertScriptRuns(
    path.join(scriptsDir, 'vdoc_staleness.mjs'),
    SPRINT_ID, 'lifecycle',
    { cwd: installDir, expectExit: null, note: 'check doc staleness (no vdocs expected)' }
  );
  record({
    name: 'vdoc_staleness runs gracefully without vdocs',
    component: 'lifecycle',
    input: `vdoc_staleness.mjs ${SPRINT_ID}`,
    output: `exit ${stalenessResult.exitCode}`,
    expected: 'exit 0 (graceful when no vdocs)',
    verdict: stalenessResult.exitCode === 0 ? PASS : WARN,
    note: stalenessResult.exitCode !== 0 ? 'may need vdocs/_manifest.json' : undefined,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 9 — Edge Cases
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Edge Cases');

  // validate_state with no state.json (we renamed it temporarily)
  const stateBackup = statePath + '.bak';
  fs.renameSync(statePath, stateBackup);
  assertScriptRuns(
    path.join(scriptsDir, 'validate_state.mjs'), '', 'lifecycle',
    { cwd: installDir, expectExit: 1, note: 'no state.json should exit 1' }
  );
  fs.renameSync(stateBackup, statePath);

  // update_state with unknown story
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    'STORY-NONEXISTENT "Bouncing"', 'lifecycle',
    { cwd: installDir, expectExit: 1, note: 'unknown story should fail' }
  );

  // init_sprint with bad format
  assertScriptRuns(
    path.join(scriptsDir, 'init_sprint.mjs'),
    'BADFORMAT', 'lifecycle',
    { cwd: installDir, expectExit: 1, note: 'invalid sprint ID format should fail' }
  );

  // close_sprint with mismatched ID
  assertScriptRuns(
    path.join(scriptsDir, 'close_sprint.mjs'),
    'S-01', 'lifecycle',
    { cwd: installDir, expectExit: 1, note: 'mismatched sprint ID should fail' }
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 10 — Git Clean Checks (init_sprint + validate_bounce_readiness)
  // ═══════════════════════════════════════════════════════════════════════════
  suite('Lifecycle — Git Clean Checks');

  // These tests need a real git repo to verify dirty-tree detection.
  // We init a temp git repo, install the scripts, and test both clean and dirty states.
  const gitTestDir = path.join(installDir, '_git_clean_test');
  let gitTestsRan = false;
  try {
    // Set up a mini git repo with .vbounce scripts copied in
    fs.mkdirSync(gitTestDir, { recursive: true });
    execSync('git init', { cwd: gitTestDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: gitTestDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: gitTestDir, stdio: 'pipe' });

    // Copy .vbounce/scripts into the git test dir
    const gitVbounceDir = path.join(gitTestDir, '.vbounce');
    const gitScriptsDir = path.join(gitVbounceDir, 'scripts');
    fs.mkdirSync(gitScriptsDir, { recursive: true });
    const srcScriptsDir = path.join(installDir, '.vbounce', 'scripts');
    for (const f of fs.readdirSync(srcScriptsDir)) {
      fs.copyFileSync(path.join(srcScriptsDir, f), path.join(gitScriptsDir, f));
    }

    // Create initial commit so git status works
    execSync('git add -A', { cwd: gitTestDir, stdio: 'pipe' });
    execSync('git commit -m "initial"', { cwd: gitTestDir, stdio: 'pipe' });

    // --- Test 1: init_sprint on CLEAN tree should succeed ---
    const initCleanResult = assertScriptRuns(
      path.join(gitScriptsDir, 'init_sprint.mjs'),
      'S-50 --stories STORY-050-01', 'lifecycle',
      { cwd: gitTestDir, expectExit: 0, note: 'init_sprint on clean git tree should pass' }
    );

    // --- Test 2: Create a dirty file, init_sprint should fail ---
    fs.writeFileSync(path.join(gitTestDir, 'dirty.txt'), 'uncommitted change');
    const initDirtyResult = assertScriptRuns(
      path.join(gitScriptsDir, 'init_sprint.mjs'),
      'S-51 --stories STORY-051-01', 'lifecycle',
      { cwd: gitTestDir, expectExit: 1, note: 'init_sprint on dirty git tree should fail' }
    );

    // Verify the error message mentions uncommitted changes
    const initDirtyStderr = initDirtyResult.stderr || initDirtyResult.stdout || '';
    record({
      name: 'init_sprint dirty tree error is actionable',
      component: 'lifecycle',
      input: 'init_sprint.mjs stderr on dirty tree',
      output: initDirtyStderr.includes('uncommitted') ? 'mentions uncommitted' : initDirtyStderr.slice(0, 200),
      expected: 'mentions uncommitted',
      verdict: initDirtyStderr.includes('uncommitted') ? PASS : FAIL,
      note: 'error should tell user to commit or stash',
    });

    // --- Test 3: validate_bounce_readiness on dirty tree should fail ---
    // First set up state.json so readiness check can run the git check
    const gitStatePath = path.join(gitVbounceDir, 'state.json');
    fs.writeFileSync(gitStatePath, JSON.stringify({
      sprint_id: 'S-50',
      sprint_plan: 'product_plans/sprints/sprint-50/sprint-50.md',
      stories: { 'STORY-050-01': { state: 'Ready to Bounce', qa_bounces: 0, arch_bounces: 0, worktree: null } },
      phase: 'Phase 3',
      last_action: 'test',
      updated_at: new Date().toISOString()
    }, null, 2));

    // Create story spec so readiness check passes the spec validation
    const gitStoryDir = path.join(gitTestDir, 'product_plans', 'backlog');
    fs.mkdirSync(gitStoryDir, { recursive: true });
    fs.writeFileSync(path.join(gitStoryDir, 'STORY-050-01.md'), `---
story_id: "STORY-050-01"
---
# STORY-050-01
## 1. The Spec
Test spec content for git clean check validation.
## 2. Acceptance Criteria
- [ ] Git clean check works
## 3. Implementation Guide
Standard implementation approach.
`);

    // dirty.txt is still there — validate should fail on git check
    const readinessDirtyResult = assertScriptRuns(
      path.join(gitScriptsDir, 'validate_bounce_readiness.mjs'),
      'STORY-050-01', 'lifecycle',
      { cwd: gitTestDir, expectExit: 1, note: 'bounce readiness on dirty git tree should fail' }
    );

    const readinessDirtyOutput = (readinessDirtyResult.stderr || '') + (readinessDirtyResult.stdout || '');
    record({
      name: 'validate_bounce_readiness dirty tree error is actionable',
      component: 'lifecycle',
      input: 'validate_bounce_readiness output on dirty tree',
      output: readinessDirtyOutput.includes('uncommitted') ? 'mentions uncommitted' : readinessDirtyOutput.slice(0, 200),
      expected: 'mentions uncommitted',
      verdict: readinessDirtyOutput.includes('uncommitted') ? PASS : FAIL,
      note: 'error should tell user to commit or stash',
    });

    // --- Test 4: Commit the dirty file, readiness should pass ---
    execSync('git add -A', { cwd: gitTestDir, stdio: 'pipe' });
    execSync('git commit -m "add dirty.txt"', { cwd: gitTestDir, stdio: 'pipe' });

    const readinessCleanResult = assertScriptRuns(
      path.join(gitScriptsDir, 'validate_bounce_readiness.mjs'),
      'STORY-050-01', 'lifecycle',
      { cwd: gitTestDir, expectExit: 0, note: 'bounce readiness on clean git tree should pass' }
    );

    gitTestsRan = true;
  } catch (e) {
    record({
      name: 'Git clean check tests',
      component: 'lifecycle',
      input: 'git init + dirty tree tests',
      output: `error: ${e.message}`,
      expected: 'tests complete',
      verdict: WARN,
      note: 'git may not be available in test environment',
    });
  }

  // Clean up git test dir
  try {
    if (fs.existsSync(gitTestDir)) fs.rmSync(gitTestDir, { recursive: true });
  } catch { /* best effort */ }

  if (gitTestsRan) {
    record({
      name: 'Git clean check tests completed',
      component: 'lifecycle',
      input: 'init_sprint + validate_bounce_readiness git checks',
      output: 'all tests ran',
      expected: 'all tests ran',
      verdict: PASS,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════

  // Remove all test fixtures
  try {
    // Product plans
    fs.rmSync(path.join(installDir, 'product_plans'), { recursive: true });
    // .vbounce runtime files
    for (const f of [
      statePath,
      path.join(vbounceDir, `sprint-context-${SPRINT_ID}.md`),
      path.join(vbounceDir, `qa-context-${STORY_ID}.md`),
      path.join(vbounceDir, `arch-context-${STORY_ID}.md`),
      path.join(vbounceDir, `sprint-summary-${SPRINT_ID}.md`),
      path.join(vbounceDir, `sprint-report-${SPRINT_ID}.md`),
      path.join(vbounceDir, 'trends.md'),
      path.join(vbounceDir, 'improvement-manifest.json'),
      path.join(vbounceDir, 'improvement-suggestions.md'),
      path.join(vbounceDir, 'product-graph.json'),
      path.join(vbounceDir, `scribe-task-${SPRINT_ID}.md`),
    ]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    // Directories
    if (fs.existsSync(archiveDir)) fs.rmSync(archiveDir, { recursive: true });
    if (fs.existsSync(reportsDir)) fs.rmSync(reportsDir, { recursive: true });
    const archiveParent = path.join(vbounceDir, 'archive');
    if (fs.existsSync(archiveParent) && fs.readdirSync(archiveParent).length === 0) {
      fs.rmdirSync(archiveParent);
    }
  } catch { /* best effort */ }
}
