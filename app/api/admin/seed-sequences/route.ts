import { NextResponse } from 'next/server';
import { db } from '@/db';
import { emailSequences } from '@/db/schema';

const DEFAULT_ORG_ID = 'default';

const EMAIL_SEQUENCES = [
  // COLD LEAD NURTURE SEQUENCE
  {
    orgId: DEFAULT_ORG_ID,
    tier: 'cold',
    sequenceNumber: 1,
    delayDays: 0,
    subject: 'Thanks for Your Help Desk Assessment - Building Your Foundation',
    body: `Hi {{name}},

Thank you for completing the Help Desk Health Assessment for {{company}}!

Your assessment shows you're in the early stages of help desk optimization. That's perfectly fine - every great help desk started somewhere!

**Your Next Steps:**

1. **Build Data History**: Our DDIP (Data-Driven Insights Platform) works best with 12-18 months of ticket data. Focus on collecting comprehensive data now.

2. **Establish Best Practices**: We've attached a guide on help desk ticketing fundamentals and key metrics to track.

3. **Prepare for Data-Driven Analysis**: Once you have solid data history, DDIP can identify hidden patterns and improvement opportunities you'd never spot manually.

**Free Resource Included:**
📋 Help Desk Best Practices Checklist
📊 Essential Metrics Guide

We'll check back in a few months to see how you're progressing. In the meantime, feel free to reach out with any questions.

Best regards,
Timeless Technology Solutions
https://timelesstechs.com/#contact`,
    isActive: true,
  },
  {
    orgId: DEFAULT_ORG_ID,
    tier: 'cold',
    sequenceNumber: 2,
    delayDays: 30,
    subject: 'Help Desk Metrics: What to Track & Why',
    body: `Hi {{name}},

Hope your help desk at {{company}} is growing!

We wanted to share some insights on the metrics that matter most when you're building your help desk foundation:

**Core Metrics to Track:**
- First Response Time (FRT)
- Resolution Time
- Ticket Volume by Category
- Customer Satisfaction (CSAT)
- Repeat Ticket Rate

**Why These Matter:**
Once you have 12+ months of this data, DDIP can analyze trends and reveal:
- Which categories generate the most tickets (and why)
- Root causes of recurring issues
- Opportunities for process improvements
- Potential cost savings from automation

**Quick Question:** How many months of ticket data do you currently have? Reply to this email and let us know where you're at.

Best,
Timeless Technology Solutions`,
    isActive: true,
  },
  {
    orgId: DEFAULT_ORG_ID,
    tier: 'cold',
    sequenceNumber: 3,
    delayDays: 90,
    subject: 'Ready to Revisit Your Help Desk Assessment?',
    body: `Hi {{name}},

It's been a few months since you completed our Help Desk Health Assessment.

If you've been building your ticket data history and establishing best practices, you might be ready for a deeper analysis now.

**Has Anything Changed?**
- Do you now have 12+ months of ticket data?
- Has your ticket volume increased?
- Are you tracking metrics consistently?
- Do you have budget allocated for help desk improvement?

If yes to 2 or more, **retake the assessment** to see if you're ready for DDIP:
👉 https://timelesstechs.com/assessment

Or simply reply to schedule a quick 15-minute call to discuss where you're at.

Best regards,
Timeless Technology Solutions`,
    isActive: true,
  },

  // WARM LEAD NURTURE SEQUENCE
  {
    orgId: DEFAULT_ORG_ID,
    tier: 'warm',
    sequenceNumber: 1,
    delayDays: 0,
    subject: 'Your Help Desk Assessment Results - Next Steps for {{company}}',
    body: `Hi {{name}},

Thank you for completing the Help Desk Health Assessment! Your score of {{score}}% shows that {{company}} has potential for significant improvement through data-driven insights.

**What Your Score Means:**
Your help desk shows promise, but timing or readiness may need development. You're in good company - many organizations at this stage see 20-30% efficiency gains once they implement DDIP.

**Resources We're Sending You:**

📊 **Case Study**: How a similar-sized help desk reduced ticket volume by 28% using DDIP
🎯 **Guide**: "5 Hidden Patterns in Your Help Desk Data"
📈 **Webinar Invite**: Live DDIP demonstration (next session in 2 weeks)

**Common Questions We Get:**

Q: "What makes DDIP different from regular reporting?"
A: DDIP identifies ROOT CAUSES, not just symptoms. It connects data points across your entire operation to reveal why issues happen.

Q: "How much data do we need?"
A: Ideally 12-18 months of ticket history for meaningful pattern analysis.

Want to discuss your specific situation? **Book a 20-minute call** here:
👉 https://timelesstechs.com/#contact

Best regards,
Timeless Technology Solutions`,
    isActive: true,
  },
  {
    orgId: DEFAULT_ORG_ID,
    tier: 'warm',
    sequenceNumber: 2,
    delayDays: 7,
    subject: 'Case Study: 28% Ticket Reduction Using DDIP',
    body: `Hi {{name}},

Following up on your help desk assessment - I wanted to share a relevant case study.

**The Challenge:**
A mid-sized SaaS company (similar to {{company}}) had 800+ tickets/month but couldn't identify why certain issues kept recurring.

**What DDIP Discovered:**
- 31% of tickets were actually related to ONE root cause (unclear onboarding documentation)
- 18% of "different" issues all traced back to a single software configuration
- Peak ticket times correlated with specific product features

**The Results:**
- 28% reduction in monthly tickets within 90 days
- 40% faster resolution times
- $47K annual savings in support costs

**Could This Work for You?**

Based on your assessment, you might see similar patterns in your data. The key is having the right analysis approach.

**FREE Workshop Invitation:**
Join our next "DDIP Demonstration" webinar to see live analysis of help desk data.
📅 Next session: [Date TBD]
🔗 Register here: [Link]

No pressure - just sharing resources that might help {{company}} improve efficiency.

Best,
Timeless Technology Solutions`,
    isActive: true,
  },
  {
    orgId: DEFAULT_ORG_ID,
    tier: 'warm',
    sequenceNumber: 3,
    delayDays: 21,
    subject: '5 Hidden Patterns in Your Help Desk Data',
    body: `Hi {{name}},

Most help desks track metrics like "tickets per day" or "average resolution time," but the real insights are hiding in the patterns between data points.

**5 Patterns DDIP Commonly Finds:**

1. **The Onboarding Spike**: New user tickets cluster around specific features (fixable with better documentation)

2. **The Silent Killer**: Low-priority tickets that consume 40% of team time when aggregated

3. **The Hidden Dependency**: Tickets in one category actually caused by issues in another department

4. **The Time Bomb**: Gradually increasing ticket types that signal bigger problems coming

5. **The Knowledge Gap**: Same questions from different customers (opportunity for self-service)

**Your Help Desk at {{company}}:**
Based on your {{score}}% assessment score, you likely have at least 2-3 of these patterns happening right now.

**Want to Find Out Which Ones?**

We can run a quick preliminary analysis on a sample of your ticket data (completely confidential). Takes about 30 minutes.

Interested? **Reply to this email** or book time here:
👉 https://timelesstechs.com/#contact

Best regards,
Timeless Technology Solutions`,
    isActive: true,
  },
  {
    orgId: DEFAULT_ORG_ID,
    tier: 'warm',
    sequenceNumber: 4,
    delayDays: 45,
    subject: 'Still Thinking About Help Desk Optimization?',
    body: `Hi {{name}},

Just checking in - I know help desk improvement might not be top priority right now for {{company}}.

**No worries if timing isn't right yet.** But I wanted to leave you with one thought:

Every month you wait to implement data-driven insights is another month of:
- Repeated issues that could be prevented
- Team time spent on symptoms instead of root causes
- Hidden costs you don't even know exist yet

**When You're Ready:**

✅ Retake the assessment if circumstances have changed
✅ Book a strategy call to discuss timing
✅ Join our email list for ongoing tips (no spam, promise)

Or simply **reply "not now"** and I'll check back in 6 months.

Thanks for your time,
Timeless Technology Solutions

P.S. - Quick question: What would need to change for help desk optimization to become a priority? Budget? Team size? Management buy-in? Your answer helps us serve you better.`,
    isActive: true,
  },
];

/**
 * POST /api/admin/seed-sequences
 * Seeds email nurture sequences (admin only endpoint)
 */
export async function POST() {
  try {
    // Insert sequences (on conflict do nothing)
    const results = await db.insert(emailSequences).values(EMAIL_SEQUENCES).onConflictDoNothing();

    return NextResponse.json({
      success: true,
      message: 'Email sequences seeded successfully',
      count: EMAIL_SEQUENCES.length,
      sequences: {
        cold: 3,
        warm: 4,
      },
    });
  } catch (error) {
    console.error('Error seeding email sequences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to seed email sequences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/seed-sequences
 * Returns current email sequences
 */
export async function GET() {
  try {
    const sequences = await db.query.emailSequences.findMany({
      where: (emailSequences, { eq }) => eq(emailSequences.orgId, DEFAULT_ORG_ID),
      orderBy: (emailSequences, { asc }) => [
        asc(emailSequences.tier),
        asc(emailSequences.sequenceNumber),
      ],
    });

    return NextResponse.json({
      success: true,
      sequences,
      count: sequences.length,
    });
  } catch (error) {
    console.error('Error fetching email sequences:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch email sequences',
      },
      { status: 500 }
    );
  }
}
