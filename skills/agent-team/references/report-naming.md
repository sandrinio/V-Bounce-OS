# Report Naming Conventions

> On-demand reference from agent-team/SKILL.md. Canonical naming for all report files.

## Story Report Files

Pattern: `STORY-{EpicID}-{StoryID}-{StoryName}-{agent}[-bounce{N}].md`

| Report | Filename | Location |
|--------|----------|----------|
| Dev (first pass) | `STORY-001-01-login-dev.md` | `.worktrees/STORY-001-01-login/.bounce/reports/` |
| QA FAIL (first bounce) | `STORY-001-01-login-qa-bounce1.md` | `.worktrees/STORY-001-01-login/.bounce/reports/` |
| Dev fix (second pass) | `STORY-001-01-login-dev-bounce2.md` | `.worktrees/STORY-001-01-login/.bounce/reports/` |
| QA PASS | `STORY-001-01-login-qa-bounce2.md` | `.worktrees/STORY-001-01-login/.bounce/reports/` |
| Architect | `STORY-001-01-login-arch.md` | `.worktrees/STORY-001-01-login/.bounce/reports/` |
| DevOps merge | `STORY-001-01-login-devops.md` | `.bounce/archive/S-{XX}/STORY-001-01-login/` |

## Sprint-Level Files

| Report | Filename | Location |
|--------|----------|----------|
| Sprint DevOps | `sprint-S-{XX}-devops.md` | `.bounce/archive/S-{XX}/` |
| Sprint Scribe | `sprint-S-{XX}-scribe.md` | `.bounce/archive/S-{XX}/` |
| Sprint Report (active) | `sprint-report-S-{XX}.md` | `.bounce/` (gitignored) |
| Sprint Report (archived) | `sprint-report-S-{XX}.md` | `.bounce/archive/S-{XX}/` (committed) |
| Sprint Context Pack | `sprint-context-S-{XX}.md` | `.bounce/` (gitignored) |
| Sprint Summary | `sprint-summary-S-{XX}.md` | `.bounce/` (gitignored) |

## Key Rules

- Sprint ID always uses `S-{XX}` format (two digits, zero-padded)
- No delivery prefix on sprint-level files — sprint ID is globally unique
- Active sprint reports include sprint ID in filename
- `bounce{N}` suffix counts from 1 (bounce1 = first failure, bounce2 = second failure)
