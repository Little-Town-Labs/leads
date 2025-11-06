import { pgTable, text, uuid, timestamp, jsonb, index, integer, boolean, unique } from 'drizzle-orm/pg-core';

/**
 * Users table - stores user data synced from Clerk
 * Maps to Clerk users for local database operations
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkUserId: text('clerk_user_id').notNull().unique(), // Maps to Clerk user ID
    email: text('email').notNull(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    imageUrl: text('image_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    clerkUserIdIndex: index('users_clerk_user_id_idx').on(table.clerkUserId),
    emailIndex: index('users_email_idx').on(table.email),
  })
);

/**
 * Organization Members table - tracks user membership in organizations
 * Synced from Clerk organization memberships
 */
export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkOrgId: text('clerk_org_id').notNull(),
    clerkUserId: text('clerk_user_id').notNull(),
    role: text('role').notNull(), // admin, member
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgUserUnique: unique('org_user_unique').on(table.clerkOrgId, table.clerkUserId),
    clerkOrgIdIndex: index('org_members_clerk_org_id_idx').on(table.clerkOrgId),
    clerkUserIdIndex: index('org_members_clerk_user_id_idx').on(table.clerkUserId),
  })
);

/**
 * Tenants table - stores tenant/organization configuration
 * Maps to Clerk organizations but adds custom branding and settings
 */
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkOrgId: text('clerk_org_id').notNull().unique(), // Maps to Clerk organization ID
    subdomain: text('subdomain').notNull().unique(), // lead-agent, timeless-tech
    customDomain: text('custom_domain'), // Optional: leads.company.com
    name: text('name').notNull(), // Display name
    slug: text('slug').notNull().unique(), // URL-safe identifier

    // Branding customization
    branding: jsonb('branding').$type<{
      logoUrl?: string;
      primaryColor: string;
      secondaryColor: string;
      fontFamily?: string;
      faviconUrl?: string;
    }>().notNull().default({
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    }),

    // Landing page content (stored as JSON for flexibility)
    landingPage: jsonb('landing_page').$type<{
      heroTitle: string;
      heroSubtitle: string;
      ctaText: string;
      featureSections?: Array<{
        title: string;
        description: string;
        icon?: string;
      }>;
    }>().notNull(),

    // Settings
    settings: jsonb('settings').$type<{
      quizCompletionRedirect?: string;
      emailFromName?: string;
      emailFromAddress?: string;
      enableAiResearch: boolean;
      qualificationThreshold: number; // 0-100, leads above this get AI research
    }>().notNull().default({
      enableAiResearch: true,
      qualificationThreshold: 60,
    }),

    // Subscription & limits
    subscriptionTier: text('subscription_tier').notNull().default('starter'), // starter, professional, enterprise
    subscriptionStatus: text('subscription_status').notNull().default('active'), // active, trial, canceled, suspended
    usageLimits: jsonb('usage_limits').$type<{
      maxQuizCompletionsMonthly: number;
      maxAiWorkflowsMonthly: number;
      maxTeamMembers: number;
    }>().notNull(),

    // Usage tracking (reset monthly)
    currentUsage: jsonb('current_usage').$type<{
      quizCompletionsThisMonth: number;
      aiWorkflowsThisMonth: number;
      lastResetDate: string; // ISO date string
    }>().notNull().default({
      quizCompletionsThisMonth: 0,
      aiWorkflowsThisMonth: 0,
      lastResetDate: new Date().toISOString(),
    }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    subdomainIndex: index('tenants_subdomain_idx').on(table.subdomain),
    clerkOrgIdIndex: index('tenants_clerk_org_id_idx').on(table.clerkOrgId),
  })
);

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

/**
 * Quiz Questions table - stores the assessment quiz questions
 * Questions can be customized per organization in Phase 2 (multi-tenant)
 */
export const quizQuestions = pgTable(
  'quiz_questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(), // For Phase 2: per-tenant customization
    questionNumber: integer('question_number').notNull(), // 1-16
    questionType: text('question_type').notNull(), // contact_info, multiple_choice, checkbox, text
    questionText: text('question_text').notNull(),
    questionSubtext: text('question_subtext'), // Optional helper text
    options: jsonb('options'), // Array of {value, label, score, ddip_compatible}
    scoringWeight: integer('scoring_weight').notNull().default(0), // Multiplier for importance
    isRequired: boolean('is_required').notNull().default(true),
    placeholder: text('placeholder'), // For text inputs
    minSelections: integer('min_selections'), // For checkbox type
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIndex: index('quiz_questions_org_id_idx').on(table.orgId),
    questionNumberIndex: index('quiz_questions_number_idx').on(table.questionNumber),
  })
);

/**
 * Quiz Responses table - stores individual lead's answers to quiz questions
 */
export const quizResponses = pgTable(
  'quiz_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').references(() => quizQuestions.id, { onDelete: 'cascade' }),
    questionNumber: integer('question_number').notNull(),
    answer: jsonb('answer').notNull(), // Flexible: string, array of strings, or object
    pointsEarned: integer('points_earned').notNull().default(0), // Score for this answer
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    leadIdIndex: index('quiz_responses_lead_id_idx').on(table.leadId),
    questionIdIndex: index('quiz_responses_question_id_idx').on(table.questionId),
  })
);

/**
 * Lead Scores table - stores calculated scores for each lead
 */
export const leadScores = pgTable(
  'lead_scores',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }).notNull().unique(),
    readinessScore: integer('readiness_score').notNull(), // 0-100 from quiz
    qualificationScore: integer('qualification_score'), // 0-100 from AI analysis (optional)
    totalPoints: integer('total_points').notNull(), // Raw points from quiz
    maxPossiblePoints: integer('max_possible_points').notNull(), // For percentage calculation
    tier: text('tier').notNull(), // cold, warm, hot, qualified
    scoringBreakdown: jsonb('scoring_breakdown'), // Detailed scoring by category
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIndex: index('lead_scores_org_id_idx').on(table.orgId),
    leadIdIndex: index('lead_scores_lead_id_idx').on(table.leadId),
    tierIndex: index('lead_scores_tier_idx').on(table.tier),
    readinessScoreIndex: index('lead_scores_readiness_idx').on(table.readinessScore),
  })
);

/**
 * Email Sequences table - stores nurture email templates
 * Each sequence is for a specific tier (cold, warm)
 */
export const emailSequences = pgTable(
  'email_sequences',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    tier: text('tier').notNull(), // cold, warm
    sequenceNumber: integer('sequence_number').notNull(), // 1, 2, 3...
    delayDays: integer('delay_days').notNull(), // 0, 1, 3, 7, 14...
    subject: text('subject').notNull(),
    body: text('body').notNull(), // Supports variables: {{name}}, {{score}}, {{company}}
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIndex: index('email_sequences_org_id_idx').on(table.orgId),
    tierIndex: index('email_sequences_tier_idx').on(table.tier),
  })
);

/**
 * Email Sends table - tracks all emails sent (nurture and personalized)
 */
export const emailSends = pgTable(
  'email_sends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    sequenceId: uuid('sequence_id').references(() => emailSequences.id), // NULL for personalized emails
    emailType: text('email_type').notNull(), // nurture, personalized
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    sentAt: timestamp('sent_at'),
    scheduledAt: timestamp('scheduled_at'),
    status: text('status').notNull().default('scheduled'), // scheduled, sent, failed, bounced
    openedAt: timestamp('opened_at'),
    clickedAt: timestamp('clicked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIndex: index('email_sends_org_id_idx').on(table.orgId),
    leadIdIndex: index('email_sends_lead_id_idx').on(table.leadId),
    statusIndex: index('email_sends_status_idx').on(table.status),
  })
);

/**
 * Knowledge Base Documents table - stores documents/content for AI research
 * Supports vector similarity search for retrieval-augmented generation (RAG)
 */
export const knowledgeBaseDocs = pgTable(
  'knowledge_base_docs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(), // Full document content
    contentType: text('content_type').notNull(), // document, faq, product_info, etc.
    metadata: jsonb('metadata').$type<{
      source?: string; // URL, file name, etc.
      author?: string;
      tags?: string[];
      category?: string;
    }>(),
    embedding: text('embedding'), // JSON string of vector embedding (1536 dims for OpenAI)
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIndex: index('kb_docs_org_id_idx').on(table.orgId),
    contentTypeIndex: index('kb_docs_content_type_idx').on(table.contentType),
  })
);

/**
 * Knowledge Base Chunks table - splits large documents into searchable chunks
 * Each chunk gets its own embedding for more precise semantic search
 */
export const knowledgeBaseChunks = pgTable(
  'knowledge_base_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),
    docId: uuid('doc_id').references(() => knowledgeBaseDocs.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(), // Position in document
    content: text('content').notNull(), // Chunk text (500-1000 chars)
    embedding: text('embedding'), // JSON string of vector embedding
    tokenCount: integer('token_count'), // For tracking API usage
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orgIdIndex: index('kb_chunks_org_id_idx').on(table.orgId),
    docIdIndex: index('kb_chunks_doc_id_idx').on(table.docId),
  })
);

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type NewQuizQuestion = typeof quizQuestions.$inferInsert;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type NewQuizResponse = typeof quizResponses.$inferInsert;
export type LeadScore = typeof leadScores.$inferSelect;
export type NewLeadScore = typeof leadScores.$inferInsert;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type NewEmailSequence = typeof emailSequences.$inferInsert;
export type EmailSend = typeof emailSends.$inferSelect;
export type NewEmailSend = typeof emailSends.$inferInsert;
export type KnowledgeBaseDoc = typeof knowledgeBaseDocs.$inferSelect;
export type NewKnowledgeBaseDoc = typeof knowledgeBaseDocs.$inferInsert;
export type KnowledgeBaseChunk = typeof knowledgeBaseChunks.$inferSelect;
export type NewKnowledgeBaseChunk = typeof knowledgeBaseChunks.$inferInsert;
