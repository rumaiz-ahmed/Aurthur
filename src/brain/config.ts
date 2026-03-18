import { readFileSync, writeFileSync, existsSync } from "fs";
import type { ProviderConfig } from "./types";
import { getPreset } from "./providers";

export interface BrainConfig {
  provider: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  embeddingModel?: string;
  soulPath?: string;
  knowledgePath?: string;
  conversationsPath?: string;
  learning: {
    enabled: boolean;
    logConversations: boolean;
    requestFeedback: boolean;
    autoInfer: boolean;
  };
}

const DEFAULT_CONFIG: BrainConfig = {
  provider: "ollama",
  baseUrl: "http://localhost:11434/v1",
  model: "llama3",
  embeddingModel: "nomic-embed-text",
  soulPath: "./SOUL.md",
  knowledgePath: "./knowledge",
  conversationsPath: "./conversations",
  learning: {
    enabled: true,
    logConversations: true,
    requestFeedback: true,
    autoInfer: true,
  },
};

const CONFIG_PATH = "./brain.config.json";

export function loadConfig(): BrainConfig {
  const config = { ...DEFAULT_CONFIG };
  
  if (existsSync(CONFIG_PATH)) {
    try {
      const fileConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
      Object.assign(config, fileConfig);
    } catch {
      // Use defaults on error
    }
  }
  
  if (process.env.BRAIN_PROVIDER) config.provider = process.env.BRAIN_PROVIDER;
  if (process.env.BRAIN_API_KEY) config.apiKey = process.env.BRAIN_API_KEY;
  if (process.env.BRAIN_BASE_URL) config.baseUrl = process.env.BRAIN_BASE_URL;
  if (process.env.BRAIN_MODEL) config.model = process.env.BRAIN_MODEL;
  
  const preset = getPreset(config.provider);
  if (preset && !config.baseUrl) {
    config.baseUrl = preset.baseUrl;
    config.embeddingModel = config.embeddingModel || preset.embeddingModel;
  }
  
  return config;
}

export function saveConfig(config: BrainConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getProviderConfig(config: BrainConfig): ProviderConfig {
  const preset = getPreset(config.provider);
  
  return {
    name: preset?.name || config.provider,
    baseUrl: config.baseUrl || preset?.baseUrl || "",
    apiKey: config.apiKey,
    defaultModel: config.model || preset?.defaultModel || "gpt-4",
    embeddingModel: config.embeddingModel || preset?.embeddingModel,
  };
}
