<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-4.

1. **Metadata Table**: Parent Epic, Status, Ambiguity, Actor, Complexity, Complexity Label
2. **§1 The Spec**: User Story (As a... I want... So that...) + Detailed Requirements
3. **§2 The Truth**: Gherkin acceptance criteria + manual verification steps
4. **§3 Implementation Guide**: Files to modify, technical logic, API contract
5. **§4 Definition of Done**: Checklist (compiles, tests pass, linting, docs)

Ambiguity Score:
- 🔴 High: Requirements unclear
- 🟡 Medium: Logic clear, files TBD
- 🟢 Low: Ready for coding

Output location: `product_plans/{delivery}/EPIC-{NNN}_{epic_name}/STORY-{EpicID}-{StoryID}.md`
(Stories live inside their parent Epic folder — a Story never exists without an Epic.)

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
- Delivery Plan §3 Active Sprint tracks story V-Bounce state
- Delivery Plan §5 Context Pack Status tracks per-story readiness using this template's sections

Agent handoff sections:
- §1 The Spec → Human contract (PM/BA writes, Dev reads)
- §2 The Truth → QA contract (BA writes, QA Agent executes)
- §3 Implementation Guide → AI-to-AI instructions (Architect writes, Dev Agent executes)

Do NOT output these instructions.
</instructions>

# STORY-{EpicID}-{StoryID}: {Story Name}

## Metadata

| Field | Value |
|-------|-------|
| **Parent Epic** | [EPIC-{ID}: {Name}](link) |
| **Status** | Draft / Refinement / Probing/Spiking / Ready to Bounce / Bouncing / QA Passed / Architect Passed / Sprint Review / Done / Escalated / Parking Lot |
| **Ambiguity** | 🔴 High / 🟡 Medium / 🟢 Low |
| **Context Source** | Epic §{section} / Codebase / User Input |
| **Actor** | {Persona Name} |
| **Complexity** | Small (1 file) / Medium (2-3 files) / Large (Refactor needed) |
| **Complexity Label** | L1 / L2 / L3 / L4 (default: L2) |

### Complexity Labels (Sprint Planning)

- **L1**: Trivial — Single file, <1hr vibe time, known pattern
- **L2**: Standard — 2-3 files, known pattern, ~2-4hr vibe time *(default)*
- **L3**: Complex — Cross-cutting, spike may be needed, ~1-2 days
- **L4**: Uncertain — Requires Probing/Spiking before Bounce, >2 days

This story is labeled: **{L1/L2/L3/L4}**

---

## 1. The Spec (The Contract)
> Human-Readable Requirements. The "What".
> Target Audience: PM, BA, Stakeholders, Developer Agent.

### 1.1 User Story
> As a **{Persona}**,
> I want to **{Action}**,
> So that **{Benefit}**.

### 1.2 Detailed Requirements
- **Requirement 1**: {Specific behavior, e.g., "The button must be disabled until..."}
- **Requirement 2**: {Specific data, e.g., "The field accepts only valid UUIDs."}
- **Requirement 3**: {UI state, e.g., "Show a spinner while loading."}

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

### 2.2 Verification Steps (Manual/Mob)
- [ ] Verify visual alignment with Design System.
- [ ] Check mobile responsiveness.

---

## 3. The Implementation Guide (AI-to-AI)
> Instructions for the Developer Agent. The "How".
> Target Audience: Developer Agent (with react-best-practices + lesson skills).

### 3.1 Context & Files
| Item | Value |
|------|-------|
| **Primary File** | `{filepath/to/main/component.ts}` |
| **Related Files** | `{filepath/to/api/service.ts}`, `{filepath/to/types.ts}` |
| **New Files Needed** | Yes/No — `{Name of file}` |
| **ADR References** | ADR-{NNN} from Roadmap §3 |

### 3.2 Technical Logic
- {Describe the logic flow, e.g., "Use the existing useAuth hook to check permissions."}
- {Describe state management, e.g., "Store the result in the global Zustand store."}

### 3.3 API Contract (If applicable)
```json
// Expected Request
POST /api/resource
{
  "id": "string",
  "value": number
}

// Expected Response
200 OK
{
  "id": "string",
  "status": "created"
}
```

---

## 4. Definition of Done (The Gate)
- [ ] Code compiles without errors.
- [ ] New Unit Tests are written and passing.
- [ ] All Acceptance Criteria (§2.1) pass.
- [ ] Linting rules passed.
- [ ] LESSONS.md consulted before implementation.
- [ ] No violations of Roadmap ADRs.
- [ ] Documentation (API/Tech Stack) updated.
