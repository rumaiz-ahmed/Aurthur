import { createLLMClient, type LLMClient } from "./llm";
import { createKnowledgeBase, type KnowledgeBase } from "./knowledge";
import { createCodebaseIndex, type CodebaseIndex } from "./codebase";
import { createConversationContext, type ConversationContext } from "./context";
import { createSoulLoader, type SoulLoader } from "./soul/loader";
import { createInferrer, type Inferrer } from "./soul/inferrer";
import { createSoulUpdater, type SoulUpdater } from "./soul/updater";
import { createSkillRegistry, loadSkillsFromSoul, type SkillRegistry } from "./skills/registry";
import { webSearchSkill } from "./skills/web-search";
import { fileOpsSkill } from "./skills/file-ops";
import { loadConfig, getProviderConfig, type BrainConfig } from "./config";
import type { SoulProfile } from "./soul/types";

export interface BrainEngine {
  think: (input: string) => Promise<string>;
  thinkStream: (input: string, onChunk: (chunk: string) => void) => Promise<string>;
  addMessage: (role: "user" | "assistant", content: string) => void;
  rateMessage: (messageId: string, rating: number) => void;
  getContext: () => SoulProfile;
  reloadSoul: () => void;
  getStats: () => BrainStats;
}

export interface BrainStats {
  provider: string;
  model: string;
  knowledgeCount: number;
  knowledgeIndexed: boolean;
  codebaseCount: number;
  codebaseIndexed: boolean;
  conversationCount: number;
  soulName: string;
}

export function createBrainEngine(config?: Partial<BrainConfig>): BrainEngine {
  const brainConfig = { ...loadConfig(), ...config };
  const providerConfig = getProviderConfig(brainConfig);
  
  const llm = createLLMClient(providerConfig);
  const knowledge = createKnowledgeBase(brainConfig.knowledgePath || "./knowledge", providerConfig);
  const codebase = createCodebaseIndex(providerConfig);
  const context = createConversationContext(brainConfig.conversationsPath || "./conversations");
  const soulLoader = createSoulLoader(brainConfig.soulPath || "./SOUL.md");
  const inferrer = createInferrer();
  const updater = createSoulUpdater();
  const skills = createSkillRegistry();
  
  function reloadSkills() {
    skills.unregister("webSearch");
    skills.unregister("fileOps");
    skills.register(webSearchSkill);
    skills.register(fileOpsSkill);
    loadSkillsFromSoul(skills, soulLoader.getSoul());
  }
  
  reloadSkills();
  
  soulLoader.watch(() => {
    soulLoader.reload();
    reloadSkills();
  });
  
  if (brainConfig.learning.enabled) {
    setTimeout(() => {
      codebase.index("./src").catch(() => {});
    }, 100);
  }
  
  function composeSystemPrompt(soul: SoulProfile): string {
    return `You are ARTHUR, a personal AI assistant.

USER PROFILE:
- Name: ${soul.user.name}
${soul.user.pronouns ? `- Pronouns: ${soul.user.pronouns}` : ""}
- Speaking style: ${soul.user.writingStyle || "default"}

SPEECH STYLE:
${soul.speech.howToRespond.slice(0, 3).map((s) => `- ${s}`).join("\n")}

PERSONALITY:
- Traits: ${soul.personality.traits.slice(0, 5).join(", ")}
- Humor: ${soul.personality.humorStyle.slice(0, 2).join(", ") || "neutral"}
${soul.personality.boundaries.avoidTopics?.length ? `- Avoid topics: ${soul.personality.boundaries.avoidTopics.join(", ")}` : ""}

CONTEXT ABOUT USER:
${soul.knowledge.aboutUser.slice(0, 3).map((k) => `- ${k}`).join("\n")}

IMPORTANT:
- Match the user's communication style (${soul.user.writingStyle || "default"})
- Be concise and direct
- Show personality, don't be robotic
- If you don't know something, say so honestly`;
  }
  
  async function think(input: string): Promise<string> {
    const soul = soulLoader.getSoul();
    
    const skillResult = await skills.execute(input, {
      soul,
      workingDirectory: process.cwd(),
    });
    
    if (skillResult.success) {
      context.add("assistant", skillResult.output);
      return skillResult.output;
    }
    
    context.add("user", input);
    
    let contextText = "";
    
    const relevantKnowledge = await knowledge.query(input, 3);
    if (relevantKnowledge.length > 0) {
      contextText += "\n\nRELEVANT KNOWLEDGE:\n" + relevantKnowledge.map((k) => `- ${k}`).join("\n");
    }
    
    if (containsCodeQuery(input)) {
      const relevantCode = await codebase.query(input, 2);
      if (relevantCode.length > 0) {
        contextText += "\n\nRELEVANT CODE:\n" + relevantCode.map((c) => 
          `// ${c.filePath}:${c.startLine}-${c.endLine}\n${c.content}`
        ).join("\n\n");
      }
    }
    
    const history = context.getHistory(10);
    const systemPrompt = composeSystemPrompt(soul);
    
    // Build conversation context from history
    const conversationHistory = history.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    
    let userPrompt = input;
    if (contextText) {
      userPrompt = `${input}\n\n${contextText}`;
    }
    
    try {
      const response = await llm.completeWithHistory(userPrompt, systemPrompt, conversationHistory);
      
      context.add("assistant", response);
      
      if (brainConfig.learning.autoInfer && brainConfig.learning.enabled) {
        triggerInference();
      }
      
      return response;
    } catch (error) {
      const errorMsg = `I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`;
      context.add("assistant", errorMsg);
      return errorMsg;
    }
  }
  
  async function thinkStream(
    input: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const soul = soulLoader.getSoul();
    context.add("user", input);
    
    const history = context.getHistory(10);
    const systemPrompt = composeSystemPrompt(soul);
    
    try {
      const response = await llm.completeStream(input, systemPrompt, onChunk);
      context.add("assistant", response);
      return response;
    } catch (error) {
      const errorMsg = `Error: ${error instanceof Error ? error.message : "Unknown"}`;
      onChunk(errorMsg);
      context.add("assistant", errorMsg);
      return errorMsg;
    }
  }
  
  function addMessage(role: "user" | "assistant", content: string): void {
    context.add(role, content);
  }
  
  function rateMessage(messageId: string, rating: number): void {
    const msgs = context.getHistory(1000);
    const msg = msgs.find((m) => m.id === messageId);
    if (msg) {
      msg.rating = rating;
    }
  }
  
  function getContext(): SoulProfile {
    return soulLoader.getSoul();
  }
  
  function reloadSoul(): void {
    soulLoader.reload();
    reloadSkills();
  }
  
  function getStats(): BrainStats {
    const soul = soulLoader.getSoul();
    return {
      provider: providerConfig.name,
      model: providerConfig.defaultModel,
      knowledgeCount: knowledge.getStats().count,
      knowledgeIndexed: knowledge.getStats().indexed,
      codebaseCount: codebase.getStats().count,
      codebaseIndexed: codebase.getStats().indexed,
      conversationCount: context.getHistory().length,
      soulName: soul.user.name,
    };
  }
  
  let inferenceTimeout: ReturnType<typeof setTimeout> | null = null;
  
  function triggerInference(): void {
    if (inferenceTimeout) clearTimeout(inferenceTimeout);
    
    inferenceTimeout = setTimeout(() => {
      const history = context.getHistory(50);
      const messages = history.map((m) => ({ role: m.role, content: m.content }));
      const inferences = inferrer.analyzeConversations(messages);
      
      if (inferences.length > 0 && soulLoader.getSoul().learning.autoInfer.enabled) {
        const updated = updater.applyInferences(soulLoader.getSoul(), inferences);
        updater.saveProfile(updated, soulLoader.getPath());
        reloadSoul();
      }
    }, 5000);
  }
  
  function containsCodeQuery(input: string): boolean {
    const codeKeywords = [
      "code", "function", "class", "variable", "import", "export",
      "debug", "error", "bug", "fix", "implement", "refactor",
      "file", "module", "api", "interface", "type"
    ];
    const lower = input.toLowerCase();
    return codeKeywords.some((k) => lower.includes(k));
  }
  
  return {
    think,
    thinkStream,
    addMessage,
    rateMessage,
    getContext,
    reloadSoul,
    getStats,
  };
}