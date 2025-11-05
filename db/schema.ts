import { pgTable, text, uuid, timestamp, jsonb, index, integer, boolean } from 'drizzle-orm/pg-core';

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

// Type exports for TypeScript
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
