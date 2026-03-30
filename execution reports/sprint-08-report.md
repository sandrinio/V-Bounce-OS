---
title: "Sprint S-08 Report"
sprint_id: "S-08"
status: "Closed"
---

# Sprint S-08 Report — RAG v2: Structure-Aware Extraction + Hybrid Search

## Sprint Goal
RAG v2 — Hybrid search, structure-aware extraction, table storage, and orchestrator query tool.

## Status: Achieved

## Stories Delivered

| Story | Title | QA Bounces | Correction Tax |
|-------|-------|------------|----------------|
| STORY-013-00 | Supabase RPC Cleanup | 0 | 0% |
| STORY-013-06 | Content Hash Change Detection | 0 | 0% |
| STORY-013-01 | Hybrid Search (FTS + pgvector RRF) | 0 | 5% |
| STORY-013-05 | Markdown-Aware Chunking | 1 | 0% |
| STORY-013-02 | Structured Row Storage (CSV/XLSX) | 0 | 5% |
| STORY-013-03 | DOCX Table Extraction | 0 | 0% |
| STORY-013-04 | Docling PDF Extraction | 0 | 0% |
| STORY-013-07 | safe_query + query_table Tool | 1 | 0% |
| STORY-013-08 | Audit & Stabilization | 0 | 0% |

## Additional Work (post-sprint, pre-close)
- STORY-013-09: Query Rewriting for Improved Retrieval Recall — Done
- STORY-013-10: Inline Source Citations in Chat Responses — Done
- STORY-013-11: Tune top_k and Context Token Budget — Done
- describe_table tool for schema discovery (text-to-SQL best practice)
- Content hash skip bug fix (verify embeddings exist before skipping extraction)
- Gemini SDK migration (google.generativeai → google.genai)
- Citation SSE race condition fix (send citations before done event)

## Key Outcomes
- Hybrid search combining FTS + pgvector cosine similarity via RRF scoring
- Structure-aware extraction for PDF (Docling), DOCX tables, CSV/XLSX → chy_document_rows
- query_table + describe_table orchestrator tools for structured data queries
- safe_query() with CTE shadowing for workspace isolation
- Query rewriting via Gemini Flash for improved retrieval recall
- Inline source citations ([N] markers) with frontend CitationBadge component
- Tuned defaults: top_k=10, context_token_limit=24000

## Metrics
- Stories: 9/9 delivered (+ 3 bonus stories)
- Total QA bounces: 2
- Average correction tax: ~1%
- Test coverage: 82+ backend tests passing
- Sprint goal: Achieved
