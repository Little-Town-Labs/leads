import { createHandler } from '@vercel/slack-bolt';
import { slackApp, receiver } from '@/lib/slack';
import { sendEmail } from '@/lib/services';
import { db } from '@/db';
import { workflows, leads } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Only set up event handlers if Slack is initialized
if (slackApp && receiver) {
  slackApp.event('app_mention', async ({ event, client, logger }) => {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: `Hello <@${event.user}>!`
    });
  });

  slackApp.action(
    'lead_approved',
    async ({ body, action, ack, client, logger }) => {
      await ack();

      // Get workflow ID from button value
      const workflowId = (action as any).value;

      if (!workflowId) {
        logger.error('No workflow ID provided in button action');
        return;
      }

      // Update workflow status in database
      await db.update(workflows).set({
        status: 'completed',
        approvedBy: body.user.id,
        completedAt: new Date(),
      }).where(eq(workflows.id, workflowId));

      // Get workflow to find associated lead
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId),
      });

      if (workflow?.leadId) {
        // Update lead status
        await db.update(leads).set({
          status: 'approved',
          updatedAt: new Date(),
        }).where(eq(leads.id, workflow.leadId));

        // Get lead details to send email
        const lead = await db.query.leads.findFirst({
          where: eq(leads.id, workflow.leadId),
        });

        // Send email to the lead
        if (lead && workflow.emailDraft) {
          await sendEmail(workflow.emailDraft);
        }
      }

      // Update Slack message
      const channelId = (body as any).channel?.id;
      const messageTs = (body as any).message?.ts;

      if (channelId && messageTs) {
        await client.chat.update({
          channel: channelId,
          ts: messageTs,
          text: '✅ Lead approved',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Lead approved* by <@${body.user.id}>`,
              },
            },
          ],
        });
      }
    }
  );

  slackApp.action(
    'lead_rejected',
    async ({ body, action, ack, client, logger }) => {
      await ack();

      // Get workflow ID from button value
      const workflowId = (action as any).value;

      if (!workflowId) {
        logger.error('No workflow ID provided in button action');
        return;
      }

      // Update workflow status in database
      await db.update(workflows).set({
        status: 'completed',
        rejectedBy: body.user.id,
        completedAt: new Date(),
      }).where(eq(workflows.id, workflowId));

      // Get workflow to find associated lead
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId),
      });

      if (workflow?.leadId) {
        // Update lead status
        await db.update(leads).set({
          status: 'rejected',
          updatedAt: new Date(),
        }).where(eq(leads.id, workflow.leadId));
      }

      // Update Slack message
      const channelId = (body as any).channel?.id;
      const messageTs = (body as any).message?.ts;

      if (channelId && messageTs) {
        await client.chat.update({
          channel: channelId,
          ts: messageTs,
          text: '❌ Lead rejected',
          blocks: [
            {
              type: 'section',
            text: {
              type: 'mrkdwn',
              text: `❌ *Lead rejected* by <@${body.user.id}>`,
            },
          },
        ],
        });
      }
    }
  );
}

export const POST =
  slackApp && receiver
    ? createHandler(slackApp, receiver)
    : () =>
        new Response('Slack credentials not configured', {
          status: 503
        });
