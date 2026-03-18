import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import type { KnowledgeEntry, ProviderConfig } from "./types";
import { createEmbedder } from "./embeddings";
import { findMostSimilar } from "./embeddings";

export interface KnowledgeBase {
  query: (text: string, topK?: number) => Promise<string[]>;
  add: (text: string, metadata?: Partial<KnowledgeEntry["metadata"]>) => Promise<void>;
  rebuildIndex: () => Promise<void>;
  getStats: () => { count: number; indexed: boolean };
}

export function createKnowledgeBase(
  knowledgePath: string,
  embedderConfig: ProviderConfig
): KnowledgeBase {
  const embedder = createEmbedder(embedderConfig);
  let entries: KnowledgeEntry[] = [];
  let indexed = false;
  let indexing = false;

  const resolvedPath = resolve(knowledgePath);

  function loadEntries(): KnowledgeEntry[] {
    if (!existsSync(resolvedPath)) {
      mkdirSync(resolvedPath, { recursive: true });
      return [];
    }

    const files = readdirSync(resolvedPath).filter((f) => f.endsWith(".json"));
    const allEntries: KnowledgeEntry[] = [];

    for (const file of files) {
      try {
        const content = readFileSync(join(resolvedPath, file), "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          allEntries.push(...parsed);
        } else if (parsed.text) {
          allEntries.push(parsed);
        }
      } catch {
        // Skip malformed files
      }
    }

    return allEntries;
  }

  async function indexEntries(): Promise<void> {
    if (indexing) return;
    indexing = true;

    const unindexed = entries.filter((e) => !e.embedding || e.embedding.length === 0);

    if (unindexed.length === 0) {
      indexed = true;
      indexing = false;
      return;
    }

    console.log(`Indexing ${unindexed.length} knowledge entries...`);

    try {
      const texts = unindexed.map((e) => e.text);
      const embeddings = await embedder.embedBatch(texts);

      for (let i = 0; i < unindexed.length; i++) {
        const entry = unindexed[i];
        const embedding = embeddings[i];
        if (entry && embedding) {
          entry.embedding = embedding;
        }
      }

      indexed = true;
    } catch (e) {
      console.error("Failed to index knowledge:", e);
    } finally {
      indexing = false;
    }
  }

  function startBackgroundIndex(): void {
    setTimeout(() => indexEntries(), 100);
  }

  entries = loadEntries();
  startBackgroundIndex();

  return {
    async query(text: string, topK: number = 5): Promise<string[]> {
      if (!indexed && !indexing) {
        startBackgroundIndex();
      }

      if (entries.length === 0) return [];

      try {
        const queryEmbedding = await embedder.embed(text);
        const results = findMostSimilar(
          queryEmbedding,
          entries
            .filter((e) => e.embedding && e.embedding.length > 0)
            .map((e) => ({ id: e.id, embedding: e.embedding!, text: e.text })),
          topK
        );

        return results
          .filter((r) => r.score > 0.5)
          .map((r) => r.text);
      } catch {
        const lowerText = text.toLowerCase();
        return entries
          .filter((e) => e.text.toLowerCase().includes(lowerText))
          .slice(0, topK)
          .map((e) => e.text);
      }
    },

    async add(text: string, metadata: Partial<KnowledgeEntry["metadata"]> = {}): Promise<void> {
      const entry: KnowledgeEntry = {
        id: `kb_${Date.now()}`,
        text,
        metadata: {
          createdAt: new Date(),
          ...metadata,
        },
      };

      entries.push(entry);

      try {
        entry.embedding = await embedder.embed(text);
      } catch {
        // Will be embedded in background
      }

      const filePath = join(resolvedPath, `knowledge_${Date.now()}.json`);
      writeFileSync(filePath, JSON.stringify(entry, null, 2));
    },

    async rebuildIndex(): Promise<void> {
      entries = loadEntries();
      indexed = false;
      await indexEntries();
    },

    getStats(): { count: number; indexed: boolean } {
      return {
        count: entries.length,
        indexed,
      };
    },
  };
}
