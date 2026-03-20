# Changelog

All notable changes to the V-Bounce Engine framework and its CLI installer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-03-20
### Added
- **4-Phase Process Model**: Restructured brain files from 3 phases to 4 clear phases — Planning (AI + Human), Sprint Planning (collaborative gate), The Bounce (execution), Review.
- **Sprint Planning Gate**: Sprint Plan is now mandatory. AI proposes scope, surfaces risks/blockers/edge cases, human confirms before any bounce starts. New §0 Sprint Readiness Gate in sprint template with `confirmed_by`/`confirmed_at` fields.
- **Codebase-Driven Epic & Story Creation**: Epic §4 Technical Context and story decomposition now require mandatory codebase research — no more guessing at file paths and dependencies.
- **Intelligence-Driven Story Decomposition**: Stories are created by tangible deliverable (vertical slices), not by layer category. Each story must have one clear goal, touch 1-3 files, and produce a verifiable result.
- **Environment Prerequisites**: New §3.0 in story template — env vars, services, migrations, seed data verified before coding starts.
- **E2E Testing in TDD Cycle**: Developer must write acceptance-level tests covering all Gherkin scenarios, not just unit tests. New TDD Step 4 (Verify) added.
- **Immediate Lesson Recording**: Lessons recorded to LESSONS.md right after each story merge (Step 5.5), not deferred to sprint close. Sprint Report §4 is now a review, not a first-time approval gate.
- **Test Count Tracking**: Sprint execution log and Sprint Report now track tests written per story.
- **Escalation Recovery**: Documented recovery path when stories hit 3-bounce limit — AI presents root causes, proposes options (re-scope, split, spike, remove), human decides.
- **Lesson-Driven Self-Improvement Model**: Lessons classified by phase (planning/sprint planning/execution/template gap) and by what they can become (gate check, template field, skill update, decomposition rule).

### Changed
- Brain files (CLAUDE.md, AGENTS.md, GEMINI.md) restructured with dual-role identity: planning partner during Phase 1-2, orchestrator during Phase 3.
- `doc-manager` skill auto-loads during planning phases — no longer requires `/doc` command.
- agent-team SKILL.md Step 0 simplified — risk assessment, dependency checks, and scope selection moved to Sprint Planning (Phase 2).
- agent-team SKILL.md Step 7 lesson approval changed from blocking gate to non-blocking review.
- Story template §3 sections renumbered (§3.0 Environment Prerequisites, §3.1 Test Implementation, §3.2 Context & Files, §3.3 Technical Logic, §3.4 API Contract).
- Epic template §5 Decomposition Guidance rewritten for codebase-informed vertical slicing.
- Sprint template status flow expanded: Planning → Confirmed → Active → Completed.
- Story template downstream references fixed: "Delivery Plan §5" → "Sprint Plan §1".

## [1.1.0] - 2026-03-01
### Added
- Hotfix Path for L1 Trivial tasks — bypasses Epic/Story hierarchy and QA/Architect bounce loop.
- `templates/hotfix.md` — lightweight template for 1-2 file fixes with Developer hard-stop constraint.
- `scripts/hotfix_manager.sh` — automation script with `audit`, `sync`, and `ledger` commands.
- `docs/HOTFIX_EDGE_CASES.md` — five edge cases (scope creep, silent regression, architectural drift, merge conflicts, invisible deliverables) with mitigations.
- §8 Applied Hotfixes section in `delivery_plan.md` template.
- Product Docs Affected subsection in Sprint Report §1.
- Correction Tax metric clarification (0% = autonomous, 100% = human rewrote).

### Fixed
- Hardened `hotfix_manager.sh`: git repo guard, dynamic commit lookback (no more `HEAD~5`), absolute worktree paths via `git rev-parse`, proper `--help` flag.
- Removed phantom "Sync" pseudo-state from doc-manager hotfix transitions — folded into "Done" transition.
- Clarified OVERVIEW.md hotfix path: Developer still implements (Phase 2 work), only QA/Architect gates are skipped.

### Changed
- OVERVIEW.md: Step 0 is now "Triage" (Standard vs Hotfix path), sprint lifecycle diagram updated.
- `package.json`: Added `scripts/` and `docs/` to npm `files` array.

## [1.0.1] - 2026-03-01
### Added
- Added `--version` and `-v` flags to the `npx vbounce` CLI to allow users to readily check their framework version.
- Created `CHANGELOG.md` file to track framework updates over time.

## [1.0.0] - 2026-03-01
### Added
- Initial release of the V-Bounce Engine framework.
- Packaged SDLC skills including `agent-team`, `doc-manager`, `lesson`, `react-best-practices`, `vibe-code-review`, and `write-skill`.
- Established the `product_plans/` template hierarchy (Charter, Roadmap, Epic, Story, Delivery Plan, Risk Registry).
- Created the Node.js CLI installer for targeting Claude, Cursor, Gemini, Copilot, and Codex workspaces.
- Bundled complete markdown "Brain" files for context injection.
