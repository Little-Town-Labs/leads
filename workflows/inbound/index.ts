import { type Lead } from '@/db/schema';
import {
  stepCreateWorkflow,
  stepHumanFeedback,
  stepQualify,
  stepResearch,
  stepSaveQualification,
  stepSaveWorkflowData,
  stepWriteEmail,
  stepFinalizeWorkflow
} from './steps';

/**
 * Extended Lead type with tenant context
 */
export type LeadWithTenant = Lead & {
  tenantId?: string;
  tenantSettings?: {
    enableAiResearch: boolean;
    qualificationThreshold: number;
    quizCompletionRedirect?: string;
    emailFromName?: string;
    emailFromAddress?: string;
  };
};

/**
 * workflow to handle the inbound lead
 * - create workflow record
 * - research the lead
 * - qualify the lead
 * - save qualification to database
 * - if the lead is qualified or follow up:
 *   - write an email for the lead
 *   - save workflow data
 *   - get human feedback for the email
 * - finalize workflow status
 * - if the lead is not qualified or follow up:
 *   - take other actions here based on other qualification categories
 *
 * Now supports tenant-aware processing:
 * - Uses tenant settings to determine AI research behavior
 * - Respects qualification thresholds
 * - Can customize email sender information
 */
export const workflowInbound = async (lead: Lead | LeadWithTenant) => {
  'use workflow';

  try {
    // Create workflow record in database
    const workflow = await stepCreateWorkflow(lead);

    // Research the lead
    const research = await stepResearch(lead);

    // Qualify the lead
    const qualification = await stepQualify(lead, research);

    // Save qualification to lead record
    await stepSaveQualification(lead.id, qualification);

    // If qualified or follow-up, generate email and request approval
    if (
      qualification.category === 'QUALIFIED' ||
      qualification.category === 'FOLLOW_UP'
    ) {
      const email = await stepWriteEmail(research, qualification);

      // Save research results and email to workflow
      await stepSaveWorkflowData(workflow.id, research, email);

      // Request human feedback via Slack
      await stepHumanFeedback(lead, research, email, qualification, workflow.id);
    }

    // Finalize workflow as completed
    await stepFinalizeWorkflow(workflow.id, 'completed');
  } catch (error) {
    console.error('Workflow error:', error);
    // Note: We can't easily access workflow.id here if stepCreateWorkflow failed
    // You may want to add error handling logic
    throw error;
  }

  // take other actions here based on other qualification categories
};
