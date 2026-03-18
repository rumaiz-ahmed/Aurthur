import type { SoulProfile } from "../soul/types";

export interface Skill {
  name: string;
  description: string;
  triggers: string[];
  execute: (input: string, context: SkillContext) => Promise<string>;
  requiresContext?: boolean;
}

export interface SkillContext {
  soul: SoulProfile;
  workingDirectory?: string;
}

export interface SkillResult {
  success: boolean;
  output: string;
  error?: string;
}
