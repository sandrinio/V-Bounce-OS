#!/usr/bin/env node

/**
 * suggest_improvements.mjs
 * Generates human-readable improvement suggestions from:
 *   1. Improvement manifest (post_sprint_improve.mjs output)
 *   2. Sprint trends
 *   3. LESSONS.md
 *
 * Overwrites (not appends) to prevent stale suggestion accumulation.
 *
 * Usage:
 *   ./scripts/suggest_improvements.mjs S-05
 *
 * Output: .vbounce/improvement-suggestions.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const sprintId = process.argv[2];
if (!sprintId) {
  console.error('Usage: suggest_improvements.mjs S-XX');
  process.exit(1);
}

const today = new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// 0. Run post_sprint_improve.mjs to generate fresh manifest
// ---------------------------------------------------------------------------

const analyzerScript = path.join(__dirname, 'post_sprint_improve.mjs');
if (fs.existsSync(analyzerScript)) {
  console.log('Running post-sprint improvement analyzer...');
  const result = spawnSync(process.execPath, [analyzerScript, sprintId], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    console.warn('⚠ Analyzer returned non-zero — continuing with available data.');
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// 1. Read improvement manifest (from post_sprint_improve.mjs)
// ---------------------------------------------------------------------------

const manifestPath = path.join(ROOT, '.vbounce', 'improvement-manifest.json');
let manifest = null;
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    console.warn('⚠ Could not parse improvement-manifest.json');
  }
}

// ---------------------------------------------------------------------------
// 2. Read trends if available
// ---------------------------------------------------------------------------

const trendsFile = path.join(ROOT, '.vbounce', 'trends.md');
let trendsContent = null;
if (fs.existsSync(trendsFile)) {
  trendsContent = fs.readFileSync(trendsFile, 'utf8');
}

// ---------------------------------------------------------------------------
// 3. Read LESSONS.md
// ---------------------------------------------------------------------------

const lessonsFile = path.join(ROOT, 'LESSONS.md');
let lessonCount = 0;
let oldLessons = [];
if (fs.existsSync(lessonsFile)) {
  const lines = fs.readFileSync(lessonsFile, 'utf8').split('\n');
  const lessonEntries = lines.filter(l => /^###\s+\[\d{4}-\d{2}-\d{2}\]/.test(l));
  lessonCount = lessonEntries.length;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  oldLessons = lessonEntries.filter(entry => {
    const dateMatch = entry.match(/\[(\d{4}-\d{2}-\d{2})\]/);
    if (dateMatch) return new Date(dateMatch[1]) < cutoff;
    return false;
  });
}

// ---------------------------------------------------------------------------
// 4. Read improvement-log for rejected items
// ---------------------------------------------------------------------------

const improvementLog = path.join(ROOT, '.vbounce', 'improvement-log.md');
let rejectedItems = [];
if (fs.existsSync(improvementLog)) {
  const logContent = fs.readFileSync(improvementLog, 'utf8');
  const rejectedMatch = logContent.match(/## Rejected\n[\s\S]*?(?=\n## |$)/);
  if (rejectedMatch) {
    rejectedItems = rejectedMatch[0].split('\n')
      .filter(l => l.startsWith('|') && !l.startsWith('| Sprint'))
      .map(l => l.split('|')[2]?.trim())
      .filter(Boolean);
  }
}

// ---------------------------------------------------------------------------
// 5. Parse sprint stats from trends
// ---------------------------------------------------------------------------

let lastSprintStats = null;
if (trendsContent) {
  const rows = trendsContent.split('\n').filter(l => l.match(/^\| S-\d{2} \|/));
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1].split('|').map(s => s.trim()).filter(Boolean);
    lastSprintStats = {
      sprintId: lastRow[0],
      stories: parseInt(lastRow[1]) || 0,
      firstPassRate: parseInt(lastRow[2]) || 100,
      avgBounces: parseFloat(lastRow[3]) || 0,
      avgTax: parseFloat(lastRow[4]) || 0,
    };
  }
}

// ---------------------------------------------------------------------------
// 6. Build suggestions
// ---------------------------------------------------------------------------

const suggestions = [];
let itemNum = 1;

// Impact level badge
function badge(impact) {
  const badges = {
    P0: '🔴 P0 Critical',
    P1: '🟠 P1 High',
    P2: '🟡 P2 Medium',
    P3: '⚪ P3 Low',
  };
  return badges[impact?.level] || '⚪ Unrated';
}

// --- Manifest-driven suggestions (retro + lessons + effectiveness) ---
if (manifest && manifest.proposals) {
  for (const proposal of manifest.proposals) {
    // Skip previously rejected
    if (rejectedItems.some(r => proposal.title.includes(r))) continue;

    if (proposal.source === 'retro') {
      suggestions.push({
        num: itemNum++,
        category: 'Retro',
        impact: proposal.impact,
        title: proposal.title,
        detail: [
          `**Area:** ${proposal.area}`,
          `**Source Agent:** ${proposal.sourceAgent}`,
          `**Severity:** ${proposal.severity}`,
          proposal.recurring ? `**Recurring:** Yes — found in ${proposal.recurrenceSprints.join(', ')} (${proposal.recurrenceCount}x)` : null,
          `**Suggested Fix:** ${proposal.suggestedFix}`,
        ].filter(Boolean).join('\n'),
        target: mapAreaToTarget(proposal.area),
        effort: proposal.severity === 'Blocker' ? 'Medium' : 'Low',
      });
    } else if (proposal.source === 'lesson') {
      suggestions.push({
        num: itemNum++,
        category: 'Lesson → Automation',
        impact: proposal.impact,
        title: proposal.title,
        detail: [
          `**Rule:** ${proposal.rule}`,
          `**What happened:** ${proposal.whatHappened}`,
          `**Active for:** ${proposal.ageSprints} sprint(s) (since ${proposal.lessonDate})`,
          `**Automation type:** ${proposal.automationType}`,
          `**Action:** ${proposal.automationDetail?.action}`,
          `**Rationale:** ${proposal.automationDetail?.rationale}`,
        ].filter(Boolean).join('\n'),
        target: mapAutomationTypeToTarget(proposal.automationType),
        effort: proposal.automationDetail?.effort || 'Low',
      });
    } else if (proposal.source === 'effectiveness_check') {
      suggestions.push({
        num: itemNum++,
        category: 'Effectiveness',
        impact: proposal.impact,
        title: proposal.title,
        detail: [
          `**Status:** ${proposal.detail}`,
          `**Originally applied in:** ${proposal.appliedInSprint}`,
          '**Action:** Re-examine the original fix — it did not resolve the underlying issue.',
        ].join('\n'),
        target: 'Review original improvement in .vbounce/improvement-log.md',
        effort: 'Medium',
      });
    }
  }
}

// --- Metric-driven suggestions (from trends) ---
if (lastSprintStats) {
  if (lastSprintStats.firstPassRate < 80) {
    suggestions.push({
      num: itemNum++,
      category: 'Metrics',
      impact: { level: 'P1', label: 'High' },
      title: `Low first-pass rate (${lastSprintStats.firstPassRate}%)`,
      detail: `First-pass rate was below 80% in ${lastSprintStats.sprintId}. This suggests spec ambiguity or insufficient context packs.`,
      target: '.vbounce/scripts/validate_bounce_readiness.mjs',
      effort: 'Low',
    });
  }

  if (lastSprintStats.avgTax > 10) {
    suggestions.push({
      num: itemNum++,
      category: 'Metrics',
      impact: { level: 'P1', label: 'High' },
      title: `High correction tax (${lastSprintStats.avgTax}% average)`,
      detail: 'Average correction tax exceeded 10%, indicating significant human intervention.',
      target: '.vbounce/skills/agent-team/SKILL.md Step 1',
      effort: 'Low',
    });
  }

  if (lastSprintStats.avgBounces > 0.5) {
    suggestions.push({
      num: itemNum++,
      category: 'Metrics',
      impact: { level: 'P2', label: 'Medium' },
      title: `High bounce rate (${lastSprintStats.avgBounces} avg per story)`,
      detail: 'Run `vbounce trends` to see root cause breakdown.',
      target: '.vbounce/scripts/sprint_trends.mjs',
      effort: 'Low',
    });
  }
}

// --- Lesson graduation ---
if (oldLessons.length > 0) {
  const notRejected = oldLessons.filter(l => !rejectedItems.some(r => l.includes(r)));
  if (notRejected.length > 0) {
    suggestions.push({
      num: itemNum++,
      category: 'Graduation',
      impact: { level: 'P2', label: 'Medium' },
      title: `${notRejected.length} lesson(s) older than 90 days — graduation candidates`,
      detail: notRejected.map(l => `  - ${l}`).join('\n'),
      target: 'LESSONS.md → .claude/agents/',
      effort: 'Low',
    });
  }
}

// --- Health check ---
suggestions.push({
  num: itemNum++,
  category: 'Health',
  impact: { level: 'P3', label: 'Low' },
  title: 'Run vbounce doctor',
  detail: 'Verify the V-Bounce Engine installation is healthy after this sprint.',
  target: '.vbounce/scripts/doctor.mjs',
  effort: 'Trivial',
});

// ---------------------------------------------------------------------------
// 7. Format output
// ---------------------------------------------------------------------------

function mapAreaToTarget(area) {
  const map = {
    'Templates': 'templates/*.md',
    'Agent Handoffs': '.claude/agents/*.md',
    'RAG Pipeline': '.vbounce/scripts/prep_*.mjs',
    'Skills': 'skills/*/SKILL.md',
    'Process Flow': '.vbounce/skills/agent-team/SKILL.md',
    'Tooling & Scripts': 'scripts/*',
  };
  return map[area] || area;
}

function mapAutomationTypeToTarget(type) {
  const map = {
    'gate_check': '.vbounce/gate-checks.json OR .vbounce/scripts/pre_gate_runner.sh',
    'script': 'scripts/',
    'template_field': 'templates/*.md',
    'agent_config': '.claude/agents/*.md',
  };
  return map[type] || type;
}

const suggestionBlocks = suggestions.map(s => {
  return `### ${s.num}. [${badge(s.impact)}] [${s.category}] ${s.title}
${s.detail}

**Target:** \`${s.target}\`
**Effort:** ${s.effort}`;
}).join('\n\n---\n\n');

// Impact level reference
const impactRef = `## Impact Levels

| Level | Label | Meaning | Timeline |
|-------|-------|---------|----------|
| **P0** | 🔴 Critical | Blocks agent work or causes incorrect output | Fix before next sprint |
| **P1** | 🟠 High | Causes rework — bounces, wasted tokens, repeated manual steps | Fix this improvement cycle |
| **P2** | 🟡 Medium | Friction that slows agents but does not block | Fix within 2 sprints |
| **P3** | ⚪ Low | Polish — nice-to-have, batch with other improvements | Batch when convenient |`;

// Summary stats
const summarySection = manifest ? `## Summary

| Source | Count |
|--------|-------|
| Retro (§5 findings) | ${manifest.summary.bySource.retro} |
| Lesson → Automation | ${manifest.summary.bySource.lesson} |
| Effectiveness checks | ${manifest.summary.bySource.effectiveness_check} |
| Metric-driven | ${suggestions.filter(s => s.category === 'Metrics').length} |
| **Total** | **${suggestions.length}** |

| Impact | Count |
|--------|-------|
| 🔴 P0 Critical | ${manifest.summary.byImpact.P0} |
| 🟠 P1 High | ${manifest.summary.byImpact.P1 + suggestions.filter(s => s.category === 'Metrics' && s.impact.level === 'P1').length} |
| 🟡 P2 Medium | ${manifest.summary.byImpact.P2 + suggestions.filter(s => s.category === 'Metrics' && s.impact.level === 'P2').length} |
| ⚪ P3 Low | ${manifest.summary.byImpact.P3 + suggestions.filter(s => s.category === 'Health').length} |` : '';

const output = [
  `# Improvement Suggestions (post ${sprintId})`,
  `> Generated: ${today}. Review each item. Approved items are applied by the Lead at sprint boundary.`,
  `> Rejected items go to \`.vbounce/improvement-log.md\` with reason.`,
  `> Applied items go to \`.vbounce/improvement-log.md\` under Applied.`,
  '',
  impactRef,
  '',
  summarySection,
  '',
  '---',
  '',
  suggestionBlocks || '_No suggestions generated — all metrics look healthy!_',
  '',
  '---',
  '',
  `## How to Apply`,
  `- **Approve** → Lead applies change, records in \`.vbounce/improvement-log.md\` under Applied`,
  `- **Reject** → Record in \`.vbounce/improvement-log.md\` under Rejected with reason`,
  `- **Defer** → Record in \`.vbounce/improvement-log.md\` under Deferred`,
  '',
  `> Framework changes (.claude/agents/, .vbounce/skills/, .vbounce/templates/) are applied at sprint boundaries only — never mid-sprint.`,
  `> Use \`/improve\` skill to have the Team Lead apply approved changes with brain-file sync.`,
].join('\n');

const outputFile = path.join(ROOT, '.vbounce', 'improvement-suggestions.md');
fs.writeFileSync(outputFile, output);
console.log(`✓ Improvement suggestions written to .vbounce/improvement-suggestions.md`);
console.log(`  ${suggestions.length} suggestion(s) generated`);
