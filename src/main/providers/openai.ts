import OpenAI from 'openai';
import type { AIProvider, AIRequest, AIResponse, ConnectionStatus, ProviderConfig } from './interface.js';

const SYSTEM_PROMPT = `You are a terminal command interpreter. The user will describe what they want to do in natural language. You must respond with ONLY a JSON object — no markdown, no explanation outside the JSON.

Response format:
{
  "command": "the exact shell command to run",
  "explanation": "one sentence explaining what the command does",
  "is_destructive": true/false,
  "requires_confirmation": true/false,
  "risk_level": "safe" | "caution" | "destructive"
}

Rules:
- risk_level "destructive": rm -rf, DROP, format, overwrite without backup, kill -9 on system processes
- risk_level "caution": commands that modify files, stop services, or have side effects
- risk_level "safe": read-only commands, navigation, listing
- is_destructive must be true when risk_level is "destructive"
- requires_confirmation must be true when is_destructive is true
- Never add commentary outside the JSON object`;

export class OpenAIProvider implements AIProvider {
  readonly name = 'OpenAI';
  private client: OpenAI;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    // Support custom base URL (for LM Studio, local models, etc.)
    // Use ollama_host field as custom base URL when using OpenAI provider
    const baseURL = config.ollama_host || undefined;
    this.client = new OpenAI({ 
      apiKey: config.api_key || 'local',
      baseURL,
    });
  }

  async interpret(request: AIRequest): Promise<AIResponse> {
    const userMessage = [
      `Shell: ${request.shell}`,
      `Working directory: ${request.cwd}`,
      `Platform: ${request.platform}`,
      request.history.length > 0
        ? `Recent commands:\n${request.history.slice(-20).map((c, i) => `  ${i + 1}. ${c}`).join('\n')}`
        : '',
      `\nUser request: ${request.user_input}`,
    ].filter(Boolean).join('\n');

    const completion = await this.client.chat.completions.create({
      model: this.config.model,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? '{}';
    return JSON.parse(text) as AIResponse;
  }

  async testConnection(): Promise<ConnectionStatus> {
    const start = Date.now();
    try {
      await this.client.chat.completions.create({
        model: this.config.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      });
      return {
        ok: true,
        provider: this.name,
        model: this.config.model,
        latency_ms: Date.now() - start,
      };
    } catch (err) {
      return {
        ok: false,
        provider: this.name,
        model: this.config.model,
        latency_ms: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
