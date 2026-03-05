<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-2.

1. **YAML Frontmatter**: Sprint ID, Goal, Dates, Status
2. **§1 Active Scope**: Table of stories pulled into this sprint. The V-Bounce state tracks its progression.
3. **§2 Sprint Open Questions**: Unresolved items blocking this active execution window.

Output location: `product_plans/sprints/sprint-{XX}/sprint-{XX}.md`

Role of this document:
- This is the Tactical view of the active sprint execution.
- It tracks ONLY the stories claimed for this 1-week window.
- The Team Lead agent reads this to know what is in scope.

Document Lifecycle:
- Created by the Team Lead or PM during Sprint Setup.
- Selected stories are physically moved from `product_plans/backlog/EPIC-*/` to `product_plans/sprints/sprint-{XX}/`.
- When the sprint completes, this document (and the entire sprint folder) moves to `product_plans/archive/sprints/sprint-{XX}/`.

Do NOT output these instructions.
</instructions>

---
sprint_id: "sprint-{XX}"
sprint_goal: "{One-sentence North Star}"
dates: "{MM/DD - MM/DD}"
status: "Planning / Active / Completed"
---

# Sprint S-{XX} Plan

## 1. Active Scope
> Stories pulled from the backlog for execution during this sprint window.
> The V-Bounce State tracks the live status of the story (Draft -> Ready to Bounce -> Bouncing -> QA Passed -> Architect Passed -> Sprint Review -> Done).

| Priority | Story | Epic | Label | V-Bounce State | Blocker |
|----------|-------|------|-------|----------------|---------|
| 1 | [STORY-XXX-YY: name](./STORY-XXX-YY-name.md) | EPIC-XXX | L2 | Draft | — |

### Escalated / Parking Lot
- STORY-XXX-YY: {name} — Reason: {escalated / deferred}

## 2. Sprint Open Questions
> Unresolved items that affect this specific 1-week execution window.

| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| {question} | A: {x}, B: {y} | Blocks {stories} | {name} | Open / Decided |
