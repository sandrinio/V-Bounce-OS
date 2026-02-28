<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-7.

1. **Header**: Set Status, link to Roadmap + Risk Registry, Sprint Cadence
2. **§1 Project Window**: Start/End dates, total sprints, team
3. **§2 Sprint Registry**: Table of ALL sprints with goals and status (auto-populated between markers)
4. **§3 Active Sprint**: CURRENT sprint only — goal + assigned stories with L1-L4 labels + V-Bounce state
5. **§4 Backlog**: Prioritized stories not yet assigned to a sprint (includes Escalated + Parking Lot)
6. **§5 Context Pack Status**: Per-story readiness checklist (ONLY for Active Sprint stories)
6b. **§5b Open Questions**: Operational questions that may block active sprint stories
7. **§6 Completed Sprints**: ONE-LINE summaries of finished sprints (full detail in version history)
8. **§7 Change Log**: Auto-appended on updates

Sprint Lifecycle:
- When a sprint completes: update Sprint Registry row to "Completed",
  REPLACE §3 Active Sprint with the next sprint's stories,
  move old sprint summary to §6 Completed Sprints (one row, not full detail).
- Full historical detail is preserved in vp_document_versions (auto-snapshots on every update).

Sprint States: Planning → Active → Completed → Cancelled

Story Labels (complexity_label):
- L1: Trivial (single file, <1hr vibe time)
- L2: Standard (2-3 files, known pattern) — DEFAULT
- L3: Complex (cross-cutting, spike may be needed)
- L4: Uncertain (requires Probing/Spiking before Bounce)

V-Bounce States (11 total):
Draft → Refinement → Ready to Bounce → Bouncing → QA Passed → Architect Passed → Sprint Review → Done
  ↳ Refinement → Probing/Spiking → Refinement (spike loop)
  ↳ Any → Parking Lot (deferred)
  ↳ Bouncing → Escalated (3+ failures)

IMPORTANT: The §2 Sprint Registry is auto-populated by SyncEngine.
Rows between <!-- SPRINT_REGISTRY_START --> and <!-- SPRINT_REGISTRY_END -->
markers MUST be on their own lines (not inside table pipes).

Output location: `product_plans/{delivery}/DELIVERY_PLAN.md`
(Lives at the root of its delivery folder. One Delivery Plan per delivery/release.)

Document Hierarchy Position: LEVEL 5 — EXECUTION
Charter (why) → Roadmap (strategic what/when) → Epic (detailed what) → Story (how) → **Delivery Plan** (execution) → Risk Registry (risks)

This is the OPERATIONAL layer. It does NOT define what to build (that's Roadmap + Epic).
It defines WHEN and in WHAT ORDER stories execute within sprints.

Upstream sources:
- Stories come from Epics (via Epic §9 Artifact Links)
- Sprint goals align with Roadmap §2 Release Plan milestones
- Story complexity labels (L1-L4) are defined in the Story template

Downstream consumers:
- Team Lead Agent reads this to initialize the Bounce (via agent-team skill)
- §5 Context Pack Status gates whether a story is Ready to Bounce
- Sprint Reports are generated from Active Sprint data + agent reports
- Risk Registry §2 Risk Analysis Log references sprint transitions

Do NOT output these instructions.
</instructions>

# Delivery Plan: {Project Name}

---

> **Last Updated**: {YYYY-MM-DD}
> **Status**: Planning / In Sprint / Delivered
> **Roadmap**: `product_plans/{project}_roadmap.md`
> **Risk Registry**: `product_plans/RISK_REGISTRY.md`
> **Delivery**: `D-{NN}_{release_name}`
> **Sprint Cadence**: 1-week sprints within 2-week project window

---

## 1. Project Window

| Key | Value |
|-----|-------|
| **Start Date** | {YYYY-MM-DD} |
| **End Date** | {YYYY-MM-DD} |
| **Total Sprints** | {N} |
| **Sprint Length** | 1 week |
| **Project Window** | 2 weeks |
| **Team** | {CE name(s) / Agent config} |

---

## 2. Sprint Registry

<!--
AUTO-POPULATED SECTION
Updated when sprints are created or completed.
DO NOT manually edit the table rows - they are managed by the system.
-->

| Sprint | Dates | Sprint Goal | Status | Stories | Completed |
|--------|-------|-------------|--------|---------|-----------|
<!-- SPRINT_REGISTRY_START -->
| S-01 | {MM/DD - MM/DD} | {One-sentence North Star} | Planning / Active / Completed | {X} | {Y}/{X} |
<!-- SPRINT_REGISTRY_END -->

---

## 3. Active Sprint

### Sprint Goal
> {One-sentence functional "North Star" — what is shippable at the end of this sprint?}

### Assigned Stories

| # | Story | Epic | Label | V-Bounce State | Context Pack |
|---|-------|------|-------|----------------|--------------|
| 1 | STORY-XXX-YY: {name} | EPIC-XXX | L1/L2/L3/L4 | Draft / Refinement / Ready to Bounce / Bouncing | Locked / Open |

### Sprint Notes
- {Blockers, dependencies, decisions made during the sprint}

---

## 4. Backlog

> Prioritized stories not yet assigned to a sprint.

| Priority | Story | Epic | Label | V-Bounce State | Blocker |
|----------|-------|------|-------|----------------|---------|
| 1 | STORY-XXX-YY: {name} | EPIC-XXX | L2 | Draft | — |

### Escalated
> Stories with 3+ bounce failures requiring PM/BA intervention.

| Story | Epic | Bounce Count | Escalation Reason |
|-------|------|--------------|-------------------|
| — | — | — | No escalated stories |

### Parking Lot
> Stories moved out of current project window scope (V-Bounce state: Parking Lot).

- STORY-XXX-YY: {name} — Reason: {why deferred}

---

## 5. Context Pack Status

> Tracks readiness of ACTIVE SPRINT stories only.
> A story is **Ready to Bounce** only when all items are checked.
> Context Packs for future sprints are tracked when they enter the Active Sprint.
> L4 stories MUST pass through Probing/Spiking before reaching Ready to Bounce.

### {STORY-XXX-YY}: {name} (Label: {L1/L2/L3/L4})
- [ ] Story spec complete (§1 The Spec)
- [ ] Acceptance criteria written (§2 The Truth)
- [ ] Implementation guide filled (§3 Implementation Guide)
- [ ] Ambiguity: Low
- [ ] BA sign-off
- [ ] Architect sign-off
- [ ] Spike completed (L4 only — skip for L1-L3)
- **V-Bounce State**: {current state} → Ready to Bounce

---

## 5b. Open Questions

> Operational questions that may block stories in the active sprint.
> Strategic questions belong in the Roadmap §6.
> The Team Lead MUST check this section before starting a sprint — do NOT bounce stories with unresolved blocking questions.

| Question | Affects Story | Impact | Owner | Status |
|----------|--------------|--------|-------|--------|
| {e.g., "Which date format for the API?"} | STORY-001-02 | Blocks implementation | {name} | Open / Resolved |

---

## 6. Completed Sprints

> One-line summaries only. Full detail preserved in document version history.

| Sprint | Goal | Delivered | Notes |
|--------|------|-----------|-------|
| — | — | — | No sprints completed yet |

---

## 7. Change Log

<!-- Auto-appended when Delivery Plan is updated -->

| Date | Change | By |
|------|--------|-----|
| {YYYY-MM-DD} | Initial creation from Roadmap | Architect |
