#!/usr/bin/env node

/**
 * prep_arch_context.mjs
 * Generates an Architect context pack for a story.
 *
 * Usage:
 *   ./scripts/prep_arch_context.mjs STORY-005-02
 *
 * Output: .bounce/arch-context-STORY-005-02.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const storyId = process.argv[2];
if (!storyId) {
  console.error('Usage: prep_arch_context.mjs STORY-ID');
  process.exit(1);
}

// Load config
let config = { maxDiffLines: 500 };
const configFile = path.join(ROOT, 'vbounce.config.json');
if (fs.existsSync(configFile)) {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(configFile, 'utf8')) }; } catch {}
}
const MAX_DIFF_LINES = config.maxDiffLines || 500;

function findFilesMatching(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findFilesMatching(full, pattern));
    else if (pattern.test(e.name)) results.push(full);
  }
  return results;
}

const searchDirs = [
  path.join(ROOT, '.worktrees', storyId, '.bounce', 'reports'),
  path.join(ROOT, '.bounce', 'reports'),
  path.join(ROOT, '.bounce', 'archive'),
];

// 1. Find dev report (required)
const devPattern = new RegExp(`${storyId.replace(/[-]/g, '[-]')}.*-dev\\.md$`);
let devReport = null;
for (const dir of searchDirs) {
  const m = findFilesMatching(dir, devPattern);
  if (m.length > 0) { devReport = m[0]; break; }
}
if (!devReport) {
  console.error(`ERROR: Dev report not found for ${storyId}`);
  process.exit(1);
}

// 2. Find QA report (optional but warn)
const qaPattern = new RegExp(`${storyId.replace(/[-]/g, '[-]')}.*-qa.*\\.md$`);
let qaReport = null;
for (const dir of searchDirs) {
  const m = findFilesMatching(dir, qaPattern);
  if (m.length > 0) { qaReport = m[m.length - 1]; break; } // latest QA report
}
if (!qaReport) console.warn(`⚠  QA report not found for ${storyId} — proceeding without it`);

// 3. Find story spec (required)
const storyPattern = new RegExp(`${storyId.replace(/[-]/g, '[-]')}.*\\.md$`);
const storyMatches = findFilesMatching(path.join(ROOT, 'product_plans'), storyPattern);
if (storyMatches.length === 0) {
  console.error(`ERROR: Story spec not found for ${storyId} in product_plans/`);
  process.exit(1);
}
const storySpecFile = storyMatches[0];

// Parse frontmatters
let devFm = {}, qaFm = {};
try {
  const dc = fs.readFileSync(devReport, 'utf8');
  const dm = dc.match(/^---\s*\n([\s\S]*?)\n---/);
  if (dm) devFm = yaml.load(dm[1]) || {};
} catch {}
if (qaReport) {
  try {
    const qc = fs.readFileSync(qaReport, 'utf8');
    const qm = qc.match(/^---\s*\n([\s\S]*?)\n---/);
    if (qm) qaFm = yaml.load(qm[1]) || {};
  } catch {}
}

// 4. Get git diff
let diffContent = '';
let diffTruncated = false;
const stateFile = path.join(ROOT, '.bounce', 'state.json');
try {
  let diffCmd = 'git diff HEAD~5';
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    const sprintBranch = `sprint/${state.sprint_id}`;
    try {
      execSync(`git rev-parse ${sprintBranch}`, { cwd: ROOT, stdio: 'pipe' });
      diffCmd = `git diff ${sprintBranch}...HEAD`;
    } catch {}
  }
  diffContent = execSync(diffCmd, { cwd: ROOT }).toString();

  if (!diffContent.trim()) {
    console.warn(`⚠  Git diff is empty — proceeding without diff`);
  } else {
    const diffLines = diffContent.split('\n');
    if (diffLines.length > MAX_DIFF_LINES) {
      diffTruncated = true;
      const fullDiffPath = path.join(ROOT, '.bounce', `arch-full-diff-${storyId}.txt`);
      fs.writeFileSync(fullDiffPath, diffContent);
      console.warn(`⚠  Diff truncated at ${MAX_DIFF_LINES} lines (was ${diffLines.length}). Full diff saved to .bounce/arch-full-diff-${storyId}.txt`);
      diffContent = diffLines.slice(0, MAX_DIFF_LINES).join('\n');
    }
  }
} catch (e) {
  console.warn(`⚠  Could not get git diff: ${e.message}`);
}

// 5. Read LESSONS.md
const lessonsFile = path.join(ROOT, 'LESSONS.md');
let lessonsExcerpt = '_No LESSONS.md found_';
if (fs.existsSync(lessonsFile)) {
  const lines = fs.readFileSync(lessonsFile, 'utf8').split('\n');
  lessonsExcerpt = lines.slice(0, 20).join('\n');
  if (lines.length > 20) lessonsExcerpt += `\n_(+${lines.length - 20} more lines)_`;
}

// 6. Assemble context pack
const lines = [
  `# Architect Context: ${storyId}`,
  `> Generated: ${new Date().toISOString().split('T')[0]}`,
  '',
  `## Dev Report Summary`,
  `| Field | Value |`,
  `|-------|-------|`,
  `| Status | ${devFm.status || '—'} |`,
  `| Correction Tax | ${devFm.correction_tax || '—'} |`,
  `| Tests Written | ${devFm.tests_written ?? '—'} |`,
  `| Files Modified | ${Array.isArray(devFm.files_modified) ? devFm.files_modified.length : '—'} |`,
  '',
  `## QA Report Summary`,
  qaReport
    ? [`| Field | Value |`, `|-------|-------|`,
       `| Status | ${qaFm.status || '—'} |`,
       `| Bounce Count | ${qaFm.bounce_count ?? '—'} |`,
       `| Bugs Found | ${qaFm.bugs_found ?? '—'} |`].join('\n')
    : '_QA report not found_',
  '',
  `## Story Spec`,
  `- File: \`${path.relative(ROOT, storySpecFile)}\``,
  `- Read §3 Implementation Guide and §3.1 ADR References before auditing`,
  '',
  `## Git Diff${diffTruncated ? ` (TRUNCATED at ${MAX_DIFF_LINES} lines — full diff in .bounce/arch-full-diff-${storyId}.txt)` : ''}`,
  '```diff',
  diffContent || '(no diff available)',
  '```',
  '',
  `## Relevant Lessons`,
  lessonsExcerpt,
];

const output = lines.join('\n');
const outputFile = path.join(ROOT, '.bounce', `arch-context-${storyId}.md`);
fs.writeFileSync(outputFile, output);
console.log(`✓ Architect context pack written to .bounce/arch-context-${storyId}.md`);
if (diffTruncated) console.log(`  ⚠  Diff truncated — full diff at .bounce/arch-full-diff-${storyId}.txt`);
