/**
 * Suite: Agent Error Paths
 * Validates that scripts called in the wrong order, wrong state, or with
 * wrong arguments produce actionable errors — not raw Node.js crashes.
 *
 * Uses sprint S-98, delivery D-98, epic EPIC-T98.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, assertScriptRuns, PASS, FAIL, WARN } from '../harness.mjs';
import { createSprintFixtures, createSyntheticReport, removeSprintFixtures } from '../fixtures.mjs';

const SPRINT_ID = 'S-98';
const DELIVERY_ID = 'D-98';
const EPIC_ID = 'EPIC-T98';
const STORY_A = 'STORY-T98-01';
const STORY_B = 'STORY-T98-02';

function hasActionableError(result) {
  const combined = (result.stdout || '') + (result.stderr || '');
  const hasStackTrace = /^\s+at\s/m.test(combined) ||
    /SyntaxError/.test(combined) ||
    /ReferenceError/.test(combined) ||
    /TypeError:.*is not/.test(combined);
  const hasGuidance = /ERROR:|Usage:|Fix:|Valid states:|Known stories:|must match|not found/i.test(combined);
  return { hasStackTrace, hasGuidance };
}

function checkActionable(result, name, component) {
  const { hasStackTrace, hasGuidance } = hasActionableError(result);
  if (hasStackTrace) {
    record({
      name: `${name} — no raw stack trace`,
      component,
      input: name,
      output: 'raw stack trace in output',
      expected: 'actionable error message',
      verdict: FAIL,
    });
  }
  if (!hasGuidance && result.exitCode !== 0) {
    record({
      name: `${name} — has guidance`,
      component,
      input: name,
      output: 'no guidance keywords found',
      expected: 'ERROR:/Usage:/Fix:/Valid states: in output',
      verdict: WARN,
      note: `stderr: ${(result.stderr || '').slice(0, 100)}`,
    });
  }
}

export default function runAgentErrorsSuite(installDir) {
  const scriptsDir = path.join(installDir, '.vbounce', 'scripts');
  const config = { sprintId: SPRINT_ID, deliveryId: DELIVERY_ID, storyIds: [STORY_A, STORY_B], epicId: EPIC_ID };

  // ── Setup ──
  createSprintFixtures(installDir, config);
  // Create dev report only for STORY_A (not B — tests missing report)
  createSyntheticReport(installDir, STORY_A, 'dev', SPRINT_ID);

  // ═══════════════════════════════════════════════════════════════════════
  // OUT-OF-ORDER CALLS
  // ═══════════════════════════════════════════════════════════════════════
  suite('Agent Errors — Out of Order');

  // 1. complete_story on Draft story (hasn't gone through QA/Arch)
  const r1 = assertScriptRuns(
    path.join(scriptsDir, 'complete_story.mjs'),
    STORY_A, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'complete_story on Draft story' }
  );
  // complete_story sets state to Done regardless — record behavior
  record({
    name: 'complete_story on Draft — no crash',
    component: 'agent-error',
    input: `complete_story.mjs ${STORY_A} (state=Draft)`,
    output: `exit ${r1.exitCode}`,
    expected: 'no crash',
    verdict: r1.exitCode <= 1 ? PASS : FAIL,
    note: r1.exitCode === 0 ? 'script allows completing from any state (no state machine enforcement)' : undefined,
  });

  // Reset story back to Draft for remaining tests
  const statePath = path.join(installDir, '.vbounce', 'state.json');
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (state.stories[STORY_A]) {
      state.stories[STORY_A].state = 'Draft';
      state.stories[STORY_A].worktree = null;
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    }
  }

  // 2. close_sprint with active stories (all Draft)
  const r2 = assertScriptRuns(
    path.join(scriptsDir, 'close_sprint.mjs'),
    SPRINT_ID, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'close_sprint with active stories' }
  );
  const r2out = (r2.stdout || '') + (r2.stderr || '');
  record({
    name: 'close_sprint warns about non-terminal stories',
    component: 'agent-error',
    input: `close_sprint.mjs ${SPRINT_ID} (stories still Draft)`,
    output: r2out.includes('not in a terminal state') ? 'warning present' : 'no warning',
    expected: 'warning about non-terminal stories',
    verdict: r2out.includes('not in a terminal state') ? PASS : WARN,
  });

  // Re-create state after close_sprint may have mutated it
  createSprintFixtures(installDir, config);

  // 3. prep_qa_context before dev report exists (for STORY_B)
  const r3 = assertScriptRuns(
    path.join(scriptsDir, 'prep_qa_context.mjs'),
    STORY_B, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'prep_qa_context with no dev report' }
  );
  record({
    name: 'prep_qa_context fails without dev report',
    component: 'agent-error',
    input: `prep_qa_context.mjs ${STORY_B} (no dev report)`,
    output: `exit ${r3.exitCode}`,
    expected: 'non-zero exit',
    verdict: r3.exitCode !== 0 ? PASS : WARN,
    note: r3.exitCode === 0 ? 'script succeeded without dev report — unexpected' : undefined,
  });
  checkActionable(r3, 'prep_qa_context missing dev report', 'agent-error');

  // 4. prep_arch_context without QA report (dev report exists for STORY_A)
  const r4 = assertScriptRuns(
    path.join(scriptsDir, 'prep_arch_context.mjs'),
    STORY_A, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'prep_arch_context without QA report' }
  );
  const r4out = (r4.stdout || '') + (r4.stderr || '');
  record({
    name: 'prep_arch_context warns about missing QA report',
    component: 'agent-error',
    input: `prep_arch_context.mjs ${STORY_A} (no QA report)`,
    output: r4out.toLowerCase().includes('qa report not found') ? 'warning present' : `exit ${r4.exitCode}`,
    expected: 'warning or graceful handling',
    verdict: r4.exitCode <= 1 ? PASS : FAIL,
  });

  // 5. validate_bounce_readiness on Done story
  // First mark story as Done
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_A} "Done"`, 'agent-error',
    { cwd: installDir, expectExit: null }
  );
  const r5 = assertScriptRuns(
    path.join(scriptsDir, 'validate_bounce_readiness.mjs'),
    STORY_A, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'readiness check on Done story' }
  );
  record({
    name: 'validate_bounce_readiness rejects Done story',
    component: 'agent-error',
    input: `validate_bounce_readiness.mjs ${STORY_A} (state=Done)`,
    output: `exit ${r5.exitCode}`,
    expected: 'non-zero (wrong state)',
    verdict: r5.exitCode !== 0 ? PASS : WARN,
  });

  // Reset back to Draft
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (state.stories[STORY_A]) {
      state.stories[STORY_A].state = 'Draft';
      state.stories[STORY_A].worktree = null;
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    }
  }

  // 6. complete_story on already-Done story (idempotent?)
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_A} "Done"`, 'agent-error',
    { cwd: installDir, expectExit: null }
  );
  const r6 = assertScriptRuns(
    path.join(scriptsDir, 'complete_story.mjs'),
    `${STORY_A} --qa-bounces 0 --arch-bounces 0`, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'complete_story on already-Done story' }
  );
  record({
    name: 'complete_story on Done story — no crash',
    component: 'agent-error',
    input: `complete_story.mjs ${STORY_A} (already Done)`,
    output: `exit ${r6.exitCode}`,
    expected: 'no crash (idempotent or error)',
    verdict: r6.exitCode <= 1 ? PASS : FAIL,
  });

  // 7. QA bounce on Draft story
  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    if (state.stories[STORY_B]) {
      state.stories[STORY_B].state = 'Draft';
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    }
  }
  const r7 = assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_B} --qa-bounce`, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'QA bounce on Draft story' }
  );
  record({
    name: 'QA bounce on Draft story — no crash',
    component: 'agent-error',
    input: `update_state.mjs ${STORY_B} --qa-bounce (state=Draft)`,
    output: `exit ${r7.exitCode}`,
    expected: 'no crash',
    verdict: r7.exitCode <= 1 ? PASS : FAIL,
    note: r7.exitCode === 0 ? 'script allows bounce increment regardless of state' : undefined,
  });

  // ═══════════════════════════════════════════════════════════════════════
  // WRONG / MISSING ARGS
  // ═══════════════════════════════════════════════════════════════════════
  suite('Agent Errors — Wrong/Missing Args');

  // 8. Empty string story ID
  const r8 = assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    '"" "Bouncing"', 'agent-error',
    { cwd: installDir, expectExit: null, note: 'empty string story ID' }
  );
  record({
    name: 'update_state with empty story ID',
    component: 'agent-error',
    input: 'update_state.mjs "" "Bouncing"',
    output: `exit ${r8.exitCode}`,
    expected: 'non-zero exit',
    verdict: r8.exitCode !== 0 ? PASS : WARN,
    note: r8.exitCode === 0 ? 'empty string accepted — may need validation' : undefined,
  });
  checkActionable(r8, 'empty story ID', 'agent-error');

  // 9. Args reversed
  const r9 = assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `"Bouncing" ${STORY_A}`, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'args reversed' }
  );
  record({
    name: 'update_state with reversed args',
    component: 'agent-error',
    input: `update_state.mjs "Bouncing" ${STORY_A}`,
    output: `exit ${r9.exitCode}`,
    expected: 'non-zero exit',
    verdict: r9.exitCode !== 0 ? PASS : WARN,
  });

  // 10. Extra junk args
  const r10 = assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_B} "Bouncing" --extra --junk`, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'extra arguments' }
  );
  record({
    name: 'update_state with extra args — no crash',
    component: 'agent-error',
    input: `update_state.mjs ${STORY_B} "Bouncing" --extra --junk`,
    output: `exit ${r10.exitCode}`,
    expected: 'no crash',
    verdict: r10.exitCode <= 1 ? PASS : FAIL,
  });

  // 11-16. No args for various scripts
  const noArgScripts = [
    ['update_state.mjs', 'update_state no args'],
    ['complete_story.mjs', 'complete_story no args'],
    ['close_sprint.mjs', 'close_sprint no args'],
    ['prep_qa_context.mjs', 'prep_qa_context no args'],
    ['prep_arch_context.mjs', 'prep_arch_context no args'],
    ['validate_bounce_readiness.mjs', 'validate_bounce_readiness no args'],
  ];

  for (const [script, testName] of noArgScripts) {
    const r = assertScriptRuns(
      path.join(scriptsDir, script),
      '', 'agent-error',
      { cwd: installDir, expectExit: 1, note: testName }
    );
    const rout = (r.stdout || '') + (r.stderr || '');
    record({
      name: `${testName} — shows usage`,
      component: 'agent-error',
      input: `${script} (no args)`,
      output: rout.includes('Usage') ? 'usage shown' : 'no usage info',
      expected: 'Usage: line in output',
      verdict: rout.includes('Usage') ? PASS : WARN,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INVALID VALUES
  // ═══════════════════════════════════════════════════════════════════════
  suite('Agent Errors — Invalid Values');

  // 17. Nonexistent story
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    'STORY-GHOST "Bouncing"', 'agent-error',
    { cwd: installDir, expectExit: 1, note: 'nonexistent story' }
  );

  // 18. Invalid state name
  const r18 = assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_B} "NotARealState"`, 'agent-error',
    { cwd: installDir, expectExit: 1, note: 'invalid state name' }
  );
  const r18out = (r18.stdout || '') + (r18.stderr || '');
  record({
    name: 'invalid state — lists valid states',
    component: 'agent-error',
    input: `update_state.mjs ${STORY_B} "NotARealState"`,
    output: r18out.includes('Valid states') ? 'valid states listed' : 'no list',
    expected: 'lists valid states',
    verdict: r18out.includes('Valid states') ? PASS : WARN,
  });

  // 19. close_sprint wrong format
  assertScriptRuns(
    path.join(scriptsDir, 'close_sprint.mjs'),
    'BADFORMAT', 'agent-error',
    { cwd: installDir, expectExit: 1, note: 'wrong sprint ID format' }
  );

  // 20. close_sprint mismatched ID
  assertScriptRuns(
    path.join(scriptsDir, 'close_sprint.mjs'),
    'S-01', 'agent-error',
    { cwd: installDir, expectExit: 1, note: 'mismatched sprint ID' }
  );

  // 21. validate_bounce_readiness nonexistent story
  assertScriptRuns(
    path.join(scriptsDir, 'validate_bounce_readiness.mjs'),
    'STORY-GHOST', 'agent-error',
    { cwd: installDir, expectExit: 1, note: 'nonexistent story' }
  );

  // 22. init_sprint bad sprint format
  assertScriptRuns(
    path.join(scriptsDir, 'init_sprint.mjs'),
    'BADFORMAT D-98', 'agent-error',
    { cwd: installDir, expectExit: 1, note: 'bad sprint ID format' }
  );

  // 23. init_sprint bad delivery format
  assertScriptRuns(
    path.join(scriptsDir, 'init_sprint.mjs'),
    'S-98 BADFORMAT', 'agent-error',
    { cwd: installDir, expectExit: 1, note: 'bad delivery ID format' }
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RE-INIT BEHAVIOR
  // ═══════════════════════════════════════════════════════════════════════
  suite('Agent Errors — Re-init Behavior');

  // 24. Re-init when state.json already exists
  const r24 = assertScriptRuns(
    path.join(scriptsDir, 'init_sprint.mjs'),
    `${SPRINT_ID} ${DELIVERY_ID} --stories ${STORY_A}`, 'agent-error',
    { cwd: installDir, expectExit: 0, note: 'init when state exists (overwrite)' }
  );
  const r24out = (r24.stdout || '') + (r24.stderr || '');
  record({
    name: 'init_sprint warns about existing state.json',
    component: 'agent-error',
    input: 'init_sprint.mjs (state already exists)',
    output: r24out.includes('already exists') ? 'warning present' : 'no warning',
    expected: 'warning about overwrite',
    verdict: r24out.includes('already exists') ? PASS : WARN,
  });

  // 25. Skip transition: Draft → QA Passed directly
  const r25 = assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_A} "QA Passed"`, 'agent-error',
    { cwd: installDir, expectExit: null, note: 'Draft → QA Passed (skipping Bouncing)' }
  );
  record({
    name: 'Draft → QA Passed skip — behavior recorded',
    component: 'agent-error',
    input: `update_state.mjs ${STORY_A} "QA Passed" (from Draft)`,
    output: `exit ${r25.exitCode}`,
    expected: 'documents behavior (no state machine enforcement)',
    verdict: PASS,
    note: r25.exitCode === 0
      ? 'no state machine enforcement — skipping transitions is allowed'
      : 'script rejected the transition',
  });

  // ── Cleanup ──
  removeSprintFixtures(installDir, config);
}
