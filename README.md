<div align="center">
  <img src="docs/icons/logo.svg" width="100" height="100" alt="V-Bounce Engine Logo" />
  <h1>V-Bounce Engine</h1>
  <p><strong>Stop babysitting your AI. Build a disciplined, self-correcting engineering team.</strong></p>

  <p>
    <a href="https://github.com/sandrinio/v-bounce-engine/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
    <a href="https://www.npmjs.com/package/@sandrinio/vbounce"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40sandrinio%2Fvbounce"></a>
  </p>
  
  <p>
    V-Bounce Engine turns your single AI assistant — <b>Claude Code, Cursor, Gemini, Copilot</b> — into a fully equipped engineering team. It enforces a planning-first workflow, automated quality gates, structural audits, and a persistent learning loop.
  </p>
</div>

---

## <img src="docs/icons/zap.svg" width="24" height="24" style="vertical-align: text-bottom;" /> Quick Start

Get your new AI team up and running in seconds. No complex setup, no vector databases. Just plain Markdown and Node.

```bash
# 1. Install the framework for your platform of choice
npx @sandrinio/vbounce install claude    # Claude Code (Full Orchestration)
# Or: npx @sandrinio/vbounce install cursor|gemini|codex|vscode

# 2. Verify your installation
npx vbounce doctor

# 3. Initialize your first sprint!
npx vbounce sprint init S-01 D-01
```

> **Requirements**: Node.js and a project directory. That's it. One person to set the vision, the AI handles the execution.

---

## <img src="docs/icons/alert.svg" width="24" height="24" style="vertical-align: text-bottom;" /> The Problem: AI Chaos

AI coding tools are incredibly fast, but without guardrails, they create **expensive chaos**:
- **No accountability:** Code ships with bugs a junior dev would catch.
- **Invisible progress:** "The agent is still running." No milestones, no checks.
- **Goldfish memory:** Every session is Day 1. It makes the same architectural mistake twice.
- **Infinite loops:** The agent gets stuck trying to fix its own broken code.

---

## <img src="docs/icons/shield.svg" width="24" height="24" style="vertical-align: text-bottom;" /> Why V-Bounce Engine?

V-Bounce wraps your AI agents in the same discipline that makes human engineering teams reliable:

| Guardrail | What It Solves |
|-------------|-------------------|
| **Isolated Worktrees** | **Contamination.** Every story is a sandbox. One bad story won't break your app. |
| **QA Quality Gates** | **Missed Requirements.** Code is validated against Acceptance Criteria *before* merge. |
| **Architect Audits** | **Drift.** Blocks the AI from hallucinating new dependencies or breaking patterns. |
| **3-Bounce Escalation** | **Infinite Loops.** After 3 failed attempts, the AI surfaces the root cause to you. |
| **Persistent Lessons** | **Goldfish Memory.** The AI logs mistakes in `LESSONS.md` and reads them next sprint. |

---

## <img src="docs/icons/rocket.svg" width="24" height="24" style="vertical-align: text-bottom;" /> The Planning Phase

V-Bounce doesn't just protect execution — it structures **planning** so your AI never starts coding from a vague prompt.

You and the AI collaborate through a strict document hierarchy. Each level inherits context from the one above, so nothing is lost or hallucinated.

```
Charter  →  Roadmap  →  Epic  →  Story  →  Sprint Plan  →  Bounce
  WHY         WHAT       WHAT      HOW       WHEN           DO
```

### How It Works

1. **You set the vision.** Write a Charter (the *why*) and Roadmap (the *what*). The AI reads these before touching anything else.
2. **AI researches, then plans.** Before creating Stories, the AI explores your actual codebase — reading affected files, discovering patterns, and identifying real dependencies. No guessing.
3. **Ambiguity is surfaced, not hidden.** Every Epic and Story gets an Ambiguity Score (🟢 Low / 🟡 Medium / 🔴 High). If critical unknowns exist, the AI creates **Spikes** — focused investigations that must complete before coding begins.
4. **Sprint Planning is collaborative.** The AI proposes scope, surfaces risks, flags open questions, and identifies dependency chains. You discuss, adjust, and confirm. **No sprint starts without your explicit sign-off.**
5. **Stories are sized for success.** Each story has one clear goal, touches 1–3 files, and produces a verifiable result. Vertical slices over horizontal layers — always.

### The Sprint Planning Gate

| Step | What Happens |
|------|--------------|
| **Read** | AI scans backlog, archive, and risk registry to build full context |
| **Propose** | AI selects stories by priority and dependency, flags blockers |
| **Discuss** | You and the AI resolve open questions, adjust scope, agree on execution mode |
| **Confirm** | You approve the Sprint Plan → stories move into execution → Bounce begins |

> **Hard rule:** The Bounce Loop *cannot* start without a finalized, human-confirmed Sprint Plan.

---

## <img src="docs/icons/sync.svg" width="24" height="24" style="vertical-align: text-bottom;" /> The "Bounce" Loop

Instead of letting an AI hallucinate straight to production, V-Bounce coordinates specialized roles working in isolation.

<div align="center">
  <img src="docs/images/bounce_loop_diagram.png" width="100%" max-width="800" alt="The Bounce Loop Visualization" />
</div>

1. <img src="docs/icons/terminal.svg" width="16" height="16" style="vertical-align: text-bottom;" /> **Developer**: Implements features in isolated git worktrees.
2. <img src="docs/icons/beaker.svg" width="16" height="16" style="vertical-align: text-bottom;" /> **QA**: Validates code strictly against acceptance criteria. (Read-only)
3. <img src="docs/icons/git-branch.svg" width="16" height="16" style="vertical-align: text-bottom;" /> **Architect**: Audits code against ADRs (Architecture Decision Records). (Read-only)
4. <img src="docs/icons/git-merge.svg" width="16" height="16" style="vertical-align: text-bottom;" /> **DevOps**: Merges passing code cleanly to the sprint branch.
5. <img src="docs/icons/pencil.svg" width="16" height="16" style="vertical-align: text-bottom;" /> **Scribe**: Keeps product documentation in sync with actual code.

---

## <img src="docs/icons/graph.svg" width="24" height="24" style="vertical-align: text-bottom;" /> Measure What Matters (Metrics)

For the first time, manage your AI work like a true Product Manager. Run `vbounce trends` to track:
- **Bounce Rate (QA / Architect)**: How often does the AI fail to meet spec?
- **Correction Tax**: How much manual human intervention was required? (0% = AI shipped autonomously).
- **Escalation Rate**: How often did stories hit the 3-bounce limit?

---

## <img src="docs/icons/tools.svg" width="24" height="24" style="vertical-align: text-bottom;" /> Supported Platforms

V-Bounce adapts to your current workflow effortlessly.

- **Claude Code (Tier 1)**: Full orchestration. Spawns specific subagents for each role seamlessly.
- **Gemini CLI / Codex (Tier 2)**: Single-agent mode, following the strict sequential bounce loop.
- **Cursor (Tier 3)**: Deep integration via modular `.cursor/rules/` MDC mapping.
- **Copilot / Windsurf (Tier 4)**: Embedded awareness through checklists and state reading.

---

## <img src="docs/icons/book.svg" width="24" height="24" style="vertical-align: text-bottom;" /> Deep Dive & Docs

Ready to see how deep the rabbit hole goes?
- **[System Overview & Architecture](OVERVIEW.md)**
- **[Epic and Story Templates](templates/epic.md)**
- **[Self-Improvement Pipeline (`vbounce improve`)](docs/IMPROVEMENT.md)** *(Your AI optimizes its own framework)*

---

<div align="center">
  <b>Built for builders who want to ship, not babysit.</b><br>
  <i>Contributions, issues, and feature requests are welcome!</i>
</div>
