# V-Bounce OS Improvement Plan

> Working document. Delete after all items are implemented.

---

## Source A: Sprint Data (Trends, Lessons, Reports)

### S-A1: Codebase audit before story decomposition
- **Problem:** Stories are decomposed from epic sections without understanding the actual code. Dev discovers surprises during bounce — wrong file paths, missing dependencies, unexpected patterns.
- **Fix:** Epic decomposition must include a mandatory codebase research phase. AI reads affected files, explores architecture, then drafts stories based on real code state.
- **Affects:** `skills/doc-manager/SKILL.md` (DECOMPOSE section), `templates/epic.md` (§5)
- **Status:** DONE — DECOMPOSE rewritten with 4-phase approach (Analyze & Research → Draft by Deliverable → Write with Codebase Detail → Link & Update)

### S-A2: E2E testing is too late
- **Problem:** E2E/integration tests only run during QA gate. Failures at that point cause expensive bounces back to Dev.
- **Fix:** Developer must run acceptance-level tests (from Story §2 Gherkin scenarios) as part of implementation, not just unit tests. Pre-QA gate scan should verify E2E test existence and pass status.
- **Affects:** `brains/claude-agents/developer.md` (TDD section), `scripts/pre_gate_runner.sh` (add E2E check), `templates/story.md` (§3 Implementation Guide — add E2E test expectations)
- **Status:** TODO

### S-A3: Story specs lack environment prerequisites
- **Problem:** Dev starts bouncing and hits missing env vars, unconfigured services, or unrun migrations. Wastes a full bounce cycle on setup failures.
- **Fix:** Add an "Environment Prerequisites" section to story template — required env vars, services that must be running, migrations that must be applied, seed data needed.
- **Affects:** `templates/story.md` (new §3.x section), `scripts/validate_bounce_readiness.mjs` (check prerequisites listed)
- **Status:** TODO

### S-A4: Worktree merges need automation
- **Problem:** DevOps merge steps are manual git commands. Merge conflicts, missed report archival, and forgotten worktree cleanup cause friction.
- **Fix:** Script the merge workflow — verify gates, archive reports, merge branch, run post-merge validation, remove worktree. DevOps agent calls the script instead of manual commands.
- **Affects:** `scripts/` (new merge script), `brains/claude-agents/devops.md` (reference script), `skills/agent-team/references/git-strategy.md`
- **Status:** TODO

### S-A5: Lessons recorded immediately, not at sprint close
- **Problem:** By sprint close, context is lost. Dev remembers "something was weird" but not the details. Lessons written late are vague and less useful.
- **Fix:** Dev and QA flag lessons in their reports (already have `lessons_flagged` field). Team Lead records them to LESSONS.md immediately after each story completes, not during Phase 3.
- **Affects:** `brains/CLAUDE.md` (Phase 2 — add lesson recording after DevOps merge), `skills/agent-team/SKILL.md` (bounce sequence — add step), `skills/lesson/SKILL.md` (clarify timing)
- **Status:** TODO

### S-A6: Sprint plans don't track actual test counts
- **Problem:** No visibility into whether test coverage is growing or shrinking across stories. Sprint report has metrics but sprint plan has no test tracking during execution.
- **Fix:** Add test count columns to sprint plan execution log. Dev report already has `tests_written` — propagate to sprint plan table. Pre-QA gate scan should report test delta.
- **Affects:** `templates/sprint.md` (execution log columns), `scripts/pre_gate_runner.sh` (report test count), `brains/CLAUDE.md` (sprint consolidation)
- **Status:** TODO

---

## Source B: Framework Analysis

### S-B1: Split brain into Planning Mode and Execution Mode
- **Problem:** Brain treats planning and sprint execution as one continuous process. No clear trigger for when AI should plan vs execute.
- **Fix:** Add explicit mode routing to brain. Planning Mode: AI works directly with human — creates documents, researches codebase, discusses trade-offs. No subagents. Execution Mode: AI orchestrates subagents through bounce loops. Simple routing rule based on user intent.
- **Affects:** `brains/CLAUDE.md` (major restructure of Phase 1 + Phase 2 separation), all brain files for consistency
- **Status:** TODO

### S-B2: Sprint Planning as a collaborative gate
- **Problem:** There's no defined sprint planning process. The bounce just starts. No gate where AI and human together review what goes into a sprint, surface open questions, and uncover edge cases before committing.
- **Current state:** Epics and stories sit in `backlog/`. Sprint plan exists as a template. But the transition from "stories in backlog" → "stories in sprint" has no collaborative review step.
- **Fix:** Define Sprint Planning as an explicit collaborative phase:
  1. AI reads backlog — epics, stories, their frontmatter (status, priority, ambiguity, complexity, open questions)
  2. AI reads archive — what's already done, what context carries forward
  3. AI proposes sprint scope based on priorities, dependencies, and capacity
  4. AI surfaces: open questions, unresolved ambiguity, edge cases, dependency risks, environment prerequisites
  5. Human and AI discuss, adjust scope, resolve questions
  6. AI creates the Sprint Plan document — this is **mandatory**, no sprint without it
  7. Human confirms the Sprint Plan → sprint starts (this is the gate)
  8. **Hard rule: Bounce CANNOT start without a finalized, human-confirmed Sprint Plan**
- **Affects:** `brains/CLAUDE.md` (new Sprint Planning section between Planning and Execution), `skills/doc-manager/SKILL.md` (sprint planning workflow), `templates/sprint.md` (readiness checklist)
- **Status:** TODO

### S-B3: Process complexity is collaborative, not hidden
- **Problem:** Earlier assumption was to hide ambiguity scores and complexity from the user. Wrong — these are the substance of planning conversations. The human needs to see risks, unknowns, and complexity to make informed decisions.
- **Fix:** AI presents ambiguity, complexity, open questions, and edge cases clearly during planning and sprint planning. The AI's job is to surface these well, not hide them. Use plain language but don't strip the information.
- **Affects:** `brains/CLAUDE.md` (Planning Mode behavior)
- **Status:** REVISED — merged into S-B1 and S-B2 approach. No separate item needed.

### S-B4: Reduce redundancy (single source of truth)
- **Status:** PARKED — unclear what's actionable. Revisit after Wave 1 changes settle.

### S-B5: Escalation recovery
- **Problem:** When a story hits 3 bounces → "Escalated" but then what? No documented recovery path. Human must improvise.
- **Fix:** Define escalation recovery:
  1. AI presents: what failed, root causes from bounce reports, pattern analysis
  2. AI proposes options: re-scope story, split into smaller stories, spike the blocker, remove from sprint
  3. Human decides
  4. AI executes the decision (rewrite story, create spike, update sprint plan)
- **Affects:** `skills/agent-team/SKILL.md` (escalation section), `brains/CLAUDE.md` (escalation behavior)
- **Status:** TODO

---

## Source C: Skills & Scripts Audit

### S-C1: agent-team SKILL.md not aligned with 4-phase model
- **Problem:** agent-team still uses "Pre-Bounce Checks" terminology and doesn't reference Sprint Planning gate or immediate lesson recording. Step 0 describes work now split across Phase 1 and Phase 2.
- **Fix:** Update agent-team SKILL.md:
  - Rename "Pre-Bounce Checks" references to align with Phase 2 (Sprint Planning) and Phase 3 (Execution)
  - Add reference to Sprint Planning gate (Phase 2 must complete before Step 1)
  - Add lesson recording step after DevOps merge (Step 9 in brain)
  - Add escalation recovery subsection
- **Affects:** `skills/agent-team/SKILL.md`
- **Status:** TODO

### S-C2: lesson/SKILL.md timing mismatch
- **Problem:** Lesson recording is treated as a blocking step at sprint close (agent-team Step 7). By then context is lost. This overlaps with S-A5 but the skill itself needs updating.
- **Fix:** Update lesson/SKILL.md to clarify: agents flag lessons in reports → Team Lead records to LESSONS.md immediately after story merge → human reviews at sprint close (non-blocking).
- **Affects:** `skills/lesson/SKILL.md`
- **Status:** TODO (implement with S-A5)

### S-C3: Pre-gate checks and context packs are manual
- **Problem:** prep_qa_context.mjs, prep_arch_context.mjs, and pre_gate_runner.sh are all manually invoked. Agents forget to run them, wasting bounce cycles.
- **Fix:** Context pack scripts should auto-include pre-gate results. When Team Lead prepares QA context, pre_gate_runner.sh qa runs automatically. Same for Architect.
- **Affects:** `scripts/prep_qa_context.mjs`, `scripts/prep_arch_context.mjs`
- **Status:** TODO

### S-C4: close_sprint.mjs has 6 manual final steps
- **Problem:** After close_sprint.mjs runs, it prints 6 steps the user must do manually: archive folder, update Delivery Plan, delete sprint branch, etc.
- **Fix:** Add `--auto` flag to close_sprint.mjs that handles: archive sprint folder, update Delivery Plan tables, clean up sprint branch.
- **Affects:** `scripts/close_sprint.mjs`
- **Status:** TODO

### S-C5: No report naming for escalation
- **Problem:** report-naming.md doesn't mention escalation report naming convention.
- **Fix:** Add escalation report naming: `STORY-{ID}-escalation.md`
- **Affects:** `skills/agent-team/references/report-naming.md`
- **Status:** TODO

---

## Source D: End-to-End Self-Improvement

The current improvement pipeline (`sprint_trends.mjs` → `post_sprint_improve.mjs` → `suggest_improvements.mjs` → `/improve`) only runs at sprint close and only analyzes execution data. The full process — planning, sprint planning, execution, review — should feed back into itself.

**LESSONS.md is the primary signal.** Metrics (bounces, correction tax) tell you *that* something went wrong. Lessons tell you *what* and *why*. Every improvement should trace back to a lesson or a pattern of lessons.

### Lesson-Driven Improvement Model

```
Lesson recorded ("spec didn't match codebase")
    │
    ├─ Classify: what kind of problem?
    │   ├─ Planning problem → improve decomposition / epic process
    │   ├─ Sprint planning problem → improve scope selection / risk surfacing
    │   ├─ Execution problem → improve gate checks / agent behavior
    │   └─ Template problem → evolve the template
    │
    ├─ What can it become?
    │   ├─ Gate check (automated grep/lint pattern)
    │   ├─ Template field (structural addition)
    │   ├─ Skill update (behavioral change)
    │   ├─ Decomposition rule (doc-manager DECOMPOSE)
    │   └─ Sprint planning heuristic (scope/risk prediction)
    │
    └─ Track: did the change help?
        ├─ Same lesson recurs → change didn't work, revise
        └─ Lesson stops recurring → change worked, graduate to permanent
```

### S-D1: Planning accuracy tracking (lesson-driven)
- **Problem:** After a sprint, nobody checks: were the stories decomposed well? The improvement pipeline doesn't look at planning quality.
- **Primary signals:**
  - **Lessons** where root cause is planning: "spec didn't match code", "scope was too broad", "missed dependency", "story needed re-scoping"
  - Dev reports: `lessons_flagged` entries that reference spec gaps or codebase surprises
  - Stories that moved to Escalated or Parking Lot (count + reasons)
- **Fix:** At sprint close, the Sprint Report includes a **Planning Accuracy** section:
  - Classify lessons by phase (planning vs execution)
  - Stories delivered as-planned vs re-scoped vs escalated vs parked
  - For each planning-attributed lesson: propose a specific improvement (e.g., "lesson: spec didn't match codebase in 2 stories → improve doc-manager DECOMPOSE codebase research depth")
  - Feed into `post_sprint_improve.mjs` for automated classification
- **Affects:** `templates/sprint_report.md`, `scripts/post_sprint_improve.mjs`, `skills/improve/SKILL.md`
- **Status:** TODO

### S-D2: Sprint planning accuracy tracking (lesson-driven)
- **Problem:** Sprint Planning proposes scope, flags risks, identifies dependencies. Nobody checks if predictions were right.
- **Primary signals:**
  - **Lessons** where root cause is sprint planning: "underestimated complexity", "dependency wasn't identified", "risk we didn't flag blocked us"
  - Sprint Plan §1-§3 (what we planned) vs §4 Execution Log (what happened)
  - Stories discovered mid-sprint that should have been in scope
- **Fix:** At sprint close, compare plan vs reality:
  - Planned scope vs actual delivery (completion rate)
  - Flagged risks vs actual blockers (prediction accuracy)
  - Open questions found during sprint that should have been surfaced during planning
  - For each sprint-planning-attributed lesson: propose a heuristic improvement (e.g., "lesson: dependency not identified → add file-overlap check to Sprint Planning workflow")
- **Affects:** `templates/sprint_report.md`, `scripts/post_sprint_improve.mjs`, `skills/improve/SKILL.md`
- **Status:** TODO

### S-D3: Template evolution from lesson patterns
- **Problem:** When the same type of lesson recurs across 3+ stories, it signals a template gap. Templates evolve only when a human notices.
- **Primary signals:**
  - **Recurring lessons** with the same theme (e.g., 3 stories with "missing env vars" → template needs env prerequisites field)
  - Lessons classified as "Template field" by the improvement pipeline
  - Sections consistently left empty in archived stories (template bloat)
  - Fields manually added to stories that don't exist in the template
- **Fix:** `post_sprint_improve.mjs` classifies lessons and scans archived stories:
  - Group lessons by theme across sprints
  - If same theme appears 3+ times → propose template change
  - If template section is empty in >50% of archived stories → propose removal
  - Generate concrete template change proposals (add field X to story.md §3, remove unused field Y)
- **Affects:** `scripts/post_sprint_improve.mjs`, `skills/improve/SKILL.md`
- **Status:** TODO

### S-D4: Mid-sprint P0 feedback (lesson-triggered)
- **Problem:** P0 issues discovered mid-sprint wait until sprint close. By then the same problem causes repeated bounces.
- **Primary signals:**
  - **Same root_cause tag** appearing 2+ times in the same sprint's bounce reports
  - **High-severity lesson** flagged by an agent with explicit urgency
  - **Same lesson** recorded for 2+ stories in the same sprint
- **Fix:** During execution, Team Lead watches for:
  - Duplicate root_cause tags → surface to human: "Same issue hit 2 stories. Apply process fix now?"
  - If human approves → apply fix mid-sprint (update gate config, template, or skill)
  - Log the mid-sprint fix in Sprint Report §5
  - Do NOT wait for sprint close for P0 issues
- **Affects:** `brains/CLAUDE.md` (Phase 3), `skills/agent-team/SKILL.md`, `skills/improve/SKILL.md`
- **Status:** TODO

### S-D5: Improvement effectiveness tracking (lesson-based)
- **Problem:** The pipeline checks if improvements resolved their target findings, but only for execution. Planning and template improvements aren't tracked.
- **Primary signals:**
  - **Lesson recurrence:** If a lesson that triggered an improvement reappears, the improvement didn't work
  - **Lesson absence:** If a lesson stops recurring after an improvement, it worked
  - **Template field usage:** If a new template field is filled in >80% of stories, it's valuable. If <30%, it's bloat.
- **Fix:** Extend effectiveness tracking:
  - For each applied improvement, track: which lesson(s) triggered it? Has that lesson recurred?
  - If improvement didn't help after 2 sprints → flag for removal or revision
  - If improvement resolved the lesson → graduate the improvement to permanent (and remove the original lesson from active LESSONS.md)
  - This closes the loop: lesson → improvement → lesson stops → improvement is permanent
- **Affects:** `scripts/post_sprint_improve.mjs`, `scripts/sprint_trends.mjs`
- **Status:** TODO

---

## Implementation Order

### Wave 1: Planning & Sprint Planning (user-facing impact) — DONE
1. S-B1 — Split brain modes (Planning vs Execution) ✅
2. S-B2 — Sprint Planning as collaborative gate ✅

### Wave 2: Sprint Quality (from real data + skill alignment) — DONE
3. S-A2 — E2E testing earlier ✅
4. S-A3 — Environment prerequisites in stories ✅
5. S-A5 + S-C2 — Immediate lesson recording (brain + lesson skill + agent-team) ✅
6. S-A6 — Test count tracking in sprint plans ✅
7. S-C1 — agent-team SKILL.md alignment with 4-phase model ✅

### Wave 3: Automation & Polish
8. S-A4 — Worktree merge automation
9. S-C3 — Auto-run pre-gate checks and context packs
10. S-C4 — Auto-complete sprint close steps
11. S-C5 — Escalation report naming

### Wave 4: End-to-End Self-Improvement
12. S-D1 — Planning accuracy tracking (sprint report + improve pipeline)
13. S-D2 — Sprint planning accuracy tracking (plan vs reality comparison)
14. S-D3 — Template evolution from patterns (auto-detect recurring additions)
15. S-D4 — Mid-sprint P0 feedback escalation (don't wait for sprint close)
16. S-D5 — Improvement effectiveness across all phases (not just execution)

### Parked
- S-B4 — Reduce redundancy (revisit after Wave 2)

### Already Done
- S-A1 — Codebase audit before story AND epic creation
- S-A2 — E2E testing earlier (developer.md + story.md + Definition of Done)
- S-A3 — Environment prerequisites in stories (story.md §3.0)
- S-A5 + S-C2 — Immediate lesson recording (lesson SKILL.md + agent-team Step 5.5 + Sprint Report §4)
- S-A6 — Test count tracking (sprint.md execution log + sprint_report.md metrics)
- S-B1 — Split brain into Planning Mode and Execution Mode
- S-B2 — Sprint Planning as collaborative gate (mandatory sprint plan + human confirmation)
- S-B3 — Merged into S-B1/S-B2 (process complexity is collaborative, not hidden)
- S-B5 — Escalation recovery (added to all brain files)
- S-C1 — agent-team aligned with 4-phase model (Step 0 references Sprint Planning gate)

---

## Execution Workflow

For each wave, follow this sequence:

### 1. Implement
- Make all code/doc changes for the wave's items
- Update affected files as listed in each item's "Affects" section
- Mark items as DONE in this plan

### 2. Test
- **Process coherence check**: Read the full brain file (CLAUDE.md) end-to-end after changes. Verify the flow makes sense as a whole — no contradictions, no orphaned references, no missing links.
- **Cross-file consistency**: For every file changed, grep for references to it in other files. Verify references still point to correct sections/concepts.
- **Template validation**: Run `node scripts/doctor.mjs` to verify framework structure integrity.
- **Dry-run walkthrough**: Simulate a user conversation through the changed process:
  - Wave 1: "Plan a feature" → epic → stories → sprint planning → sprint start confirmation
  - Wave 2: Dev bounce → QA gate → lesson recording → test tracking
  - Wave 3: Merge automation → escalation recovery
  - At each step, verify: does the brain tell the AI what to do? Are skills referenced correctly? Are templates complete?
- **Regression check**: Verify unchanged processes (hotfix path, Phase 3 review, self-improvement pipeline) still work with the new structure.

### 3. Finalize
- Update `CHANGELOG.md` with new version entry (follow Keep a Changelog format)
- Update `README.md` to reflect process changes (Planning section, Sprint flow, Roles)
- Bump version in `package.json`
- Delete this `IMPROVEMENT_PLAN.md` file

### 4. Ship
- Stage all changed files
- Commit with descriptive message following repo convention (`feat:` prefix)
- Push to git
