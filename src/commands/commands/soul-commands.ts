import type { Command } from "../../types";
import { createSoulLoader } from "../../brain/soul/loader";
import { createSoulUpdater } from "../../brain/soul/updater";
import { readFileSync, existsSync } from "fs";
import { exec } from "child_process";

export const soulCommand: Command = {
  name: "soul",
  description: "Show soul profile summary",
  execute: () => {
    try {
      const loader = createSoulLoader();
      const soul = loader.getSoul();
      
      return `═══ ${soul.user.name}'s Soul ═══
      
Speech Style: ${soul.user.writingStyle || "default"}
Personality Traits: ${soul.personality.traits.slice(0, 3).join(", ")}
Skills: ${Object.keys(soul.skills).length} registered
Patterns Learned: ${soul.learning.patternsLearned.length}

Run "soul read" for full profile.`;
    } catch (error) {
      return `Error loading SOUL: ${error instanceof Error ? error.message : "Unknown"}`;
    }
  },
};

export const soulReadCommand: Command = {
  name: "soul read",
  description: "Show full SOUL.md",
  aliases: ["soul read"],
  execute: () => {
    try {
      const loader = createSoulLoader();
      const content = readFileSync(loader.getPath(), "utf-8");
      return content;
    } catch (error) {
      return `Error reading SOUL.md: ${error instanceof Error ? error.message : "Unknown"}`;
    }
  },
};

export const soulEditCommand: Command = {
  name: "soul edit",
  description: "Open SOUL.md in editor",
  execute: () => {
    const soulPath = "./SOUL.md";
    if (!existsSync(soulPath)) {
      return `SOUL.md not found at ${soulPath}. Create it first.`;
    }
    
    const editor = process.env.EDITOR || (process.platform === "win32" ? "notepad" : "nano");
    try {
      exec(`${editor} "${soulPath}"`);
      return "Opening SOUL.md in editor...";
    } catch {
      return `Could not open editor. Edit ${soulPath} manually.`;
    }
  },
};

export const soulLearnCommand: Command = {
  name: "soul learn",
  description: "Trigger pattern inference",
  aliases: ["soul infer"],
  execute: () => {
    return "Pattern inference runs automatically. Check soul status for learned patterns.";
  },
};

export const soulResetCommand: Command = {
  name: "soul reset",
  description: "Reset SOUL to template",
  aliases: ["soul clear"],
  execute: () => {
    return "This would reset SOUL.md. This action is not implemented for safety. Edit SOUL.md directly if needed.";
  },
};
