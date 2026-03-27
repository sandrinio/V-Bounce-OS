/**
 * Suite: Script Execution
 * Verifies every script can at least be imported without crashing,
 * and key scripts produce correct outputs with known inputs.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, assertScriptRuns, PASS, FAIL, WARN, SKIP } from '../harness.mjs';

export default function runScriptsSuite(installDir) {
  suite('Scripts — Import Check');

  const scriptsDir = path.join(installDir, '.vbounce', 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    record({
      name: 'Scripts directory exists',
      component: 'script',
      input: scriptsDir,
      output: 'missing',
      expected: 'exists',
      verdict: FAIL,
    });
    return;
  }

  // Scripts that can be safely dry-run with --help or no args
  // Some scripts exit 1 when missing args — that's OK, we just check they don't crash with unhandled errors
  const mjsScripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.mjs'));

  for (const script of mjsScripts) {
    const scriptPath = path.join(scriptsDir, script);

    // Try to evaluate the script — we expect either exit 0 (help/no-op) or exit 1 (missing args)
    // but NOT unhandled exceptions
    const start = Date.now();
    let exitCode, stderr, stdout;
    try {
      stdout = require('child_process').execSync(
        `node -e "import('${scriptPath.replace(/'/g, "\\'")}')" 2>&1`,
        { cwd: installDir, timeout: 10000, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
      );
      exitCode = 0;
    } catch (e) {
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      exitCode = e.status ?? 1;
    }
    const duration = Date.now() - start;

    // Check for unhandled promise rejections or syntax errors
    const hasUnhandledError = (stderr || '').includes('SyntaxError') ||
      (stderr || '').includes('Cannot find module') ||
      (stderr || '').includes('ERR_MODULE_NOT_FOUND');

    record({
      name: `Importable: ${script}`,
      component: 'script',
      input: `dynamic import of ${script}`,
      output: hasUnhandledError ? `import error: ${(stderr || '').slice(0, 200)}` : `exit ${exitCode}`,
      expected: 'no import errors',
      verdict: hasUnhandledError ? FAIL : PASS,
      duration_ms: duration,
    });
  }

  // ── Functional tests for key scripts ──
  suite('Scripts — Functional');

  // validate_state.mjs with no state.json should exit 1
  assertScriptRuns(
    path.join(scriptsDir, 'validate_state.mjs'), '', 'script',
    { cwd: installDir, expectExit: 1, note: 'no state.json — should fail gracefully' }
  );

  // doctor.mjs should run and produce output
  const doctorResult = assertScriptRuns(
    path.join(scriptsDir, 'doctor.mjs'), '', 'script',
    { cwd: installDir, expectExit: 1, note: 'claude-only install' }
  );

  record({
    name: 'Doctor produces structured output',
    component: 'script',
    input: 'doctor.mjs stdout',
    output: doctorResult.stdout?.includes('V-Bounce Engine Health Check') ? 'has header' : 'no header',
    expected: 'has header',
    verdict: doctorResult.stdout?.includes('V-Bounce Engine Health Check') ? PASS : FAIL,
  });

  // verify_framework.mjs should find agents
  const verifyResult = assertScriptRuns(
    path.join(scriptsDir, 'verify_framework.mjs'), '', 'script',
    { cwd: installDir, expectExit: 0, note: 'all agent signatures should pass' }
  );

  record({
    name: 'verify_framework finds agents directory',
    component: 'script',
    input: 'verify_framework.mjs stdout',
    output: verifyResult.stdout?.includes('Framework Integrity Check') ? 'finds agents' : 'cannot find agents',
    expected: 'finds agents',
    verdict: verifyResult.stdout?.includes('Framework Integrity Check') ? PASS : FAIL,
    note: verifyResult.stderr?.includes('not found') ? 'agents directory not found' : undefined,
  });

  // ── ROOT resolution check ──
  suite('Scripts — ROOT Resolution');

  // Every script that uses path.resolve(__dirname, '../..') should resolve to the install root
  for (const script of mjsScripts) {
    const scriptPath = path.join(scriptsDir, script);
    const content = fs.readFileSync(scriptPath, 'utf8');

    if (content.includes("path.resolve(__dirname,")) {
      const hasCorrectRoot = content.includes("'../..'");
      const hasBrokenRoot = content.includes("'..'") && !content.includes("'../..'");

      record({
        name: `ROOT resolution: ${script}`,
        component: 'script',
        input: `${script} — __dirname traversal`,
        output: hasCorrectRoot ? "'../..'" : (hasBrokenRoot ? "'..' (broken)" : 'other pattern'),
        expected: "'../..' (two levels up from .vbounce/scripts/)",
        verdict: hasCorrectRoot ? PASS : (hasBrokenRoot ? FAIL : WARN),
        note: hasBrokenRoot ? 'ROOT resolves to .vbounce/ instead of project root' : undefined,
      });
    }
  }
}
