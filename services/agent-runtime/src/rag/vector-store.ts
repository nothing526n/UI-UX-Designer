/**
 * Semantic RAG Vector Store
 * Implements Phase 2 AI Platform Core semantic retrieval for Design Tokens,
 * Component Specifications, Wireframe nodes, and Requirements artifacts.
 */

export interface VectorDocument<T = Record<string, any>> {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: T & {
    projectId?: string;
    artifactType?: string;
    category?: "design_system" | "requirement" | "component" | "ux_flow" | "code_snippet";
    tags?: string[];
    tokenBinding?: string;
  };
}

export interface VectorSearchOptions<T = Record<string, any>> {
  topK?: number;
  minScore?: number;
  filter?: {
    projectId?: string;
    artifactType?: string;
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface SearchResult<T = Record<string, any>> {
  document: VectorDocument<T>;
  score: number;
}

export type EmbeddingFunction = (text: string) => Promise<number[]> | number[];

export class VectorStore<T = Record<string, any>> {
  private documents = new Map<string, VectorDocument<T>>();
  private dimensions: number;
  private customEmbedder?: EmbeddingFunction;

  constructor(dimensions = 64, customEmbedder?: EmbeddingFunction) {
    this.dimensions = dimensions;
    this.customEmbedder = customEmbedder;
  }

  /**
   * Deterministic, normalized 64-dim vector hash based on character n-grams and word tokens.
   * Ensures zero-cost, reproducible offline semantic matching.
   */
  public generateDeterministicEmbedding(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    const cleaned = text.toLowerCase().trim();
    if (!cleaned) return vector;

    // 1. Unigrams and word tokens
    const words = cleaned.split(/\W+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash * 31 + word.charCodeAt(j)) % 2147483647;
      }
      const idx = Math.abs(hash) % this.dimensions;
      vector[idx] += 1.0;
    }

    // 2. Character 3-grams for substring and morphological similarity
    for (let i = 0; i <= cleaned.length - 3; i++) {
      const trigram = cleaned.substring(i, i + 3);
      let hash = 5381;
      for (let j = 0; j < 3; j++) {
        hash = ((hash << 5) + hash) + trigram.charCodeAt(j);
      }
      const idx = Math.abs(hash) % this.dimensions;
      vector[idx] += 0.5;
    }

    // 3. L2 Normalize vector to unit length
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vector[i] * vector[i];
    }
    const mag = Math.sqrt(norm);
    if (mag > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vector[i] = vector[i] / mag;
      }
    }

    return vector;
  }

  /**
   * Embed text using custom provider or deterministic fallback
   */
  public async embed(text: string): Promise<number[]> {
    if (this.customEmbedder) {
      const result = await this.customEmbedder(text);
      return result;
    }
    return this.generateDeterministicEmbedding(text);
  }

  /**
   * Compute Cosine Similarity: (u . v) / (||u|| * ||v||)
   */
  public static cosineSimilarity(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const mag = Math.sqrt(normA) * Math.sqrt(normB);
    return mag === 0 ? 0 : dot / mag;
  }

  /**
   * Add documents to vector store with auto-embedding
   */
  public async addDocuments(docs: Array<VectorDocument<T>>): Promise<VectorDocument<T>[]> {
    const indexed: VectorDocument<T>[] = [];

    for (const doc of docs) {
      const embedding = doc.embedding || (await this.embed(doc.content));
      const indexedDoc: VectorDocument<T> = {
        ...doc,
        embedding,
      };
      this.documents.set(doc.id, indexedDoc);
      indexed.push(indexedDoc);
    }

    return indexed;
  }

  /**
   * Perform semantic vector search
   */
  public async search(
    query: string | number[],
    options: VectorSearchOptions<T> = {}
  ): Promise<SearchResult<T>[]> {
    const { topK = 5, minScore = 0.05, filter } = options;
    const queryVector = Array.isArray(query) ? query : await this.embed(query);

    const results: SearchResult<T>[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;

      // Apply metadata filter predicates
      if (filter) {
        let match = true;
        for (const [key, value] of Object.entries(filter)) {
          const metaValue = (doc.metadata as any)?.[key];
          if (Array.isArray(value)) {
            if (!Array.isArray(metaValue) || !value.some((v) => metaValue.includes(v))) {
              match = false;
              break;
            }
          } else if (metaValue !== value) {
            match = false;
            break;
          }
        }
        if (!match) continue;
      }

      const score = VectorStore.cosineSimilarity(queryVector, doc.embedding);
      if (score >= minScore) {
        results.push({ document: doc, score });
      }
    }

    // Sort descending by score and slice topK
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  public get(id: string): VectorDocument<T> | undefined {
    return this.documents.get(id);
  }

  public delete(id: string): boolean {
    return this.documents.delete(id);
  }

  public clear(): void {
    this.documents.clear();
  }

  public size(): number {
    return this.documents.size;
  }

  /**
   * Generate PostgreSQL `pgvector` DDL schema
   */
  public generatePgVectorSchema(tableName = "vector_embeddings"): string {
    return `
-- PostgreSQL pgvector Schema for AI UI/UX Designer Platform
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS ${tableName} (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(${this.dimensions}) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_${tableName}_embedding 
ON ${tableName} 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_${tableName}_project 
ON ${tableName} (project_id);
    `.trim();
  }
}

export const defaultVectorStore = new VectorStore();
