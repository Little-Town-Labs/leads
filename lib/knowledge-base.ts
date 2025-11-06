import { db } from '@/db';
import { knowledgeBaseDocs, knowledgeBaseChunks } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://gateway.ai.cloudflare.com/v1/ce30696fe41ecef47976b85ec2d0963b/lead-agent/openai',
});

/**
 * Generate embeddings for text using OpenAI's embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://gateway.ai.cloudflare.com/v1/ce30696fe41ecef47976b85ec2d0963b/lead-agent/openai/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
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
    const queryEmbedding = await generateEmbedding(query);

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
        if (!chunk.embedding) return null;

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

    const docMap = new Map(docs.map((doc) => [doc.id, doc.title]));

    return results.map((result) => ({
      content: result.content,
      title: docMap.get(result.docId) || 'Unknown',
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
    const docEmbedding = await generateEmbedding(content.slice(0, 8000)); // Limit to ~8k chars

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
      const chunkEmbedding = await generateEmbedding(chunks[i]);

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
