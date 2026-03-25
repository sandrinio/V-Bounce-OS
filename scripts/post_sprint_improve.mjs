#!/usr/bin/env node

/**
 * post_sprint_improve.mjs
 * Post-sprint self-improvement analyzer.
 *
 * Parses sprint report §5 Framework Self-Assessment tables, cross-references
 * LESSONS.md for automation candidates, and checks archived sprint reports
 * for recurring patterns. Outputs a structured improvement manifest.
 *
 * Usage:
 *   ./.vbounce/scripts/post_sprint_improve.mjs S-05
 *
 * Output: .vbounce/improvement-manifest.json
 *         (consumed by suggest_improvements.mjs and the /improve skill)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const sprintId = process.argv[2];
if (!sprintId || !/^S-\d{2}$/.test(sprintId)) {
  console.error('Usage: post_sprint_improve.mjs S-XX');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Impact Levels
// ---------------------------------------------------------------------------
// P0 Critical  — Blocks agent work or causes incorrect output. Fix before next sprint.
// P1 High      — Causes rework (bounces, wasted tokens, repeated manual steps). Fix this cycle.
// P2 Medium    — Friction that slows agents but doesn't block. Fix within 2 sprints.
// P3 Low       — Nice-to-have polish. Batch with other improvements.

const IMPACT = {
  P0: { level: 'P0', label: 'Critical', description: 'Blocks agent work or causes incorrect output' },
  P1: { level: 'P1', label: 'High', description: 'Causes rework — bounces, wasted tokens, repeated manual steps' },
  P2: { level: 'P2', label: 'Medium', description: 'Friction that slows agents but does not block' },
  P3: { level: 'P3', label: 'Low', description: 'Polish — nice-to-have, batch with other improvements' },
};

// ---------------------------------------------------------------------------
// 1. Parse Sprint Report §5 Framework Self-Assessment
// ---------------------------------------------------------------------------

/**
 * Extract §5 findings from a sprint report file.
 * Returns array of { area, finding, sourceAgent, severity, suggestedFix, sprintId }
 */
function parseRetroFindings(reportPath, reportSprintId) {
  if (!fs.existsSync(reportPath)) return [];

  const content = fs.readFileSync(reportPath, 'utf8');
  const findings = [];

  // Match §5 section (or "## 5. Retrospective" / "## 5. Framework Self-Assessment")
  const section5Match = content.match(/## 5\.\s+(Retrospective|Framework Self-Assessment)[\s\S]*?(?=\n## 6\.|$)/);
  if (!section5Match) return findings;

  const section5 = section5Match[0];

  // Extract subsection areas
  const areas = ['Templates', 'Agent Handoffs', 'RAG Pipeline', 'Skills', 'Process Flow', 'Tooling & Scripts'];

  for (const area of areas) {
    // Find the area's table within §5
    const areaRegex = new RegExp(`####?\\s+${area.replace('&', '&')}[\\s\\S]*?(?=\\n####?\\s|\\n## |\\n---\\s*$|$)`);
    const areaMatch = section5.match(areaRegex);
    if (!areaMatch) continue;

    const areaContent = areaMatch[0];

    // Parse table rows: | Finding | Source Agent | Severity | Suggested Fix |
    const rows = areaContent.split('\n').filter(line =>
      line.startsWith('|') &&
      !line.includes('Finding') &&
      !line.includes('---') &&
      line.split('|').length >= 5
    );

    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        // Skip template placeholder rows
        if (cells[0].startsWith('{') || cells[0].startsWith('e.g.')) continue;

        findings.push({
          area,
          finding: cells[0],
          sourceAgent: cells[1],
          severity: cells[2],
          suggestedFix: cells[3],
          sprintId: reportSprintId,
        });
      }
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// 2. Parse LESSONS.md for automation candidates
// ---------------------------------------------------------------------------

/**
 * Parse LESSONS.md and classify each lesson by automation potential.
 * Returns array of { date, title, whatHappened, rule, age, automationType, impact }
 */
function parseLessons(lessonsPath) {
  if (!fs.existsSync(lessonsPath)) return [];

  const content = fs.readFileSync(lessonsPath, 'utf8');
  const lessons = [];
  const today = new Date();

  // Match lesson entries: ### [YYYY-MM-DD] Title
  const entryRegex = /### \[(\d{4}-\d{2}-\d{2})\]\s+(.+?)(?=\n### \[|\n## |$)/gs;
  let match;

  while ((match = entryRegex.exec(content)) !== null) {
    const date = match[1];
    const title = match[2].trim();
    const body = match[0];

    const whatHappenedMatch = body.match(/\*\*What happened:\*\*\s*(.+)/);
    const ruleMatch = body.match(/\*\*Rule:\*\*\s*(.+)/);

    const lessonDate = new Date(date);
    const ageInDays = Math.floor((today - lessonDate) / (1000 * 60 * 60 * 24));
    const ageInSprints = Math.ceil(ageInDays / 14); // approximate 2-week sprints

    const rule = ruleMatch ? ruleMatch[1].trim() : '';

    // Classify automation potential based on rule keywords
    const automationType = classifyLessonAutomation(rule);

    lessons.push({
      date,
      title,
      whatHappened: whatHappenedMatch ? whatHappenedMatch[1].trim() : '',
      rule,
      ageDays: ageInDays,
      ageSprints: ageInSprints,
      automationType,
    });
  }

  return lessons;
}

/**
 * Classify what type of automation a lesson rule could become.
 */
function classifyLessonAutomation(rule) {
  const lower = rule.toLowerCase();

  // Gate check patterns: "Always check...", "Never use...", "Must have..."
  if (/always (check|verify|ensure|validate|confirm|test|run)/i.test(lower)) return 'gate_check';
  if (/never (use|import|add|create|modify|delete|skip)/i.test(lower)) return 'gate_check';
  if (/must (have|include|contain|use|be)/i.test(lower)) return 'gate_check';
  if (/do not|don't|avoid/i.test(lower)) return 'gate_check';

  // Script patterns: "Run X before Y", "Use X instead of Y"
  if (/run .+ before/i.test(lower)) return 'script';
  if (/use .+ instead of/i.test(lower)) return 'script';

  // Template patterns: "Include X in...", "Add X to..."
  if (/include .+ in/i.test(lower)) return 'template_field';
  if (/add .+ to (the )?(story|epic|sprint|report|template)/i.test(lower)) return 'template_field';

  // Agent config patterns: general rules about behavior
  if (/always|never|before|after/i.test(lower)) return 'agent_config';

  return 'agent_config'; // default: graduate to agent brain
}

// ---------------------------------------------------------------------------
// 3. Cross-reference archived sprint reports for recurring patterns
// ---------------------------------------------------------------------------

/**
 * Find findings that recur across multiple sprint reports.
 * Returns map of finding → { count, sprints, latestSeverity }
 */
function findRecurringPatterns(archiveDir, currentFindings) {
  const allFindings = [...currentFindings];

  // Read archived sprint reports
  if (fs.existsSync(archiveDir)) {
    const sprintDirs = fs.readdirSync(archiveDir).filter(d => /^S-\d{2}$/.test(d));
    for (const dir of sprintDirs) {
      const reportPath = path.join(archiveDir, dir, `sprint-report-${dir}.md`);
      const archived = parseRetroFindings(reportPath, dir);
      allFindings.push(...archived);
    }
  }

  // Group by normalized finding text (lowercase, trimmed)
  const patterns = {};
  for (const f of allFindings) {
    // Normalize: lowercase, remove quotes, collapse whitespace
    const key = f.finding.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
    if (!patterns[key]) {
      patterns[key] = {
        finding: f.finding,
        area: f.area,
        count: 0,
        sprints: [],
        severities: [],
        suggestedFixes: [],
      };
    }
    patterns[key].count++;
    if (!patterns[key].sprints.includes(f.sprintId)) {
      patterns[key].sprints.push(f.sprintId);
    }
    patterns[key].severities.push(f.severity);
    if (f.suggestedFix && !patterns[key].suggestedFixes.includes(f.suggestedFix)) {
      patterns[key].suggestedFixes.push(f.suggestedFix);
    }
  }

  return patterns;
}

// ---------------------------------------------------------------------------
// 4. Check previous improvement effectiveness
// ---------------------------------------------------------------------------

/**
 * Read improvement-log.md and check if applied improvements resolved their findings.
 */
function checkImprovementEffectiveness(logPath, currentFindings) {
  if (!fs.existsSync(logPath)) return [];

  const content = fs.readFileSync(logPath, 'utf8');
  const unresolved = [];

  // Extract applied items
  const appliedMatch = content.match(/## Applied\n[\s\S]*?(?=\n## |$)/);
  if (!appliedMatch) return [];

  const rows = appliedMatch[0].split('\n')
    .filter(l => l.startsWith('|') && !l.startsWith('| Sprint') && !l.includes('---'));

  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      const appliedTitle = cells[1];
      // Check if any current finding matches the applied improvement
      const stillPresent = currentFindings.some(f =>
        f.finding.toLowerCase().includes(appliedTitle.toLowerCase()) ||
        appliedTitle.toLowerCase().includes(f.finding.toLowerCase().substring(0, 30))
      );
      if (stillPresent) {
        unresolved.push({
          title: appliedTitle,
          appliedInSprint: cells[0],
          status: 'UNRESOLVED — finding persists after improvement was applied',
        });
      }
    }
  }

  return unresolved;
}

// ---------------------------------------------------------------------------
// 5. Generate improvement proposals
// ---------------------------------------------------------------------------

function generateProposals(currentFindings, lessons, patterns, unresolvedImprovements) {
  const proposals = [];
  let id = 1;

  // --- From §5 findings ---
  for (const finding of currentFindings) {
    const patternKey = finding.finding.toLowerCase().replace(/["']/g, '').replace(/\s+/g, ' ').trim();
    const pattern = patterns[patternKey];
    const isRecurring = pattern && pattern.sprints.length > 1;

    // Determine impact
    let impact;
    if (finding.severity === 'Blocker' && isRecurring) {
      impact = IMPACT.P0;
    } else if (finding.severity === 'Blocker') {
      impact = IMPACT.P1;
    } else if (isRecurring) {
      impact = IMPACT.P1;
    } else {
      impact = IMPACT.P2;
    }

    proposals.push({
      id: id++,
      source: 'retro',
      type: mapAreaToType(finding.area),
      title: finding.finding,
      area: finding.area,
      sourceAgent: finding.sourceAgent,
      severity: finding.severity,
      suggestedFix: finding.suggestedFix,
      impact,
      recurring: isRecurring,
      recurrenceCount: pattern ? pattern.sprints.length : 1,
      recurrenceSprints: pattern ? pattern.sprints : [finding.sprintId],
    });
  }

  // --- From lessons: automation candidates ---
  for (const lesson of lessons) {
    // Only propose automation for lessons 3+ sprints old (graduation candidates)
    // or lessons with clear mechanical rules regardless of age
    const isGraduationCandidate = lesson.ageSprints >= 3;
    const isMechanical = lesson.automationType === 'gate_check' || lesson.automationType === 'script';

    if (!isGraduationCandidate && !isMechanical) continue;

    let impact;
    if (isMechanical) {
      // Mechanical checks save tokens every sprint
      impact = IMPACT.P1;
    } else if (isGraduationCandidate) {
      impact = IMPACT.P2;
    } else {
      impact = IMPACT.P3;
    }

    proposals.push({
      id: id++,
      source: 'lesson',
      type: lesson.automationType,
      title: `Automate lesson: "${lesson.title}"`,
      rule: lesson.rule,
      whatHappened: lesson.whatHappened,
      lessonDate: lesson.date,
      ageSprints: lesson.ageSprints,
      impact,
      automationType: lesson.automationType,
      automationDetail: generateAutomationDetail(lesson),
    });
  }

  // --- From unresolved improvements ---
  for (const unresolved of unresolvedImprovements) {
    proposals.push({
      id: id++,
      source: 'effectiveness_check',
      type: 're-examine',
      title: `Unresolved: "${unresolved.title}"`,
      detail: unresolved.status,
      appliedInSprint: unresolved.appliedInSprint,
      impact: IMPACT.P1, // Previous fix didn't work — escalate priority
    });
  }

  // Sort by impact level (P0 first)
  proposals.sort((a, b) => a.impact.level.localeCompare(b.impact.level));

  return proposals;
}

function mapAreaToType(area) {
  const map = {
    'Templates': 'template_patch',
    'Agent Handoffs': 'report_field',
    'RAG Pipeline': 'tooling',
    'Skills': 'skill_update',
    'Process Flow': 'process_change',
    'Tooling & Scripts': 'script',
  };
  return map[area] || 'other';
}

function generateAutomationDetail(lesson) {
  switch (lesson.automationType) {
    case 'gate_check':
      return {
        action: 'Add to gate-checks.json or pre_gate_runner.sh',
        rationale: `Rule "${lesson.rule}" can be enforced mechanically via grep/lint pattern`,
        effort: 'Low',
      };
    case 'script':
      return {
        action: 'Create or extend a validation script',
        rationale: `Rule describes a procedural check that should run automatically`,
        effort: 'Low-Medium',
      };
    case 'template_field':
      return {
        action: 'Add field or section to relevant template',
        rationale: `Rule indicates missing information that should be captured at planning time`,
        effort: 'Trivial',
      };
    case 'agent_config':
      return {
        action: 'Graduate to agent brain config (brains/claude-agents/*.md)',
        rationale: `Lesson has been active ${lesson.ageSprints}+ sprints — promote to permanent rule`,
        effort: 'Low',
      };
    default:
      return { action: 'Review manually', rationale: 'Could not auto-classify', effort: 'Unknown' };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const today = new Date().toISOString().split('T')[0];
const archiveDir = path.join(ROOT, '.vbounce', 'archive');
const lessonsPath = path.join(ROOT, 'LESSONS.md');
const improvementLogPath = path.join(ROOT, '.vbounce', 'improvement-log.md');

// Current sprint report
const reportPath = path.join(ROOT, '.vbounce', `sprint-report-${sprintId}.md`);
const reportArchivePath = path.join(archiveDir, sprintId, `sprint-report-${sprintId}.md`);
const actualReportPath = fs.existsSync(reportPath) ? reportPath : reportArchivePath;

// 1. Parse current sprint retro
const currentFindings = parseRetroFindings(actualReportPath, sprintId);
console.log(`  Retro findings from ${sprintId}: ${currentFindings.length}`);

// 2. Parse lessons
const lessons = parseLessons(lessonsPath);
console.log(`  Lessons in LESSONS.md: ${lessons.length}`);

// 3. Cross-reference archived reports
const patterns = findRecurringPatterns(archiveDir, currentFindings);
const recurringCount = Object.values(patterns).filter(p => p.sprints.length > 1).length;
console.log(`  Recurring patterns across sprints: ${recurringCount}`);

// 4. Check improvement effectiveness
const unresolved = checkImprovementEffectiveness(improvementLogPath, currentFindings);
if (unresolved.length > 0) {
  console.log(`  ⚠ Unresolved improvements from previous cycles: ${unresolved.length}`);
}

// 5. Generate proposals
const proposals = generateProposals(currentFindings, lessons, patterns, unresolved);

// 6. Write manifest
const manifest = {
  sprintId,
  generatedAt: today,
  impactLevels: IMPACT,
  summary: {
    totalProposals: proposals.length,
    byImpact: {
      P0: proposals.filter(p => p.impact.level === 'P0').length,
      P1: proposals.filter(p => p.impact.level === 'P1').length,
      P2: proposals.filter(p => p.impact.level === 'P2').length,
      P3: proposals.filter(p => p.impact.level === 'P3').length,
    },
    bySource: {
      retro: proposals.filter(p => p.source === 'retro').length,
      lesson: proposals.filter(p => p.source === 'lesson').length,
      effectiveness_check: proposals.filter(p => p.source === 'effectiveness_check').length,
    },
    byType: {},
  },
  proposals,
};

// Count by type
for (const p of proposals) {
  manifest.summary.byType[p.type] = (manifest.summary.byType[p.type] || 0) + 1;
}

const manifestPath = path.join(ROOT, '.vbounce', 'improvement-manifest.json');
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('');
console.log(`✓ Improvement manifest written to .vbounce/improvement-manifest.json`);
console.log(`  ${proposals.length} proposal(s): ${manifest.summary.byImpact.P0} P0, ${manifest.summary.byImpact.P1} P1, ${manifest.summary.byImpact.P2} P2, ${manifest.summary.byImpact.P3} P3`);

if (proposals.length > 0) {
  console.log('');
  console.log('Next: run `vbounce suggest ' + sprintId + '` to generate human-readable improvement suggestions.');
}
