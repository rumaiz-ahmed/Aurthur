import type { Command } from "../../types";
import { loadConfig, saveConfig, getProviderConfig } from "../../brain/config";
import { listProviders, getPreset } from "../../brain/providers";
import { createLLMClient } from "../../brain/llm";
import { createKnowledgeBase } from "../../brain/knowledge";
import { createCodebaseIndex } from "../../brain/codebase";
import { readFileSync, existsSync } from "fs";

export const brainStatusCommand: Command = {
  name: "brain status",
  description: "Show brain system status",
  aliases: ["status", "brain"],
  execute: async () => {
    const config = loadConfig();
    const providerConfig = getProviderConfig(config);
    
    let available = false;
    let models: string[] = [];
    
    try {
      const llm = createLLMClient(providerConfig);
      available = await llm.isAvailable();
      if (available) {
        models = await llm.listModels();
      }
    } catch {
      available = false;
    }
    
    let knowledgeCount = 0;
    let knowledgeIndexed = false;
    try {
      const kb = createKnowledgeBase(config.knowledgePath || "./knowledge", providerConfig);
      knowledgeCount = kb.getStats().count;
      knowledgeIndexed = kb.getStats().indexed;
    } catch {}
    
    let codebaseCount = 0;
    let codebaseIndexed = false;
    try {
      const cb = createCodebaseIndex(providerConfig);
      codebaseCount = cb.getStats().count;
      codebaseIndexed = cb.getStats().indexed;
    } catch {}
    
    const lines = [
      "═══ ARTHUR Brain Status ═══",
      "",
      `Provider: ${providerConfig.name}`,
      `Model: ${providerConfig.defaultModel}`,
      `Status: ${available ? "🟢 Connected" : "🔴 Unavailable"}`,
      "",
      `Knowledge: ${knowledgeCount} entries (${knowledgeIndexed ? "indexed" : "indexing..."})`,
      `Codebase: ${codebaseCount} chunks (${codebaseIndexed ? "indexed" : "not indexed"})`,
      "",
      `Available Models:`,
      ...models.slice(0, 5).map((m) => `  • ${m}`),
      models.length > 5 ? `  ... and ${models.length - 5} more` : "",
    ];
    
    return lines.filter(Boolean).join("\n");
  },
};

export const brainSetProviderCommand: Command = {
  name: "brain set-provider",
  description: "Set LLM provider",
  aliases: ["set-provider", "provider"],
  execute: async (args) => {
    if (!args) {
      return `Available providers:\n${listProviders().map((p) => `  • ${p}`).join("\n")}\n\nUsage: brain set-provider <name>`;
    }
    
    const provider = args.toLowerCase().trim();
    const preset = getPreset(provider);
    
    if (!preset && !args.includes("http")) {
      return `Unknown provider "${provider}". Available:\n${listProviders().map((p) => `  • ${p}`).join("\n")}`;
    }
    
    const config = loadConfig();
    config.provider = provider;
    
    if (preset) {
      config.baseUrl = preset.baseUrl;
      config.model = preset.defaultModel;
      config.embeddingModel = preset.embeddingModel;
    } else if (args.startsWith("http")) {
      config.baseUrl = args;
    }
    
    saveConfig(config);
    
    return `Provider set to "${provider}". Restart ARTHUR to apply changes.`;
  },
};

export const brainModelsCommand: Command = {
  name: "brain models",
  description: "List available models",
  aliases: ["models"],
  execute: async () => {
    const config = loadConfig();
    const providerConfig = getProviderConfig(config);
    
    try {
      const llm = createLLMClient(providerConfig);
      const available = await llm.isAvailable();
      
      if (!available) {
        return "Cannot connect to provider. Is it running?";
      }
      
      const models = await llm.listModels();
      
      if (models.length === 0) {
        return "No models found.";
      }
      
      return `Available models:\n${models.map((m) => `  • ${m}`).join("\n")}`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
};

export const brainLearnCommand: Command = {
  name: "brain learn",
  description: "Add to knowledge base",
  aliases: ["learn", "teach"],
  execute: async (args) => {
    if (!args) {
      return "What would you like me to learn? Usage: brain learn <text>";
    }
    
    const config = loadConfig();
    const providerConfig = getProviderConfig(config);
    
    try {
      const kb = createKnowledgeBase(config.knowledgePath || "./knowledge", providerConfig);
      await kb.add(args, { source: "user" });
      return `Learned: "${args.slice(0, 50)}${args.length > 50 ? "..." : ""}"`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
};

export const brainReindexCommand: Command = {
  name: "brain reindex",
  description: "Rebuild all indexes",
  aliases: ["reindex"],
  execute: async () => {
    const config = loadConfig();
    const providerConfig = getProviderConfig(config);
    
    try {
      const kb = createKnowledgeBase(config.knowledgePath || "./knowledge", providerConfig);
      const cb = createCodebaseIndex(providerConfig);
      
      await kb.rebuildIndex();
      await cb.index("./src");
      
      return "Indexes rebuilt successfully.";
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
};
