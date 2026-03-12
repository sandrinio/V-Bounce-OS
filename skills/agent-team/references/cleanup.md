# Cleanup & Archive Rules

> On-demand reference from agent-team/SKILL.md. Read during sprint close or when archiving.

## After Each Story Completes (DevOps Step 5)

1. Archive all reports to `.bounce/archive/S-{XX}/STORY-{ID}-{StoryName}/`
2. Merge story branch into sprint branch (--no-ff)
3. Validate tests/build on sprint branch
4. Remove worktree: `git worktree remove .worktrees/STORY-{ID}-{StoryName}`
5. Delete story branch: `git branch -d story/STORY-{ID}-{StoryName}`
6. Write DevOps Merge Report to `.bounce/archive/S-{XX}/STORY-{ID}-{StoryName}/`

## After Sprint Completes (DevOps Step 7)

1. Merge sprint branch into main (--no-ff)
2. Tag release: `git tag -a v{VERSION}`
3. Run full validation (tests + build + lint)
4. Delete sprint branch: `git branch -d sprint/S-{XX}`
5. Verify `.worktrees/` is empty
6. Write Sprint Release Report to `.bounce/archive/S-{XX}/sprint-S-{XX}-devops.md`
7. Lead archives Sprint Plan: `mv product_plans/sprints/sprint-{XX}/ product_plans/archive/sprints/sprint-{XX}/`
8. Lead archives sprint report: `mv .bounce/sprint-report-S-{XX}.md .bounce/archive/S-{XX}/`
9. Run: `vbounce trends && vbounce suggest S-{XX}` — generates improvement recommendations

## Retention Policy

| Location | Status | Rule |
|----------|--------|------|
| `.bounce/archive/` | **Committed to git** | Permanent audit trail — never delete |
| `.bounce/reports/` | **Gitignored** | Active working files only — ephemeral |
| `.bounce/sprint-report-S-{XX}.md` | **Gitignored** | Active sprint report — archived on close |
| `.bounce/sprint-context-*.md` | **Gitignored** | Regenerated each session |
| `.worktrees/` | **Gitignored** | Ephemeral — exists only during active bouncing |
| `product_plans/archive/` | **Committed** | Completed deliveries with all docs |

## After Delivery Completes (Team Lead)

1. Verify all stories in delivery are "Done" in Delivery Plan §4
2. Move delivery folder: `mv product_plans/D-{NN}_{name}/ product_plans/archive/D-{NN}_{name}/`
3. Add Delivery Log entry to Roadmap §7
4. Update Roadmap §2 Release Plan: status → "Delivered"
