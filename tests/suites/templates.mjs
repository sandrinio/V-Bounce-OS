/**
 * Suite: Template & Skill Integrity
 * Verifies templates have valid structure, skills have SKILL.md,
 * and cross-references within templates/skills resolve.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, assertNoMatch, PASS, FAIL, WARN } from '../harness.mjs';

export default function runTemplatesSuite(installDir) {
  suite('Templates — Structure');

  const templatesDir = path.join(installDir, '.vbounce', 'templates');
  if (!fs.existsSync(templatesDir)) {
    record({
      name: 'Templates directory exists',
      component: 'template',
      input: templatesDir,
      output: 'missing',
      expected: 'exists',
      verdict: FAIL,
    });
    return;
  }

  const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.md'));

  record({
    name: 'Template count',
    component: 'template',
    input: templatesDir,
    output: `${templates.length} templates`,
    expected: '>= 8 templates',
    verdict: templates.length >= 8 ? PASS : FAIL,
  });

  // Each template should have <instructions> block or YAML frontmatter
  for (const t of templates) {
    const content = fs.readFileSync(path.join(templatesDir, t), 'utf8');
    const hasInstructions = content.includes('<instructions>');
    const hasFrontmatter = content.includes('---');

    record({
      name: `Template structure: ${t}`,
      component: 'template',
      input: t,
      output: `instructions=${hasInstructions}, frontmatter=${hasFrontmatter}`,
      expected: 'has instructions or frontmatter',
      verdict: hasInstructions || hasFrontmatter ? PASS : WARN,
    });
  }

  // ── Stale paths in templates ──
  suite('Templates — Path Integrity');

  for (const t of templates) {
    const tPath = path.join(templatesDir, t);
    assertNoMatch(tPath, 'brains/CHANGELOG\\.md', 'template', 'Should be .vbounce/CHANGELOG.md');
    assertNoMatch(tPath, 'brains/claude-agents/', 'template', 'Should be .claude/agents/');
  }

  // ── Skills ──
  suite('Skills — Structure');

  const skillsDir = path.join(installDir, '.vbounce', 'skills');
  if (!fs.existsSync(skillsDir)) {
    record({
      name: 'Skills directory exists',
      component: 'skill',
      input: skillsDir,
      output: 'missing',
      expected: 'exists',
      verdict: FAIL,
    });
    return;
  }

  const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const skill of skillDirs) {
    const skillMd = path.join(skillsDir, skill, 'SKILL.md');
    const exists = fs.existsSync(skillMd);

    record({
      name: `Skill SKILL.md: ${skill}`,
      component: 'skill',
      input: `${skill}/SKILL.md`,
      output: exists ? 'exists' : 'missing',
      expected: 'exists',
      verdict: exists ? PASS : FAIL,
    });

    // Check for stale paths in SKILL.md
    if (exists) {
      assertNoMatch(skillMd, 'brains/claude-agents/', 'skill', `${skill}: Should be .claude/agents/`);
      assertNoMatch(skillMd, 'brains/CHANGELOG\\.md', 'skill', `${skill}: Should be .vbounce/CHANGELOG.md`);
      assertNoMatch(skillMd, 'brains/(CLAUDE|GEMINI|AGENTS)\\.md', 'skill', `${skill}: Should be root-level files`);
    }
  }

  // ── Skills referenced in CLAUDE.md all exist ──
  suite('Skills — CLAUDE.md Cross-Reference');

  const brainPath = path.join(installDir, 'CLAUDE.md');
  if (fs.existsSync(brainPath)) {
    const brainContent = fs.readFileSync(brainPath, 'utf8');
    // Find skill names referenced in the brain
    const skillRefPattern = /\.vbounce\/skills\/([a-z\-]+)\/SKILL\.md/g;
    let match;
    const referencedSkills = new Set();
    while ((match = skillRefPattern.exec(brainContent)) !== null) {
      referencedSkills.add(match[1]);
    }

    for (const skill of referencedSkills) {
      const exists = skillDirs.includes(skill);
      record({
        name: `CLAUDE.md skill ref: ${skill}`,
        component: 'skill',
        input: `CLAUDE.md references .vbounce/skills/${skill}/SKILL.md`,
        output: exists ? 'installed' : 'not found',
        expected: 'installed',
        verdict: exists ? PASS : FAIL,
      });
    }

    // Reverse check: installed skills not referenced in CLAUDE.md
    for (const skill of skillDirs) {
      if (!referencedSkills.has(skill)) {
        record({
          name: `Unreferenced skill: ${skill}`,
          component: 'skill',
          input: `${skill} installed but not in CLAUDE.md`,
          output: 'not referenced',
          expected: 'referenced in CLAUDE.md or intentionally omitted',
          verdict: WARN,
          note: 'skill exists but CLAUDE.md does not reference it',
        });
      }
    }
  }
}
