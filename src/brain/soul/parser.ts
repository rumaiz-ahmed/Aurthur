import { readFileSync } from "fs";
import type { SoulProfile, SpeechExample, SkillDefinition, LearningAdjustment } from "./types";

export interface ParsedSoul {
  frontmatter: {
    version?: string;
    lastUpdated?: string | null;
    autoUpdate?: boolean;
  };
  markdown: string;
}

export function parseFrontmatter(content: string): ParsedSoul {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, markdown: content };
  }
  
  const yamlStr = match[1] ?? "";
  const markdown = match[2] ?? "";
  const frontmatter: Record<string, unknown> = {};
  
  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();
    
    if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (value === "null" || value === "~") value = null;
    else if (!isNaN(Number(value)) && value !== "") value = Number(value);
    else if (typeof value === "string" && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    frontmatter[key] = value as string;
  }
  
  return { frontmatter, markdown };
}

export function parseYamlValue(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~") return null;
  if (!isNaN(Number(value)) && value.trim() !== "") return Number(value);
  return value.replace(/^["']|["']$/g, "");
}

export function parseSoulFromMarkdown(frontmatter: Record<string, unknown>, markdown: string): SoulProfile {
  const lines = markdown.split("\n");
  let currentSection = "";
  let inList = false;
  const sections: Record<string, string[]> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith("# ")) {
      currentSection = trimmed.slice(2).toLowerCase().replace(/\s+/g, "_");
      sections[currentSection] = [];
      inList = false;
    } else if (trimmed.startsWith("- ")) {
      inList = true;
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection]!.push(trimmed.slice(2));
    } else if (trimmed && currentSection) {
      if (inList) {
        sections[currentSection]?.push(trimmed);
      } else {
        if (!sections[currentSection]) sections[currentSection] = [];
        sections[currentSection]!.push(trimmed);
      }
    }
  }
  
  const speechExamples: SpeechExample[] = [];
  const speechSection = markdown.match(/exampleResponses:([\s\S]*?)(?:\n#|\n*$)/i);
  if (speechSection && speechSection[1]) {
    const exampleRegex = /-\s*user:\s*["'](.+?)["']\s*\n\s*arthur:\s*["'](.+?)["']/g;
    let m;
    while ((m = exampleRegex.exec(speechSection[1])) !== null) {
      speechExamples.push({ user: m[1] ?? "", arthur: m[2] ?? "" });
    }
  }
  
  const learningAdjustments: LearningAdjustment[] = [];
  const adjustSection = markdown.match(/adjustments:([\s\S]*?)(?:\n#|\n*$)/i);
  if (adjustSection && adjustSection[1]) {
    const adjRegex = /-\s*from:\s*["'](.+?)["']\s*\n\s*to:\s*["'](.+?)["']/g;
    let m;
    while ((m = adjRegex.exec(adjustSection[1])) !== null) {
      learningAdjustments.push({
        from: m[1] ?? "",
        to: m[2] ?? "",
        timestamp: new Date(),
      });
    }
  }
  
  return {
    version: (frontmatter.version as string) || "1.0",
    lastUpdated: frontmatter.lastUpdated ? new Date(frontmatter.lastUpdated as string) : new Date(),
    autoUpdate: (frontmatter.autoUpdate as boolean) || false,
    
    user: {
      name: extractValue(markdown, /name:\s*([^\n]+)/) || "Unknown",
      pronouns: extractValue(markdown, /pronouns:\s*([^\n]+)/),
      timezone: extractValue(markdown, /timezone:\s*([^\n]+)/),
      writingStyle: extractValue(markdown, /writingStyle:\s*([^\n]+)/),
    },
    
    speech: {
      howUserTalks: sections.how_user_talks || [],
      howToRespond: sections.how_to_respond || [],
      exampleResponses: speechExamples,
    },
    
    personality: {
      traits: sections.traits || [],
      humorStyle: sections.humor_style || [],
      boundaries: {
        avoidTopics: sections.avoid_topics || [],
      },
      communicationStyle: {},
    },
    
    skills: parseSkillsSection(markdown),
    
    knowledge: {
      aboutUser: sections.about_user || [],
      aboutEnvironment: sections.about_environment || [],
      projectContext: sections.project_context || [],
    },
    
    learning: {
      autoInfer: {
        enabled: (frontmatter.autoUpdate as boolean) || false,
        confidenceThreshold: 0.8,
      },
      patternsLearned: sections.patterns_learned || [],
      adjustments: learningAdjustments,
    },
  };
}

function extractValue(text: string, regex: RegExp): string | undefined {
  const match = text.match(regex);
  return match?.[1]?.trim();
}

function parseSkillsSection(markdown: string): Record<string, SkillDefinition> {
  const skills: Record<string, SkillDefinition> = {};
  const skillsMatch = markdown.match(/skills:([\s\S]*?)(?:\n#|\n*$)/i);
  
  if (!skillsMatch || skillsMatch[1] === undefined) return skills;
  
  const skillContent = skillsMatch[1];
  const skillRegex = /^\s{0,4}(\w[\w-]*):\s*\n((?:\s{2,}.+\n?)+)/gm;
  let match;
  
  while ((match = skillRegex.exec(skillContent)) !== null) {
    const name = match[1] ?? "";
    const content = match[2] ?? "";
    
    skills[name] = {
      description: extractValue(content, /description:\s*["'](.+?)["']/) || name,
      enabled: !content.includes("enabled: false"),
      trigger: extractList(content, "trigger"),
      executable: content.includes("executable: true"),
      code: extractValue(content, /code:\s*\|[\s\S]*?\n\s+(.+?)(?=\n\s*\w|$)/) ?? undefined,
    };
  }
  
  return skills;
}

function extractList(text: string, key: string): string[] | undefined {
  const match = text.match(new RegExp(`${key}:\\s*\\n((?:\\s*-\\s*.+\\n?)+)`));
  if (!match || !match[1]) return undefined;
  
  const items: string[] = [];
  const itemRegex = /-\s*(.+)/g;
  let m;
  while ((m = itemRegex.exec(match[1])) !== null) {
    items.push((m[1] ?? "").trim());
  }
  return items;
}

export function parseSoulFile(filePath: string): SoulProfile {
  const content = readFileSync(filePath, "utf-8");
  const { frontmatter, markdown } = parseFrontmatter(content);
  return parseSoulFromMarkdown(frontmatter, markdown);
}
