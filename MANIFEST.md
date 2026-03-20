# V-Bounce Engine — Framework Manifest

> **Internal map for AI agents and framework maintainers.**
> Any modification to `brains/`, `skills/`, `templates/`, or `scripts/` MUST also update this file.
> Run `vbounce doctor` to validate file existence against this manifest.

**Version:** 2.0.0
**Last updated:** 2026-03-20

---

## 1. Process Flow

```
Phase 1: PLANNING (AI + Human, no subagents)
  ├─ User talks about work → AI loads doc-manager automatically
  ├─ Create/modify: Charter → Roadmap → Epic → Story → Delivery Plan → Risk Registry
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
  ├─ Step 6: Sprint Integration Audit
  ├─ Step 7: Sprint Consolidation
  ├─ Escalation Recovery: 3+ bounces → present options → human decides
  └─ Hotfix Path: L1 only → Dev → manual verify → merge

Phase 4: REVIEW
  ├─ Sprint Report → Human review
  ├─ Delivery Plan updated (boundary only)
  ├─ Scribe generates/updates product docs
  └─ Self-Improvement Pipeline: trends → improve → suggest → human approves
```

---

## 2. File Registry

### Root Files

| File | Purpose |
|------|---------|
| `README.md` | Public documentation — problem, guardrails, planning, sprint flow, CLI reference |
| `OVERVIEW.md` | System overview with diagrams — phases, agents, bounce loop, git branching |
| `CHANGELOG.md` | Version history (Keep a Changelog format) |
| `MANIFEST.md` | **This file** — complete framework map |
| `IMPROVEMENT_PLAN.md` | Active improvement tracking (delete when complete) |
| `INTEGRITY_AUDIT.md` | Framework integrity audit findings |
| `LAST_SESSION.md` | Last working session notes for continuity |
| `package.json` | NPM package definition (v2.0.0), CLI entry point, dependencies |
| `package-lock.json` | NPM dependency lock file |
| `vbounce.config.json` | Framework config — max diff lines, context budget, tool selection |
| `.gitignore` | Git ignore rules |

### Marketing (not part of framework)

| File | Purpose |
|------|---------|
| `linkedin-post.md` | LinkedIn promotional content |
| `medium-post.md` | Medium blog post |
| `reddit-post-vibecoding.md` | Reddit post on vibe coding |
| `Vibecoding_Ecosystem_Validation_Workflow.docx` | Ecosystem validation workflow doc |

---

## 3. Brain Registry

Brains configure AI tools to follow the V-Bounce process. All brains describe the same 4-phase process, adapted per tool.

### Main Brain Files

| File | Tool | Tier | Subagents? |
|------|------|------|-----------|
| `brains/CLAUDE.md` | Claude Code | 1 | Yes — spawns 5 subagents |
| `brains/AGENTS.md` | Codex CLI (OpenAI) | 2 | No — file-based handoffs |
| `brains/GEMINI.md` | Gemini CLI / Antigravity | 2 | No — file-based handoffs |
| `brains/cursor-rules/vbounce-process.mdc` | Cursor | 3 | No — context injection |
| `brains/cursor-rules/vbounce-rules.mdc` | Cursor | 3 | No — context injection |
| `brains/cursor-rules/vbounce-docs.mdc` | Cursor | 3 | No — context injection |
| `brains/copilot/copilot-instructions.md` | GitHub Copilot | 4 | No — awareness mode |
| `brains/windsurf/.windsurfrules` | Windsurf | 4 | No — awareness mode |

### Support Files

| File | Purpose |
|------|---------|
| `brains/SETUP.md` | Step-by-step deployment guide for adding V-Bounce to any repo |
| `brains/CHANGELOG.md` | Framework modification log (separate from root CHANGELOG.md) |

### Subagent Configs (Claude Code only, deploy to `.claude/agents/`)

| File | Agent | Tools | Reads | Writes |
|------|-------|-------|-------|--------|
| `brains/claude-agents/developer.md` | Developer | Read, Edit, Write, Bash, Glob, Grep | Story §1+§3, LESSONS.md, ADRs, react-best-practices | Implementation Report, Checkpoint |
| `brains/claude-agents/qa.md` | QA | Read, Bash, Glob, Grep | Story §2, Dev Report, LESSONS.md, pre-gate scan | QA Validation Report |
| `brains/claude-agents/architect.md` | Architect | Read, Glob, Grep, Bash | Full Story, all reports, Roadmap §3 ADRs, Risk Registry | Architectural Audit Report |
| `brains/claude-agents/devops.md` | DevOps | Read, Edit, Write, Bash, Glob, Grep | Gate reports, Delivery Plan, LESSONS.md | DevOps Merge/Release Report |
| `brains/claude-agents/scribe.md` | Scribe | Read, Write, Bash, Glob, Grep | Sprint Report, Dev Reports, codebase, _manifest.json | Product docs, Scribe Report |

---

## 4. Template Registry

Templates are **immutable during execution**. Located in `templates/`.

| Template | Level | Output Path | Key Sections |
|----------|-------|-------------|-------------|
| `charter.md` | 1 | `product_plans/strategy/{project}_charter.md` | §1 Identity, §2 Design Principles, §3 Architecture, §4 Tech Stack, §5 Key Workflows, §6 Constraints |
| `roadmap.md` | 2 | `product_plans/strategy/{project}_roadmap.md` | §1 Strategic Context, §2 Release Plan, §3 ADRs, §4 Dependencies, §5 Strategic Constraints |
| `epic.md` | 3 | `product_plans/backlog/EPIC-{NNN}_{name}/EPIC-{NNN}_{name}.md` | §1 Problem & Value, §2 Scope Boundaries, §3 Context, §4 Technical Context (codebase research required), §5 Decomposition Guidance, §6 Risks, §7 Acceptance Criteria, §8 Open Questions, §9 Artifact Links |
| `story.md` | 4 | `product_plans/backlog/EPIC-{NNN}_{name}/STORY-{EpicID}-{StoryID}-{Name}.md` | §1 The Spec, §2 The Truth (Gherkin), §3 Implementation Guide (§3.0 Env Prerequisites, §3.1 Tests, §3.2 Context, §3.3 Logic, §3.4 API), §4 Definition of Done |
| `spike.md` | 3.5 | `product_plans/backlog/EPIC-{NNN}_{name}/SPIKE-{EpicID}-{NNN}-{topic}.md` | §1 Question, §2 Context, §3 Approach, §4 Findings, §5 Decision, §6 Residual Risk, §7 Affected Documents |
| `delivery_plan.md` | 4.5 | `product_plans/D-{NN}_{release}/D-{NN}_DELIVERY_PLAN.md` | §1 Project Window, §2 Epics, §3 Backlog, §4 Delivery Log, §8 Applied Hotfixes |
| `sprint.md` | 4.5 | `product_plans/sprints/sprint-{XX}/sprint-{XX}.md` | §0 Sprint Readiness Gate (mandatory confirmation), §1 Active Scope + Context Pack, §2 Execution Strategy, §3 Open Questions, §4 Execution Log (with test counts) |
| `sprint_report.md` | Output | `.bounce/sprint-report-S-{XX}.md` | §1 What Was Delivered, §2 Story Results, §3 Execution Metrics (incl. test counts), §4 Lessons Learned (review, not gate), §5 Retrospective + Framework Self-Assessment |
| `risk_registry.md` | Cross-cutting | `product_plans/strategy/RISK_REGISTRY.md` | §1 Active Risks, §2 Resolved Risks, §3 Analysis Log |
| `hotfix.md` | Bypass | `product_plans/hotfixes/HOTFIX-{Date}-{Name}.md` | Problem, Fix, Files Affected, Verification |

---

## 5. Skill Registry

Skills are modular instructions loaded by agents. Located in `skills/`.

| Skill | File | Phase | Trigger | Loaded By |
|-------|------|-------|---------|-----------|
| **agent-team** | `skills/agent-team/SKILL.md` | Phase 3 (Execution) | Always loaded in brain | Team Lead |
| **doc-manager** | `skills/doc-manager/SKILL.md` | Phase 1-2 (Planning) | Auto-loads during planning; also `/doc` | AI (planning partner) |
| **lesson** | `skills/lesson/SKILL.md` | All phases | Always loaded in brain; also `/lesson` | All agents |
| **vibe-code-review** | `skills/vibe-code-review/SKILL.md` | Phase 3 (Execution) | `/review`; auto by QA/Architect | QA, Architect |
| **improve** | `skills/improve/SKILL.md` | Phase 4 (Review) | `/improve`; auto on sprint close | Team Lead |
| **write-skill** | `skills/write-skill/SKILL.md` | Any | `/write-skill` | Team Lead |
| **react-best-practices** | `skills/react-best-practices/SKILL.md` | Phase 3 (Execution) | `/react`; auto by Developer | Developer |
| **file-organization** | `skills/file-organization/SKILL.md` | Phase 1 (Planning) | On-demand | Team Lead |

### Skill Reference Files

#### agent-team references
| File | Purpose |
|------|---------|
| `skills/agent-team/references/cleanup.md` | Post-sprint cleanup procedures |
| `skills/agent-team/references/delivery-sync.md` | When to update Delivery Plan vs Sprint Plan |
| `skills/agent-team/references/discovery.md` | Spike execution protocol for L4/🔴 stories |
| `skills/agent-team/references/git-strategy.md` | Branch model and git commands |
| `skills/agent-team/references/mid-sprint-triage.md` | Routing for mid-sprint changes (Bug, Spec Clarification, Scope Change, Approach Change) |
| `skills/agent-team/references/report-naming.md` | Canonical naming for all report files |

#### vibe-code-review references
| File | Purpose |
|------|---------|
| `skills/vibe-code-review/references/quick-scan.md` | Fast health check mode |
| `skills/vibe-code-review/references/pr-review.md` | PR diff analysis mode |
| `skills/vibe-code-review/references/deep-audit.md` | Full codebase analysis mode |
| `skills/vibe-code-review/references/trend-check.md` | Cross-sprint metrics comparison mode |
| `skills/vibe-code-review/references/report-template.md` | Review report structure |
| `skills/vibe-code-review/scripts/pr-analyze.sh` | PR analysis automation |
| `skills/vibe-code-review/scripts/generate-snapshot.sh` | Codebase snapshot generation |

#### file-organization references
| File | Purpose |
|------|---------|
| `skills/file-organization/references/quick-checklist.md` | File organization verification checklist |
| `skills/file-organization/references/gitignore-template.md` | Template .gitignore with V-Bounce patterns |
| `skills/file-organization/evals/evals.json` | Evaluation data for file organization |
| `skills/file-organization/TEST-RESULTS.md` | Test results for file-organization skill |

#### react-best-practices rules (57 files)
| Directory | Count | Categories |
|-----------|-------|-----------|
| `skills/react-best-practices/rules/` | 55 | async (5), bundle (5), client (4), js (12), rendering (8), rerender (12), server (6), advanced (3) |
| `skills/react-best-practices/rules/_sections.md` | — | Index of all rule categories |
| `skills/react-best-practices/rules/_template.md` | — | Template for new rules |

---

## 6. Script Registry

Scripts automate framework operations. Located in `scripts/`.

### Sprint Lifecycle
| Script | When | Input | Output |
|--------|------|-------|--------|
| `scripts/init_sprint.mjs` | Sprint setup | Sprint ID, Delivery ID | `.bounce/state.json`, sprint plan directory |
| `scripts/close_sprint.mjs` | Sprint end | Sprint ID | Archives reports, triggers improvement pipeline |
| `scripts/complete_story.mjs` | Story merge | Story ID, metrics | Updates state.json + sprint plan §4 Execution Log |
| `scripts/update_state.mjs` | Any state change | Story ID, new state | Atomic state.json update |

### Context Preparation
| Script | When | Input | Output |
|--------|------|-------|--------|
| `scripts/prep_sprint_context.mjs` | Before sprint | Sprint ID | `.bounce/sprint-context-S-XX.md` |
| `scripts/prep_qa_context.mjs` | Before QA gate | Story ID | `.bounce/qa-context-STORY-ID.md` |
| `scripts/prep_arch_context.mjs` | Before Architect gate | Story ID | `.bounce/arch-context-STORY-ID.md` |
| `scripts/prep_sprint_summary.mjs` | Sprint consolidation | Sprint ID | Aggregated metrics from archived reports |

### Quality Gates
| Script | When | Input | Output |
|--------|------|-------|--------|
| `scripts/pre_gate_runner.sh` | Before QA/Architect | Gate type, worktree path | `.bounce/reports/pre-{gate}-scan.txt` |
| `scripts/pre_gate_common.sh` | — | — | Shared functions for gate checks |
| `scripts/init_gate_config.sh` | First sprint | — | `.bounce/gate-checks.json` (auto-detect stack) |

### Validation
| Script | When | Input | Output |
|--------|------|-------|--------|
| `scripts/validate_report.mjs` | After any agent report | Report file | PASS/FAIL (YAML frontmatter validation) |
| `scripts/validate_state.mjs` | State changes | state.json | Schema validation |
| `scripts/validate_sprint_plan.mjs` | Sprint setup | Sprint plan file | Structure validation |
| `scripts/validate_bounce_readiness.mjs` | Before bounce | Story ID | Readiness check (spec, criteria, guide, ambiguity) |
| `scripts/verify_framework.mjs` | On demand | — | Framework integrity check |
| `scripts/verify_framework.sh` | On demand | — | Shell wrapper for above |
| `scripts/doctor.mjs` | `vbounce doctor` | — | Health check (templates, skills, scripts, brains) |

### Self-Improvement
| Script | When | Input | Output |
|--------|------|-------|--------|
| `scripts/sprint_trends.mjs` | Sprint close | Archived reports | `.bounce/trends.md` |
| `scripts/post_sprint_improve.mjs` | Sprint close | Sprint Report, LESSONS.md, trends | `.bounce/improvement-manifest.json` |
| `scripts/suggest_improvements.mjs` | Sprint close | Improvement manifest | `.bounce/improvement-suggestions.md` |

### Utilities
| Script | When | Input | Output |
|--------|------|-------|--------|
| `scripts/hotfix_manager.sh` | Hotfix lifecycle | Subcommand (audit/sync/ledger) | Hotfix ledger, worktree sync |
| `scripts/vdoc_match.mjs` | Context prep | Story ID, manifest | JSON/markdown context with matched docs |
| `scripts/vdoc_staleness.mjs` | Sprint close | Sprint ID | `.bounce/scribe-task-S-XX.md` (stale doc list) |

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
Roadmap §5 (Constraints) ───────→ Delivery Plan (sprint capacity)

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
| Roadmap §2 (Release Plan) | Delivery Plan sprint goals |
| Roadmap §3 (ADR) | All Stories referencing that ADR |
| Epic §2 (Scope) | All child Stories §1 |
| Epic §4 (Technical Context) | All child Stories §3 |
| Spike §4/§5 (Findings/Decision) | Epic §4, Epic §8, Risk Registry |
| Any `brains/` or `skills/` file | `brains/CHANGELOG.md` + this manifest |

---

## 8. Runtime Directories

These directories are created during project execution, not part of the framework distribution.

| Directory | Purpose | Created By |
|-----------|---------|-----------|
| `product_plans/strategy/` | Charter, Roadmap, Risk Registry, Delivery Plan (frozen during sprints) | Phase 1 (Planning) |
| `product_plans/backlog/` | Epics and unassigned Stories | Phase 1 (Planning) |
| `product_plans/sprints/` | Active sprint workspace | Phase 2 (Sprint Planning) |
| `product_plans/hotfixes/` | Emergency L1 fixes | Phase 3 (Hotfix Path) |
| `product_plans/archive/` | Completed sprints and epics (immutable) | Phase 4 (Review) |
| `.bounce/` | Sprint state, reports, improvement artifacts | `vbounce sprint init` |
| `.bounce/reports/` | Active bounce reports (gitignored) | Agents during Phase 3 |
| `.bounce/archive/S-{XX}/` | Archived reports per sprint (committed) | DevOps after merge |
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
| `docs/agent-skill-profiles.docx` | Framework maintainers | Agent capability profiles |
| `docs/vbounce-os-manual.docx` | All users | Comprehensive V-Bounce manual |

---

## 11. CLI Entry Point

| File | Purpose |
|------|---------|
| `bin/vbounce.mjs` | Main CLI — `npx vbounce install`, `vbounce sprint init`, `vbounce doctor`, etc. |

---

## File Count Summary

| Category | Count |
|----------|-------|
| Root files | 11 |
| Brain files | 15 |
| Templates | 10 |
| Skills (SKILL.md + references) | 46 |
| React rules | 57 |
| Scripts | 24 |
| Diagrams | 6 |
| Docs | 3 |
| CLI | 1 |
| Runtime/marketing/misc | 8 |
| **Total** | **~162** |
