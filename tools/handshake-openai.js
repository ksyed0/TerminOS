#!/usr/bin/env node
'use strict';
/**
 * Phase 2 — Link: OpenAI provider handshake verification.
 * Usage: OPENAI_API_KEY=sk-... node tools/handshake-openai.js [model]
 * Exits 0 on success, 1 on failure.
 */

require('dotenv').config();
const OpenAI = require('openai');

const apiKey = process.env.OPENAI_API_KEY;
const model  = process.argv[2] ?? 'gpt-4o-mini';

if (!apiKey) {
  console.error('[handshake-openai] ✗ OPENAI_API_KEY not set in environment or .env');
  process.exit(1);
}

async function main() {
  console.log(`[handshake-openai] Testing connection → model: ${model}`);
  const start = Date.now();

  try {
    const client = new OpenAI.default({ apiKey });
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 32,
      messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
    });

    const reply = completion.choices[0]?.message?.content?.trim() ?? '';
    const latency = Date.now() - start;
    console.log(`[handshake-openai] ✓ Connected  model=${model}  latency=${latency}ms  reply="${reply}"`);
    process.exit(0);
  } catch (err) {
    console.error(`[handshake-openai] ✗ Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
