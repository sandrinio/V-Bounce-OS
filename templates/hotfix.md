<instructions>
FOLLOW THIS EXACT STRUCTURE. This is a lightweight alternative to the Epic/Story hierarchy for L1 (Trivial) tasks.

1. **YAML Frontmatter**: Hotfix ID, Status, Target Release, Actor, Complexity Label
2. **§1 The Fix**: What is broken/changing and why
3. **§2 Implementation Instructions**: Which file(s) to change and what to do
4. **§3 Verification**: Simple manual test

Output location: `product_plans/{delivery}/HOTFIX-{Date}-{Name}.md`

Document Hierarchy Position: BYPASS
This document bypasses the Roadmap → Epic → Story hierarchy. It is for L1 (Trivial) changes only (e.g., typos, CSS tweaks, single-line logic fixes).

Constraints:
- Must touch 1-2 files maximum.
- Must NOT introduce new architectural patterns.
- Must NOT require complex new testing infrastructure.
- If it violates these constraints, the Team Lead MUST escalate it to an Epic.

Do NOT output these instructions.
</instructions>

---
hotfix_id: "HOTFIX-{Date}-{Name}"
status: "Draft / Bouncing / Done"
target_release: "D-{NN}_{release_name}"
actor: "{Persona Name / User}"
complexity_label: "L1 (Trivial)"
---

# HOTFIX: {Name}

## 1. The Fix
> What needs to be changed and why.

- **Current Behavior**: {What is wrong}
- **Desired Behavior**: {What it should be}

---

## 2. Implementation Instructions
> Direct commands for the Developer Agent.

- **Files to Modify**: `{filepath}`
- **Instructions**: {e.g., "Change the padding-left from 10px to 20px" or "Fix the typo in the error message."}

> **CONSTRAINT**: If this fix requires modifying more than 2 files, STOP immediately and escalate to the Team Lead. The task must be promoted to an Epic/Story.

---

## 3. Verification
> How the Human or QA agent will quickly verify this.

- [ ] {Simple step, e.g., "Open the settings modal and verify the button is aligned."}
- [ ] Automated tests still pass (`npm test`).
- [ ] **Framework Integrity**: If `brains/` or `skills/` were modified, log to `brains/CHANGELOG.md`.
- [ ] **Post-Fix Action**: Run `./scripts/hotfix_manager.sh ledger "HOTFIX: {Name}" "{Brief Fix Description}"`
- [ ] **Token Tracking**: Run `node scripts/count_tokens.mjs --self --append <this-file> --name Developer`
