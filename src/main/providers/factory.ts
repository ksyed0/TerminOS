import type { AIProvider, ProviderConfig } from './interface.js';
import { ClaudeProvider } from './claude.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';

/**
 * Creates the correct AIProvider implementation for the given config.
 * This is the only place that knows which concrete class to instantiate.
 */
export function createProvider(config: ProviderConfig): AIProvider {
  switch (config.provider) {
    case 'claude':
      return new ClaudeProvider(config);
    case 'openai':
      return new OpenAIProvider(config);
    case 'ollama':
      return new OllamaProvider(config);
    default: {
      const exhaustive: never = config.provider;
      throw new Error(`Unknown provider: ${exhaustive}`);
    }
  }
}
