<instructions>
FOLLOW THIS EXACT STRUCTURE. This documents a scope change or new requirement discovered mid-sprint.

1. **YAML Frontmatter**: CR ID, Status, Category, Urgency, Affected Stories, Requestor
2. **§1 The Change**: What's being requested and why
3. **§2 Impact Assessment**: What it affects, what breaks, what gets delayed
4. **§3 Decision**: Approved action with rationale
5. **§4 Execution Plan**: How the change will be handled

When to use this template:
- User requests a new feature or scope expansion mid-sprint
- User wants to change the technical approach of an active story
- External dependency change forces a pivot
- Requirements discovered during implementation that weren't in the original spec

Categories (from mid-sprint-triage.md):
- **Scope Change**: Adding/removing/modifying requirements → use THIS template
- **Approach Change**: Different technical path → use THIS template
- **Spec Clarification**: Just clarifying ambiguity → do NOT use this template (update story spec inline)
- **Bug**: Something is broken → use .vbounce/templates/bug.md instead

Triage rules:
- Scope changes PAUSE the active bounce until the human approves
- Approach changes reset the Dev pass
- All CRs are logged in Sprint Plan §4 Execution Log with event type "CR"
- CRs that can't fit in the current sprint go to backlog for next sprint planning

Output location: `product_plans/sprints/sprint-{XX}/CR-{Date}-{Name}.md`
If no sprint is active: `product_plans/backlog/CR-{Date}-{Name}.md`

Do NOT output these instructions.
</instructions>

---
cr_id: "CR-{YYYY-MM-DD}-{name}"
status: "Open / Approved / Rejected / Deferred"
category: "Scope Change / Approach Change"
urgency: "Blocking / This Sprint / Next Sprint"
affected_stories: ["STORY-{ID}"]
requestor: "{human / AI / external}"
---

# CR: {Short Description}

## 1. The Change

**What is being requested:**
{Describe the change clearly}

**Why:**
{Business reason, user feedback, technical discovery, external dependency change}

**Original vs Proposed:**
| Aspect | Original | Proposed |
|--------|----------|----------|
| {Scope/Approach/Tech} | {What was planned} | {What's now requested} |

---

## 2. Impact Assessment

**Affected Stories:**
| Story | Current State | Impact |
|-------|--------------|--------|
| STORY-{ID} | {Bouncing / QA Passed / ...} | {Must restart Dev / Spec update only / Blocked} |

**Sprint Impact:**
- {Does this delay the sprint? By how much?}
- {Does this invalidate completed work?}
- {Does this require new stories?}

**Risk:**
- {What could go wrong if we make this change?}
- {What could go wrong if we DON'T make this change?}

---

## 3. Decision

> Filled by human after reviewing the impact assessment.

**Decision:** {Approved / Rejected / Deferred to S-{XX}}

**Rationale:** {Why this decision}

**Conditions:** {Any constraints on the approved change}

---

## 4. Execution Plan

> Filled after decision is approved.

- **Stories affected:** {Which stories need spec updates}
- **New stories needed:** {If any — add to backlog or current sprint}
- **Bounce impact:** {Which passes reset — Dev only / Dev + QA / full restart}
- **Timeline:** {Can it fit in current sprint or deferred?}

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| {YYYY-MM-DD} | {name} | Created |
