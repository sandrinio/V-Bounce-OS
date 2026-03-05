<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-4.
1. **Header**: Set Status, link to Roadmap + Risk Registry, Sprint Cadence
2. **§1 Project Window**: Start/End dates, total sprints, team
3. **§2 Epics Included**: Table of all Epics assigned to this delivery
4. **§3 High-Level Backlog**: Unassigned stories (Epics being broken down)

Delivery Lifecycle:
- This document tracks the *milestone* across multiple sprints.
- Active sprint work happens inside `sprints/sprint-{XX}/sprint-{XX}.md`, not here.
- When the delivery is fully shipped, this entire document is archived.

Output location: `product_plans/strategy/{delivery}_delivery_plan.md`
Do NOT output these instructions.
</instructions>
# Delivery Plan: {Project Name}
---
> **Last Updated**: {YYYY-MM-DD}
> **Status**: Planning / In Delivery / Completed
> **Roadmap**: `product_plans/{project}_roadmap.md`
> **Risk Registry**: `product_plans/RISK_REGISTRY.md`
> **Delivery**: `D-{NN}_{release_name}`
> **Sprint Cadence**: 1-week sprints
---
## 1. Project Window
| Key | Value |
|-----|-------|
| **Start Date** | {YYYY-MM-DD} |
| **End Date** | {YYYY-MM-DD} |
| **Total Sprints** | {N} |
| **Team** | {CE name(s) / Agent config} |
---
## 2. Epics Included
| Epic | Name | Status | Stories | V-Bounce Phase |
|------|------|--------|---------|----------------|
| EPIC-XXX | {Name} | Draft / Refinement / Bouncing / Done | {Y}/{X} | {Phase Name} |
---
## 3. High-Level Backlog
> Stories prioritized for this delivery but not yet assigned to an active Sprint.
| Priority | Story | Epic | Label | Blocker |
|----------|-------|------|-------|---------|
| 1 | STORY-XXX-YY: {name} | EPIC-XXX | L2 | — |
### Escalated / Parking Lot
- STORY-XXX-YY: {name} — Reason: {escalated / deferred}
