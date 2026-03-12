# Mid-Sprint Change Request Triage

> On-demand reference from agent-team/SKILL.md. How the Team Lead handles user interruptions during an active sprint.

## When This Applies

Any time the user provides input mid-bounce that is **not** a direct answer to a question the agent asked. Examples:
- "This is broken"
- "Actually, change the auth to use OAuth"
- "I meant X, not Y"
- "Can we also add Z?"
- "The wiring between A and B doesn't work"

## Step 1 — Categorize

The Team Lead MUST classify the request before acting:

| Category | Definition | Example |
|----------|-----------|---------|
| **Bug** | Something built (or pre-existing) is broken | "Login crashes when email has a plus sign" |
| **Spec Clarification** | The spec was ambiguous; user is clarifying intent, not changing scope | "By 'admin' I meant workspace admin, not super admin" |
| **Scope Change** | User wants to add, remove, or modify requirements for the current story | "Also add a forgot-password flow to the login story" |
| **Approach Change** | Implementation strategy is wrong; needs a different technical path | "Don't use REST for this — wire it through WebSockets instead" |

### How to Decide

```
Is existing behavior broken?
  YES → Bug
  NO  → Is the user adding/removing/changing a requirement?
          YES → Scope Change
          NO  → Is the user correcting an ambiguity in the spec?
                  YES → Spec Clarification
                  NO  → Approach Change (technical direction shift)
```

## Step 2 — Route

| Category | Action | Bounce Impact |
|----------|--------|---------------|
| **Bug** | If L1 (1-2 files): Hotfix Path. If larger: add as a bug-fix task within the current story bounce. | Does NOT increment QA/Arch bounce count. |
| **Spec Clarification** | Update Story spec inline (§1 or §2). Add a note in the Change Log. Continue current bounce. | Does NOT reset or increment bounce count. |
| **Scope Change** | Pause bounce. Update Story spec. If scope grew significantly, consider splitting into a new story. Reset Dev pass (QA/Arch counts preserved if prior passes are still valid). | Resets Dev pass only. Prior QA/Arch passes invalidated if the change affects tested areas. |
| **Approach Change** | Update Story §3 Implementation Guide. Re-delegate to Developer with updated context. | Resets Dev pass only. Prior QA/Arch passes invalidated. |

## Step 3 — Log

Every change request MUST be logged in the Sprint Plan `sprint-{XX}.md` §4 Execution Log:

```
| {timestamp} | CR | {Category} | {STORY-ID} | {One-line description} |
```

Use `CR` as the event type to distinguish from regular bounce events.

## Sprint Report Tracking

At sprint consolidation (Step 7), the Team Lead includes a **§2.1 Change Requests** section in the Sprint Report summarizing all mid-sprint CRs. This keeps change-request-driven work separate from agent-driven bounces so metrics aren't skewed.

| Story | Category | Description | Impact |
|-------|----------|-------------|--------|
| STORY-{ID} | Spec Clarification | Clarified admin role scope | No bounce reset |
| STORY-{ID} | Scope Change | Added forgot-password flow | Dev pass reset, +1 session |

## Key Rules

- **Never silently absorb a user change.** Always categorize and log it.
- **Bugs don't penalize the bounce count.** They are defects, not process failures.
- **Spec clarifications are cheap.** Update the spec and move on — no ceremony needed.
- **Scope changes are expensive.** Always pause, update the spec, and confirm with the user before resuming.
- **Correction Tax still applies.** Human intervention is tracked, but the category explains *why*.
