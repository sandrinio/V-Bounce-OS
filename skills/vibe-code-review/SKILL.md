---
name: vibe-code-review
description: "A code quality and architecture review skill designed for AI-generated (vibe-coded) codebases. Use this skill whenever the user asks to review, audit, analyze, or assess code quality of a project — especially one built with AI agents. Trigger on phrases like 'review my code', 'check code quality', 'is my architecture solid', 'run a health check', 'audit my codebase', 'check for tech debt', 'analyze my project', or any mention of code review for vibe-coded or agent-generated projects. Also trigger when the user asks about architectural consistency, error handling quality, duplication, coupling, dependency health, or test quality. This skill runs in phases — from quick PR-level diffs to full codebase scans — and produces structured reports a non-coder can understand."
---

# Vibe Code Review Skill

## Purpose

This skill reviews AI-generated codebases for structural integrity without requiring the user to read code. It shifts the review model from "read every line" to "validate the architecture" — like a building inspector checking foundation, load-bearing walls, and plumbing rather than every brick.

## When to Use

- User asks to review or audit code quality
- User wants to know if their vibe-coded project is architecturally sound
- User wants a health check on a codebase they didn't write themselves
- User asks about tech debt, coupling, duplication, or error handling
- User wants a PR or git diff analyzed before merging
- User wants to compare code quality over time

## How It Works

The skill operates in **four review modes** depending on what the user needs. Always ask which mode they want, or infer from context. Read the appropriate reference file before executing.

| Mode | When to Use | Reference |
|------|-------------|-----------|
| **Quick Scan** | Fast health check of the whole project | `references/quick-scan.md` |
| **PR Review** | Analyze a git diff or set of changed files | `references/pr-review.md` |
| **Deep Audit** | Comprehensive full-codebase analysis | `references/deep-audit.md` |
| **Trend Check** | Compare metrics over time | `references/trend-check.md` |

## Workflow

1. **Identify the mode** — Ask the user or infer from their request
2. **Read the reference file** for that mode — it contains the exact checks and scripts to run
3. **Detect the tech stack** — Look at package.json, requirements.txt, go.mod, Cargo.toml, etc. to determine language and framework
4. **Run the checks** — Execute the scripts and analysis steps from the reference file
5. **Generate the report** — Use the report template from `references/report-template.md`
6. **Explain in plain language** — The user may not read code. Every finding needs a "what this means" explanation using real-world analogies

## Core Principles

These six dimensions form the backbone of every review, regardless of mode:

1. **Architectural Consistency** — Is the codebase using one pattern or five? AI agents mix MVC, event-driven, and procedural styles. Map the patterns in use and flag conflicts.

2. **Error Handling** — What happens when things fail? AI-generated code handles happy paths beautifully and ignores edge cases. Look for empty catch blocks, swallowed errors, missing validation, and absent retry logic.

3. **Data Flow** — Can you trace how data moves from input to storage to output? If the data flow is untraceable, security vulnerabilities are hiding. Flag any data path that can't be followed in under 2 minutes.

4. **Duplication** — AI agents reinvent solutions constantly. The same utility function appears in three files with slightly different implementations. Detect near-duplicates, not just exact copies.

5. **Test Quality** — Coverage percentages are meaningless if tests don't catch real bugs. Assess whether tests would actually break if logic changed. When possible, suggest mutation testing.

6. **Coupling** — How tangled are the modules? Can you change one component without breaking five others? This is the most important long-term sustainability metric. Visualize the dependency graph.

## Non-Coder-Friendly Explanations

Every finding in the report must include a plain-language analogy. The user orchestrates AI agents — they understand systems thinking, but not code syntax. Use analogies like:

- **High coupling** → "Pulling one wire in the wall takes down the whole electrical system"
- **Empty catch blocks** → "Your smoke detectors have dead batteries — fires happen silently"
- **Duplication** → "Three different departments each built their own payroll system"
- **Architectural inconsistency** → "Half the building uses metric, half uses imperial"
- **Dead code** → "Rooms in the house that no hallway leads to"
- **Dependency bloat** → "You hired 50 subcontractors for a 3-person job"

## Keywords

code review, code quality, architecture review, tech debt, vibe coding, AI-generated code, agent code, health check, audit, duplication, coupling, error handling, dependency check, PR review, git diff analysis, codebase scan
