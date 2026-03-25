#!/usr/bin/env node

/**
 * product_graph.mjs
 * Scans product_plans/ for planning documents, extracts YAML frontmatter,
 * and outputs a lightweight JSON graph to .vbounce/product-graph.json.
 *
 * The graph gives AI instant awareness of all product documents and their
 * relationships without reading every file.
 *
 * Usage:
 *   node .vbounce/scripts/product_graph.mjs
 *   node .vbounce/scripts/product_graph.mjs --json   # output to stdout instead of file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let yaml;
try {
  yaml = await import('js-yaml');
} catch {
  console.error('ERROR: js-yaml not installed. Run: npm install js-yaml');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SCAN_DIRS = ['strategy', 'backlog', 'sprints', 'hotfixes'];
const PRODUCT_PLANS = path.join(ROOT, 'product_plans');
const OUTPUT_PATH = path.join(ROOT, '.vbounce', 'product-graph.json');

const args = process.argv.slice(2);
const toStdout = args.includes('--json');

// ── Document type detection ──────────────────────────────────────

const DOC_PATTERNS = [
  { pattern: /^EPIC-(\d+)/i, type: 'epic' },
  { pattern: /^STORY-(\d+)-(\d+)/i, type: 'story' },
  { pattern: /^SPIKE-(\d+)-(\d+)/i, type: 'spike' },
  { pattern: /^HOTFIX-/i, type: 'hotfix' },
  { pattern: /sprint-(\d+)\.md$/i, type: 'sprint-plan' },
  { pattern: /sprint-report/i, type: 'sprint-report' },
  { pattern: /charter/i, type: 'charter' },
  { pattern: /roadmap/i, type: 'roadmap' },
  { pattern: /delivery[_-]plan/i, type: 'delivery-plan' },
  { pattern: /risk[_-]registry/i, type: 'risk-registry' },
];

/**
 * Detect document type from filename.
 * @param {string} filename
 * @returns {string}
 */
function detectType(filename) {
  for (const { pattern, type } of DOC_PATTERNS) {
    if (pattern.test(filename)) return type;
  }
  return 'unknown';
}

/**
 * Derive a document ID from filename and frontmatter.
 * @param {string} filename
 * @param {object} frontmatter
 * @param {string} docType
 * @returns {string}
 */
function deriveId(filename, frontmatter, docType) {
  // Use explicit ID fields from frontmatter if available
  if (frontmatter.epic_id) return frontmatter.epic_id;
  if (frontmatter.story_id) return frontmatter.story_id;
  if (frontmatter.spike_id) return frontmatter.spike_id;
  if (frontmatter.sprint_id) return frontmatter.sprint_id;
  if (frontmatter.hotfix_id) return frontmatter.hotfix_id;
  if (frontmatter.delivery_id) return frontmatter.delivery_id;

  // Derive from filename
  const base = path.basename(filename, '.md');

  const epicMatch = base.match(/^(EPIC-\d+)/i);
  if (epicMatch) return epicMatch[1].toUpperCase();

  const storyMatch = base.match(/^(STORY-\d+-\d+)/i);
  if (storyMatch) return storyMatch[1].toUpperCase();

  const spikeMatch = base.match(/^(SPIKE-\d+-\d+)/i);
  if (spikeMatch) return spikeMatch[1].toUpperCase();

  const sprintMatch = base.match(/^sprint-(\d+)$/i);
  if (sprintMatch) return `S-${sprintMatch[1].padStart(2, '0')}`;

  const hotfixMatch = base.match(/^(HOTFIX-[^.]+)/i);
  if (hotfixMatch) return hotfixMatch[1].toUpperCase();

  // Fallback: use docType + sanitized filename
  if (docType === 'charter') return 'CHARTER';
  if (docType === 'roadmap') return 'ROADMAP';
  if (docType === 'risk-registry') return 'RISK-REGISTRY';
  if (docType === 'delivery-plan') {
    const dpMatch = base.match(/^(D-\d+)/i);
    if (dpMatch) return dpMatch[1].toUpperCase();
    return `DP-${base}`;
  }

  return base.toUpperCase();
}

// ── YAML extraction ──────────────────────────────────────────────

/**
 * Extract YAML frontmatter from a markdown file.
 * @param {string} filePath
 * @returns {{ frontmatter: object|null, title: string|null }}
 */
function extractFrontmatter(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    return { frontmatter: null, title: null };
  }

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extract YAML frontmatter
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!fmMatch) return { frontmatter: null, title };

  try {
    const frontmatter = yaml.default?.load
      ? yaml.default.load(fmMatch[1])
      : yaml.load(fmMatch[1]);
    return { frontmatter: frontmatter || {}, title };
  } catch (err) {
    console.error(`  WARN: Malformed YAML in ${path.relative(ROOT, filePath)}: ${err.message}`);
    return { frontmatter: null, title };
  }
}

// ── Edge extraction ──────────────────────────────────────────────

/**
 * Extract edges from frontmatter fields and document content.
 * @param {string} docId
 * @param {object} fm - frontmatter
 * @param {string} docType
 * @param {string} filePath
 * @returns {Array<{from: string, to: string, type: string}>}
 */
function extractEdges(docId, fm, docType, filePath) {
  const edges = [];

  // parent_epic_ref → parent edge
  if (fm.parent_epic_ref) {
    edges.push({ from: fm.parent_epic_ref, to: docId, type: 'parent' });
  }

  // Derive parent epic from story/spike ID pattern (STORY-003-01 → EPIC-003)
  if (!fm.parent_epic_ref && (docType === 'story' || docType === 'spike')) {
    const epicNum = docId.match(/(?:STORY|SPIKE)-(\d+)/i);
    if (epicNum) {
      const parentId = `EPIC-${epicNum[1].padStart(3, '0')}`;
      edges.push({ from: parentId, to: docId, type: 'parent' });
    }
  }

  // charter_ref → context-source edge
  if (fm.charter_ref) {
    edges.push({ from: fm.charter_ref, to: docId, type: 'context-source' });
  }

  // roadmap_ref → context-source edge
  if (fm.roadmap_ref) {
    edges.push({ from: fm.roadmap_ref, to: docId, type: 'context-source' });
  }

  // context_source → context-source edge (text field, try to match doc IDs)
  if (fm.context_source && typeof fm.context_source === 'string') {
    const refs = fm.context_source.match(/(?:EPIC|STORY|SPIKE|CHARTER|ROADMAP|S|D)-[\w-]+/gi) || [];
    for (const ref of refs) {
      edges.push({ from: ref.toUpperCase(), to: docId, type: 'context-source' });
    }
  }

  // release → feeds edge (e.g., release: "D-02")
  if (fm.release) {
    const releaseId = fm.release.match(/(D-\d+)/i);
    if (releaseId) {
      edges.push({ from: docId, to: releaseId[1].toUpperCase(), type: 'feeds' });
    }
  }

  // risk_registry_ref → context-source edge
  if (fm.risk_registry_ref) {
    edges.push({ from: 'RISK-REGISTRY', to: docId, type: 'context-source' });
  }

  // delivery field in sprint plans
  if (fm.delivery) {
    const dpId = fm.delivery.match(/(D-\d+)/i);
    if (dpId) {
      edges.push({ from: docId, to: dpId[1].toUpperCase(), type: 'feeds' });
    }
  }

  // depends_on / dependencies (array or string)
  const deps = fm.depends_on || fm.dependencies || [];
  const depList = Array.isArray(deps) ? deps : [deps];
  for (const dep of depList) {
    if (typeof dep === 'string') {
      const depIds = dep.match(/(?:EPIC|STORY|SPIKE|S|D)-[\w-]+/gi) || [];
      for (const depId of depIds) {
        edges.push({ from: depId.toUpperCase(), to: docId, type: 'depends-on' });
      }
    }
  }

  // Extract dependency table from document content (§4.2 pattern)
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const depTableMatch = content.match(/(?:depend|block|prerequisite)[\s\S]*?\|[\s\S]*?\|/gi);
    if (depTableMatch) {
      for (const tableBlock of depTableMatch) {
        const docRefs = tableBlock.match(/(?:EPIC|STORY|SPIKE)-\d+(?:-\d+)?/gi) || [];
        for (const ref of docRefs) {
          const refId = ref.toUpperCase();
          if (refId !== docId) {
            edges.push({ from: refId, to: docId, type: 'depends-on' });
          }
        }
      }
    }

    // Extract "unlocks" references
    const unlocksMatch = content.match(/unlocks?[:\s]+([^\n]+)/gi) || [];
    for (const line of unlocksMatch) {
      const refs = line.match(/(?:EPIC|STORY|SPIKE)-\d+(?:-\d+)?/gi) || [];
      for (const ref of refs) {
        edges.push({ from: docId, to: ref.toUpperCase(), type: 'unlocks' });
      }
    }
  } catch {
    // Content extraction is best-effort
  }

  return edges;
}

// ── File scanning ────────────────────────────────────────────────

/**
 * Recursively find all .md files in a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function findMarkdownFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────

function buildGraph() {
  const nodes = {};
  const edges = [];
  const warnings = [];

  if (!fs.existsSync(PRODUCT_PLANS)) {
    // Graceful: empty graph for missing product_plans/
    const graph = { generated_at: new Date().toISOString(), nodes: {}, edges: [] };
    return graph;
  }

  // Scan active directories only (not archive/)
  for (const subdir of SCAN_DIRS) {
    const scanPath = path.join(PRODUCT_PLANS, subdir);
    const files = findMarkdownFiles(scanPath);

    for (const filePath of files) {
      const filename = path.basename(filePath);
      const docType = detectType(filename);

      if (docType === 'unknown' || docType === 'sprint-report') continue;

      const { frontmatter, title } = extractFrontmatter(filePath);
      const relPath = path.relative(ROOT, filePath);

      // Build node even without frontmatter (use filename-derived data)
      const fm = frontmatter || {};
      const docId = deriveId(filename, fm, docType);

      nodes[docId] = {
        type: docType,
        status: fm.status || null,
        ambiguity: fm.ambiguity || null,
        path: relPath,
        title: title || docId,
      };

      // Extract edges
      if (frontmatter) {
        const docEdges = extractEdges(docId, fm, docType, filePath);
        edges.push(...docEdges);
      }
    }
  }

  // Also scan root of product_plans/ for charter files
  const rootFiles = fs.readdirSync(PRODUCT_PLANS, { withFileTypes: true })
    .filter(e => !e.isDirectory() && e.name.endsWith('.md'));

  for (const entry of rootFiles) {
    const filePath = path.join(PRODUCT_PLANS, entry.name);
    const docType = detectType(entry.name);
    if (docType === 'unknown') continue;

    const { frontmatter, title } = extractFrontmatter(filePath);
    const relPath = path.relative(ROOT, filePath);
    const fm = frontmatter || {};
    const docId = deriveId(entry.name, fm, docType);

    if (!nodes[docId]) {
      nodes[docId] = {
        type: docType,
        status: fm.status || null,
        ambiguity: fm.ambiguity || null,
        path: relPath,
        title: title || docId,
      };

      if (frontmatter) {
        const docEdges = extractEdges(docId, fm, docType, filePath);
        edges.push(...docEdges);
      }
    }
  }

  // Deduplicate edges
  const edgeSet = new Set();
  const uniqueEdges = edges.filter(e => {
    const key = `${e.from}→${e.to}:${e.type}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    return true;
  });

  return {
    generated_at: new Date().toISOString(),
    node_count: Object.keys(nodes).length,
    edge_count: uniqueEdges.length,
    nodes,
    edges: uniqueEdges,
  };
}

// ── Execute ──────────────────────────────────────────────────────

const graph = buildGraph();

if (toStdout) {
  console.log(JSON.stringify(graph, null, 2));
} else {
  // Ensure .vbounce/ exists
  const bounceDir = path.join(ROOT, '.vbounce');
  fs.mkdirSync(bounceDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(graph, null, 2) + '\n');
  console.log(`✓ Product graph generated: .vbounce/product-graph.json`);
  console.log(`  Nodes: ${graph.node_count} | Edges: ${graph.edge_count}`);
}
