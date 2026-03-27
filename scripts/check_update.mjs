#!/usr/bin/env node

/**
 * check_update.mjs
 * Checks the installed V-Bounce Engine version against the latest on npm.
 *
 * Usage:
 *   node .vbounce/scripts/check_update.mjs           # Check and print result
 *   node .vbounce/scripts/check_update.mjs --json     # JSON output for scripts
 *   node .vbounce/scripts/check_update.mjs --quiet    # Exit code only (0=up to date, 1=update available)
 *
 * Exit codes:
 *   0 — up to date (or --quiet with no update)
 *   1 — update available (--quiet mode)
 *   2 — could not check (network error, npm not found)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const quietMode = args.includes('--quiet');

// 1. Get installed version
function getInstalledVersion() {
  // Check .vbounce/install-meta.json first (installed in target project)
  const metaPath = path.join(ROOT, '.vbounce', 'install-meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta.version) return meta.version;
    } catch { /* fall through */ }
  }

  // Check package.json in engine source (development mode)
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) return pkg.version;
    } catch { /* fall through */ }
  }

  // Check VBOUNCE_MANIFEST.md as last resort
  const manifestPath = path.join(ROOT, 'VBOUNCE_MANIFEST.md');
  if (fs.existsSync(manifestPath)) {
    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const match = content.match(/\*\*Version:\*\*\s*([\d.]+)/);
      if (match) return match[1];
    } catch { /* fall through */ }
  }

  return null;
}

// 2. Get latest version from npm
function getLatestVersion() {
  try {
    const result = execSync('npm view vbounce-engine version', {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return result.trim();
  } catch {
    return null;
  }
}

// 3. Compare versions
function compareVersions(installed, latest) {
  const parse = (v) => v.split('.').map(Number);
  const [iMajor, iMinor, iPatch] = parse(installed);
  const [lMajor, lMinor, lPatch] = parse(latest);

  if (lMajor > iMajor) return 'major';
  if (lMajor === iMajor && lMinor > iMinor) return 'minor';
  if (lMajor === iMajor && lMinor === iMinor && lPatch > iPatch) return 'patch';
  return 'current';
}

// Run
const installed = getInstalledVersion();
const latest = getLatestVersion();

if (!installed) {
  if (jsonMode) {
    console.log(JSON.stringify({ error: 'Could not determine installed version' }));
  } else if (!quietMode) {
    console.error('Could not determine installed V-Bounce Engine version.');
  }
  process.exit(2);
}

if (!latest) {
  if (jsonMode) {
    console.log(JSON.stringify({ installed, latest: null, error: 'Could not reach npm registry' }));
  } else if (!quietMode) {
    console.warn(`  ⚠ Version check: installed ${installed}, could not reach npm registry`);
  }
  process.exit(2);
}

const updateType = compareVersions(installed, latest);
const updateAvailable = updateType !== 'current';

if (jsonMode) {
  console.log(JSON.stringify({ installed, latest, updateType, updateAvailable }));
} else if (quietMode) {
  process.exit(updateAvailable ? 1 : 0);
} else {
  if (updateAvailable) {
    console.log(`  ⚠ Update available: ${installed} → ${latest} (${updateType})`);
    console.log(`    Run: npx vbounce-engine@latest install claude`);
  } else {
    console.log(`  ✓ V-Bounce Engine ${installed} (up to date)`);
  }
}

process.exit(0);
