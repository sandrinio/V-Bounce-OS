# Mid-Sprint Triage

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

| Category | Definition | Example | Template |
|----------|-----------|---------|----------|
| **Bug** | Something built (or pre-existing) is broken | "Login crashes when email has a plus sign" | `templates/bug.md` (or `templates/hotfix.md` if L1) |
| **Spec Clarification** | The spec was ambiguous; user is clarifying intent, not changing scope | "By 'admin' I meant workspace admin, not super admin" | No template — update story spec inline |
| **Scope Change** | User wants to add, remove, or modify requirements for the current story | "Also add a forgot-password flow to the login story" | `templates/change_request.md` |
| **Approach Change** | Implementation strategy is wrong; needs a different technical path | "Don't use REST for this — wire it through WebSockets instead" | `templates/change_request.md` |

### How to Decide

```
Is existing behavior broken?
  YES → Bug
    Is it L1 (1-2 files, trivial)? → Hotfix Path (templates/hotfix.md)
    Is it larger? → Bug Report (templates/bug.md) → fix task in current sprint
  NO  → Is the user adding/removing/changing a requirement?
          YES → Scope Change (templates/change_request.md)
          NO  → Is the user correcting an ambiguity in the spec?
                  YES → Spec Clarification (update story inline, no template)
                  NO  → Approach Change (templates/change_request.md)
```

## Step 2 — Route

| Category | Action | Bounce Impact | Document Created |
|----------|--------|---------------|------------------|
| **Bug (L1)** | Hotfix Path: Dev fixes, human verifies, merge directly | None — does NOT increment bounce count | `product_plans/hotfixes/HOTFIX-{Date}-{Name}.md` |
| **Bug (L2+)** | Create bug report, add as fix task within current story bounce | None — does NOT increment bounce count | `product_plans/sprints/sprint-{XX}/BUG-{Date}-{Name}.md` |
| **Spec Clarification** | Update Story spec inline (§1 or §2). Add a note in the Change Log. Continue current bounce. | None | No separate document |
| **Scope Change** | **Pause bounce.** Create CR document. Present impact to human. Wait for decision. If approved: update Story spec, reset Dev pass. If rejected: continue as-is. If deferred: add to backlog. | Resets Dev pass. Prior QA/Arch invalidated if change affects tested areas. | `product_plans/sprints/sprint-{XX}/CR-{Date}-{Name}.md` |
| **Approach Change** | Create CR document. Update Story §3 Implementation Guide. Re-delegate to Developer with updated context. | Resets Dev pass. Prior QA/Arch invalidated. | `product_plans/sprints/sprint-{XX}/CR-{Date}-{Name}.md` |

## Step 3 — Log

Every triage event MUST be logged in the Sprint Plan `sprint-{XX}.md` §4 Execution Log:

```
| {Story or N/A} | {Category} | 0 | 0 | — | CR: {One-line description} |
```

Use the Notes column with `CR:` prefix to distinguish from regular story completions.

## Step 4 — Present to Human

After categorizing, the Team Lead MUST present the triage decision to the human:

1. State the category: "This is a **{Bug / Scope Change / Approach Change / Spec Clarification}**."
2. For Bugs: state severity and whether it blocks the current story
3. For Scope/Approach Changes: present the impact assessment from the CR document and ask for decision (Approve / Reject / Defer)
4. For Spec Clarifications: state what was clarified and confirm with human before updating

## Sprint Report Tracking

At sprint consolidation (Step 7), the Team Lead includes a **§2.1 Change Requests** section in the Sprint Report summarizing all mid-sprint triage events:

| Story | Category | Description | Impact | Document |
|-------|----------|-------------|--------|----------|
| STORY-{ID} | Bug | Login crash on plus-sign emails | Fixed via hotfix, no bounce reset | HOTFIX-2026-03-22-login-plus |
| STORY-{ID} | Scope Change | Added forgot-password flow | Dev pass reset, +1 session | CR-2026-03-22-forgot-password |

## Key Rules

- **Never silently absorb a user change.** Always categorize, document, and log it.
- **Bugs don't penalize the bounce count.** They are defects, not process failures.
- **Spec clarifications are cheap.** Update the spec and move on — no ceremony needed.
- **Scope changes require a CR document and human approval.** Always pause, assess impact, and confirm before resuming.
- **Approach changes require a CR document.** The technical pivot must be recorded for audit trail.
- **Correction Tax still applies.** Human intervention is tracked, but the category explains *why*.
- **Everything gets a document or an inline update.** No change goes unrecorded.
