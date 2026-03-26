#!/usr/bin/env node
'use strict';

/**
 * Claude Code stop hook — appends session cost to the configured AI cost log.
 * Receives session metadata as JSON via stdin, then reads the JSONL transcript
 * to sum actual token usage (the hook payload itself contains no cost data).
 * Never overwrites existing rows.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

const DEFAULTS = {
  docs: { costLog: 'docs/AI_COST_LOG.md' },
};

function loadConfig() {
  const cfgPath = path.join(ROOT, 'plan-visualizer.config.json');
  if (!fs.existsSync(cfgPath)) return DEFAULTS;
  try {
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    return { docs: { ...DEFAULTS.docs, ...raw.docs } };
  } catch { return DEFAULTS; }
}

const HEADER = `# AI Cost Log\n\nAppend-only ledger of AI session costs. Never edit or delete rows.\nUpdated automatically by the Claude Code stop hook (\`tools/capture-cost.js\`).\n\n| Date | Session ID | Branch | Input Tokens | Output Tokens | Cache Read Tokens | Cost USD |\n|---|---|---|---|---|---|---|\n`;

// Pricing per million tokens (as of 2025-03)
const MODEL_PRICING = {
  'claude-opus-4-6':    { input: 15.00, output: 75.00, cacheRead: 1.50,  cacheWrite: 18.75 },
  'claude-sonnet-4-6':  { input:  3.00, output: 15.00, cacheRead: 0.30,  cacheWrite:  3.75 },
  'claude-haiku-4-5':   { input:  0.80, output:  4.00, cacheRead: 0.08,  cacheWrite:  1.00 },
  // fallback for unknown models
  'default':            { input:  3.00, output: 15.00, cacheRead: 0.30,  cacheWrite:  3.75 },
};

function getPricing(model) {
  if (!model) return MODEL_PRICING['default'];
  // Match on prefix (e.g. "claude-sonnet-4-6-20251022" → "claude-sonnet-4-6")
  for (const key of Object.keys(MODEL_PRICING)) {
    if (key !== 'default' && model.startsWith(key)) return MODEL_PRICING[key];
  }
  return MODEL_PRICING['default'];
}

/**
 * Convert a CWD path to the Claude project slug used in ~/.claude/projects/.
 * Claude replaces both '/' and '_' with '-'.
 */
function cwdToSlug(cwd) {
  return cwd.replace(/[/_]/g, '-');
}

function findTranscriptPath(data) {
  // Prefer explicit transcript_path if Claude ever starts providing it
  if (data.transcript_path && fs.existsSync(data.transcript_path)) {
    return data.transcript_path;
  }

  const sessionId = data.session_id;
  const cwd = data.cwd;
  if (!sessionId || !cwd) return null;

  const slug = cwdToSlug(cwd);
  const candidate = path.join(os.homedir(), '.claude', 'projects', slug, `${sessionId}.jsonl`);
  return fs.existsSync(candidate) ? candidate : null;
}

function parseTranscript(transcriptPath) {
  const totals = {}; // model → { input, output, cacheRead, cacheWrite }
  const seen = new Set();

  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }

    if (entry.type !== 'assistant') continue;
    const msg = entry.message || {};
    const msgId = msg.id;
    if (!msgId || seen.has(msgId)) continue;
    seen.add(msgId);

    const model = msg.model || 'default';
    const usage = msg.usage || {};
    const cc = usage.cache_creation || {};

    if (!totals[model]) totals[model] = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    totals[model].input     += usage.input_tokens || 0;
    totals[model].output    += usage.output_tokens || 0;
    totals[model].cacheRead += usage.cache_read_input_tokens || 0;
    totals[model].cacheWrite += (
      (cc.ephemeral_1h_input_tokens || 0) +
      (cc.ephemeral_5m_input_tokens || 0) +
      (usage.cache_creation_input_tokens || 0)  // older format fallback
    );
  }

  return totals;
}

function computeCost(totals) {
  let cost = 0;
  let totalInput = 0, totalOutput = 0, totalCacheRead = 0;

  for (const [model, t] of Object.entries(totals)) {
    const p = getPricing(model);
    cost += (t.input * p.input + t.output * p.output + t.cacheRead * p.cacheRead + t.cacheWrite * p.cacheWrite) / 1_000_000;
    totalInput     += t.input;
    totalOutput    += t.output;
    totalCacheRead += t.cacheRead;
  }

  return { cost, totalInput, totalOutput, totalCacheRead };
}

async function main() {
  const config = loadConfig();
  const LOG_PATH = path.join(ROOT, config.docs.costLog);

  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let data = {};
  try { data = JSON.parse(input); } catch { /* no stdin data */ }

  const date = new Date().toISOString().slice(0, 10);
  const sessionId = data.session_id || `sess_${Date.now()}`;

  let branch = 'unknown';
  try { branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch {}

  // Parse the transcript to get real token counts
  let totalInput = 0, totalOutput = 0, totalCacheRead = 0, costUsd = 0;

  const transcriptPath = findTranscriptPath(data);
  if (transcriptPath) {
    try {
      const totals = parseTranscript(transcriptPath);
      ({ cost: costUsd, totalInput, totalOutput, totalCacheRead } = computeCost(totals));
    } catch (err) {
      process.stderr.write(`[capture-cost] Failed to parse transcript: ${err.message}\n`);
    }
  } else {
    process.stderr.write(`[capture-cost] Transcript not found for session ${sessionId} — writing zero row\n`);
  }

  const row = `| ${date} | ${sessionId} | ${branch} | ${totalInput} | ${totalOutput} | ${totalCacheRead} | ${costUsd.toFixed(4)} |\n`;

  const fd = fs.openSync(LOG_PATH, 'a');
  try {
    if (fs.fstatSync(fd).size === 0) fs.writeSync(fd, Buffer.from(HEADER, 'utf8'));
    fs.writeSync(fd, Buffer.from(row, 'utf8'));
  } finally {
    fs.closeSync(fd);
  }

  process.stderr.write(`[capture-cost] Appended session cost: $${costUsd.toFixed(4)} (${totalInput}in / ${totalOutput}out / ${totalCacheRead}cache_read) on branch ${branch}\n`);
}

main().catch(err => process.stderr.write(`[capture-cost] Error: ${err.message}\n`));
