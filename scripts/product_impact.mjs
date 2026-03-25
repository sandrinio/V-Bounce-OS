#!/usr/bin/env node

/**
 * product_impact.mjs
 * Query "what's affected by changing document X?" using BFS traversal
 * of the product graph.
 *
 * Usage:
 *   node .vbounce/scripts/product_impact.mjs EPIC-002
 *   node .vbounce/scripts/product_impact.mjs EPIC-002 --json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GRAPH_PATH = path.join(ROOT, '.vbounce', 'product-graph.json');

const args = process.argv.slice(2);
const docId = args.find(a => !a.startsWith('--'));
const jsonOutput = args.includes('--json');

if (!docId) {
  console.error('Usage: product_impact.mjs <DOC-ID> [--json]');
  console.error('  Example: product_impact.mjs EPIC-002');
  console.error('  Run `vbounce graph` first to generate the product graph.');
  process.exit(1);
}

// ── Load graph ───────────────────────────────────────────────────

if (!fs.existsSync(GRAPH_PATH)) {
  console.error('ERROR: .vbounce/product-graph.json not found.');
  console.error('Run `vbounce graph` first to generate the product graph.');
  process.exit(1);
}

const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, 'utf8'));
const targetId = docId.toUpperCase();

if (!graph.nodes[targetId]) {
  console.error(`ERROR: Document "${targetId}" not found in the product graph.`);
  console.error(`Available documents: ${Object.keys(graph.nodes).join(', ')}`);
  process.exit(1);
}

// ── Build adjacency lists ────────────────────────────────────────

// Downstream: edges where targetId is the source (from)
// "What does this document feed into?"
const downstream = new Map(); // from → [{to, type}]
const upstream = new Map();   // to → [{from, type}]

for (const edge of graph.edges) {
  if (!downstream.has(edge.from)) downstream.set(edge.from, []);
  downstream.get(edge.from).push({ to: edge.to, type: edge.type });

  if (!upstream.has(edge.to)) upstream.set(edge.to, []);
  upstream.get(edge.to).push({ from: edge.from, type: edge.type });
}

// ── BFS: direct + transitive dependents ──────────────────────────

/**
 * BFS traversal from a node following outgoing edges.
 * @param {string} startId
 * @param {Map} adjList - adjacency list (from → targets)
 * @param {'downstream'|'upstream'} direction
 * @returns {{ direct: Array, transitive: Array }}
 */
function bfs(startId, adjList, direction) {
  const visited = new Set([startId]);
  const direct = [];
  const transitive = [];
  const queue = [{ id: startId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    const neighbors = adjList.get(id) || [];

    for (const neighbor of neighbors) {
      const neighborId = direction === 'downstream' ? neighbor.to : neighbor.from;

      if (visited.has(neighborId)) continue; // Cycle protection
      visited.add(neighborId);

      const entry = {
        id: neighborId,
        type: neighbor.type,
        via: id,
        node: graph.nodes[neighborId] || null,
      };

      if (depth === 0) {
        direct.push(entry);
      } else {
        transitive.push(entry);
      }

      queue.push({ id: neighborId, depth: depth + 1 });
    }
  }

  return { direct, transitive };
}

// ── Run analysis ─────────────────────────────────────────────────

const dependents = bfs(targetId, downstream, 'downstream');
const feeders = bfs(targetId, upstream, 'upstream');

const result = {
  document: targetId,
  document_info: graph.nodes[targetId],
  direct_dependents: dependents.direct,
  transitive_dependents: dependents.transitive,
  upstream_feeders: feeders.direct.concat(feeders.transitive),
  graph_generated_at: graph.generated_at,
};

// ── Output ───────────────────────────────────────────────────────

if (jsonOutput) {
  console.log(JSON.stringify(result, null, 2));
} else {
  const node = graph.nodes[targetId];
  console.log(`\n📊 Impact Analysis: ${targetId}`);
  console.log(`   ${node.title}`);
  console.log(`   Status: ${node.status || 'N/A'} | Type: ${node.type}`);
  console.log(`   Path: ${node.path}`);

  if (dependents.direct.length > 0) {
    console.log(`\n🔽 Direct Dependents (${dependents.direct.length}):`);
    for (const dep of dependents.direct) {
      const label = dep.node ? dep.node.title : dep.id;
      const status = dep.node?.status ? ` [${dep.node.status}]` : '';
      console.log(`   ${dep.type}: ${label}${status}`);
    }
  } else {
    console.log('\n🔽 Direct Dependents: none');
  }

  if (dependents.transitive.length > 0) {
    console.log(`\n🔽 Transitive Dependents (${dependents.transitive.length}):`);
    for (const dep of dependents.transitive) {
      const label = dep.node ? dep.node.title : dep.id;
      const status = dep.node?.status ? ` [${dep.node.status}]` : '';
      console.log(`   ${dep.type}: ${label}${status} (via ${dep.via})`);
    }
  }

  if (feeders.direct.length > 0 || feeders.transitive.length > 0) {
    const allFeeders = [...feeders.direct, ...feeders.transitive];
    console.log(`\n🔼 Upstream Feeders (${allFeeders.length}):`);
    for (const f of allFeeders) {
      const label = f.node ? f.node.title : f.id;
      console.log(`   ${f.type}: ${label}`);
    }
  } else {
    console.log('\n🔼 Upstream Feeders: none');
  }

  console.log(`\nGraph generated: ${graph.generated_at}`);
  console.log('');
}
