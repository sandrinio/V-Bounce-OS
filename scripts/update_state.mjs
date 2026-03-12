#!/usr/bin/env node

/**
 * update_state.mjs
 * Updates .bounce/state.json atomically at every V-Bounce state transition.
 *
 * Usage:
 *   ./scripts/update_state.mjs STORY-005-02 "QA Passed"
 *   ./scripts/update_state.mjs STORY-005-02 --qa-bounce
 *   ./scripts/update_state.mjs STORY-005-02 --arch-bounce
 *   ./scripts/update_state.mjs --set-phase "Phase 3"
 *   ./scripts/update_state.mjs --set-action "QA FAIL on STORY-005-02, bouncing back to Dev"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateState } from './validate_state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATE_FILE = path.join(ROOT, '.bounce', 'state.json');

const VALID_STATES = [
  'Draft', 'Refinement', 'Ready to Bounce', 'Bouncing',
  'QA Passed', 'Architect Passed', 'Done', 'Escalated', 'Parking Lot'
];

function readState() {
  if (!fs.existsSync(STATE_FILE)) {
    console.error(`ERROR: ${STATE_FILE} not found. Run: vbounce sprint init S-XX D-XX`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    console.error(`ERROR: state.json is not valid JSON — ${e.message}`);
    process.exit(1);
  }
}

function writeState(state) {
  state.updated_at = new Date().toISOString();
  const { valid, errors } = validateState(state);
  if (!valid) {
    console.error('ERROR: Would write invalid state:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage:');
  console.error('  update_state.mjs STORY-ID "New State"');
  console.error('  update_state.mjs STORY-ID --qa-bounce');
  console.error('  update_state.mjs STORY-ID --arch-bounce');
  console.error('  update_state.mjs --set-phase "Phase N"');
  console.error('  update_state.mjs --set-action "description"');
  process.exit(1);
}

const state = readState();

// Global flags
if (args[0] === '--set-phase') {
  state.phase = args[1];
  writeState(state);
  console.log(`✓ Phase set to: ${args[1]}`);
  process.exit(0);
}

if (args[0] === '--set-action') {
  state.last_action = args[1];
  writeState(state);
  console.log(`✓ Last action set to: ${args[1]}`);
  process.exit(0);
}

if (args[0] === '--show') {
  console.log(JSON.stringify(state, null, 2));
  process.exit(0);
}

// Story-specific updates
const storyId = args[0];
if (!state.stories) {
  console.error('ERROR: state.json has no stories field');
  process.exit(1);
}
if (!state.stories[storyId]) {
  console.error(`ERROR: Story "${storyId}" not found in state.json`);
  console.error(`Known stories: ${Object.keys(state.stories).join(', ')}`);
  process.exit(1);
}

const flag = args[1];

if (flag === '--qa-bounce') {
  state.stories[storyId].qa_bounces = (state.stories[storyId].qa_bounces || 0) + 1;
  state.last_action = `QA bounce on ${storyId} (total: ${state.stories[storyId].qa_bounces})`;
  writeState(state);
  console.log(`✓ ${storyId} QA bounces: ${state.stories[storyId].qa_bounces}`);

} else if (flag === '--arch-bounce') {
  state.stories[storyId].arch_bounces = (state.stories[storyId].arch_bounces || 0) + 1;
  state.last_action = `Architect bounce on ${storyId} (total: ${state.stories[storyId].arch_bounces})`;
  writeState(state);
  console.log(`✓ ${storyId} Arch bounces: ${state.stories[storyId].arch_bounces}`);

} else if (flag) {
  // New state
  if (!VALID_STATES.includes(flag)) {
    console.error(`ERROR: Invalid state "${flag}"`);
    console.error(`Valid states: ${VALID_STATES.join(', ')}`);
    process.exit(1);
  }
  const prev = state.stories[storyId].state;
  state.stories[storyId].state = flag;
  if (flag === 'Done') {
    state.stories[storyId].worktree = null;
  }
  state.last_action = `${storyId}: ${prev} → ${flag}`;
  writeState(state);
  console.log(`✓ ${storyId}: ${prev} → ${flag}`);

} else {
  console.error('ERROR: Specify a state or flag (--qa-bounce, --arch-bounce)');
  process.exit(1);
}
