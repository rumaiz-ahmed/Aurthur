import { existsSync, readFileSync, readdirSync } from "fs";
import { resolve, extname, join } from "path";
import type { CodeChunk, ProviderConfig } from "./types";
import { createEmbedder } from "./embeddings";
import { findMostSimilar } from "./embeddings";

const CODE_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".java",
  ".cpp", ".c", ".h", ".hpp", ".cs", ".rb", ".php", ".swift",
  ".kt", ".scala", ".vue", ".svelte"
];

const EXCLUDE_DIRS = new Set([
  "node_modules", "dist", "build", ".git", "coverage"
]);

function findCodeFiles(dir: string, results: string[] = []): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        findCodeFiles(fullPath, results);
      }
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (
        CODE_EXTENSIONS.includes(ext) &&
        !entry.name.endsWith(".test.ts") &&
        !entry.name.endsWith(".spec.ts") &&
        !entry.name.endsWith(".d.ts")
      ) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

export interface CodebaseIndex {
  query: (text: string, topK?: number) => Promise<CodeChunk[]>;
  index: (rootPath?: string) => Promise<void>;
  getStats: () => { count: number; indexed: boolean };
}

export function createCodebaseIndex(embedderConfig: ProviderConfig): CodebaseIndex {
  const embedder = createEmbedder(embedderConfig);
  let chunks: CodeChunk[] = [];
  let indexed = false;
  let indexing = false;

  async function indexDirectory(rootPath: string): Promise<void> {
    if (indexing) return;
    indexing = true;

    const resolvedRoot = resolve(rootPath);
    const allChunks: CodeChunk[] = [];

    try {
      const files = findCodeFiles(resolvedRoot);
      for (const file of files) {
        const ext = extname(file).toLowerCase();
        if (!CODE_EXTENSIONS.includes(ext)) continue;

        try {
          const content = readFileSync(file, "utf-8");
          const fileChunks = chunkFile(content, file);
          allChunks.push(...fileChunks);
        } catch {
          // Skip unreadable files
        }
      }

      console.log(`Found ${allChunks.length} code chunks, indexing...`);

      const batchSize = 10;
      for (let i = 0; i < allChunks.length; i += batchSize) {
        const batch = allChunks.slice(i, i + batchSize);
        const texts = batch.map((c) => `${c.filePath}\n${c.content}`);

        try {
          const embeddings = await embedder.embedBatch(texts);
          for (let j = 0; j < batch.length; j++) {
            const chunk = batch[j];
            const embedding = embeddings[j];
            if (chunk && embedding) {
              chunk.embedding = embedding;
            }
          }
        } catch {
          // Continue without embeddings
        }
      }

      chunks = allChunks;
      indexed = true;
    } catch (e) {
      console.error("Failed to index codebase:", e);
    } finally {
      indexing = false;
    }
  }

  function chunkFile(content: string, filePath: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const lines = content.split("\n");
    const chunkSize = 50;
    const overlap = 10;

    for (let i = 0; i < lines.length; i += chunkSize - overlap) {
      const chunkLines = lines.slice(i, i + chunkSize);
      if (chunkLines.length < 5) continue;

      chunks.push({
        filePath,
        content: chunkLines.join("\n"),
        startLine: i + 1,
        endLine: i + chunkLines.length,
        language: extname(filePath).slice(1) || "text",
      });
    }

    return chunks;
  }

  return {
    async query(text: string, topK: number = 3): Promise<CodeChunk[]> {
      if (!indexed && !indexing) {
        return [];
      }

      if (chunks.length === 0) return [];

      try {
        const queryEmbedding = await embedder.embed(text);
        const results = findMostSimilar(
          queryEmbedding,
          chunks
            .filter((c) => c.embedding && c.embedding.length > 0)
            .map((c) => ({ id: c.filePath + c.startLine, embedding: c.embedding!, text: c.content })),
          topK
        );

        return results
          .filter((r) => r.score > 0.4)
          .map((r) => chunks.find((c) => c.filePath + c.startLine === r.id)!)
          .filter(Boolean);
      } catch {
        return [];
      }
    },

    async index(rootPath: string = "./src"): Promise<void> {
      if (!existsSync(rootPath)) {
        console.warn(`Codebase path ${rootPath} does not exist`);
        return;
      }
      await indexDirectory(rootPath);
    },

    getStats(): { count: number; indexed: boolean } {
      return {
        count: chunks.length,
        indexed,
      };
    },
  };
}
