# Implementation Plan: Demo Assessment for SaaS Customer Acquisition

## Current State Analysis

### ✅ Already Working
- [x] Multi-tenant infrastructure with Clerk
- [x] Subdomain routing via middleware
- [x] Tenant-specific quizzes (`[tenant]/quiz`)
- [x] Quiz components and question types
- [x] Database schema for leads and scores
- [x] Main SaaS landing page
- [x] Dashboard for managing leads
- [x] AI workflow for qualified leads

### ❌ Missing for Demo Assessment
- [ ] Demo organization in database
- [ ] Demo quiz questions (product fit focused)
- [ ] `/assessment` landing page
- [ ] `/assessment/quiz` demo quiz page
- [ ] `/assessment/results/[leadId]` conversion page
- [ ] Demo submission API handler
- [ ] Product fit scoring algorithm
- [ ] Sales team notification system
- [ ] Marketing CTAs on main page

---

## Implementation Plan

### Phase 1: Foundation (Database & Configuration) ⭐️ START HERE

**Estimated Time**: 1-2 hours

#### Task 1.1: Create Demo Organization
**File**: `db/seed-demo-org.ts`

```typescript
// Create new seed script
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tenants } from './schema';

dotenv.config();

const DEMO_ORG: NewTenant = {
  clerkOrgId: 'org_demo_leadagent',
  subdomain: 'demo',
  name: 'Lead Agent Demo',
  slug: 'demo',

  branding: {
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
  },

  landingPage: {
    heroTitle: 'Demo Assessment',
    heroSubtitle: 'Try our product assessment',
    ctaText: 'Start Demo',
  },

  settings: {
    enableAiResearch: false, // No AI for demo leads
    qualificationThreshold: 0,
  },

  subscriptionTier: 'enterprise',
  subscriptionStatus: 'active',

  usageLimits: {
    maxQuizCompletionsMonthly: 100000,
    maxAiWorkflowsMonthly: 0,
    maxTeamMembers: 1,
  },

  currentUsage: {
    quizCompletionsThisMonth: 0,
    aiWorkflowsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
  },
};

// Seed function...
```

**Command to run**:
```bash
pnpm tsx db/seed-demo-org.ts
```

**Acceptance Criteria**:
- ✅ Demo org exists in `tenants` table
- ✅ `clerkOrgId: 'org_demo_leadagent'`
- ✅ `subdomain: 'demo'`

---

#### Task 1.2: Create Demo Quiz Questions
**File**: `db/seed-demo-quiz.ts`

```typescript
// Questions focused on product fit, not lead qualification
const DEMO_QUIZ_QUESTIONS = [
  {
    questionNumber: 1,
    questionType: 'contact_info',
    questionText: "Let's start with your information",
    questionSubtext: "We'll use this to send your personalized results",
    isRequired: true,
    options: [
      { name: 'name', label: 'Full Name', required: true },
      { name: 'email', label: 'Work Email', required: true },
      { name: 'company', label: 'Company Name', required: true },
      { name: 'title', label: 'Job Title', required: false },
    ],
  },

  {
    questionNumber: 2,
    questionType: 'multiple_choice',
    questionText: 'How many leads does your team receive per month?',
    questionSubtext: 'This helps us understand if Lead Agent is a good fit',
    isRequired: true,
    options: [
      { value: '<50', label: 'Less than 50 leads', score: 1 },
      { value: '50-200', label: '50-200 leads', score: 3 },
      { value: '200-500', label: '200-500 leads', score: 5 },
      { value: '500+', label: 'More than 500 leads', score: 5 },
    ],
    scoringWeight: 2,
  },

  {
    questionNumber: 3,
    questionType: 'multiple_choice',
    questionText: 'How many people are on your sales team?',
    isRequired: true,
    options: [
      { value: '1-2', label: '1-2 people', score: 2 },
      { value: '3-5', label: '3-5 people', score: 4 },
      { value: '6-10', label: '6-10 people', score: 5 },
      { value: '10+', label: 'More than 10 people', score: 5 },
    ],
    scoringWeight: 1,
  },

  {
    questionNumber: 4,
    questionType: 'multiple_choice',
    questionText: "What's your biggest lead qualification challenge?",
    questionSubtext: 'Select the one that impacts you most',
    isRequired: true,
    options: [
      { value: 'manual_research', label: 'Manual research takes too long', score: 5 },
      { value: 'low_conversion', label: 'Low conversion from leads to deals', score: 4 },
      { value: 'team_capacity', label: "Team doesn't have capacity", score: 5 },
      { value: 'no_process', label: 'No consistent qualification process', score: 5 },
      { value: 'crm_issues', label: 'CRM and tool issues', score: 3 },
    ],
    scoringWeight: 3,
  },

  {
    questionNumber: 5,
    questionType: 'checkbox',
    questionText: 'What tools does your team currently use?',
    questionSubtext: 'Select all that apply',
    isRequired: true,
    minSelections: 1,
    options: [
      { value: 'crm', label: 'CRM (Salesforce, HubSpot, etc.)', score: 3 },
      { value: 'email', label: 'Email automation', score: 2 },
      { value: 'linkedin', label: 'LinkedIn Sales Navigator', score: 3 },
      { value: 'spreadsheets', label: 'Spreadsheets only', score: 1 },
      { value: 'none', label: 'No formal tools', score: 0 },
    ],
    scoringWeight: 1,
  },

  {
    questionNumber: 6,
    questionType: 'multiple_choice',
    questionText: 'How much time does your team spend researching each lead?',
    isRequired: true,
    options: [
      { value: '<5min', label: 'Less than 5 minutes', score: 2 },
      { value: '5-15min', label: '5-15 minutes', score: 3 },
      { value: '15-30min', label: '15-30 minutes', score: 5 },
      { value: '30min+', label: 'More than 30 minutes', score: 5 },
    ],
    scoringWeight: 2,
  },

  {
    questionNumber: 7,
    questionType: 'multiple_choice',
    questionText: "What's your average deal size?",
    isRequired: true,
    options: [
      { value: '<5k', label: 'Less than $5,000', score: 2 },
      { value: '5-20k', label: '$5,000 - $20,000', score: 4 },
      { value: '20-100k', label: '$20,000 - $100,000', score: 5 },
      { value: '100k+', label: 'More than $100,000', score: 5 },
    ],
    scoringWeight: 2,
  },

  {
    questionNumber: 8,
    questionType: 'multiple_choice',
    questionText: 'When are you looking to implement a solution?',
    isRequired: true,
    options: [
      { value: 'asap', label: 'As soon as possible', score: 5 },
      { value: '1-3mo', label: 'Within 1-3 months', score: 4 },
      { value: '3-6mo', label: 'Within 3-6 months', score: 3 },
      { value: 'exploring', label: 'Just exploring options', score: 1 },
    ],
    scoringWeight: 2,
  },

  {
    questionNumber: 9,
    questionType: 'multiple_choice',
    questionText: "What's your monthly budget for sales tools?",
    isRequired: true,
    options: [
      { value: '<500', label: 'Less than $500', score: 1 },
      { value: '500-2k', label: '$500 - $2,000', score: 3 },
      { value: '2k-5k', label: '$2,000 - $5,000', score: 5 },
      { value: '5k+', label: 'More than $5,000', score: 5 },
    ],
    scoringWeight: 2,
  },

  {
    questionNumber: 10,
    questionType: 'multiple_choice',
    questionText: 'What would make you sign up today?',
    questionSubtext: 'Be honest - this helps us help you better',
    isRequired: true,
    options: [
      { value: 'see_roi', label: 'Need to see clear ROI proof', score: 4 },
      { value: 'free_trial', label: 'Want to try it free first', score: 5 },
      { value: 'team_approval', label: 'Need team approval', score: 3 },
      { value: 'budget', label: 'Need budget approved', score: 2 },
      { value: 'ready', label: "I'm ready now!", score: 5 },
    ],
    scoringWeight: 2,
  },
];
```

**Command to run**:
```bash
pnpm tsx db/seed-demo-quiz.ts
```

**Acceptance Criteria**:
- ✅ 10 demo questions in `quiz_questions` table
- ✅ All linked to demo org (`orgId: 'org_demo_leadagent'`)
- ✅ Questions focus on product fit, not lead qualification

---

### Phase 2: Core Demo Routes (UI) 🎨

**Estimated Time**: 4-6 hours

#### Task 2.1: Demo Landing Page
**File**: `app/assessment/page.tsx` (replace existing)

```typescript
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Target, Bot, Sparkles, Users } from 'lucide-react';

export default function DemoAssessmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">Lead Agent</Link>
          <Link href="/sign-in">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Try Lead Agent Yourself
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Experience AI-Powered Lead Qualification{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-1">
              Firsthand
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Take our 5-minute assessment to see how Lead Agent works.
            We'll analyze YOUR business and show you exactly what your customers would experience.
          </p>

          {/* CTA Button */}
          <Link href="/assessment/quiz">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Assessment
              <Target className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground pt-8 mt-8 border-t border-border">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-chart-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-chart-4" />
              <span>Takes only 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-chart-4" />
              <span>Instant personalized results</span>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll See Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            What You'll Experience
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center border border-chart-1/20">
                  <Target className="w-6 h-6 text-chart-1" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Smart Assessment</h3>
                <p className="text-muted-foreground">
                  Answer 10 questions about your business. See how we calculate lead readiness scores.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center border border-chart-4/20">
                  <Bot className="w-6 h-6 text-chart-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Product Fit Analysis</h3>
                <p className="text-muted-foreground">
                  Get your personalized Product Fit Score and see if Lead Agent is right for you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center border border-chart-3/20">
                  <Sparkles className="w-6 h-6 text-chart-3" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">ROI Calculator</h3>
                <p className="text-muted-foreground">
                  See time saved, cost analysis, and break-even calculations based on YOUR inputs.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center border border-chart-5/20">
                  <Users className="w-6 h-6 text-chart-5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Preview Your Experience</h3>
                <p className="text-muted-foreground">
                  See mockups of what YOUR customers will experience with your branded assessments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary to-chart-1 rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to See If Lead Agent Is Right for You?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Takes 5 minutes. Get instant, personalized results.
          </p>

          <Link href="/assessment/quiz">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Assessment Now
              <Target className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="text-sm text-primary-foreground/80 mt-6">
            ✓ No credit card  •  ✓ Instant results  •  ✓ See the platform in action
          </p>
        </div>
      </section>
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Renders at `/assessment`
- ✅ Clear value proposition
- ✅ CTA links to `/assessment/quiz`
- ✅ Professional design matching brand

---

#### Task 2.2: Demo Quiz Page
**File**: `app/assessment/quiz/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuizFormWrapper } from '@/app/[tenant]/quiz/quiz-form-wrapper';
import type { QuizQuestion } from '@/db/schema';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const DEMO_ORG_ID = 'org_demo_leadagent';

export default function DemoQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDemoQuestions() {
      try {
        // Fetch demo questions - needs new API endpoint
        const res = await fetch(`/api/assessment/demo-questions`);
        const data = await res.json();

        if (data.success) {
          setQuestions(data.questions);
        } else {
          setError('Failed to load demo questions');
        }
      } catch {
        setError('Failed to load assessment');
      } finally {
        setLoading(false);
      }
    }

    fetchDemoQuestions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/assessment">
            <Button>Back to Assessment</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/assessment" className="text-xl font-bold text-primary">
            ← Lead Agent Demo
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Product Fit Assessment
          </h1>
          <p className="text-lg text-muted-foreground">
            Answer {questions.length} questions to discover if Lead Agent is right for your business.
          </p>
        </div>

        <QuizFormWrapper
          questions={questions}
          tenantSlug="demo"
          primaryColor="#3B82F6"
          isDemoMode={true}
          demoSubmitUrl="/api/assessment/demo-submit"
          resultsPath="/assessment/results"
        />
      </main>
    </div>
  );
}
```

**Dependencies**:
- Needs `QuizFormWrapper` to accept `isDemoMode` prop
- Needs new API endpoint: `/api/assessment/demo-questions`
- Needs new API endpoint: `/api/assessment/demo-submit`

**Acceptance Criteria**:
- ✅ Renders at `/assessment/quiz`
- ✅ Loads demo questions from API
- ✅ Uses existing quiz components
- ✅ Submits to demo endpoint

---

#### Task 2.3: Demo Results Page
**File**: `app/assessment/results/[leadId]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { leads, leadScores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Mail, TrendingUp, Target } from 'lucide-react';

export default async function DemoResultsPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;

  // Fetch lead and score
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

  if (!lead || lead.orgId !== 'org_demo_leadagent') {
    notFound();
  }

  const [score] = await db.select().from(leadScores).where(eq(leadScores.leadId, leadId)).limit(1);

  if (!score) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Processing your results...</p>
      </div>
    );
  }

  const fitScore = score.readinessScore;
  const tierConfig = getFitTierConfig(fitScore);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold">Lead Agent</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-chart-4/10 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-chart-4" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Assessment Complete!
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you, {lead.name}. Here's your Product Fit analysis.
            </p>
          </div>

          {/* Score Card */}
          <div className={`bg-card border-2 rounded-lg shadow-lg p-8 mb-8 ${tierConfig.borderColor}`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Circle */}
              <div className="flex-shrink-0">
                <div className="relative w-40 h-40">
                  <svg className="transform -rotate-90 w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-muted"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - fitScore / 100)}`}
                      className={tierConfig.scoreColor}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-foreground">{fitScore}%</div>
                      <div className="text-sm text-muted-foreground">Fit Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier Info */}
              <div className="flex-1 text-center md:text-left">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-3 ${tierConfig.badgeClass}`}>
                  {tierConfig.label}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {tierConfig.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {tierConfig.description}
                </p>
                <div className="text-sm text-muted-foreground">
                  Based on your responses • Score: {score.totalPoints} / {score.maxPossiblePoints} points
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculation */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Potential ROI
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Time Saved</p>
                <p className="text-2xl font-bold text-chart-4">60 hrs/mo</p>
              </div>
              <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
                <p className="text-2xl font-bold text-chart-1">$599</p>
              </div>
              <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Break-Even</p>
                <p className="text-2xl font-bold text-chart-3">1 lead/mo</p>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              What Your Customers Will Experience
            </h3>
            <p className="text-muted-foreground mb-4">
              This is what you just went through. Your customers will get the same smart,
              branded experience customized for YOUR business.
            </p>
            {/* Add preview mockups here */}
          </div>

          {/* CTA Section */}
          <div className={`rounded-lg p-8 text-center ${tierConfig.ctaBackground}`}>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              {tierConfig.ctaTitle}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {tierConfig.ctaDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {tierConfig.primaryCta && (
                <Link href={tierConfig.primaryCta.link}>
                  <Button size="lg" className="w-full sm:w-auto">
                    {tierConfig.primaryCta.icon}
                    {tierConfig.primaryCta.text}
                  </Button>
                </Link>
              )}
              {tierConfig.secondaryCta && (
                <Link href={tierConfig.secondaryCta.link}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    {tierConfig.secondaryCta.icon}
                    {tierConfig.secondaryCta.text}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getFitTierConfig(score: number) {
  if (score >= 70) {
    return {
      label: 'GREAT FIT',
      title: 'Lead Agent is Perfect for You!',
      description: 'Based on your responses, you have the volume, team size, and pain points where Lead Agent delivers maximum value.',
      borderColor: 'border-chart-4',
      scoreColor: 'text-chart-4',
      badgeClass: 'bg-chart-4/10 text-chart-4',
      ctaBackground: 'bg-chart-4/10 border border-chart-4/20',
      ctaTitle: "Let's Get Started",
      ctaDescription: 'Start your free trial today and see results within 24 hours.',
      primaryCta: {
        text: 'Start Free Trial',
        link: '/sign-up',
        icon: <CheckCircle className="w-5 h-5 mr-2" />,
      },
      secondaryCta: {
        text: 'Schedule Demo',
        link: 'https://calendly.com/your-link',
        icon: <Calendar className="w-5 h-5 mr-2" />,
      },
    };
  } else if (score >= 40) {
    return {
      label: 'GOOD FIT',
      title: 'Lead Agent Could Help',
      description: 'You have some good indicators. Let's discuss how Lead Agent can address your specific needs.',
      borderColor: 'border-chart-2',
      scoreColor: 'text-chart-2',
      badgeClass: 'bg-chart-2/10 text-chart-2',
      ctaBackground: 'bg-chart-2/10 border border-chart-2/20',
      ctaTitle: 'Learn More About Lead Agent',
      ctaDescription: 'Schedule a demo to see if we can solve your specific challenges.',
      primaryCta: {
        text: 'Schedule Demo',
        link: 'https://calendly.com/your-link',
        icon: <Calendar className="w-5 h-5 mr-2" />,
      },
      secondaryCta: {
        text: 'See Pricing',
        link: '/#pricing',
        icon: <TrendingUp className="w-5 h-5 mr-2" />,
      },
    };
  } else {
    return {
      label: 'EARLY STAGE',
      title: 'Build Your Foundation First',
      description: 'Lead Agent works best with established lead flow. We'll send resources to help you get there.',
      borderColor: 'border-muted',
      scoreColor: 'text-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      ctaBackground: 'bg-muted/30 border border-muted',
      ctaTitle: 'Stay in Touch',
      ctaDescription: 'Get free resources to grow your lead volume and qualification process.',
      primaryCta: {
        text: 'Get Free Resources',
        link: 'https://calendly.com/your-link',
        icon: <Mail className="w-5 h-5 mr-2" />,
      },
      secondaryCta: null,
    };
  }
}
```

**Acceptance Criteria**:
- ✅ Renders at `/assessment/results/[leadId]`
- ✅ Shows Product Fit Score (not Readiness Score)
- ✅ Displays ROI calculator
- ✅ Tier-specific CTAs (Sign Up, Schedule Demo, Resources)
- ✅ Preview section showing what customers see

---

### Phase 3: API Endpoints & Logic 🔌

**Estimated Time**: 3-4 hours

#### Task 3.1: Demo Questions API
**File**: `app/api/assessment/demo-questions/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizQuestions } from '@/db/schema';
import { eq } from 'drizzle-orm';

const DEMO_ORG_ID = 'org_demo_leadagent';

export async function GET() {
  try {
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.orgId, DEMO_ORG_ID))
      .orderBy(quizQuestions.questionNumber);

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Error fetching demo questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}
```

**Acceptance Criteria**:
- ✅ Returns demo quiz questions
- ✅ No auth required (public endpoint)
- ✅ Questions sorted by questionNumber

---

#### Task 3.2: Demo Submission API
**File**: `app/api/assessment/demo-submit/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, leadScores } from '@/db/schema';
import { calculateProductFitScore } from '@/lib/demo-scoring';
import { notifySalesTeam } from '@/lib/sales-notifications';

const DEMO_ORG_ID = 'org_demo_leadagent';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { responses } = body;

    // Extract contact info from first question
    const contactInfo = responses.find((r: any) => r.questionNumber === 1);
    if (!contactInfo) {
      return NextResponse.json(
        { success: false, error: 'Contact information required' },
        { status: 400 }
      );
    }

    const { name, email, company } = contactInfo.answer;

    // Create lead record
    const [lead] = await db
      .insert(leads)
      .values({
        orgId: DEMO_ORG_ID,
        name,
        email,
        company: company || null,
        status: 'pending',
        source: 'demo-assessment',
        rawData: { responses },
      })
      .returning();

    // Calculate Product Fit Score (different from Readiness Score)
    const fitScoreResult = calculateProductFitScore(responses);

    // Save score
    await db.insert(leadScores).values({
      leadId: lead.id,
      readinessScore: fitScoreResult.score,
      tier: fitScoreResult.tier,
      totalPoints: fitScoreResult.totalPoints,
      maxPossiblePoints: fitScoreResult.maxPossiblePoints,
      breakdown: fitScoreResult.breakdown,
    });

    // Notify sales team (NOT AI workflow)
    await notifySalesTeam({
      lead,
      fitScore: fitScoreResult.score,
      tier: fitScoreResult.tier,
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      fitScore: fitScoreResult.score,
    });
  } catch (error) {
    console.error('Error submitting demo assessment:', error);
    return NextResponse.json(
      { success: false, error: 'Submission failed' },
      { status: 500 }
    );
  }
}
```

**Dependencies**:
- Needs `calculateProductFitScore` function (Task 3.3)
- Needs `notifySalesTeam` function (Task 3.4)

**Acceptance Criteria**:
- ✅ Creates lead in database
- ✅ Calculates Product Fit Score
- ✅ Notifies sales team
- ✅ Returns leadId for results page

---

#### Task 3.3: Product Fit Scoring Algorithm
**File**: `lib/demo-scoring.ts`

```typescript
interface QuizResponse {
  questionNumber: number;
  answer: any;
  pointsEarned: number;
}

interface ProductFitResult {
  score: number; // 0-100
  tier: 'great-fit' | 'good-fit' | 'not-ready';
  totalPoints: number;
  maxPossiblePoints: number;
  breakdown: {
    volume: number;
    team: number;
    pain: number;
    readiness: number;
  };
}

export function calculateProductFitScore(
  responses: QuizResponse[]
): ProductFitResult {
  // Calculate total points earned
  const totalPoints = responses.reduce((sum, r) => sum + r.pointsEarned, 0);

  // Calculate max possible (based on demo quiz structure)
  // Adjust this based on actual max from demo questions
  const maxPossiblePoints = 100; // Update after finalizing questions

  // Calculate percentage
  const score = Math.round((totalPoints / maxPossiblePoints) * 100);

  // Determine tier
  let tier: 'great-fit' | 'good-fit' | 'not-ready';
  if (score >= 70) {
    tier = 'great-fit';
  } else if (score >= 40) {
    tier = 'good-fit';
  } else {
    tier = 'not-ready';
  }

  // Calculate breakdown by category
  const breakdown = {
    volume: responses.find(r => r.questionNumber === 2)?.pointsEarned || 0,
    team: responses.find(r => r.questionNumber === 3)?.pointsEarned || 0,
    pain: responses.find(r => r.questionNumber === 4)?.pointsEarned || 0,
    readiness: responses.filter(r => [6, 7, 8, 9].includes(r.questionNumber))
      .reduce((sum, r) => sum + r.pointsEarned, 0),
  };

  return {
    score,
    tier,
    totalPoints,
    maxPossiblePoints,
    breakdown,
  };
}
```

**Acceptance Criteria**:
- ✅ Calculates 0-100% score
- ✅ Assigns tier (great-fit, good-fit, not-ready)
- ✅ Provides breakdown by category
- ✅ Different logic than readiness scoring

---

#### Task 3.4: Sales Team Notification
**File**: `lib/sales-notifications.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
    await resend.emails.send({
      from: 'Lead Agent <notifications@leads.littletownlabs.site>',
      to: ['sales@timelesstechs.com'], // Update with actual sales email
      subject: `New Demo Lead: ${lead.name} (${fitScore}% fit)`,
      html: `
        <h2>New Demo Assessment Completed</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Email:</strong> ${lead.email}</p>
        <p><strong>Company:</strong> ${lead.company || 'Not provided'}</p>
        <p><strong>Product Fit Score:</strong> ${fitScore}%</p>
        <p><strong>Tier:</strong> ${tier}</p>

        <p><a href="https://leads.littletownlabs.site/leads/${lead.id}">View in Dashboard</a></p>
      `,
    });

    console.log(`Sales notification sent for lead: ${lead.id}`);
  } catch (error) {
    console.error('Failed to send sales notification:', error);
    // Don't throw - notification failure shouldn't break submission
  }
}
```

**Acceptance Criteria**:
- ✅ Sends email to sales team
- ✅ Includes lead details and fit score
- ✅ Link to view in dashboard
- ✅ Graceful failure (doesn't break submission)

---

### Phase 4: Integration & Polish ✨

**Estimated Time**: 2-3 hours

#### Task 4.1: Update Main Landing Page CTAs
**File**: `app/page.tsx`

```typescript
// Add new CTA in hero section
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
  <Link href="/assessment">
    <Button size="lg" variant="outline">
      Try Demo Assessment
      <Target className="w-5 h-5 ml-2" />
    </Button>
  </Link>
  <Link href="/dashboard">
    <Button size="lg">
      View Dashboard
    </Button>
  </Link>
</div>

// Add section before pricing
<section className="container mx-auto px-4 py-16 bg-accent/10">
  <div className="max-w-4xl mx-auto text-center">
    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
      Not Sure If Lead Agent Is Right for You?
    </h2>
    <p className="text-xl text-muted-foreground mb-8">
      Take our 5-minute assessment to see how Lead Agent works and if it's a good fit for your business.
    </p>
    <Link href="/assessment">
      <Button size="lg">
        Try Demo Assessment
        <Target className="w-5 h-5 ml-2" />
      </Button>
    </Link>
  </div>
</section>
```

**Acceptance Criteria**:
- ✅ CTA in hero section
- ✅ Dedicated section before pricing
- ✅ Clear value proposition
- ✅ Links to `/assessment`

---

#### Task 4.2: Update Middleware (Verify)
**File**: `middleware.ts`

Verify that `/assessment` routes are NOT rewritten:

```typescript
// Should already be correct
if (
  pathname.startsWith('/_next/') ||
  pathname.startsWith('/api/') ||
  pathname.startsWith('/sign-in') ||
  pathname.startsWith('/sign-up') ||
  pathname.startsWith('/select-organization') ||
  pathname.startsWith('/default-redirect') ||
  pathname.startsWith('/assessment') || // ← Verify this line exists
  pathname.startsWith('/favicon.ico')
) {
  return NextResponse.next();
}
```

**Acceptance Criteria**:
- ✅ `/assessment` routes NOT rewritten to tenant paths
- ✅ Demo assessment accessible from main domain

---

#### Task 4.3: Update QuizFormWrapper for Demo Mode
**File**: `app/[tenant]/quiz/quiz-form-wrapper.tsx`

Add support for demo mode:

```typescript
interface QuizFormWrapperProps {
  questions: QuizQuestion[];
  tenantSlug: string;
  primaryColor: string;
  isDemoMode?: boolean; // NEW
  demoSubmitUrl?: string; // NEW
  resultsPath?: string; // NEW
}

// In handleSubmit function
const submitUrl = isDemoMode && demoSubmitUrl
  ? demoSubmitUrl
  : '/api/assessment/submit';

const resultsRedirect = isDemoMode && resultsPath
  ? `${resultsPath}/${data.leadId}`
  : `/assessment/results/${data.leadId}`;
```

**Acceptance Criteria**:
- ✅ Accepts `isDemoMode` prop
- ✅ Uses custom submit URL for demo
- ✅ Redirects to correct results path
- ✅ Backward compatible with tenant quizzes

---

### Phase 5: Testing & Deployment 🚀

**Estimated Time**: 2-3 hours

#### Task 5.1: Manual Testing Checklist

```
Demo Assessment Flow:
□ Visit /assessment - landing page loads
□ Click "Start Assessment" - quiz page loads
□ Answer all 10 questions - validation works
□ Submit assessment - successful submission
□ View results - correct fit score displayed
□ Click "Start Free Trial" - redirects to /sign-up
□ Click "Schedule Demo" - opens Calendly

Database Verification:
□ Lead created in database with orgId: 'org_demo_leadagent'
□ Lead score calculated correctly
□ Tier assigned correctly (great-fit/good-fit/not-ready)

Email Notifications:
□ Sales team receives notification email
□ Email contains all lead details
□ Dashboard link works

Main Landing Page:
□ Demo CTA visible in hero
□ Demo section appears before pricing
□ Links work correctly

Tenant Quizzes (Regression):
□ Timeless-tech quiz still works
□ Tenant results page still works
□ No interference with tenant assessments
```

#### Task 5.2: Update Documentation

Update these files:
- README.md - Add demo assessment to features
- CLAUDE.md - Update commands and architecture notes
- .env.example - Ensure all variables documented

#### Task 5.3: Deploy to Production

```bash
# 1. Run all seed scripts
pnpm tsx db/seed-demo-org.ts
pnpm tsx db/seed-demo-quiz.ts

# 2. Test locally
pnpm dev
# Visit http://localhost:3000/assessment

# 3. Commit and push
git add .
git commit -m "feat: add demo assessment for SaaS customer acquisition"
git push

# 4. Verify deployment on Vercel

# 5. Test on production
# Visit https://leads.littletownlabs.site/assessment
```

---

## Dependencies & Blockers

### External Dependencies
- ✅ Database access (already have)
- ✅ Resend API for emails (already configured)
- ⚠️ Calendly link for demo scheduling (need to add)
- ⚠️ Sales team email address (need to configure)

### Code Dependencies
- QuizFormWrapper needs demo mode support
- Need product fit scoring algorithm (separate from readiness)
- Need sales notification system (separate from AI workflow)

---

## Success Metrics

After implementation, track:

1. **Demo Conversion Funnel**:
   - Homepage → /assessment clicks
   - /assessment → quiz starts
   - Quiz starts → completions
   - Completions → sign-ups

2. **Product Fit Distribution**:
   - % Great Fit (70%+)
   - % Good Fit (40-69%)
   - % Not Ready (<40%)

3. **Time to Sign-Up**:
   - Same session conversion
   - 24-hour conversion
   - 7-day conversion

---

## Priority Order

### Must Have (MVP):
1. ✅ Database: Demo org + questions
2. ✅ Routes: Landing, quiz, results pages
3. ✅ API: Demo submission endpoint
4. ✅ Scoring: Product fit algorithm

### Should Have:
5. ✅ Notifications: Sales team emails
6. ✅ CTAs: Main landing page updates
7. ✅ ROI: Calculator on results page

### Nice to Have:
8. ⏭️ Analytics: Track conversion funnel
9. ⏭️ A/B Testing: Different result page variants
10. ⏭️ Follow-up: Automated email sequences

---

## Estimated Total Time

- **Phase 1** (Foundation): 1-2 hours
- **Phase 2** (UI Routes): 4-6 hours
- **Phase 3** (API/Logic): 3-4 hours
- **Phase 4** (Integration): 2-3 hours
- **Phase 5** (Testing): 2-3 hours

**Total: 12-18 hours** for full implementation

---

## Next Steps

1. Review this plan - any questions or changes?
2. Start with Phase 1 (database setup)
3. Build incrementally, test at each phase
4. Deploy to production after Phase 5

Ready to begin? I can start implementing Phase 1 now! 🚀
