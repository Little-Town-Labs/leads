import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { leads, workflows, type NewLead, type NewWorkflow } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Get the current organization context from Clerk
 */
export async function getOrgContext() {
  const { orgId, userId } = await auth();

  if (!orgId) {
    throw new Error('No organization context. User must be in an organization.');
  }

  if (!userId) {
    throw new Error('No user context. User must be authenticated.');
  }

  return { orgId, userId };
}

/**
 * Get an organization-scoped database client
 * All queries automatically filter by the current user's organization
 */
export async function getOrgDb() {
  const { orgId, userId } = await getOrgContext();

  return {
    orgId,
    userId,

    /**
     * Lead queries - automatically scoped to current organization
     */
    leads: {
      /**
       * Find all leads for the current organization
       */
      findMany: async () => {
        return db.query.leads.findMany({
          where: eq(leads.orgId, orgId),
          orderBy: [desc(leads.createdAt)],
        });
      },

      /**
       * Find a specific lead by ID (must belong to current org)
       */
      findById: async (id: string) => {
        return db.query.leads.findFirst({
          where: and(eq(leads.id, id), eq(leads.orgId, orgId)),
        });
      },

      /**
       * Find leads by status
       */
      findByStatus: async (status: string) => {
        return db.query.leads.findMany({
          where: and(eq(leads.orgId, orgId), eq(leads.status, status)),
          orderBy: [desc(leads.createdAt)],
        });
      },

      /**
       * Create a new lead (automatically adds orgId and userId)
       */
      create: async (data: Omit<NewLead, 'orgId' | 'userId'>) => {
        return db
          .insert(leads)
          .values({
            ...data,
            orgId,
            userId,
          })
          .returning();
      },

      /**
       * Update a lead (must belong to current org)
       */
      update: async (id: string, data: Partial<Omit<NewLead, 'orgId' | 'userId'>>) => {
        return db
          .update(leads)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(and(eq(leads.id, id), eq(leads.orgId, orgId)))
          .returning();
      },

      /**
       * Delete a lead (must belong to current org)
       */
      delete: async (id: string) => {
        return db
          .delete(leads)
          .where(and(eq(leads.id, id), eq(leads.orgId, orgId)))
          .returning();
      },

      /**
       * Count leads by status
       */
      countByStatus: async () => {
        const allLeads = await db.query.leads.findMany({
          where: eq(leads.orgId, orgId),
        });

        return {
          pending: allLeads.filter((l) => l.status === 'pending').length,
          approved: allLeads.filter((l) => l.status === 'approved').length,
          rejected: allLeads.filter((l) => l.status === 'rejected').length,
          total: allLeads.length,
        };
      },
    },

    /**
     * Workflow queries - automatically scoped to current organization
     */
    workflows: {
      /**
       * Find all workflows for the current organization
       */
      findMany: async () => {
        return db.query.workflows.findMany({
          where: eq(workflows.orgId, orgId),
          orderBy: [desc(workflows.createdAt)],
        });
      },

      /**
       * Find a specific workflow by ID (must belong to current org)
       */
      findById: async (id: string) => {
        return db.query.workflows.findFirst({
          where: and(eq(workflows.id, id), eq(workflows.orgId, orgId)),
        });
      },

      /**
       * Find workflows by lead ID
       */
      findByLeadId: async (leadId: string) => {
        return db.query.workflows.findMany({
          where: and(eq(workflows.orgId, orgId), eq(workflows.leadId, leadId)),
          orderBy: [desc(workflows.createdAt)],
        });
      },

      /**
       * Find workflows by status
       */
      findByStatus: async (status: string) => {
        return db.query.workflows.findMany({
          where: and(eq(workflows.orgId, orgId), eq(workflows.status, status)),
          orderBy: [desc(workflows.createdAt)],
        });
      },

      /**
       * Create a new workflow (automatically adds orgId)
       */
      create: async (data: Omit<NewWorkflow, 'orgId'>) => {
        return db
          .insert(workflows)
          .values({
            ...data,
            orgId,
          })
          .returning();
      },

      /**
       * Update a workflow (must belong to current org)
       */
      update: async (id: string, data: Partial<Omit<NewWorkflow, 'orgId'>>) => {
        return db
          .update(workflows)
          .set(data)
          .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
          .returning();
      },

      /**
       * Delete a workflow (must belong to current org)
       */
      delete: async (id: string) => {
        return db
          .delete(workflows)
          .where(and(eq(workflows.id, id), eq(workflows.orgId, orgId)))
          .returning();
      },
    },
  };
}
