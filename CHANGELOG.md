# Changelog

All notable changes to the V-Bounce Engine framework and its CLI installer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.7.0] - 2026-03-28

### Added
- **Test Pattern Validation Gate (Step 2c)** — Team Lead now validates Red Phase test output before spawning the Green Phase Developer. Checks mock setup, import patterns, framework compatibility, and assertion quality. Team Lead fixes test pattern issues directly — the Developer is never allowed to modify Red Phase tests. Prevents the Green Phase Developer from subtly weakening tests to ease implementation.
- **Green Phase Circuit Breaker** — Developer MUST stop after ~50 tool calls with no progress during Green Phase and write a Blockers Report (`*-dev-blockers.md`) instead of continuing to spin. Report categorizes the blocker (test pattern issue, spec gap, or environment issue) so the Team Lead can diagnose and fix. Three circuit breaker triggers on the same story → Escalation.
- **Blockers Report template** — New report type in developer agent config with YAML frontmatter (`status: "blocked"`, `blocker_category`), structured sections for attempted approaches, root cause diagnosis, and suggested fixes.

### Changed
- **Developer agent Green Phase rules** — Test file modification now absolutely prohibited (was "unless there's a genuine bug in the test"). Framework incompatibilities are the Team Lead's responsibility to fix between Red and Green phases.
- **Agent-team orchestration steps renumbered** — Step 2c (was Green Phase) → Step 2d. Step 2d (was Single-Pass) → Step 2e. New Step 2c (Test Pattern Validation) and Step 2f (Circuit Breaker Handling) added.

## [2.6.1] - 2026-03-27
### Added
- **`vbounce update`** — New CLI command that checks installed version against npm latest and shows upgrade instructions.
- **Version check in `vbounce doctor`** — Doctor health check now includes version comparison as part of its output.
- **`check_update.mjs`** — New script with `--json` and `--quiet` modes for programmatic version checking.

## [2.6.0] - 2026-03-27

### Added
- **Architect Sprint Design Review** — Architect now participates in Phase 2 sprint planning. Reviews candidate stories' §3 Implementation Guides against ADRs, identifies shared file surfaces, and writes Sprint Plan §2 Execution Strategy directly.
- **TDD Multi-Pass Enforcement** — Team Lead mechanically enforces Red-Green-Refactor by spawning Developer twice: Red phase (tests only) → verify failure → Green phase (implementation). Stories declare TDD applicability in §2.
- **Report Frontmatter Pre-Fill** — New `prefill_report.mjs` script pre-generates YAML frontmatter for agent reports with known fields from state.json. Agents only fill judgment fields.
- **Explorer integration** — Architect Sprint Design Review consumes Explorer `sprint-design-review` context pack (EPIC-001 soft dependency, with direct codebase read as fallback).

### Removed
- **Delivery Plan template** — `templates/delivery_plan.md` deleted. The Delivery Plan duplicated content already in the Roadmap (§2 Release Plan, §7 Delivery Log) and Sprint Plan (§1 Active Scope), adding a tracking layer without unique decision-making value.

### Changed
- **`delivery_id` removed** — Release context derived from Roadmap via sprint plan. `init_sprint.mjs` simplified to `S-XX --stories`.
- **`LESSONS.md` → `FLASHCARDS.md`** — Renamed across all brains, skills, templates, scripts, and tests. `doctor.mjs` detects legacy name and suggests rename command.
- **Story template** — Added "TDD Red Phase: Yes/No" declaration field. Updated Definition of Done.
- **Sprint template §2** — Restructured with Architect-writable subsections (Merge Ordering, Shared Surfaces, Execution Mode, ADR Compliance, Risk Flags).
- **Roadmap template absorbs Delivery Plan fields** — Added "Project Window" table to §1 Strategic Context (Start Date, End Date, Total Sprints, Team, Sprint Cadence). Updated role description to "STRATEGIC AND OPERATIONAL layer between Charter and Sprint Plan." Removed all Delivery Plan references from instructions. Updated §7 Delivery Log to use release names instead of `D-{NN}` identifiers.
- **Document hierarchy simplified** — New hierarchy: Charter → Roadmap → Epic → Story (+ Risk Registry cross-cutting). Removed "LEVEL 5: Delivery Plan" from `doc-manager` skill, `VBOUNCE_MANIFEST.md`, `OVERVIEW.md`, and `README.md`.
- **Diagram updated** — `diagrams/04-delivery-lifecycle.mermaid` renamed to "Release Lifecycle", removed Delivery Plan node, replaced `D-NN` folder structure with backlog-based layout, updated archive to use sprint folders.
- **DevOps agent reads Roadmap** instead of Delivery Plan (subagent config table in MANIFEST).
- **Hotfix path** now described as bypassing into Sprint Plan execution (was Delivery Plan execution).

## [2.5.3] - 2026-03-26
### Added
- **Script Execution Protocol** — `run_script.sh` wrapper that all agents must use for script invocations. Captures exit codes, runs pre-flight checks (state.json existence, valid JSON), prints structured diagnostic blocks on failure with root cause and fix commands.
- **Shared constants** — `constants.mjs` exports `VALID_STATES` and `TERMINAL_STATES` as single source of truth. All lifecycle scripts import from it instead of hardcoding.
- **Mandatory `init_sprint.mjs` in Step 0** — Agent-team skill now requires state.json initialization before any sprint work. Prevents the S-12 gap where Sprint Monitor had no data.
- **Gate report existence check** — DevOps Step 5 now verifies Dev, QA, and Architect reports exist before merging. Added `check_gate_reports_exist()` to `pre_gate_common.sh`.
- **4 agent-perspective test suites** — `agent-errors.mjs` (wrong order/args/state), `run-script-wrapper.mjs` (wrapper behavior), `parallel-stories.mjs` (concurrent state management), `report-parsing.mjs` (malformed reports). Test count: 846 → 931.
- **Shared test fixtures** — `tests/fixtures.mjs` with `createSprintFixtures()`, `createSyntheticReport()`, `removeSprintFixtures()`.
- **`assertBashRuns()`** — New harness helper for testing shell scripts through the test framework.

### Fixed
- **Missing JSON.parse guards** — `close_sprint.mjs` and `complete_story.mjs` now wrap `JSON.parse` in try/catch with actionable error messages (previously crashed with raw Node.js errors on corrupted state.json).

### Changed
- **All script invocations in agent-team skill** now use `run_script.sh` wrapper (8 call sites updated).
- **`doctor.mjs`** — Added `run_script.sh` to required scripts list.

## [2.5.2] - 2026-03-25
### Fixed
- **On-demand skill triggers** — CLAUDE.md used `/doc`, `/review`, `/improve` etc. with slash-prefix notation, causing Claude Code to misinterpret them as slash commands and invoke the Skill tool (which fails). Replaced with plain-text triggers and explicit "read the file" instructions.

### Changed
- **npm package renamed** — Published as `vbounce-engine` (was `@sandrinio/vbounce`). Install with `npx vbounce-engine install claude`. Old package deprecated with redirect.

## [2.5.1] - 2026-03-25
### Added
- **Explorer Agent** — `brains/claude-agents/explorer.md` (Haiku model). Read-only research agent for Context Requests during planning and bounces. Was referenced in CLAUDE.md but never shipped in the engine package.
- **Regression Test Suite** — `tests/` directory with 841 automated tests across 8 suites. Validates install integrity, stale path detection, script execution, agent brain contracts, manifest completeness, template/skill cross-references, and a full lifecycle simulation (init → bounce → close → analytics). Run with `node tests/run.mjs`.

### Fixed
- **ROOT path resolution** — All 19 `.mjs` scripts and `verify_framework.sh` resolved `ROOT` one level too high after the v2.5.0 directory restructure (`..` → `../..`).
- **37 stale path references** — `brains/claude-agents/` → `.claude/agents/`, `brains/CHANGELOG.md` → `.vbounce/CHANGELOG.md`, `templates/` → `.vbounce/templates/` across 15 files (brains, skills, templates, scripts, manifest).
- **`validate_state.mjs` CLI guard** — Script silently exited 0 on macOS when `state.json` was missing due to `/var` → `/private/var` symlink mismatch. Fixed with `realpathSync`.
- **`init_sprint.mjs` template path** — Referenced `templates/sprint.md` instead of `.vbounce/templates/sprint.md`.
- **`tokens_used:` schema drift** — All 5 execution agent brains (developer, qa, architect, devops, scribe) were missing the `tokens_used:` field in their report YAML templates, causing `verify_framework.mjs` to fail.
- **`verify_framework.mjs` agents directory** — Looked for `brains/claude-agents` instead of `.claude/agents`.

### Changed
- **VBOUNCE_MANIFEST.md** — Added Explorer agent to subagent table, updated subagent count from 5 to 6.
- **`package.json`** — Added `test` script (`node tests/run.mjs`).

## [2.5.0] - 2026-03-25
### Added
- **`.vbounce/` directory consolidation** — Framework files (`skills/`, `templates/`, `scripts/`) now deploy under `.vbounce/` instead of project root. Reduces root clutter from 7+3 items to 2+2. Runtime files (`.bounce/`) merged into same directory with nested `.gitignore` for committed/ignored separation.
- **`vbounce uninstall`** — New CLI command that cleanly removes all framework files. Prompts before removing user data (LESSONS.md, product_plans/, archive/).
- **Migration logic** — `vbounce install` auto-detects old root-level layout and migrates to `.vbounce/`. Existing `.bounce/` contents preserved.
- **`VBOUNCE_MANIFEST.md`** — Renamed from `MANIFEST.md`, now ships in npm package and deploys to `.vbounce/VBOUNCE_MANIFEST.md`.
- **`.vbounce/.gitignore`** — Auto-deployed during install. Ignores runtime files (state, reports, context packs) while committing framework files and archive.

### Changed
- **550+ path references updated** — All brain files, skill files, agent configs, templates, scripts, and docs updated from `skills/` → `.vbounce/skills/`, `templates/` → `.vbounce/templates/`, `scripts/` → `.vbounce/scripts/`, `.bounce/` → `.vbounce/`.
- **Installer platform mappings** — All 6 platforms now deploy to `.vbounce/` subdirectories.
- **`vbounce doctor`** — Validates new `.vbounce/` paths.

## [2.4.0] - 2026-03-25
### Changed
- **Story template rewritten** — 7 improvements: added §1.3 Out of Scope section, complexity legend moved to instructions-only (not output), single `complexity_label` frontmatter field, flexible user story format (infrastructure stories can use direct problem statements), generic §2.2 verification steps (removed UI bias), §3.4 API Contract reframed as context with table format, §4.2 Definition of Done trimmed from 11 to 6 items.
- **Refinement Gate designed** — EPIC-001 story (STORY-001-06) defines a mandatory Q&A loop for Charter, Epic, and Roadmap templates: surface open questions with options + suggestions, surface edge cases with mitigations, lock decisions before proceeding to decomposition.
- **Git history cleaned** — Removed internal development artifacts (`product_plans/`, `.bounce/`) from git history. Public repo now contains only framework files shipped via npm.
- **`.gitignore` updated** — Explicitly excludes `product_plans/`, `vdocs/`, `.bounce/`, `/temporary/` from version control.

## [2.3.0] - 2026-03-24
### Added
- **Sprint Context Template** — `templates/sprint_context.md` for shared design tokens, UI conventions, locked dependencies, and active lessons across all agents in a sprint.
- **User Walkthrough Phase** — Step 5.7 between story merges and Sprint Integration Audit. User tests the running app; feedback categorized as Review Feedback or Bug.

### Changed
- **Unconditional Improvement Pipeline** — `suggest_improvements.mjs` now always runs (not just on 2nd+ sprint). Team Lead verbally presents P0/P1 suggestions.
- **Correction Tax Split** — Sprint Report now separates Bug Fix Tax (quality failures) from Enhancement Tax (healthy iteration).
- **Quality Gates in Story Template** — §4 renamed, added §4.1 Minimum Test Expectations table.
- **Accelerated Lesson Graduation** — Lessons can graduate after 1 sprint when high-impact (5+ files, caused a bounce, cross-cutting).
- **QA Runtime Verification** — QA agent now verifies no white screens or startup crashes before spec fidelity check.
- **Token Tracking Enforcement** — All 5 subagent configs promote token tracking to mandatory pre-report section.

## [2.2.0] - 2026-03-23
### Added
- **Token Tracking Script** — `scripts/count_tokens.mjs` parses Claude Code session JSONL for exact per-agent, per-story, per-sprint token counts. Modes: `--self`, `--all`, `--sprint`, `--json`.
- **CLI: `vbounce tokens`** — All token tracking modes available via CLI.

### Changed
- **Worktree-aware session discovery** — `count_tokens.mjs` falls back to `git rev-parse --git-common-dir` for agents in git worktrees.
- **Input/Output token split** — Agent report YAML now uses `input_tokens`, `output_tokens`, `total_tokens` (was single `tokens_used`).
- **Sprint token aggregation** — Team Lead cross-references agent YAML, task notifications, and `vbounce tokens --sprint` output.

## [2.1.0] - 2026-03-22
### Added
- **Product Graph** — `scripts/product_graph.mjs` scans product_plans/ and generates `.bounce/product-graph.json` with document nodes and dependency edges. `scripts/product_impact.mjs` runs BFS traversal for "what's affected by X?" queries. New `skills/product-graph/SKILL.md` with three-tier loading protocol.
- **Bug Report Template** — `templates/bug.md` for defects found mid-sprint or post-sprint (L2+ bugs; L1 bugs use hotfix.md).
- **Change Request Template** — `templates/change_request.md` for scope changes and approach changes mid-sprint. Human-gated with impact assessment.
- **CLI: `vbounce graph`** — generate product document graph. `vbounce graph impact <DOC-ID>` for impact analysis.
- **LESSONS.md auto-creation** — `vbounce install` now creates LESSONS.md if missing.
- **Shared File Map** in sprint template — forces explicit merge ordering for parallel stories touching same files.
- **Execution Mode table** in sprint template — L1→Fast Track, L2→needs human approval, L3/L4→Full Bounce.
- **Complexity Labels** added to doc-manager skill (L1-L4 definitions with routing rules).

### Changed
- **Brain files restructured** — CLAUDE.md reduced from 259 to ~89 lines. Phase routing table and critical rules moved into brain files. Process-guide skill deleted (content distributed to brain files and doc-manager). All three brain files (CLAUDE, GEMINI, AGENTS) now have identical Phase Routing and Critical Rules sections.
- **"Safe Zone" replaced with "Comply with ADRs"** — concrete rule referencing Roadmap §3, enforced by Architect.
- **Epic readiness gate strengthened** — now requires §8 blocking questions decided AND §6 edge cases have decided mitigations or are explicitly accepted as known risk. AI must present edge cases and open questions to human in chat after epic creation.
- **Mid-sprint triage updated** — decision tree routes to bug.md, change_request.md, or hotfix.md. All triage events logged with documents.
- **Pre-gate scan escalation** — escalates to human after 3 failures with options.
- **Post-merge test failure recovery** — defined path: revert → return to Dev → re-enter Step 2 → escalate after 3.
- **Integration audit fix stories** go to backlog for next sprint (not current sprint) unless release-blocking.
- **Delivery Plan sync clarified** — updates ONLY at sprint close, never during execution.
- **Sprint lifecycle scripts** regenerate product graph automatically (init_sprint, complete_story, close_sprint).
- **Improvement pipeline cadence clarified** — analysis runs every sprint; applying changes is human's call.

### Fixed
- Stale `pre_bounce_sync.sh` reference in improve skill → replaced with `vbounce doctor`.
- doc-manager cascade rules now trigger graph regeneration.

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
