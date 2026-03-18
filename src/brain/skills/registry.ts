import type { SoulProfile } from "../soul/types";
import type { Skill, SkillContext, SkillResult } from "./types";

export interface SkillRegistry {
  register: (skill: Skill) => void;
  unregister: (name: string) => void;
  get: (name: string) => Skill | undefined;
  findByTrigger: (input: string) => Skill | undefined;
  list: () => Skill[];
  execute: (input: string, context: SkillContext) => Promise<SkillResult>;
}

export function createSkillRegistry(): SkillRegistry {
  const skills = new Map<string, Skill>();
  
  return {
    register(skill: Skill) {
      skills.set(skill.name.toLowerCase(), skill);
    },
    
    unregister(name: string) {
      skills.delete(name.toLowerCase());
    },
    
    get(name: string) {
      return skills.get(name.toLowerCase());
    },
    
    findByTrigger(input: string) {
      const lowerInput = input.toLowerCase();
      
      for (const skill of skills.values()) {
        for (const trigger of skill.triggers) {
          if (lowerInput.includes(trigger.toLowerCase())) {
            return skill;
          }
        }
      }
      
      return undefined;
    },
    
    list() {
      return Array.from(skills.values());
    },
    
    async execute(input: string, context: SkillContext): Promise<SkillResult> {
      const skill = this.findByTrigger(input);
      
      if (!skill) {
        return {
          success: false,
          output: "",
          error: "No skill found for input",
        };
      }
      
      try {
        const output = await skill.execute(input, context);
        return { success: true, output };
      } catch (e) {
        return {
          success: false,
          output: "",
          error: e instanceof Error ? e.message : "Unknown error",
        };
      }
    },
  };
}

export function loadSkillsFromSoul(
  registry: SkillRegistry,
  soul: SoulProfile
): void {
  for (const [category, skillDef] of Object.entries(soul.skills)) {
    if (!skillDef.enabled && skillDef.enabled !== undefined) continue;
    
    const triggers = skillDef.trigger || [category];
    
    registry.register({
      name: category,
      description: skillDef.description,
      triggers,
      execute: async (input: string, context: SkillContext) => {
        if (skillDef.executable && skillDef.code) {
          // SECURITY: Do not allow arbitrary code execution from SOUL.md
          // Only allow pre-defined safe operations
          return `[Skill: ${category}] Custom skill code is disabled for security. Only built-in skills can execute.`;
        }
        
        return `[Skill: ${category}] Would execute: ${input}`;
      },
      requiresContext: skillDef.executable,
    });
  }
}
