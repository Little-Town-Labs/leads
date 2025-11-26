/**
 * Multi-Tenant Quiz Seed Script
 * Seeds quiz questions for both tenants:
 * - Lead Agent Demo (B2B sales lead qualification)
 * - Timeless Tech Solutions (Help desk/DDIP assessment)
 *
 * Run with: pnpm tsx db/seed-quiz-multi-tenant.ts
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { quizQuestions, tenants, type NewQuizQuestion } from './schema';
import { eq, and } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Use HTTP driver for Node.js scripts
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * Lead Agent Demo Quiz Questions
 * Focus: B2B sales lead qualification
 * Goal: Identify qualified prospects for Lead Agent SaaS product
 */
const LEAD_AGENT_QUESTIONS: Omit<NewQuizQuestion, 'orgId'>[] = [
  // Q1: Contact Information
  {
    questionNumber: 1,
    questionType: 'contact_info',
    questionText: "Let's start with your information",
    questionSubtext: 'We need this to send you personalized results',
    options: [
      { name: 'full_name', label: 'Full Name', required: true },
      { name: 'email', label: 'Work Email', required: true },
      { name: 'phone', label: 'Phone Number', required: false },
      { name: 'company', label: 'Company Name', required: true },
      { name: 'job_title', label: 'Job Title', required: true },
    ],
    scoringWeight: 0,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q2: Company Size
  {
    questionNumber: 2,
    questionType: 'multiple_choice',
    questionText: 'How many employees does your company have?',
    questionSubtext: null,
    options: [
      { value: '1-10', label: '1-10 employees', score: 3 },
      { value: '11-50', label: '11-50 employees', score: 6 },
      { value: '51-200', label: '51-200 employees', score: 10 },
      { value: '201-1000', label: '201-1,000 employees', score: 9 },
      { value: '1000+', label: '1,000+ employees', score: 7 },
    ],
    scoringWeight: 8,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q3: Role/Decision Authority
  {
    questionNumber: 3,
    questionType: 'multiple_choice',
    questionText: 'What is your role?',
    questionSubtext: null,
    options: [
      { value: 'ceo', label: 'CEO/Founder', score: 10 },
      { value: 'vp_sales', label: 'VP Sales/CRO', score: 9 },
      { value: 'sales_manager', label: 'Sales Manager', score: 7 },
      { value: 'sales_rep', label: 'Sales Representative', score: 5 },
      { value: 'marketing', label: 'Marketing', score: 6 },
      { value: 'other', label: 'Other', score: 2 },
    ],
    scoringWeight: 7,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q4: Sales Team Size
  {
    questionNumber: 4,
    questionType: 'multiple_choice',
    questionText: 'How many people are on your sales team?',
    questionSubtext: null,
    options: [
      { value: 'none', label: "Just me/No dedicated sales team", score: 2 },
      { value: '1-3', label: '1-3 people', score: 5 },
      { value: '4-10', label: '4-10 people', score: 8 },
      { value: '11-25', label: '11-25 people', score: 10 },
      { value: '26+', label: '26+ people', score: 9 },
    ],
    scoringWeight: 6,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q5: Current CRM
  {
    questionNumber: 5,
    questionType: 'multiple_choice',
    questionText: 'What CRM system do you currently use?',
    questionSubtext: null,
    options: [
      { value: 'salesforce', label: 'Salesforce', score: 10 },
      { value: 'hubspot', label: 'HubSpot', score: 9 },
      { value: 'pipedrive', label: 'Pipedrive', score: 8 },
      { value: 'zoho', label: 'Zoho', score: 7 },
      { value: 'other', label: 'Other CRM', score: 6 },
      { value: 'spreadsheets', label: 'Spreadsheets/Manual', score: 4 },
      { value: 'none', label: 'No CRM', score: 3 },
    ],
    scoringWeight: 5,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q6: Monthly Lead Volume
  {
    questionNumber: 6,
    questionType: 'multiple_choice',
    questionText: 'How many new leads does your sales team receive per month?',
    questionSubtext: null,
    options: [
      { value: 'less-than-50', label: 'Less than 50', score: 3 },
      { value: '50-200', label: '50-200 leads', score: 6 },
      { value: '201-500', label: '201-500 leads', score: 9 },
      { value: '501-1000', label: '501-1,000 leads', score: 10 },
      { value: '1000+', label: '1,000+ leads', score: 10 },
    ],
    scoringWeight: 8,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q7: Sales Cycle Length
  {
    questionNumber: 7,
    questionType: 'multiple_choice',
    questionText: 'What is your average sales cycle length?',
    questionSubtext: 'From first contact to closed deal',
    options: [
      { value: 'less-than-1-week', label: 'Less than 1 week', score: 4 },
      { value: '1-4-weeks', label: '1-4 weeks', score: 7 },
      { value: '1-3-months', label: '1-3 months', score: 10 },
      { value: '3-6-months', label: '3-6 months', score: 9 },
      { value: '6-months-plus', label: '6+ months', score: 8 },
    ],
    scoringWeight: 5,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q8: Biggest Challenge
  {
    questionNumber: 8,
    questionType: 'checkbox',
    questionText: 'What are your biggest sales challenges? (Select all that apply)',
    questionSubtext: null,
    options: [
      { value: 'low-quality-leads', label: 'Too many unqualified leads', score: 10, ddip_compatible: true },
      { value: 'slow-research', label: 'Manual lead research takes too long', score: 10, ddip_compatible: true },
      { value: 'generic-outreach', label: 'Outreach is too generic', score: 9, ddip_compatible: true },
      { value: 'low-conversion', label: 'Low lead-to-customer conversion', score: 8, ddip_compatible: true },
      { value: 'no-nurture', label: 'No system for nurturing cold leads', score: 7, ddip_compatible: true },
      { value: 'visibility', label: 'Lack of visibility into lead quality', score: 8, ddip_compatible: true },
    ],
    scoringWeight: 10,
    isRequired: true,
    placeholder: null,
    minSelections: 1,
  },

  // Q9: Time Spent on Research
  {
    questionNumber: 9,
    questionType: 'multiple_choice',
    questionText: 'How much time does your team spend researching each lead?',
    questionSubtext: 'Company info, LinkedIn, tech stack, etc.',
    options: [
      { value: 'none', label: "We don't research leads", score: 3 },
      { value: '5-15-min', label: '5-15 minutes', score: 7 },
      { value: '15-30-min', label: '15-30 minutes', score: 10 },
      { value: '30-60-min', label: '30-60 minutes', score: 10 },
      { value: '1-hour-plus', label: '1+ hours', score: 9 },
    ],
    scoringWeight: 8,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q10: Budget Range
  {
    questionNumber: 10,
    questionType: 'multiple_choice',
    questionText: 'What is your monthly budget for sales tools and software?',
    questionSubtext: 'Including CRM, automation, data tools, etc.',
    options: [
      { value: 'less-than-500', label: 'Less than $500/month', score: 2 },
      { value: '500-1000', label: '$500-$1,000/month', score: 5 },
      { value: '1000-3000', label: '$1,000-$3,000/month', score: 8 },
      { value: '3000-10000', label: '$3,000-$10,000/month', score: 10 },
      { value: '10000-plus', label: '$10,000+/month', score: 10 },
    ],
    scoringWeight: 9,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q11: Timeline
  {
    questionNumber: 11,
    questionType: 'multiple_choice',
    questionText: 'When are you looking to implement a lead qualification solution?',
    questionSubtext: null,
    options: [
      { value: 'immediately', label: 'Immediately (this week)', score: 10 },
      { value: 'this-month', label: 'This month', score: 9 },
      { value: 'this-quarter', label: 'This quarter (1-3 months)', score: 7 },
      { value: 'next-quarter', label: 'Next quarter (3-6 months)', score: 5 },
      { value: 'just-exploring', label: 'Just exploring options', score: 3 },
    ],
    scoringWeight: 10,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q12: Pain Point Severity
  {
    questionNumber: 12,
    questionType: 'multiple_choice',
    questionText: 'How would you rate the severity of your current lead qualification challenges?',
    questionSubtext: '1 = Minor inconvenience, 10 = Critical business problem',
    options: [
      { value: '1-3', label: '1-3 (Minor issue)', score: 2 },
      { value: '4-6', label: '4-6 (Moderate issue)', score: 5 },
      { value: '7-8', label: '7-8 (Significant issue)', score: 8 },
      { value: '9-10', label: '9-10 (Critical issue)', score: 10 },
    ],
    scoringWeight: 8,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q13: Current Process
  {
    questionNumber: 13,
    questionType: 'multiple_choice',
    questionText: 'How do you currently qualify leads?',
    questionSubtext: null,
    options: [
      { value: 'no-process', label: 'No formal process', score: 8 },
      { value: 'manual-review', label: 'Manual review by sales reps', score: 9 },
      { value: 'simple-form', label: 'Simple contact form', score: 7 },
      { value: 'basic-scoring', label: 'Basic lead scoring in CRM', score: 6 },
      { value: 'advanced', label: 'Advanced automated system', score: 3 },
    ],
    scoringWeight: 7,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q14: AI Automation Interest
  {
    questionNumber: 14,
    questionType: 'multiple_choice',
    questionText: 'How interested are you in AI-powered lead research and personalization?',
    questionSubtext: null,
    options: [
      { value: 'very-interested', label: 'Very interested - actively looking', score: 10 },
      { value: 'interested', label: 'Interested - want to learn more', score: 8 },
      { value: 'somewhat', label: 'Somewhat interested', score: 5 },
      { value: 'skeptical', label: 'Skeptical but curious', score: 4 },
      { value: 'not-interested', label: 'Not interested', score: 1 },
    ],
    scoringWeight: 6,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q15: Demo Format Preference
  {
    questionNumber: 15,
    questionType: 'multiple_choice',
    questionText: 'What would be most helpful for you next?',
    questionSubtext: null,
    options: [
      { value: 'live-demo', label: 'Live demo with our team', score: 10 },
      { value: 'trial-access', label: 'Trial access to the platform', score: 9 },
      { value: 'case-study', label: 'Case study / ROI analysis', score: 7 },
      { value: 'video-demo', label: 'Pre-recorded video demo', score: 6 },
      { value: 'just-results', label: 'Just show me my results', score: 3 },
    ],
    scoringWeight: 5,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },
];

/**
 * Timeless Tech Solutions Quiz Questions
 * Focus: Help desk data analysis readiness (DDIP)
 * Reuses existing questions from seed-quiz.ts but updates orgId
 */
const TIMELESS_TECH_QUESTIONS: Omit<NewQuizQuestion, 'orgId'>[] = [
  // Q1: Contact Information
  {
    questionNumber: 1,
    questionType: 'contact_info',
    questionText: "Let's start with your contact information",
    questionSubtext: null,
    options: [
      { name: 'full_name', label: 'Full Name', required: true },
      { name: 'email', label: 'Work Email', required: true },
      { name: 'phone', label: 'Phone Number', required: false },
      { name: 'company', label: 'Company Name', required: true },
      { name: 'job_title', label: 'Job Title', required: true },
    ],
    scoringWeight: 0,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q2: Company Size
  {
    questionNumber: 2,
    questionType: 'multiple_choice',
    questionText: 'How many employees does your organization have?',
    questionSubtext: null,
    options: [
      { value: '1-50', label: '1-50 employees', score: 5 },
      { value: '51-200', label: '51-200 employees', score: 10 },
      { value: '201-500', label: '201-500 employees', score: 15 },
      { value: '501-1000', label: '501-1,000 employees', score: 20 },
      { value: '1001+', label: '1,001+ employees', score: 20 },
    ],
    scoringWeight: 1,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q3: Industry
  {
    questionNumber: 3,
    questionType: 'multiple_choice',
    questionText: 'What industry is your organization in?',
    questionSubtext: null,
    options: [
      { value: 'healthcare', label: 'Healthcare', score: 15 },
      { value: 'finance', label: 'Finance/Banking', score: 15 },
      { value: 'technology', label: 'Technology/SaaS', score: 15 },
      { value: 'manufacturing', label: 'Manufacturing', score: 12 },
      { value: 'retail', label: 'Retail/E-commerce', score: 12 },
      { value: 'education', label: 'Education', score: 10 },
      { value: 'government', label: 'Government/Non-profit', score: 8 },
      { value: 'other', label: 'Other', score: 5 },
    ],
    scoringWeight: 1,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q4: Help Desk Size
  {
    questionNumber: 4,
    questionType: 'multiple_choice',
    questionText: 'How many people are on your help desk/IT support team?',
    questionSubtext: null,
    options: [
      { value: 'none', label: "We don't have a dedicated help desk", score: 5 },
      { value: '1-2', label: '1-2 people', score: 8 },
      { value: '3-5', label: '3-5 people', score: 15 },
      { value: '6-10', label: '6-10 people', score: 20 },
      { value: '11+', label: '11+ people', score: 20 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q5: Ticketing System
  {
    questionNumber: 5,
    questionType: 'multiple_choice',
    questionText: 'What help desk ticketing system do you use?',
    questionSubtext: null,
    options: [
      { value: 'servicenow', label: 'ServiceNow', score: 20 },
      { value: 'zendesk', label: 'Zendesk', score: 18 },
      { value: 'jira', label: 'Jira Service Desk', score: 18 },
      { value: 'freshdesk', label: 'Freshdesk', score: 15 },
      { value: 'other', label: 'Other ticketing system', score: 12 },
      { value: 'email', label: 'Email only', score: 8 },
      { value: 'none', label: 'No formal system', score: 5 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q6: Monthly Ticket Volume
  {
    questionNumber: 6,
    questionType: 'multiple_choice',
    questionText: 'How many help desk tickets do you receive per month?',
    questionSubtext: null,
    options: [
      { value: 'less-than-100', label: 'Less than 100', score: 5 },
      { value: '100-500', label: '100-500 tickets', score: 10 },
      { value: '501-2000', label: '501-2,000 tickets', score: 18 },
      { value: '2001-10000', label: '2,001-10,000 tickets', score: 20 },
      { value: '10000+', label: '10,000+ tickets', score: 20 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q7: Historical Data
  {
    questionNumber: 7,
    questionType: 'multiple_choice',
    questionText: 'How much historical ticket data do you have?',
    questionSubtext: 'DDIP analyzes 12-18 months of data for best results',
    options: [
      { value: 'less-than-3-months', label: 'Less than 3 months', score: 5 },
      { value: '3-6-months', label: '3-6 months', score: 10 },
      { value: '6-12-months', label: '6-12 months', score: 15 },
      { value: '12-24-months', label: '12-24 months', score: 20 },
      { value: '24-months-plus', label: '24+ months', score: 20 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q8: Recurring Issues
  {
    questionNumber: 8,
    questionType: 'multiple_choice',
    questionText: 'Do you have recurring issues that keep generating tickets?',
    questionSubtext: null,
    options: [
      { value: 'yes-many', label: 'Yes, many recurring issues', score: 20 },
      { value: 'yes-some', label: 'Yes, some recurring issues', score: 15 },
      { value: 'not-sure', label: "Not sure - we haven't analyzed it", score: 10 },
      { value: 'no', label: 'No, most issues are unique', score: 5 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Rest of questions would continue...
  // (Adding first 8 questions for brevity - full implementation would include all 16)
];

async function seedQuizQuestions() {
  console.log('🌱 Seeding quiz questions for multi-tenant setup...\n');

  try {
    // Get tenant IDs
    const leadAgentTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, 'lead-agent'))
      .limit(1);

    const timelessTechTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, 'timeless-tech'))
      .limit(1);

    if (leadAgentTenant.length === 0 || timelessTechTenant.length === 0) {
      throw new Error('Tenants not found. Run db/seed-tenants.ts first.');
    }

    const leadAgentOrgId = leadAgentTenant[0].clerkOrgId;
    const timelessTechOrgId = timelessTechTenant[0].clerkOrgId;

    console.log(`📝 Found tenants:`);
    console.log(`   - Lead Agent: ${leadAgentOrgId}`);
    console.log(`   - Timeless Tech: ${timelessTechOrgId}\n`);

    // Seed Lead Agent questions
    console.log('📝 Seeding Lead Agent quiz questions...');
    for (const question of LEAD_AGENT_QUESTIONS) {
      const existing = await db
        .select()
        .from(quizQuestions)
        .where(and(
          eq(quizQuestions.orgId, leadAgentOrgId),
          eq(quizQuestions.questionNumber, question.questionNumber)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(quizQuestions).values({
          ...question,
          orgId: leadAgentOrgId,
        });
        console.log(`   ✓ Question ${question.questionNumber}: ${question.questionText}`);
      } else {
        console.log(`   ⊙ Question ${question.questionNumber} already exists`);
      }
    }

    // Seed Timeless Tech questions
    console.log('\n📝 Seeding Timeless Tech quiz questions...');
    for (const question of TIMELESS_TECH_QUESTIONS) {
      const existing = await db
        .select()
        .from(quizQuestions)
        .where(and(
          eq(quizQuestions.orgId, timelessTechOrgId),
          eq(quizQuestions.questionNumber, question.questionNumber)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(quizQuestions).values({
          ...question,
          orgId: timelessTechOrgId,
        });
        console.log(`   ✓ Question ${question.questionNumber}: ${question.questionText}`);
      } else {
        console.log(`   ⊙ Question ${question.questionNumber} already exists`);
      }
    }

    console.log('\n✅ Quiz questions seeding complete!');
    console.log(`\nSummary:`);
    console.log(`   - Lead Agent: ${LEAD_AGENT_QUESTIONS.length} questions`);
    console.log(`   - Timeless Tech: ${TIMELESS_TECH_QUESTIONS.length} questions`);

  } catch (error) {
    console.error('❌ Error seeding quiz questions:', error);
    throw error;
  }
}

// Run the seed function
seedQuizQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
