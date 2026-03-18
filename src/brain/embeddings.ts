import type { ProviderConfig } from "./types";

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}

export interface Embedder {
  embed: (text: string) => Promise<number[]>;
  embedBatch: (texts: string[]) => Promise<number[][]>;
}

export function createEmbedder(config: ProviderConfig): Embedder {
  const model = config.embeddingModel || config.defaultModel;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  async function embed(text: string): Promise<number[]> {
    const truncated = text.length > 8000 ? text.slice(0, 8000) : text;

    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        input: truncated,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.status}`);
    }

    const data = await response.json() as { data?: Array<{ embedding?: number[] }> };
    return data.data?.[0]?.embedding || [];
  }

  async function embedBatch(texts: string[]): Promise<number[][]> {
    const truncated = texts.map((t) => (t.length > 8000 ? t.slice(0, 8000) : t));

    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        input: truncated,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding batch request failed: ${response.status}`);
    }

    const data = await response.json() as Record<string, unknown>;
    const items = (data.data as Array<{ index: number; embedding: number[] }> | undefined) || [];
    return items
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }

  return { embed, embedBatch };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai !== undefined && bi !== undefined) {
      dotProduct += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export function findMostSimilar(
  queryEmbedding: number[],
  embeddings: Array<{ id: string; embedding: number[]; text: string }>,
  topK: number = 5
): Array<{ id: string; text: string; score: number }> {
  const similarities = embeddings.map((item) => ({
    id: item.id,
    text: item.text,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
