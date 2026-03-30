---
sprint_id: "S-10"
sprint_goal: "Document Review & Inline Comments — users select text, leave comments, see mustard highlights, and send all comments to Chyro for AI-powered review in one click"
dates: "03/30 - 04/06"
status: "Achieved"
roadmap_ref: "product_plans/strategy/chyro_roadmap.md"
---

# Sprint Report: S-10

## 1. What Was Delivered

### User-Facing (Accessible Now)

- **Inline commenting on documents** — Select any text in a document (markdown, plain text, CSV, DOCX/XLSX), click the purple "Comment" button, type an annotation, and the text highlights in mustard yellow.
- **Hover to preview** — Hover over any mustard highlight to see the comment in a tooltip.
- **Click to edit/delete** — Click a highlight to open an edit popup with the comment pre-filled, or delete it.
- **Multiple comments per document** — Add comments on different sections; all highlights visible simultaneously.
- **Comments survive refresh** — Stored in localStorage, keyed per document. Switching documents shows only that document's comments (vibepm bug fix).
- **Review (N) button** — Appears in the document header next to Download when comments exist. Shows the count.
- **One-click AI review** — Click "Review (N)" to send all comments to Chyro as a structured review message. The AI receives file path, line ranges, selected text, and user annotations as SELECTION CONTEXT in its prompt.
- **Review comment box in chat** — Review messages render as styled cards in the chat, not plain text.
- **Comments auto-clear** — After review send, and when the document is updated via Realtime (stale anchors).
- **"By AI" badge** — AI-created documents now show "By AI" instead of "Blueprint".
- **read_document shows file_path** — AI can now discover where documents live in the folder tree, enabling "move to same folder as X" requests.

### Internal / Backend (Not Directly Visible)

- **`useDocumentComments` hook** — Full comment state management with localStorage sync, keyed by documentId.
- **`InlineCommentLayer` component** — Absolute-positioned div overlay for highlights (vibepm pattern), selection handling, comment popup, hover tooltip, click-to-edit/delete.
- **`findLineRange` utility** — Text-search fallback for line attribution in raw content, with markdown syntax stripping.
- **`SelectionPayload` / `SelectionItem` Pydantic models** — Backend schema for selections field on `ChatStreamRequest`.
- **SELECTION CONTEXT injection** — Backend injects structured selection context into the orchestrator prompt when selections are present.
- **Review wiring** — `WorkspaceLayout` → `TabContent` → `DocumentViewer` (onReview prop) → `ChatPanel` (pendingReview state consumed via useEffect).

### Not Completed

- *(none — all 3 stories delivered)*

### Product Docs Affected

N/A — vdoc not installed.

---

## 2. Story Results

| Story | Epic | Label | Final State | Bounces (QA) | Bounces (Arch) | Correction Tax | Tax Type |
|-------|------|-------|-------------|--------------|----------------|----------------|----------|
| STORY-009-01 Comment Hook + localStorage | EPIC-009 | L2 | Done | 0 | 0 | 0% | — |
| STORY-009-02 Inline Comment UI | EPIC-009 | L2 | Done | 0 | 1 | 0% | — |
| STORY-009-03 Review + Chat + Backend | EPIC-009 | L2 | Done | 1 | 1 | 0% | — |

### Story Highlights

- **STORY-009-01**: Clean first-pass. Hook with add/edit/delete/clearAll, localStorage sync, Realtime clearAll wiring. 10 tests.
- **STORY-009-02**: 1 Architect bounce — InlineCommentLayer was implemented but never rendered in DocumentViewer (dead code). Fixed by wiring into ContentRenderer. 23 tests.
- **STORY-009-03**: 1 QA + 1 Architect bounce (same issue) — React Rules of Hooks violation in MessageRenderer. Early return before useMemo hooks. Fixed by extracting ReviewCommentBox as a separate component. 17 tests.

### 2.1 Change Requests

| Story | Category | Description | Impact |
|-------|----------|-------------|--------|
| 009-02 | Bug | Comment button barely visible (bg-bg-secondary on dark background) | Post-merge hotfix (fd3fc05) |
| 009-02 | Bug | Review button barely visible (bg-accent/10 ghost style) | Post-merge hotfix (9567037) |
| — | Enhancement | Rename "Blueprint" label to "By AI" | Post-merge hotfix (e75661a) |
| 009-03 | Bug | Review button doesn't send to chat (onReview prop never wired) | Post-merge hotfix (4a9659a) |
| 009-03 | Bug | Review button not appearing (two independent useDocumentComments instances) | Post-merge hotfix (d62dd48) |
| 009-02 | Enhancement | Remove yellow comment count badge (Review button already shows count) | Post-merge hotfix (75e128a) |
| — | Enhancement | read_document returns file_path for folder discovery | Post-merge hotfix (24f97a8) |
| 009-02 | Bug | Tooltip shows N times for N-line selections | Post-merge hotfix (ff36a36) |

---

## 3. Execution Metrics

### V-Bounce Quality

| Metric | Value | Notes |
|--------|-------|-------|
| **Stories Planned** | 3 | |
| **Stories Delivered** | 3 | |
| **Stories Escalated** | 0 | |
| **Total QA Bounces** | 1 | STORY-009-03: Rules of Hooks violation |
| **Total Architect Bounces** | 2 | 009-02: dead code, 009-03: Rules of Hooks |
| **Bounce Ratio** | 100% | 2 of 3 stories bounced at least once |
| **Average Correction Tax** | 0% | All agent-driven fixes, no human code intervention |
| **First-Pass Success Rate** | 33% | Only STORY-009-01 passed all gates on first try |
| **Total Tests Written** | 50 | 10 + 23 + 17 |
| **Post-Merge Hotfixes** | 8 | UI visibility, wiring, tooltip, badge, label, path |
| **Merge Conflicts** | 0 | Sequential execution eliminated conflicts |

### Threshold Alerts

- **Bounce Ratio 100%** — 2 of 3 stories bounced. Root causes: (1) Developer didn't wire component into the tree (dead code), (2) Developer violated React Rules of Hooks with early return before useMemo. Both are pattern issues, not spec ambiguity.
- **8 post-merge hotfixes** — High count. Most were UI visibility issues (colors too subtle on dark background) and wiring gaps (onReview prop not passed, shared state not lifted). These suggest the User Walkthrough step should happen before sprint merge, not after.

---

## 4. Lessons Learned

| Source | Lesson | Recorded? | When |
|--------|--------|-----------|------|
| STORY-009-02 Arch bounce | Developer created InlineCommentLayer but never rendered it in DocumentViewer — dead code passed all tests | Candidate | Sprint close |
| STORY-009-03 QA+Arch bounce | Early return before useMemo hooks violates React Rules of Hooks — tests pass in jsdom but crashes in real browser | Candidate | Sprint close |
| Post-merge hotfix (d62dd48) | Two separate calls to the same custom hook create independent state — must lift hook to common parent | Candidate | Sprint close |
| Post-merge hotfix (fd3fc05, 9567037) | bg-bg-secondary and bg-accent/10 are invisible on dark backgrounds for action buttons | Candidate | Sprint close |

---

## 5. Retrospective

### What Went Well

- **3/3 stories delivered** with 50 tests total — full EPIC-009 scope completed in one sprint.
- **vibepm bug fixed** — document-keyed comment isolation prevents cross-document highlight leaks.
- **Text-search fallback** eliminated the need for a remark plugin, saving an entire story.
- **vibepm reference code** guided the highlight rendering pattern (absolute-positioned divs) — proven approach, no experimentation needed.

### What Didn't Go Well

- **8 post-merge hotfixes** — too many issues caught by the user during walkthrough. The biggest ones (Review button not wired, shared state not lifted) should have been caught by the Architect.
- **Developer wiring gaps** — Two stories had the implementation done but not connected to the component tree. The Architect caught one (009-02 dead code) but the second (009-03 onReview prop) slipped through to the user.
- **UI visibility** — Action buttons used overly subtle colors that were invisible on the dark theme. Future stories should explicitly specify button prominence in the story spec.
- **33% first-pass rate** — Below the S-09 100% rate. The new feature area (DOM manipulation, highlight rendering) introduced unfamiliar patterns for the Developer agent.

### Framework Self-Assessment

#### Agent Handoffs

| Finding | Source Agent | Severity | Suggested Fix |
|---------|-------------|----------|---------------|
| Developer created component but didn't wire it into the tree — Architect caught it but only for 009-02, not for 009-03's onReview prop | Architect | Friction | Add "verify new components are rendered in the component tree" to Architect audit checklist |
| Two independent useState hook instances don't share state — not caught by any agent | Developer/Architect | Blocker | Add "verify shared state is lifted to common parent when multiple components need the same data" to Developer implementation checklist |

#### Process Flow

| Finding | Source Agent | Severity | Suggested Fix |
|---------|-------------|----------|---------------|
| 8 post-merge hotfixes suggest User Walkthrough should happen before sprint merge, not after | Team Lead | Friction | Move Step 5.7 (User Walkthrough) before Step 7 (Sprint Consolidation) — test on sprint branch, not main |

---

## 6. Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-03-29 | Sprint Report generated | Team Lead |
