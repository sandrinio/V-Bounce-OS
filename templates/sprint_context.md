<instructions>
This template is used by the Team Lead at Sprint Setup (Step 0.7) to create a shared context file
for all agents in the sprint. Every agent task file must reference this file.

Purpose: Reduce divergence between parallel agents by giving them a single source of cross-cutting rules.

Written to `.bounce/sprint-context-S-{XX}.md`.
Updated mid-sprint when cross-cutting decisions change.

Do NOT output these instructions.
</instructions>

---
sprint_id: "S-{XX}"
created: "{YYYY-MM-DD}"
last_updated: "{YYYY-MM-DD}"
---

# Sprint Context: S-{XX}

> Cross-cutting rules for ALL agents in this sprint. Read this before starting any work.

## Design Tokens & UI Conventions
> Visual rules that apply across all UI stories. Omit if sprint has no UI work.

- **Color palette**: {e.g., "Primary: #1A1A2E, Accent: #E94560, Background: #F5F5F5"}
- **Typography**: {e.g., "Headings: Inter 600, Body: Inter 400, Mono: JetBrains Mono"}
- **Spacing rhythm**: {e.g., "4px base unit, 8/16/24/32px scale"}
- **Component patterns**: {e.g., "Use existing Button component from src/components/ui/Button.tsx"}

## Shared Patterns & Conventions
> Technical patterns all agents must follow. Derived from ADRs, LESSONS.md, and sprint planning.

- {e.g., "All API calls go through src/lib/api-client.ts — do not use fetch directly"}
- {e.g., "Error boundaries must wrap every route-level component"}
- {e.g., "Use Zod for all input validation — do not write manual validators"}

## Locked Dependencies
> Versions that must not be changed during this sprint.

| Package | Version | Reason |
|---------|---------|--------|
| {e.g., "react"} | {e.g., "18.2.0"} | {e.g., "Upgrade planned for S-04"} |

## Active Lessons (Broad Impact)
> LESSONS.md entries that affect multiple stories in this sprint. Copied here for visibility.

- {e.g., "[2026-03-10] Always use soft deletes with RLS — never cascade"}
- {e.g., "[2026-03-15] Run `npm run typecheck` before committing — tsc catches what ESLint misses"}

## Sprint-Specific Rules
> Decisions made during sprint planning or mid-sprint that all agents must follow.

- {e.g., "All new components must include a Storybook story"}
- {e.g., "No new dependencies without Team Lead approval — we're near the bundle size limit"}

## Change Log

| Date | Change | By |
|------|--------|-----|
| {YYYY-MM-DD} | Sprint context created | Team Lead |
