# SaaS Customer Acquisition Flow: "Try Before You Buy"

> **Note on URLs**: This document uses `leadagent.com` as an example domain for clarity. The actual production URL is `leads.littletownlabs.site`. The application is **fully dynamic** and works with any domain without code changes. See [URL_CONFIGURATION.md](./URL_CONFIGURATION.md) for details.

## Problem Statement

Potential SaaS customers (business owners) need to:
1. ✅ **Experience the product** before committing
2. ✅ **Understand the value** of AI-powered lead qualification
3. ✅ **See themselves** using the platform
4. ✅ **Justify the investment** to decision-makers

Without a hands-on demo, conversion rates suffer.

---

## Solution: Main Tenant Demo Assessment

### URL Structure

```
leadagent.com/                     → SaaS landing page
leadagent.com/assessment           → Demo assessment (try it yourself)
leadagent.com/assessment/results   → See demo results
leadagent.com/sign-up              → Convert: Create your tenant

vs.

acme.leadagent.com/quiz            → Tenant's production quiz
```

---

## Flow 1: Main Tenant Demo Experience

### User Journey: "Sarah Wants to Try Lead Agent"

```
┌─────────────────────────────────────────────────────────────┐
│ Sarah (Potential Customer) searches:                        │
│ "AI lead qualification software"                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Lands on: leadagent.com                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Stop Wasting 70% of Your Sales Time                     │ │
│ │ on Unqualified Leads                                    │ │
│ │                                                         │ │
│ │ [Try Demo Assessment] [View Dashboard Demo] [Sign Up]  │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Clicks "Try Demo Assessment"                                │
│ → leadagent.com/assessment                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Demo Assessment Landing Page                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🎯 Experience Lead Agent Yourself                       │ │
│ │                                                         │ │
│ │ Take our 5-minute assessment to see how AI-powered     │ │
│ │ lead qualification works. We'll analyze YOUR business  │ │
│ │ needs and show you personalized results.               │ │
│ │                                                         │ │
│ │ What you'll see:                                        │ │
│ │ ✓ Multi-step assessment with smart scoring             │ │
│ │ ✓ Instant readiness analysis                           │ │
│ │ ✓ Personalized recommendations                         │ │
│ │ ✓ Example of what YOUR customers will experience      │ │
│ │                                                         │ │
│ │ [Start Demo Assessment →]                               │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Multi-Step Demo Quiz: leadagent.com/assessment/quiz        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Question 1/12: Let's start with your information       │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Name: [Sarah Johnson]                               │ │ │
│ │ │ Email: [sarah@example.com]                          │ │ │
│ │ │ Company: [Example Corp]                             │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │ [Next →]                                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Questions designed for SaaS customer assessment:            │
│ - Company size                                              │
│ - Current lead volume                                       │
│ - Sales team size                                           │
│ - CRM in use                                                │
│ - Lead qualification challenges                             │
│ - Budget range                                              │
│ - Implementation timeline                                   │
│ - Pain points (wasting time, low conversion, etc.)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Submit → Calculate "Product Fit Score"                      │
│ - Score: 0-100%                                             │
│ - Tier: "Great Fit" / "Good Fit" / "Needs More Volume"     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Results Page: leadagent.com/assessment/results              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✨ Sarah, Lead Agent is a Great Fit for Example Corp!  │ │
│ │                                                         │ │
│ │ Your Product Fit Score: 87%                            │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ████████████████████░░░░ 87%                        │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ Based on your responses:                                │ │
│ │ ✓ Lead volume: 150/month → Perfect for Lead Agent     │ │
│ │ ✓ Sales team: 5 members → Collaboration features help │ │
│ │ ✓ Pain point: Manual research → AI saves 15 hrs/week  │ │
│ │                                                         │ │
│ │ Estimated ROI:                                          │ │
│ │ - Time saved: 60 hours/month                           │ │
│ │ - Cost: $599/month (Professional plan)                 │ │
│ │ - Break-even: Qualify 1 additional lead/month          │ │
│ │                                                         │ │
│ │ 🎯 This is what YOUR customers will experience:        │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ [Preview: Your Branded Landing Page]                │ │ │
│ │ │ [Preview: Your Custom Quiz]                         │ │ │
│ │ │ [Preview: AI Research Report]                       │ │ │
│ │ │ [Preview: Generated Email]                          │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ Ready to get started?                                   │ │
│ │ [Create Your Account - Start Free Trial]               │ │
│ │                                                         │ │
│ │ or                                                      │ │
│ │                                                         │ │
│ │ [Schedule a Demo Call] [See Pricing]                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│ Sign Up          │    │ Schedule Demo    │
│ → Create Tenant  │    │ → Sales Call     │
└──────────────────┘    └──────────────────┘
```

---

## Key Differences: Main vs Sub-Tenant Assessments

| Aspect | Main Tenant Assessment | Sub-Tenant Assessment |
|--------|------------------------|----------------------|
| **URL** | leadagent.com/assessment | acme.leadagent.com/quiz |
| **Purpose** | SaaS customer acquisition | Lead qualification for tenant |
| **Who Takes It** | Potential SaaS customers | Tenant's end customers |
| **Questions** | About their business, lead volume, pain points | About the prospect's needs for tenant's product |
| **Scoring** | "Product Fit Score" (0-100%) | "Readiness Score" (0-100%) |
| **Tiers** | Great Fit, Good Fit, Not Ready | Qualified, Hot, Warm, Cold |
| **Result CTA** | "Sign Up" or "Schedule Demo" | "We'll contact you soon" |
| **Backend Action** | Email to sales team, CRM entry | AI research → personalized email |
| **Branding** | Lead Agent branding | Tenant's custom branding |
| **Database** | Stored as `leads` for org: "lead-agent-demo" | Stored as `leads` for org: tenant's orgId |

---

## Implementation: Two Separate Quiz Configurations

### Database: Same Schema, Different Context

```sql
-- Main tenant demo quiz
INSERT INTO quiz_questions (org_id, question_text) VALUES
('demo-org-id', 'How many leads does your sales team receive per month?'),
('demo-org-id', 'What is your biggest lead qualification challenge?'),
...

-- Acme's production quiz (tenant-specific)
INSERT INTO quiz_questions (org_id, question_text) VALUES
('org_acme', 'What help desk software do you currently use?'),
('org_acme', 'How many support tickets do you receive per month?'),
...
```

### Route Structure

```
app/
├── assessment/                      # Main tenant demo
│   ├── page.tsx                     # Demo landing page
│   ├── quiz/page.tsx                # Demo quiz
│   └── results/[leadId]/page.tsx    # Demo results with CTA
│
└── [tenant]/                        # Sub-tenant production
    ├── page.tsx                     # Tenant landing page
    ├── quiz/page.tsx                # Tenant quiz
    └── results/page.tsx             # Tenant results
```

---

## Flow 2: What Happens After Demo?

### Scenario A: Sarah Signs Up Immediately

```
Demo Results Page
    ↓
Click "Create Your Account"
    ↓
leadagent.com/sign-up
    ↓
Create Clerk account
    ↓
Create organization "Example Corp"
    ↓
Assign subdomain: example.leadagent.com
    ↓
Onboarding wizard:
    1. Upload logo
    2. Choose colors
    3. Customize landing page
    4. Configure quiz questions
    ↓
Share example.leadagent.com with customers
```

### Scenario B: Sarah Wants to Learn More

```
Demo Results Page
    ↓
Click "Schedule Demo Call"
    ↓
Calendly integration
    ↓
Book 30-min call with sales
    ↓
(Meanwhile) Email nurture sequence:
    - Day 0: Demo results summary
    - Day 2: Case study
    - Day 5: ROI calculator
    - Day 7: Special offer
```

### Scenario C: Sarah Isn't Ready

```
Demo Results Page (Low Score: 35%)
    ↓
"Lead Agent works best for teams with 50+ leads/month"
    ↓
CTA: "Get Free Lead Generation Guide"
    ↓
Add to nurture sequence (cold tier)
    ↓
Re-engage in 90 days with growth resources
```

---

## Marketing Funnel Integration

### Entry Points to Demo Assessment

1. **Homepage Hero CTA**
   ```jsx
   <Link href="/assessment">
     <Button>Try Demo Assessment</Button>
   </Link>
   ```

2. **Pricing Page**
   ```
   "Not sure which plan? Take our 5-minute assessment"
   → /assessment
   ```

3. **Blog/Content**
   ```
   "Want to see if AI lead qualification is right for you?"
   → /assessment
   ```

4. **Ad Campaigns**
   ```
   PPC → Landing page → "Experience it yourself" → /assessment
   ```

5. **Email Campaigns**
   ```
   Drip sequence → "Try our demo" CTA → /assessment
   ```

---

## Technical Implementation Notes

### 1. Create Demo Organization in Database

```sql
-- Seed script: db/seed-demo-org.ts
INSERT INTO tenants (clerk_org_id, subdomain, name) VALUES
('org_demo', 'demo', 'Lead Agent Demo');

-- Add demo quiz questions
INSERT INTO quiz_questions (org_id, question_number, question_text) VALUES
('org_demo', 1, 'What is your role in the company?'),
('org_demo', 2, 'How many leads does your team receive per month?'),
...
```

### 2. Route Handlers

```typescript
// app/assessment/quiz/page.tsx
export default async function DemoQuizPage() {
  const DEMO_ORG_ID = 'org_demo'; // Hardcoded for main demo
  const questions = await getQuizQuestions(DEMO_ORG_ID);

  return <QuizForm questions={questions} isDemoMode={true} />;
}

// app/api/assessment/demo-submit/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  // Store lead with demo org
  const lead = await createLead({
    ...data,
    orgId: 'org_demo',
    source: 'demo-assessment'
  });

  // Calculate fit score (different algorithm than tenant scoring)
  const fitScore = calculateProductFitScore(data);

  // Trigger sales team notification (not AI workflow)
  await notifySalesTeam(lead, fitScore);

  return { success: true, leadId: lead.id, fitScore };
}
```

### 3. Results Page with Conversion Focus

```tsx
// app/assessment/results/[leadId]/page.tsx
export default async function DemoResultsPage({ params }) {
  const lead = await getLeadById(params.leadId);
  const fitScore = calculateProductFitScore(lead.responses);

  return (
    <div>
      <h1>Your Product Fit Score: {fitScore}%</h1>

      {/* Tier-specific CTAs */}
      {fitScore >= 70 && (
        <div>
          <h2>Lead Agent is a great fit! 🎉</h2>
          <Button href="/sign-up">Start Free Trial</Button>
          <Button href="/schedule-demo">Schedule Demo</Button>
        </div>
      )}

      {/* Show preview of what they'll build */}
      <PreviewSection>
        <h3>This is what YOUR customers will experience:</h3>
        <MockTenantPreview lead={lead} />
      </PreviewSection>

      {/* ROI Calculator based on their data */}
      <ROICalculator leadVolume={lead.leadVolume} />
    </div>
  );
}
```

---

## Metrics to Track

### Demo Assessment Performance

```
1. Conversion Funnel:
   - Homepage visits
   - /assessment visits (CTR)
   - Quiz starts
   - Quiz completions
   - Sign-ups from demo (conversion rate)

2. Product Fit Distribution:
   - Great Fit (70-100%): X%
   - Good Fit (40-69%): Y%
   - Not Ready (<40%): Z%

3. Time to Conversion:
   - Immediate (same session)
   - Within 24 hours
   - Within 7 days
   - Within 30 days

4. Demo → Paid Conversion:
   - Trial starts from demo
   - Paid subscriptions from demo
```

---

## Content Strategy: Demo Assessment Questions

### Focus on Qualification + Education

```
Q1: What is your role?
→ [CEO/Founder] [Sales Leader] [Marketing] [Operations]
Why: Identify decision-maker vs influencer

Q2: How many leads does your team receive per month?
→ [<50] [50-200] [200-500] [500+]
Why: Qualify lead volume (product fit)

Q3: What percentage of leads are qualified?
→ [<20%] [20-40%] [40-60%] [60%+]
Why: Show pain point (low qualification rate)

Q4: How much time does your team spend researching leads?
→ [<5 hrs/week] [5-15 hrs] [15-30 hrs] [30+ hrs]
Why: Calculate time savings ROI

Q5: What tools do you use for lead management?
→ [Spreadsheets] [CRM only] [CRM + other tools] [Full stack]
Why: Understand sophistication

Q6: What's your biggest lead qualification challenge?
→ [Manual research] [Low conversion] [Team capacity] [No process]
Why: Match pain point to solution

Q7: What's your average deal size?
→ [<$5K] [$5K-$20K] [$20K-$100K] [$100K+]
Why: Calculate ROI (qualify one more lead = $X)

Q8: What's your timeline to implement a solution?
→ [ASAP] [1-3 months] [3-6 months] [Just exploring]
Why: Sales qualification

Q9: What's your monthly budget for sales tools?
→ [<$500] [$500-$2K] [$2K-$5K] [$5K+]
Why: Pricing tier fit

Q10: What would make you sign up today?
→ [See ROI proof] [Try it free] [Team approval] [Budget approved]
Why: Understand objections
```

---

## Summary: Two Assessment Flows

### Main Tenant (Demo) Flow

**Purpose**: Convert prospects to SaaS customers
- **URL**: leadagent.com/assessment
- **Who**: Potential customers (business owners)
- **Outcome**: Sign up for Lead Agent
- **CTA**: "Start Free Trial" / "Schedule Demo"
- **Backend**: Notify sales team, add to CRM

### Sub-Tenant (Production) Flow

**Purpose**: Qualify leads for tenant's business
- **URL**: acme.leadagent.com/quiz
- **Who**: Tenant's end customers
- **Outcome**: Generate qualified leads for tenant
- **CTA**: "We'll contact you soon"
- **Backend**: AI research → personalized email

Both use the same quiz infrastructure, but with different:
- Questions (product fit vs lead qualification)
- Scoring algorithms (fit score vs readiness score)
- Results pages (conversion-focused vs informational)
- Follow-up actions (sales team vs AI workflow)

This dual-purpose system maximizes the value of your quiz engine! 🎯
