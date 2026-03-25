/**
 * Suite: Agent Brain Contracts
 * Verifies agent brains have required YAML signatures,
 * frontmatter is valid, and all file references resolve.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, PASS, FAIL, WARN } from '../harness.mjs';

// Expected YAML signatures per agent — must match verify_framework.mjs
const EXPECTED_SIGNATURES = {
  'developer.md': ['status:', 'correction_tax:', 'tokens_used:', 'tests_written:', 'files_modified:', 'lessons_flagged:'],
  'qa.md': ['status: "PASS"', 'bounce_count:', 'bugs_found: 0', 'gold_plating_detected:', 'status: "FAIL"', 'tokens_used:', 'failed_scenarios:'],
  'architect.md': ['status: "PASS"', 'safe_zone_score:', 'ai_isms_detected:', 'regression_risk:', 'status: "FAIL"', 'bounce_count:', 'tokens_used:', 'critical_failures:'],
  'devops.md': ['type: "story-merge"', 'status:', 'conflicts_detected:', 'type: "sprint-release"', 'tokens_used:', 'version:'],
  'scribe.md': ['mode:', 'tokens_used:', 'docs_created:', 'docs_updated:', 'docs_removed:'],
};

export default function runBrainsSuite(installDir) {
  suite('Agent Brain Contracts — Frontmatter');

  const agentsDir = path.join(installDir, '.claude', 'agents');
  if (!fs.existsSync(agentsDir)) {
    record({
      name: 'Agents directory exists',
      component: 'brain',
      input: agentsDir,
      output: 'missing',
      expected: 'exists',
      verdict: FAIL,
    });
    return;
  }

  const agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

  for (const agentFile of agents) {
    const agentPath = path.join(agentsDir, agentFile);
    const content = fs.readFileSync(agentPath, 'utf8');

    // Check frontmatter exists
    const hasFrontmatter = content.startsWith('---');
    record({
      name: `Frontmatter: ${agentFile}`,
      component: 'brain',
      input: agentFile,
      output: hasFrontmatter ? 'has frontmatter' : 'no frontmatter',
      expected: 'has frontmatter',
      verdict: hasFrontmatter ? PASS : FAIL,
    });

    // Check frontmatter fields
    if (hasFrontmatter) {
      const fmEnd = content.indexOf('---', 4);
      const fm = content.slice(4, fmEnd);
      const hasName = fm.includes('name:');
      const hasDescription = fm.includes('description:');
      const hasTools = fm.includes('tools:') || fm.includes('disallowedTools:');

      record({
        name: `Frontmatter fields: ${agentFile}`,
        component: 'brain',
        input: `${agentFile} frontmatter`,
        output: `name=${hasName}, description=${hasDescription}, tools=${hasTools}`,
        expected: 'name=true, description=true, tools=true',
        verdict: hasName && hasDescription && hasTools ? PASS : WARN,
        note: !hasName ? 'missing name field' : (!hasDescription ? 'missing description' : undefined),
      });
    }

    // Check YAML Frontmatter rule (Rule 12/13)
    const hasYamlRule = content.includes('YAML frontmatter') || content.includes('YAML Frontmatter');
    if (agentFile !== 'explorer.md') { // Explorer doesn't write reports
      record({
        name: `YAML Frontmatter rule: ${agentFile}`,
        component: 'brain',
        input: agentFile,
        output: hasYamlRule ? 'present' : 'missing',
        expected: 'present',
        verdict: hasYamlRule ? PASS : WARN,
        note: 'Agents should know about YAML frontmatter for reports',
      });
    }
  }

  // ── YAML Signature Checks ──
  suite('Agent Brain Contracts — Report Signatures');

  for (const [agentFile, signatures] of Object.entries(EXPECTED_SIGNATURES)) {
    const agentPath = path.join(agentsDir, agentFile);
    if (!fs.existsSync(agentPath)) {
      record({
        name: `Signatures: ${agentFile}`,
        component: 'brain',
        input: agentFile,
        output: 'file missing',
        expected: `${signatures.length} signatures`,
        verdict: FAIL,
      });
      continue;
    }

    const content = fs.readFileSync(agentPath, 'utf8');
    const missing = signatures.filter(sig => !content.includes(sig));

    record({
      name: `Signatures: ${agentFile}`,
      component: 'brain',
      input: `${agentFile} — ${signatures.length} expected signatures`,
      output: missing.length === 0 ? 'all present' : `missing: ${missing.join(', ')}`,
      expected: 'all present',
      verdict: missing.length === 0 ? PASS : FAIL,
      note: missing.length > 0 ? `${missing.length}/${signatures.length} missing` : undefined,
    });
  }

  // ── Brain-to-brain consistency ──
  suite('Agent Brain Contracts — Consistency');

  // CLAUDE.md subagent table should list all agents in .claude/agents/
  const brainPath = path.join(installDir, 'CLAUDE.md');
  if (fs.existsSync(brainPath)) {
    const brainContent = fs.readFileSync(brainPath, 'utf8');
    for (const agentFile of agents) {
      const agentName = agentFile.replace('.md', '');
      const referenced = brainContent.includes(`.claude/agents/${agentFile}`);
      record({
        name: `CLAUDE.md references ${agentName}`,
        component: 'brain',
        input: `CLAUDE.md subagent table`,
        output: referenced ? 'referenced' : 'not referenced',
        expected: 'referenced',
        verdict: referenced ? PASS : WARN,
        note: referenced ? undefined : `${agentFile} exists in .claude/agents/ but not in CLAUDE.md`,
      });
    }
  }
}
