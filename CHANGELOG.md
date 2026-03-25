# Changelog

All notable changes to the V-Bounce Engine framework and its CLI installer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
