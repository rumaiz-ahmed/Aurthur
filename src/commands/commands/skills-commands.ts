import type { Command } from "../../types";
import { createSkillRegistry } from "../../brain/skills/registry";
import { webSearchSkill } from "../../brain/skills/web-search";
import { fileOpsSkill } from "../../brain/skills/file-ops";

export const skillsCommand: Command = {
  name: "skills",
  description: "List available skills",
  execute: () => {
    const registry = createSkillRegistry();
    registry.register(webSearchSkill);
    registry.register(fileOpsSkill);
    
    const skills = registry.list();
    
    const lines = [
      "═══ Available Skills ═══",
      "",
      ...skills.map((s) => `${s.name}: ${s.description}`),
    ];
    
    return lines.join("\n");
  },
};

export const skillTestCommand: Command = {
  name: "skill test",
  description: "Test a skill",
  execute: (args) => {
    if (!args) {
      return "Usage: skill test <name> <input>";
    }
    
    const parts = args.split(/\s+/);
    const skillName = parts[0] ?? "";
    const input = parts.slice(1).join(" ");
    
    const registry = createSkillRegistry();
    registry.register(webSearchSkill);
    registry.register(fileOpsSkill);
    
    const skill = registry.get(skillName);
    
    if (!skill) {
      return `Skill "${skillName}" not found. Run "skills" to see available skills.`;
    }
    
    return `[Would test ${skillName} with: "${input}"]`;
  },
};
