<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 0-4.

1. **YAML Frontmatter**: Sprint ID, Goal, Dates, Status (Planning/Confirmed/Active/Completed), Delivery ref, Confirmed by/at
2. **§0 Sprint Readiness Gate**: Pre-sprint checklist — ALL items must be checked before human confirms
3. **§1 Active Scope**: Table of stories + Context Pack Readiness checklists
4. **§2 Execution Strategy**: Parallel phases, dependencies, risk flags
5. **§3 Sprint Open Questions**: Unresolved items blocking this sprint
6. **§4 Execution Log**: Accumulated story results (populated during sprint, becomes Sprint Report §2 source)

Output location: `product_plans/sprints/sprint-{XX}/sprint-{XX}.md`

Role of this document:
- This is the SINGLE SOURCE OF TRUTH during active sprint execution.
- The Team Lead updates this file at every state transition — NOT the Delivery Plan.
- The Delivery Plan is only updated at sprint boundaries (start and end).

Document Lifecycle:
- Created during Sprint Planning (Phase 2) as a collaborative document between AI and human.
- Status flow: Planning → Confirmed (human approves) → Active (execution begins) → Completed.
- **Sprint CANNOT move to Active without human confirmation.** This is a hard gate.
- §0 Readiness Gate must be fully checked before requesting human confirmation.
- §1 V-Bounce States updated at every story transition during execution.
- §4 Execution Log gets one row per completed story (via `vbounce story complete`).
- At sprint end, §4 becomes the skeleton for Sprint Report §2 — no reconstruction needed.
- When the sprint completes, this document moves to `product_plans/archive/sprints/sprint-{XX}/`.

Do NOT output these instructions.
</instructions>

---
sprint_id: "sprint-{XX}"
sprint_goal: "{One-sentence North Star}"
dates: "{MM/DD - MM/DD}"
status: "Planning / Confirmed / Active / Completed"
delivery: "D-{NN}"
confirmed_by: ""
confirmed_at: ""
---

# Sprint S-{XX} Plan

## 0. Sprint Readiness Gate
> This sprint CANNOT start until the human confirms this plan.
> AI sets status to "Planning" when drafting. Human confirmation moves it to "Confirmed". Execution moves it to "Active".

### Pre-Sprint Checklist
- [ ] All stories below have been reviewed with the human
- [ ] Open questions (§3) are resolved or non-blocking
- [ ] No stories have 🔴 High ambiguity (spike first)
- [ ] Dependencies identified and sequencing agreed
- [ ] Risk flags reviewed from Risk Registry
- [ ] **Human has confirmed this sprint plan**

---

## 1. Active Scope
> Stories pulled from the backlog for execution during this sprint window.
> V-Bounce State is the ONLY authoritative source for story status during the sprint.

| Priority | Story | Epic | Label | V-Bounce State | Blocker |
|----------|-------|------|-------|----------------|---------|
| 1 | [STORY-XXX-YY: name](./STORY-XXX-YY-name.md) | EPIC-XXX | L2 | Draft | — |

### Context Pack Readiness
> Check before moving story to "Ready to Bounce". All items must be ✅.
> Run `vbounce validate ready STORY-ID` to verify programmatically.

**STORY-{ID}: {name}**
- [ ] Story spec complete (§1)
- [ ] Acceptance criteria defined (§2)
- [ ] Implementation guide written (§3)
- [ ] Ambiguity: Low / Medium (if High → back to Refinement)

V-Bounce State: Draft / Refinement / Ready to Bounce

### Escalated / Parking Lot
- STORY-XXX-YY: {name} — Reason: {escalated / deferred}

---

## 2. Execution Strategy
> Written during sprint planning. Guides the Lead's delegation order.

### Phase Plan
- **Phase 1 (parallel)**: {Story IDs that can run simultaneously}
- **Phase 2 (sequential)**: {Story IDs with dependencies — run in order}

### Risk Flags
- {Which stories touch shared modules — coordinate access}
- {Sprint-specific risks pulled from Risk Registry}

### Dependency Chain
> Stories that MUST run sequentially (depends_on relationships).

| Story | Depends On | Reason |
|-------|-----------|--------|
| STORY-XXX-YY | STORY-XXX-YY | {why sequential} |

---

## 3. Sprint Open Questions
> Unresolved items that affect this specific sprint execution window.
> Strategic questions belong in the Delivery Plan, not here.

| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| {question} | A: {x}, B: {y} | Blocks {stories} | {name} | Open / Decided |

---

<!-- EXECUTION_LOG_START -->
## 4. Execution Log
> Updated by the Lead after each story completes via `vbounce story complete STORY-ID`.
> This table becomes Sprint Report §2 at sprint end — no reconstruction needed.

| Story | Final State | QA Bounces | Arch Bounces | Tests Written | Correction Tax | Notes |
|-------|-------------|------------|--------------|---------------|----------------|-------|
| STORY-XXX-YY | Done | 0 | 0 | {N} | 0% | {brief note} |
<!-- EXECUTION_LOG_END -->
