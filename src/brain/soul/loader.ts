import { existsSync, readFileSync, watch } from "fs";
import { resolve } from "path";
import type { SoulProfile } from "./types";
import { parseSoulFile, parseFrontmatter, parseSoulFromMarkdown } from "./parser";

export interface SoulLoader {
  getSoul: () => SoulProfile;
  reload: () => void;
  watch: (onChange: () => void) => void;
  isValid: () => boolean;
  getPath: () => string;
}

export function createSoulLoader(soulPath: string = "./SOUL.md"): SoulLoader {
  let soul: SoulProfile | null = null;
  let valid = false;
  const resolvedPath = resolve(soulPath);
  
  function load(): SoulProfile {
    if (!existsSync(resolvedPath)) {
      throw new Error(`SOUL.md not found at ${resolvedPath}. ARTHUR requires SOUL.md to function.`);
    }
    
    const content = readFileSync(resolvedPath, "utf-8");
    const { frontmatter, markdown } = parseFrontmatter(content);
    soul = parseSoulFromMarkdown(frontmatter, markdown);
    valid = validateSoul(soul);
    
    if (!valid) {
      throw new Error(`SOUL.md validation failed. Please ensure all required fields are present.`);
    }
    
    return soul;
  }
  
  function validateSoul(profile: SoulProfile): boolean {
    if (!profile.user?.name) return false;
    if (!profile.user.name || profile.user.name === "Unknown") return false;
    return true;
  }
  
  load();
  
  return {
    getSoul: () => {
      if (!soul) throw new Error("Soul not loaded");
      return soul;
    },
    
    reload: () => {
      load();
    },
    
    watch: (onChange: () => void) => {
      watch(resolvedPath, (eventType) => {
        if (eventType === "change") {
          try {
            load();
            onChange();
          } catch (e) {
            console.error("Failed to reload SOUL.md:", e);
          }
        }
      });
    },
    
    isValid: () => valid,
    
    getPath: () => resolvedPath,
  };
}
