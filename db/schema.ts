import { pgTable, text, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

/**
 * Leads table - stores all inbound lead submissions
 * Each lead belongs to a Clerk organization (orgId)
 */
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(), // Clerk organization ID
    userId: text('user_id').notNull(), // Clerk user ID who created it
    email: text('email').notNull(),
    name: text('name').notNull(),
    company: text('company'),
    phone: text('phone'),
    message: text('message').notNull(),
    qualificationCategory: text('qualification_category'), // QUALIFIED, UNQUALIFIED, SUPPORT, FOLLOW_UP
    qualificationReason: text('qualification_reason'),
    emailDraft: text('email_draft'), // Generated email content
    researchResults: jsonb('research_results'), // AI research data
    status: text('status').notNull().default('pending'), // pending, approved, rejected
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIndex: index('leads_org_id_idx').on(table.orgId),
    statusIndex: index('leads_status_idx').on(table.status),
    createdAtIndex: index('leads_created_at_idx').on(table.createdAt),
  })
);

/**
 * Workflows table - stores AI workflow execution data
 * Each workflow is associated with a lead and organization
 */
export const workflows = pgTable(
  'workflows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    status: text('status').notNull(), // running, completed, failed
    researchResults: jsonb('research_results'), // AI research data
    emailDraft: text('email_draft'), // Generated email content
    approvedBy: text('approved_by'), // Clerk user ID
    rejectedBy: text('rejected_by'), // Clerk user ID
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    orgIdIndex: index('workflows_org_id_idx').on(table.orgId),
    leadIdIndex: index('workflows_lead_id_idx').on(table.leadId),
    statusIndex: index('workflows_status_idx').on(table.status),
  })
);

// Type exports for TypeScript
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
