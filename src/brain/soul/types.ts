export interface SpeechExample {
  user: string;
  arthur: string;
}

export interface SkillDefinition {
  description: string;
  enabled?: boolean;
  trigger?: string[];
  executable?: boolean;
  code?: string;
}

export interface LearningAdjustment {
  from: string;
  to: string;
  timestamp: Date;
}

export interface SoulProfile {
  version: string;
  lastUpdated: Date;
  autoUpdate: boolean;
  
  user: {
    name: string;
    pronouns?: string;
    timezone?: string;
    writingStyle?: string;
  };
  
  speech: {
    howUserTalks: string[];
    howToRespond: string[];
    exampleResponses: SpeechExample[];
  };
  
  personality: {
    traits: string[];
    humorStyle: string[];
    boundaries: {
      avoidTopics?: string[];
    };
    communicationStyle: Record<string, unknown>;
  };
  
  skills: {
    [category: string]: SkillDefinition;
  };
  
  knowledge: {
    aboutUser: string[];
    aboutEnvironment: string[];
    projectContext: string[];
  };
  
  learning: {
    autoInfer: {
      enabled: boolean;
      confidenceThreshold: number;
    };
    patternsLearned: string[];
    adjustments: LearningAdjustment[];
  };
}

export interface SoulInference {
  id: string;
  field: keyof SoulProfile;
  suggestedValue: unknown;
  confidence: number;
  evidence: string[];
  createdAt: Date;
}
