# Discovery Phase — Spike Execution Protocol

> On-demand reference from agent-team/SKILL.md. When and how to run discovery spikes for ambiguous work.

## When Discovery Triggers

1. **Epic-level 🔴 ambiguity** — detected during Epic creation or review via the doc-manager ambiguity assessment rubric.
2. **Story labeled L4** — transitioning to Probing/Spiking state. L4 stories MUST have at least one linked spike before they can progress.
3. **Blocking Open Questions** — Epic §8 has items marked "Blocking" with no ADR or prior decision.

## Spike Lifecycle

```
Open → Investigating → Findings Ready → Validated → Closed
```

| Status | Who Acts | What Happens |
|--------|----------|-------------|
| **Open** | Team Lead | Spike created from `templates/spike.md`, linked in Epic §9 |
| **Investigating** | Developer | Code exploration, prototyping, benchmarks. Fills §4 Findings and §5 Decision |
| **Findings Ready** | Developer → Architect | Developer marks complete. Awaiting Architect validation |
| **Validated** | Architect | Confirms findings against Safe Zone and ADRs. PASS → Validated. FAIL → back to Investigating |
| **Closed** | Team Lead | All §7 Affected Documents checked off. Findings propagated to Epic, Roadmap, Risk Registry |

## Execution Protocol

### Step 1: Create Spike (Team Lead)

1. Identify the blocking unknown (from Epic §8 Open Questions or 🔴 ambiguity signals)
2. Create spike document from `templates/spike.md`
3. Fill §1 Question, §2 Constraints, §3 Approach
4. Set status → Open
5. Link spike in parent Epic §9 Artifact Links
6. Set time box (default: 4 hours for focused questions, 1 day for broader exploration)

### Step 2: Investigate (Developer)

1. Read the spike §1 Question, §2 Constraints, §3 Approach
2. Read parent Epic §4 Technical Context for existing knowledge
3. Investigate using the specified approach (code exploration, prototyping, benchmarks, doc research)
4. Fill §4 Findings with evidence and data
5. Fill §5 Decision with chosen approach, rationale, and rejected alternatives
6. Mark §5 ADR Required if the decision is architectural
7. Fill §6 Residual Risk if unknowns remain
8. Set status → Findings Ready

### Step 3: Validate (Architect)

1. Read the spike §4 Findings and §5 Decision
2. Validate against:
   - Safe Zone compliance (no unauthorized patterns or libraries)
   - Existing ADRs in Roadmap §3 (no contradictions)
   - Risk profile (§6 Residual Risk is acceptable)
3. If **PASS** → status → Validated
4. If **FAIL** → provide specific feedback, status remains Findings Ready, Developer re-investigates

### Step 4: Close & Propagate (Team Lead)

1. Walk through §7 Affected Documents checklist:
   - Update Epic §4 Technical Context with findings
   - Mark Epic §8 Open Questions as resolved
   - Add spike reference to Epic §9 Artifact Links
   - If §5 ADR Required → create new ADR row in Roadmap §3
   - If §6 Residual Risk has entries → add to Risk Registry §1
   - If story-level spike → update Story §3 Implementation Guide
2. Check off all items in §7
3. Set status → Closed
4. Parent story transitions: Probing/Spiking → Refinement

## Timing Rules

- Spikes happen during **planning/refinement**, NOT during sprint execution
- No worktrees needed — spikes produce documents, not code
- Time box is enforced — if the time box expires without findings, the spike is escalated to the human with a status report
- Prototypes created during spikes are **throwaway** — they are NOT committed to any branch

## What Spikes Are NOT

- **Not production code.** Spikes produce findings and decisions, not shippable code.
- **Not QA/DevOps passes.** No bounce sequence, no gate reports, no merge operations.
- **Not a worktree activity.** Spikes are document-level work, not branch-level work.
- **Not open-ended research.** Every spike has a time box and a specific question. If the question is too broad, split into multiple spikes.

## Integration with Bounce Sequence

Spikes gate the transition from Probing/Spiking → Refinement → Ready to Bounce:

```
Story (L4 / 🔴) → Probing/Spiking
  └── Spike(s) created
      └── Developer investigates → Architect validates → Team Lead propagates
          └── All spikes Validated/Closed
              └── Story ambiguity updated (should now be 🟡 or 🟢)
                  └── Story → Refinement → Ready to Bounce
```

No story may enter Ready to Bounce while it has linked spikes in Open, Investigating, or Findings Ready status.
