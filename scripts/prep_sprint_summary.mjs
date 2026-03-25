#!/usr/bin/env node

/**
 * prep_sprint_summary.mjs
 * Generates sprint metrics summary from archived agent reports.
 *
 * Usage:
 *   ./.vbounce/scripts/prep_sprint_summary.mjs S-05
 *
 * Output: .vbounce/sprint-summary-S-05.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const sprintId = process.argv[2];
if (!sprintId) {
  console.error('Usage: prep_sprint_summary.mjs S-XX');
  process.exit(1);
}

const archiveDir = path.join(ROOT, '.vbounce', 'archive', sprintId);
if (!fs.existsSync(archiveDir)) {
  console.error(`ERROR: Archive directory not found: ${archiveDir}`);
  console.error('No archived reports found for ' + sprintId);
  process.exit(1);
}

function findReports(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findReports(full));
    else if (e.name.endsWith('.md')) results.push(full);
  }
  return results;
}

const allReports = findReports(archiveDir);
if (allReports.length === 0) {
  console.error(`ERROR: No reports found in ${archiveDir}`);
  process.exit(1);
}

function parseFm(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (match) return yaml.load(match[1]) || {};
  } catch {}
  return {};
}

// Categorize reports
const devReports = allReports.filter(f => /-dev(-bounce\d+)?\.md$/.test(f));
const qaReports = allReports.filter(f => /-qa(-bounce\d+)?\.md$/.test(f));
const archReports = allReports.filter(f => /-arch(-bounce\d+)?\.md$/.test(f));

// Extract unique story IDs
const storyIds = new Set();
const storyPattern = /(STORY-[\w-]+)-(?:dev|qa|arch|devops)/;
for (const r of allReports) {
  const m = path.basename(r).match(storyPattern);
  if (m) storyIds.add(m[1]);
}

// Metrics
let totalTokens = 0;
let totalQaBounces = 0;
let totalArchBounces = 0;
let correctionTaxSum = 0;
let correctionTaxCount = 0;
let firstPassCount = 0;
let escalatedCount = 0;
const storyMetrics = {};

for (const id of storyIds) {
  storyMetrics[id] = { qaBounces: 0, archBounces: 0, correctionTax: 0, done: false };
}

for (const r of devReports) {
  const fm = parseFm(r);
  if (fm.tokens_used) totalTokens += fm.tokens_used;
  const tax = parseFloat(String(fm.correction_tax || '0').replace('%', ''));
  if (!isNaN(tax)) { correctionTaxSum += tax; correctionTaxCount++; }
  const m = path.basename(r).match(storyPattern);
  if (m && storyMetrics[m[1]]) storyMetrics[m[1]].correctionTax = tax;
}

for (const r of qaReports) {
  const fm = parseFm(r);
  if (fm.tokens_used) totalTokens += fm.tokens_used;
  if (fm.status === 'FAIL') {
    const m = path.basename(r).match(storyPattern);
    if (m && storyMetrics[m[1]]) storyMetrics[m[1]].qaBounces++;
    totalQaBounces++;
  }
}

for (const r of archReports) {
  const fm = parseFm(r);
  if (fm.tokens_used) totalTokens += fm.tokens_used;
  if (fm.status === 'FAIL') {
    const m = path.basename(r).match(storyPattern);
    if (m && storyMetrics[m[1]]) storyMetrics[m[1]].archBounces++;
    totalArchBounces++;
  }
}

for (const [id, m] of Object.entries(storyMetrics)) {
  if (m.qaBounces === 0) firstPassCount++;
}

const totalStories = storyIds.size;
const avgCorrectionTax = correctionTaxCount > 0 ? (correctionTaxSum / correctionTaxCount).toFixed(1) : '0.0';
const firstPassRate = totalStories > 0 ? ((firstPassCount / totalStories) * 100).toFixed(0) : '0';

// Build story breakdown table
const storyBreakdownRows = [...storyIds].map(id => {
  const m = storyMetrics[id];
  return `| ${id} | ${m.qaBounces} | ${m.archBounces} | ${m.correctionTax}% |`;
}).join('\n');

const output = [
  `# Sprint Summary: ${sprintId}`,
  `> Generated: ${new Date().toISOString().split('T')[0]}`,
  '',
  `## Metrics`,
  `| Metric | Value |`,
  `|--------|-------|`,
  `| Total Stories | ${totalStories} |`,
  `| First-Pass Rate | ${firstPassRate}% |`,
  `| Total QA Bounces | ${totalQaBounces} |`,
  `| Total Arch Bounces | ${totalArchBounces} |`,
  `| Avg Correction Tax | ${avgCorrectionTax}% |`,
  `| Total Tokens Used | ${totalTokens.toLocaleString()} |`,
  '',
  `## Story Breakdown`,
  `| Story | QA Bounces | Arch Bounces | Correction Tax |`,
  `|-------|------------|--------------|----------------|`,
  storyBreakdownRows || '| (no stories) | — | — | — |',
].join('\n');

const outputFile = path.join(ROOT, '.vbounce', `sprint-summary-${sprintId}.md`);
fs.writeFileSync(outputFile, output);
console.log(`✓ Sprint summary written to .vbounce/sprint-summary-${sprintId}.md`);
console.log(`  Stories: ${totalStories} | First-pass: ${firstPassRate}% | Total tokens: ${totalTokens.toLocaleString()}`);
