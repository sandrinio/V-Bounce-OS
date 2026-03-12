#!/usr/bin/env node

/**
 * validate_state.mjs
 * Validates .bounce/state.json schema.
 * Usage: ./scripts/validate_state.mjs
 * Also exportable: import { validateState } from './validate_state.mjs'
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STATE_FILE = path.join(ROOT, '.bounce', 'state.json');

const VALID_STATES = [
  'Draft', 'Refinement', 'Ready to Bounce', 'Bouncing',
  'QA Passed', 'Architect Passed', 'Done', 'Escalated', 'Parking Lot'
];

/**
 * Validates a state object. Returns { valid, errors }.
 * @param {object} state
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateState(state) {
  const errors = [];

  if (!state || typeof state !== 'object') {
    return { valid: false, errors: ['state.json must be a JSON object'] };
  }

  if (!state.sprint_id || !/^S-\d{2}$/.test(state.sprint_id)) {
    errors.push(`sprint_id "${state.sprint_id}" must match S-XX format (e.g. S-05)`);
  }

  if (!state.delivery_id || !/^D-\d{2}$/.test(state.delivery_id)) {
    errors.push(`delivery_id "${state.delivery_id}" must match D-NN format (e.g. D-02)`);
  }

  if (!state.stories || typeof state.stories !== 'object') {
    errors.push('stories field must be an object');
  } else {
    for (const [id, story] of Object.entries(state.stories)) {
      if (!VALID_STATES.includes(story.state)) {
        errors.push(`Story ${id}: invalid state "${story.state}". Must be one of: ${VALID_STATES.join(', ')}`);
      }
      if (typeof story.qa_bounces !== 'number' || !Number.isInteger(story.qa_bounces) || story.qa_bounces < 0) {
        errors.push(`Story ${id}: qa_bounces must be a non-negative integer, got "${story.qa_bounces}"`);
      }
      if (typeof story.arch_bounces !== 'number' || !Number.isInteger(story.arch_bounces) || story.arch_bounces < 0) {
        errors.push(`Story ${id}: arch_bounces must be a non-negative integer, got "${story.arch_bounces}"`);
      }
      if (story.state === 'Done' && story.worktree) {
        errors.push(`Story ${id}: state is "Done" but worktree "${story.worktree}" is still set (should be null)`);
      }
    }
  }

  if (state.updated_at) {
    const d = new Date(state.updated_at);
    if (isNaN(d.getTime())) {
      errors.push(`updated_at "${state.updated_at}" is not a valid ISO 8601 timestamp`);
    }
  } else {
    errors.push('updated_at field is required');
  }

  return { valid: errors.length === 0, errors };
}

// CLI entry point
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  if (!fs.existsSync(STATE_FILE)) {
    console.error(`ERROR: ${STATE_FILE} not found. Run: vbounce sprint init S-XX D-XX`);
    process.exit(1);
  }

  let state;
  try {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    console.error(`ERROR: state.json is not valid JSON — ${e.message}`);
    process.exit(1);
  }

  const { valid, errors } = validateState(state);

  if (valid) {
    console.log(`VALID: state.json — sprint ${state.sprint_id}, ${Object.keys(state.stories || {}).length} stories`);
    process.exit(0);
  } else {
    console.error('INVALID: state.json has errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}
