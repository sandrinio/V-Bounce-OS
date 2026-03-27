#!/usr/bin/env node

/**
 * prefill_report.mjs
 * Pre-generates YAML frontmatter for agent reports with known fields.
 * Reduces formatting errors by pre-filling deterministic fields from state.json.
 *
 * Usage:
 *   ./.vbounce/scripts/prefill_report.mjs <STORY-ID> <agent-type>
 *   Agent types: dev, qa, arch, devops
 *
 * Output: .vbounce/reports/STORY-{ID}-{agent}.md with pre-filled YAML frontmatter
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const VALID_AGENTS = ['dev', 'qa', 'arch', 'devops'];

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: prefill_report.mjs <STORY-ID> <agent-type>');
  console.error(`Agent types: ${VALID_AGENTS.join(', ')}`);
  process.exit(1);
}

const storyId = args[0];
const agentType = args[1];

if (!VALID_AGENTS.includes(agentType)) {
  console.error(`ERROR: Invalid agent type "${agentType}". Must be one of: ${VALID_AGENTS.join(', ')}`);
  process.exit(1);
}

// Read state.json
const stateFile = path.join(ROOT, '.vbounce', 'state.json');
if (!fs.existsSync(stateFile)) {
  console.error('ERROR: .vbounce/state.json not found.');
  console.error('Fix: Run vbounce sprint init S-XX <release-name> --stories STORY-IDS');
  process.exit(1);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
} catch (e) {
  console.error(`ERROR: state.json is not valid JSON — ${e.message}`);
  console.error('Fix: Run validate_state.mjs to diagnose');
  process.exit(1);
}

const sprintId = state.sprint_id;
const story = state.stories?.[storyId];

if (!story) {
  console.error(`ERROR: Story "${storyId}" not found in state.json.`);
  console.error(`Available stories: ${Object.keys(state.stories || {}).join(', ') || 'none'}`);
  process.exit(1);
}

// Build frontmatter based on agent type
function buildFrontmatter() {
  switch (agentType) {
    case 'dev':
      return {
        status: null,
        story_id: storyId,
        sprint_id: sprintId,
        correction_tax: null,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        tokens_used: null,
        tests_written: null,
        files_modified: [],
        lessons_flagged: null,
      };
    case 'qa':
      return {
        status: null,
        story_id: storyId,
        sprint_id: sprintId,
        bounce_count: story.qa_bounces || 0,
        bugs_found: null,
        gold_plating_detected: null,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        tokens_used: null,
      };
    case 'arch':
      return {
        status: null,
        story_id: storyId,
        sprint_id: sprintId,
        bounce_count: story.arch_bounces || 0,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        tokens_used: null,
      };
    case 'devops':
      return {
        type: null,
        status: null,
        story_id: storyId,
        sprint_id: sprintId,
        input_tokens: null,
        output_tokens: null,
        total_tokens: null,
        tokens_used: null,
      };
  }
}

// Build markdown body
function buildBody() {
  const agentNames = { dev: 'Developer', qa: 'QA Validation', arch: 'Architectural Audit', devops: 'DevOps' };
  const agentName = agentNames[agentType];

  const sections = {
    dev: `# Developer Implementation Report: ${storyId}

## Files Modified
- \`path/to/file\` — AGENT_FILL: describe changes

## Logic Summary
AGENT_FILL: describe what was built and key decisions

## Correction Tax
AGENT_FILL: % human intervention needed

## Lessons Flagged
AGENT_FILL: gotchas and multi-attempt fixes

## Process Feedback
> Optional. Note friction with the V-Bounce framework itself.

- AGENT_FILL or "None"
`,
    qa: `# QA Validation Report: ${storyId}

## Quick Scan Results
AGENT_FILL: structural health check findings

## Acceptance Criteria
AGENT_FILL: scenario pass/fail results

## Scrutiny Log
AGENT_FILL: hardest scenario tested and result

## Process Feedback
> Optional. Note friction with the V-Bounce framework itself.

- AGENT_FILL or "None"
`,
    arch: `# Architectural Audit Report: ${storyId}

## Safe Zone Compliance
AGENT_FILL: score and assessment

## ADR Compliance
AGENT_FILL: per-ADR compliance check

## Deep Audit — 6 Dimensions
| Dimension | Score | Finding |
|-----------|-------|---------|
| Architectural Consistency | AGENT_FILL | AGENT_FILL |
| Error Handling | AGENT_FILL | AGENT_FILL |
| Data Flow | AGENT_FILL | AGENT_FILL |
| Duplication | AGENT_FILL | AGENT_FILL |
| Test Quality | AGENT_FILL | AGENT_FILL |
| Coupling | AGENT_FILL | AGENT_FILL |

## Process Feedback
> Optional. Note friction with the V-Bounce framework itself.

- AGENT_FILL or "None"
`,
    devops: `# DevOps Report: ${storyId}

## Merge Summary
AGENT_FILL: merge details and conflicts

## Post-Merge Validation
AGENT_FILL: test/build/lint results

## Process Feedback
> Optional. Note friction with the V-Bounce framework itself.

- AGENT_FILL or "None"
`,
  };

  return sections[agentType];
}

// Generate the report
const frontmatter = buildFrontmatter();

// Serialize YAML — null values become "# AGENT_FILL" comments
let yamlStr = yaml.dump(frontmatter, { lineWidth: -1, noRefs: true });

// Replace null values with AGENT_FILL marker
yamlStr = yamlStr.replace(/: null$/gm, ': # AGENT_FILL');

const body = buildBody();
const output = `---\n${yamlStr}---\n\n${body}`;

// Write to reports directory
const reportsDir = path.join(ROOT, '.vbounce', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const reportPath = path.join(reportsDir, `${storyId}-${agentType}.md`);
fs.writeFileSync(reportPath, output);

console.log(`✓ Pre-filled ${agentType.toUpperCase()} report: .vbounce/reports/${storyId}-${agentType}.md`);
console.log(`  Pre-filled: story_id, sprint_id${agentType === 'qa' ? ', bounce_count' : ''}${agentType === 'arch' ? ', bounce_count' : ''}`);
console.log(`  Agent fills: fields marked with # AGENT_FILL`);
