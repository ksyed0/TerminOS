'use strict';

require('dotenv').config();

const { ClaudeProvider } = require('./providers/claude-provider');
const { OpenAIProvider } = require('./providers/openai-provider');
const { OllamaProvider } = require('./providers/ollama-provider');

async function main() {
  console.log('TermnOS Provider Verification');
  console.log('==============================');

  const results = [];

  // --- Claude (Anthropic) ---
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    console.log('[SKIP] claude    — ANTHROPIC_API_KEY not set; skipping');
  } else {
    const start = Date.now();
    const provider = new ClaudeProvider({
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL,
    });
    const ok = await provider.testConnection();
    const ms = Date.now() - start;
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
    if (ok) {
      console.log(`[PASS] claude    — ${model} responded in ${ms}ms`);
      results.push('pass');
    } else {
      console.log(`[FAIL] claude    — ${model} did not respond correctly`);
      results.push('fail');
    }
  }

  // --- OpenAI ---
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.log('[SKIP] openai    — OPENAI_API_KEY not set; skipping');
  } else {
    const start = Date.now();
    const provider = new OpenAIProvider({
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL,
    });
    const ok = await provider.testConnection();
    const ms = Date.now() - start;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (ok) {
      console.log(`[PASS] openai    — ${model} responded in ${ms}ms`);
      results.push('pass');
    } else {
      console.log(`[FAIL] openai    — ${model} did not respond correctly`);
      results.push('fail');
    }
  }

  // --- Ollama (local) ---
  const ollamaHost = process.env.OLLAMA_HOST;
  if (!ollamaHost) {
    console.log('[SKIP] ollama    — OLLAMA_HOST not set; skipping');
  } else {
    const start = Date.now();
    const provider = new OllamaProvider({
      host: ollamaHost,
      model: process.env.OLLAMA_MODEL,
    });
    const ok = await provider.testConnection();
    const ms = Date.now() - start;
    const model = process.env.OLLAMA_MODEL || 'llama3';
    if (ok) {
      console.log(`[PASS] ollama    — ${model} responded in ${ms}ms`);
      results.push('pass');
    } else {
      console.log(`[FAIL] ollama    — ${model} did not respond correctly`);
      results.push('fail');
    }
  }

  console.log('');

  if (results.length === 0) {
    console.log(
      'No providers configured. Set at least one of: ANTHROPIC_API_KEY, OPENAI_API_KEY, OLLAMA_HOST'
    );
    process.exit(1);
  }

  const passed = results.filter((r) => r === 'pass').length;
  console.log(`Result: ${passed}/${results.length} configured providers verified.`);

  if (results.includes('fail')) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
