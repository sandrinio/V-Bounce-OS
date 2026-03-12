# 🎯 V-Bounce OS

**Turn your AI coding assistant into a full engineering team.**

*Stop letting your AI code in a vacuum. V-Bounce OS is a structured, agentic framework that enforces a strict Software Development Lifecycle (SDLC) on AI agents like Claude Code, Cursor, Copilot, Gemini, and Codex.*

> *Inspired by the work of Cory Hymel*

---

## 💡 The Hook: Why V-Bounce OS?

Multi-agent frameworks are everywhere. But simply putting three agents in a chatroom doesn't write scalable software. When left unchecked, AI coding teams still hallucinate requirements, introduce architectural drift, and break existing patterns because they are disconnected from the truth of what they actually built.

**The core differentiator of V-Bounce OS is the Context Loop: Requirements → Bounce Reports → Product Documentation.**

Instead of treating your AI as a solo developer, V-Bounce OS forces distinct, specialized roles (Team Lead, Developer, QA, Architect, Scribe) to communicate exclusively through structured artifacts.

1. **Requirements (`product_plans/`)**: The Team Lead defines standard, immutable templates (Charter, Epic, Story) before a single line of code is written.
2. **Bounce Reports (`.bounce/`)**: During implementation, the QA and Architect agents do not edit code. They run deep codebase audits and emit structured "Bounce Reports" summarizing anti-patterns and regressions. The Developer must fix the issues and run the loop again until the code passes validation. 
3. **Product Documentation (`vdocs/`)**: The Scribe agent explores the *actual* codebase post-merge and uses our integrated `vdoc` tool to update feature-centric documentation and the semantic `_manifest.json` map. 

The next time an agent writes code, it reads the `_manifest.json` and the `LESSONS.md` file from previous sprints. The context loop closes. Your AI writes better code because it finally understands the reality of your evolving system.

---

## 📂 State-Based Folder Structure

V-Bounce OS organizes planning documents (`product_plans/`) through a strict state machine based on folder location:

- **`strategy/`**: High-level context (Charter, Roadmap, Risk Registry, Release Plans). Frozen during active sprints.
- **`backlog/`**: Where unassigned work lives. Epics and their child Stories are refined here until selected for a sprint.
- **`sprints/`**: The active execution workspace. A physical `sprint-XX/` boundary is created and Stories are moved in. Only one sprint is "Active" at a time.
- **`hotfixes/`**: Trivial, emergency tasks that bypass sprint cycles.
- **`archive/`**: Immutable history. Finished sprint folders and fully completed Epics are permanently moved here.

---

## 🛠️ The Tech Stack

V-Bounce OS is built to be **local-first, privacy-conscious, and dependency-light**.

- **Runtime**: Node.js — Powering the validation pipeline, context preparation, and CLI.
- **Data Contract**: YAML Frontmatter + Markdown — Human-readable agent handoffs that are also strictly machine-parsable.
- **State Management**: `.bounce/state.json` — Machine-readable sprint state for instant crash recovery without re-reading documents.
- **Context Budget**: On-demand prep scripts (`vbounce prep sprint/qa/arch`) generate capped context packs — no embedding or vector DB required.

---

## 🚀 Quick Start

One command to install the entire methodology directly into your AI assistant.

```bash
# For Claude Code
npx @sandrinio/vbounce install claude

# For Cursor
npx @sandrinio/vbounce install cursor

# For Gemini / Antigravity
npx @sandrinio/vbounce install gemini

# For Copilot / VS Code
npx @sandrinio/vbounce install vscode

# For OpenAI Codex
npx @sandrinio/vbounce install codex
```

### What gets installed?
- **Agent Instructions:** The "Brain" file (e.g., `CLAUDE.md`, `.cursor/rules/`) that teaches your AI how to follow the V-Bounce process.
- **Templates:** Markdown templates for your Charter, Roadmap, Epics, Stories, Sprint Plans, and Delivery Plans.
- **Bundled Scripts:** 16+ automation scripts — validation pipeline, context preparation, state management, sprint lifecycle, and the self-improvement loop.
- **Lightweight Dependencies:** The installer runs `npm install` for `js-yaml`, `marked`, and `commander` — nothing else. No vector DBs, no embedding models.
- **vdoc Integration:** The installer offers to install [`@sandrinio/vdoc`](https://github.com/sandrinio/vdoc) for your platform — enabling automatic semantic product documentation generation via the Scribe agent.

After installing, run `vbounce doctor` to verify your setup is complete.

---

## 🛠️ The `vbounce` CLI

All V-Bounce OS operations route through a unified CLI. Every command is designed to be run by the Team Lead agent — not just humans.

```bash
# Sprint lifecycle
vbounce sprint init S-01 D-01   # Initialize sprint state.json + plan dir
vbounce sprint close S-01        # Validate terminal states, archive, close

# Story lifecycle
vbounce story complete STORY-001-01-login   # Update state.json + sprint plan §4

# State management (crash recovery)
vbounce state show                               # Print current state.json
vbounce state update STORY-001-01-login "QA Passed"  # Update story state
vbounce state update STORY-001-01-login "Bouncing" --qa-bounce  # Increment QA bounce

# Context preparation (context budget management)
vbounce prep sprint S-01          # Generate sprint-context-S-01.md (≤200 lines)
vbounce prep qa STORY-001-01-login    # Generate qa-context-STORY-ID.md (≤300 lines)
vbounce prep arch STORY-001-01-login  # Generate arch-context with truncated diff

# Validation gates
vbounce validate report .bounce/reports/STORY-001-01-login-qa.md
vbounce validate state            # Validate state.json schema
vbounce validate sprint S-01      # Validate sprint plan structure + cross-refs
vbounce validate ready STORY-001-01-login  # Pre-bounce readiness gate

# Self-improvement loop
vbounce trends                    # Compute sprint metrics → .bounce/trends.md
vbounce suggest S-01              # Generate improvement suggestions

# Framework health
vbounce doctor                    # Check all required files, scripts, templates
```

---

## 🔄 State Management & Crash Recovery

V-Bounce OS tracks sprint state in `.bounce/state.json` — a machine-readable snapshot that survives context resets and session interruptions.

```json
{
  "sprint_id": "S-01",
  "delivery_id": "D-01",
  "current_phase": "bouncing",
  "last_action": "QA failed STORY-001-01-login — bounce 1",
  "stories": {
    "STORY-001-01-login": {
      "state": "Bouncing",
      "qa_bounces": 1,
      "arch_bounces": 0,
      "worktree": ".worktrees/STORY-001-01-login",
      "updated_at": "2026-03-12T10:00:00Z"
    }
  }
}
```

When a new session starts, the Team Lead reads `state.json` in under 5 seconds to know exactly where the sprint left off — no re-reading 10 markdown files.

---

## 📊 Self-Improvement Loop

V-Bounce OS tracks its own performance and suggests improvements automatically.

1. **Root Cause Tagging**: Every QA and Architect FAIL report includes a `root_cause:` field (e.g., `missing_tests`, `adr_violation`, `spec_ambiguity`) that feeds into trend analysis.
2. **Sprint Trends**: `vbounce trends` scans all archived reports to compute first-pass rate, average bounce count, correction tax, and root cause breakdown per sprint.
3. **Improvement Suggestions**: `vbounce suggest S-{XX}` reads trends, LESSONS.md, and the improvement log to flag stale lessons, recurring failure patterns, and graduation candidates.
4. **Improvement Log**: `.bounce/improvement-log.md` tracks every suggestion with Applied/Rejected/Deferred status — so nothing falls through the cracks.

---

## 🔧 Tool Tier Model

V-Bounce OS supports four tiers of AI tools with dedicated brain files for each.

| Tier | Tools | Brain File | Capabilities |
|------|-------|------------|--------------|
| **Tier 1** | Claude Code | `brains/CLAUDE.md` | Full orchestration — spawns subagents, manages state, runs all CLI commands |
| **Tier 2** | Gemini CLI, OpenAI Codex | `brains/GEMINI.md`, `brains/codex/` | Single-agent — follows bounce loop, reads state.json, all CLI commands |
| **Tier 3** | Cursor | `brains/cursor-rules/` | Role-specific context injection via `.cursor/rules/` MDC files |
| **Tier 4** | GitHub Copilot, Windsurf | `brains/copilot/`, `brains/windsurf/` | Awareness mode — checklist-driven, reads state.json, CLI commands for safe operations |

Install the appropriate brain for your tool:
```bash
npx @sandrinio/vbounce install claude   # Tier 1
npx @sandrinio/vbounce install gemini   # Tier 2
npx @sandrinio/vbounce install cursor   # Tier 3
npx @sandrinio/vbounce install vscode   # Tier 4
```

---

### 🧰 The Bundled Skills
V-Bounce OS installs a powerful suite of specialized markdown `skills/` directly into your workspace. These act as modular capabilities you can invoke dynamically or that the Team Lead agent will invoke automatically during the SDLC process:

| Skill | Role | Purpose |
|-------|------|---------|
| `agent-team` | Lead | Spawns temporary sub-agents (Dev, QA, DevOps) to parallelize complex tasks without losing context. |
| `doc-manager` | All | Enforces the strict hierarchy for managing Epic and Story documents *(Charter is optional, used only for new projects or brainstorming)*. |
| `lesson` | Lead | Extracts mistakes made during Sprints and updates `LESSONS.md` to prevent future regressions. |
| `react-best-practices` | Developer | A strict set of frontend execution rules the Developer must follow during implementation. <mark>*(Note: This skill serves as a template and must be customized by the human according to the specific tech stack being used.)*</mark> |
| `vibe-code-review` | QA/Architect | Runs distinct review modes (Quick Scan, Deep Audit) to validate code against Acceptance Criteria and Architecture rules. |
| `write-skill` | Lead | Allows the Team Lead to autonomously write and deploy entirely *new* skills if the team repeatedly encounters a novel problem. |
| `improve` | Lead | The framework's self-improvement loop. Reads agent friction signals from sprint retros and proposes targeted changes to templates, skills, brain files, and scripts — with human approval. |

---

## ⚙️ A Skill-Driven Methodology

V-Bounce OS enforces a strict hierarchy. No code is written without a plan, and no task is executed without invoking the proper skills.

### 1. Planning Layer
You use the bundled templates to define the work.
`Charter ➔ Roadmap ➔ Epic ➔ Story`

### 2. The Bounce Loop (Implementation)
Once a Story is ready, you kick off the AI sprint.
1. The **Developer** AI writes the code and submits an Implementation Report.
2. The **QA** AI reads the report and tests it against the Story's requirements. If it fails, it bounces back. (Max 3 attempts before escalating to you).
3. The **Architect** AI audits the successful QA build against your Safe Zone and Architecture Decision Records (ADRs).
4. Only when both gates pass does the **DevOps** AI merge the isolated worktree into your main branch.

### 3. End of Sprint Reports
When a sprint concludes, V-Bounce OS generates structured reports so human reviewers can audit the work without reading every line of code:
- **Sprint Report**: A comprehensive summary by the Team Lead detailing what was delivered, execution metrics, story results, and a retro of what went wrong.
- **Sprint Release Report**: The DevOps agent's log of the merge process to the main branch, environment changes, and post-merge test validations.
- **Scribe Report**: The Scribe agent's complete audit of which product documentation files were generated, updated, or removed (using `vdoc`) to map the new codebase reality.

### 4. Progressive Learning (`LESSONS.md`)
Every time the AI makes a mistake during the Bounce Loop, it flags the issue. During the sprint retrospective, these mistakes are recorded in `LESSONS.md`—a permanent project memory that all agents read *before* writing any future code. **Your AI gets smarter about your specific codebase with every single sprint.**

### 5. Self-Improving Framework (`improve` skill)
V-Bounce OS doesn't just improve your code — it improves *itself*. Every agent report includes a **Process Feedback** section where agents flag friction with the framework: a template missing a critical field, a handoff that lost context, a RAG query that returned irrelevant results, or a skill instruction that was unclear.

These signals are aggregated into the Sprint Report's **Framework Self-Assessment** — categorized by area (Templates, Handoffs, RAG Pipeline, Skills, Process Flow, Tooling) with severity ratings and suggested fixes.

After every 2-3 sprints, the Team Lead runs the `improve` skill which:
1. Reads accumulated friction signals across sprints
2. Identifies recurring patterns (same complaint from multiple agents = real problem)
3. Proposes specific, targeted changes to templates, skills, brain files, or scripts
4. **Applies nothing without your approval** — you review every proposed change

The result: templates get sharper, handoffs get cleaner, skills get more precise, and the bounce loop gets tighter — all driven by the agents who actually use the framework every day.

---

## 🔍 Keywords for Searchability
`ai coding agent` `claude code` `cursor` `github copilot` `gemini` `openai codex` `software development lifecycle` `sdlc` `ai software engineer` `autonomous coding` `agentic framework` `software architecture` `ai team` `vdoc` `ai documentation` `prompt engineering`

---

## 📖 Documentation
- [How to structure an Epic](templates/epic.md)
- [How the Bounce Loop handles Hotfixes](docs/HOTFIX_EDGE_CASES.md)
- [Integrating with vdoc](https://github.com/sandrinio/vdoc)

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page]().

## 📝 License
This project is [MIT](LICENSE) licensed.
