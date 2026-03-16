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

interface OllamaTagsResponse {
  models: Array<{ name: string }>;
}

interface OllamaChatResponse {
  message: { content: string };
}

export class OllamaProvider implements AIProvider {
  readonly name = 'Ollama (Local)';
  private config: ProviderConfig;
  private host: string;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.host = config.ollama_host ?? 'http://localhost:11434';
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

    const response = await fetch(`${this.host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        stream: false,
        format: 'json',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as OllamaChatResponse;
    return JSON.parse(data.message.content) as AIResponse;
  }

  async testConnection(): Promise<ConnectionStatus> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.host}/api/tags`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as OllamaTagsResponse;
      const available = data.models.map(m => m.name);
      const modelAvailable = available.some(m => m.startsWith(this.config.model));

      if (!modelAvailable) {
        return {
          ok: false,
          provider: this.name,
          model: this.config.model,
          latency_ms: Date.now() - start,
          error: `Model "${this.config.model}" not found. Available: ${available.join(', ')}`,
        };
      }

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

  /** Returns all locally available model names from this Ollama instance */
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.host}/api/tags`);
    if (!response.ok) throw new Error(`Ollama /api/tags failed: ${response.status}`);
    const data = await response.json() as OllamaTagsResponse;
    return data.models.map(m => m.name);
  }
}
