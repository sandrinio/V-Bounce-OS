#!/usr/bin/env node

/**
 * complete_story.mjs
 * Mark a story as Done — updates Sprint Plan §1 + §4, and state.json atomically.
 *
 * Usage:
 *   ./.vbounce/scripts/complete_story.mjs STORY-005-02 --qa-bounces 1 --arch-bounces 0 --correction-tax 5 --notes "Missing validation fixed"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function parseArgs(argv) {
  const result = { storyId: null, qaBounces: 0, archBounces: 0, correctionTax: '0%', notes: '' };
  const args = argv.slice(2);
  result.storyId = args[0];
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--qa-bounces') result.qaBounces = parseInt(args[++i], 10) || 0;
    else if (args[i] === '--arch-bounces') result.archBounces = parseInt(args[++i], 10) || 0;
    else if (args[i] === '--correction-tax') result.correctionTax = args[++i] + (args[i].includes('%') ? '' : '%');
    else if (args[i] === '--notes') result.notes = args[++i];
  }
  return result;
}

const { storyId, qaBounces, archBounces, correctionTax, notes } = parseArgs(process.argv);

if (!storyId) {
  console.error('Usage: complete_story.mjs STORY-ID [--qa-bounces N] [--arch-bounces N] [--correction-tax N] [--notes "text"]');
  process.exit(1);
}

// 1. Update state.json
const stateFile = path.join(ROOT, '.vbounce', 'state.json');
if (!fs.existsSync(stateFile)) {
  console.error('ERROR: .vbounce/state.json not found');
  process.exit(1);
}
let state;
try {
  state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} catch (e) {
  console.error(`ERROR: state.json is not valid JSON — ${e.message}`);
  process.exit(1);
}
if (!state.stories[storyId]) {
  console.error(`ERROR: Story "${storyId}" not found in state.json`);
  process.exit(1);
}
state.stories[storyId].state = 'Done';
state.stories[storyId].qa_bounces = qaBounces;
state.stories[storyId].arch_bounces = archBounces;
state.stories[storyId].worktree = null;
state.last_action = `${storyId} completed`;
state.updated_at = new Date().toISOString();
fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
console.log(`✓ Updated state.json: ${storyId} → Done`);

// 2. Find sprint plan
const sprintNum = state.sprint_id.replace('S-', '');
const sprintPlanPath = path.join(ROOT, 'product_plans', 'sprints', `sprint-${sprintNum}`, `sprint-${sprintNum}.md`);

if (!fs.existsSync(sprintPlanPath)) {
  console.warn(`⚠  Sprint plan not found at ${sprintPlanPath}. Update §1 and §4 manually.`);
  process.exit(0);
}

let content = fs.readFileSync(sprintPlanPath, 'utf8');

// 3. Update §1 table — find the row with storyId and change V-Bounce State to Done
const tableRowRegex = new RegExp(`(\\|[^|]*\\|[^|]*${storyId.replace(/[-]/g, '[-]')}[^|]*\\|[^|]*\\|[^|]*\\|)([^|]+)(\\|[^|]*\\|)`, 'g');
let updated = false;
content = content.replace(tableRowRegex, (match, before, stateCell, after) => {
  updated = true;
  return `${before} Done ${after}`;
});

if (!updated) {
  console.warn(`⚠  Could not find ${storyId} row in §1 table. Update V-Bounce State manually.`);
}

// 4. Add row to §4 Execution Log
const logStart = '<!-- EXECUTION_LOG_START -->';
const logEnd = '<!-- EXECUTION_LOG_END -->';
const newRow = `| ${storyId} | Done | ${qaBounces} | ${archBounces} | ${correctionTax} | ${notes || '—'} |`;

if (content.includes(logStart)) {
  // Find the table in the execution log section and append a row
  const startIdx = content.indexOf(logStart);
  const endIdx = content.indexOf(logEnd);

  if (endIdx > startIdx) {
    const before = content.substring(0, endIdx);
    const after = content.substring(endIdx);

    // Check if header row exists, if not add it
    const section = before.substring(startIdx);
    if (!section.includes('| Story |')) {
      const headerRow = `\n| Story | Final State | QA Bounces | Arch Bounces | Correction Tax | Notes |\n|-------|-------------|------------|--------------|----------------|-------|`;
      content = before + headerRow + '\n' + newRow + '\n' + after;
    } else {
      content = before + newRow + '\n' + after;
    }
    console.log(`✓ Added row to §4 Execution Log`);
  }
} else {
  // Append §4 section at end
  content += `\n\n<!-- EXECUTION_LOG_START -->\n## 4. Execution Log\n\n| Story | Final State | QA Bounces | Arch Bounces | Correction Tax | Notes |\n|-------|-------------|------------|--------------|----------------|-------|\n${newRow}\n<!-- EXECUTION_LOG_END -->\n`;
  console.log(`✓ Created §4 Execution Log with first row`);
}

fs.writeFileSync(sprintPlanPath, content);
console.log(`✓ Updated sprint plan: ${storyId} Done`);
console.log(`\n  QA bounces: ${qaBounces} | Arch bounces: ${archBounces} | Correction tax: ${correctionTax}`);

// Regenerate product graph (non-blocking)
const graphScript = path.join(__dirname, 'product_graph.mjs');
if (fs.existsSync(graphScript)) {
  const graphResult = spawnSync(process.execPath, [graphScript], { stdio: 'pipe', cwd: ROOT });
  if (graphResult.status === 0) console.log('✓ Product graph regenerated');
}
