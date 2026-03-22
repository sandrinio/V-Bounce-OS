#!/usr/bin/env node

/**
 * count_tokens.mjs
 * Counts tokens used in the current Claude Code session or subagent.
 *
 * How it works:
 *   Parses Claude Code's JSONL session files (stored at ~/.claude/projects/)
 *   and sums token usage from all assistant messages.
 *
 * Usage:
 *   node scripts/count_tokens.mjs                  # current session (auto-detect)
 *   node scripts/count_tokens.mjs --session <ID>   # specific session
 *   node scripts/count_tokens.mjs --agent <ID>     # specific subagent
 *   node scripts/count_tokens.mjs --all             # all subagents in current session
 *   node scripts/count_tokens.mjs --json            # JSON output (for YAML frontmatter)
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const args = process.argv.slice(2);
let sessionId = null;
let agentId = null;
let showAll = false;
let showSelf = false;
let jsonOutput = false;
let appendTo = null;
let agentName = null;
let sprintSummary = null;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--session': sessionId = args[++i]; break;
    case '--agent': agentId = args[++i]; break;
    case '--all': showAll = true; break;
    case '--self': showSelf = true; break;
    case '--json': jsonOutput = true; break;
    case '--append': appendTo = args[++i]; break;
    case '--name': agentName = args[++i]; break;
    case '--sprint': sprintSummary = args[++i]; break;
    case '--help': case '-h':
      console.log(`Usage:
  count_tokens.mjs                  # current session totals
  count_tokens.mjs --all            # all subagents in current session
  count_tokens.mjs --self           # auto-detect own subagent (for agents to self-report)
  count_tokens.mjs --self --append <story.md> --name Developer  # write tokens to story doc
  count_tokens.mjs --sprint S-01    # aggregate tokens from all stories in a sprint
  count_tokens.mjs --agent <ID>     # specific subagent
  count_tokens.mjs --session <ID>   # specific session
  count_tokens.mjs --json           # JSON output for reports`);
      process.exit(0);
  }
}

// ── Sprint aggregation (reads Token Usage tables from story docs) ─
// This runs independently of Claude Code session files — just parses markdown.

if (sprintSummary) {
  const ROOT = path.resolve(process.cwd());
  const sprintNum = sprintSummary.replace('S-', '');

  let sprintDir = path.join(ROOT, 'product_plans', 'sprints', `sprint-${sprintNum}`);
  if (!fs.existsSync(sprintDir)) {
    sprintDir = path.join(ROOT, 'product_plans', 'archive', 'sprints', `sprint-${sprintNum}`);
  }
  if (!fs.existsSync(sprintDir)) {
    console.error(`ERROR: Sprint directory not found for ${sprintSummary}`);
    process.exit(1);
  }

  aggregateSprintTokens(sprintDir, sprintSummary);
  process.exit(0);
}

// ── Find Claude Code project directory ───────────────────────────

const CLAUDE_DIR = path.join(os.homedir(), '.claude', 'projects');
const CWD = process.cwd();

/**
 * Convert a path to Claude Code's project directory name format.
 * e.g., /Users/foo/bar → -Users-foo-bar
 */
function pathToProjectDir(dirPath) {
  return dirPath.replace(/\//g, '-').replace(/^-/, '-');
}

function findProjectDir() {
  if (!fs.existsSync(CLAUDE_DIR)) return null;

  // Get all project dirs on disk for fuzzy matching
  const projectDirs = fs.readdirSync(CLAUDE_DIR).filter(d =>
    fs.statSync(path.join(CLAUDE_DIR, d)).isDirectory() || fs.existsSync(path.join(CLAUDE_DIR, d))
  );

  // Try exact and parent directory matches
  let dir = CWD;
  while (dir !== path.dirname(dir)) {
    const candidate = pathToProjectDir(dir);
    const candidatePath = path.join(CLAUDE_DIR, candidate);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
    // Claude Code may normalize special chars (underscores → dashes)
    const normalized = candidate.replace(/_/g, '-');
    const normalizedPath = path.join(CLAUDE_DIR, normalized);
    if (normalized !== candidate && fs.existsSync(normalizedPath)) {
      return normalizedPath;
    }
    dir = path.dirname(dir);
  }

  return null;
}

const projectDir = findProjectDir();
if (!projectDir) {
  console.error('ERROR: Could not find Claude Code project directory.');
  console.error(`Looked for: ${pathToProjectDir(CWD)} in ${CLAUDE_DIR}`);
  process.exit(1);
}

// ── Find session JSONL ───────────────────────────────────────────

function findLatestSession() {
  const files = fs.readdirSync(projectDir)
    .filter(f => f.endsWith('.jsonl') && !f.startsWith('.'))
    .map(f => ({
      name: f,
      id: f.replace('.jsonl', ''),
      mtime: fs.statSync(path.join(projectDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0] : null;
}

// ── Parse token usage from JSONL ─────────────────────────────────

/**
 * Parse a JSONL file and sum token usage from all assistant messages.
 * @param {string} filePath
 * @returns {{ input_tokens: number, output_tokens: number, cache_read: number, cache_creation: number, messages: number }}
 */
function parseTokenUsage(filePath) {
  const totals = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read: 0,
    cache_creation: 0,
    messages: 0,
  };

  if (!fs.existsSync(filePath)) return totals;

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());

  const seenRequests = new Set();

  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg.type !== 'assistant') continue;

      // Deduplicate by requestId (parallel tool calls share the same message)
      const reqId = msg.message?.requestId || msg.requestId;
      if (reqId && seenRequests.has(reqId)) continue;
      if (reqId) seenRequests.add(reqId);

      const usage = msg.message?.usage || msg.usage;
      if (!usage) continue;

      totals.input_tokens += usage.input_tokens || 0;
      totals.output_tokens += usage.output_tokens || 0;
      totals.cache_read += usage.cache_read_input_tokens || 0;
      totals.cache_creation += usage.cache_creation_input_tokens || 0;
      totals.messages++;
    } catch {
      // Skip malformed lines
    }
  }

  return totals;
}

/**
 * Read all story files in a sprint folder, parse their Token Usage tables,
 * and output aggregated data.
 */
function aggregateSprintTokens(sprintDir, sprintId) {
  const files = fs.readdirSync(sprintDir).filter(f =>
    f.endsWith('.md') && (f.startsWith('STORY-') || f.startsWith('BUG-') || f.startsWith('HOTFIX-'))
  );

  const stories = [];
  let totalInput = 0;
  let totalOutput = 0;
  let totalAll = 0;

  for (const file of files) {
    const content = fs.readFileSync(path.join(sprintDir, file), 'utf8');
    const storyId = file.replace('.md', '');

    // Parse Token Usage table
    const agents = [];
    const lines = content.split('\n');
    let inTokenTable = false;
    let pastHeader = false;

    for (const line of lines) {
      if (line.includes('## Token Usage')) { inTokenTable = true; continue; }
      if (!inTokenTable) continue;
      if (!line.startsWith('|')) { if (pastHeader) break; continue; }

      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      // Skip header and separator rows
      if (cells[0] === 'Agent' || cells[0].startsWith('-')) { pastHeader = true; continue; }
      pastHeader = true;

      const name = cells[0];
      const input = parseInt(cells[1]?.replace(/,/g, ''), 10) || 0;
      const output = parseInt(cells[2]?.replace(/,/g, ''), 10) || 0;
      const total = parseInt(cells[3]?.replace(/,/g, ''), 10) || (input + output);

      agents.push({ name, input, output, total });
      totalInput += input;
      totalOutput += output;
      totalAll += total;
    }

    if (agents.length > 0) {
      stories.push({ storyId, agents, total: agents.reduce((s, a) => s + a.total, 0) });
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({
      sprint: sprintId,
      total_input_tokens: totalInput,
      total_output_tokens: totalOutput,
      total_tokens: totalAll,
      stories,
    }, null, 2));
  } else {
    console.log(`\n📊 Sprint Token Summary — ${sprintId}\n`);

    if (stories.length === 0) {
      console.log('No token usage data found in story documents.');
      console.log('Agents must run: count_tokens.mjs --self --append <story.md> --name <Agent>');
      process.exit(0);
    }

    // Per-story table
    console.log(`${'  Story'.padEnd(45)} ${'Input'.padStart(10)} ${'Output'.padStart(10)} ${'Total'.padStart(10)}`);
    console.log(`${'  ' + '─'.repeat(43)} ${'─'.repeat(10)} ${'─'.repeat(10)} ${'─'.repeat(10)}`);
    for (const story of stories) {
      const name = story.storyId.length > 41 ? story.storyId.substring(0, 41) + '...' : story.storyId;
      const storyInput = story.agents.reduce((s, a) => s + a.input, 0);
      const storyOutput = story.agents.reduce((s, a) => s + a.output, 0);
      console.log(`  ${name.padEnd(43)} ${fmt(storyInput).padStart(10)} ${fmt(storyOutput).padStart(10)} ${fmt(story.total).padStart(10)}`);
      for (const a of story.agents) {
        console.log(`    ${('└ ' + a.name).padEnd(41)} ${fmt(a.input).padStart(10)} ${fmt(a.output).padStart(10)} ${fmt(a.total).padStart(10)}`);
      }
    }
    console.log(`${'  ' + '─'.repeat(43)} ${'─'.repeat(10)} ${'─'.repeat(10)} ${'─'.repeat(10)}`);
    console.log(`  ${'SPRINT TOTAL'.padEnd(43)} ${fmt(totalInput).padStart(10)} ${fmt(totalOutput).padStart(10)} ${fmt(totalAll).padStart(10)}`);
    console.log('');
  }
}

// ── Main (session-based tracking) ────────────────────────────────

const session = sessionId
  ? { id: sessionId, name: `${sessionId}.jsonl` }
  : findLatestSession();

if (!session) {
  console.error('ERROR: No session JSONL files found.');
  process.exit(1);
}

const sessionPath = path.join(projectDir, session.name);

if (showSelf) {
  // ── Self-detect: find the most recently modified subagent JSONL (likely "me") ──
  const agentDir = path.join(projectDir, session.id, 'subagents');

  if (!fs.existsSync(agentDir)) {
    // Not running as a subagent — fall back to session totals
    const usage = parseTokenUsage(sessionPath);
    outputUsage('session', usage);
    process.exit(0);
  }

  const agentFiles = fs.readdirSync(agentDir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      name: f,
      path: path.join(agentDir, f),
      mtime: fs.statSync(path.join(agentDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (agentFiles.length === 0) {
    const usage = parseTokenUsage(sessionPath);
    outputUsage('session', usage);
    process.exit(0);
  }

  // Most recently modified = the currently running agent
  const self = agentFiles[0];
  const usage = parseTokenUsage(self.path);

  if (appendTo) {
    appendTokenRow(appendTo, agentName || 'Agent', usage);
  } else {
    outputUsage(self.name.replace('.jsonl', ''), usage);
  }

} else if (agentId) {
  // ── Single subagent ──
  const agentDir = path.join(projectDir, session.id, 'subagents');
  const agentFile = path.join(agentDir, `agent-${agentId}.jsonl`);

  if (!fs.existsSync(agentFile)) {
    // Try fuzzy match
    if (fs.existsSync(agentDir)) {
      const matches = fs.readdirSync(agentDir).filter(f => f.includes(agentId));
      if (matches.length === 1) {
        const usage = parseTokenUsage(path.join(agentDir, matches[0]));
        outputUsage(matches[0].replace('.jsonl', ''), usage);
        process.exit(0);
      }
    }
    console.error(`ERROR: Agent "${agentId}" not found in session ${session.id}`);
    process.exit(1);
  }

  const usage = parseTokenUsage(agentFile);
  outputUsage(`agent-${agentId}`, usage);

} else if (showAll) {
  // ── All subagents ──
  const agentDir = path.join(projectDir, session.id, 'subagents');

  if (!fs.existsSync(agentDir)) {
    console.error(`No subagents found for session ${session.id}`);
    process.exit(0);
  }

  const agentFiles = fs.readdirSync(agentDir).filter(f => f.endsWith('.jsonl'));
  const results = [];

  for (const file of agentFiles) {
    const usage = parseTokenUsage(path.join(agentDir, file));
    const name = file.replace('.jsonl', '');
    results.push({ name, ...usage });
  }

  // Sort by total tokens descending
  results.sort((a, b) => (b.input_tokens + b.output_tokens) - (a.input_tokens + a.output_tokens));

  if (jsonOutput) {
    const sessionUsage = parseTokenUsage(sessionPath);
    console.log(JSON.stringify({
      session: session.id,
      session_totals: sessionUsage,
      subagents: results,
    }, null, 2));
  } else {
    const sessionUsage = parseTokenUsage(sessionPath);
    console.log(`\n📊 Token Usage — Session ${session.id.substring(0, 8)}...\n`);
    console.log(`Session totals: ${fmt(sessionUsage.input_tokens)} in / ${fmt(sessionUsage.output_tokens)} out (${sessionUsage.messages} messages)\n`);

    if (results.length > 0) {
      console.log(`Subagents (${results.length}):`);
      console.log(`${'  Name'.padEnd(50)} ${'Input'.padStart(10)} ${'Output'.padStart(10)} ${'Msgs'.padStart(6)}`);
      console.log(`${'  ' + '─'.repeat(48)} ${'─'.repeat(10)} ${'─'.repeat(10)} ${'─'.repeat(6)}`);
      for (const r of results) {
        const shortName = r.name.length > 46 ? r.name.substring(0, 46) + '...' : r.name;
        console.log(`  ${shortName.padEnd(48)} ${fmt(r.input_tokens).padStart(10)} ${fmt(r.output_tokens).padStart(10)} ${String(r.messages).padStart(6)}`);
      }
      const totalIn = results.reduce((s, r) => s + r.input_tokens, 0);
      const totalOut = results.reduce((s, r) => s + r.output_tokens, 0);
      console.log(`${'  ' + '─'.repeat(48)} ${'─'.repeat(10)} ${'─'.repeat(10)} ${'─'.repeat(6)}`);
      console.log(`  ${'TOTAL (subagents)'.padEnd(48)} ${fmt(totalIn).padStart(10)} ${fmt(totalOut).padStart(10)}`);
    } else {
      console.log('No subagents found in this session.');
    }
    console.log('');
  }

} else {
  // ── Session totals ──
  const usage = parseTokenUsage(sessionPath);
  outputUsage(`session-${session.id.substring(0, 8)}`, usage);
}

// ── Helpers ──────────────────────────────────────────────────────

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

/**
 * Append a token usage row to a markdown file's Token Usage table.
 * Creates the table if it doesn't exist.
 */
function appendTokenRow(filePath, name, usage) {
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`ERROR: File not found: ${filePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(resolvedPath, 'utf8');
  const total = usage.input_tokens + usage.output_tokens;
  const row = `| ${name} | ${usage.input_tokens.toLocaleString()} | ${usage.output_tokens.toLocaleString()} | ${total.toLocaleString()} |`;

  const TABLE_HEADER = '## Token Usage';
  const TABLE_COLUMNS = '| Agent | Input | Output | Total |\n|-------|-------|--------|-------|';

  if (content.includes(TABLE_HEADER)) {
    // Table exists — find the last pipe-row and append after it
    const lines = content.split('\n');
    let lastPipeRow = -1;
    let inTokenSection = false;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(TABLE_HEADER)) inTokenSection = true;
      if (inTokenSection && lines[i].startsWith('|')) lastPipeRow = i;
      if (inTokenSection && lastPipeRow > -1 && !lines[i].startsWith('|') && lines[i].trim() !== '') break;
    }
    if (lastPipeRow > -1) {
      lines.splice(lastPipeRow + 1, 0, row);
      content = lines.join('\n');
    }
  } else {
    // Table doesn't exist — create it at the end
    content = content.trimEnd() + '\n\n---\n\n' + TABLE_HEADER + '\n\n' + TABLE_COLUMNS + '\n' + row + '\n';
  }

  fs.writeFileSync(resolvedPath, content);
  console.log(`✓ Token usage written to ${filePath}: ${name} — ${total.toLocaleString()} tokens (${usage.input_tokens.toLocaleString()} in / ${usage.output_tokens.toLocaleString()} out)`);
}

function outputUsage(label, usage) {
  const total = usage.input_tokens + usage.output_tokens;

  if (jsonOutput) {
    console.log(JSON.stringify({
      label,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_read_tokens: usage.cache_read,
      cache_creation_tokens: usage.cache_creation,
      total_tokens: total,
      messages: usage.messages,
    }, null, 2));
  } else {
    console.log(`\n📊 Token Usage — ${label}`);
    console.log(`   Input:          ${fmt(usage.input_tokens)}`);
    console.log(`   Output:         ${fmt(usage.output_tokens)}`);
    console.log(`   Cache read:     ${fmt(usage.cache_read)}`);
    console.log(`   Cache creation: ${fmt(usage.cache_creation)}`);
    console.log(`   Total:          ${fmt(total)}`);
    console.log(`   Messages:       ${usage.messages}`);
    console.log('');
  }
}
