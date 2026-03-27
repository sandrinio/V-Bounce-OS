#!/usr/bin/env node

/**
 * V-Bounce Engine — Test Runner
 *
 * Runs all test suites against a fresh install and produces
 * observable JSON + Markdown reports.
 *
 * Usage:
 *   node vbounce-tests/run.mjs                    # Fresh install to temp dir
 *   node vbounce-tests/run.mjs --install-dir /x   # Test an existing install
 *   node vbounce-tests/run.mjs --skip-install     # Use existing temp dir from last run
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

import { generateReport, getResults } from './harness.mjs';
import runInstallSuite from './suites/VBOUNCE_install.mjs';
import runPathsSuite from './suites/VBOUNCE_paths.mjs';
import runDoctorSuite from './suites/VBOUNCE_doctor.mjs';
import runScriptsSuite from './suites/VBOUNCE_scripts.mjs';
import runBrainsSuite from './suites/VBOUNCE_brains.mjs';
import runManifestSuite from './suites/VBOUNCE_manifest.mjs';
import runLifecycleSuite from './suites/VBOUNCE_lifecycle.mjs';
import runTemplatesSuite from './suites/VBOUNCE_templates.mjs';
import runAgentErrorsSuite from './suites/VBOUNCE_agent-errors.mjs';
import runRunScriptWrapperSuite from './suites/VBOUNCE_run-script-wrapper.mjs';
import runParallelStoriesSuite from './suites/VBOUNCE_parallel-stories.mjs';
import runReportParsingSuite from './suites/VBOUNCE_report-parsing.mjs';
import runPrefillReportSuite from './suites/VBOUNCE_prefill-report.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(__dirname, 'reports');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let installDir = null;
let skipInstall = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--install-dir' && args[i + 1]) {
    installDir = args[++i];
  } else if (args[i] === '--skip-install') {
    skipInstall = true;
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════════════╗');
console.log('║   V-Bounce Engine — Full Test Suite          ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`Engine root: ${ENGINE_ROOT}`);

const startTime = Date.now();

if (!installDir) {
  installDir = path.join(os.tmpdir(), `vbounce-test-${Date.now()}`);
  fs.mkdirSync(installDir, { recursive: true });

  if (!skipInstall) {
    console.log(`\nInstalling to: ${installDir}`);
    console.log('Running: vbounce install claude --yes\n');

    try {
      // Run the local installer directly from source
      const installerPath = path.join(ENGINE_ROOT, 'bin', 'vbounce.mjs');
      execSync(
        `echo "y\nn" | node "${installerPath}" install claude`,
        {
          cwd: installDir,
          timeout: 60000,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );
      console.log('Install completed.\n');
    } catch (e) {
      console.log(`Install output: ${(e.stdout || '').slice(-500)}`);
      console.log(`Install completed (exit ${e.status}).\n`);
    }

    // Create product_plans so doctor doesn't warn
    fs.mkdirSync(path.join(installDir, 'product_plans'), { recursive: true });
  }
}

console.log(`Test target: ${installDir}`);
console.log(`Reports dir: ${REPORTS_DIR}\n`);

// ─── Run Suites ──────────────────────────────────────────────────────────────

try { runInstallSuite(installDir); } catch (e) { console.error(`Install suite error: ${e.message}`); }
try { runPathsSuite(installDir); } catch (e) { console.error(`Paths suite error: ${e.message}`); }
try { runDoctorSuite(installDir); } catch (e) { console.error(`Doctor suite error: ${e.message}`); }
try { runScriptsSuite(installDir); } catch (e) { console.error(`Scripts suite error: ${e.message}`); }
try { runBrainsSuite(installDir); } catch (e) { console.error(`Brains suite error: ${e.message}`); }
try { runManifestSuite(installDir); } catch (e) { console.error(`Manifest suite error: ${e.message}`); }
try { runTemplatesSuite(installDir); } catch (e) { console.error(`Templates suite error: ${e.message}`); }
try { runLifecycleSuite(installDir); } catch (e) { console.error(`Lifecycle suite error: ${e.message}`); }
try { runAgentErrorsSuite(installDir); } catch (e) { console.error(`Agent errors suite error: ${e.message}`); }
try { runRunScriptWrapperSuite(installDir); } catch (e) { console.error(`Run-script wrapper suite error: ${e.message}`); }
try { runParallelStoriesSuite(installDir); } catch (e) { console.error(`Parallel stories suite error: ${e.message}`); }
try { runReportParsingSuite(installDir); } catch (e) { console.error(`Report parsing suite error: ${e.message}`); }
try { runPrefillReportSuite(installDir); } catch (e) { console.error(`Prefill report suite error: ${e.message}`); }

// ─── Report ──────────────────────────────────────────────────────────────────

fs.mkdirSync(REPORTS_DIR, { recursive: true });
const { jsonPath, mdPath, report } = generateReport(REPORTS_DIR);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║   RESULTS                                    ║');
console.log('╚══════════════════════════════════════════════╝');
console.log(`  ✓ PASS: ${report.summary.pass}`);
console.log(`  ✗ FAIL: ${report.summary.fail}`);
console.log(`  ⚠ WARN: ${report.summary.warn}`);
console.log(`  ○ SKIP: ${report.summary.skip}`);
console.log(`  ─────────────`);
console.log(`  Total:  ${report.summary.total} tests in ${elapsed}s`);
console.log(`\n  JSON: ${jsonPath}`);
console.log(`  MD:   ${mdPath}`);
console.log(`  Dir:  ${installDir}`);

// ─── Exit code ───────────────────────────────────────────────────────────────

process.exit(report.summary.fail > 0 ? 1 : 0);
