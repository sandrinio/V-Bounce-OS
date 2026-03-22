#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import readline from 'readline';

import { execSync, spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.join(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0];
const sub = args[1];

if (command === '-v' || command === '--version') {
  const pkgPath = path.join(pkgRoot, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    console.log(`v${pkgInfo.version}`);
  } else {
    console.log('Version information unavailable.');
  }
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Script runner helper
// ---------------------------------------------------------------------------

/**
 * Run a Node.js script from the scripts/ directory with forwarded args.
 * @param {string} scriptName - filename inside scripts/ (e.g. 'doctor.mjs')
 * @param {string[]} scriptArgs - additional CLI arguments
 */
function runScript(scriptName, scriptArgs = []) {
  const scriptPath = path.join(pkgRoot, 'scripts', scriptName);
  if (!fs.existsSync(scriptPath)) {
    console.error(`Error: Script not found: scripts/${scriptName}`);
    console.error('Run `vbounce doctor` to check which scripts are missing.');
    process.exit(1);
  }
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  process.exit(result.status ?? 0);
}

// ---------------------------------------------------------------------------
// Utility for interactive prompt (used by install)
// ---------------------------------------------------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function displayHelp() {
  console.log(`
V-Bounce Engine CLI

Usage:
  vbounce install <platform>           Install V-Bounce Engine into a project
  vbounce state show                   Show current sprint state
  vbounce state update <storyId> <state|--qa-bounce>
  vbounce sprint init <sprintId> <deliveryId> [--stories STORY-001,...]
  vbounce sprint close <sprintId>
  vbounce story complete <storyId> [options]
  vbounce validate report <file>       Validate agent report YAML
  vbounce validate state               Validate state.json
  vbounce validate sprint [file]       Validate Sprint Plan
  vbounce validate ready <storyId>     Pre-bounce gate check
  vbounce prep qa <storyId>            Generate QA context pack
  vbounce prep arch <storyId>          Generate Architect context pack
  vbounce prep sprint <sprintId>       Generate Sprint context pack
  vbounce tokens                         Show token usage for current session
  vbounce tokens --all                   Show per-subagent token breakdown
  vbounce tokens --sprint S-XX           Aggregate tokens from all stories in a sprint
  vbounce tokens --json                  JSON output for reports
  vbounce graph [generate]              Generate product document graph
  vbounce graph impact <DOC-ID>         Show what's affected by a document change
  vbounce docs match --story <ID>      Match story scope against vdoc manifest
  vbounce docs check <sprintId>        Detect stale vdocs and generate Scribe task
  vbounce trends                       Cross-sprint trend analysis
  vbounce suggest <sprintId>           Generate improvement suggestions
  vbounce improve <sprintId>           Run full self-improvement pipeline
  vbounce doctor                       Validate all configs and state files

Install Platforms:
  claude  : Installs CLAUDE.md and Claude Code subagents
  cursor  : Installs modular .cursor/rules/
  gemini  : Installs GEMINI.md and Antigravity skills
  codex   : Installs AGENTS.md for OpenAI Codex
  vscode  : Installs standard system prompt for Copilot
  copilot : Alias for vscode
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Route commands
// ---------------------------------------------------------------------------

if (!command || command === 'help' || command === '--help' || command === '-h') {
  rl.close();
  displayHelp();
}

// -- state --
if (command === 'state') {
  rl.close();
  if (sub === 'show') {
    runScript('update_state.mjs', ['--show']);
  } else if (sub === 'update') {
    // vbounce state update <storyId> <newState|--qa-bounce>
    runScript('update_state.mjs', args.slice(2));
  } else {
    console.error(`Unknown state subcommand: ${sub}`);
    console.error('Usage: vbounce state show | vbounce state update <storyId> <state|--qa-bounce>');
    process.exit(1);
  }
}

// -- sprint --
if (command === 'sprint') {
  rl.close();
  if (sub === 'init') {
    runScript('init_sprint.mjs', args.slice(2));
  } else if (sub === 'close') {
    runScript('close_sprint.mjs', args.slice(2));
  } else {
    console.error(`Unknown sprint subcommand: ${sub}`);
    console.error('Usage: vbounce sprint init <sprintId> <deliveryId> | vbounce sprint close <sprintId>');
    process.exit(1);
  }
}

// -- story --
if (command === 'story') {
  rl.close();
  if (sub === 'complete') {
    runScript('complete_story.mjs', args.slice(2));
  } else {
    console.error(`Unknown story subcommand: ${sub}`);
    console.error('Usage: vbounce story complete <storyId> [options]');
    process.exit(1);
  }
}

// -- validate --
if (command === 'validate') {
  rl.close();
  if (sub === 'report') {
    runScript('validate_report.mjs', args.slice(2));
  } else if (sub === 'state') {
    runScript('validate_state.mjs', args.slice(2));
  } else if (sub === 'sprint') {
    runScript('validate_sprint_plan.mjs', args.slice(2));
  } else if (sub === 'ready') {
    runScript('validate_bounce_readiness.mjs', args.slice(2));
  } else {
    console.error(`Unknown validate subcommand: ${sub}`);
    console.error('Usage: vbounce validate report <file> | state | sprint [file] | ready <storyId>');
    process.exit(1);
  }
}

// -- prep --
if (command === 'prep') {
  rl.close();
  if (sub === 'qa') {
    runScript('prep_qa_context.mjs', args.slice(2));
  } else if (sub === 'arch') {
    runScript('prep_arch_context.mjs', args.slice(2));
  } else if (sub === 'sprint') {
    runScript('prep_sprint_context.mjs', args.slice(2));
  } else {
    console.error(`Unknown prep subcommand: ${sub}`);
    console.error('Usage: vbounce prep qa <storyId> | arch <storyId> | sprint <sprintId>');
    process.exit(1);
  }
}

// -- trends --
if (command === 'trends') {
  rl.close();
  runScript('sprint_trends.mjs', args.slice(1));
}

// -- suggest --
if (command === 'suggest') {
  rl.close();
  runScript('suggest_improvements.mjs', args.slice(1));
}

// -- improve --
if (command === 'improve') {
  rl.close();
  // Full pipeline: analyze → trends → suggest
  const sprintArg = args[1];
  if (!sprintArg) {
    console.error('Usage: vbounce improve S-XX');
    process.exit(1);
  }
  // Run trends first
  const trendsPath = path.join(pkgRoot, 'scripts', 'sprint_trends.mjs');
  if (fs.existsSync(trendsPath)) {
    console.log('Step 1/2: Running cross-sprint trend analysis...');
    spawnSync(process.execPath, [trendsPath], { stdio: 'inherit', cwd: process.cwd() });
  }
  // Run suggest (which internally runs post_sprint_improve.mjs)
  console.log('\nStep 2/2: Running improvement analyzer + suggestions...');
  runScript('suggest_improvements.mjs', [sprintArg]);
}

// -- tokens --
if (command === 'tokens') {
  rl.close();
  runScript('count_tokens.mjs', args.slice(1));
}

// -- graph --
if (command === 'graph') {
  rl.close();
  if (sub === 'impact') {
    runScript('product_impact.mjs', args.slice(2));
  } else if (!sub || sub === 'generate') {
    runScript('product_graph.mjs', args.slice(2));
  } else {
    console.error(`Unknown graph subcommand: ${sub}`);
    console.error('Usage: vbounce graph [generate] | vbounce graph impact <DOC-ID>');
    process.exit(1);
  }
}

// -- docs --
if (command === 'docs') {
  rl.close();
  if (sub === 'match') {
    runScript('vdoc_match.mjs', args.slice(2));
  } else if (sub === 'check') {
    runScript('vdoc_staleness.mjs', args.slice(2));
  } else {
    console.error(`Unknown docs subcommand: ${sub}`);
    console.error('Usage: vbounce docs match --story <ID> | vbounce docs check <sprintId>');
    process.exit(1);
  }
}

// -- doctor --
if (command === 'doctor') {
  rl.close();
  runScript('doctor.mjs', args.slice(1));
}

// ---------------------------------------------------------------------------
// install command (original functionality)
// ---------------------------------------------------------------------------

if (command === 'install') {
  const targetPlatform = sub?.toLowerCase();

  if (!targetPlatform) {
    rl.close();
    displayHelp();
  }

  const CWD = process.cwd();
  const pkgVersion = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf8')).version;

  // Map vbounce platform names to vdoc platform names
  const vdocPlatformMap = {
    claude: 'claude',
    cursor: 'cursor',
    gemini: 'gemini',
    codex: 'agents',
    vscode: 'vscode',
    copilot: 'vscode'
  };

  const platformMappings = {
    claude: [
      { src: 'brains/CLAUDE.md', dest: 'CLAUDE.md' },
      { src: 'brains/claude-agents', dest: '.claude/agents' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    cursor: [
      { src: 'brains/cursor-rules', dest: '.cursor/rules' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    gemini: [
      { src: 'brains/GEMINI.md', dest: 'GEMINI.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'skills', dest: '.agents/skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    codex: [
      { src: 'brains/AGENTS.md', dest: 'AGENTS.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    vscode: [
      { src: 'brains/CLAUDE.md', dest: '.github/copilot-instructions.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ],
    copilot: [
      { src: 'brains/CLAUDE.md', dest: '.github/copilot-instructions.md' },
      { src: 'templates', dest: 'templates' },
      { src: 'skills', dest: 'skills' },
      { src: 'scripts', dest: 'scripts' }
    ]
  };

  const mapping = platformMappings[targetPlatform];

  if (!mapping) {
    rl.close();
    console.error(`Error: Unsupported platform '${targetPlatform}'.\n`);
    displayHelp();
  }

  // ---------------------------------------------------------------------------
  // Upgrade-safe install helpers
  // ---------------------------------------------------------------------------

  const META_PATH = path.join(CWD, '.bounce', 'install-meta.json');
  const BACKUPS_DIR = path.join(CWD, '.bounce', 'backups');

  /** Compute MD5 hash of a single file's contents. */
  function computeFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /** Compute a combined hash for a directory by hashing all files sorted by relative path. */
  function computeDirHash(dirPath) {
    const hash = crypto.createHash('md5');
    const entries = [];

    function walk(dir, rel) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(rel, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath, relPath);
        } else {
          entries.push({ relPath, fullPath });
        }
      }
    }

    walk(dirPath, '');
    entries.sort((a, b) => a.relPath.localeCompare(b.relPath));
    for (const e of entries) {
      hash.update(e.relPath);
      hash.update(fs.readFileSync(e.fullPath));
    }
    return hash.digest('hex');
  }

  /** Compute hash for a path (file or directory). */
  function computeHash(p) {
    const stats = fs.statSync(p);
    return stats.isDirectory() ? computeDirHash(p) : computeFileHash(p);
  }

  /** Count files in a path (1 for a file, recursive count for a directory). */
  function countFiles(p) {
    const stats = fs.statSync(p);
    if (!stats.isDirectory()) return 1;
    let count = 0;
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(path.join(dir, entry.name));
        else count++;
      }
    }
    walk(p);
    return count;
  }

  /** Read install-meta.json, returns null if missing. */
  function readInstallMeta() {
    if (!fs.existsSync(META_PATH)) return null;
    try {
      return JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
    } catch {
      return null;
    }
  }

  /** Write install-meta.json. */
  function writeInstallMeta(version, platform, files, hashes) {
    const meta = {
      version,
      platform,
      installed_at: new Date().toISOString(),
      files,
      hashes
    };
    fs.mkdirSync(path.dirname(META_PATH), { recursive: true });
    fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n');
  }

  /** Backup files to .bounce/backups/<version>/. Removes previous backup first. */
  function backupFiles(version, paths) {
    // Remove previous backup (keep only one)
    if (fs.existsSync(BACKUPS_DIR)) {
      for (const entry of fs.readdirSync(BACKUPS_DIR, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          fs.rmSync(path.join(BACKUPS_DIR, entry.name), { recursive: true, force: true });
        }
      }
    }

    const backupDir = path.join(BACKUPS_DIR, version);
    fs.mkdirSync(backupDir, { recursive: true });

    for (const relPath of paths) {
      const src = path.join(CWD, relPath);
      const dest = path.join(backupDir, relPath);

      if (!fs.existsSync(src)) continue;

      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
      }
    }

    return backupDir;
  }

  /**
   * Classify files into unchanged, modified, and newFiles.
   * - unchanged: dest exists and matches what was installed (safe to overwrite)
   * - modified: dest exists but differs from what was installed (user changed it)
   * - newFiles: dest does not exist
   */
  function classifyFiles(mappingRules, meta) {
    const unchanged = [];
    const modified = [];
    const newFiles = [];

    for (const rule of mappingRules) {
      const sourcePath = path.join(pkgRoot, rule.src);
      const destPath = path.join(CWD, rule.dest);

      if (!fs.existsSync(sourcePath)) continue;

      if (!fs.existsSync(destPath)) {
        newFiles.push(rule);
        continue;
      }

      // Dest exists — classify as unchanged or modified
      if (!meta || !meta.hashes || !meta.hashes[rule.dest]) {
        // No metadata (first upgrade) — treat as modified to be safe
        modified.push(rule);
        continue;
      }

      const currentHash = computeHash(destPath);
      const installedHash = meta.hashes[rule.dest];

      if (currentHash === installedHash) {
        unchanged.push(rule);
      } else {
        modified.push(rule);
      }
    }

    return { unchanged, modified, newFiles };
  }

  // ---------------------------------------------------------------------------
  // Begin install flow
  // ---------------------------------------------------------------------------

  const meta = readInstallMeta();
  const isUpgrade = meta !== null;

  if (isUpgrade) {
    console.log(`\n🚀 V-Bounce Engine \x1b[36m${pkgVersion}\x1b[0m (upgrading from \x1b[33m${meta.version}\x1b[0m)\n`);
  } else {
    console.log(`\n🚀 Preparing to install V-Bounce Engine \x1b[36m${pkgVersion}\x1b[0m for \x1b[36m${targetPlatform}\x1b[0m...\n`);
  }

  const { unchanged, modified, newFiles } = classifyFiles(mapping, meta);

  if (unchanged.length > 0) {
    console.log('Will update (unchanged by you):');
    for (const rule of unchanged) {
      const destPath = path.join(CWD, rule.dest);
      const n = countFiles(destPath);
      const label = n > 1 ? `(${n} files)` : '';
      console.log(`  \x1b[32m✓\x1b[0m ${rule.dest} ${label}`);
    }
  }

  if (modified.length > 0) {
    const backupLabel = isUpgrade ? `.bounce/backups/${meta.version}/` : '.bounce/backups/pre-install/';
    console.log(`\nModified by you (backed up to ${backupLabel}):`);
    for (const rule of modified) {
      console.log(`  \x1b[33m⚠\x1b[0m ${rule.dest}`);
    }
  }

  if (newFiles.length > 0) {
    console.log('\nNew in this version:');
    for (const rule of newFiles) {
      console.log(`  \x1b[32m+\x1b[0m ${rule.dest}`);
    }
  }

  if (unchanged.length === 0 && modified.length === 0 && newFiles.length === 0) {
    rl.close();
    console.log('Nothing to install — all source files are missing from the package.');
    process.exit(0);
  }

  console.log('');

  askQuestion('Proceed with installation? [y/N] ').then(async answer => {
    rl.close();
    const confirmation = answer.trim().toLowerCase();

    if (confirmation !== 'y' && confirmation !== 'yes') {
      console.log('\n❌ Installation cancelled.\n');
      process.exit(0);
    }

    // Backup modified files before overwriting
    if (modified.length > 0) {
      const backupVersion = isUpgrade ? meta.version : 'pre-install';
      const backupDir = backupFiles(backupVersion, modified.map(r => r.dest));
      console.log(`\n📂 Backed up modified files to ${path.relative(CWD, backupDir)}/`);
    }

    console.log('\n📦 Installing files...');

    const installedFiles = [];
    const hashes = {};

    for (const rule of [...unchanged, ...modified, ...newFiles]) {
      const sourcePath = path.join(pkgRoot, rule.src);
      const destPath = path.join(CWD, rule.dest);

      if (!fs.existsSync(sourcePath)) continue;

      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        fs.cpSync(sourcePath, destPath, { recursive: true, force: true });
      } else {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, destPath);
      }

      // Record hash of what we just installed (from source)
      hashes[rule.dest] = computeHash(sourcePath);
      installedFiles.push(rule.dest);
      console.log(`  \x1b[32m✓\x1b[0m ${rule.dest}`);
    }

    // Create LESSONS.md if missing
    const lessonsPath = path.join(CWD, 'LESSONS.md');
    if (!fs.existsSync(lessonsPath)) {
      fs.writeFileSync(lessonsPath, '# Lessons Learned\n\nProject-specific lessons recorded after each story merge. Read this before writing code.\n');
      console.log(`  \x1b[32m✓\x1b[0m LESSONS.md (created)`);
    }

    // Write install metadata
    writeInstallMeta(pkgVersion, targetPlatform, installedFiles, hashes);
    console.log(`  \x1b[32m✓\x1b[0m .bounce/install-meta.json`);

    console.log('\n⚙️  Installing dependencies...');
    try {
      const deps = ['js-yaml', 'marked', 'commander'];
      console.log(`  Running: npm install ${deps.join(' ')}`);
      execSync(`npm install ${deps.join(' ')}`, { stdio: 'inherit', cwd: CWD });
      console.log('  \x1b[32m✓\x1b[0m Dependencies installed.');
    } catch (err) {
      console.error('  \x1b[31m✖\x1b[0m Failed to install dependencies. You may need to run it manually.');
    }

    // vdoc integration
    const vdocPlatform = vdocPlatformMap[targetPlatform];
    if (vdocPlatform) {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const vdocAnswer = await new Promise(resolve => rl2.question('\n📝 Install vdoc (AI-powered documentation generator)? [y/N] ', resolve));
      rl2.close();

      if (vdocAnswer.trim().toLowerCase() === 'y' || vdocAnswer.trim().toLowerCase() === 'yes') {
        console.log(`\n📝 Installing vdoc for ${vdocPlatform}...`);
        try {
          execSync(`npx @sandrinio/vdoc install ${vdocPlatform}`, { stdio: 'inherit', cwd: CWD });
          console.log('  \x1b[32m✓\x1b[0m vdoc installed.');
        } catch (err) {
          console.error(`  \x1b[31m✖\x1b[0m Failed to install vdoc. Run manually: npx @sandrinio/vdoc install ${vdocPlatform}`);
        }
      } else {
        console.log(`\n  Skipped. You can install later: npx @sandrinio/vdoc install ${vdocPlatform}`);
      }
    }

    // Auto-run doctor to verify installation
    console.log('\n🩺 Running doctor to verify installation...');
    const doctorPath = path.join(CWD, 'scripts', 'doctor.mjs');
    if (fs.existsSync(doctorPath)) {
      const result = spawnSync(process.execPath, [doctorPath], {
        stdio: 'inherit',
        cwd: CWD
      });
      if (result.status !== 0) {
        console.error('\n  \x1b[33m⚠\x1b[0m Doctor reported issues. Review the output above.');
      }
    } else {
      console.log('  \x1b[33m⚠\x1b[0m Doctor script not found — skipping verification.');
    }

    console.log('\n✅ V-Bounce Engine successfully installed! Welcome to the team.\n');
  });

} else {
  // Unknown command fallthrough
  rl.close();
  console.error(`Unknown command: ${command}`);
  displayHelp();
}
