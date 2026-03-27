#!/usr/bin/env node

/**
 * doctor.mjs
 * V-Bounce Engine Health Check — validates all configs, templates, state files
 * Usage: vbounce doctor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const checks = [];
let issueCount = 0;

function pass(msg) {
  checks.push(`  ✓ ${msg}`);
}

function fail(msg, fix) {
  checks.push(`  ✗ ${msg}${fix ? `\n    → Fix: ${fix}` : ''}`);
  issueCount++;
}

function warn(msg) {
  checks.push(`  ⚠ ${msg}`);
}

// Check FLASHCARDS.md
if (fs.existsSync(path.join(ROOT, 'FLASHCARDS.md'))) {
  pass('FLASHCARDS.md exists');
} else {
  if (fs.existsSync(path.join(ROOT, 'LESSONS.md'))) {
    fail('FLASHCARDS.md missing', 'LESSONS.md found — rename to FLASHCARDS.md\n    → Run: mv LESSONS.md FLASHCARDS.md');
  } else {
    fail('FLASHCARDS.md missing', 'Create FLASHCARDS.md at project root');
  }
}

// Check templates
const requiredTemplates = ['sprint.md', 'sprint_report.md', 'story.md', 'epic.md', 'charter.md', 'roadmap.md', 'risk_registry.md'];
const templatesDir = path.join(ROOT, '.vbounce', 'templates');
let templateCount = 0;
for (const t of requiredTemplates) {
  if (fs.existsSync(path.join(templatesDir, t))) templateCount++;
  else fail(`.vbounce/templates/${t} missing`, `Create from V-Bounce Engine template`);
}
if (templateCount === requiredTemplates.length) pass(`.vbounce/templates/ complete (${templateCount}/${requiredTemplates.length})`);

// Check .bounce directory
if (fs.existsSync(path.join(ROOT, '.vbounce'))) {
  pass('.vbounce/ directory exists');

  // Check state.json
  const stateFile = path.join(ROOT, '.vbounce', 'state.json');
  if (fs.existsSync(stateFile)) {
    try {
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      pass(`state.json valid (sprint ${state.sprint_id}, ${Object.keys(state.stories || {}).length} stories)`);
    } catch (e) {
      fail('state.json exists but is invalid JSON', 'Run: vbounce validate state');
    }
  } else {
    warn('state.json not found — run: vbounce sprint init S-XX --stories STORY-IDS');
  }
} else {
  warn('.vbounce/ directory missing — run: vbounce sprint init S-XX --stories STORY-IDS');
}

// Check brain files (deployed to project root)
const brainFiles = [
  ['CLAUDE.md', 'claude', 'Tier 1 (Claude Code)'],
  ['GEMINI.md', 'gemini', 'Tier 2 (Gemini CLI)'],
  ['AGENTS.md', 'codex', 'Tier 2 (Codex CLI)'],
];
for (const [f, tool, tier] of brainFiles) {
  if (fs.existsSync(path.join(ROOT, f))) pass(`Brain file: ${f} (${tier})`);
  else fail(`Brain file: ${f} missing`, `Run: vbounce init --tool ${tool}`);
}

// Check optional brain files
const optionalBrains = [
  ['.github/copilot-instructions.md', 'copilot'],
  ['.windsurfrules', 'windsurf'],
];
for (const [f, tool] of optionalBrains) {
  if (fs.existsSync(path.join(ROOT, f))) pass(`Brain file: ${f} (Tier 4)`);
  else warn(`Brain file: ${f} not found (optional) — run: vbounce init --tool ${tool}`);
}

// Check skills
const requiredSkills = ['agent-team', 'doc-manager', 'lesson', 'vibe-code-review', 'react-best-practices', 'write-skill', 'improve'];
const skillsDir = path.join(ROOT, '.vbounce', 'skills');
let skillCount = 0;
for (const s of requiredSkills) {
  const skillFile = path.join(skillsDir, s, 'SKILL.md');
  if (fs.existsSync(skillFile)) skillCount++;
  else fail(`.vbounce/skills/${s}/SKILL.md missing`);
}
if (skillCount === requiredSkills.length) pass(`Skills: ${skillCount}/${requiredSkills.length} installed`);

// Check scripts
const requiredScripts = [
  'run_script.sh',
  'validate_report.mjs', 'update_state.mjs', 'validate_state.mjs',
  'validate_sprint_plan.mjs', 'validate_bounce_readiness.mjs',
  'init_sprint.mjs', 'close_sprint.mjs', 'complete_story.mjs',
  'prep_qa_context.mjs', 'prep_arch_context.mjs', 'prep_sprint_context.mjs',
  'prep_sprint_summary.mjs', 'sprint_trends.mjs', 'suggest_improvements.mjs',
  'hotfix_manager.sh',
  'prefill_report.mjs'
];
const scriptsDir = path.join(ROOT, '.vbounce', 'scripts');
let scriptCount = 0;
for (const s of requiredScripts) {
  if (fs.existsSync(path.join(scriptsDir, s))) scriptCount++;
  else fail(`.vbounce/scripts/${s} missing`);
}
if (scriptCount === requiredScripts.length) pass(`Scripts: ${scriptCount}/${requiredScripts.length} available`);

// Check product_plans structure
if (fs.existsSync(path.join(ROOT, 'product_plans'))) {
  pass('product_plans/ directory exists');
} else {
  warn('product_plans/ directory missing — create it to store planning documents');
}

// Check vbounce.config.json
if (fs.existsSync(path.join(ROOT, 'vbounce.config.json'))) {
  pass('vbounce.config.json found');
} else {
  warn('vbounce.config.json not found — using default context limits');
}

// Print results
console.log('\nV-Bounce Engine Health Check');
console.log('========================');
checks.forEach(c => console.log(c));
console.log('');
if (issueCount === 0) {
  console.log('✓ All checks passed.');
} else {
  console.log(`Issues: ${issueCount}`);
  console.log('Run suggested commands to fix.');
}

process.exit(issueCount > 0 ? 1 : 0);
