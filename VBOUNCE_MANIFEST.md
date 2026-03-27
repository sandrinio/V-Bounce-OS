# V-Bounce Engine — Framework Manifest

> **Internal map for AI agents and framework maintainers.**
> Any modification to `.claude/agents/`, `.vbounce/skills/`, `.vbounce/templates/`, or `.vbounce/scripts/` MUST also update this file.
> Run `vbounce doctor` to validate file existence against this manifest.

**Version:** 2.6.0
**Last updated:** 2026-03-27

---

## 1. Process Flow

```
Phase 1: PLANNING (AI + Human, no subagents)
  ├─ User talks about work → AI loads doc-manager + product-graph
  ├─ Create/modify: Charter → Roadmap → Epic → Story → Risk Registry
  ├─ Codebase research mandatory for Epic §4 and Story decomposition
  ├─ AI surfaces ambiguity, risks, open questions collaboratively
  └─ Triage: L1 Trivial → Hotfix Path | Everything else → Standard Path

Phase 2: SPRINT PLANNING (AI + Human, collaborative gate)
  ├─ AI reads backlog + archive + Risk Registry
  ├─ AI proposes sprint scope, surfaces blockers and edge cases
  ├─ Human and AI discuss, adjust, resolve questions
  ├─ Sprint Plan created (mandatory) with §0 Readiness Gate
  └─ GATE: Human confirms → Sprint starts

Phase 3: THE BOUNCE (Subagent orchestration)
  ├─ Step 0: Sprint Setup (branch, gate config, parallel readiness)
  ├─ Step 0.5: Discovery Check (L4/🔴 stories)
  ├─ Step 1: Story Init (worktree, task file)
  ├─ Step 2: Developer Pass (TDD with E2E)
  ├─ Step 3: QA Pass (pre-gate scan + validation)
  ├─ Step 4: Architect Pass (pre-gate scan + audit)
  ├─ Step 5: DevOps Merge
  ├─ Step 5.5: Immediate Lesson Recording
  ├─ Step 5.7: User Walkthrough (Post-Delivery Review)
  ├─ Step 6: Sprint Integration Audit
  ├─ Step 7: Sprint Consolidation
  ├─ Escalation Recovery: 3+ bounces → present options → human decides
  └─ Hotfix Path: L1 only → Dev → manual verify → merge

Phase 4: REVIEW
  ├─ Sprint Report → Human review
  ├─ Scribe generates/updates product docs
  └─ Self-Improvement Pipeline (UNCONDITIONAL): trends → suggest → verbally present P0/P1 → human approves → improve
```

---

## 2. File Registry

### Root Files

| File | Purpose |
|------|---------|
| `README.md` | Public documentation — problem, guardrails, planning, sprint flow, CLI reference |
| `OVERVIEW.md` | System overview with diagrams — phases, agents, bounce loop, git branching |
| `CHANGELOG.md` | Version history (Keep a Changelog format) |
| `VBOUNCE_MANIFEST.md` | **This file** — complete framework map |
| `package.json` | NPM package definition (v2.4.x), CLI entry point, dependencies |
| `package-lock.json` | NPM dependency lock file |
| `vbounce.config.json` | Framework config — max diff lines, context budget, tool selection |
| `.gitignore` | Git ignore rules |

---

## 3. Brain Registry

Brains configure AI tools to follow the V-Bounce process. Each brain contains identity, phase routing table, critical rules, and skill pointers — adapted per tool.

### Main Brain Files

| Installed Location | Tool | Tier | Subagents? |
|-------------------|------|------|-----------|
| `CLAUDE.md` (project root) | Claude Code | 1 | Yes — spawns 6 subagents |
| `AGENTS.md` (project root) | Codex CLI (OpenAI) | 2 | No — file-based handoffs |
| `GEMINI.md` (project root) | Gemini CLI / Antigravity | 2 | No — file-based handoffs |
| `.cursor/rules/vbounce-process.mdc` | Cursor | 3 | No — context injection |
| `.cursor/rules/vbounce-rules.mdc` | Cursor | 3 | No — context injection |
| `.cursor/rules/vbounce-docs.mdc` | Cursor | 3 | No — context injection |
| `.github/copilot-instructions.md` | GitHub Copilot | 4 | No — awareness mode |
| `.windsurfrules` | Windsurf | 4 | No — awareness mode |

### Support Files

| File | Purpose |
|------|---------|
| `.vbounce/CHANGELOG.md` | Framework modification log |

### Subagent Configs (Claude Code only)

| Installed Location | Agent | Tools | Reads | Writes |
|-------------------|-------|-------|-------|--------|
| `.claude/agents/explorer.md` | Explorer | Read, Glob, Grep, Bash | Product plans, state.json, codebase structure | Context Pack (read-only research) |
| `.claude/agents/developer.md` | Developer | Read, Edit, Write, Bash, Glob, Grep | Story §1+§3, FLASHCARDS.md, ADRs, react-best-practices | Implementation Report, Checkpoint |
| `.claude/agents/qa.md` | QA | Read, Bash, Glob, Grep | Story §2, Dev Report, FLASHCARDS.md, pre-gate scan | QA Validation Report |
| `.claude/agents/architect.md` | Architect | Read, Glob, Grep, Bash | Full Story, all reports, Roadmap §3 ADRs, Risk Registry | Architectural Audit Report |
| `.claude/agents/devops.md` | DevOps | Read, Edit, Write, Bash, Glob, Grep | Gate reports, Roadmap, FLASHCARDS.md | DevOps Merge/Release Report |
| `.claude/agents/scribe.md` | Scribe | Read, Write, Bash, Glob, Grep | Sprint Report, Dev Reports, codebase, _manifest.json | Product docs, Scribe Report |

---

## 4. Template Registry

Templates are **immutable during execution**. Located in `.vbounce/templates/`.

| Template | Level | Output Path | Key Sections |
|----------|-------|-------------|-------------|
| `charter.md` | 1 | `product_plans/strategy/{project}_charter.md` | §1 Identity, §2 Design Principles, §3 Architecture, §4 Tech Stack, §5 Key Workflows, §6 Constraints |
| `roadmap.md` | 2 | `product_plans/strategy/{project}_roadmap.md` | §1 Strategic Context, §2 Release Plan, §3 ADRs, §4 Dependencies, §5 Strategic Constraints |
| `epic.md` | 3 | `product_plans/backlog/EPIC-{NNN}_{name}/EPIC-{NNN}_{name}.md` | §1 Problem & Value, §2 Scope Boundaries, §3 Context, §4 Technical Context (codebase research required), §5 Decomposition Guidance, §6 Risks, §7 Acceptance Criteria, §8 Open Questions, §9 Artifact Links |
| `story.md` | 4 | `product_plans/backlog/EPIC-{NNN}_{name}/STORY-{EpicID}-{StoryID}-{Name}.md` | §1 The Spec (§1.1 User Story, §1.2 Detailed Requirements, §1.3 Out of Scope), §2 The Truth (Gherkin + Verification), §3 Implementation Guide (§3.0 Env Prerequisites, §3.1 Tests, §3.2 Context, §3.3 Logic, §3.4 API Contract), §4 Quality Gates (§4.1 Min Test Expectations, §4.2 Definition of Done) |
| `spike.md` | 3.5 | `product_plans/backlog/EPIC-{NNN}_{name}/SPIKE-{EpicID}-{NNN}-{topic}.md` | §1 Question, §2 Context, §3 Approach, §4 Findings, §5 Decision, §6 Residual Risk, §7 Affected Documents |
| `sprint.md` | 4.5 | `product_plans/sprints/sprint-{XX}/sprint-{XX}.md` | §0 Sprint Readiness Gate (mandatory confirmation), §1 Active Scope + Context Pack, §2 Execution Strategy (Shared File Map, Dependency Chain, Execution Mode, Risk Flags), §3 Open Questions, §4 Execution Log (with test counts) |
| `sprint_report.md` | Output | `.vbounce/sprint-report-S-{XX}.md` | §1 What Was Delivered, §2 Story Results (with Tax Type), §3 Execution Metrics (Bug Fix Tax / Enhancement Tax split), §4 Lessons Learned (review, not gate), §5 Retrospective + Framework Self-Assessment |
| `sprint_context.md` | Sprint | `.vbounce/sprint-context-S-{XX}.md` | Design tokens, shared patterns, locked deps, active lessons, sprint-specific rules |
| `risk_registry.md` | Cross-cutting | `product_plans/strategy/RISK_REGISTRY.md` | §1 Active Risks, §2 Resolved Risks, §3 Analysis Log |
| `hotfix.md` | Bypass | `product_plans/hotfixes/HOTFIX-{Date}-{Name}.md` | Problem, Fix, Files Affected, Verification |
| `bug.md` | Mid-sprint | `product_plans/sprints/sprint-{XX}/BUG-{Date}-{Name}.md` | §1 The Bug (repro steps), §2 Impact, §3 Fix Approach, §4 Verification |
| `change_request.md` | Mid-sprint | `product_plans/sprints/sprint-{XX}/CR-{Date}-{Name}.md` | §1 The Change, §2 Impact Assessment, §3 Decision, §4 Execution Plan |

---

## 5. Skill Registry

Skills are modular instructions loaded by agents. Located in `.vbounce/skills/`.

| Skill | File | Phase | Trigger | Loaded By |
|-------|------|-------|---------|-----------|
| **product-graph** | `.vbounce/skills/product-graph/SKILL.md` | Phase 1-2 (Planning) | Auto-loads during planning | Team Lead |
| **agent-team** | `.vbounce/skills/agent-team/SKILL.md` | Phase 3 (Execution) | Auto-loads during execution | Team Lead |
| **doc-manager** | `.vbounce/skills/doc-manager/SKILL.md` | Phase 1-2 (Planning) | Auto-loads during planning; also `/doc` | AI (planning partner) |
| **lesson** | `.vbounce/skills/lesson/SKILL.md` | All phases | Always loaded in brain; also `/lesson` | All agents |
| **vibe-code-review** | `.vbounce/skills/vibe-code-review/SKILL.md` | Phase 3 (Execution) | `/review`; auto by QA/Architect | QA, Architect |
| **improve** | `.vbounce/skills/improve/SKILL.md` | Phase 4 (Review) | `/improve`; auto on sprint close | Team Lead |
| **write-skill** | `.vbounce/skills/write-skill/SKILL.md` | Any | `/write-skill` | Team Lead |
| **react-best-practices** | `.vbounce/skills/react-best-practices/SKILL.md` | Phase 3 (Execution) | `/react`; auto by Developer | Developer |
| **file-organization** | `.vbounce/skills/file-organization/SKILL.md` | Phase 1 (Planning) | On-demand | Team Lead |

### Skill Reference Files

#### agent-team references
| File | Purpose |
|------|---------|
| `.vbounce/skills/agent-team/references/cleanup.md` | Post-sprint cleanup procedures |
| `.vbounce/skills/agent-team/references/discovery.md` | Spike execution protocol for L4/🔴 stories |
| `.vbounce/skills/agent-team/references/git-strategy.md` | Branch model and git commands |
| `.vbounce/skills/agent-team/references/mid-sprint-triage.md` | Routing for mid-sprint changes — decision tree routes to bug.md, change_request.md, or hotfix.md |
| `.vbounce/skills/agent-team/references/report-naming.md` | Canonical naming for all report files |

#### vibe-code-review references
| File | Purpose |
|------|---------|
| `.vbounce/skills/vibe-code-review/references/quick-scan.md` | Fast health check mode |
| `.vbounce/skills/vibe-code-review/references/pr-review.md` | PR diff analysis mode |
| `.vbounce/skills/vibe-code-review/references/deep-audit.md` | Full codebase analysis mode |
| `.vbounce/skills/vibe-code-review/references/trend-check.md` | Cross-sprint metrics comparison mode |
| `.vbounce/skills/vibe-code-review/references/report-template.md` | Review report structure |
| `.vbounce/skills/vibe-code-review/scripts/pr-analyze.sh` | PR analysis automation |
| `.vbounce/skills/vibe-code-review/scripts/generate-snapshot.sh` | Codebase snapshot generation |

#### file-organization references
| File | Purpose |
|------|---------|
| `.vbounce/skills/file-organization/references/quick-checklist.md` | File organization verification checklist |
| `.vbounce/skills/file-organization/references/gitignore-template.md` | Template .gitignore with V-Bounce patterns |
| `.vbounce/skills/file-organization/evals/evals.json` | Evaluation data for file organization |
| `.vbounce/skills/file-organization/TEST-RESULTS.md` | Test results for file-organization skill |

#### react-best-practices rules (57 files)
| Directory | Count | Categories |
|-----------|-------|-----------|
| `.vbounce/skills/react-best-practices/rules/` | 55 | async (5), bundle (5), client (4), js (12), rendering (8), rerender (12), server (6), advanced (3) |
| `.vbounce/skills/react-best-practices/rules/_sections.md` | — | Index of all rule categories |
| `.vbounce/skills/react-best-practices/rules/_template.md` | — | Template for new rules |

---

## 6. Script Registry

Scripts automate framework operations. Located in `.vbounce/scripts/`.

### Script Execution Wrapper
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/run_script.sh` | **Every script invocation** | Script name + args | Passthrough stdout/stderr, pre-flight checks, structured diagnostics on failure |

### Shared Constants
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/constants.mjs` | Imported by lifecycle scripts | — | `VALID_STATES`, `TERMINAL_STATES` (single source of truth) |

### Sprint Lifecycle
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/init_sprint.mjs` | Sprint setup | Sprint ID, --stories | `.vbounce/state.json`, sprint plan directory |
| `.vbounce/scripts/close_sprint.mjs` | Sprint end | Sprint ID | Archives reports, triggers improvement pipeline |
| `.vbounce/scripts/complete_story.mjs` | Story merge | Story ID, metrics | Updates state.json + sprint plan §4 Execution Log |
| `.vbounce/scripts/update_state.mjs` | Any state change | Story ID, new state | Atomic state.json update |

### Context Preparation
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/prep_sprint_context.mjs` | Before sprint | Sprint ID | `.vbounce/sprint-context-S-XX.md` |
| `.vbounce/scripts/prep_qa_context.mjs` | Before QA gate | Story ID | `.vbounce/qa-context-STORY-ID.md` |
| `.vbounce/scripts/prep_arch_context.mjs` | Before Architect gate | Story ID | `.vbounce/arch-context-STORY-ID.md` |
| `.vbounce/scripts/prep_sprint_summary.mjs` | Sprint consolidation | Sprint ID | Aggregated metrics from archived reports |

### Quality Gates
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/pre_gate_runner.sh` | Before QA/Architect | Gate type, worktree path | `.vbounce/reports/pre-{gate}-scan.txt` |
| `.vbounce/scripts/pre_gate_common.sh` | — | — | Shared functions for gate checks |
| `.vbounce/scripts/init_gate_config.sh` | First sprint | — | `.vbounce/gate-checks.json` (auto-detect stack) |

### Validation
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/validate_report.mjs` | After any agent report | Report file | PASS/FAIL (YAML frontmatter validation) |
| `.vbounce/scripts/validate_state.mjs` | State changes | state.json | Schema validation |
| `.vbounce/scripts/validate_sprint_plan.mjs` | Sprint setup | Sprint plan file | Structure validation |
| `.vbounce/scripts/validate_bounce_readiness.mjs` | Before bounce | Story ID | Readiness check (spec, criteria, guide, ambiguity) |
| `.vbounce/scripts/prefill_report.mjs` | Before agent spawn | Story ID, agent type | `.vbounce/reports/STORY-{ID}-{agent}.md` (pre-filled YAML frontmatter) |
| `.vbounce/scripts/check_update.mjs` | `vbounce update` / `vbounce doctor` | --json, --quiet | Version comparison: installed vs npm latest |
| `.vbounce/scripts/verify_framework.mjs` | On demand | — | Framework integrity check |
| `.vbounce/scripts/verify_framework.sh` | On demand | — | Shell wrapper for above |
| `.vbounce/scripts/doctor.mjs` | `vbounce doctor` | — | Health check (templates, skills, scripts, brains) |

### Self-Improvement
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/sprint_trends.mjs` | Sprint close | Archived reports | `.vbounce/trends.md` |
| `.vbounce/scripts/post_sprint_improve.mjs` | Sprint close | Sprint Report, FLASHCARDS.md, trends | `.vbounce/improvement-manifest.json` |
| `.vbounce/scripts/suggest_improvements.mjs` | Sprint close | Improvement manifest | `.vbounce/improvement-suggestions.md` |

### Product Graph
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/product_graph.mjs` | After doc edits, sprint lifecycle events | product_plans/ | `.vbounce/product-graph.json` |
| `.vbounce/scripts/product_impact.mjs` | Before modifying a document | DOC-ID | Impact analysis (BFS traversal) |

### Token Tracking
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/count_tokens.mjs` | After each agent completes; sprint consolidation | Session JSONL / story docs | Per-agent and per-sprint token counts |

### Utilities
| Script | When | Input | Output |
|--------|------|-------|--------|
| `.vbounce/scripts/hotfix_manager.sh` | Hotfix lifecycle | Subcommand (audit/sync/ledger) | Hotfix ledger, worktree sync |
| `.vbounce/scripts/vdoc_match.mjs` | Context prep | Story ID, manifest | JSON/markdown context with matched docs |
| `.vbounce/scripts/vdoc_staleness.mjs` | Sprint close | Sprint ID | `.vbounce/scribe-task-S-XX.md` (stale doc list) |

---

## 7. Information Flow

### Document Inheritance (upstream → downstream)

```
Charter §1 (Identity) ──────────→ Roadmap §1 (Strategic Context)
Charter §2 (Design Principles) ──→ ALL agents (decision tiebreaker)
Charter §3 (Architecture) ──────→ Roadmap §3 (ADRs)
Charter §5 (Key Workflows) ─────→ Epic §1 (Problem & Value)
Charter §6 (Constraints) ───────→ Roadmap §5 (Strategic Constraints)

Roadmap §2 (Release Plan) ──────→ Epic Metadata (Release field)
Roadmap §3 (ADRs) ──────────────→ Story §3.2 (ADR References)
Roadmap §4 (Dependencies) ──────→ Risk Registry §1 (Active Risks)
Roadmap §5 (Constraints) ───────→ Sprint Plan (sprint capacity)

Epic §2 (Scope Boundaries) ─────→ Story §1 (The Spec)
Epic §4 (Technical Context) ────→ Story §3 (Implementation Guide)
Epic §5 (Decomposition) ────────→ Codebase research scope + Story creation
Epic §6 (Risks) ────────────────→ Risk Registry §1 (Active Risks)
Epic §7 (Acceptance Criteria) ──→ Story §2 (The Truth)
Epic §8 (Open Questions) ───────→ Spike §1 (Question)

Sprint Plan §1 (Active Scope) ──→ Team Lead (source of truth during sprint)
Sprint Plan §1 (Context Pack) ──→ Ready to Bounce gate

Spike §4 (Findings) ────────────→ Epic §4 (Technical Context update)
Spike §5 (Decision) ────────────→ Roadmap §3 (ADRs, if architectural)
```

### Agent Report Flow (Phase 3)

```
Developer Report
    ↓
Pre-QA Gate Scan → QA reads Dev Report + Story §2
    ↓ (if PASS)
Pre-Architect Gate Scan → Architect reads all reports + Story + Roadmap §3
    ↓ (if PASS)
DevOps reads all reports → merges → archives
    ↓
Team Lead records lessons (Step 5.5) → consolidates Sprint Report (Step 7)
    ↓
Human reviews → Scribe updates docs → Improvement pipeline runs
```

### Cascade Rules (modify upstream → update downstream)

| If you change... | Then also update... |
|------------------|---------------------|
| Charter §1 (Identity) | Roadmap §1 |
| Charter §2 (Design Principles) | Notify all agents |
| Charter §3 (Tech Stack) | Roadmap §3 (ADRs) |
| Roadmap §2 (Release Plan) | Sprint Plan goals |
| Roadmap §3 (ADR) | All Stories referencing that ADR |
| Epic §2 (Scope) | All child Stories §1 |
| Epic §4 (Technical Context) | All child Stories §3 |
| Spike §4/§5 (Findings/Decision) | Epic §4, Epic §8, Risk Registry |
| Any `.claude/agents/` or `.vbounce/skills/` file | `.vbounce/CHANGELOG.md` + this manifest |

---

## 8. Runtime Directories

These directories are created during project execution, not part of the framework distribution.

| Directory | Purpose | Created By |
|-----------|---------|-----------|
| `product_plans/strategy/` | Charter, Roadmap, Risk Registry (frozen during sprints) | Phase 1 (Planning) |
| `product_plans/backlog/` | Epics and unassigned Stories | Phase 1 (Planning) |
| `product_plans/sprints/` | Active sprint workspace | Phase 2 (Sprint Planning) |
| `product_plans/hotfixes/` | Emergency L1 fixes | Phase 3 (Hotfix Path) |
| `product_plans/archive/` | Completed sprints and epics (immutable) | Phase 4 (Review) |
| `.vbounce/` | Sprint state, reports, improvement artifacts, product graph | `vbounce sprint init` |
| `.vbounce/reports/` | Active bounce reports (gitignored) | Agents during Phase 3 |
| `.vbounce/archive/S-{XX}/` | Archived reports per sprint (committed) | DevOps after merge |
| `.worktrees/` | Git worktrees for isolated story branches | Phase 3 Step 1 |
| `vdocs/` | Product documentation + `_manifest.json` | Scribe agent |

---

## 9. Diagrams

| File | What it shows |
|------|--------------|
| `diagrams/01-story-state-machine.mermaid` | Story state transitions (Draft → Done, with spike loop and escalation) |
| `diagrams/02-document-hierarchy.mermaid` | Document inheritance (Charter → Roadmap → Epic → Story) |
| `diagrams/03-bounce-sequence.mermaid` | Bounce cycle interaction (Dev ↔ QA ↔ Architect → DevOps) |
| `diagrams/04-delivery-lifecycle.mermaid` | Full delivery flow (Planning → Sprint → Release) |
| `diagrams/05-agent-roles.mermaid` | Six agents and their relationships |
| `diagrams/06-git-branching.mermaid` | Git strategy (main → sprint → story worktrees) |

---

## 10. Documentation

| File | Audience | Purpose |
|------|----------|---------|
| `docs/HOTFIX_EDGE_CASES.md` | Team Lead | Edge cases for hotfix handling |
| `docs/IMPROVEMENT.md` | Public / Users | User-facing guide to the Self-Improvement Pipeline |
| `docs/agent-skill-profiles.docx` | Framework maintainers | Agent capability profiles |
| `docs/vbounce-os-manual.docx` | All users | Comprehensive V-Bounce manual |

### Visual Assets

| Directory | Purpose |
|-----------|---------|
| `docs/icons/` | SVG icons used in README and documentation (logo, section headers, role icons) |
| `docs/images/` | Generated images (e.g., Bounce Loop diagram) used in README |

---

## 11. Test Suite

Regression suite for validating the engine after any path, script, or template change. Run: `node vbounce-tests/run.mjs`

| File | Suite | What it checks |
|------|-------|----------------|
| `vbounce-tests/harness.mjs` | — | Test primitives: `suite()`, `record()`, `assertFileExists()`, `assertNoMatch()`, `assertScriptRuns()`, `assertBashRuns()`, `generateReport()` |
| `vbounce-tests/fixtures.mjs` | — | Shared fixture generator: `createSprintFixtures()`, `createSyntheticReport()`, `removeSprintFixtures()` |
| `vbounce-tests/run.mjs` | — | Main runner: installs to temp dir, runs all 13 suites, generates JSON + Markdown reports |
| `vbounce-tests/suites/VBOUNCE_install.mjs` | Install Integrity | 76+ file existence checks across all installed components |
| `vbounce-tests/suites/VBOUNCE_paths.mjs` | Path Integrity | 500+ stale path pattern scans across all shipped `.md`/`.mjs` files |
| `vbounce-tests/suites/VBOUNCE_doctor.mjs` | Doctor Accuracy | False positive and false negative detection |
| `vbounce-tests/suites/VBOUNCE_scripts.mjs` | Script Validation | Import checks, functional tests, ROOT resolution for all `.mjs` scripts |
| `vbounce-tests/suites/VBOUNCE_brains.mjs` | Agent Contracts | Frontmatter, report YAML signatures, CLAUDE.md ↔ agents consistency |
| `vbounce-tests/suites/VBOUNCE_manifest.mjs` | Manifest Completeness | All backtick paths resolve, orphan file detection |
| `vbounce-tests/suites/VBOUNCE_templates.mjs` | Template/Skill Integrity | Structure validation, stale paths, CLAUDE.md ↔ skills cross-reference |
| `vbounce-tests/suites/VBOUNCE_lifecycle.mjs` | Full Lifecycle | 41-test simulation: fixtures → init → transitions → context prep → complete → close → analytics → edge cases |
| `vbounce-tests/suites/VBOUNCE_agent-errors.mjs` | Agent Error Paths | Scripts called in wrong order, wrong state, wrong/missing args — verifies actionable errors, not raw crashes |
| `vbounce-tests/suites/VBOUNCE_run-script-wrapper.mjs` | Script Wrapper | `run_script.sh` pre-flight checks, diagnostic block output, success/failure passthrough, bash script support |
| `vbounce-tests/suites/VBOUNCE_parallel-stories.mjs` | Parallel Stories | Concurrent state management: 3 stories transition independently, bounce counts isolated, re-init behavior |
| `vbounce-tests/suites/VBOUNCE_report-parsing.mjs` | Report Parsing | Malformed agent reports (no frontmatter, empty, truncated YAML, missing fields) handled gracefully |
| `vbounce-tests/suites/VBOUNCE_prefill-report.mjs` | Report Pre-Fill | Pre-filled YAML frontmatter generation, bounce count injection, validation round-trip |

Reports output to `vbounce-tests/reports/report-{timestamp}.{json,md}`.

---

## 12. CLI Entry Point

| File | Purpose |
|------|---------|
| `bin/vbounce.mjs` | Main CLI — `npx vbounce install`, `vbounce sprint init`, `vbounce graph`, `vbounce doctor`, etc. |

---

## File Count Summary

| Category | Count |
|----------|-------|
| Root files (core) | 8 |
| Brain files | 16 |
| Templates | 12 |
| Skills (SKILL.md + references) | 26 |
| React rules | 57 |
| Scripts | 29 |
| Test suite | 16 |
| Diagrams | 6 |
| Docs + Visual Assets | 6 + ~15 icons/images |
| CLI | 1 |
| **Total** | **~192** |
