/**
 * Test suite for prefill_report.mjs
 * Validates pre-filled YAML frontmatter generation for agent reports.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { suite, record, PASS, FAIL } from '../harness.mjs';
import { createSprintFixtures, removeSprintFixtures } from '../fixtures.mjs';

const SPRINT_ID = 'S-95';
const STORY_IDS = ['STORY-T95-01', 'STORY-T95-02'];
const EPIC_ID = 'EPIC-T95';
const COMPONENT = 'script:prefill_report';

export default function runPrefillReportSuite(installDir) {
  suite('prefill-report');

  const scriptsDir = path.join(installDir, '.vbounce', 'scripts');
  const reportsDir = path.join(installDir, '.vbounce', 'reports');
  const scriptPath = path.join(scriptsDir, 'prefill_report.mjs');

  // Setup fixtures
  const fixtures = createSprintFixtures(installDir, {
    sprintId: SPRINT_ID,
    storyIds: STORY_IDS,
    epicId: EPIC_ID,
  });

  // Manually set bounce counts for testing
  const statePath = fixtures.statePath;
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.stories['STORY-T95-01'].qa_bounces = 2;
  state.stories['STORY-T95-01'].arch_bounces = 1;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  function runPrefill(storyId, agentType) {
    return execSync(
      `node "${scriptPath}" ${storyId} ${agentType}`,
      { cwd: installDir, timeout: 10000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  }

  // ─── Test: Dev report pre-fill ──────────────────────────────────────────────

  try {
    const stdout = runPrefill('STORY-T95-01', 'dev');
    const reportPath = path.join(reportsDir, 'STORY-T95-01-dev.md');
    const content = fs.readFileSync(reportPath, 'utf8');

    record({
      name: 'Dev report pre-fill creates file',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 dev',
      output: fs.existsSync(reportPath) ? 'file exists' : 'missing',
      expected: 'file exists',
      verdict: fs.existsSync(reportPath) ? PASS : FAIL,
    });

    record({
      name: 'Dev report contains story_id',
      component: COMPONENT,
      input: 'YAML frontmatter',
      output: content.includes('story_id: STORY-T95-01') ? 'found' : 'missing',
      expected: 'story_id: STORY-T95-01',
      verdict: content.includes('story_id: STORY-T95-01') ? PASS : FAIL,
    });

    record({
      name: 'Dev report contains sprint_id',
      component: COMPONENT,
      input: 'YAML frontmatter',
      output: content.includes(`sprint_id: ${SPRINT_ID}`) ? 'found' : 'missing',
      expected: `sprint_id: ${SPRINT_ID}`,
      verdict: content.includes(`sprint_id: ${SPRINT_ID}`) ? PASS : FAIL,
    });

    record({
      name: 'Dev report has AGENT_FILL markers',
      component: COMPONENT,
      input: 'YAML frontmatter',
      output: content.includes('# AGENT_FILL') ? 'found' : 'missing',
      expected: 'AGENT_FILL markers for status, correction_tax, etc.',
      verdict: content.includes('# AGENT_FILL') ? PASS : FAIL,
    });

    record({
      name: 'Dev report has YAML delimiters',
      component: COMPONENT,
      input: 'report structure',
      output: content.startsWith('---') ? 'starts with ---' : 'missing delimiters',
      expected: 'starts with ---',
      verdict: content.startsWith('---') ? PASS : FAIL,
    });

    record({
      name: 'Dev report has markdown body',
      component: COMPONENT,
      input: 'report body',
      output: content.includes('# Developer Implementation Report') ? 'found' : 'missing',
      expected: 'markdown section headers',
      verdict: content.includes('# Developer Implementation Report') ? PASS : FAIL,
    });
  } catch (e) {
    record({
      name: 'Dev report pre-fill executes',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 dev',
      output: e.stderr || e.message,
      expected: 'exit 0',
      verdict: FAIL,
    });
  }

  // ─── Test: QA report pre-fill with bounce count ──────────────────────────────

  try {
    runPrefill('STORY-T95-01', 'qa');
    const reportPath = path.join(reportsDir, 'STORY-T95-01-qa.md');
    const content = fs.readFileSync(reportPath, 'utf8');

    record({
      name: 'QA report contains bounce_count from state',
      component: COMPONENT,
      input: 'YAML frontmatter (qa_bounces=2)',
      output: content.includes('bounce_count: 2') ? 'bounce_count: 2' : 'wrong value',
      expected: 'bounce_count: 2',
      verdict: content.includes('bounce_count: 2') ? PASS : FAIL,
    });

    record({
      name: 'QA report contains story_id and sprint_id',
      component: COMPONENT,
      input: 'YAML frontmatter',
      output: (content.includes('story_id: STORY-T95-01') && content.includes(`sprint_id: ${SPRINT_ID}`)) ? 'both found' : 'missing',
      expected: 'story_id + sprint_id',
      verdict: (content.includes('story_id: STORY-T95-01') && content.includes(`sprint_id: ${SPRINT_ID}`)) ? PASS : FAIL,
    });
  } catch (e) {
    record({
      name: 'QA report pre-fill executes',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 qa',
      output: e.stderr || e.message,
      expected: 'exit 0',
      verdict: FAIL,
    });
  }

  // ─── Test: Arch report pre-fill with bounce count ────────────────────────────

  try {
    runPrefill('STORY-T95-01', 'arch');
    const reportPath = path.join(reportsDir, 'STORY-T95-01-arch.md');
    const content = fs.readFileSync(reportPath, 'utf8');

    record({
      name: 'Arch report contains bounce_count from state',
      component: COMPONENT,
      input: 'YAML frontmatter (arch_bounces=1)',
      output: content.includes('bounce_count: 1') ? 'bounce_count: 1' : 'wrong value',
      expected: 'bounce_count: 1',
      verdict: content.includes('bounce_count: 1') ? PASS : FAIL,
    });
  } catch (e) {
    record({
      name: 'Arch report pre-fill executes',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 arch',
      output: e.stderr || e.message,
      expected: 'exit 0',
      verdict: FAIL,
    });
  }

  // ─── Test: DevOps report pre-fill ────────────────────────────────────────────

  try {
    runPrefill('STORY-T95-01', 'devops');
    const reportPath = path.join(reportsDir, 'STORY-T95-01-devops.md');
    const exists = fs.existsSync(reportPath);

    record({
      name: 'DevOps report pre-fill creates file',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 devops',
      output: exists ? 'file exists' : 'missing',
      expected: 'file exists',
      verdict: exists ? PASS : FAIL,
    });
  } catch (e) {
    record({
      name: 'DevOps report pre-fill executes',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 devops',
      output: e.stderr || e.message,
      expected: 'exit 0',
      verdict: FAIL,
    });
  }

  // ─── Test: Missing story ID ──────────────────────────────────────────────────

  try {
    runPrefill('STORY-NONEXISTENT', 'dev');
    record({
      name: 'Missing story exits with error',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-NONEXISTENT dev',
      output: 'exit 0 (unexpected)',
      expected: 'exit 1',
      verdict: FAIL,
    });
  } catch (e) {
    const stderr = e.stderr || '';
    record({
      name: 'Missing story exits with error',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-NONEXISTENT dev',
      output: `exit ${e.status}`,
      expected: 'exit 1',
      verdict: e.status === 1 ? PASS : FAIL,
    });

    record({
      name: 'Missing story error message is actionable',
      component: COMPONENT,
      input: 'stderr on missing story',
      output: stderr.includes('not found in state.json') ? 'actionable message' : stderr.slice(0, 200),
      expected: 'mentions "not found in state.json"',
      verdict: stderr.includes('not found in state.json') ? PASS : FAIL,
    });
  }

  // ─── Test: Missing state.json ────────────────────────────────────────────────

  const stateBackup = fs.readFileSync(statePath, 'utf8');
  fs.unlinkSync(statePath);

  try {
    runPrefill('STORY-T95-01', 'dev');
    record({
      name: 'Missing state.json exits with error',
      component: COMPONENT,
      input: 'prefill_report.mjs with no state.json',
      output: 'exit 0 (unexpected)',
      expected: 'exit 1',
      verdict: FAIL,
    });
  } catch (e) {
    record({
      name: 'Missing state.json exits with error',
      component: COMPONENT,
      input: 'prefill_report.mjs with no state.json',
      output: `exit ${e.status}`,
      expected: 'exit 1',
      verdict: e.status === 1 ? PASS : FAIL,
    });
  }

  // Restore state.json
  fs.writeFileSync(statePath, stateBackup);

  // ─── Test: Invalid agent type ────────────────────────────────────────────────

  try {
    runPrefill('STORY-T95-01', 'invalid');
    record({
      name: 'Invalid agent type exits with error',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 invalid',
      output: 'exit 0 (unexpected)',
      expected: 'exit 1',
      verdict: FAIL,
    });
  } catch (e) {
    record({
      name: 'Invalid agent type exits with error',
      component: COMPONENT,
      input: 'prefill_report.mjs STORY-T95-01 invalid',
      output: `exit ${e.status}`,
      expected: 'exit 1',
      verdict: e.status === 1 ? PASS : FAIL,
    });
  }

  // ─── Test: Pre-filled report validates after agent fills fields ──────────────

  try {
    // Re-generate a dev report
    runPrefill('STORY-T95-01', 'dev');
    const reportPath = path.join(reportsDir, 'STORY-T95-01-dev.md');
    let content = fs.readFileSync(reportPath, 'utf8');

    // Simulate agent filling in fields
    content = content.replace('status: # AGENT_FILL', 'status: "implemented"');
    content = content.replace('correction_tax: # AGENT_FILL', 'correction_tax: 5');
    content = content.replace('input_tokens: # AGENT_FILL', 'input_tokens: 5000');
    content = content.replace('output_tokens: # AGENT_FILL', 'output_tokens: 3000');
    content = content.replace('total_tokens: # AGENT_FILL', 'total_tokens: 8000');
    content = content.replace('tokens_used: # AGENT_FILL', 'tokens_used: 8000');
    content = content.replace('tests_written: # AGENT_FILL', 'tests_written: 3');
    content = content.replace('lessons_flagged: # AGENT_FILL', 'lessons_flagged: 0');
    // files_modified is already an empty array — add a file
    content = content.replace('files_modified: []', 'files_modified:\n  - src/index.ts');

    fs.writeFileSync(reportPath, content);

    // Now validate with validate_report.mjs
    const validateScript = path.join(scriptsDir, 'validate_report.mjs');
    const result = execSync(
      `node "${validateScript}" "${reportPath}"`,
      { cwd: installDir, timeout: 10000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    record({
      name: 'Pre-filled + completed dev report passes validation',
      component: COMPONENT,
      input: 'validate_report.mjs on filled report',
      output: result.includes('VALID') ? 'VALID' : result.slice(0, 200),
      expected: 'VALID',
      verdict: result.includes('VALID') ? PASS : FAIL,
    });
  } catch (e) {
    record({
      name: 'Pre-filled + completed dev report passes validation',
      component: COMPONENT,
      input: 'validate_report.mjs on filled report',
      output: (e.stdout || '') + (e.stderr || ''),
      expected: 'VALID',
      verdict: FAIL,
    });
  }

  // Cleanup
  removeSprintFixtures(installDir, {
    sprintId: SPRINT_ID,
    storyIds: STORY_IDS,
    epicId: EPIC_ID,
  });
}
