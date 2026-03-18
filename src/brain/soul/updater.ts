import { readFileSync, writeFileSync } from "fs";
import type { SoulProfile, SoulInference, LearningAdjustment } from "./types";

export interface SoulUpdater {
  applyInference: (profile: SoulProfile, inference: SoulInference) => SoulProfile;
  applyInferences: (profile: SoulProfile, inferences: SoulInference[]) => SoulProfile;
  saveProfile: (profile: SoulProfile, filePath: string) => void;
  generateDiff: (profile: SoulProfile, inference: SoulInference) => string;
}

export function createSoulUpdater(): SoulUpdater {
  function applyInference(profile: SoulProfile, inference: SoulInference): SoulProfile {
    const updated = { ...profile };
    
    switch (inference.field) {
      case "user":
        if (typeof inference.suggestedValue === "string") {
          updated.user = { ...updated.user, writingStyle: inference.suggestedValue };
        }
        break;
        
      case "speech":
        if (Array.isArray(inference.suggestedValue)) {
          updated.speech = {
            ...updated.speech,
            howUserTalks: Array.from(new Set([...updated.speech.howUserTalks, ...(inference.suggestedValue as string[])])),
          };
        }
        break;
        
      case "learning":
        updated.learning = {
          ...updated.learning,
          patternsLearned: [
            ...updated.learning.patternsLearned,
            `Inferred: ${JSON.stringify(inference.suggestedValue)}`,
          ],
          adjustments: [
            ...updated.learning.adjustments,
            {
              from: "previous",
              to: JSON.stringify(inference.suggestedValue),
              timestamp: inference.createdAt,
            },
          ],
        };
        break;
    }
    
    updated.lastUpdated = new Date();
    return updated;
  }
  
  function applyInferences(profile: SoulProfile, inferences: SoulInference[]): SoulProfile {
    let updated = { ...profile };
    for (const inference of inferences) {
      updated = applyInference(updated, inference);
    }
    return updated;
  }
  
  function saveProfile(profile: SoulProfile, filePath: string): void {
    const markdown = profileToMarkdown(profile);
    writeFileSync(filePath, markdown, "utf-8");
  }
  
  function profileToMarkdown(profile: SoulProfile): string {
    const frontmatter = `---
version: "${profile.version}"
lastUpdated: "${profile.lastUpdated.toISOString()}"
autoUpdate: ${profile.autoUpdate}
---`;

    const sections = [
      "# USER PROFILE",
      "",
      `name: ${profile.user.name}`,
      profile.user.pronouns ? `pronouns: ${profile.user.pronouns}` : "",
      profile.user.timezone ? `timezone: ${profile.user.timezone}` : "",
      `writingStyle: ${profile.user.writingStyle || "default"}`,
      "",
      "# SPEECH PATTERNS",
      "",
      "howUserTalks:",
      ...profile.speech.howUserTalks.map((s) => `  - ${s}`),
      "",
      "howToRespond:",
      ...profile.speech.howToRespond.map((s) => `  - ${s}`),
      "",
      "exampleResponses:",
      ...profile.speech.exampleResponses.map(
        (e) => `  - user: "${e.user}"\n    arthur: "${e.arthur}"`
      ),
      "",
      "# PERSONALITY",
      "",
      "traits:",
      ...profile.personality.traits.map((t) => `  - ${t}`),
      "",
      "humorStyle:",
      ...profile.personality.humorStyle.map((h) => `  - ${h}`),
      "",
      "boundaries:",
      "  avoidTopics:",
      ...(profile.personality.boundaries.avoidTopics || []).map((t) => `    - ${t}`),
      "",
      "# SKILLS",
      "",
      "skills:",
      ...Object.entries(profile.skills).map(([name, skill]) => {
        const lines = [`${name}:`];
        if (skill.description) lines.push(`  description: "${skill.description}"`);
        if (skill.enabled === false) lines.push(`  enabled: false`);
        if (skill.trigger?.length) lines.push(`  trigger:`);
        skill.trigger?.forEach((t) => lines.push(`    - ${t}`));
        if (skill.executable) lines.push(`  executable: true`);
        return lines.join("\n");
      }),
      "",
      "# KNOWLEDGE",
      "",
      "aboutUser:",
      ...profile.knowledge.aboutUser.map((k) => `  - ${k}`),
      "",
      "aboutEnvironment:",
      ...profile.knowledge.aboutEnvironment.map((k) => `  - ${k}`),
      "",
      "projectContext:",
      ...profile.knowledge.projectContext.map((k) => `  - ${k}`),
      "",
      "# LEARNING",
      "",
      `autoInfer:`,
      `  enabled: ${profile.learning.autoInfer.enabled}`,
      `  confidenceThreshold: ${profile.learning.autoInfer.confidenceThreshold}`,
      "",
      "patternsLearned:",
      ...profile.learning.patternsLearned.map((p) => `  - ${p}`),
      "",
      "adjustments:",
      ...profile.learning.adjustments.map(
        (a) => `  - from: "${a.from}"\n    to: "${a.to}"`
      ),
    ].filter((line) => line !== undefined);
    
    return [frontmatter, "", sections.join("\n")].join("\n");
  }
  
  function generateDiff(profile: SoulProfile, inference: SoulInference): string {
    return `Proposed change for SOUL.md:
    
Field: ${inference.field}
Suggested value: ${JSON.stringify(inference.suggestedValue, null, 2)}

Confidence: ${(inference.confidence * 100).toFixed(0)}%
Evidence:
${inference.evidence.map((e) => `  - "${e}"`).join("\n")}`;
  }
  
  return {
    applyInference,
    applyInferences,
    saveProfile,
    generateDiff,
  };
}
