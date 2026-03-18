import type { SoulProfile, SoulInference, SpeechExample } from "./types";

export interface Inferrer {
  analyzeConversations: (messages: Array<{ role: string; content: string }>) => SoulInference[];
}

export function createInferrer(): Inferrer {
  const threshold = 0.7;
  
  function analyzeConversations(
    messages: Array<{ role: string; content: string }>
  ): SoulInference[] {
    const inferences: SoulInference[] = [];
    const userMessages = messages.filter((m) => m.role === "user");
    
    if (userMessages.length < 5) return inferences;
    
    const speechInference = inferSpeechPatterns(userMessages.map((m) => m.content));
    if (speechInference) inferences.push(speechInference);
    
    const formalityInference = inferFormality(userMessages.map((m) => m.content));
    if (formalityInference) inferences.push(formalityInference);
    
    const verbosityInference = inferVerbosity(userMessages.map((m) => m.content));
    if (verbosityInference) inferences.push(verbosityInference);
    
    return inferences.filter((i) => i.confidence >= threshold);
  }
  
  function inferSpeechPatterns(messages: string[]): SoulInference | null {
    const patterns: string[] = [];
    let confidence = 0;
    
    const hasLowercase = messages.filter((m) => /^[a-z]/.test(m)).length / messages.length;
    if (hasLowercase > 0.5) {
      patterns.push("Uses lowercase at message start");
      confidence += hasLowercase * 0.3;
    }
    
    const hasQuestions = messages.filter((m) => m.includes("?")).length / messages.length;
    if (hasQuestions > 0.3) {
      patterns.push("Asks questions frequently");
      confidence += hasQuestions * 0.2;
    }
    
    const hasExclamations = messages.filter((m) => m.includes("!")).length / messages.length;
    if (hasExclamations > 0.2) {
      patterns.push("Uses exclamations");
      confidence += hasExclamations * 0.15;
    }
    
    const avgLength = messages.reduce((a, b) => a + b.length, 0) / messages.length;
    if (avgLength < 50) {
      patterns.push("Prefers short messages");
      confidence += 0.2;
    } else if (avgLength > 200) {
      patterns.push("Uses long messages");
      confidence += 0.2;
    }
    
    if (patterns.length > 0 && confidence >= threshold) {
      return {
        id: `speech_${Date.now()}`,
        field: "speech" as keyof SoulProfile,
        suggestedValue: patterns,
        confidence,
        evidence: messages.slice(0, 3),
        createdAt: new Date(),
      };
    }
    
    return null;
  }
  
  function inferFormality(messages: string[]): SoulInference | null {
    const formalWords = ["please", "thank you", "kindly", "would you", "could you"];
    const informalWords = ["hey", "yo", "bruh", "dude", "sup", "gonna", "wanna", "gotta"];
    
    let formalCount = 0;
    let informalCount = 0;
    
    for (const msg of messages) {
      const lower = msg.toLowerCase();
      for (const word of formalWords) {
        if (lower.includes(word)) formalCount++;
      }
      for (const word of informalWords) {
        if (lower.includes(word)) informalCount++;
      }
    }
    
    const total = formalCount + informalCount;
    if (total === 0) return null;
    
    const informalRatio = informalCount / total;
    
    if (informalRatio > 0.6) {
      return {
        id: `formality_${Date.now()}`,
        field: "user" as keyof SoulProfile,
        suggestedValue: "casual",
        confidence: informalRatio,
        evidence: messages.filter((m) => informalWords.some((w) => m.toLowerCase().includes(w))).slice(0, 2),
        createdAt: new Date(),
      };
    } else if (informalRatio < 0.3) {
      return {
        id: `formality_${Date.now()}`,
        field: "user" as keyof SoulProfile,
        suggestedValue: "formal",
        confidence: 1 - informalRatio,
        evidence: messages.filter((m) => formalWords.some((w) => m.toLowerCase().includes(w))).slice(0, 2),
        createdAt: new Date(),
      };
    }
    
    return null;
  }
  
  function inferVerbosity(messages: string[]): SoulInference | null {
    const avgWords = messages.reduce((a, m) => a + m.split(/\s+/).length, 0) / messages.length;
    
    if (avgWords < 10) {
      return {
        id: `verbosity_${Date.now()}`,
        field: "user" as keyof SoulProfile,
        suggestedValue: "concise",
        confidence: Math.min(1, (10 - avgWords) / 10 + 0.5),
        evidence: messages.slice(0, 2),
        createdAt: new Date(),
      };
    } else if (avgWords > 30) {
      return {
        id: `verbosity_${Date.now()}`,
        field: "user" as keyof SoulProfile,
        suggestedValue: "verbose",
        confidence: Math.min(1, (avgWords - 30) / 30 + 0.5),
        evidence: messages.slice(0, 2),
        createdAt: new Date(),
      };
    }
    
    return null;
  }
  
  return { analyzeConversations };
}
