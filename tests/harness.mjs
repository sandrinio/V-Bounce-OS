#!/usr/bin/env node

/**
 * V-Bounce Engine — Test Harness
 *
 * Provides test primitives with full observability.
 * Every test records: suite, name, component, input, output, expected, verdict, duration.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ─── Verdicts ────────────────────────────────────────────────────────────────

export const PASS = 'PASS';
export const FAIL = 'FAIL';
export const WARN = 'WARN';
export const SKIP = 'SKIP';

// ─── Test Context ────────────────────────────────────────────────────────────

const results = [];
let currentSuite = null;
let suiteStartTime = null;

export function suite(name) {
  currentSuite = name;
  suiteStartTime = Date.now();
  console.log(`\n━━━ ${name} ━━━`);
}

/**
 * Record a test result with full observability.
 * @param {object} opts
 * @param {string} opts.name - Test name
 * @param {string} opts.component - Component under test (brain, script, skill, template, etc.)
 * @param {string} opts.input - What was checked (file path, command, pattern)
 * @param {string} opts.output - What was found
 * @param {string} opts.expected - What was expected
 * @param {string} opts.verdict - PASS | FAIL | WARN | SKIP
 * @param {number} [opts.duration_ms] - Time taken
 * @param {string} [opts.note] - Optional explanation
 */
export function record(opts) {
  const entry = {
    suite: currentSuite,
    name: opts.name,
    component: opts.component,
    input: opts.input,
    output: String(opts.output ?? '').slice(0, 500),
    expected: String(opts.expected ?? '').slice(0, 500),
    verdict: opts.verdict,
    duration_ms: opts.duration_ms ?? 0,
    note: opts.note ?? '',
    timestamp: new Date().toISOString(),
  };
  results.push(entry);

  const icon = { PASS: '✓', FAIL: '✗', WARN: '⚠', SKIP: '○' }[entry.verdict];
  const color = { PASS: '\x1b[32m', FAIL: '\x1b[31m', WARN: '\x1b[33m', SKIP: '\x1b[90m' }[entry.verdict];
  const reset = '\x1b[0m';
  const duration = entry.duration_ms > 0 ? ` (${entry.duration_ms}ms)` : '';
  console.log(`  ${color}${icon}${reset} ${entry.name}${duration}${entry.note ? ` — ${entry.note}` : ''}`);

  if (entry.verdict === FAIL) {
    console.log(`    input:    ${entry.input}`);
    console.log(`    expected: ${entry.expected}`);
    console.log(`    got:      ${entry.output}`);
  }
}

// ─── Assertion Helpers ───────────────────────────────────────────────────────

export function assertFileExists(filePath, component, note) {
  const exists = fs.existsSync(filePath);
  record({
    name: `File exists: ${path.basename(filePath)}`,
    component,
    input: filePath,
    output: exists ? 'exists' : 'missing',
    expected: 'exists',
    verdict: exists ? PASS : FAIL,
    note,
  });
  return exists;
}

export function assertNoMatch(filePath, pattern, component, note) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    record({
      name: `No match: ${pattern} in ${path.basename(filePath)}`,
      component,
      input: filePath,
      output: 'file not readable',
      expected: `no matches for /${pattern}/`,
      verdict: SKIP,
      note: 'file not found',
    });
    return true;
  }

  const regex = new RegExp(pattern, 'g');
  const matches = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      matches.push({ line: i + 1, text: lines[i].trim().slice(0, 120) });
    }
    regex.lastIndex = 0;
  }

  const passed = matches.length === 0;
  record({
    name: `No stale pattern: ${pattern} in ${path.basename(filePath)}`,
    component,
    input: `${filePath} — pattern: /${pattern}/`,
    output: passed ? '0 matches' : `${matches.length} match(es): ${JSON.stringify(matches.slice(0, 3))}`,
    expected: '0 matches',
    verdict: passed ? PASS : FAIL,
    note,
  });
  return passed;
}

export function assertScriptRuns(scriptPath, args, component, opts = {}) {
  const start = Date.now();
  let stdout, stderr, exitCode;
  try {
    stdout = execSync(`node "${scriptPath}" ${args || ''}`, {
      cwd: opts.cwd || path.dirname(scriptPath),
      timeout: opts.timeout || 10000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...(opts.env || {}) },
    });
    exitCode = 0;
  } catch (e) {
    stdout = e.stdout || '';
    stderr = e.stderr || '';
    exitCode = e.status ?? 1;
  }
  const duration = Date.now() - start;

  const expectedExit = opts.expectExit === null ? null : (opts.expectExit ?? 0);
  const passed = expectedExit === null ? true : (exitCode === expectedExit);
  if (expectedExit !== null) {
    record({
      name: `Script: ${path.basename(scriptPath)} ${args || ''}`.trim(),
      component,
      input: `node ${scriptPath} ${args || ''}`,
      output: `exit ${exitCode}${stderr ? ` — ${stderr.slice(0, 200)}` : ''}`,
      expected: `exit ${expectedExit}`,
      verdict: passed ? PASS : FAIL,
      duration_ms: duration,
      note: opts.note,
    });
  }
  return { stdout, stderr, exitCode, passed };
}

// ─── Report Generation ──────────────────────────────────────────────────────

export function getResults() {
  return results;
}

export function generateReport(outputDir) {
  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // ── JSON report ──
  const jsonPath = path.join(outputDir, `report-${ts}.json`);
  const report = {
    generated: now.toISOString(),
    summary: {
      total: results.length,
      pass: results.filter(r => r.verdict === PASS).length,
      fail: results.filter(r => r.verdict === FAIL).length,
      warn: results.filter(r => r.verdict === WARN).length,
      skip: results.filter(r => r.verdict === SKIP).length,
    },
    by_component: {},
    by_suite: {},
    results,
  };

  for (const r of results) {
    // by component
    if (!report.by_component[r.component]) report.by_component[r.component] = { pass: 0, fail: 0, warn: 0, skip: 0 };
    report.by_component[r.component][r.verdict.toLowerCase()]++;
    // by suite
    if (!report.by_suite[r.suite]) report.by_suite[r.suite] = { pass: 0, fail: 0, warn: 0, skip: 0 };
    report.by_suite[r.suite][r.verdict.toLowerCase()]++;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // ── Markdown report ──
  const mdPath = path.join(outputDir, `report-${ts}.md`);
  const failures = results.filter(r => r.verdict === FAIL);
  const warnings = results.filter(r => r.verdict === WARN);

  let md = `# V-Bounce Engine — Test Report\n\n`;
  md += `**Generated:** ${now.toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Verdict | Count |\n|---------|-------|\n`;
  md += `| PASS | ${report.summary.pass} |\n`;
  md += `| FAIL | ${report.summary.fail} |\n`;
  md += `| WARN | ${report.summary.warn} |\n`;
  md += `| SKIP | ${report.summary.skip} |\n`;
  md += `| **Total** | **${report.summary.total}** |\n\n`;

  md += `## By Component\n\n`;
  md += `| Component | Pass | Fail | Warn | Skip |\n|-----------|------|------|------|------|\n`;
  for (const [comp, counts] of Object.entries(report.by_component).sort()) {
    md += `| ${comp} | ${counts.pass} | ${counts.fail} | ${counts.warn} | ${counts.skip} |\n`;
  }

  md += `\n## By Suite\n\n`;
  md += `| Suite | Pass | Fail | Warn | Skip |\n|-------|------|------|------|------|\n`;
  for (const [s, counts] of Object.entries(report.by_suite)) {
    md += `| ${s} | ${counts.pass} | ${counts.fail} | ${counts.warn} | ${counts.skip} |\n`;
  }

  if (failures.length > 0) {
    md += `\n## Failures\n\n`;
    for (const f of failures) {
      md += `### ${f.suite} → ${f.name}\n`;
      md += `- **Component:** ${f.component}\n`;
      md += `- **Input:** \`${f.input}\`\n`;
      md += `- **Expected:** ${f.expected}\n`;
      md += `- **Got:** ${f.output}\n`;
      if (f.note) md += `- **Note:** ${f.note}\n`;
      md += `\n`;
    }
  }

  if (warnings.length > 0) {
    md += `\n## Warnings\n\n`;
    for (const w of warnings) {
      md += `- **${w.suite} → ${w.name}**: ${w.note || w.output}\n`;
    }
  }

  fs.writeFileSync(mdPath, md);

  return { jsonPath, mdPath, report };
}
