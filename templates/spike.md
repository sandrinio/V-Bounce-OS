<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-8.

1. **YAML Frontmatter**: Spike ID, Parent Epic, Parent Story (optional), Status, Ambiguity Before, Time Box, Owner, Tags, Created
2. **§1 Question**: The specific unknown to resolve
3. **§2 Constraints**: Time box, scope limits, what is NOT being investigated
4. **§3 Approach**: Investigation method
5. **§4 Findings**: Evidence, data, observations discovered
6. **§5 Decision**: Choice made + rationale + alternatives rejected
7. **§6 Residual Risk**: What's still uncertain after the spike
8. **§7 Affected Documents**: Checklist of upstream/downstream docs to update on close
9. **§8 Change Log**: Modification history

Spike Statuses: Open → Investigating → Findings Ready → Validated → Closed

Output location: `product_plans/backlog/EPIC-{NNN}_{name}/SPIKE-{EpicID}-{NNN}-{topic}.md`

Document Hierarchy Position: LEVEL 3.5 (Charter → Roadmap → Epic → **Spike** / Story)
Spikes are children of Epics, siblings of Stories. They travel with their Epic folder (archiving is automatic).

Upstream sources:
- §1 Question derives from parent Epic §8 Open Questions (blocking items)
- §3 Approach references parent Epic §4 Technical Context
- Roadmap §3 ADRs informs existing architectural decisions

Downstream consumers:
- §4 Findings → parent Epic §4 Technical Context (update with new knowledge)
- §5 Decision → Roadmap §3 ADRs (if architectural decision)
- §6 Residual Risk → Risk Registry §1 Active Risks (if new risk identified)
- §5 Decision → parent Story §3 Implementation Guide (if story-level spike)

Agent handoff:
- Team Lead creates the spike from template, links to Epic §9
- Developer investigates (fills §4 Findings and §5 Decision)
- Architect validates findings against Safe Zone (Findings Ready → Validated)
- Team Lead propagates findings to affected documents (Validated → Closed)

Do NOT output these instructions.
</instructions>

---
spike_id: "SPIKE-{EpicID}-{NNN}-{topic}"
parent_epic_ref: "EPIC-{ID}"
parent_story_ref: "(optional — omit for epic-level spikes)"
status: "Open / Investigating / Findings Ready / Validated / Closed"
ambiguity_before: "🔴 High / 🟡 Medium"
time_box: "e.g., 4 hours / 1 day"
owner: "Developer / Architect"
tags: []
created: "YYYY-MM-DD"
---

# SPIKE-{EpicID}-{NNN}: {Topic}

## 1. Question
> The specific unknown to resolve. Derived from Epic §8 Open Questions.

{What exactly do we need to find out? Frame as a single, concrete question.}

---

## 2. Constraints
> What boundaries apply to this investigation.

| Constraint | Value |
|------------|-------|
| **Time Box** | {e.g., 4 hours / 1 day} |
| **Scope Limit** | {What IS being investigated} |
| **Out of Scope** | {What is NOT being investigated — prevents scope creep} |

---

## 3. Approach
> How the investigation will be conducted.

**Method:** {Code exploration / Prototyping / Benchmarks / Doc research / Proof of concept}

### Steps
1. {First investigation step}
2. {Second investigation step}
3. {Third investigation step}

---

## 4. Findings
> Evidence, data, and observations discovered during investigation.
> Filled by the Developer during the Investigating phase.

### Evidence
- {Observation 1 — with data or code references}
- {Observation 2}

### Data
| Metric | Value | Notes |
|--------|-------|-------|
| {e.g., Response time} | {value} | {context} |

---

## 5. Decision
> Choice made based on findings. Becomes an ADR if architectural.

### Chosen Approach
{What we decided to do and why.}

### Alternatives Rejected
| Alternative | Why Rejected |
|-------------|--------------|
| {Option A} | {Reason} |
| {Option B} | {Reason} |

### ADR Required?
- [ ] Yes — create ADR in Roadmap §3 (decision affects architecture)
- [ ] No — decision is implementation-level only

---

## 6. Residual Risk
> What's still uncertain after the spike. Feeds Risk Registry if non-trivial.

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {Remaining unknown} | {Low/Medium/High} | {description} | {how to manage} |

---

## 7. Affected Documents
> Checklist of upstream/downstream docs to update when closing this spike.
> ALL items must be checked before spike status can move to Closed.

- [ ] Epic §4 Technical Context — update with findings
- [ ] Epic §8 Open Questions — mark resolved
- [ ] Epic §9 Artifact Links — add spike reference
- [ ] Roadmap §3 ADRs — if architectural decision (see §5)
- [ ] Risk Registry §1 — if new risk identified (see §6)
- [ ] Story §3 Implementation Guide — if story-level spike

---

## 8. Change Log
| Date | Author | Change |
|------|--------|--------|
| {YYYY-MM-DD} | {name} | Created spike |
