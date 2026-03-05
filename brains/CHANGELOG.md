# V-Bounce OS Brains & Skills Changelog

This log tracks modifications to the core agentic framework (e.g., `brains/`, `skills/`). 
Per **Rule 13: Framework Integrity**, anytime an entry is made here, the orchestrator MUST trigger `./scripts/pre_bounce_sync.sh` to update the RAG embeddings globally.

## [2026-03-02]
- **Initialized**: Created strict Framework Integrity tracking, YAML context handoffs, and RAG validation pipeline.

## [2026-03-05]
- **Modified**: Added `tokens_used` tracking to all agent instructions (`brains/claude-agents/*`).
- **Modified**: Updated `skills/agent-team/SKILL.md` to consolidate tokens into `sprint_report.md`.
- **Modified**: Updated `scripts/validate_report.mjs` to enforce `tokens_used` schema presence.
- **Modified**: Refactored `STORY-{EpicID}-{StoryID}` file naming convention to `STORY-{EpicID}-{StoryID}-{StoryName}` across all templates, agent instructions, skill definitions, and architecture files for better human readability.
- **Modified**: Refactored the generic `product_plans` folder into a state-based architecture (`strategy/`, `backlog/`, `sprints/`, `hotfixes/`, `archive/`). Separated Sprint tracking logic from `DELIVERY_PLAN.md` into a new `sprint.md` template. Updated `doc-manager` and `agent-team` orchestration to adhere to these physical transition rules.
