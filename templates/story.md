<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-4.

1. **YAML Frontmatter**: Story ID, Parent Epic, Status, Ambiguity, Context Source, Actor, Complexity Label
2. **§1 The Spec**: Problem Statement or User Story + Detailed Requirements + Out of Scope
3. **§2 The Truth**: Gherkin acceptance criteria + verification steps
4. **§3 Implementation Guide**: Files to modify, technical logic, API contract
5. **§4 Quality Gates**: Minimum test expectations + Definition of Done checklist
6. **Token Usage**: Table auto-populated by agents — each agent appends their row via `count_tokens.mjs --self --append`

Ambiguity Score:
- 🔴 High: Requirements unclear
- 🟡 Medium: Logic clear, files TBD
- 🟢 Low: Ready for coding

Complexity Labels:
- **L1**: Trivial — Single file, <1hr vibe time, known pattern
- **L2**: Standard — 2-3 files, known pattern, ~2-4hr vibe time *(default)*
- **L3**: Complex — Cross-cutting, spike may be needed, ~1-2 days
- **L4**: Uncertain — Requires Probing/Spiking before Bounce, >2 days

Output the complexity as a single line: **Complexity: L{N}** — {brief description from above}. Do NOT output the full legend.

§1.1 Format:
- For user-facing stories, use: "As a {Persona}, I want to {Action}, So that {Benefit}."
- For infrastructure/framework stories, a direct problem statement is acceptable: "This story {does X} because {reason}."

§3.4 API Contract: Document EXISTING API contracts the implementation must comply with (current request/response shapes, auth requirements, rate limits). If this story creates a NEW API, describe the required contract. Remove this section entirely if no API changes.

Output location (Draft/Refinement): `product_plans/backlog/EPIC-{NNN}_{epic_name}/STORY-{EpicID}-{StoryID}-{StoryName}.md`

Sprint Lifecycle Rule:
- When a sprint starts, this Story file is MOVED to `product_plans/sprints/sprint-{XX}/`.
- When the sprint completes, this Story file is MOVED to `product_plans/archive/sprints/sprint-{XX}/`.

Document Hierarchy Position: LEVEL 4 (Charter → Roadmap → Epic → **Story**)

Upstream sources:
- §1 The Spec inherits from parent Epic §2 Scope Boundaries
- §3 Implementation Guide references Epic §4 Technical Context and Roadmap §3 ADRs
- Acceptance criteria (§2) refine Epic §7 Acceptance Criteria into per-story scenarios
- Complexity Label aligns with Delivery Plan story label definitions (L1-L4)

Downstream consumers:
- Developer Agent reads §1 The Spec and §3 Implementation Guide (with react-best-practices skill)
- QA Agent reads §2 The Truth to validate implementation (with vibe-code-review skill)
- Architect Agent reads full story context for Safe Zone compliance audit
- Sprint Plan §1 Active Scope tracks story V-Bounce state during the sprint
- Sprint Plan §1 Context Pack Readiness tracks per-story readiness using this template's sections

Agent handoff sections:
- §1 The Spec → Human contract (PM/BA writes, Dev reads)
- §2 The Truth → QA contract (BA writes, QA Agent executes)
- §3 Implementation Guide → AI-to-AI instructions (Architect writes, Dev Agent executes)

Do NOT output these instructions.
</instructions>

---
story_id: "STORY-{EpicID}-{StoryID}-{StoryName}"
parent_epic_ref: "EPIC-{ID}"
status: "Draft / Refinement / Probing/Spiking / Ready to Bounce / Bouncing / QA Passed / Architect Passed / Sprint Review / Done / Escalated / Parking Lot"
ambiguity: "🔴 High / 🟡 Medium / 🟢 Low"
context_source: "Epic §{section} / Codebase / User Input"
actor: "{Persona Name}"
complexity_label: "L1 / L2 / L3 / L4 (default: L2)"
---

# STORY-{EpicID}-{StoryID}: {Story Name}

**Complexity: {L1/L2/L3/L4}** — {brief description}

---

## 1. The Spec (The Contract)
> Human-Readable Requirements. The "What".
> Target Audience: PM, BA, Stakeholders, Developer Agent.

### 1.1 User Story
> As a **{Persona}**,
> I want to **{Action}**,
> So that **{Benefit}**.

### 1.2 Detailed Requirements
- **Requirement 1**: {Specific behavior}
- **Requirement 2**: {Specific data or constraint}
- **Requirement 3**: {Expected state or outcome}

### 1.3 Out of Scope
- {What this story explicitly does NOT do}
- {Deferred to STORY-XXX or future work}

### TDD Red Phase: Yes / No
> "Yes" = Team Lead enforces Red-Green multi-pass. "No" = single-pass Developer spawn.
> Default: Yes for stories with Gherkin scenarios in §2. No for pure config/doc/template changes.

---

## 2. The Truth (Executable Tests)
> The QA Agent uses this to verify the work. If these don't pass, the Bounce failed.
> Target Audience: QA Agent (with vibe-code-review skill).

### 2.1 Acceptance Criteria (Gherkin/Pseudocode)
```gherkin
Feature: {Story Name}

  Scenario: {Happy Path}
    Given {precondition}
    When {user action}
    Then {system response}
    And {database state change}

  Scenario: {Edge Case / Error}
    Given {precondition}
    When {invalid action}
    Then {error message}
```

### 2.2 Verification Steps (Manual)
- [ ] {Story-specific manual checks — adapt to story type}
- [ ] {e.g., "Verify API returns 200 for valid input" or "Verify UI renders correctly on mobile"}

---

## 3. The Implementation Guide (AI-to-AI)
> Instructions for the Developer Agent. The "How".
> Target Audience: Developer Agent (with react-best-practices + lesson skills).

### 3.0 Environment Prerequisites
> Verify these before starting. Do NOT waste a bounce cycle on setup failures.

| Prerequisite | Value | Verified? |
|-------------|-------|-----------|
| **Env Vars** | {e.g., `DATABASE_URL`, `API_KEY`} | [ ] |
| **Services Running** | {e.g., "PostgreSQL on localhost:5432"} | [ ] |
| **Migrations** | {e.g., "Run `npx prisma migrate dev`"} | [ ] |
| **Seed Data** | {e.g., "Run `npm run seed`" or "None"} | [ ] |
| **Dependencies** | {e.g., "`npm install` after pulling latest"} | [ ] |

### 3.1 Test Implementation
- {Identify which test suites need to be created or modified to cover the Acceptance Criteria from §2.1}
- {Include E2E/acceptance tests — not just unit tests. Every Gherkin scenario in §2.1 must have a corresponding test}
- {e.g., "Create `AuthComponent.test.tsx` (unit) + `auth.e2e.test.ts` (acceptance)"}

### 3.2 Context & Files
| Item | Value |
|------|-------|
| **Primary File** | `{filepath/to/main/component.ts}` |
| **Related Files** | `{filepath/to/api/service.ts}`, `{filepath/to/types.ts}` |
| **New Files Needed** | Yes/No — `{Name of file}` |
| **ADR References** | ADR-{NNN} from Roadmap §3 |

### 3.3 Technical Logic
- {Describe the logic flow, e.g., "Use the existing useAuth hook to check permissions."}
- {Describe state management, e.g., "Store the result in the global Zustand store."}

### 3.4 API Contract (If applicable)
> Document existing API contracts the implementation must comply with.
> If this story creates a new API, describe the required contract.
> Remove this section if no API changes.

| Endpoint | Method | Auth | Request Shape | Response Shape |
|----------|--------|------|---------------|----------------|
| {`/api/resource`} | {GET/POST} | {Bearer/None} | {`{ id: string }`} | {`{ status: string }`} |

---

## 4. Quality Gates

### 4.1 Minimum Test Expectations
> Defined during sprint planning. Sets the minimum test bar for this story. QA validates against these.

| Test Type | Minimum Count | Notes |
|-----------|--------------|-------|
| Unit tests | {N} | {e.g., "1 per exported function"} |
| Component tests | {N} | {e.g., "render, interaction, edge case" — for UI stories} |
| E2E / acceptance tests | {N} | {e.g., "1 per Gherkin scenario in §2.1"} |
| Integration tests | {N} | {e.g., "1 per API endpoint" — for backend stories} |

> Guidelines: L1 stories ≥2 tests. L2 stories ≥5 tests. L3/L4 stories: planner defines based on scope.
> If "N/A" for a test type, write "0 — N/A (no {type} in scope)".

### 4.2 Definition of Done (The Gate)
- [ ] TDD enforced per story declaration. If "Yes": Red phase tests written and verified failing before Green phase. All Gherkin scenarios from §2.1 covered.
- [ ] Minimum test expectations (§4.1) met.
- [ ] FLASHCARDS.md + Sprint Context consulted before implementation.
- [ ] No violations of Roadmap ADRs.
- [ ] Environment prerequisites (§3.0) verified before starting.
- [ ] **Framework Integrity**: If `.claude/agents/`, `.vbounce/skills/`, `.vbounce/templates/`, or `.vbounce/scripts/` were modified, log to `.vbounce/CHANGELOG.md`.

---

## Token Usage
> Auto-populated by agents. Each agent runs `node .vbounce/scripts/count_tokens.mjs --self --append <this-file> --name <Agent>` before writing their report.

| Agent | Input | Output | Total |
|-------|-------|--------|-------|
