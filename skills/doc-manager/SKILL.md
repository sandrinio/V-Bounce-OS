---
name: doc-manager
description: "Use when creating, modifying, or navigating V-Bounce Engine planning documents. Trigger on any request to create a charter, roadmap, epic, story, delivery plan, sprint plan, or risk registry — or when the user asks to update, refine, decompose, or transition documents between phases. Also trigger when the user asks about work status, backlog, what's next, what's blocked, or wants to plan/start a sprint. This skill manages the full document lifecycle from Charter through Sprint Planning and execution."
---

# Document Hierarchy Manager

## Purpose

This skill is the navigation system for V-Bounce Engine planning documents. It knows the full document hierarchy, what each template contains, where to find templates, and the rules for creating, modifying, and transitioning documents between phases.

**Core principle:** No document exists in isolation. Every document inherits context from upstream and feeds downstream consumers. YOU MUST read upstream documents before creating any new document.

## Trigger

`/doc-manager` OR `/doc [document-type]` OR when any planning document needs to be created, modified, or transitioned.

## Announcement

When using this skill, state: "Using doc-manager to handle document operations."

## The Document Hierarchy

```
LEVEL 1: Charter          — WHY are we building this?
LEVEL 2: Roadmap          — WHAT are we shipping strategically and WHAT bets are we making?
LEVEL 3: Epic             — WHAT exactly is each feature?
LEVEL 4: Story            — HOW does each piece get built?
LEVEL 5: Delivery Plan    — WHEN and in what ORDER do stories execute?
LEVEL 6: Risk Registry    — WHAT could go wrong? (cross-cutting, fed by all levels)

***HOTFIX PATH (L1 Trivial Tasks Only)***
Hotfixes bypass LEVELS 3 and 4 directly into the Delivery Plan execution.
```

### Information Flow

```
Charter §1.1 (What It Is) ──→ Roadmap §1 (Strategic Context)
Charter §2 (Design Principles) ──→ ALL agents (decision tiebreaker)
Charter §3 (Architecture) ──→ Roadmap §3 (ADRs)
Charter §5 (Key Workflows) ──→ Epic §1 (Problem & Value)
Charter §6 (Constraints) ──→ Roadmap §5 (Strategic Constraints)

Roadmap §2 (Release Plan) ──→ Epic Metadata (Release field)
Roadmap §3 (ADRs) ──→ Story §3.1 (ADR References)
Roadmap §4 (Dependencies) ──→ Risk Registry §1 (Active Risks)
Roadmap §5 (Constraints) ──→ Delivery Plan (sprint capacity)

Epic §2 (Scope Boundaries) ──→ Story §1 (The Spec)
Epic §4 (Technical Context) ──→ Story §3 (Implementation Guide)
Epic §5 (Decomposition) ──→ Codebase research scope + Story creation sequence
Epic §6 (Risks) ──→ Risk Registry §1 (Active Risks)
Epic §7 (Acceptance Criteria) ──→ Story §2 (The Truth)
Epic §9 (Artifact Links) ──→ Delivery Plan §3 (Backlog)

Story §1 (The Spec) ──→ Developer Agent
Story §2 (The Truth) ──→ QA Agent
Story §3 (Implementation Guide) ──→ Developer Agent
Story status ──→ Sprint Plan §1 (V-Bounce State) [NOT Delivery Plan — see delivery-sync.md]

Sprint Plan §1 (Active Scope) ──→ Team Lead Agent (source of truth during sprint)
Sprint Plan §1 (Context Pack Readiness) ──→ Ready to Bounce gate
Delivery Plan ──→ Updated at sprint boundaries ONLY (never mid-sprint)

Risk Registry ←── ALL levels (cross-cutting input)

Epic §8 (Open Questions) ──→ Spike §1 (Question)
Epic §4 (Technical Context) ──→ Spike §3 (Approach)
Spike §4 (Findings) ──→ Epic §4 (Technical Context) [update]
Spike §5 (Decision) ──→ Roadmap §3 (ADRs) [if architectural]
Spike §6 (Residual Risk) ──→ Risk Registry §1 (Active Risks)
```

## Template Locations

| Document | Template Path | Output Location |
|----------|---------------|-----------------|
| Charter | `templates/charter.md` | `product_plans/strategy/{project}_charter.md` |
| Roadmap | `templates/roadmap.md` | `product_plans/strategy/{project}_roadmap.md` |
| Risk Registry | `templates/risk_registry.md` | `product_plans/strategy/RISK_REGISTRY.md` |
| Delivery Plan | `templates/delivery_plan.md` | `product_plans/strategy/{delivery}_delivery_plan.md` |
| Sprint Plan | `templates/sprint.md` | `product_plans/sprints/sprint-{XX}/sprint-{XX}.md` |
| Epic | `templates/epic.md` | `product_plans/backlog/EPIC-{NNN}_{name}/EPIC-{NNN}_{name}.md` |
| Story | `templates/story.md` | `product_plans/backlog/EPIC-{NNN}_{name}/STORY-{EpicID}-{StoryID}-{StoryName}.md` |
| Spike | `templates/spike.md` | `product_plans/backlog/EPIC-{NNN}_{name}/SPIKE-{EpicID}-{NNN}-{topic}.md` |
| Hotfix | `templates/hotfix.md` | `product_plans/hotfixes/HOTFIX-{Date}-{Name}.md` |
| Sprint Report | `templates/sprint_report.md` | `product_plans/sprints/sprint-{XX}/sprint-report.md` |

### Product Plans Folder Structure (State-Based)

```
product_plans/
├── strategy/                      ← high-level, frozen during sprints
│   ├── charter.md
│   ├── roadmap.md
│   ├── delivery_plan.md           ← release timelines
│   └── risk_registry.md
│
├── backlog/                       ← planned but NOT active
│   ├── EPIC-001_authentication/
│   │   ├── EPIC-001_authentication.md
│   │   ├── STORY-001-01-login_ui.md
│   │   ├── STORY-001-02-auth_api.md
│   │   └── SPIKE-001-001-auth-provider.md
│
├── sprints/                       ← active execution workspace
│   ├── sprint-01/                 ← active sprint boundary
│   │   ├── sprint-01.md           ← Sprint Plan
│   │   └── STORY-001-01-login_ui.md       ← (moved here during sprint setup)
│
├── hotfixes/                      ← emergency tasks bypassing sprints
│   └── HOTFIX-20260306-db_crash.md
│
└── archive/                       ← immutable history
    ├── sprints/
    │   └── sprint-01/             ← (whole sprint folder moved here when closed)
    │       ├── sprint-01.md
    │       ├── STORY-001-01-login_ui.md
    │       └── sprint-report.md   
    └── epics/
        └── EPIC-001_authentication/       ← (moved here only when 100% complete)
```

**Key rules:**
- `strategy/` documents are project-level and frozen while a sprint is active.
- `backlog/` contains Epics and their unassigned child Stories.
- `sprints/` contains active 1-week execution boundaries. A Story file physically moves here when a sprint begins.
- `archive/` is where finished Sprints and finished Epics are moved for permanent record keeping.

### V-Bounce Engine Framework Structure

```
V-Bounce Engine/
├── brains/          — Agent brain files for each AI coding tool
│   ├── CLAUDE.md        — Claude Code brain
│   ├── AGENTS.md        — Codex CLI brain
│   ├── GEMINI.md        — Gemini CLI / Antigravity brain
│   ├── cursor-rules/    — Cursor modular .mdc rules
│   └── SETUP.md         — Deployment guide
├── templates/       — Document templates (immutable during execution)
├── skills/          — Agent skills (SKILL.md files + references)
├── scripts/         — Automation scripts (e.g., hotfix_manager.sh)
└── docs/            — Reference docs (e.g., HOTFIX_EDGE_CASES.md)
```

### Brain File Deployment

When initializing a new project, deploy the correct brain file for the AI coding tool in use:

| Tool | Source | Deploy To |
|------|--------|-----------|
| Claude Code | `brains/CLAUDE.md` | Project root as `CLAUDE.md` |
| Codex CLI | `brains/AGENTS.md` | Project root as `AGENTS.md` |
| Cursor | `brains/cursor-rules/*.mdc` | `.cursor/rules/` |
| Gemini CLI | `brains/GEMINI.md` | Project root as `GEMINI.md` |
| Antigravity | `brains/GEMINI.md` | Project root + copy `skills/` to `.agents/skills/` |

Brain files contain the V-Bounce process, critical rules, and skill references. Each tool's brain file is self-contained and authoritative. When updating V-Bounce Engine rules, update each brain file directly and keep them in sync.

## Document Operations

### Ambiguity Assessment Rubric

When creating or reviewing an Epic or Story, assess ambiguity using these signals:

**🔴 High — Discovery Required (any ONE triggers 🔴):**
- Epic §4 Technical Context has "TBD" or "unknown" in dependencies or affected areas
- Epic §8 Open Questions has items marked blocking
- Multiple competing approaches mentioned with no ADR deciding between them
- Unknown external dependencies or integrations
- No acceptance criteria defined (Epic §7 empty)
- Vague scope language in §2 ("various", "possibly", "might", "somehow", "rethink")

**🟡 Medium — Conditional Progress:**
- Technical Context partially filled (some areas known, others TBD)
- Open Questions exist but are non-blocking
- Dependencies listed but unconfirmed

**🟢 Low — Ready to Proceed:**
- All sections filled with specific, concrete content
- All Open Questions resolved or non-blocking
- ADRs exist for every major technical choice
- Acceptance criteria are concrete Gherkin scenarios

**When 🔴 is detected:**
1. Set `ambiguity: 🔴 High` in frontmatter
2. Identify which signals triggered it
3. For each signal, recommend a spike with a one-sentence question
4. Create spike documents from `templates/spike.md`
5. Block downstream transitions until spikes reach Validated or Closed

### CREATE — Making a New Document

Before creating any document, YOU MUST:

1. Identify the document type and its level in the hierarchy
2. Read ALL upstream documents that feed into it
3. Copy the template from the template location
4. Fill sections by pulling from upstream sources (see Information Flow above)
5. Set the Ambiguity Score based on completeness
6. Verify all cross-references are valid

**Pre-read requirements by document type:**

| Creating | MUST read first |
|----------|-----------------|
| Charter | Nothing — Charter is root. Gather from user input. |
| Roadmap | Charter (full document) |
| Epic | Charter §1, §2, §5 + Roadmap §2, §3, §5 + **Codebase** (explore affected areas for §4) |
| Story | Parent Epic (full document) + Roadmap §3 (ADRs) + Codebase (affected files) |
| Spike | Parent Epic (full document) + Roadmap §3 (ADRs) + Risk Registry |
| Sprint Plan | All candidate stories + Risk Registry + Archive (completed work) + Backlog state |
| Delivery Plan | Roadmap §2 (Release Plan) + All Stories in scope |
| Risk Registry | Charter §6 + Roadmap §4, §5 + All Epic §6 sections |

### MODIFY — Updating an Existing Document

When modifying a document:

1. **Sprint Freeze Check:** Read `sprint-XX.md` (if one exists in `product_plans/sprints/`). If a sprint is currently Active, the Charter and Roadmap are **FROZEN**. DO NOT modify them directly. 
   - ***Emergency Impact Analysis Protocol:*** If a human insists on modifying a frozen strategic document mid-sprint, you MUST pause active bouncing and write a Sprint Impact Analysis Report. Evaluate the active stories in `sprint-{XX}.md` against the new strategy to determine if they are: Unaffected, Require Scope Adjustment, or Invalidated. Only Invalidated stories are aborted. Update the documents only after the human approves the Impact Analysis.
2. Read the document being modified
3. Read upstream documents if the change affects inherited fields
4. Make the change
5. Check if the change cascades downstream — if so, flag affected documents
6. Append to the document's Change Log

**Cascade rules:**

| If you change... | Then also update... |
|------------------|---------------------|
| Charter §1 (Identity) | Roadmap §1 (Strategic Context) |
| Charter §2 (Design Principles) | Nothing — but notify all agents |
| Charter §3 (Tech Stack) | Roadmap §3 (ADRs) |
| Roadmap §2 (Release Plan) | Delivery Plan sprint goals |
| Roadmap §3 (ADR) | All Stories referencing that ADR in §3.1 |
| Epic §2 (Scope) | All child Stories §1 (The Spec) |
| Epic §4 (Technical Context) | All child Stories §3 (Implementation Guide) |
| Story status (V-Bounce State) | Delivery Plan §3 (Active Sprint table) |
| Story — new risk discovered | Risk Registry §1 (new row) |
| Spike §4/§5 (Findings/Decision) | Epic §4 Technical Context, Epic §8 Open Questions, Risk Registry §1 |
| Spike §5 (Decision — architectural) | Roadmap §3 ADRs (new row) |

### DECOMPOSE — Breaking Down Documents

**Epic → Stories:**

Stories are NOT created by mechanically splitting epic sections by category. The AI must analyze the epic, research the actual codebase, and produce small, focused stories — each delivering a tangible, independently verifiable result.

#### Phase 1: Analyze & Research

1. Read the full Epic document (all sections)
2. Read Roadmap §3 (ADRs) for architecture constraints
3. **Research the codebase** — this is mandatory, not optional:
   - Read every file listed in Epic §4 Affected Areas
   - Explore the surrounding code to understand current architecture, patterns, and conventions
   - Identify actual dependencies, imports, and integration points in the code
   - Note existing tests, utilities, and shared modules that stories will interact with
4. Build a mental model of what needs to change and in what order

#### Phase 2: Draft Stories by Deliverable, Not by Category

Do NOT create stories by layer (one for schema, one for API, one for UI). Instead, create stories by **tangible outcome** — each story should deliver a small, specific, working result that can be verified.

**Story sizing rules:**
- Each story has **one clear goal** expressible in a single sentence
- Each story touches **1-3 files** (if more, it needs splitting)
- Each story produces a **verifiable result** — something you can see, test, or demonstrate
- Each story is **independently meaningful** — it delivers value or unlocks the next story, not just "part of a layer"
- Prefer vertical slices (thin end-to-end) over horizontal slices (full layer)

**If a drafted story exceeds size:**
- Ask: "Can this be split into two stories that each produce a tangible result?"
- If yes → split it. Each sub-story must still have its own clear goal.
- If no (the work is inherently atomic) → keep it as one story, label it L3, and document why it can't be smaller.

#### Phase 3: Write Stories with Codebase-Informed Detail

For each story, use what you learned from codebase research:
- §1 The Spec: Write requirements informed by actual code state (not just epic abstractions)
- §2 The Truth: Write Gherkin scenarios that reference real components, routes, and data shapes found in the code
- §3 Implementation Guide: Reference actual file paths, existing patterns, real function signatures — not placeholders. The developer should be able to start coding immediately.
- Set Complexity Label (L1-L4) based on actual code complexity discovered during research

#### Phase 4: Link & Update

1. Link all created Stories back in Epic §9 Artifact Links
2. Update Delivery Plan §3 High-Level Backlog with new stories

### SPRINT PLANNING — Preparing a Sprint

Sprint Planning is a collaborative process between AI and human. No sprint starts without a confirmed Sprint Plan.

**Workflow:**

1. **Read current state:**
   - Scan `product_plans/backlog/` — read all epic and story frontmatter (status, priority, ambiguity, complexity_label, open questions)
   - Scan `product_plans/archive/` — understand what's already shipped and what context carries forward
   - Read `product_plans/strategy/RISK_REGISTRY.md` — identify risks affecting candidate stories
   - If `vdocs/_manifest.json` exists, read it for documentation context

2. **Propose sprint scope:**
   - Select stories based on priority, dependencies, and capacity
   - Identify dependency chains — stories with `Depends On:` must be sequenced
   - Group parallel-safe stories into phases
   - Flag stories with 🔴 High ambiguity — these CANNOT enter the sprint without completed spikes

3. **Surface blockers to the human:**
   - Open questions from epics (§8) and stories that haven't been resolved
   - Environment prerequisites missing from stories
   - Risks from Risk Registry that affect planned stories
   - Edge cases or ambiguity the human may not have considered
   - Dependencies on incomplete work

4. **Collaborate with the human:**
   - Present proposed scope, risks, and blockers
   - Discuss and adjust — add/remove stories, resolve open questions
   - Agree on execution mode per story (Full Bounce vs Fast Track)

5. **Create Sprint Plan:**
   - Create `product_plans/sprints/sprint-{XX}/sprint-{XX}.md` from `templates/sprint.md`
   - Fill §0 Sprint Readiness Gate checklist
   - Fill §1 Active Scope with confirmed stories + Context Pack Readiness
   - Fill §2 Execution Strategy (phases, dependencies, risk flags)
   - Fill §3 Sprint Open Questions (all must be resolved or non-blocking)
   - Set status: `Planning`

6. **Gate — Human confirms:**
   - Present finalized plan to human
   - Explicitly ask for confirmation
   - On confirmation: set `status: Confirmed`, fill `confirmed_by` and `confirmed_at`
   - Move story files from `product_plans/backlog/EPIC-{NNN}/` to `product_plans/sprints/sprint-{XX}/`
   - Sprint is now ready for Phase 3 (Execution)

### TRANSITION — Moving Documents Between Phases

**Ambiguity gates (must pass before transitioning):**

| Transition | Gate |
|------------|------|
| Charter → Ready for Roadmap | Ambiguity 🟡 or 🟢 (§1 and §5 filled) |
| Roadmap → Ready for Epics | Charter Ambiguity 🟢 + Roadmap §2 and §3 filled |
| Epic → Ready for Stories | Ambiguity 🟡 or 🟢 (§2 Scope and §4 Tech Context filled) |
| Story → Ready to Bounce | Ambiguity 🟢 + ALL Context Pack items checked (Sprint Plan §1) |
| Sprint Plan → Confirmed | §0 Readiness Gate checklist complete + Human explicitly confirms |
| Sprint Plan → Active | Status is Confirmed (human approval obtained) |
| Story (Probing/Spiking) → Refinement | All linked spikes are Validated or Closed |
| Spike → Validated | Architect confirms findings against Safe Zone |
| Spike → Closed | All items in §7 Affected Documents are checked off |
| Hotfix → Bouncing | Complexity strictly L1 + Targets 1-2 files |

**Physical Move Rules for State Transitions:**

- **Sprint Setup Phase**: The Team Lead physically MOVES the `STORY-XXX.md` file from `product_plans/backlog/EPIC-XXX/` to `product_plans/sprints/sprint-{XX}/`. 
- **Sprint Closure Phase**: The Team Lead physically MOVES the entire sprint folder (`sprints/sprint-{XX}/`) to `product_plans/archive/sprints/sprint-{XX}/`. 
- **Epic Closure**: Once every story attached to an Epic has been archived, the Epic folder itself is moved from `backlog/` to `archive/epics/`.

**V-Bounce State transitions for Stories:**

```
Draft → Refinement: Story template created, being filled
Refinement → Probing/Spiking: L4 stories only, spike needed
Probing/Spiking → Refinement: Spike complete, back to refinement
Refinement → Ready to Bounce: Ambiguity 🟢, Context Pack complete
Ready to Bounce → Bouncing: Team Lead activates Dev Agent
Bouncing → QA Passed: QA Validation Report passes
QA Passed → Architect Passed: Architect Audit Report passes
Architect Passed → Sprint Review: DevOps merges story, all gates clear
Sprint Review → Done: Human review accepted
Bouncing → Escalated: 3+ bounce failures
Any → Parking Lot: Deferred by decision

***HOTFIX TRANSITIONS***
Draft → Bouncing: Hotfix template created + Triage confirmed L1
Bouncing → Done: Dev implements + Human manually verifies + DevOps runs `hotfix_manager.sh sync`
```

## Agent Integration

| Agent | Documents Owned | Documents Read |
|-------|----------------|----------------|
| **Team Lead** | Delivery Plan, Sprint Report, Delivery archive | Charter, Roadmap, ALL Stories (for context packs) |
| **Developer** | Story §3 updates (during implementation), Spike §4 Findings (during investigation) | Story §1 + §3, Spike §1 + §2 + §3, LESSONS.md |
| **QA** | QA Validation Report | Story §2, Dev Implementation Report |
| **Architect** | Architectural Audit Report, Risk flags (in report — Lead writes to Registry), Spike validation (Findings Ready → Validated) | Full Story, Spike §4 + §5, Roadmap §3 ADRs, Risk Registry |
| **DevOps** | DevOps Reports (merge + release) | Delivery Plan, LESSONS.md, gate reports |
| **Scribe** | Product documentation, _manifest.json | Sprint Report, Dev Reports, codebase |
| **PM/BA (Human)** | Charter, Roadmap, Epic, Story §1 + §2 | Everything |

## Sprint Archiving

When a sprint is complete:

1. Team Lead moves the entire sprint folder to the archive:
   ```bash
   mv product_plans/sprints/sprint-{XX}/ product_plans/archive/sprints/sprint-{XX}/
   ```
2. Team Lead checks the parent Epics of the completed stories. If an Epic is now 100% complete (all its stories are in the archive), the Team Lead moves the Epic folder:
   ```bash
   mv product_plans/backlog/EPIC-{NNN}_{name}/ product_plans/archive/epics/EPIC-{NNN}_{name}/
   ```
3. Team Lead updates the Epic tracking checklists to reflect the newly archived states.

## Critical Rules

- **Read before write.** ALWAYS read upstream documents before creating or modifying any document. No exceptions.
- **Cascade before closing.** When modifying a document, check cascade rules before marking the change complete.
- **Ambiguity gates are hard.** Do NOT allow a document to transition to the next phase if its Ambiguity Score doesn't meet the gate threshold.
- **Templates are immutable.** Never modify the template files themselves during project execution. Use write-skill for template evolution during retrospectives.
- **One source of truth.** If information exists in an upstream document, reference it — do not duplicate it. Duplication creates drift.
- **Change Logs are mandatory.** Every modification to any document MUST be recorded in that document's Change Log section.

## Keywords

charter, roadmap, epic, story, delivery plan, risk registry, sprint plan, sprint planning, document hierarchy, template, create document, update document, decompose epic, story breakdown, ambiguity score, context pack, V-Bounce state, phase transition, cascade update, planning documents, backlog, what's next, what's blocked, start sprint
