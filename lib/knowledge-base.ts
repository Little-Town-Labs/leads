import { db } from '@/db';
import { knowledgeBaseDocs, knowledgeBaseChunks } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { embed } from 'ai';
import { getEmbeddingModel } from './ai-resolver';
import { trackAiUsage } from './ai-usage';
import { getAiConfig } from './ai-config';

/**
 * Generate embeddings for text using the organization's configured embedding model
 */
export async function generateEmbedding(text: string, orgId: string): Promise<number[]> {
  const startTime = Date.now();
  const config = await getAiConfig(orgId);
  const model = await getEmbeddingModel(orgId);

  try {
    const { embedding } = await embed({
      model,
      value: text,
    });

    // Track usage (embeddings typically don't return token counts, estimate based on text length)
    const estimatedTokens = Math.ceil(text.length / 4);
    await trackAiUsage({
      orgId,
      operation: 'embedding',
      provider: config.provider,
      model: config.models.embedding,
      inputTokens: estimatedTokens,
      outputTokens: 0,
      totalTokens: estimatedTokens,
      requestDuration: Date.now() - startTime,
      success: true,
    });

    return embedding;
  } catch (error) {
    // Track failed request
    const estimatedTokens = Math.ceil(text.length / 4);
    await trackAiUsage({
      orgId,
      operation: 'embedding',
      provider: config.provider,
      model: config.models.embedding,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      requestDuration: Date.now() - startTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search knowledge base for relevant content using semantic similarity
 */
export async function searchKnowledgeBase(
  orgId: string,
  query: string,
  topK: number = 3
): Promise<Array<{ content: string; title: string; similarity: number }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, orgId);

    // Get all active chunks for the organization
    const chunks = await db
      .select({
        id: knowledgeBaseChunks.id,
        content: knowledgeBaseChunks.content,
        embedding: knowledgeBaseChunks.embedding,
        docId: knowledgeBaseChunks.docId,
      })
      .from(knowledgeBaseChunks)
      .innerJoin(knowledgeBaseDocs, eq(knowledgeBaseChunks.docId, knowledgeBaseDocs.id))
      .where(
        and(
          eq(knowledgeBaseChunks.orgId, orgId),
          eq(knowledgeBaseDocs.isActive, true)
        )
      );

    if (chunks.length === 0) {
      return [];
    }

    // Calculate similarity for each chunk
    const results = chunks
      .map((chunk) => {
        if (!chunk.embedding || !chunk.docId) return null;

        const chunkEmbedding = JSON.parse(chunk.embedding) as number[];
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

        return {
          content: chunk.content,
          docId: chunk.docId,
          similarity,
        };
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Get document titles for the top results
    const docIds = [...new Set(results.map((r) => r.docId))];
    const docs = await db
      .select({
        id: knowledgeBaseDocs.id,
        title: knowledgeBaseDocs.title,
      })
      .from(knowledgeBaseDocs)
      .where(sql`${knowledgeBaseDocs.id} IN (${sql.join(docIds.map((id) => sql`${id}`), sql`, `)})`);

    const docMap = new Map(docs.map((doc) => [doc.id, doc.title ?? 'Unknown']));

    return results.map((result) => ({
      content: result.content,
      title: (docMap.get(result.docId) ?? 'Unknown') as string,
      similarity: result.similarity,
    }));
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}

/**
 * Chunk text into smaller pieces for embedding
 * Uses a simple sliding window approach with overlap
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 100): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk.trim());

    // Move start position with overlap
    start += chunkSize - overlap;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Add a document to the knowledge base with automatic chunking and embedding
 */
export async function addDocumentToKnowledgeBase(
  orgId: string,
  title: string,
  content: string,
  contentType: string = 'document',
  metadata?: { source?: string; author?: string; tags?: string[]; category?: string }
): Promise<string> {
  try {
    // Generate embedding for the full document
    const docEmbedding = await generateEmbedding(content.slice(0, 8000), orgId); // Limit to ~8k chars

    // Create the document record
    const [doc] = await db
      .insert(knowledgeBaseDocs)
      .values({
        orgId,
        title,
        content,
        contentType,
        metadata,
        embedding: JSON.stringify(docEmbedding),
      })
      .returning();

    // Chunk the content
    const chunks = chunkText(content);

    // Generate embeddings for each chunk and insert
    for (let i = 0; i < chunks.length; i++) {
      const chunkEmbedding = await generateEmbedding(chunks[i], orgId);

      await db.insert(knowledgeBaseChunks).values({
        orgId,
        docId: doc.id,
        chunkIndex: i,
        content: chunks[i],
        embedding: JSON.stringify(chunkEmbedding),
        tokenCount: Math.ceil(chunks[i].length / 4), // Rough estimate
      });
    }

    return doc.id;
  } catch (error) {
    console.error('Error adding document to knowledge base:', error);
    throw error;
  }
}
