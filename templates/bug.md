<instructions>
FOLLOW THIS EXACT STRUCTURE. This documents a defect found during or after sprint execution.

1. **YAML Frontmatter**: Bug ID, Status, Severity, Found During, Affected Story, Reporter
2. **§1 The Bug**: What's broken, reproduction steps, expected vs actual
3. **§2 Impact**: What's affected, is it blocking?
4. **§3 Fix Approach**: Proposed fix, affected files, estimated complexity
5. **§4 Verification**: How to verify the fix

When to use this template:
- User reports something is broken mid-sprint
- QA discovers a defect not covered by acceptance criteria
- Post-sprint manual review finds an issue
- A previously working feature regresses

Triage rules (from mid-sprint-triage.md):
- If the bug is L1 (1-2 files, trivial fix) → use templates/hotfix.md instead
- If the bug is larger → use THIS template, add to current sprint as a fix task
- Bug fixes do NOT increment QA/Architect bounce counts

Output location: `product_plans/sprints/sprint-{XX}/BUG-{Date}-{Name}.md`
If no sprint is active: `product_plans/backlog/BUG-{Date}-{Name}.md`

Do NOT output these instructions.
</instructions>

---
bug_id: "BUG-{YYYY-MM-DD}-{name}"
status: "Open / In Progress / Fixed / Wont Fix"
severity: "Critical / High / Medium / Low"
found_during: "Sprint S-{XX} / Post-Sprint Review / User Report"
affected_story: "STORY-{ID} / N/A (pre-existing)"
reporter: "{human / QA / user}"
---

# BUG: {Short Description}

## 1. The Bug

**Current Behavior:**
{What happens — be specific}

**Expected Behavior:**
{What should happen instead}

**Reproduction Steps:**
1. {Step 1}
2. {Step 2}
3. {Observe: ...}

**Environment:**
- {Browser/OS/Node version if relevant}
- {Branch: sprint/S-XX or main}

---

## 2. Impact

- **Blocking?** {Yes — blocks STORY-{ID} / No — cosmetic / degraded}
- **Affected Areas:** {Which features, pages, or flows}
- **Users Affected:** {All users / specific persona / edge case only}
- **Data Impact:** {None / corrupted data / lost data}

---

## 3. Fix Approach

- **Root Cause:** {Why it's broken — if known}
- **Proposed Fix:** {What to change}
- **Files to Modify:** `{filepath1}`, `{filepath2}`
- **Complexity:** {L1 Trivial / L2 Standard / L3 Complex}

> If complexity is L1 → consider using `templates/hotfix.md` instead for faster resolution.

---

## 4. Verification

- [ ] {Reproduction steps no longer reproduce the bug}
- [ ] {Existing tests still pass}
- [ ] {New test covers the bug scenario — if applicable}
- [ ] Run `./scripts/hotfix_manager.sh ledger "BUG: {Name}" "{Brief description}"`

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| {YYYY-MM-DD} | {name} | Created |
