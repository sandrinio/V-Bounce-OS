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
    if (result.stdout.includes('FLASHCARDS.md missing')) falsePositives.push('FLASHCARDS.md false positive');
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
    const expectedPasses = ['FLASHCARDS.md exists', 'templates/', 'Skills:', 'Scripts:', 'CLAUDE.md'];
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

  // Temporarily rename FLASHCARDS.md to test detection
  const flashcardsPath = path.join(installDir, 'FLASHCARDS.md');
  const flashcardsBackup = flashcardsPath + '.bak';
  let canTestFalseNegative = false;

  if (fs.existsSync(flashcardsPath)) {
    fs.renameSync(flashcardsPath, flashcardsBackup);
    canTestFalseNegative = true;
  }

  if (canTestFalseNegative) {
    const result2 = assertScriptRuns(doctorPath, '', 'doctor', {
      cwd: installDir,
      expectExit: 1,
      note: 'FLASHCARDS.md removed — should detect',
    });

    const detected = result2.stdout?.includes('FLASHCARDS.md missing') || result2.stderr?.includes('FLASHCARDS.md missing');
    record({
      name: 'Doctor detects missing FLASHCARDS.md',
      component: 'doctor',
      input: 'FLASHCARDS.md removed from install',
      output: detected ? 'detected' : 'not detected',
      expected: 'detected',
      verdict: detected ? PASS : FAIL,
    });

    // Restore
    fs.renameSync(flashcardsBackup, flashcardsPath);
  }
}
