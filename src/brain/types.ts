export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
  embeddingModel?: string;
}

export interface KnowledgeEntry {
  id: string;
  text: string;
  metadata: {
    source?: string;
    tags?: string[];
    createdAt: Date;
  };
  embedding?: number[];
}

export interface CodeChunk {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
  language: string;
  embedding?: number[];
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  rating?: number;
}

export interface LLMRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
