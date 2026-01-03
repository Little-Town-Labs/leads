import { db } from '@/db';
import { knowledgeBaseDocs, knowledgeBaseChunks } from '@/db/schema';
import { eq, and, sql, desc, isNull } from 'drizzle-orm';
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
 * Search knowledge base for relevant content using semantic similarity
 *
 * Uses pgvector for efficient similarity search with native database operations.
 * Falls back to text embeddings if vector embeddings are not available.
 */
export async function searchKnowledgeBase(
  orgId: string,
  query: string,
  topK: number = 3
): Promise<Array<{ content: string; title: string; similarity: number }>> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query, orgId);

    // Use pgvector cosine similarity operator (<=>)
    // 1 - distance gives us similarity score (0-1 range)
    const chunks = await db
      .select({
        id: knowledgeBaseChunks.id,
        content: knowledgeBaseChunks.content,
        embeddingVector: knowledgeBaseChunks.embeddingVector,
        docId: knowledgeBaseChunks.docId,
        // Calculate similarity: 1 - cosine_distance for values between 0-1
        similarity: sql<number>`1 - (${knowledgeBaseChunks.embeddingVector} <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)})`,
      })
      .from(knowledgeBaseChunks)
      .innerJoin(knowledgeBaseDocs, eq(knowledgeBaseChunks.docId, knowledgeBaseDocs.id))
      .where(
        and(
          eq(knowledgeBaseChunks.orgId, orgId),
          eq(knowledgeBaseDocs.isActive, true),
          isNull(knowledgeBaseDocs.deletedAt) // Exclude soft-deleted documents
        )
      )
      .orderBy(desc(sql`1 - (${knowledgeBaseChunks.embeddingVector} <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)})`))
      .limit(topK);

    if (chunks.length === 0) {
      return [];
    }

    // Get document titles for the top results
    const docIds = [...new Set(chunks.map((c) => c.docId))];
    const docs = await db
      .select({
        id: knowledgeBaseDocs.id,
        title: knowledgeBaseDocs.title,
      })
      .from(knowledgeBaseDocs)
      .where(sql`${knowledgeBaseDocs.id} IN (${sql.join(docIds.map((id) => sql`${id}`), sql`, `)})`)

    const docMap = new Map(docs.map((doc) => [doc.id, doc.title ?? 'Unknown']));

    return chunks.map((chunk) => ({
      content: chunk.content,
      title: docMap.get(chunk.docId!) ?? 'Unknown',
      similarity: chunk.similarity,
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
        embedding: JSON.stringify(docEmbedding), // Keep for backward compatibility
        embeddingVector: docEmbedding, // Native pgvector
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
        embedding: JSON.stringify(chunkEmbedding), // Keep for backward compatibility
        embeddingVector: chunkEmbedding, // Native pgvector
        tokenCount: Math.ceil(chunks[i].length / 4), // Rough estimate
      });
    }

    return doc.id;
  } catch (error) {
    console.error('Error adding document to knowledge base:', error);
    throw error;
  }
}
