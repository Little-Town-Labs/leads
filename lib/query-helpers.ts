/**
 * Query helper utilities for soft delete support
 * Provides reusable filters and functions for working with soft-deleted records
 */

import { db } from '@/db';
import { leads, workflows, knowledgeBaseDocs } from '@/db/schema';
import { eq, and, isNull, SQL } from 'drizzle-orm';

/**
 * Filter condition to exclude soft-deleted records
 * Usage: .where(and(eq(table.orgId, orgId), notDeleted(table)))
 */
export function notDeleted<T extends { deletedAt: any }>(
  table: T
): SQL<unknown> {
  return isNull(table.deletedAt);
}

/**
 * Filter condition to include only soft-deleted records
 * Usage: .where(and(eq(table.orgId, orgId), onlyDeleted(table)))
 */
export function onlyDeleted<T extends { deletedAt: any }>(
  table: T
): SQL<unknown> {
  return isNull(table.deletedAt);
}

/**
 * Soft delete a lead
 */
export async function softDeleteLead(
  leadId: string,
  deletedBy: string,
  deletionReason?: string
): Promise<void> {
  await db
    .update(leads)
    .set({
      deletedAt: new Date(),
      deletedBy,
      deletionReason,
    })
    .where(and(eq(leads.id, leadId), isNull(leads.deletedAt)));
}

/**
 * Restore a soft-deleted lead
 */
export async function restoreLead(leadId: string): Promise<void> {
  await db
    .update(leads)
    .set({
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    })
    .where(eq(leads.id, leadId));
}

/**
 * Soft delete a workflow
 */
export async function softDeleteWorkflow(
  workflowId: string,
  deletedBy: string,
  deletionReason?: string
): Promise<void> {
  await db
    .update(workflows)
    .set({
      deletedAt: new Date(),
      deletedBy,
      deletionReason,
    })
    .where(and(eq(workflows.id, workflowId), isNull(workflows.deletedAt)));
}

/**
 * Restore a soft-deleted workflow
 */
export async function restoreWorkflow(workflowId: string): Promise<void> {
  await db
    .update(workflows)
    .set({
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    })
    .where(eq(workflows.id, workflowId));
}

/**
 * Soft delete a knowledge base document
 */
export async function softDeleteKnowledgeBaseDoc(
  docId: string,
  deletedBy: string,
  deletionReason?: string
): Promise<void> {
  await db
    .update(knowledgeBaseDocs)
    .set({
      deletedAt: new Date(),
      deletedBy,
      deletionReason,
    })
    .where(and(eq(knowledgeBaseDocs.id, docId), isNull(knowledgeBaseDocs.deletedAt)));
}

/**
 * Restore a soft-deleted knowledge base document
 */
export async function restoreKnowledgeBaseDoc(docId: string): Promise<void> {
  await db
    .update(knowledgeBaseDocs)
    .set({
      deletedAt: null,
      deletedBy: null,
      deletionReason: null,
    })
    .where(eq(knowledgeBaseDocs.id, docId));
}

/**
 * Get all leads for an organization (excluding soft-deleted)
 */
export async function getActiveLeads(orgId: string) {
  return db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, orgId), isNull(leads.deletedAt)))
    .orderBy(leads.createdAt);
}

/**
 * Get all workflows for an organization (excluding soft-deleted)
 */
export async function getActiveWorkflows(orgId: string) {
  return db
    .select()
    .from(workflows)
    .where(and(eq(workflows.orgId, orgId), isNull(workflows.deletedAt)))
    .orderBy(workflows.createdAt);
}

/**
 * Get all knowledge base documents for an organization (excluding soft-deleted)
 */
export async function getActiveKnowledgeBaseDocs(orgId: string) {
  return db
    .select()
    .from(knowledgeBaseDocs)
    .where(and(eq(knowledgeBaseDocs.orgId, orgId), isNull(knowledgeBaseDocs.deletedAt)))
    .orderBy(knowledgeBaseDocs.createdAt);
}

/**
 * Get soft-deleted leads for an organization
 */
export async function getDeletedLeads(orgId: string) {
  return db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, orgId), isNull(leads.deletedAt)))
    .orderBy(leads.deletedAt);
}

/**
 * Permanently delete old soft-deleted records (data retention policy)
 * WARNING: This is a hard delete and cannot be undone
 *
 * @param daysOld - Delete records soft-deleted more than this many days ago
 */
export async function permanentlyDeleteOldRecords(daysOld: number = 90): Promise<{
  leadsDeleted: number;
  workflowsDeleted: number;
  docsDeleted: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Delete old leads
  const deletedLeads = await db
    .delete(leads)
    .where(
      and(
        isNull(leads.deletedAt),
        // @ts-expect-error - Drizzle doesn't have lte for timestamp comparison
        leads.deletedAt < cutoffDate
      )
    )
    .returning();

  // Delete old workflows
  const deletedWorkflows = await db
    .delete(workflows)
    .where(
      and(
        isNull(workflows.deletedAt),
        // @ts-expect-error - Drizzle doesn't have lte for timestamp comparison
        workflows.deletedAt < cutoffDate
      )
    )
    .returning();

  // Delete old knowledge base docs
  const deletedDocs = await db
    .delete(knowledgeBaseDocs)
    .where(
      and(
        isNull(knowledgeBaseDocs.deletedAt),
        // @ts-expect-error - Drizzle doesn't have lte for timestamp comparison
        knowledgeBaseDocs.deletedAt < cutoffDate
      )
    )
    .returning();

  return {
    leadsDeleted: deletedLeads.length,
    workflowsDeleted: deletedWorkflows.length,
    docsDeleted: deletedDocs.length,
  };
}
