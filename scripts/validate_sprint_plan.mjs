#!/usr/bin/env node

/**
 * validate_sprint_plan.mjs
 * Validates a Sprint Plan markdown file structure and cross-checks with state.json.
 *
 * Usage:
 *   ./.vbounce/scripts/validate_sprint_plan.mjs product_plans/sprints/sprint-05/sprint-05.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: validate_sprint_plan.mjs <path-to-sprint-plan.md>');
  process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
  console.error(`ERROR: File not found: ${absPath}`);
  process.exit(1);
}

const content = fs.readFileSync(absPath, 'utf8');
const errors = [];
const warnings = [];

// 1. Extract YAML frontmatter
const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
if (!fmMatch) {
  errors.push('Missing YAML frontmatter (--- delimiters)');
} else {
  let fm;
  try {
    fm = yaml.load(fmMatch[1]);
  } catch (e) {
    errors.push(`Invalid YAML frontmatter: ${e.message}`);
    fm = {};
  }

  const required = ['sprint_id', 'sprint_goal', 'dates', 'status', 'delivery'];
  for (const f of required) {
    if (!fm[f]) errors.push(`Frontmatter missing required field: "${f}"`);
  }

  // 2. Cross-check with state.json
  const stateFile = path.join(ROOT, '.vbounce', 'state.json');
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

    // Find story IDs in §1 table
    const tableRowRegex = /\|\s*\d+\s*\|\s*\[?(STORY-[\w-]+)/g;
    const planStoryIds = new Set();
    let m;
    while ((m = tableRowRegex.exec(content)) !== null) {
      planStoryIds.add(m[1]);
    }

    const stateStoryIds = new Set(Object.keys(state.stories || {}));

    // Check for stories in plan but not in state
    for (const id of planStoryIds) {
      if (!stateStoryIds.has(id)) {
        warnings.push(`Story ${id} is in Sprint Plan §1 but NOT in state.json`);
      }
    }

    // Check for stories in state but not in plan
    for (const id of stateStoryIds) {
      if (!planStoryIds.has(id)) {
        warnings.push(`Story ${id} is in state.json but NOT in Sprint Plan §1`);
      }
    }
  }

  // 3. Check §4 Execution Log if sprint is Completed
  if (fm.status === 'Completed') {
    if (!content.includes('<!-- EXECUTION_LOG_START -->') && !content.includes('## 4.') && !content.includes('## §4')) {
      errors.push('Sprint is Completed but §4 Execution Log section is missing');
    }
  }
}

// 4. Check §1 table columns
if (!content.includes('| Priority |') && !content.includes('|Priority|')) {
  errors.push('§1 Active Scope table missing or malformed (expected "Priority" column header)');
}
if (!content.includes('V-Bounce State')) {
  errors.push('§1 Active Scope table missing "V-Bounce State" column');
}

// Print results
console.log(`Validating: ${filePath}`);
if (errors.length === 0 && warnings.length === 0) {
  console.log('✓ Sprint Plan is valid');
  process.exit(0);
}

if (warnings.length > 0) {
  console.warn('Warnings:');
  warnings.forEach(w => console.warn(`  ⚠  ${w}`));
}

if (errors.length > 0) {
  console.error('Errors:');
  errors.forEach(e => console.error(`  ✗ ${e}`));
  process.exit(1);
} else {
  process.exit(0);
}
