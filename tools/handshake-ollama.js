#!/usr/bin/env node
'use strict';
/**
 * Phase 2 — Link: Ollama provider handshake verification.
 * Usage: node tools/handshake-ollama.js [model] [host]
 * Defaults: model=llama3.2, host=http://localhost:11434
 * Exits 0 on success, 1 on failure.
 */

require('dotenv').config();

const model = process.argv[2] ?? (process.env.OLLAMA_MODEL ?? 'llama3.2');
const host  = process.argv[3] ?? (process.env.OLLAMA_HOST  ?? 'http://localhost:11434');

async function main() {
  console.log(`[handshake-ollama] Testing connection → host: ${host}  model: ${model}`);
  const start = Date.now();

  // 1. Check host is reachable and list available models
  let availableModels = [];
  try {
    const tagsRes = await fetch(`${host}/api/tags`);
    if (!tagsRes.ok) throw new Error(`/api/tags returned HTTP ${tagsRes.status}`);
    const tags = await tagsRes.json();
    availableModels = tags.models.map(m => m.name);
  } catch (err) {
    console.error(`[handshake-ollama] ✗ Host unreachable at ${host}: ${err.message}`);
    console.error('[handshake-ollama]   Is Ollama running? Try: ollama serve');
    process.exit(1);
  }

  // 2. Verify the requested model is pulled
  const modelFound = availableModels.some(m => m.startsWith(model));
  if (!modelFound) {
    console.error(`[handshake-ollama] ✗ Model "${model}" not found.`);
    console.error(`[handshake-ollama]   Available: ${availableModels.join(', ') || '(none)'}`);
    console.error(`[handshake-ollama]   Pull it with: ollama pull ${model}`);
    process.exit(1);
  }

  // 3. Send a test generation
  try {
    const chatRes = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: 'user', content: 'Reply with the single word: pong' }],
      }),
    });

    if (!chatRes.ok) throw new Error(`/api/chat returned HTTP ${chatRes.status}`);
    const data = await chatRes.json();
    const reply = data.message?.content?.trim() ?? '';
    const latency = Date.now() - start;
    console.log(`[handshake-ollama] ✓ Connected  model=${model}  latency=${latency}ms  reply="${reply}"`);
    process.exit(0);
  } catch (err) {
    console.error(`[handshake-ollama] ✗ Chat failed: ${err.message}`);
    process.exit(1);
  }
}

main();
