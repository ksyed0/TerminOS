#!/usr/bin/env node
'use strict';
/**
 * Phase 2 — Link: Claude provider handshake verification.
 * Usage: ANTHROPIC_API_KEY=sk-ant-... node tools/handshake-claude.js [model]
 * Exits 0 on success, 1 on failure.
 */

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const apiKey = process.env.ANTHROPIC_API_KEY;
const model  = process.argv[2] ?? 'claude-3-5-haiku-20241022';

if (!apiKey) {
  console.error('[handshake-claude] ✗ ANTHROPIC_API_KEY not set in environment or .env');
  process.exit(1);
}

async function main() {
  console.log(`[handshake-claude] Testing connection → model: ${model}`);
  const start = Date.now();

  try {
    const client = new Anthropic.default({ apiKey });
    const msg = await client.messages.create({
      model,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
    });

    const reply = msg.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('').trim();

    const latency = Date.now() - start;
    console.log(`[handshake-claude] ✓ Connected  model=${model}  latency=${latency}ms  reply="${reply}"`);
    process.exit(0);
  } catch (err) {
    console.error(`[handshake-claude] ✗ Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
