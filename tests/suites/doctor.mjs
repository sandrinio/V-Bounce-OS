/**
 * Suite: Doctor Accuracy
 * Verifies vbounce doctor reports correctly — no false positives on a good install,
 * and catches real problems when files are missing.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, assertScriptRuns, PASS, FAIL, WARN } from '../harness.mjs';

export default function runDoctorSuite(installDir) {
  suite('Doctor — Accuracy');

  const doctorPath = path.join(installDir, '.vbounce', 'scripts', 'doctor.mjs');

  // ── 1. Doctor on claude-only install ──
  // GEMINI.md and AGENTS.md will be missing — that's expected for claude-only.
  // Doctor should report exactly 2 issues (those 2 missing brains).
  const result = assertScriptRuns(doctorPath, '', 'doctor', {
    cwd: installDir,
    expectExit: 1, // 2 issues = exit 1
    note: 'claude-only install — expect 2 missing brains',
  });

  if (result.stdout) {
    // Check for false positives
    const falsePositives = [];
    if (result.stdout.includes('LESSONS.md missing')) falsePositives.push('LESSONS.md false positive');
    if (result.stdout.includes('product_plans/ directory missing') && fs.existsSync(path.join(installDir, 'product_plans'))) {
      falsePositives.push('product_plans/ false positive');
    }
    if (result.stdout.includes('.vbounce/ directory missing')) falsePositives.push('.vbounce/ false positive');

    record({
      name: 'Doctor has no false positives',
      component: 'doctor',
      input: 'doctor output scan',
      output: falsePositives.length === 0 ? 'no false positives' : falsePositives.join(', '),
      expected: 'no false positives',
      verdict: falsePositives.length === 0 ? PASS : FAIL,
    });

    // Check that real checks pass
    const expectedPasses = ['LESSONS.md exists', 'templates/', 'Skills:', 'Scripts:', 'CLAUDE.md'];
    for (const check of expectedPasses) {
      const found = result.stdout.includes(`✓`) && result.stdout.includes(check);
      record({
        name: `Doctor passes: ${check}`,
        component: 'doctor',
        input: `stdout contains ✓ + "${check}"`,
        output: found ? 'found' : 'not found',
        expected: 'found',
        verdict: found ? PASS : FAIL,
      });
    }
  }

  // ── 2. Doctor catches missing file ──
  suite('Doctor — False Negative Detection');

  // Temporarily rename LESSONS.md to test detection
  const lessonsPath = path.join(installDir, 'LESSONS.md');
  const lessonsBackup = lessonsPath + '.bak';
  let canTestFalseNegative = false;

  if (fs.existsSync(lessonsPath)) {
    fs.renameSync(lessonsPath, lessonsBackup);
    canTestFalseNegative = true;
  }

  if (canTestFalseNegative) {
    const result2 = assertScriptRuns(doctorPath, '', 'doctor', {
      cwd: installDir,
      expectExit: 1,
      note: 'LESSONS.md removed — should detect',
    });

    const detected = result2.stdout?.includes('LESSONS.md missing') || result2.stderr?.includes('LESSONS.md missing');
    record({
      name: 'Doctor detects missing LESSONS.md',
      component: 'doctor',
      input: 'LESSONS.md removed from install',
      output: detected ? 'detected' : 'not detected',
      expected: 'detected',
      verdict: detected ? PASS : FAIL,
    });

    // Restore
    fs.renameSync(lessonsBackup, lessonsPath);
  }
}
