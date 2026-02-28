---
name: lesson
description: Use when recording project-specific mistakes, gotchas, or hard-won knowledge. Also activates proactively when a mistake pattern is detected during work.
---

# Lessons Learned

Captures project-specific mistakes and rules into `LESSONS.md` so they are never repeated. YOU MUST read `LESSONS.md` before modifying code in any session.

**Core principle:** Every mistake is an investment — but only if you record it.

## Trigger

`/lesson` OR `/lesson [description]` OR proactively when a mistake or gotcha is detected during work.

## Announcement

When using this skill, state: "Recording a lesson learned."

## Awareness: Always-On Behavior

This is NOT just a command — it is a standing directive:

1. **Before modifying code**, read `LESSONS.md` at the project root. Treat recorded rules as hard constraints.
2. **During work**, if you encounter any of these signals, offer to record a lesson:
   - A bug caused by a non-obvious platform behavior (Supabase, Vercel, Next.js, etc.)
   - A fix that took multiple attempts to get right
   - A pattern that silently fails or produces unexpected results
   - A deployment or environment gotcha
   - An approach that was abandoned after significant effort
3. **When offering**, say: *"This looks like a lesson worth recording — want me to capture it?"*
4. **Never record without the user's approval.** Always ask first.

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

### Step 3: Append to LESSONS.md

1. Read `LESSONS.md` at the project root
2. If the file does not exist, create it with the header `# Lessons Learned`
3. Append the new entry at the bottom of the file
4. Confirm to the user: *"Recorded. This lesson is now active for all future sessions."*

## File Format

`LESSONS.md` lives at the project root. Flat, chronological, no categories.

```markdown
# Lessons Learned

### [2026-02-18] RLS policies break cascade deletes
**What happened:** Tried cascade delete on projects table, silently failed due to RLS.
**Rule:** Always use soft deletes with RLS. Never cascade.

### [2026-02-15] Vercel preview URLs break CORS
**What happened:** OAuth failed on every preview deploy because preview URLs weren't in the CORS allowlist.
**Rule:** Use wildcard pattern for Vercel preview branch origins in CORS config.
```

## Critical Rules

- **Read before write.** ALWAYS read `LESSONS.md` before modifying project code. No exceptions.
- **Ask before recording.** Never append a lesson without user approval.
- **One lesson per entry.** Do not combine multiple learnings into one entry.
- **Rules are imperatives.** Write rules as direct commands, not suggestions.
- **No duplicates.** Before recording, check if a similar lesson already exists. If so, update it instead of creating a new one.
- **Keep it flat.** No categories, no tags, no metadata beyond the entry format. Simplicity is the feature.
