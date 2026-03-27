/**
 * Suite: Path Integrity
 * Verifies no stale path patterns exist in shipped files.
 * Verifies all cross-references resolve to real files.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, assertNoMatch, PASS, FAIL, WARN } from '../harness.mjs';

export default function runPathsSuite(installDir) {
  suite('Path Integrity — Stale Patterns');

  // ── Stale pattern definitions ──
  // Each pattern: [regex, description, files to check, severity-if-found]
  // We check all .md and .mjs files under .vbounce/ and .claude/ and CLAUDE.md at root

  const shippedMdFiles = [];
  const shippedMjsFiles = [];

  // Collect all shipped .md files
  function collectFiles(dir, ext, list) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collectFiles(full, ext, list);
      else if (entry.name.endsWith(ext)) list.push(full);
    }
  }

  collectFiles(path.join(installDir, '.vbounce'), '.md', shippedMdFiles);
  collectFiles(path.join(installDir, '.vbounce'), '.mjs', shippedMjsFiles);
  collectFiles(path.join(installDir, '.claude'), '.md', shippedMdFiles);

  // Add root brain file
  const rootBrain = path.join(installDir, 'CLAUDE.md');
  if (fs.existsSync(rootBrain)) shippedMdFiles.push(rootBrain);

  const allShipped = [...shippedMdFiles, ...shippedMjsFiles];

  record({
    name: 'Shipped file inventory',
    component: 'paths',
    input: `${installDir}`,
    output: `${shippedMdFiles.length} .md + ${shippedMjsFiles.length} .mjs = ${allShipped.length} files`,
    expected: '> 0 files',
    verdict: allShipped.length > 0 ? PASS : FAIL,
  });

  // ── 1. Stale brains/claude-agents/ references ──
  // Valid in comments/changelog, invalid as path references in instructions
  for (const f of allShipped) {
    assertNoMatch(f, 'brains/claude-agents/', 'paths', 'Should be .claude/agents/');
  }

  // ── 2. Stale brains/CLAUDE.md, brains/GEMINI.md, brains/AGENTS.md ──
  for (const f of allShipped) {
    assertNoMatch(f, 'brains/(CLAUDE|GEMINI|AGENTS)\\.md', 'paths', 'Should be root-level files');
  }

  // ── 3. Stale brains/CHANGELOG.md ──
  for (const f of allShipped) {
    assertNoMatch(f, 'brains/CHANGELOG\\.md', 'paths', 'Should be .vbounce/CHANGELOG.md');
  }

  // ── 4. Old .bounce/ directory (missing the v) ──
  for (const f of allShipped) {
    // Match .bounce/ but NOT .vbounce/
    assertNoMatch(f, '(?<![v])\\.bounce/', 'paths', 'Should be .vbounce/');
  }

  // ── 5. @ includes in CLAUDE.md resolve ──
  suite('Path Integrity — @ Includes');

  if (fs.existsSync(rootBrain)) {
    const content = fs.readFileSync(rootBrain, 'utf8');
    const includePattern = /@([.\w\-/]+SKILL\.md)/g;
    let match;
    while ((match = includePattern.exec(content)) !== null) {
      const ref = match[1];
      const resolved = path.join(installDir, ref);
      const exists = fs.existsSync(resolved);
      record({
        name: `@ include resolves: ${ref}`,
        component: 'brain',
        input: `CLAUDE.md → @${ref}`,
        output: exists ? 'exists' : 'missing',
        expected: 'exists',
        verdict: exists ? PASS : FAIL,
      });
    }
  }

  // ── 6. Backtick paths in agent brains resolve ──
  suite('Path Integrity — Agent Brain References');

  const agentsDir = path.join(installDir, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const agentFile of fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))) {
      const agentPath = path.join(agentsDir, agentFile);
      const content = fs.readFileSync(agentPath, 'utf8');

      // Extract backtick-quoted paths that look like file references
      const pathPattern = /`(\.vbounce\/[^`]+|\.claude\/[^`]+|product_plans\/[^`]+|FLASHCARDS\.md|VBOUNCE_MANIFEST\.md)`/g;
      let pathMatch;
      const checkedPaths = new Set();
      while ((pathMatch = pathPattern.exec(content)) !== null) {
        const ref = pathMatch[1];
        // Skip patterns with wildcards or placeholders
        if (ref.includes('*') || ref.includes('{') || ref.includes('NNN') || ref.includes('-XX')) continue;
        if (checkedPaths.has(ref)) continue;
        checkedPaths.add(ref);

        const resolved = path.join(installDir, ref);
        const exists = fs.existsSync(resolved);
        record({
          name: `Brain ref: ${agentFile} → ${ref}`,
          component: 'brain',
          input: `${agentFile}: \`${ref}\``,
          output: exists ? 'exists' : 'missing',
          expected: 'exists',
          verdict: exists ? PASS : WARN, // WARN not FAIL — some paths are created at runtime
          note: exists ? undefined : 'path may be created at runtime',
        });
      }
    }
  }
}
