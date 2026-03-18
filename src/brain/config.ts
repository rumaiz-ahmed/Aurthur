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

function loadEnvFile(): Record<string, string | undefined> {
  const envPath = "./.env";
  if (!existsSync(envPath)) return {};
  
  try {
    const content = readFileSync(envPath, "utf-8");
    const envVars: Record<string, string | undefined> = {};
    
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        // Only set if non-empty
        envVars[key] = value || undefined;
      }
    }
    
    return envVars;
  } catch {
    return {};
  }
}

export function loadConfig(): BrainConfig {
  const envVars = loadEnvFile();
  const provider = envVars.BRAIN_PROVIDER || (existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, "utf-8")).provider : undefined) || DEFAULT_CONFIG.provider;
  const preset = getPreset(provider);
  
  const config: BrainConfig = {
    provider,
    baseUrl: envVars.BRAIN_BASE_URL || (existsSync(CONFIG_PATH) ? JSON.parse(readFileSync(CONFIG_PATH, "utf-8")).baseUrl : undefined) || preset?.baseUrl || DEFAULT_CONFIG.baseUrl,
    apiKey: envVars.BRAIN_API_KEY,
    model: envVars.BRAIN_MODEL || preset?.defaultModel || DEFAULT_CONFIG.model,
    embeddingModel: preset?.embeddingModel || DEFAULT_CONFIG.embeddingModel,
    soulPath: DEFAULT_CONFIG.soulPath,
    knowledgePath: DEFAULT_CONFIG.knowledgePath,
    conversationsPath: DEFAULT_CONFIG.conversationsPath,
    learning: DEFAULT_CONFIG.learning,
  };
  
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
