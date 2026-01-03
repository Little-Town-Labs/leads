-- Migration: Add soft delete support to key tables
-- Purpose: Enable soft deletes for audit trail and data recovery
-- Date: 2026-01-03

-- Add soft delete columns to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS deleted_at timestamp,
  ADD COLUMN IF NOT EXISTS deleted_by text,
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Add soft delete columns to workflows table
ALTER TABLE workflows
  ADD COLUMN IF NOT EXISTS deleted_at timestamp,
  ADD COLUMN IF NOT EXISTS deleted_by text,
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Add soft delete columns to knowledge_base_docs table
ALTER TABLE knowledge_base_docs
  ADD COLUMN IF NOT EXISTS deleted_at timestamp,
  ADD COLUMN IF NOT EXISTS deleted_by text,
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Create indexes for soft delete queries (filter out deleted records efficiently)
CREATE INDEX IF NOT EXISTS leads_deleted_at_idx
  ON leads(deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS workflows_deleted_at_idx
  ON workflows(deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS kb_docs_deleted_at_idx
  ON knowledge_base_docs(deleted_at)
  WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN leads.deleted_at IS 'Timestamp when the lead was soft-deleted (NULL = active)';
COMMENT ON COLUMN leads.deleted_by IS 'Clerk user ID of the user who deleted the lead';
COMMENT ON COLUMN leads.deletion_reason IS 'Optional reason for deletion';

COMMENT ON COLUMN workflows.deleted_at IS 'Timestamp when the workflow was soft-deleted (NULL = active)';
COMMENT ON COLUMN workflows.deleted_by IS 'Clerk user ID of the user who deleted the workflow';
COMMENT ON COLUMN workflows.deletion_reason IS 'Optional reason for deletion';

COMMENT ON COLUMN knowledge_base_docs.deleted_at IS 'Timestamp when the document was soft-deleted (NULL = active)';
COMMENT ON COLUMN knowledge_base_docs.deleted_by IS 'Clerk user ID of the user who deleted the document';
COMMENT ON COLUMN knowledge_base_docs.deletion_reason IS 'Optional reason for deletion';
