<div align="center">
  <img src="icons/light-bulb.svg" width="64" height="64" />
  <h1>The Self-Improvement Pipeline</h1>
  <p><strong>V-Bounce Engine is the first AI framework designed to optimize its own prompt.</strong></p>
</div>

---

Every time your AI team makes a mistake, hits a bug, or hallucinates a dependency, it doesn't just fix the code. It **writes a lesson**. 

At the end of your sprint, the **Self-Improvement Pipeline** analyzes these lessons to permanently upgrade the AI's internal brain, guaranteeing it never makes the exact same mistake twice.

---

## 🔄 How It Works

### 1. The Lesson Flag
During a sprint execution, if the **[<img src="icons/beaker.svg" width="16" style="vertical-align: text-bottom;" /> QA Gate]** or **[<img src="icons/git-branch.svg" width="16" style="vertical-align: text-bottom;" /> Architect Gate]** fails and bounces code back to the Developer, the agent is forced to log the root cause of the failure in `.vbounce/lessons.md`. 
> *Example: "I forgot to check if the database migration ran before starting the server."*

### 2. The Analysis Phase
At the end of your sprint, simply run:
```bash
npx vbounce improve
```
The Engine instantly aggregates all sprint data, measures your **Correction Tax** (how much human intervention was required), and parses all flagged lessons.

### 3. The Brain Upgrade
The pipeline automatically categorizes the failures and proposes permanent, structural fixes to its own framework:
*   **Skill Updates:** It writes new strict rules into its `.vbounce/skills/agent-team/SKILL.md` operating instructions.
*   **Template Evolution:** It adds missing prerequisite checklists to your `.vbounce/templates/story.md`.
*   **Brain Surgery:** It updates the master `brains/CLAUDE.md` prompt context directly.

---

## 📈 Why This Matters

Without a persistent learning loop, an AI coding agent has a **"goldfish memory"**. It will make the exact same architectural oversight on Day 100 that it made on Day 1. 

V-Bounce Engine ensures your AI team **accumulates tribal knowledge** exactly like a human engineering team does. The longer you use it, the smarter, faster, and more perfectly tailored to your specific codebase it becomes.

---

<div align="center">
  <b><a href="README.md">← Back to README</a></b>
</div>
