---
name: flashcard
description: Use when recording project-specific mistakes, gotchas, or hard-won knowledge. Also activates proactively when a mistake pattern is detected during work.
---

# Flashcards

Captures project-specific mistakes and rules into `FLASHCARDS.md` so they are never repeated. YOU MUST read `FLASHCARDS.md` before modifying code in any session.

**Core principle:** Every mistake is an investment — but only if you record it.

## Trigger

`/flashcard` OR `/flashcard [description]` OR proactively when a mistake or gotcha is detected during work.

## Announcement

When using this skill, state: "Recording a flashcard."

## Awareness: Always-On Behavior

This is NOT just a command — it is a standing directive:

1. **Before modifying code**, read `FLASHCARDS.md` at the project root. Treat recorded rules as hard constraints.
2. **During work**, if you encounter any of these signals, offer to record a lesson:
   - A bug caused by a non-obvious platform behavior (Supabase, Vercel, Next.js, etc.)
   - A fix that took multiple attempts to get right
   - A pattern that silently fails or produces unexpected results
   - A deployment or environment gotcha
   - An approach that was abandoned after significant effort
3. **When offering**, say: *"This looks like a lesson worth recording — want me to capture it?"*
4. **Never record without the user's approval.** Always ask first.

## Timing: Record Immediately, Not at Sprint Close

**Lessons MUST be recorded as soon as the story that produced them is merged** — not deferred to sprint close. Context decays fast.

**Flow:**
1. During execution, agents flag lessons in their reports (`lessons_flagged` field)
2. After DevOps merges a story (Phase 3, Step 9), the Team Lead immediately:
   - Reads `lessons_flagged` from Dev and QA reports
   - Presents each lesson to the human for approval
   - Records approved lessons to FLASHCARDS.md right away
3. At sprint close (Sprint Report §4), the lesson table serves as a **review of what was already recorded** — not a first-time approval step. This is a confirmation, not a gate.

**Why this matters:** A lesson recorded 5 minutes after the problem is specific and actionable. A lesson recorded 3 days later at sprint close is vague and often forgotten.

## Recording: The `/lesson` Command

### Step 1: Gather Context

If the user provides a description (`/lesson [description]`), use it. Otherwise:
- Review the current session for what went wrong or what was learned
- Ask the user: *"What's the lesson here — what should we never do again?"*

**WAIT** for user input if context is unclear.

### Step 2: Format the Entry

Use this exact format — no deviations:

```markdown
### [YYYY-MM-DD] Short descriptive title
**What happened:** One or two sentences describing the problem or mistake.
**Rule:** The actionable rule to follow going forward. Write as an imperative.
```

Rules for formatting:
- Date is today's date
- Title is a short phrase, not a sentence
- "What happened" is factual — what you tried and what went wrong
- "Rule" is a direct command — "Always...", "Never...", "Use X instead of Y"

### Step 3: Append to FLASHCARDS.md

1. Read `FLASHCARDS.md` at the project root
2. If the file does not exist, create it with the header `# Flashcards`
3. Append the new entry at the bottom of the file
4. Confirm to the user: *"Recorded. This lesson is now active for all future sessions."*

## File Format

`FLASHCARDS.md` lives at the project root. Flat, chronological, no categories.

```markdown
# Flashcards

### [2026-02-18] RLS policies break cascade deletes
**What happened:** Tried cascade delete on projects table, silently failed due to RLS.
**Rule:** Always use soft deletes with RLS. Never cascade.

### [2026-02-15] Vercel preview URLs break CORS
**What happened:** OAuth failed on every preview deploy because preview URLs weren't in the CORS allowlist.
**Rule:** Use wildcard pattern for Vercel preview branch origins in CORS config.
```

## Critical Rules

- **Read before write.** ALWAYS read `FLASHCARDS.md` before modifying project code. No exceptions.
- **Ask before recording.** Never append a lesson without user approval.
- **One lesson per entry.** Do not combine multiple learnings into one entry.
- **Rules are imperatives.** Write rules as direct commands, not suggestions.
- **No duplicates.** Before recording, check if a similar lesson already exists. If so, update it instead of creating a new one.
- **Keep it flat.** No categories, no tags, no metadata beyond the entry format. Simplicity is the feature.

## Lesson Graduation

Lessons that have been proven effective across 3+ sprints become permanent agent config rules.

### Graduation Criteria

A lesson is a **graduation candidate** when:
- It has been active for 3+ sprints
- It has been triggered (prevented a recurrence) at least once
- No bounce in the last 3 sprints matches its root cause

#### Accelerated Graduation

A lesson qualifies for **accelerated graduation** (after 1 sprint instead of 3) when:
- It affected 5+ files across multiple stories, OR
- It caused a bounce (QA or Architect failure directly attributable to the lesson's root cause), OR
- It describes a cross-cutting concern (UI consistency, naming conventions, shared patterns) that will recur every sprint

Accelerated candidates are flagged by `suggest_improvements.mjs` with impact level P1. The human still approves — the only difference is the 3-sprint waiting period is waived.

### Graduation Process

1. `.vbounce/scripts/suggest_improvements.mjs` flags graduation candidates in improvement suggestions
2. Human approves graduation
3. Lead adds the rule to the relevant agent config (`.claude/agents/developer.md`, etc.)
4. Lead removes or archives the lesson from `FLASHCARDS.md` with a note: `[Graduated to {agent} config on {date}]`
5. Record in `.vbounce/improvement-log.md` under "Applied"

### Why Graduation Matters

`FLASHCARDS.md` is a staging area, not a permanent rule store. Lessons that graduate become enforced constraints in the agent's core instructions — they can't be forgotten or overlooked. Lessons that stay in `FLASHCARDS.md` are read on every session but are softer guidance. Keep `FLASHCARDS.md` lean — stale lessons dilute the signal.
