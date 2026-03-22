---
name: product-graph
description: "Use when you need to understand document relationships, check what's affected by a change, find blocked documents, or assess the state of planning documents. Provides structured awareness of the full product document graph without reading every file. Auto-loaded during planning sessions."
---

# Product Graph — Document Relationship Intelligence

## Purpose

This skill gives you instant awareness of all product planning documents and their relationships. Instead of globbing and reading every file in `product_plans/`, you read a single JSON graph that maps every document, its status, and how it connects to other documents.

## Three-Tier Loading Protocol

When you need to understand the product document landscape, load information in tiers — stop at the tier that answers your question:

### Tier 1: Graph JSON (~400-1000 tokens)
Read `.bounce/product-graph.json` for a bird's-eye view.
- All document IDs, types, statuses, and paths
- All edges (dependencies, parent relationships, feeds)
- **Use when:** answering "what exists?", "what's blocked?", "what depends on X?"

### Tier 2: Specific Frontmatter (~200-500 tokens per doc)
Read the YAML frontmatter of specific documents identified in Tier 1.
- Ambiguity scores, priorities, tags, owners, dates
- **Use when:** you need details about specific documents (not the full set)

### Tier 3: Full Documents (~500-3000 tokens per doc)
Read the complete document body.
- Full specs, scope boundaries, acceptance criteria, open questions
- **Use when:** creating or modifying documents, decomposing epics, or resolving ambiguity

## Edge Type Semantics

| Edge Type | Meaning | Direction |
|-----------|---------|-----------|
| `parent` | Document is a child of another (Story → Epic) | parent → child |
| `depends-on` | Document cannot proceed until dependency is done | dependency → dependent |
| `unlocks` | Completing this document enables another | source → unlocked |
| `context-source` | Document draws context from another | source → consumer |
| `feeds` | Document contributes to a delivery/release | document → delivery |

## When to Regenerate the Graph

Run `vbounce graph` (or `node scripts/product_graph.mjs`) after:
- **Any document edit** that changes status, dependencies, or relationships
- **Sprint lifecycle events** (sprint init, story complete, sprint close)
- **Planning session start** — ensure graph reflects current state
- **Document creation or archival** — new nodes or removed nodes

The graph is a cache — it's cheap to regenerate and stale data is worse than no data.

## Blocked Document Detection

A document is **blocked** when:
1. It has incoming `depends-on` edges from documents with status != "Done"/"Implemented"/"Completed"
2. It has `ambiguity: 🔴 High` and linked spikes are not Validated/Closed
3. Its parent document has status "Parking Lot" or "Escalated"

To find blocked documents:
1. Read the graph (Tier 1)
2. For each node, check its incoming `depends-on` edges
3. Look up the source node's status
4. If any source is not in a terminal state → document is blocked

## Impact Analysis

To understand what changes when you modify a document:
```bash
vbounce graph impact <DOC-ID>        # human-readable
vbounce graph impact <DOC-ID> --json # machine-readable
```

This runs BFS traversal and returns:
- **Direct dependents** — documents immediately affected
- **Transitive dependents** — documents affected through cascading dependencies
- **Upstream feeders** — documents that feed into the changed document

## Graph JSON Schema

```json
{
  "generated_at": "ISO-8601 timestamp",
  "node_count": 5,
  "edge_count": 12,
  "nodes": {
    "EPIC-002": {
      "type": "epic|story|spike|charter|roadmap|delivery-plan|sprint-plan|risk-registry|hotfix",
      "status": "Draft|Refinement|Ready to Bounce|Bouncing|Done|Implemented|...",
      "ambiguity": "🔴 High|🟡 Medium|🟢 Low|null",
      "path": "product_plans/backlog/EPIC-002_.../EPIC-002_....md",
      "title": "Human-readable title from first heading"
    }
  },
  "edges": [
    { "from": "EPIC-002", "to": "D-02", "type": "feeds" }
  ]
}
```

## Keywords

product graph, document graph, dependency, impact analysis, what's affected, what's blocked, document relationships, planning state
