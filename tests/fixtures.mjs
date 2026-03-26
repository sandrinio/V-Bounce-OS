/**
 * Shared test fixtures for V-Bounce Engine test suites.
 * Creates the minimum viable product_plans + state for a sprint.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Create a full sprint fixture set: charter, delivery plan, risk registry,
 * epic, story specs, sprint plan, LESSONS.md, and state.json.
 *
 * @param {string} installDir - Root of the V-Bounce install
 * @param {object} opts
 * @param {string} opts.sprintId - e.g. "S-98"
 * @param {string} opts.deliveryId - e.g. "D-98"
 * @param {string[]} opts.storyIds - e.g. ["STORY-T98-01", "STORY-T98-02"]
 * @param {string} opts.epicId - e.g. "EPIC-T98"
 * @returns {{ statePath: string, sprintPlanDir: string, reportsDir: string }}
 */
export function createSprintFixtures(installDir, { sprintId, deliveryId, storyIds, epicId }) {
  const sprintNum = sprintId.replace('S-', '');
  const vbounceDir = path.join(installDir, '.vbounce');
  const scriptsDir = path.join(vbounceDir, 'scripts');
  const reportsDir = path.join(vbounceDir, 'reports');
  const sprintsDir = path.join(installDir, 'product_plans', 'sprints');
  const sprintPlanDir = path.join(sprintsDir, `sprint-${sprintNum}`);
  const backlogDir = path.join(installDir, 'product_plans', 'backlog', `${epicId}_test`);
  const strategyDir = path.join(installDir, 'product_plans', 'strategy');
  const statePath = path.join(vbounceDir, 'state.json');

  // Create directories
  [sprintsDir, sprintPlanDir, backlogDir, strategyDir, reportsDir].forEach(d =>
    fs.mkdirSync(d, { recursive: true })
  );

  // Charter
  fs.writeFileSync(path.join(strategyDir, `${epicId}_charter.md`), `---
charter_id: "CHARTER-${epicId}"
title: "Test Charter ${sprintId}"
status: "Approved"
---

# Test Charter ${sprintId}

## 1. Vision
Automated test fixtures for ${sprintId}.
`);

  // Delivery Plan
  fs.writeFileSync(path.join(strategyDir, `${deliveryId}_DELIVERY_PLAN.md`), `---
delivery_id: "${deliveryId}"
title: "Test Delivery Plan"
status: "Active"
---

# ${deliveryId} — Test Delivery Plan

## Scope
Sprint ${sprintId} test.
`);

  // Risk Registry
  if (!fs.existsSync(path.join(strategyDir, 'RISK_REGISTRY.md'))) {
    fs.writeFileSync(path.join(strategyDir, 'RISK_REGISTRY.md'), `---
title: "Risk Registry"
---

# Risk Registry

| ID | Risk | Impact | Likelihood | Mitigation | Status |
|----|------|--------|------------|------------|--------|
`);
  }

  // Epic
  fs.writeFileSync(path.join(backlogDir, `${epicId}_test.md`), `---
epic_id: "${epicId}"
title: "Test Epic ${sprintId}"
status: "In Progress"
charter_ref: "CHARTER-${epicId}"
---

# ${epicId}: Test Epic

## 1. Objective
Test fixtures for ${sprintId}.

## 4. Stories
${storyIds.map(id => `- ${id}`).join('\n')}
`);

  // Story specs
  for (const storyId of storyIds) {
    fs.writeFileSync(path.join(backlogDir, `${storyId}.md`), `---
story_id: "${storyId}"
parent_epic_ref: "${epicId}"
status: "Ready to Bounce"
ambiguity: "🟢 Low"
complexity_label: "L2"
---

# ${storyId}: Test Story

## 1. The Spec
Test fixture story for ${sprintId}.

## 2. Acceptance Criteria
- [ ] All scripts execute without crash

## 3. Technical Approach
Minimal fixtures, maximum coverage.
`);
  }

  // Sprint Plan
  const storyRows = storyIds.map((id, i) =>
    `| ${i + 1} | ${id} | ${epicId} | L2 | Ready to Bounce | — |`
  ).join('\n');

  fs.writeFileSync(path.join(sprintPlanDir, `sprint-${sprintNum}.md`), `---
sprint_id: "${sprintId}"
sprint_goal: "Test sprint ${sprintId}"
dates: "03/25 - 03/31"
status: "Active"
delivery: "${deliveryId}"
---

# Sprint ${sprintId} Plan

## 1. Active Scope

| Priority | Story | Epic | Label | V-Bounce State | Blocker |
|----------|-------|------|-------|----------------|---------|
${storyRows}

### Escalated / Parking Lot
- (none)

---

## 2. Execution Strategy

### Phase Plan
- **Phase 1**: ${storyIds.join(', ')}

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

  // LESSONS.md
  if (!fs.existsSync(path.join(installDir, 'LESSONS.md'))) {
    fs.writeFileSync(path.join(installDir, 'LESSONS.md'), `# Lessons Learned

## Sprint Lessons
- Fixture-generated for testing.
`);
  }

  // Initialize state.json via init_sprint.mjs
  try {
    execSync(
      `node "${path.join(scriptsDir, 'init_sprint.mjs')}" ${sprintId} ${deliveryId} --stories ${storyIds.join(',')}`,
      { cwd: installDir, timeout: 10000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch (e) {
    // init_sprint may warn about overwrite — that's fine
  }

  return { statePath, sprintPlanDir, reportsDir, backlogDir, strategyDir };
}

/**
 * Create a synthetic agent report in .vbounce/reports/.
 *
 * @param {string} installDir
 * @param {string} storyId
 * @param {'dev'|'qa'|'arch'} agent
 * @param {string} sprintId
 */
export function createSyntheticReport(installDir, storyId, agent, sprintId) {
  const reportsDir = path.join(installDir, '.vbounce', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const templates = {
    dev: `---
status: "PASS"
story_id: "${storyId}"
sprint_id: "${sprintId}"
correction_tax: 0
tokens_used: 12500
tests_written: 3
files_modified:
  - src/index.ts
  - src/utils.ts
lessons_flagged: 0
---

# Developer Report — ${storyId}

## Implementation Summary
Implemented test fixtures.

## Files Modified
- \`src/index.ts\` — main entry
- \`src/utils.ts\` — utilities

## Tests Written
- test.ts (3 tests)

## Checkpoint
Ready for QA.
`,
    qa: `---
status: "PASS"
story_id: "${storyId}"
sprint_id: "${sprintId}"
bounce_count: 1
bugs_found: 0
gold_plating_detected: false
tokens_used: 8200
---

# QA Validation Report — ${storyId}

## Result: PASS

## Scenarios Tested
1. Fixture validation — PASS
2. State transitions — PASS

## Bugs Found
None.
`,
    arch: `---
status: "PASS"
story_id: "${storyId}"
sprint_id: "${sprintId}"
safe_zone_score: 95
ai_isms_detected: 0
regression_risk: "Low"
bounce_count: 1
tokens_used: 9800
---

# Architectural Audit Report — ${storyId}

## Result: PASS

## Safe Zone Analysis
Score: 95/100.

## AI-isms
None detected.

## Regression Risk
Low.
`,
  };

  const reportPath = path.join(reportsDir, `${storyId}-${agent}.md`);
  fs.writeFileSync(reportPath, templates[agent]);
  return reportPath;
}

/**
 * Remove all fixtures created by createSprintFixtures.
 *
 * @param {string} installDir
 * @param {object} opts - Same shape as createSprintFixtures
 */
export function removeSprintFixtures(installDir, { sprintId, deliveryId, storyIds, epicId }) {
  const sprintNum = sprintId.replace('S-', '');
  const vbounceDir = path.join(installDir, '.vbounce');

  const toRemove = [
    // State & runtime
    path.join(vbounceDir, 'state.json'),
    path.join(vbounceDir, `sprint-context-${sprintId}.md`),
    path.join(vbounceDir, `sprint-report-${sprintId}.md`),
    path.join(vbounceDir, `sprint-summary-${sprintId}.md`),
    path.join(vbounceDir, 'trends.md'),
    path.join(vbounceDir, 'improvement-manifest.json'),
    path.join(vbounceDir, 'improvement-suggestions.md'),
    path.join(vbounceDir, 'product-graph.json'),
    path.join(vbounceDir, `scribe-task-${sprintId}.md`),
    // Context packs
    ...storyIds.flatMap(id => [
      path.join(vbounceDir, `qa-context-${id}.md`),
      path.join(vbounceDir, `arch-context-${id}.md`),
    ]),
  ];

  for (const f of toRemove) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* best effort */ }
  }

  const dirsToRemove = [
    path.join(vbounceDir, 'reports'),
    path.join(vbounceDir, 'archive', sprintId),
    path.join(installDir, 'product_plans', 'sprints', `sprint-${sprintNum}`),
    path.join(installDir, 'product_plans', 'backlog', `${epicId}_test`),
    path.join(installDir, 'product_plans', 'strategy'),
  ];

  for (const d of dirsToRemove) {
    try { if (fs.existsSync(d)) fs.rmSync(d, { recursive: true }); } catch { /* best effort */ }
  }

  // Clean empty parent dirs
  for (const parent of [
    path.join(vbounceDir, 'archive'),
    path.join(installDir, 'product_plans', 'sprints'),
    path.join(installDir, 'product_plans', 'backlog'),
    path.join(installDir, 'product_plans'),
  ]) {
    try {
      if (fs.existsSync(parent) && fs.readdirSync(parent).length === 0) fs.rmdirSync(parent);
    } catch { /* best effort */ }
  }
}
