#!/usr/bin/env node

/**
 * close_sprint.mjs
 * Sprint close automation — validates, archives, updates state.json.
 *
 * Usage:
 *   ./scripts/close_sprint.mjs S-05
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: close_sprint.mjs S-XX');
  process.exit(1);
}

const sprintId = args[0];
if (!/^S-\d{2}$/.test(sprintId)) {
  console.error(`ERROR: sprint_id "${sprintId}" must match S-XX format`);
  process.exit(1);
}

const sprintNum = sprintId.replace('S-', '');
const stateFile = path.join(ROOT, '.bounce', 'state.json');

// 1. Read state.json
if (!fs.existsSync(stateFile)) {
  console.error(`ERROR: .bounce/state.json not found`);
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

if (state.sprint_id !== sprintId) {
  console.error(`ERROR: state.json is for sprint ${state.sprint_id}, not ${sprintId}`);
  process.exit(1);
}

// 2. Check all stories are terminal
const activeStories = Object.entries(state.stories || {}).filter(
  ([, s]) => !['Done', 'Escalated', 'Parking Lot'].includes(s.state)
);

if (activeStories.length > 0) {
  console.warn(`⚠  ${activeStories.length} stories are not in a terminal state:`);
  activeStories.forEach(([id, s]) => console.warn(`   - ${id}: ${s.state}`));
  console.warn('   Proceed? These stories will be left incomplete.');
}

// 3. Create archive directory
const archiveDir = path.join(ROOT, '.bounce', 'archive', sprintId);
fs.mkdirSync(archiveDir, { recursive: true });

// 4. Move sprint report if it exists
const reportSrc = path.join(ROOT, '.bounce', `sprint-report-${sprintId}.md`);
const reportLegacy = path.join(ROOT, '.bounce', 'sprint-report.md');
const reportDst = path.join(archiveDir, `sprint-report-${sprintId}.md`);

if (fs.existsSync(reportSrc)) {
  fs.copyFileSync(reportSrc, reportDst);
  console.log(`✓ Archived sprint report → .bounce/archive/${sprintId}/sprint-report-${sprintId}.md`);
} else if (fs.existsSync(reportLegacy)) {
  fs.copyFileSync(reportLegacy, reportDst);
  console.log(`✓ Archived sprint report → .bounce/archive/${sprintId}/sprint-report-${sprintId}.md`);
}

// 5. Update state.json
state.last_action = `Sprint ${sprintId} closed`;
state.updated_at = new Date().toISOString();
fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
console.log(`✓ Updated state.json`);

// 6. Print manual steps
const sprintPlanPath = `product_plans/sprints/sprint-${sprintNum}`;
const archivePath = `product_plans/archive/sprints/sprint-${sprintNum}`;

// 7. Auto-run improvement pipeline
console.log('');
console.log('Running self-improvement pipeline...');
const suggestScript = path.join(__dirname, 'suggest_improvements.mjs');
if (fs.existsSync(suggestScript)) {
  // Run trends first (if available)
  const trendsScript = path.join(__dirname, 'sprint_trends.mjs');
  if (fs.existsSync(trendsScript)) {
    const trendsResult = spawnSync(process.execPath, [trendsScript], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    if (trendsResult.status !== 0) {
      console.warn('  ⚠ Trends analysis returned non-zero — continuing.');
    }
  }

  // Run suggest (which internally runs post_sprint_improve.mjs)
  const suggestResult = spawnSync(process.execPath, [suggestScript, sprintId], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  if (suggestResult.status !== 0) {
    console.warn('  ⚠ Improvement suggestions returned non-zero.');
  }
} else {
  console.warn('  ⚠ suggest_improvements.mjs not found — skipping improvement pipeline.');
}

// Regenerate product graph (non-blocking)
const graphScript = path.join(__dirname, 'product_graph.mjs');
if (fs.existsSync(graphScript)) {
  const graphResult = spawnSync(process.execPath, [graphScript], { stdio: 'pipe', cwd: process.cwd() });
  if (graphResult.status === 0) {
    console.log('✓ Product graph regenerated');
  }
}

console.log('');
console.log('Manual steps remaining:');
console.log(`  1. Archive sprint plan folder:`);
console.log(`     mv ${sprintPlanPath}/ ${archivePath}/`);
console.log(`  2. Update Delivery Plan §4 Completed Sprints with a summary row`);
console.log(`  3. Remove delivered stories from Delivery Plan §3 Backlog`);
console.log(`  4. Delete sprint branch (after merge to main):`);
console.log(`     git branch -d sprint/${sprintId}`);
console.log(`  5. Review .bounce/improvement-suggestions.md — approve/reject/defer each item`);
console.log(`  6. Run /improve to apply approved changes with brain-file sync`);
console.log('');
console.log(`✓ Sprint ${sprintId} closed.`);
