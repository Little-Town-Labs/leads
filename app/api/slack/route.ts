import { createHandler } from '@vercel/slack-bolt';
import { slackApp, receiver } from '@/lib/slack';
import { sendEmail } from '@/lib/services';
import { db } from '@/db';
import { workflows, leads } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Only set up event handlers if Slack is initialized
if (slackApp && receiver) {
  slackApp.event('app_mention', async ({ event, client }) => {
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
      const actionValue = 'value' in action ? (action as unknown as { value: string }).value : undefined;

      if (!actionValue) {
        logger.error('No workflow ID provided in button action');
        return;
      }

      // Update workflow status in database
      await db.update(workflows).set({
        status: 'completed',
        approvedBy: body.user.id,
        completedAt: new Date(),
      }).where(eq(workflows.id, actionValue));

      // Get workflow to find associated lead
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, actionValue),
      });

      if (workflow?.leadId) {
        // Update lead status
        await db.update(leads).set({
          status: 'approved',
          updatedAt: new Date(),
        }).where(eq(leads.id, workflow.leadId as string));

        // Get lead details to send email
        const lead = await db.query.leads.findFirst({
          where: eq(leads.id, workflow.leadId as string),
        });

        // Send email to the lead
        if (lead && workflow.emailDraft) {
          await sendEmail(
            lead.email,
            `Re: Your inquiry from ${lead.company || 'your company'}`,
            workflow.emailDraft
          );
        }
      }

      // Update Slack message
      const bodyRecord = body as unknown as { channel?: { id?: string }; message?: { ts?: string } };
      const channelId = bodyRecord?.channel?.id;
      const messageTs = bodyRecord?.message?.ts;

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
      const actionValue = 'value' in action ? (action as unknown as { value: string }).value : undefined;

      if (!actionValue) {
        logger.error('No workflow ID provided in button action');
        return;
      }

      // Update workflow status in database
      await db.update(workflows).set({
        status: 'completed',
        rejectedBy: body.user.id,
        completedAt: new Date(),
      }).where(eq(workflows.id, actionValue));

      // Get workflow to find associated lead
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, actionValue),
      });

      if (workflow?.leadId) {
        // Update lead status
        await db.update(leads).set({
          status: 'rejected',
          updatedAt: new Date(),
        }).where(eq(leads.id, workflow.leadId as string));
      }

      // Update Slack message
      const bodyRecord = body as unknown as { channel?: { id?: string }; message?: { ts?: string } };
      const channelId = bodyRecord?.channel?.id;
      const messageTs = bodyRecord?.message?.ts;

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
