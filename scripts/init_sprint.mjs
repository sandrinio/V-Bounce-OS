#!/usr/bin/env node

/**
 * init_sprint.mjs
 * Sprint setup automation — creates state.json, sprint plan dir, and prints git commands.
 *
 * Usage:
 *   ./.vbounce/scripts/init_sprint.mjs S-06 D-02 --stories STORY-011-05,STORY-005-01,STORY-005-02
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: init_sprint.mjs S-XX D-NN [--stories STORY-ID1,STORY-ID2,...]');
  process.exit(1);
}

const sprintId = args[0]; // e.g. S-06
const deliveryId = args[1]; // e.g. D-02

if (!/^S-\d{2}$/.test(sprintId)) {
  console.error(`ERROR: sprint_id "${sprintId}" must match S-XX format`);
  process.exit(1);
}
if (!/^D-\d{2}$/.test(deliveryId)) {
  console.error(`ERROR: delivery_id "${deliveryId}" must match D-NN format`);
  process.exit(1);
}

const storiesArg = args.indexOf('--stories');
const storyIds = storiesArg !== -1 ? args[storiesArg + 1].split(',') : [];

// 1. Create .vbounce/ directory
const bounceDir = path.join(ROOT, '.vbounce');
fs.mkdirSync(bounceDir, { recursive: true });
fs.mkdirSync(path.join(bounceDir, 'archive'), { recursive: true });
fs.mkdirSync(path.join(bounceDir, 'reports'), { recursive: true });

// 2. Create state.json
const stateFile = path.join(bounceDir, 'state.json');
if (fs.existsSync(stateFile)) {
  console.warn(`⚠  state.json already exists. Overwriting...`);
}

const sprintNum = sprintId.replace('S-', '');
const stories = {};
for (const id of storyIds) {
  stories[id.trim()] = {
    state: 'Draft',
    qa_bounces: 0,
    arch_bounces: 0,
    worktree: null
  };
}

const state = {
  sprint_id: sprintId,
  delivery_id: deliveryId,
  sprint_plan: `product_plans/sprints/sprint-${sprintNum}/sprint-${sprintNum}.md`,
  delivery_plan: `product_plans/strategy/${deliveryId}_DELIVERY_PLAN.md`,
  stories,
  phase: 'Phase 1',
  last_action: `Sprint ${sprintId} initialized`,
  updated_at: new Date().toISOString()
};

fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
console.log(`✓ Created .vbounce/state.json`);

// 3. Create sprint plan directory
const sprintDir = path.join(ROOT, 'product_plans', 'sprints', `sprint-${sprintNum}`);
fs.mkdirSync(sprintDir, { recursive: true });

const sprintPlanFile = path.join(sprintDir, `sprint-${sprintNum}.md`);
if (!fs.existsSync(sprintPlanFile)) {
  // Copy from template
  const templateFile = path.join(ROOT, 'templates', 'sprint.md');
  if (fs.existsSync(templateFile)) {
    let content = fs.readFileSync(templateFile, 'utf8');
    // Replace placeholders
    content = content.replace(/sprint-\{XX\}/g, `sprint-${sprintNum}`);
    content = content.replace(/S-\{XX\}/g, sprintId);
    content = content.replace(/D-\{NN\}/g, deliveryId);
    content = content.replace(/status: "Planning \/ Active \/ Completed"/, 'status: "Planning"');
    // Strip instructions block
    content = content.replace(/<instructions>[\s\S]*?<\/instructions>\n\n/, '');
    fs.writeFileSync(sprintPlanFile, content);
    console.log(`✓ Created product_plans/sprints/sprint-${sprintNum}/sprint-${sprintNum}.md`);
  } else {
    // Create minimal sprint plan
    const minimal = `---\nsprint_id: "${sprintId}"\nsprint_goal: "TBD"\ndates: "TBD"\nstatus: "Planning"\ndelivery: "${deliveryId}"\n---\n\n# Sprint ${sprintId} Plan\n\n## 1. Active Scope\n\n| Priority | Story | Epic | Label | V-Bounce State | Blocker |\n|----------|-------|------|-------|----------------|---------|\n${storyIds.map((id, i) => `| ${i + 1} | ${id.trim()} | — | L2 | Draft | — |`).join('\n')}\n\n### Escalated / Parking Lot\n- (none)\n\n---\n\n## 2. Execution Strategy\n\n### Phase Plan\n- **Phase 1 (parallel)**: ${storyIds.join(', ')}\n\n### Risk Flags\n- (TBD)\n\n---\n\n## 3. Sprint Open Questions\n\n| Question | Options | Impact | Owner | Status |\n|----------|---------|--------|-------|--------|\n\n---\n\n<!-- EXECUTION_LOG_START -->\n## 4. Execution Log\n\n| Story | Final State | QA Bounces | Arch Bounces | Correction Tax | Notes |\n|-------|-------------|------------|--------------|----------------|-------|\n<!-- EXECUTION_LOG_END -->\n`;
    fs.writeFileSync(sprintPlanFile, minimal);
    console.log(`✓ Created product_plans/sprints/sprint-${sprintNum}/sprint-${sprintNum}.md (minimal — template not found)`);
  }
} else {
  console.log(`  Sprint plan already exists: product_plans/sprints/sprint-${sprintNum}/sprint-${sprintNum}.md`);
}

// 4. Print git commands (don't execute)
console.log('');
console.log('Run these git commands to initialize the sprint branch:');
console.log(`  git checkout -b sprint/${sprintId} main`);
if (storyIds.length > 0) {
  console.log('');
  console.log('Then create worktrees for each story:');
  storyIds.forEach(id => {
    const trimmed = id.trim();
    console.log(`  git worktree add .worktrees/${trimmed} -b story/${trimmed} sprint/${sprintId}`);
    console.log(`  mkdir -p .worktrees/${trimmed}/.vbounce/{tasks,reports}`);
  });
}

// 5. Regenerate product graph (non-blocking)
const graphScript = path.join(__dirname, 'product_graph.mjs');
if (fs.existsSync(graphScript)) {
  const graphResult = spawnSync(process.execPath, [graphScript], { stdio: 'pipe', cwd: ROOT });
  if (graphResult.status === 0) console.log('✓ Product graph regenerated');
}

console.log('');
console.log(`✓ Sprint ${sprintId} initialized. Stories: ${storyIds.length > 0 ? storyIds.join(', ') : 'none (add manually)'}`);
