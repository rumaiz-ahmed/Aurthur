import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { ArthurApp } from "./components";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { PROVIDER_PRESETS, listProviders } from "./brain/providers";

const CONFIG_PATH = resolve(process.cwd(), "brain.config.json");
const SOUL_PATH = resolve(process.cwd(), "SOUL.md");
const ENV_PATH = resolve(process.cwd(), ".env");

function printBox(lines: string[], width = 70) {
  console.log("╔" + "═".repeat(width - 2) + "╗");
  for (const line of lines) {
    const padded = line.padEnd(width - 4);
    console.log("║ " + padded + " ║");
  }
  console.log("╚" + "═".repeat(width - 2) + "╝");
}

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    readline.question(question, (answer: string) => {
      readline.close();
      resolve(answer);
    });
  });
}

async function setupWizard(): Promise<boolean> {
  console.clear();

  printBox([
    "██████╗ ██╗   ██╗███╗   ██╗██╗  ██╗███████╗██████╗ ",
    "██╔══██╗██║   ██║████╗  ██║██║ ██╔╝██╔════╝██╔══██╗",
    "██████╔╝██║   ██║██╔██╗ ██║█████╔╝ █████╗  ██████╔╝",
    "██╔══██╗██║   ██║██║╚██╗██║██╔═██╗ ██╔══╝  ██╔══██╗",
    "██████╔╝╚██████╔╝██║ ╚████║██║  ██╗███████╗██║  ██║",
    "╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝",
    "",
    "Your Personal AI Assistant",
  ]);

  console.log("\n");
  printBox(["Welcome to ARTHUR setup! I'll help you get started."], 60);
  console.log("\n");

  // Step 1: Check brain.config.json
  let config: Record<string, unknown> = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
    } catch {
      config = {};
    }
  }

  // Step 2: Provider setup
  let provider = config.provider as string || "";
  let apiKey = config.apiKey as string || "";
  let model = config.model as string || "";

  if (!provider || !apiKey) {
    console.log("\n📡 LLM Provider Setup\n");
    console.log("Available providers:");
    const providers = listProviders();
    providers.forEach((p, i) => {
      const preset = PROVIDER_PRESETS[p];
      console.log(`  ${i + 1}. ${preset?.name || p} - ${preset?.defaultModel}`);
    });
    console.log("  0. Custom (enter URL manually)\n");

    const choice = await prompt("Select provider (number): ") || "1";
    const choiceNum = parseInt(choice);
    let selectedProvider = providers[0] || "openai";

    if (choiceNum === 0 || isNaN(choiceNum)) {
      provider = await prompt("Enter provider name: ");
      const baseUrl = await prompt("Enter API base URL: ");
      model = await prompt("Enter model name: ");
      config.baseUrl = baseUrl;
    } else {
      selectedProvider = providers[choiceNum - 1] || providers[0] || "openai";
      provider = selectedProvider;
      const preset = PROVIDER_PRESETS[selectedProvider];
      config.baseUrl = preset?.baseUrl;
      model = preset?.defaultModel || "gpt-4";
    }

    apiKey = await prompt("\nEnter your API key: ");
    if (!apiKey) {
      printBox(["⚠️  API key is required for ARTHUR to function!"], 60);
      apiKey = await prompt("API key: ");
    }
  }

  // Step 3: Save brain.config.json
  config = {
    ...config,
    provider,
    apiKey,
    model,
    embeddingModel: PROVIDER_PRESETS[provider]?.embeddingModel || "nomic-embed-text",
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
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(`\n✅ Saved brain.config.json\n`);

  // Step 4: Save .env
  const envContent = `# ARTHUR Configuration
BRAIN_PROVIDER=${provider}
BRAIN_API_KEY=${apiKey}
BRAIN_BASE_URL=${config.baseUrl || ""}
BRAIN_MODEL=${model}
`;
  writeFileSync(ENV_PATH, envContent);
  console.log(`✅ Saved .env (API key stored securely)\n`);

  // Step 5: SOUL.md setup
  if (!existsSync(SOUL_PATH)) {
    console.log("\n👤 SOUL.md Setup\n");
    console.log("SOUL.md defines who you are and how ARTHUR should communicate.\n");

    const name = await prompt("What should ARTHUR call you? ") || "User";
    const pronouns = await prompt("Your pronouns (they/them, she/her, he/him): ") || "they/them";
    const style = await prompt("Communication style (casual, formal, technical): ") || "casual";

    const soulContent = `---
version: "1.0"
lastUpdated: "${new Date().toISOString()}"
autoUpdate: true
---

# USER PROFILE

name: ${name}
pronouns: ${pronouns}
timezone: UTC
writingStyle: ${style}

# SPEECH PATTERNS

howUserTalks:
  - Uses ${style} communication style
  - Types in short, direct messages
  - Asks questions plainly

howToRespond:
  - Match their ${style} tone
  - Be concise and direct
  - Show personality

exampleResponses:
  - user: "hey"
    arthur: "Hey! What's up?"
  - user: "what can you do"
    arthur: "I can chat, search the web, manage files, and more. Just ask!"

# PERSONALITY

traits:
  - Helpful
  - Curious
  - Efficient

humorStyle:
  - Warm and friendly
  - Light humor

boundaries:
  avoidTopics: []

communicationStyle: {}

# SKILLS

skills:
  webSearch:
    enabled: true
    description: "Search the web for information"
    
  fileOperations:
    enabled: true
    description: "Read, write, and modify files"

# KNOWLEDGE

aboutUser:
  - Name: ${name}
  - Communication style: ${style}
    
aboutEnvironment:
  - Using ARTHUR CLI

projectContext:
  - ARTHUR personal AI assistant

# LEARNING

autoInfer:
  enabled: true
  confidenceThreshold: 0.8

patternsLearned: []
adjustments: []
`;

    writeFileSync(SOUL_PATH, soulContent);
    console.log(`\n✅ Created SOUL.md for ${name}\n`);
  }

  // Step 6: Create directories
  const dirs = ["./knowledge", "./conversations"];
  for (const dir of dirs) {
    const dirPath = resolve(dir);
    if (!existsSync(dirPath)) {
      writeFileSync(dirPath + "/.gitkeep", "");
    }
  }

  // Done
  console.log("\n");
  printBox([
    "🎉 Setup Complete!",
    "",
    "Run 'bun run dev' to start ARTHUR",
    "",
    "Quick commands:",
    "  help     - See all commands",
    "  brain    - Brain status",
    "  soul     - View/edit your profile",
    "  skills   - See available skills",
  ], 60);
  console.log("\n");

  return true;
}

async function main() {
  // Load .env and generate brain.config.json from it (makes .env the source of truth)
  if (existsSync(ENV_PATH)) {
    const envVars: Record<string, string> = {};
    try {
      const content = readFileSync(ENV_PATH, "utf-8");
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
    } catch {}

    // Generate brain.config.json from .env
    if (envVars.BRAIN_PROVIDER) {
      const preset = PROVIDER_PRESETS[envVars.BRAIN_PROVIDER];
      const config = {
        provider: envVars.BRAIN_PROVIDER,
        baseUrl: envVars.BRAIN_BASE_URL || preset?.baseUrl || "",
        model: envVars.BRAIN_MODEL || preset?.defaultModel || "gpt-4",
        apiKey: envVars.BRAIN_API_KEY || "",
        embeddingModel: preset?.embeddingModel || "nomic-embed-text",
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
      writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    }
  }

  // Check if setup is needed
  const needsSetup = !existsSync(SOUL_PATH);

  if (needsSetup) {
    const proceed = await setupWizard();
    if (!proceed) return;
  }

  const renderer = await createCliRenderer();
  createRoot(renderer).render(<ArthurApp />);
}

main().catch(console.error);
