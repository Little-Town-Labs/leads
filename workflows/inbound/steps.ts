import {
  humanFeedback,
  qualify,
  researchAgent,
  writeEmail
} from '@/lib/services';
import { QualificationSchema } from '@/lib/types';
import { db } from '@/db';
import { workflows, leads, type Lead, type Workflow } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * step to create a workflow record in the database
 */
export const stepCreateWorkflow = async (lead: Lead): Promise<Workflow> => {
  'use step';

  const [workflow] = await db.insert(workflows).values({
    orgId: lead.orgId,
    leadId: lead.id,
    status: 'running',
  }).returning();

  return workflow;
};

/**
 * step to research the lead
 */
export const stepResearch = async (lead: Lead) => {
  'use step';

  const { text: research } = await researchAgent.generate({
    prompt: `Research the lead: ${JSON.stringify({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      message: lead.message
    })}`
  });

  return research;
};

/**
 * step to qualify the lead
 */
export const stepQualify = async (lead: Lead, research: string) => {
  'use step';

  const qualification = await qualify({
    name: lead.name,
    email: lead.email,
    company: lead.company || '',
    phone: lead.phone || '',
    message: lead.message
  }, research);

  return qualification;
};

/**
 * step to save qualification results to the lead
 */
export const stepSaveQualification = async (
  leadId: string,
  qualification: QualificationSchema
) => {
  'use step';

  await db.update(leads).set({
    qualificationCategory: qualification.category,
    qualificationReason: qualification.reason,
    updatedAt: new Date(),
  }).where(eq(leads.id, leadId));
};

/**
 * step to write an email for the lead
 */
export const stepWriteEmail = async (
  research: string,
  qualification: QualificationSchema
) => {
  'use step';

  const email = await writeEmail(research, qualification);
  return email;
};

/**
 * step to save workflow data (research results and email draft)
 */
export const stepSaveWorkflowData = async (
  workflowId: string,
  research: string,
  email: string
) => {
  'use step';

  await db.update(workflows).set({
    researchResults: { research },
    emailDraft: email,
  }).where(eq(workflows.id, workflowId));
};

/**
 * step to get human feedback for the email
 */
export const stepHumanFeedback = async (
  lead: Lead,
  research: string,
  email: string,
  qualification: QualificationSchema,
  workflowId: string
) => {
  'use step';

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
    console.warn(
      '⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping human feedback step'
    );
    return;
  }

  const slackMessage = await humanFeedback(research, email, qualification, workflowId);
  return slackMessage;
};

/**
 * step to finalize workflow status
 */
export const stepFinalizeWorkflow = async (
  workflowId: string,
  status: 'completed' | 'failed'
) => {
  'use step';

  await db.update(workflows).set({
    status,
    completedAt: new Date(),
  }).where(eq(workflows.id, workflowId));
};
