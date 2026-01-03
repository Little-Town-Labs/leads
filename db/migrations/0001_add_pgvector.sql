-- Migration: Add pgvector extension and vector columns for embeddings
-- Purpose: Migrate from text-based embeddings to native pgvector for better performance
-- Date: 2026-01-03

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector columns to knowledge_base_docs table
ALTER TABLE knowledge_base_docs
  ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Add vector columns to knowledge_base_chunks table
ALTER TABLE knowledge_base_chunks
  ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Create indexes for faster similarity search using IVFFlat
-- Note: IVFFlat is faster for large datasets but requires initial data for training
-- For smaller datasets, you can use HNSW: USING hnsw (embedding_vector vector_cosine_ops)
CREATE INDEX IF NOT EXISTS kb_docs_embedding_vector_idx
  ON knowledge_base_docs
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS kb_chunks_embedding_vector_idx
  ON knowledge_base_chunks
  USING ivfflat (embedding_vector vector_cosine_ops)
  WITH (lists = 100);

-- Migrate existing embeddings from text to vector
-- This converts the JSON string representation to native vector type
UPDATE knowledge_base_docs
  SET embedding_vector = embedding::vector
  WHERE embedding IS NOT NULL AND embedding_vector IS NULL;

UPDATE knowledge_base_chunks
  SET embedding_vector = embedding::vector
  WHERE embedding IS NOT NULL AND embedding_vector IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN knowledge_base_docs.embedding_vector IS 'Native pgvector embedding for semantic search (1536 dimensions)';
COMMENT ON COLUMN knowledge_base_chunks.embedding_vector IS 'Native pgvector embedding for semantic search (1536 dimensions)';
