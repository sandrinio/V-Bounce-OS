/**
 * Suite: Parallel Stories
 * Validates that state management is correct when multiple stories
 * exist concurrently — transitions on one don't corrupt another.
 *
 * Uses sprint S-96, release ParallelTest, epic EPIC-T96.
 */

import fs from 'fs';
import path from 'path';
import { suite, record, assertScriptRuns, PASS, FAIL, WARN } from '../harness.mjs';
import { createSprintFixtures, removeSprintFixtures } from '../fixtures.mjs';

const SPRINT_ID = 'S-96';
const EPIC_ID = 'EPIC-T96';
const STORY_A = 'STORY-T96-01';
const STORY_B = 'STORY-T96-02';
const STORY_C = 'STORY-T96-03';

function readState(statePath) {
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function storyState(statePath, storyId) {
  return readState(statePath).stories?.[storyId]?.state;
}

function storyBounces(statePath, storyId) {
  const s = readState(statePath).stories?.[storyId];
  return { qa: s?.qa_bounces ?? -1, arch: s?.arch_bounces ?? -1 };
}

export default function runParallelStoriesSuite(installDir) {
  const scriptsDir = path.join(installDir, '.vbounce', 'scripts');
  const statePath = path.join(installDir, '.vbounce', 'state.json');
  const config = { sprintId: SPRINT_ID, storyIds: [STORY_A, STORY_B, STORY_C], epicId: EPIC_ID };

  // ── Setup ──
  suite('Parallel Stories — Init');

  createSprintFixtures(installDir, config);

  // 1. All 3 stories in Draft
  const state1 = readState(statePath);
  const allDraft = [STORY_A, STORY_B, STORY_C].every(id => state1.stories?.[id]?.state === 'Draft');
  record({
    name: 'init 3 stories — all Draft',
    component: 'parallel',
    input: `${STORY_A}, ${STORY_B}, ${STORY_C}`,
    output: allDraft ? 'all Draft' : JSON.stringify(Object.fromEntries(
      [STORY_A, STORY_B, STORY_C].map(id => [id, state1.stories?.[id]?.state])
    )),
    expected: 'all Draft',
    verdict: allDraft ? PASS : FAIL,
  });

  // ═══════════════════════════════════════════════════════════════════════
  suite('Parallel Stories — Independent Transitions');

  // 2. Transition A → Ready to Bounce, B stays Draft
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_A} "Ready to Bounce"`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 'A → Ready to Bounce' }
  );
  record({
    name: 'A=Ready to Bounce, B=Draft',
    component: 'parallel',
    input: `after ${STORY_A} → Ready to Bounce`,
    output: `A=${storyState(statePath, STORY_A)}, B=${storyState(statePath, STORY_B)}`,
    expected: 'A=Ready to Bounce, B=Draft',
    verdict: storyState(statePath, STORY_A) === 'Ready to Bounce' && storyState(statePath, STORY_B) === 'Draft' ? PASS : FAIL,
  });

  // 3. A → Bouncing, C stays Draft
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_A} "Bouncing"`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 'A → Bouncing' }
  );
  record({
    name: 'A=Bouncing, C=Draft',
    component: 'parallel',
    input: `after ${STORY_A} → Bouncing`,
    output: `A=${storyState(statePath, STORY_A)}, C=${storyState(statePath, STORY_C)}`,
    expected: 'A=Bouncing, C=Draft',
    verdict: storyState(statePath, STORY_A) === 'Bouncing' && storyState(statePath, STORY_C) === 'Draft' ? PASS : FAIL,
  });

  // 4. QA bounce on A, B bounce count unaffected
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_A} --qa-bounce`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 'A QA bounce' }
  );
  const b4 = storyBounces(statePath, STORY_A);
  const b4b = storyBounces(statePath, STORY_B);
  record({
    name: 'A.qa_bounces=1, B.qa_bounces=0',
    component: 'parallel',
    input: `after QA bounce on ${STORY_A}`,
    output: `A.qa=${b4.qa}, B.qa=${b4b.qa}`,
    expected: 'A.qa=1, B.qa=0',
    verdict: b4.qa === 1 && b4b.qa === 0 ? PASS : FAIL,
  });

  // 5. Transition B independently
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_B} "Ready to Bounce"`, 'parallel',
    { cwd: installDir, expectExit: 0 }
  );
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_B} "Bouncing"`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 'B → Bouncing independently' }
  );
  const b5a = storyBounces(statePath, STORY_A);
  record({
    name: 'B=Bouncing, A still Bouncing with qa=1',
    component: 'parallel',
    input: `after ${STORY_B} → Bouncing`,
    output: `B=${storyState(statePath, STORY_B)}, A=${storyState(statePath, STORY_A)} qa=${b5a.qa}`,
    expected: 'B=Bouncing, A=Bouncing qa=1',
    verdict: storyState(statePath, STORY_B) === 'Bouncing' &&
             storyState(statePath, STORY_A) === 'Bouncing' &&
             b5a.qa === 1 ? PASS : FAIL,
  });

  // 6. QA bounce on B, A bounce count unaffected
  assertScriptRuns(
    path.join(scriptsDir, 'update_state.mjs'),
    `${STORY_B} --qa-bounce`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 'B QA bounce' }
  );
  const b6a = storyBounces(statePath, STORY_A);
  const b6b = storyBounces(statePath, STORY_B);
  record({
    name: 'B.qa=1, A.qa=1 (unchanged)',
    component: 'parallel',
    input: `after QA bounce on ${STORY_B}`,
    output: `A.qa=${b6a.qa}, B.qa=${b6b.qa}`,
    expected: 'A.qa=1, B.qa=1',
    verdict: b6a.qa === 1 && b6b.qa === 1 ? PASS : FAIL,
  });

  // ═══════════════════════════════════════════════════════════════════════
  suite('Parallel Stories — Interleaved Completion');

  // 7. Complete story A, B and C unchanged
  assertScriptRuns(path.join(scriptsDir, 'update_state.mjs'), `${STORY_A} "QA Passed"`, 'parallel', { cwd: installDir, expectExit: 0 });
  assertScriptRuns(path.join(scriptsDir, 'update_state.mjs'), `${STORY_A} "Architect Passed"`, 'parallel', { cwd: installDir, expectExit: 0 });
  assertScriptRuns(
    path.join(scriptsDir, 'complete_story.mjs'),
    `${STORY_A} --qa-bounces 1 --arch-bounces 0`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 'complete A' }
  );
  record({
    name: 'A=Done, B=Bouncing, C=Draft',
    component: 'parallel',
    input: `after completing ${STORY_A}`,
    output: `A=${storyState(statePath, STORY_A)}, B=${storyState(statePath, STORY_B)}, C=${storyState(statePath, STORY_C)}`,
    expected: 'A=Done, B=Bouncing, C=Draft',
    verdict: storyState(statePath, STORY_A) === 'Done' &&
             storyState(statePath, STORY_B) === 'Bouncing' &&
             storyState(statePath, STORY_C) === 'Draft' ? PASS : FAIL,
  });

  // 8. Complete C (skip B), B still Bouncing
  assertScriptRuns(path.join(scriptsDir, 'update_state.mjs'), `${STORY_C} "Ready to Bounce"`, 'parallel', { cwd: installDir, expectExit: 0 });
  assertScriptRuns(path.join(scriptsDir, 'update_state.mjs'), `${STORY_C} "Bouncing"`, 'parallel', { cwd: installDir, expectExit: 0 });
  assertScriptRuns(path.join(scriptsDir, 'update_state.mjs'), `${STORY_C} "QA Passed"`, 'parallel', { cwd: installDir, expectExit: 0 });
  assertScriptRuns(path.join(scriptsDir, 'update_state.mjs'), `${STORY_C} "Architect Passed"`, 'parallel', { cwd: installDir, expectExit: 0 });
  assertScriptRuns(
    path.join(scriptsDir, 'complete_story.mjs'),
    `${STORY_C} --qa-bounces 0 --arch-bounces 0`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 'complete C, skip B' }
  );
  record({
    name: 'C=Done, B still Bouncing',
    component: 'parallel',
    input: `after completing ${STORY_C}`,
    output: `C=${storyState(statePath, STORY_C)}, B=${storyState(statePath, STORY_B)}`,
    expected: 'C=Done, B=Bouncing',
    verdict: storyState(statePath, STORY_C) === 'Done' &&
             storyState(statePath, STORY_B) === 'Bouncing' ? PASS : FAIL,
  });

  // ═══════════════════════════════════════════════════════════════════════
  suite('Parallel Stories — Re-init & Close');

  // 9. Re-init overwrites cleanly
  assertScriptRuns(
    path.join(scriptsDir, 'init_sprint.mjs'),
    `${SPRINT_ID} --stories STORY-NEW-01`, 'parallel',
    { cwd: installDir, expectExit: 0, note: 're-init with new story' }
  );
  const state9 = readState(statePath);
  const hasNewStory = !!state9.stories?.['STORY-NEW-01'];
  const oldStoriesGone = !state9.stories?.[STORY_A] && !state9.stories?.[STORY_B] && !state9.stories?.[STORY_C];
  record({
    name: 're-init — old stories gone, new story present',
    component: 'parallel',
    input: `init_sprint.mjs ${SPRINT_ID} --stories STORY-NEW-01`,
    output: `new=${hasNewStory}, old_gone=${oldStoriesGone}`,
    expected: 'new=true, old_gone=true',
    verdict: hasNewStory && oldStoriesGone ? PASS : FAIL,
  });

  // 10. Close sprint with mixed states (STORY-NEW-01 is Draft)
  const r10 = assertScriptRuns(
    path.join(scriptsDir, 'close_sprint.mjs'),
    SPRINT_ID, 'parallel',
    { cwd: installDir, expectExit: null, note: 'close with Draft story' }
  );
  const r10out = (r10.stdout || '') + (r10.stderr || '');
  record({
    name: 'close with non-terminal stories — warns',
    component: 'parallel',
    input: `close_sprint.mjs ${SPRINT_ID} (STORY-NEW-01=Draft)`,
    output: r10out.includes('not in a terminal state') ? 'warning present' : `exit ${r10.exitCode}`,
    expected: 'warning about non-terminal stories',
    verdict: r10out.includes('not in a terminal state') ? PASS : WARN,
  });

  // ── Cleanup ──
  removeSprintFixtures(installDir, config);
  // Also remove any leftover from re-init
  try {
    const sp = path.join(installDir, '.vbounce', 'state.json');
    if (fs.existsSync(sp)) fs.unlinkSync(sp);
  } catch { /* best effort */ }
}
