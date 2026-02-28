<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-4.

1. **Header**: Set Status, link to Roadmap and Delivery Plan
2. **§1 Active Risks**: Table of open risks with phase, source, likelihood, impact, mitigation
3. **§2 Risk Analysis Log**: Phase-stamped entries appended on state transitions
4. **§3 Closed Risks**: Resolved/mitigated risks moved here
5. **§4 Change Log**: Auto-appended on updates

Risk Levels:
- Likelihood: Low / Medium / High
- Impact: Low / Medium / High / Critical

Risk Statuses: Open → Mitigating → Mitigated → Closed / Accepted

Output location: `product_plans/RISK_REGISTRY.md`

Document Hierarchy Position: LEVEL 6 — CROSS-CUTTING
Charter (why) → Roadmap (strategic what/when) → Epic (detailed what) → Story (how) → Delivery Plan (execution) → **Risk Registry** (risks)

This document is fed by ALL levels of the hierarchy:
- Charter §6 Constraints → initial strategic risks
- Roadmap §4 Dependencies → integration and external service risks
- Roadmap §5 Strategic Constraints → capacity, budget, deadline risks
- Epic §6 Risks & Edge Cases → feature-level risks
- Delivery Plan sprint transitions → trigger Risk Analysis Log entries (§2)
- Architect Agent's Deep Audit findings → may surface new risks

The Risk Registry is reviewed by the Team Lead at sprint boundaries and by the Architect Agent during Deep Audit reviews.

Do NOT output these instructions.
</instructions>

# Risk Registry: {Project Name}

---

> **Last Updated**: {YYYY-MM-DD}
> **Status**: Active / Archived
> **Roadmap**: `product_plans/{project}_roadmap.md`

---

## 1. Active Risks

| ID | Risk | Phase | Source | Likelihood | Impact | Mitigation | Owner | Status |
|----|------|-------|--------|------------|--------|------------|-------|--------|
| R-001 | {Risk description} | {Verification/Bounce/Review} | {EPIC-XXX or STORY-XXX-YY} | Low/Medium/High | Low/Medium/High/Critical | {Mitigation strategy} | {Owner} | Open |

**Summary**: {X} Active | {Y} Mitigating | {Z} Accepted

---

## 2. Risk Analysis Log

> Phase-stamped entries. Each entry is appended when a document transitions between V-Bounce phases.

### {YYYY-MM-DD} — Phase: {Verification / Bounce / Review} ({Sprint S-XX})
**Trigger**: {What caused this analysis — e.g., "Sprint 1 stories moved to Ready to Bounce"}
**Documents Analyzed**: {List of docs reviewed}

**New Risks Identified**:
- R-{NNN}: {Risk description} — Source: {doc reference}

**Risks Updated**:
- R-{NNN}: {Status change and reason}

**Risks Resolved**:
- R-{NNN}: {Resolution description}

**Recommendation**: {Action items if any}

---

## 3. Closed Risks

| ID | Risk | Resolution | Phase Closed | Closed Date |
|----|------|------------|--------------|-------------|
| R-{NNN} | {Risk description} | {How it was resolved} | {Phase} | {YYYY-MM-DD} |

---

## 4. Change Log

<!-- Auto-appended when Risk Registry is updated -->

| Date | Change | By |
|------|--------|-----|
| {YYYY-MM-DD} | Initial creation | Architect |
