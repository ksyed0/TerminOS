#!/usr/bin/env node
'use strict';

/**
 * Claude Code stop hook — appends session cost to the configured AI cost log.
 * Receives session data as JSON via stdin (Stop hook payload).
 *
 * The Stop hook payload includes `transcript_path` but NOT cost/usage data.
 * We parse the transcript JSONL to sum token usage from assistant messages.
 * Cost is calculated using per-model pricing.
 *
 * Payload fields used:
 *   session_id      — unique session identifier
 *   transcript_path — path to the session JSONL transcript file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const ROOT = path.join(__dirname, '..');

// Per-model pricing (USD per token).
// Add entries as new models are used.
const MODEL_PRICING = {
  'claude-opus-4-6':            { input: 15/1e6,  output: 75/1e6,  cacheRead: 1.50/1e6, cacheWrite: 18.75/1e6 },
  'claude-sonnet-4-6':          { input:  3/1e6,  output: 15/1e6,  cacheRead: 0.30/1e6, cacheWrite:  3.75/1e6 },
  'claude-haiku-4-5-20251001':  { input:  0.8/1e6, output: 4/1e6,  cacheRead: 0.08/1e6, cacheWrite:  1.0/1e6  },
};
const DEFAULT_PRICING = MODEL_PRICING['claude-sonnet-4-6'];

const DEFAULTS = {
  docs: { costLog: 'Docs/AI_COST_LOG.md' },
};

function loadConfig() {
  const cfgPath = path.join(ROOT, 'plan-visualizer.config.json');
  if (!fs.existsSync(cfgPath)) return DEFAULTS;
  try {
    const raw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    return { docs: { ...DEFAULTS.docs, ...raw.docs } };
  } catch { return DEFAULTS; }
}

/**
 * Expand ~ in a path to the home directory.
 */
function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

/**
 * Parse the session JSONL transcript and sum token usage across all
 * assistant messages. Returns { inputTokens, outputTokens, cacheReadTokens,
 * cacheWriteTokens, model }.
 */
function parseTranscript(transcriptPath) {
  const resolved = expandHome(transcriptPath);
  if (!resolved || !fs.existsSync(resolved)) {
    return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, model: null };
  }

  let inputTokens = 0;
  let outputTokens = 0;
  let cacheReadTokens = 0;
  let cacheWriteTokens = 0;
  let model = null;

  const lines = fs.readFileSync(resolved, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let obj;
    try { obj = JSON.parse(trimmed); } catch { continue; }

    if (obj.type !== 'assistant') continue;
    const msg = obj.message || {};

    if (!model && msg.model) model = msg.model;

    const usage = msg.usage;
    if (!usage) continue;

    inputTokens     += usage.input_tokens || 0;
    outputTokens    += usage.output_tokens || 0;
    cacheReadTokens += usage.cache_read_input_tokens || 0;

    // Cache creation tokens may live at usage.cache_creation_input_tokens
    // or inside usage.cache_creation.{ephemeral_1h,ephemeral_5m}_input_tokens
    const cacheCreation = usage.cache_creation || {};
    cacheWriteTokens +=
      (usage.cache_creation_input_tokens || 0) +
      (cacheCreation.ephemeral_1h_input_tokens || 0) +
      (cacheCreation.ephemeral_5m_input_tokens || 0);
  }

  return { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, model };
}

const HEADER = `# AI Cost Log\n\nAppend-only ledger of AI session costs. Never edit or delete rows.\nUpdated automatically by the Claude Code stop hook (\`tools/capture-cost.js\`).\n\n| Date | Session ID | Branch | Input Tokens | Output Tokens | Cache Read Tokens | Cost USD |\n|---|---|---|---|---|---|---|\n`;

async function main() {
  const config = loadConfig();
  const LOG_PATH = path.join(ROOT, config.docs.costLog);

  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let data = {};
  try { data = JSON.parse(input); } catch { /* no stdin data */ }

  const date = new Date().toISOString().slice(0, 10);
  const sessionId = data.session_id || `sess_${Date.now()}`;

  const { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens, model } =
    parseTranscript(data.transcript_path);

  const pricing = (model && MODEL_PRICING[model]) || DEFAULT_PRICING;
  const costUsd = (
    inputTokens     * pricing.input      +
    outputTokens    * pricing.output     +
    cacheReadTokens * pricing.cacheRead  +
    cacheWriteTokens * pricing.cacheWrite
  ).toFixed(4);

  let branch = 'unknown';
  try { branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(); } catch {}

  const row = `| ${date} | ${sessionId} | ${branch} | ${inputTokens} | ${outputTokens} | ${cacheReadTokens} | ${costUsd} |\n`;

  const fd = fs.openSync(LOG_PATH, 'a');
  try {
    if (fs.fstatSync(fd).size === 0) fs.writeSync(fd, Buffer.from(HEADER, 'utf8'));
    fs.writeSync(fd, Buffer.from(row, 'utf8'));
  } finally {
    fs.closeSync(fd);
  }

  process.stderr.write(`[capture-cost] model=${model || 'unknown'} in=${inputTokens} out=${outputTokens} cacheRead=${cacheReadTokens} cost=$${costUsd} branch=${branch}\n`);
}

main().catch(err => process.stderr.write(`[capture-cost] Error: ${err.message}\n`));
