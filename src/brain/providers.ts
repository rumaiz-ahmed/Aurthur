import type { ProviderConfig } from "./types";

export const PROVIDER_PRESETS: Record<string, ProviderConfig> = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4",
    embeddingModel: "text-embedding-3-small",
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-3.5-sonnet",
    embeddingModel: "openai/text-embedding-3-small",
  },
  ollama: {
    name: "Ollama",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    embeddingModel: "nomic-embed-text",
  },
  lmstudio: {
    name: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    defaultModel: "local-model",
  },
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-70b-versatile",
    embeddingModel: "thenlper/gte-large",
  },
  cerebras: {
    name: "Cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    defaultModel: "llama3.1-8b",
    embeddingModel: "nomic-embed-text",
  },
};

export function getPreset(name: string): ProviderConfig | undefined {
  return PROVIDER_PRESETS[name.toLowerCase()];
}

export function listProviders(): string[] {
  return Object.keys(PROVIDER_PRESETS);
}
