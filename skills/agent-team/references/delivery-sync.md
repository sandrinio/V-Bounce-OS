# Delivery Plan Sync Rules

> On-demand reference from agent-team/SKILL.md. When and how to update the Delivery Plan.

## Core Rule

**The Delivery Plan is updated ONLY at sprint boundaries — not during active bouncing.**

Story state changes are tracked in the Sprint Plan (sprint-{XX}.md) §1 ONLY.
The Delivery Plan is a strategic document — it does not track story states.

## Sync Table

| Action | Sprint Plan Update | Delivery Plan Update |
|--------|-------------------|---------------------|
| Sprint starts | Status → "Active" (frontmatter) | §2: sprint status → Active |
| Story state changes | §1 V-Bounce State ONLY | **Nothing** |
| Story completes | §1 state → Done, §4 Execution Log row added | **Nothing** |
| Sprint ends | Status → "Completed" (frontmatter) | §2: sprint → Completed, §4: add summary row, §3: remove delivered stories |
| Hotfix applied | No sprint plan change | **Nothing** |

## What Each Document Owns

**Sprint Plan** (sprint-{XX}.md):
- Story states (§1 V-Bounce State column)
- Context Pack Readiness (§1)
- Execution Strategy and phases (§2)
- Sprint open questions (§3)
- Execution Log accumulation (§4)

**Delivery Plan** (D-{NN}_DELIVERY_PLAN.md):
- Epic-level status (§2)
- Unassigned backlog stories (§3)
- Completed sprint history (§4)
- Project window and team (§1)

## Never Do This

- ❌ Update Delivery Plan §2/§3 when a story bounces
- ❌ Update Delivery Plan §2/§3 when QA passes
- ❌ Update Delivery Plan §2/§3 when Architect passes
- ✅ Update Sprint Plan §1 for ALL state transitions during the sprint
- ✅ Update Delivery Plan §4 only when a sprint CLOSES
