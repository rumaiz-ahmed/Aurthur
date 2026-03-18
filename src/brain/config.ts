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

function loadEnvFile(): Record<string, string> {
  const envPath = "./.env";
  if (!existsSync(envPath)) return {};
  
  try {
    const content = readFileSync(envPath, "utf-8");
    const envVars: Record<string, string> = {};
    
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        envVars[key] = value;
      }
    }
    
    return envVars;
  } catch {
    return {};
  }
}

export function loadConfig(): BrainConfig {
  // Start with defaults
  const config = { ...DEFAULT_CONFIG };
  
  // Load from .env file first (highest priority)
  const envVars = loadEnvFile();
  
  if (envVars.BRAIN_PROVIDER) config.provider = envVars.BRAIN_PROVIDER;
  if (envVars.BRAIN_API_KEY) config.apiKey = envVars.BRAIN_API_KEY;
  if (envVars.BRAIN_BASE_URL) config.baseUrl = envVars.BRAIN_BASE_URL;
  if (envVars.BRAIN_MODEL) config.model = envVars.BRAIN_MODEL;
  
  // Override with brain.config.json (if it has values)
  if (existsSync(CONFIG_PATH)) {
    try {
      const fileConfig = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
      
      // Only override if env didn't set it
      if (!envVars.BRAIN_PROVIDER && fileConfig.provider) config.provider = fileConfig.provider;
      if (!envVars.BRAIN_API_KEY && fileConfig.apiKey) config.apiKey = fileConfig.apiKey;
      if (!envVars.BRAIN_BASE_URL && fileConfig.baseUrl) config.baseUrl = fileConfig.baseUrl;
      if (!envVars.BRAIN_MODEL && fileConfig.model) config.model = fileConfig.model;
      if (fileConfig.embeddingModel) config.embeddingModel = fileConfig.embeddingModel;
      if (fileConfig.soulPath) config.soulPath = fileConfig.soulPath;
      if (fileConfig.knowledgePath) config.knowledgePath = fileConfig.knowledgePath;
      if (fileConfig.conversationsPath) config.conversationsPath = fileConfig.conversationsPath;
      if (fileConfig.learning) config.learning = { ...config.learning, ...fileConfig.learning };
    } catch {
      // Use env/defaults on error
    }
  }
  
  // Override with process.env (highest priority of all)
  if (process.env.BRAIN_PROVIDER) config.provider = process.env.BRAIN_PROVIDER;
  if (process.env.BRAIN_API_KEY) config.apiKey = process.env.BRAIN_API_KEY;
  if (process.env.BRAIN_BASE_URL) config.baseUrl = process.env.BRAIN_BASE_URL;
  if (process.env.BRAIN_MODEL) config.model = process.env.BRAIN_MODEL;
  
  // Apply preset defaults if not set
  const preset = getPreset(config.provider);
  if (preset) {
    if (!config.baseUrl) config.baseUrl = preset.baseUrl;
    if (!config.embeddingModel) config.embeddingModel = preset.embeddingModel;
    if (!config.model) config.model = preset.defaultModel;
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
