#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkgRoot = path.join(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0];
const targetPlatform = args[1]?.toLowerCase();

// Utility for interactive prompt
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

function displayHelp() {
  console.log(`
🎯 V-Bounce OS Installer

Usage:
  npx vbounce install <platform>

Supported Platforms:
  claude  : Installs CLAUDE.md and Claude Code subagents
  cursor  : Installs modular .cursor/rules/
  gemini  : Installs GEMINI.md and Antigravity skills
  codex   : Installs AGENTS.md for OpenAI Codex
  vscode  : Installs standard system prompt for Copilot
  copilot : Alias for vscode
`);
  process.exit(0);
}

if (!command || command !== 'install' || !targetPlatform) {
  displayHelp();
}

const CWD = process.cwd();

const platformMappings = {
  claude: [
    { src: 'brains/CLAUDE.md', dest: 'CLAUDE.md' },
    { src: 'brains/claude-agents', dest: '.claude/agents' },
    { src: 'templates', dest: 'templates' },
    { src: 'skills', dest: 'skills' }
  ],
  cursor: [
    { src: 'brains/cursor-rules', dest: '.cursor/rules' },
    { src: 'templates', dest: 'templates' },
    { src: 'skills', dest: 'skills' }
  ],
  gemini: [
    { src: 'brains/GEMINI.md', dest: 'GEMINI.md' },
    { src: 'templates', dest: 'templates' },
    { src: 'skills', dest: 'skills' },
    { src: 'skills', dest: '.agents/skills' }
  ],
  codex: [
    { src: 'brains/AGENTS.md', dest: 'AGENTS.md' },
    { src: 'templates', dest: 'templates' },
    { src: 'skills', dest: 'skills' }
  ],
  vscode: [
    { src: 'brains/CLAUDE.md', dest: '.github/copilot-instructions.md' },
    { src: 'templates', dest: 'templates' },
    { src: 'skills', dest: 'skills' }
  ],
  copilot: [
    { src: 'brains/CLAUDE.md', dest: '.github/copilot-instructions.md' },
    { src: 'templates', dest: 'templates' },
    { src: 'skills', dest: 'skills' }
  ]
};

const mapping = platformMappings[targetPlatform];

if (!mapping) {
  console.error(`Error: Unsupported platform '${targetPlatform}'.\n`);
  displayHelp();
}

console.log(`\n🚀 Preparing to install V-Bounce OS for \x1b[36m${targetPlatform}\x1b[0m...\n`);

const toCopy = [];
const toOverwrite = [];

mapping.forEach(rule => {
  const sourcePath = path.join(pkgRoot, rule.src);
  const destPath = path.join(CWD, rule.dest);

  if (!fs.existsSync(sourcePath)) {
    return; // Source does not exist internally, skip
  }

  if (fs.existsSync(destPath)) {
    toOverwrite.push(rule.dest);
  } else {
    toCopy.push(rule.dest);
  }
});

if (toCopy.length > 0) {
  console.log('The following will be \x1b[32mCREATED\x1b[0m:');
  toCopy.forEach(f => console.log(`  + ${f}`));
}

if (toOverwrite.length > 0) {
  console.log('\nThe following will be \x1b[33mOVERWRITTEN\x1b[0m:');
  toOverwrite.forEach(f => console.log(`  ! ${f}`));
}

console.log('');

askQuestion('Proceed with installation? [y/N] ').then(answer => {
  rl.close();
  const confirmation = answer.trim().toLowerCase();
  
  if (confirmation !== 'y' && confirmation !== 'yes') {
    console.log('\n❌ Installation cancelled.\n');
    process.exit(0);
  }

  console.log('\n📦 Installing files...');

  mapping.forEach(rule => {
    const sourcePath = path.join(pkgRoot, rule.src);
    const destPath = path.join(CWD, rule.dest);

    if (!fs.existsSync(sourcePath)) return;

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
    console.log(`  \x1b[32m✓\x1b[0m ${rule.dest}`);
  });

  console.log('\n✅ V-Bounce OS successfully installed! Welcome to the team.\n');
});
