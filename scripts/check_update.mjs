#!/usr/bin/env node

/**
 * check_update.mjs
 * Checks the installed V-Bounce Engine version against the latest on npm
 * and performs the update if a newer version is available.
 *
 * Usage:
 *   node .vbounce/scripts/check_update.mjs           # Check + update interactively
 *   node .vbounce/scripts/check_update.mjs --json     # JSON output for scripts (no update)
 *   node .vbounce/scripts/check_update.mjs --quiet    # Exit code only (0=up to date, 1=update available)
 *   node .vbounce/scripts/check_update.mjs --check    # Check only, don't offer to update
 *
 * Exit codes:
 *   0 — up to date (or update completed successfully)
 *   1 — update available (--quiet mode) or update declined
 *   2 — could not check (network error, npm not found)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import { createInterface } from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const quietMode = args.includes('--quiet');
const checkOnly = args.includes('--check');

// 1. Get installed version
function getInstalledVersion() {
  const metaPath = path.join(ROOT, '.vbounce', 'install-meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta.version) return meta.version;
    } catch { /* fall through */ }
  }

  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.version) return pkg.version;
    } catch { /* fall through */ }
  }

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

// 2. Get installed platform from install-meta.json
function getInstalledPlatform() {
  const metaPath = path.join(ROOT, '.vbounce', 'install-meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      return meta.platform || null;
    } catch { /* fall through */ }
  }
  return null;
}

// 3. Get latest version from npm
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

// 4. Compare versions
function compareVersions(installed, latest) {
  const parse = (v) => v.split('.').map(Number);
  const [iMajor, iMinor, iPatch] = parse(installed);
  const [lMajor, lMinor, lPatch] = parse(latest);

  if (lMajor > iMajor) return 'major';
  if (lMajor === iMajor && lMinor > iMinor) return 'minor';
  if (lMajor === iMajor && lMinor === iMinor && lPatch > iPatch) return 'patch';
  return 'current';
}

// 5. Run the update
function runUpdate(platform, latest) {
  return new Promise((resolve) => {
    console.log(`\n  Updating to v${latest}...\n`);

    const child = spawn('npx', [`vbounce-engine@${latest}`, 'install', platform], {
      cwd: ROOT,
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });

    child.on('error', (err) => {
      console.error(`  Failed to run update: ${err.message}`);
      resolve(false);
    });
  });
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
  process.exit(0);
}

if (quietMode) {
  process.exit(updateAvailable ? 1 : 0);
}

if (!updateAvailable) {
  console.log(`  ✓ V-Bounce Engine ${installed} (up to date)`);
  process.exit(0);
}

// Update is available
console.log(`  ⚠ Update available: ${installed} → ${latest} (${updateType})`);

if (checkOnly) {
  console.log(`    Run: npx vbounce-engine@latest install claude`);
  process.exit(0);
}

const platform = getInstalledPlatform();

if (!platform) {
  console.log(`  Could not determine installed platform. Run manually:`);
  console.log(`    npx vbounce-engine@${latest} install <platform>`);
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question(`  Update to ${latest} for ${platform}? [y/N] `, async (answer) => {
  rl.close();
  const confirm = answer.trim().toLowerCase();
  if (confirm !== 'y' && confirm !== 'yes') {
    console.log('  Update skipped.');
    process.exit(1);
  }

  const success = await runUpdate(platform, latest);
  process.exit(success ? 0 : 2);
});
