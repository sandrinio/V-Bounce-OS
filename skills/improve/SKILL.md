---
name: improve
description: "Use when the V-Bounce Engine framework needs to evolve based on accumulated agent feedback. Activates after sprint retros, when recurring friction patterns emerge, or when the user explicitly asks to improve the framework. Reads Process Feedback from sprint reports, analyzes LESSONS.md for automation candidates, identifies patterns, proposes specific changes to templates, skills, brain files, scripts, and agent configs with impact levels, and applies approved changes. This is the system's self-improvement loop."
---

# Framework Self-Improvement

## Purpose

V-Bounce Engine is not static. Every sprint generates friction signals from agents who work within the framework daily. This skill closes the feedback loop: it reads what agents struggled with, analyzes which lessons can be automated, identifies patterns, and proposes targeted improvements to the framework itself.

**Core principle:** No framework change happens without human approval. The system suggests — the human decides.

## Impact Levels

Every improvement proposal is classified by impact to help the human prioritize:

| Level | Label | Meaning | Timeline |
|-------|-------|---------|----------|
| **P0** | Critical | Blocks agent work or causes incorrect output | Fix before next sprint |
| **P1** | High | Causes rework — bounces, wasted tokens, repeated manual steps | Fix this improvement cycle |
| **P2** | Medium | Friction that slows agents but does not block | Fix within 2 sprints |
| **P3** | Low | Polish — nice-to-have, batch with other improvements | Batch when convenient |

### How Impact Is Determined

| Signal | Impact |
|--------|--------|
| Blocker finding + recurring across 2+ sprints | **P0** |
| Blocker finding (single sprint) | **P1** |
| Friction finding recurring across 2+ sprints | **P1** |
| Lesson with mechanical rule (can be a gate check or script) | **P1** |
| Previous improvement that didn't resolve its finding | **P1** |
| Friction finding (single sprint) | **P2** |
| Lesson graduation candidate (3+ sprints old) | **P2** |
| Low first-pass rate or high correction tax | **P1** |
| High bounce rate | **P2** |
| Framework health checks | **P3** |

## When to Use

- **Automatically** — `vbounce sprint close S-XX` runs the improvement pipeline and regenerates `.vbounce/improvement-suggestions.md` (overwrites previous — always reflects latest data)
- **On demand** — `vbounce improve S-XX` runs the full pipeline (trends + analyzer + suggestions)
- **Applying changes:** After every 1-3 sprints, human reviews suggestions and runs `/improve` to apply approved ones. The analysis runs every sprint; applying changes is the human's call.
- When the same Process Feedback appears across multiple sprint reports
- When the user explicitly asks to improve templates, skills, or process
- When a sprint's Framework Self-Assessment reveals Blocker-severity findings
- When LESSONS.md contains 3+ entries pointing to the same process gap

## Trigger

`/improve` OR `vbounce improve S-XX` OR when the Team Lead identifies recurring framework friction during Sprint Consolidation.

## Announcement

When using this skill, state: "Using improve skill to evaluate and propose framework changes."

## The Automated Pipeline

The self-improvement pipeline runs automatically on `vbounce sprint close` and can be triggered manually via `vbounce improve S-XX`:

```
vbounce sprint close S-XX
  │
  ├── .vbounce/scripts/sprint_trends.mjs          → .vbounce/trends.md
  │
  ├── .vbounce/scripts/post_sprint_improve.mjs    → .vbounce/improvement-manifest.json
  │   ├── Parse Sprint Report §5 Framework Self-Assessment tables
  │   ├── Parse LESSONS.md for automation candidates
  │   ├── Cross-reference archived sprint reports for recurring patterns
  │   └── Check if previous improvements resolved their findings
  │
  └── .vbounce/scripts/suggest_improvements.mjs   → .vbounce/improvement-suggestions.md
      ├── Consume improvement-manifest.json
      ├── Add metric-driven suggestions (bounce rate, correction tax, first-pass rate)
      ├── Add lesson graduation candidates
      └── Format with impact levels for human review
```

### Output Files

| File | Purpose |
|------|---------|
| `.vbounce/improvement-manifest.json` | Machine-readable proposals with metadata (consumed by this skill) |
| `.vbounce/improvement-suggestions.md` | Human-readable improvement suggestions with impact levels |
| `.vbounce/trends.md` | Cross-sprint trend data |

## Input Sources

The improve skill reads from multiple signals, in priority order:

### 1. Improvement Manifest (Primary — Machine-Generated)
Read `.vbounce/improvement-manifest.json` first. It contains pre-analyzed proposals with impact levels, automation classifications, recurrence data, and effectiveness checks. This is the richest, most structured input.

### 2. Sprint Report §5 — Framework Self-Assessment
The structured retro tables are the richest human-authored source. Each row has:
- Finding (what went wrong)
- Source Agent (who experienced it)
- Severity (Friction vs Blocker)
- Suggested Fix (agent's proposal)

### 3. LESSONS.md — Automation Candidates
Lessons are classified by automation potential:

| Automation Type | What to Look For | Target |
|----------------|-----------------|--------|
| **gate_check** | Rules with "Always check...", "Never use...", "Must have..." | `.vbounce/gate-checks.json` or `pre_gate_runner.sh` |
| **script** | Rules with "Run X before Y", "Use X instead of Y" | `.vbounce/scripts/` |
| **template_field** | Rules with "Include X in...", "Add X to the story/epic/template" | `.vbounce/templates/*.md` |
| **agent_config** | General behavioral rules proven over 3+ sprints | `brains/claude-agents/*.md` |

**Key insight:** Lessons tell you WHAT to enforce. Sprint retro tells you WHERE the framework is weak. Together they drive targeted improvements.

### 4. Sprint Execution Metrics
Quantitative signals from Sprint Report §3:
- High bounce ratios → story templates may need better acceptance criteria guidance
- High correction tax → handoffs may be losing critical context
- Escalation patterns → complexity labels may need recalibration

### 5. Improvement Effectiveness
The pipeline checks whether previously applied improvements resolved their target findings. Unresolved improvements are re-escalated at P1 priority.

### 6. Agent Process Feedback (Raw)
If sprint reports aren't available, read individual agent reports from `.vbounce/archive/` and extract `## Process Feedback` sections directly.

## The Improvement Process

### Step 1: Read the Manifest
```
1. Read .vbounce/improvement-manifest.json (if it exists)
2. Read .vbounce/improvement-suggestions.md for human-readable context
3. If no manifest exists, run: vbounce improve S-XX to generate one
```

### Step 2: Supplement with Manual Analysis
The manifest handles mechanical detection. The /improve skill adds judgment:
- Are there patterns the scripts can't detect? (e.g., misaligned mental models between agents)
- Do the metric anomalies have root causes not captured in §5?
- Are there skill instructions that agents consistently misinterpret?

### Step 3: Prioritize Using Impact Levels
Rank all proposals (manifest + manual) by impact:

1. **P0 Critical** — Fix before next sprint. Non-negotiable.
2. **P1 High** — Fix in this improvement pass.
3. **P2 Medium** — Fix if bandwidth allows, otherwise defer.
4. **P3 Low** — Batch with other improvements when convenient.

### Step 4: Propose Changes
For each finding, write a concrete proposal:

```markdown
### Proposal {N}: {Short title}

**Impact:** {P0/P1/P2/P3} — {reason}
**Finding:** {What went wrong — from the retro or lesson}
**Pattern:** {How many times / sprints this appeared}
**Root Cause:** {Why the framework allowed this to happen}
**Affected Files:**
- `{file_path}` — {what changes}

**Proposed Change:**
{Describe the specific edit. Include before/after for template changes.
For skill changes, describe the new instruction or step.
For script changes, describe the new behavior.}

**Risk:** {Low / Medium — what could break if this change is wrong}
**Reversibility:** {Easy — revert the edit / Medium — downstream docs may need updating}
```

#### Special Case: Lesson → Gate Check Proposals

When a lesson contains a mechanical rule (classified as `gate_check` in the manifest):

```markdown
### Proposal {N}: Add pre-gate check — {check name}

**Impact:** P1 — mechanical check currently performed manually by agents
**Lesson:** "{lesson title}" (active since {date})
**Rule:** {the lesson's rule}
**Gate:** qa / arch
**Check config to add to `.vbounce/gate-checks.json`:**
```json
{
  "id": "custom_grep",
  "gate": "arch",
  "enabled": true,
  "pattern": "{regex}",
  "glob": "{file pattern}",
  "should_find": false,
  "description": "{human-readable description}"
}
```
```

#### Special Case: Lesson → Script Proposals

When a lesson describes a procedural check:

```markdown
### Proposal {N}: Automate — {check name}

**Impact:** P1 — repeated manual procedure
**Lesson:** "{lesson title}" (active since {date})
**Rule:** {the lesson's rule}
**Proposed script/enhancement:** {describe the new script or addition to existing script}
```

#### Special Case: Lesson Graduation

When a lesson has been active 3+ sprints and is classified as `agent_config`:

```markdown
### Proposal {N}: Graduate lesson — "{title}"

**Impact:** P2 — proven rule ready for permanent enforcement
**Active since:** {date} ({N} sprints)
**Rule:** {the lesson's rule}
**Target agent config:** `brains/claude-agents/{agent}.md`
**Action:** Add rule to agent's Critical Rules section. Archive lesson from LESSONS.md.
```

### Step 5: Present to Human
Present ALL proposals as a numbered list, grouped by impact level. The human can:
- **Approve** — apply the change
- **Reject** — skip it (optionally explain why)
- **Modify** — adjust the proposal before applying
- **Defer** — save for the next improvement pass

**Never apply changes without explicit approval.** The human owns the framework.

### Step 6: Apply Approved Changes
For each approved proposal:
1. Edit the affected file(s)
2. If brain files are affected, ensure ALL brain surfaces stay in sync (CLAUDE.md, GEMINI.md, AGENTS.md, cursor-rules/)
3. Log the change in `brains/CHANGELOG.md`
4. If skills were modified, update skill descriptions in all brain files that reference them
5. Record in `.vbounce/improvement-log.md` under "Applied" with the impact level

### Step 7: Validate
After all changes are applied:
1. Run `vbounce doctor` to verify framework integrity
2. Verify no cross-references are broken (template paths, skill names, report field names)
3. Confirm brain file consistency — all surfaces should describe the same process

## Improvement Scope

### What CAN Be Improved

| Target | Examples | Typical Impact |
|--------|---------|----------------|
| **Gate Checks** | New grep/lint rules from lessons | P1 |
| **Scripts** | New validation, automate manual steps | P1-P2 |
| **Templates** | Add/remove/rename sections, improve instructions | P2 |
| **Agent Report Formats** | Add/remove YAML fields, improve handoff clarity | P1-P2 |
| **Skills** | Update instructions, add/remove steps, add new skills | P1-P2 |
| **Brain Files** | Graduate lessons to permanent rules, update skill refs | P2 |
| **Process Flow** | Reorder steps, add/remove gates, adjust thresholds | P1 |

### What CANNOT Be Changed Without Escalation
- **Adding a new agent role** — requires human design decision + new brain config
- **Changing the V-Bounce state machine** — core process change, needs explicit human approval beyond normal improvement flow
- **Removing a gate** (QA, Architect) — safety-critical, must be a deliberate human decision
- **Changing git branching strategy** — affects all developers and CI/CD

## Output

The improve skill produces:
1. The list of proposals presented to the human (inline during the conversation)
2. The applied changes to framework files
3. The `brains/CHANGELOG.md` entries documenting what changed and why
4. Updates to `.vbounce/improvement-log.md` tracking approved/rejected/deferred items

## Tracking Improvement Velocity

Over time, the Sprint Report §5 Framework Self-Assessment tables should shrink. If the same findings keep appearing after improvement passes, the fix didn't work — the pipeline will automatically detect this and re-escalate at P1 priority.

The Team Lead should note in the Sprint Report whether the previous improvement pass resolved the issues it targeted:
- "Improvement pass from S-03 resolved the Dev→QA handoff gap (0 handoff complaints this sprint)"
- "Improvement pass from S-03 did NOT resolve RAG relevance — same feedback from Developer"

## Critical Rules

- **Never change the framework without human approval.** Propose, don't impose.
- **Keep all brain surfaces in sync.** A change to CLAUDE.md must be reflected in GEMINI.md, AGENTS.md, and cursor-rules/.
- **Log everything.** Every change goes in `brains/CHANGELOG.md` with the finding that motivated it.
- **Run `vbounce doctor` after changes.** Verify framework integrity after applying improvements.
- **Don't over-engineer.** Fix the actual problem reported by agents. Don't add speculative improvements.
- **Respect the hierarchy.** Template changes are low-risk. Process flow changes are high-risk. Scope accordingly.
- **Skills are living documents.** If a skill's instructions consistently confuse agents, rewrite the confusing section — don't add workarounds elsewhere.
- **Impact levels drive priority.** P0 and P1 items are addressed first. P3 items are batched.
- **Lessons are fuel.** Every lesson is a potential automation — classify and act on them.

## Keywords

improve, self-improvement, framework evolution, retro, retrospective, process feedback, friction, template improvement, skill improvement, brain sync, meta-process, self-aware, impact levels, lesson graduation, gate check, automation
