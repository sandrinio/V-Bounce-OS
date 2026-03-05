<instructions>
FOLLOW THIS EXACT STRUCTURE.
1. **Header**: Sprint Goal and Dates.
2. **§1 Assigned Stories**: The stories being worked on right now.
3. **§2 Context Pack Checklists**: Readiness tracking for assigned stories.
4. **§3 Open Questions**: Operational blockers.

Lifecycle:
- This file lives at `product_plans/{delivery}/ACTIVE_SPRINT.md`.
- At the start of a sprint, the Team Lead creates or updates this file with stories pulled from the Delivery Backlog.
- The Agent Team relies solely on this document (not the Delivery Plan) to know what to build today.
- When the sprint ends and a `sprint-report.md` is generated, this file is cleared out or overwritten for the next sprint.

Do NOT output these instructions.
</instructions>

# Active Sprint: {S-XX}
---
> **Sprint Goal**: {One-sentence functional "North Star" — what is shippable at the end of this sprint?}
> **Dates**: {YYYY-MM-DD} to {YYYY-MM-DD}
> **Delivery**: `D-{NN}_{release_name}`

---

## 1. Assigned Stories

| # | Story | Epic | Label | V-Bounce State | Context Pack |
|---|-------|------|-------|----------------|--------------|
| 1 | STORY-XXX-YY: {name} | EPIC-XXX | L1/L2/L3/L4 | Draft / Refinement / Ready to Bounce | Locked / Open |

### Execution Strategy 
> Provide guidelines on parallelization, merge order, or "spine files" to avoid conflicts.
- Phase 1: {Parallel tasks}
- Phase 2: {Sequential merges}

---

## 2. Context Pack Status

> A story is **Ready to Bounce** only when all items are checked. L4 stories MUST pass through Probing/Spiking first.

### {STORY-XXX-YY}: {name} (Label: {L1/L2/L3/L4})
- [ ] Story spec complete (§1 The Spec)
- [ ] Acceptance criteria written (§2 The Truth)
- [ ] Implementation guide filled (§3 Implementation Guide)
- [ ] Ambiguity: Low
- **V-Bounce State**: {current state} → Ready to Bounce

---

## 3. Open Questions

> Operational questions that block stories in this active sprint.

| Question | Affects Story | Owner | Status |
|----------|--------------|-------|--------|
| {Blocker item} | STORY-XXX-YY | {name} | Open / Resolved |
