import { existsSync, readFileSync, appendFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import type { ConversationMessage } from "./types";

export interface ConversationContext {
  messages: ConversationMessage[];
  add: (role: "user" | "assistant" | "system", content: string, rating?: number) => void;
  getHistory: (limit?: number) => ConversationMessage[];
  clear: () => void;
  save: () => void;
}

export function createConversationContext(
  conversationsPath: string = "./conversations"
): ConversationContext {
  const resolvedPath = resolve(conversationsPath);
  
  let messages: ConversationMessage[] = [];
  
  if (!existsSync(resolvedPath)) {
    mkdirSync(resolvedPath, { recursive: true });
  }
  
  try {
    const today = getDateFile(resolvedPath);
    if (existsSync(today)) {
      const content = readFileSync(today, "utf-8");
      const lines = content.trim().split("\n");
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          messages.push({
            id: parsed.id || `msg_${Date.now()}`,
            role: parsed.role,
            content: parsed.content,
            timestamp: new Date(parsed.timestamp),
            rating: parsed.rating,
          });
        } catch {
          // Skip malformed lines
        }
      }
    }
  } catch {
    // Start fresh on error
  }
  
  function getDateFile(basePath: string): string {
    const date = new Date().toISOString().split("T")[0];
    return resolve(basePath, `${date}.jsonl`);
  }
  
  function add(role: "user" | "assistant" | "system", content: string, rating?: number): void {
    const message: ConversationMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      role,
      content,
      timestamp: new Date(),
      rating,
    };
    
    messages.push(message);
    
    try {
      const todayFile = getDateFile(resolvedPath);
      appendFileSync(todayFile, JSON.stringify(message) + "\n");
    } catch {
      // Silently fail on write error
    }
  }
  
  function getHistory(limit: number = 50): ConversationMessage[] {
    return messages.slice(-limit);
  }
  
  function clear(): void {
    messages = [];
  }
  
  function save(): void {
    try {
      const todayFile = getDateFile(resolvedPath);
      const content = messages.map((m) => JSON.stringify(m)).join("\n") + "\n";
    } catch {
      // Silently fail
    }
  }
  
  return { messages, add, getHistory, clear, save };
}