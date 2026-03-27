/**
 * Suite: Install Integrity
 * Verifies a fresh `vbounce install claude` produces the correct file layout.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { suite, record, assertFileExists, PASS, FAIL, WARN, SKIP } from '../harness.mjs';

export default function runInstallSuite(installDir) {
  suite('Install Integrity');

  // ── 1. install-meta.json ──
  const metaPath = path.join(installDir, '.vbounce', 'install-meta.json');
  if (assertFileExists(metaPath, 'install', 'Install metadata')) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      record({
        name: 'install-meta.json is valid JSON',
        component: 'install',
        input: metaPath,
        output: `version=${meta.version}, platform=${meta.platform}`,
        expected: 'valid JSON with version and platform',
        verdict: meta.version && meta.platform ? PASS : FAIL,
      });
      record({
        name: 'Installed platform is claude',
        component: 'install',
        input: `meta.platform`,
        output: meta.platform,
        expected: 'claude',
        verdict: meta.platform === 'claude' ? PASS : FAIL,
      });
    } catch (e) {
      record({
        name: 'install-meta.json is valid JSON',
        component: 'install',
        input: metaPath,
        output: e.message,
        expected: 'valid JSON',
        verdict: FAIL,
      });
    }
  }

  // ── 2. Core file structure ──
  const requiredFiles = [
    ['CLAUDE.md', 'brain'],
    ['FLASHCARDS.md', 'install'],
    ['.vbounce/VBOUNCE_MANIFEST.md', 'manifest'],
    ['.vbounce/.gitignore', 'install'],
  ];
  for (const [rel, comp] of requiredFiles) {
    assertFileExists(path.join(installDir, rel), comp);
  }

  // ── 3. Agent brains ──
  const agents = ['explorer.md', 'developer.md', 'qa.md', 'architect.md', 'devops.md', 'scribe.md'];
  for (const agent of agents) {
    assertFileExists(path.join(installDir, '.claude', 'agents', agent), 'brain');
  }

  // ── 4. Templates ──
  const requiredTemplates = [
    'sprint.md', 'sprint_report.md', 'story.md',
    'epic.md', 'charter.md', 'roadmap.md', 'risk_registry.md',
    'bug.md', 'change_request.md', 'hotfix.md', 'spike.md', 'sprint_context.md',
  ];
  for (const t of requiredTemplates) {
    assertFileExists(path.join(installDir, '.vbounce', 'templates', t), 'template');
  }

  // ── 5. Skills ──
  const requiredSkills = [
    'agent-team', 'doc-manager', 'lesson', 'vibe-code-review',
    'react-best-practices', 'write-skill', 'improve', 'product-graph', 'file-organization',
  ];
  for (const s of requiredSkills) {
    assertFileExists(path.join(installDir, '.vbounce', 'skills', s, 'SKILL.md'), 'skill');
  }

  // ── 6. Scripts ──
  const requiredScripts = [
    'doctor.mjs', 'validate_report.mjs', 'update_state.mjs', 'validate_state.mjs',
    'validate_sprint_plan.mjs', 'validate_bounce_readiness.mjs',
    'init_sprint.mjs', 'close_sprint.mjs', 'complete_story.mjs',
    'prep_qa_context.mjs', 'prep_arch_context.mjs', 'prep_sprint_context.mjs',
    'prep_sprint_summary.mjs', 'sprint_trends.mjs', 'suggest_improvements.mjs',
    'count_tokens.mjs', 'product_graph.mjs', 'product_impact.mjs',
    'vdoc_match.mjs', 'vdoc_staleness.mjs', 'verify_framework.mjs',
    'hotfix_manager.sh', 'pre_gate_runner.sh', 'pre_gate_common.sh',
    'init_gate_config.sh', 'verify_framework.sh',
    'post_sprint_improve.mjs',
  ];
  for (const s of requiredScripts) {
    assertFileExists(path.join(installDir, '.vbounce', 'scripts', s), 'script');
  }

  // ── 7. Skill reference files ──
  const skillRefs = [
    'agent-team/references/cleanup.md',
    'agent-team/references/discovery.md',
    'agent-team/references/git-strategy.md',
    'agent-team/references/mid-sprint-triage.md',
    'agent-team/references/report-naming.md',
    'file-organization/references/gitignore-template.md',
    'file-organization/references/quick-checklist.md',
    'vibe-code-review/references/deep-audit.md',
    'vibe-code-review/references/pr-review.md',
    'vibe-code-review/references/quick-scan.md',
    'vibe-code-review/references/report-template.md',
    'vibe-code-review/references/trend-check.md',
  ];
  for (const ref of skillRefs) {
    assertFileExists(path.join(installDir, '.vbounce', 'skills', ref), 'skill-reference');
  }

  // ── 8. File count sanity ──
  const agentCount = fs.readdirSync(path.join(installDir, '.claude', 'agents')).filter(f => f.endsWith('.md')).length;
  record({
    name: `Agent brain count`,
    component: 'brain',
    input: '.claude/agents/*.md',
    output: `${agentCount} agents`,
    expected: `${agents.length} agents`,
    verdict: agentCount === agents.length ? PASS : (agentCount > 0 ? WARN : FAIL),
    note: agentCount !== agents.length ? `Expected ${agents.length}, got ${agentCount}` : undefined,
  });
}
