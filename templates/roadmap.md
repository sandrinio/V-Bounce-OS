<instructions>
FOLLOW THIS EXACT STRUCTURE. Output sections in order 1-7.

1. **Header**: Set Status, Last Updated, link to Charter
2. **§1 Strategic Context**: Vision (from Charter), primary goal, target users, success metrics
3. **§2 Release Plan**: Group epics into named releases with exit criteria — NOT sprint-level tracking
4. **§3 Technical Architecture Decisions**: Key choices with rationale and status (this is the ADR log)
5. **§4 Dependencies & Integration Map**: External services, cross-epic dependencies, blocking relationships
6. **§5 Strategic Constraints**: Budget, capacity, hard deadlines, regulatory requirements
7. **§6 Open Questions**: Unresolved items that affect strategic direction
8. **§7 Delivery Log**: Release notes for completed deliveries (appended by Team Lead on delivery archive)
9. **§8 Change Log**: Auto-appended on updates

Output location: `product_plans/{project}_roadmap.md`

Role of this document:
- This is the STRATEGIC layer between Charter (why) and Delivery Plan (operational execution).
- It answers: "What are we shipping, in what order, and what architectural bets are we making?"
- It does NOT track sprint-level progress — that belongs in the Delivery Plan.
- It does NOT track individual story status — that belongs in the Delivery Plan.
- It DOES define release milestones, architectural decisions, and strategic constraints.

Document Hierarchy Position: LEVEL 2 — STRATEGIC
Charter (why) → **Roadmap** (strategic what/when) → Epic (detailed what) → Story (how) → Delivery Plan (execution) → Risk Registry (risks)

Do NOT output these instructions.
</instructions>

# Product Roadmap: {Project Name}

---

> **Last Updated**: {YYYY-MM-DD}
> **Status**: Planning / Active / MVP Complete / Shipped
> **Charter**: `product_plans/{project}_charter.md`
> **Risk Registry**: `product_plans/RISK_REGISTRY.md`

---

## 1. Strategic Context

| Key | Value |
|-----|-------|
| **Vision** | {One sentence from Charter §1.1} |
| **Primary Goal** | {Main objective for this project window} |
| **Tech Stack** | {e.g., Next.js, FastAPI, Supabase} |
| **Target Users** | {Primary user persona from Charter} |

### Success Metrics
> Pulled from Charter §1.3. These define when the project is "done."

- {Metric 1: e.g., "User signup conversion > 60%"}
- {Metric 2: e.g., "Page load < 2s on 3G"}

---

## 2. Release Plan

> Group epics into named releases with clear exit criteria. Each release is a shippable milestone.
> Releases are NOT sprints — a release may span multiple sprints.
> Sprint-level tracking belongs in the Delivery Plan.

### Release 1: {Release Name} (e.g., "Foundation")
**Target**: {YYYY-MM-DD or Quarter}
**Exit Criteria**: {What must be true for this release to ship — e.g., "Users can sign up, log in, and see dashboard"}

| Epic | Priority | Status | Notes |
|------|----------|--------|-------|
| EPIC-001: {Name} | P0 | Draft / Ready / In Progress / Done | {Dependencies or blockers} |
| EPIC-002: {Name} | P1 | Draft | |

### Release 2: {Release Name} (e.g., "Core Features")
**Target**: {YYYY-MM-DD or Quarter}
**Exit Criteria**: {e.g., "Full CRUD on all entities, third-party integration live"}

| Epic | Priority | Status | Notes |
|------|----------|--------|-------|
| EPIC-003: {Name} | P0 | Draft | |

### Release 3: {Release Name} (e.g., "Polish & Scale")
**Target**: {YYYY-MM-DD or Quarter}
**Exit Criteria**: {e.g., "Performance targets met, monitoring in place"}

| Epic | Priority | Status | Notes |
|------|----------|--------|-------|
| {Future Epics} | | | |

---

## 3. Technical Architecture Decisions

> Architecture Decision Records (ADRs). Agents reference these when hitting ambiguity.
> Each decision is immutable once "Decided" — create a new row to override.

| ID | Decision | Choice | Rationale | Status | Date |
|----|----------|--------|-----------|--------|------|
| ADR-001 | Auth Provider | {e.g., Supabase Auth} | {Why — cost, speed, integration} | Decided / Proposed / Superseded | {YYYY-MM-DD} |
| ADR-002 | Database | {e.g., PostgreSQL via Supabase} | {Why} | Decided | |
| ADR-003 | Hosting | {e.g., Vercel + Railway} | {Why} | Proposed | |
| ADR-004 | State Management | {e.g., Zustand} | {Why} | Decided | |

---

## 4. Dependencies & Integration Map

> External services, cross-epic dependencies, and anything that blocks progress if unavailable.

### External Dependencies
| Service | Purpose | Status | Risk if Unavailable |
|---------|---------|--------|---------------------|
| {e.g., Stripe API} | Payment processing | Available / Pending Access / TBD | {e.g., "Cannot ship Release 2"} |
| {e.g., SendGrid} | Transactional email | Available | Low — fallback exists |

### Cross-Epic Dependencies
| Epic | Depends On | Relationship | Status |
|------|------------|--------------|--------|
| EPIC-003 | EPIC-001 | Requires auth system | Blocked / Ready |
| EPIC-004 | EPIC-002 | Shares data model | In Progress |

---

## 5. Strategic Constraints

> Hard boundaries that shape prioritization and scope. These override feature requests.

| Constraint | Type | Impact | Mitigation |
|------------|------|--------|------------|
| {e.g., Launch by Q2 2026} | Deadline | Caps scope to Release 1 + 2 | Cut P2 epics if behind |
| {e.g., Solo developer} | Capacity | Max 2 epics per sprint | Lean on AI agents for L1-L2 stories |
| {e.g., GDPR compliance} | Regulatory | Must audit data flows before launch | Include in Release 1 exit criteria |
| {e.g., $0 infrastructure budget} | Budget | Free-tier only | Supabase free tier + Vercel hobby |

---

## 6. Open Questions

> Unresolved items that affect strategic direction. Operational questions go in the Delivery Plan.

| Question | Options | Impact | Owner | Status |
|----------|---------|--------|-------|--------|
| {e.g., "Build mobile app or PWA?"} | A: Native, B: PWA | Affects Release 3 scope | {name} | Open / Decided |
| {e.g., "Self-host or managed DB?"} | A: Supabase, B: PlanetScale | ADR-002 | {name} | Decided |

---

## 7. Delivery Log

> Appended by Team Lead when a delivery (release) is archived.
> Each entry is the release notes — a summary of sprint reports from that delivery.

### D-{NN}: {Release Name}
**Delivered**: {YYYY-MM-DD}
**Release Tag**: v{VERSION}
**Delivery Folder**: `product_plans/archive/D-{NN}_{release_name}/`

**Release Notes**:
> {Summary of what was shipped — compiled from sprint reports. Key features, important fixes, architectural changes.}

**Metrics**:
| Metric | Value |
|--------|-------|
| Stories Delivered | {X} |
| Stories Escalated | {Y} |
| Total Sprints | {N} |
| Average Bounce Ratio | {X}% |
| Average Correction Tax | {X}% |

---

## 8. Change Log

<!-- Auto-appended when Roadmap is updated -->

| Date | Change | By |
|------|--------|-----|
| {YYYY-MM-DD} | Initial creation from Charter | Architect |
