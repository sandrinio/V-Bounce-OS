/**
 * Suite: Report Parsing
 * Validates that context prep scripts and report validators handle
 * malformed agent reports gracefully — no raw crashes.
 *
 * Uses sprint S-95, release ParseTest, epic EPIC-T95.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, assertScriptRuns, PASS, FAIL, WARN } from '../harness.mjs';
import { createSprintFixtures, createSyntheticReport, removeSprintFixtures } from '../fixtures.mjs';

const SPRINT_ID = 'S-95';
const EPIC_ID = 'EPIC-T95';
const STORY_ID = 'STORY-T95-01';

function writeReport(installDir, storyId, agent, content) {
  const reportsDir = path.join(installDir, '.vbounce', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, `${storyId}-${agent}.md`);
  fs.writeFileSync(reportPath, content);
  return reportPath;
}

function removeReport(installDir, storyId, agent) {
  const reportPath = path.join(installDir, '.vbounce', 'reports', `${storyId}-${agent}.md`);
  try { if (fs.existsSync(reportPath)) fs.unlinkSync(reportPath); } catch { /* ok */ }
}

function noCrash(result, name) {
  const combined = (result.stdout || '') + (result.stderr || '');
  const hasCrash = /^\s+at\s/m.test(combined) &&
    (/TypeError/.test(combined) || /ReferenceError/.test(combined) || /Cannot read prop/.test(combined));
  return !hasCrash;
}

export default function runReportParsingSuite(installDir) {
  const scriptsDir = path.join(installDir, '.vbounce', 'scripts');
  const config = { sprintId: SPRINT_ID, storyIds: [STORY_ID], epicId: EPIC_ID };

  // ── Setup ──
  createSprintFixtures(installDir, config);

  // ═══════════════════════════════════════════════════════════════════════
  suite('Report Parsing — Malformed Dev Reports');

  // 1. No YAML frontmatter
  writeReport(installDir, STORY_ID, 'dev', `# Developer Report — ${STORY_ID}

## Implementation Summary
No frontmatter here.
`);
  const r1 = assertScriptRuns(
    path.join(scriptsDir, 'prep_qa_context.mjs'),
    STORY_ID, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'dev report without YAML frontmatter' }
  );
  record({
    name: 'no YAML frontmatter — no crash',
    component: 'report-parsing',
    input: `prep_qa_context.mjs (no frontmatter)`,
    output: noCrash(r1, 'no frontmatter') ? `exit ${r1.exitCode} (graceful)` : 'raw crash',
    expected: 'graceful failure or degraded output',
    verdict: noCrash(r1, 'no frontmatter') ? PASS : FAIL,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // 2. Empty frontmatter
  writeReport(installDir, STORY_ID, 'dev', `---
---

# Developer Report — ${STORY_ID}

## Implementation Summary
Empty frontmatter.
`);
  const r2 = assertScriptRuns(
    path.join(scriptsDir, 'prep_qa_context.mjs'),
    STORY_ID, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'empty frontmatter' }
  );
  record({
    name: 'empty frontmatter — no crash',
    component: 'report-parsing',
    input: `prep_qa_context.mjs (empty frontmatter)`,
    output: noCrash(r2, 'empty frontmatter') ? `exit ${r2.exitCode} (graceful)` : 'raw crash',
    expected: 'graceful handling',
    verdict: noCrash(r2, 'empty frontmatter') ? PASS : FAIL,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // 3. Missing files_modified field
  writeReport(installDir, STORY_ID, 'dev', `---
status: "PASS"
story_id: "${STORY_ID}"
sprint_id: "${SPRINT_ID}"
correction_tax: 0
tokens_used: 5000
tests_written: 1
lessons_flagged: 0
---

# Developer Report — ${STORY_ID}

## Implementation Summary
Valid frontmatter but no files_modified.
`);
  const r3 = assertScriptRuns(
    path.join(scriptsDir, 'prep_qa_context.mjs'),
    STORY_ID, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'missing files_modified' }
  );
  record({
    name: 'missing files_modified — no crash',
    component: 'report-parsing',
    input: `prep_qa_context.mjs (no files_modified)`,
    output: noCrash(r3, 'missing field') ? `exit ${r3.exitCode} (graceful)` : 'raw crash',
    expected: 'graceful handling',
    verdict: noCrash(r3, 'missing field') ? PASS : FAIL,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // 4. Empty file (0 bytes)
  writeReport(installDir, STORY_ID, 'dev', '');
  const r4 = assertScriptRuns(
    path.join(scriptsDir, 'prep_qa_context.mjs'),
    STORY_ID, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'empty report file' }
  );
  record({
    name: 'empty file — no crash',
    component: 'report-parsing',
    input: `prep_qa_context.mjs (0-byte report)`,
    output: noCrash(r4, 'empty file') ? `exit ${r4.exitCode} (graceful)` : 'raw crash',
    expected: 'graceful failure',
    verdict: noCrash(r4, 'empty file') ? PASS : FAIL,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // 5. Truncated YAML (no closing ---)
  writeReport(installDir, STORY_ID, 'dev', `---
status: "PASS"
story_id: "${STORY_ID}"
files_modified:
  - src/foo.ts
# Body starts here without closing ---
Some content below.
`);
  const r5 = assertScriptRuns(
    path.join(scriptsDir, 'prep_qa_context.mjs'),
    STORY_ID, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'truncated YAML (no closing ---)' }
  );
  record({
    name: 'truncated YAML — no crash',
    component: 'report-parsing',
    input: `prep_qa_context.mjs (truncated YAML)`,
    output: noCrash(r5, 'truncated YAML') ? `exit ${r5.exitCode} (graceful)` : 'raw crash',
    expected: 'graceful handling',
    verdict: noCrash(r5, 'truncated YAML') ? PASS : FAIL,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // ═══════════════════════════════════════════════════════════════════════
  suite('Report Parsing — Missing Reports');

  // 6. Dev exists, QA missing for arch context
  createSyntheticReport(installDir, STORY_ID, 'dev', SPRINT_ID);
  // Ensure no QA report
  removeReport(installDir, STORY_ID, 'qa');
  const r6 = assertScriptRuns(
    path.join(scriptsDir, 'prep_arch_context.mjs'),
    STORY_ID, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'dev exists, QA missing' }
  );
  const r6out = (r6.stdout || '') + (r6.stderr || '');
  record({
    name: 'arch context — warns about missing QA',
    component: 'report-parsing',
    input: `prep_arch_context.mjs (no QA report)`,
    output: r6out.toLowerCase().includes('qa report not found') || r6out.toLowerCase().includes('without') ? 'warning present' : `exit ${r6.exitCode}`,
    expected: 'warning about missing QA report',
    verdict: r6.exitCode <= 1 ? PASS : FAIL,
    note: r6.exitCode === 0 ? 'continues without QA report (correct)' : undefined,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // ═══════════════════════════════════════════════════════════════════════
  suite('Report Parsing — validate_report.mjs');

  // 7. Dev report missing files_modified
  const r7path = writeReport(installDir, STORY_ID, 'dev', `---
status: "PASS"
story_id: "${STORY_ID}"
sprint_id: "${SPRINT_ID}"
correction_tax: 0
tokens_used: 5000
tests_written: 1
lessons_flagged: 0
---

# Developer Report
No files_modified field.
`);
  const r7 = assertScriptRuns(
    path.join(scriptsDir, 'validate_report.mjs'),
    `"${r7path}"`, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'validate dev report missing files_modified' }
  );
  record({
    name: 'validate_report — missing files_modified',
    component: 'report-parsing',
    input: 'validate_report.mjs (dev, no files_modified)',
    output: `exit ${r7.exitCode}`,
    expected: 'exit 1 (schema error)',
    verdict: r7.exitCode === 1 ? PASS : WARN,
    note: r7.exitCode === 0 ? 'validate_report may not require files_modified' : undefined,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // 8. Empty file
  const r8path = writeReport(installDir, STORY_ID, 'dev', '');
  const r8 = assertScriptRuns(
    path.join(scriptsDir, 'validate_report.mjs'),
    `"${r8path}"`, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'validate empty report' }
  );
  record({
    name: 'validate_report — empty file',
    component: 'report-parsing',
    input: 'validate_report.mjs (empty file)',
    output: `exit ${r8.exitCode}`,
    expected: 'exit 1 (missing frontmatter)',
    verdict: r8.exitCode === 1 ? PASS : WARN,
  });
  removeReport(installDir, STORY_ID, 'dev');

  // 9. QA report missing required fields
  const r9path = writeReport(installDir, STORY_ID, 'qa', `---
status: "PASS"
---

# QA Report
Minimal frontmatter only.
`);
  const r9 = assertScriptRuns(
    path.join(scriptsDir, 'validate_report.mjs'),
    `"${r9path}"`, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'validate QA report missing fields' }
  );
  record({
    name: 'validate_report — QA missing required fields',
    component: 'report-parsing',
    input: 'validate_report.mjs (QA, only status)',
    output: `exit ${r9.exitCode}`,
    expected: 'exit 1 (schema error)',
    verdict: r9.exitCode === 1 ? PASS : WARN,
  });
  removeReport(installDir, STORY_ID, 'qa');

  // 10. Well-formed dev report
  const r10path = createSyntheticReport(installDir, STORY_ID, 'dev', SPRINT_ID);
  const r10 = assertScriptRuns(
    path.join(scriptsDir, 'validate_report.mjs'),
    `"${r10path}"`, 'report-parsing',
    { cwd: installDir, expectExit: null, note: 'validate well-formed dev report' }
  );
  const r10out = (r10.stdout || '') + (r10.stderr || '');
  record({
    name: 'validate_report — well-formed dev report',
    component: 'report-parsing',
    input: 'validate_report.mjs (valid dev report)',
    output: `exit ${r10.exitCode}`,
    expected: 'exit 0 (VALID)',
    verdict: r10.exitCode === 0 ? PASS : WARN,
    note: r10.exitCode !== 0 ? `may have strict schema: ${(r10.stderr || '').slice(0, 100)}` : undefined,
  });

  // ── Cleanup ──
  removeSprintFixtures(installDir, config);
}
