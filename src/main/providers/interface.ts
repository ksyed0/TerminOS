/**
 * ProviderInterface — the single contract all AI providers must implement.
 *
 * INVARIANT: No provider-specific logic may exist outside src/main/providers/.
 * All callers interact exclusively with this interface.
 */

export interface AIRequest {
  user_input: string;
  input_type: 'text' | 'voice';
  shell: string;
  cwd: string;
  platform: 'darwin' | 'win32' | 'linux';
  history: string[];
}

export interface AIResponse {
  command: string;
  explanation: string;
  is_destructive: boolean;
  requires_confirmation: boolean;
  risk_level: 'safe' | 'caution' | 'destructive';
}

export interface ConnectionStatus {
  ok: boolean;
  provider: string;
  model: string;
  latency_ms: number;
  error?: string;
}

export interface ProviderConfig {
  provider: 'claude' | 'openai' | 'ollama';
  /** Encrypted externally; passed in plaintext only at call time from OS keychain */
  api_key?: string;
  model: string;
  /** Ollama only */
  ollama_host?: string;
}

export interface AIProvider {
  /**
   * Translate natural language input into a terminal command.
   * Must never execute the command — interpretation only.
   */
  interpret(request: AIRequest): Promise<AIResponse>;

  /**
   * Verify the provider is reachable and the configured model is available.
   * Returns a ConnectionStatus — never throws.
   */
  testConnection(): Promise<ConnectionStatus>;

  /** Human-readable provider name for UI display */
  readonly name: string;
}
