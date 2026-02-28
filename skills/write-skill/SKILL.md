---
name: write-skill
description: Use when creating or updating Claude Code skills. Applies Anthropic best practices and persuasion principles for effective skill authoring.
---

# Skill Authoring

Creates or updates Claude Code skills following Anthropic's best practices and tested persuasion principles.

**Core principle:** No skill without a failing test first. RED-GREEN-REFACTOR for process documentation.

## Trigger

`/write-skill` OR `/write-skill [skill-name]` OR when creating/modifying any `.claude/skills/` content.

## Announcement

When using this skill, state: "I'm using the write-skill skill to author an effective skill definition."

## Action

### 1. Baseline (RED Phase)

Before writing, establish that the skill is needed:
- What specific failure or gap does this skill address?
- Can you demonstrate the failure WITHOUT the skill?
- If you can't show a gap, you don't need a new skill.

### 2. Write Minimal Skill (GREEN Phase)

Create the skill at `.claude/skills/[name]/SKILL.md` with this structure:

```yaml
---
name: [kebab-case-name]
description: [Use when... — must start with triggering conditions, not workflow summary]
---
```

**Structure requirements:**
- YAML frontmatter: `name` and `description` only
- Description MUST start with "Use when..."
- Include searchable keywords (errors, symptoms, tools)
- Clear overview with core principle
- Inline code for simple patterns; separate files for heavy reference

**Size constraints:**
- Keep SKILL.md under 500 lines
- Split into reference files when approaching limit
- Structure references one level deep from SKILL.md
- Include table of contents for reference files over 100 lines

### 3. Apply Persuasion Principles

Use the right language patterns based on skill type:

| Skill Type | Use | Avoid |
|:---|:---|:---|
| **Discipline-enforcing** (TDD, verification) | Authority + Commitment + Social Proof | Liking, Reciprocity |
| **Guidance/technique** | Moderate Authority + Unity | Heavy authority |
| **Collaborative** | Unity + Commitment | Authority, Liking |
| **Reference** | Clarity only | All persuasion |

**Effective patterns:**
- Imperative: "YOU MUST", "Never", "Always", "No exceptions"
- Commitment: "Announce: I'm using [Skill Name]"
- Scarcity: "IMMEDIATELY after X", "Before proceeding"
- Social proof: "Every time", "X without Y = failure"
- Unity: "We're colleagues", "our codebase"

**Example — discipline skill:**
```markdown
✅ Write code before test? Delete it. Start over. No exceptions.
❌ Consider writing tests first when feasible.
```

### 4. Refine (REFACTOR Phase)

- Test the skill across different scenarios
- Plug loopholes where the agent might rationalize skipping steps
- Add anti-rationalization language for critical rules
- Verify the skill works with the target model

### 5. Skill Type Checklist

**Techniques** (step-by-step methods):
- [ ] Clear trigger conditions
- [ ] Ordered action steps
- [ ] Explicit wait points
- [ ] Output format example

**Patterns** (mental models):
- [ ] Recognition criteria
- [ ] When to apply vs. when not to
- [ ] Examples of correct application

**References** (API docs/guides):
- [ ] Table of contents
- [ ] Searchable headings
- [ ] Code examples with correct/incorrect pairs

## Content Guidelines

- **Assume Claude's intelligence** — don't over-explain what can be inferred
- **Match specificity to fragility:**
  - High freedom (text instructions) → flexible tasks
  - Medium freedom (pseudocode) → preferred patterns
  - Low freedom (exact scripts) → error-prone operations
- **Avoid time-sensitive information** — use "old patterns" sections for deprecated approaches
- **Use consistent terminology** — choose one term, not synonyms
- **Use checklists** for multi-step operations (copyable via TodoWrite)
- **Include validation loops** — run validator → fix → repeat

## Anti-Patterns

- Narrative examples (use code pairs instead)
- Multi-language dilution (focus on the project's stack)
- Code in flowcharts (use real code blocks)
- Generic labels ("Step 1", "Step 2" without context)
- Vague skill names ("helper", "utility")
- Offering excessive options without clear defaults
- Deeply nested file references (one level deep max)

## Deployment Checklist

Before marking complete:
- [ ] RED: Demonstrated the gap without the skill
- [ ] GREEN: Wrote minimal content addressing the gap
- [ ] REFACTOR: Tested and plugged loopholes
- [ ] Description starts with "Use when..."
- [ ] SKILL.md under 500 lines
- [ ] References one level deep
- [ ] Tested against real task scenarios
