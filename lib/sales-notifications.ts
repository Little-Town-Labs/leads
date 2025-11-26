interface SalesNotificationData {
  lead: {
    id: string;
    name: string;
    email: string;
    company: string | null;
  };
  fitScore: number;
  tier: string;
}

export async function notifySalesTeam(data: SalesNotificationData) {
  const { lead, fitScore, tier } = data;

  // Send email to sales team
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'Lead Agent <notifications@leads.littletownlabs.site>',
      to: ['sales@timelesstechs.com'], // Update with actual sales email
      subject: `🎯 New Demo Lead: ${lead.name} (${fitScore}% fit)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #10B981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #6b7280; }
            .value { color: #111827; }
            .score { font-size: 32px; font-weight: bold; color: #3B82F6; }
            .tier { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .tier-great { background: #D1FAE5; color: #065F46; }
            .tier-good { background: #FEF3C7; color: #92400E; }
            .tier-early { background: #F3F4F6; color: #374151; }
            .cta { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🎯 New Demo Assessment Completed</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="score">${fitScore}% Product Fit</div>
                <span class="tier tier-${tier === 'great-fit' ? 'great' : tier === 'good-fit' ? 'good' : 'early'}">
                  ${tier === 'great-fit' ? 'GREAT FIT ⭐' : tier === 'good-fit' ? 'GOOD FIT' : 'EARLY STAGE'}
                </span>
              </div>

              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${lead.name}</div>
              </div>

              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${lead.email}">${lead.email}</a></div>
              </div>

              <div class="field">
                <div class="label">Company:</div>
                <div class="value">${lead.company || 'Not provided'}</div>
              </div>

              <div class="field">
                <div class="label">Tier:</div>
                <div class="value">${tier}</div>
              </div>

              <a href="https://leads.littletownlabs.site/leads/${lead.id}" class="cta">View Full Details in Dashboard</a>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                This lead completed the demo assessment on the main landing page. 
                ${tier === 'great-fit' ? '🔥 High priority - reach out ASAP!' : tier === 'good-fit' ? 'Good potential - schedule a discovery call.' : 'Early stage - send resources and nurture.'}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Sales notification sent for demo lead: ${lead.id}`);
  } catch (error) {
    console.error('❌ Failed to send sales notification:', error);
    // Don't throw - notification failure shouldn't break submission
  }
}
