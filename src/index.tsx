import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { ArthurApp } from "./components";
import { existsSync } from "fs";
import { resolve } from "path";

const SOUL_PATH = resolve(process.cwd(), "SOUL.md");

async function main() {
  if (!existsSync(SOUL_PATH)) {
    console.error(`
╔═══════════════════════════════════════════════════════════════╗
║                    ARTHUR - First Run                        ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  SOUL.md not found!                                           ║
║                                                               ║
║  ARTHUR requires SOUL.md to function. This file defines:      ║
║  • Who you are                                                ║
║  • How you communicate                                        ║
║  • What ARTHUR should know about you                         ║
║  • Skills and knowledge                                       ║
║                                                               ║
║  Please create SOUL.md in the current directory.             ║
║  See SOUL.md.template for the format.                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
    
    const { writeFileSync } = await import("fs");
    const template = `---
version: "1.0"
lastUpdated: "${new Date().toISOString()}"
autoUpdate: false
---

# USER PROFILE

name: User
pronouns: they/them
timezone: UTC
writingStyle: casual

# SPEECH PATTERNS

howUserTalks:
  - Types in lowercase when casual
  - Short, direct messages
  - Questions are brief

howToRespond:
  - Match their casual tone
  - Be concise
  - Light humor is fine

exampleResponses:
  - user: "hey"
    arthur: "Hey! What's up?"
  - user: "make it work"
    arthur: "On it."

# PERSONALITY

traits:
  - Helpful
  - Curious

humorStyle:
  - Dry wit

boundaries:
  avoidTopics: []

communicationStyle: {}

# SKILLS

skills:
  webSearch:
    enabled: true
    description: "Search the web"
    
  fileOperations:
    enabled: true
    description: "Read/write files"

# KNOWLEDGE

aboutUser: []
aboutEnvironment: []
projectContext: []

# LEARNING

autoInfer:
  enabled: true
  confidenceThreshold: 0.8

patternsLearned: []
adjustments: []
`;
    
    writeFileSync(SOUL_PATH, template);
    console.log(`\nCreated ${SOUL_PATH} with a basic template.`);
    console.log("Please edit it to personalize ARTHUR, then restart.\n");
    return;
  }

  const renderer = await createCliRenderer();
  createRoot(renderer).render(<ArthurApp />);
}

main().catch(console.error);
