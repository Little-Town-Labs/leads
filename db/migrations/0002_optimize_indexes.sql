-- Migration: Optimize database indexes for common query patterns
-- Purpose: Add missing indexes to improve query performance
-- Date: 2026-01-03

-- Leads table - composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS leads_org_status_idx
  ON leads(org_id, status);

CREATE INDEX IF NOT EXISTS leads_created_updated_idx
  ON leads(created_at DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS leads_org_created_idx
  ON leads(org_id, created_at DESC);

-- Workflows table - common query patterns
CREATE INDEX IF NOT EXISTS workflows_org_lead_idx
  ON workflows(org_id, lead_id);

CREATE INDEX IF NOT EXISTS workflows_status_created_idx
  ON workflows(status, created_at DESC);

CREATE INDEX IF NOT EXISTS workflows_org_status_idx
  ON workflows(org_id, status);

-- Quiz responses - lead assessment lookup
CREATE INDEX IF NOT EXISTS quiz_responses_org_lead_idx
  ON quiz_responses(org_id, lead_id);

CREATE INDEX IF NOT EXISTS quiz_responses_lead_idx
  ON quiz_responses(lead_id, created_at DESC);

-- Lead scores - tier and sorting queries
CREATE INDEX IF NOT EXISTS lead_scores_tier_created_idx
  ON lead_scores(org_id, tier, created_at DESC);

CREATE INDEX IF NOT EXISTS lead_scores_readiness_idx
  ON lead_scores(org_id, readiness_score DESC);

-- AI usage - analytical queries for usage tracking
CREATE INDEX IF NOT EXISTS ai_usage_org_created_idx
  ON ai_usage(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_operation_idx
  ON ai_usage(org_id, operation, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_org_provider_idx
  ON ai_usage(org_id, provider, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_lead_idx
  ON ai_usage(lead_id, created_at DESC);

-- Email sends - tracking and status queries
CREATE INDEX IF NOT EXISTS email_sends_org_status_idx
  ON email_sends(org_id, status);

CREATE INDEX IF NOT EXISTS email_sends_lead_idx
  ON email_sends(org_id, lead_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS email_sends_org_sent_idx
  ON email_sends(org_id, sent_at DESC);

-- Email sequences - retrieval by organization
CREATE INDEX IF NOT EXISTS email_sequences_org_active_idx
  ON email_sequences(org_id, is_active);

CREATE INDEX IF NOT EXISTS email_sequences_org_created_idx
  ON email_sequences(org_id, created_at DESC);

-- Organizations - common lookups
CREATE INDEX IF NOT EXISTS organizations_subdomain_idx
  ON organizations(subdomain)
  WHERE subdomain IS NOT NULL;

CREATE INDEX IF NOT EXISTS organizations_created_idx
  ON organizations(created_at DESC);

-- Organization members - membership queries
CREATE INDEX IF NOT EXISTS org_members_user_org_idx
  ON organization_members(user_id, org_id);

CREATE INDEX IF NOT EXISTS org_members_org_role_idx
  ON organization_members(org_id, role);

-- Quiz questions - retrieval by organization
CREATE INDEX IF NOT EXISTS quiz_questions_org_active_idx
  ON quiz_questions(org_id, is_active);

CREATE INDEX IF NOT EXISTS quiz_questions_order_idx
  ON quiz_questions(org_id, question_order);

-- Add comments for documentation
COMMENT ON INDEX leads_org_status_idx IS 'Composite index for filtering leads by organization and status';
COMMENT ON INDEX workflows_org_lead_idx IS 'Composite index for finding workflows by organization and lead';
COMMENT ON INDEX ai_usage_org_created_idx IS 'Index for AI usage analytics queries sorted by date';
COMMENT ON INDEX email_sends_lead_idx IS 'Index for tracking email history per lead';
