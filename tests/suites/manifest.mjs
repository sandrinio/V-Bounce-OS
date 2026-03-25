/**
 * Suite: Manifest Completeness
 * Verifies VBOUNCE_MANIFEST.md paths exist in the install,
 * and installed files are accounted for in the manifest.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, PASS, FAIL, WARN } from '../harness.mjs';

export default function runManifestSuite(installDir) {
  suite('Manifest — Path Resolution');

  const manifestPath = path.join(installDir, '.vbounce', 'VBOUNCE_MANIFEST.md');
  if (!fs.existsSync(manifestPath)) {
    record({
      name: 'VBOUNCE_MANIFEST.md exists',
      component: 'manifest',
      input: manifestPath,
      output: 'missing',
      expected: 'exists',
      verdict: FAIL,
    });
    return;
  }

  const content = fs.readFileSync(manifestPath, 'utf8');

  // Extract all backtick-quoted paths from the manifest
  const pathPattern = /`(\.vbounce\/[^`*{]+|\.claude\/agents\/[^`*{]+|CLAUDE\.md|AGENTS\.md|GEMINI\.md|LESSONS\.md|product_plans\/[^`*{]+)`/g;
  let match;
  const manifestPaths = new Map(); // path → line number
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let m;
    const linePathPattern = /`(\.vbounce\/[^`*{]+|\.claude\/agents\/[^`*{]+|CLAUDE\.md|AGENTS\.md|GEMINI\.md|LESSONS\.md)`/g;
    while ((m = linePathPattern.exec(lines[i])) !== null) {
      const p = m[1];
      if (!manifestPaths.has(p)) manifestPaths.set(p, i + 1);
    }
  }

  record({
    name: 'Manifest path count',
    component: 'manifest',
    input: 'VBOUNCE_MANIFEST.md backtick paths',
    output: `${manifestPaths.size} unique paths`,
    expected: '> 0 paths',
    verdict: manifestPaths.size > 0 ? PASS : FAIL,
  });

  // Check which paths exist (claude-only install context)
  const claudeOnlyOptional = new Set(['AGENTS.md', 'GEMINI.md']);

  // Runtime-generated files: created by scripts during lifecycle, not by install
  const runtimeGenerated = new Set([
    '.vbounce/state.json',
    '.vbounce/CHANGELOG.md',
    '.vbounce/trends.md',
    '.vbounce/gate-checks.json',
    '.vbounce/improvement-manifest.json',
    '.vbounce/improvement-suggestions.md',
    '.vbounce/product-graph.json',
    '.vbounce/reports/',
  ]);
  // Patterns for runtime files with variable names (sprint IDs, story IDs)
  const runtimePatterns = [
    /\.vbounce\/sprint-context-/,
    /\.vbounce\/qa-context-/,
    /\.vbounce\/arch-context-/,
    /\.vbounce\/scribe-task-/,
  ];

  let existCount = 0;
  let missingCount = 0;

  for (const [ref, lineNum] of manifestPaths) {
    const resolved = path.join(installDir, ref);
    const exists = fs.existsSync(resolved);

    if (exists) {
      existCount++;
    } else {
      const isOptional = claudeOnlyOptional.has(ref) ||
        ref.includes('.cursor/') ||
        ref.includes('.github/') ||
        ref.includes('.windsurfrules');

      const isRuntime = runtimeGenerated.has(ref) ||
        runtimePatterns.some(p => p.test(ref));

      record({
        name: `Manifest path: ${ref}`,
        component: 'manifest',
        input: `line ${lineNum}: \`${ref}\``,
        output: 'missing',
        expected: 'exists (or optional/runtime)',
        verdict: (isOptional || isRuntime) ? WARN : FAIL,
        note: isOptional ? 'optional for claude-only install' :
              isRuntime ? 'runtime-generated, not present on fresh install' : undefined,
      });
      missingCount++;
    }
  }

  record({
    name: 'Manifest path resolution summary',
    component: 'manifest',
    input: `${manifestPaths.size} paths checked`,
    output: `${existCount} exist, ${missingCount} missing`,
    expected: 'all exist (or marked optional)',
    verdict: missingCount === 0 ? PASS : WARN,
  });

  // ── Orphan detection ──
  suite('Manifest — Orphan Files');

  // Check if key installed files are mentioned in the manifest
  const agentsDir = path.join(installDir, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    for (const agentFile of fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))) {
      const ref = `.claude/agents/${agentFile}`;
      const mentioned = content.includes(ref);
      record({
        name: `Manifest mentions: ${ref}`,
        component: 'manifest',
        input: ref,
        output: mentioned ? 'mentioned' : 'orphan',
        expected: 'mentioned',
        verdict: mentioned ? PASS : WARN,
        note: mentioned ? undefined : 'installed but not in manifest',
      });
    }
  }
}
