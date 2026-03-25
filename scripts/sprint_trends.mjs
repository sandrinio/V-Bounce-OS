#!/usr/bin/env node

/**
 * sprint_trends.mjs
 * Cross-sprint trend analysis from archived reports.
 *
 * Usage:
 *   ./scripts/sprint_trends.mjs
 *
 * Output: .vbounce/trends.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const archiveBase = path.join(ROOT, '.vbounce', 'archive');

if (!fs.existsSync(archiveBase)) {
  console.log('No sprint history found (.vbounce/archive/ does not exist)');
  process.exit(0);
}

const sprintDirs = fs.readdirSync(archiveBase)
  .filter(d => /^S-\d{2}$/.test(d))
  .sort();

if (sprintDirs.length === 0) {
  console.log('No sprint history found (no S-XX directories in .vbounce/archive/)');
  process.exit(0);
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

function parseFm(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (match) return yaml.load(match[1]) || {};
  } catch {}
  return {};
}

const sprintStats = [];
const rootCauseCounts = {};

for (const sprintId of sprintDirs) {
  const sprintDir = path.join(archiveBase, sprintId);
  const reports = findReports(sprintDir);

  const storyIds = new Set();
  const pattern = /(STORY-[\w-]+)-(?:dev|qa|arch|devops)/;
  for (const r of reports) {
    const m = path.basename(r).match(pattern);
    if (m) storyIds.add(m[1]);
  }

  let qaFails = 0, archFails = 0, firstPassCount = 0;
  let correctionTaxSum = 0, correctionTaxCount = 0, totalTokens = 0;
  const storyQaBounces = {};

  for (const r of reports) {
    const fm = parseFm(r);
    if (fm.tokens_used) totalTokens += fm.tokens_used;

    const bn = path.basename(r);
    if (/-qa(-bounce\d+)?\.md$/.test(bn) && fm.status === 'FAIL') {
      qaFails++;
      const m = bn.match(pattern);
      if (m) storyQaBounces[m[1]] = (storyQaBounces[m[1]] || 0) + 1;

      // Collect root causes
      if (fm.root_cause) {
        rootCauseCounts[fm.root_cause] = rootCauseCounts[fm.root_cause] || {};
        rootCauseCounts[fm.root_cause][sprintId] = (rootCauseCounts[fm.root_cause][sprintId] || 0) + 1;
      }
    }
    if (/-arch(-bounce\d+)?\.md$/.test(bn) && fm.status === 'FAIL') {
      archFails++;
      if (fm.root_cause) {
        rootCauseCounts[fm.root_cause] = rootCauseCounts[fm.root_cause] || {};
        rootCauseCounts[fm.root_cause][sprintId] = (rootCauseCounts[fm.root_cause][sprintId] || 0) + 1;
      }
    }
    if (/-dev\.md$/.test(bn)) {
      const tax = parseFloat(String(fm.correction_tax || '0').replace('%', ''));
      if (!isNaN(tax)) { correctionTaxSum += tax; correctionTaxCount++; }
    }
  }

  for (const [id] of Object.entries(storyQaBounces)) {
    if (!storyQaBounces[id]) firstPassCount++;
  }
  // Stories with no QA failures = first pass
  for (const id of storyIds) {
    if (!storyQaBounces[id]) firstPassCount++;
  }

  const totalStories = storyIds.size;
  const firstPassRate = totalStories > 0 ? Math.round((firstPassCount / totalStories) * 100) : 100;
  const avgBounces = totalStories > 0 ? ((qaFails + archFails) / totalStories).toFixed(2) : '0.00';
  const avgTax = correctionTaxCount > 0 ? (correctionTaxSum / correctionTaxCount).toFixed(1) : '0.0';

  sprintStats.push({ sprintId, totalStories, firstPassRate, avgBounces, avgTax, totalTokens });
}

// Build process health table
const healthRows = sprintStats.map(s =>
  `| ${s.sprintId} | ${s.totalStories} | ${s.firstPassRate}% | ${s.avgBounces} | ${s.avgTax}% | ${s.totalTokens.toLocaleString()} |`
).join('\n');

// Build root cause table if data available
let rootCauseSection = '';
const allCauses = Object.keys(rootCauseCounts);
if (allCauses.length > 0) {
  const causeRows = allCauses.map(cause => {
    const counts = sprintDirs.map(s => rootCauseCounts[cause][s] || 0);
    return `| ${cause} | ${counts.join(' | ')} |`;
  });
  rootCauseSection = [
    '',
    `## Bounce Root Causes`,
    `| Category | ${sprintDirs.join(' | ')} |`,
    `|----------|${sprintDirs.map(() => '---').join('|')}|`,
    ...causeRows,
  ].join('\n');
}

const output = [
  `# V-Bounce Trends`,
  `> Generated: ${new Date().toISOString().split('T')[0]} | Sprints analyzed: ${sprintDirs.join(', ')}`,
  '',
  `## Process Health`,
  `| Sprint | Stories | First-Pass Rate | Avg Bounces | Avg Correction Tax | Total Tokens |`,
  `|--------|---------|----------------|-------------|-------------------|--------------|`,
  healthRows || '| (no data) | — | — | — | — | — |',
  rootCauseSection,
  '',
  `---`,
  `Run \`vbounce suggest S-XX\` to generate improvement recommendations based on this data.`,
].join('\n');

const outputFile = path.join(ROOT, '.vbounce', 'trends.md');
fs.writeFileSync(outputFile, output);
console.log(`✓ Trends written to .vbounce/trends.md`);
console.log(`  Sprints analyzed: ${sprintDirs.join(', ')}`);
