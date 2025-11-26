/**
 * Demo Quiz Seed Script
 *
 * Seeds 10 product-fit questions for the demo assessment
 * These questions help potential SaaS customers determine if Lead Agent
 * is a good fit for their business.
 *
 * Run with: pnpm tsx db/seed-demo-quiz.ts
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

const DEMO_ORG_CLERK_ID = 'org_demo_leadagent';

/**
 * Demo Assessment Questions
 * Focus: Product fit for potential SaaS customers
 * Goal: Determine if Lead Agent is a good fit for their business
 */
const DEMO_QUESTIONS: Omit<NewQuizQuestion, 'orgId'>[] = [
  // Q1: Contact Information
  {
    questionNumber: 1,
    questionType: 'contact_info',
    questionText: "Let's start with your information",
    questionSubtext: "We'll use this to send your personalized results",
    options: [
      { name: 'name', label: 'Full Name', required: true },
      { name: 'email', label: 'Work Email', required: true },
      { name: 'company', label: 'Company Name', required: true },
      { name: 'title', label: 'Job Title', required: false },
    ],
    scoringWeight: 0,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q2: Lead Volume
  {
    questionNumber: 2,
    questionType: 'multiple_choice',
    questionText: 'How many leads does your team receive per month?',
    questionSubtext: 'This helps us understand if Lead Agent is a good fit',
    options: [
      { value: '<50', label: 'Less than 50 leads', score: 1 },
      { value: '50-200', label: '50-200 leads', score: 3 },
      { value: '200-500', label: '200-500 leads', score: 5 },
      { value: '500+', label: 'More than 500 leads', score: 5 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q3: Team Size
  {
    questionNumber: 3,
    questionType: 'multiple_choice',
    questionText: 'How many people are on your sales team?',
    questionSubtext: null,
    options: [
      { value: '1-2', label: '1-2 people', score: 2 },
      { value: '3-5', label: '3-5 people', score: 4 },
      { value: '6-10', label: '6-10 people', score: 5 },
      { value: '10+', label: 'More than 10 people', score: 5 },
    ],
    scoringWeight: 1,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q4: Biggest Challenge
  {
    questionNumber: 4,
    questionType: 'multiple_choice',
    questionText: "What's your biggest lead qualification challenge?",
    questionSubtext: 'Select the one that impacts you most',
    options: [
      { value: 'manual_research', label: 'Manual research takes too long', score: 5 },
      { value: 'low_conversion', label: 'Low conversion from leads to deals', score: 4 },
      { value: 'team_capacity', label: "Team doesn't have capacity", score: 5 },
      { value: 'no_process', label: 'No consistent qualification process', score: 5 },
      { value: 'crm_issues', label: 'CRM and tool issues', score: 3 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q5: Current Tools
  {
    questionNumber: 5,
    questionType: 'checkbox',
    questionText: 'What tools does your team currently use?',
    questionSubtext: 'Select all that apply',
    options: [
      { value: 'crm', label: 'CRM (Salesforce, HubSpot, etc.)', score: 3 },
      { value: 'email', label: 'Email automation', score: 2 },
      { value: 'linkedin', label: 'LinkedIn Sales Navigator', score: 3 },
      { value: 'spreadsheets', label: 'Spreadsheets only', score: 1 },
      { value: 'none', label: 'No formal tools', score: 0 },
    ],
    scoringWeight: 1,
    isRequired: true,
    placeholder: null,
    minSelections: 1,
  },

  // Q6: Time Spent Researching
  {
    questionNumber: 6,
    questionType: 'multiple_choice',
    questionText: 'How much time does your team spend researching each lead?',
    questionSubtext: null,
    options: [
      { value: '<5min', label: 'Less than 5 minutes', score: 2 },
      { value: '5-15min', label: '5-15 minutes', score: 3 },
      { value: '15-30min', label: '15-30 minutes', score: 5 },
      { value: '30min+', label: 'More than 30 minutes', score: 5 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q7: Average Deal Size
  {
    questionNumber: 7,
    questionType: 'multiple_choice',
    questionText: "What's your average deal size?",
    questionSubtext: null,
    options: [
      { value: '<5k', label: 'Less than $5,000', score: 2 },
      { value: '5-20k', label: '$5,000 - $20,000', score: 4 },
      { value: '20-100k', label: '$20,000 - $100,000', score: 5 },
      { value: '100k+', label: 'More than $100,000', score: 5 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q8: Implementation Timeline
  {
    questionNumber: 8,
    questionType: 'multiple_choice',
    questionText: 'When are you looking to implement a solution?',
    questionSubtext: null,
    options: [
      { value: 'asap', label: 'As soon as possible', score: 5 },
      { value: '1-3mo', label: 'Within 1-3 months', score: 4 },
      { value: '3-6mo', label: 'Within 3-6 months', score: 3 },
      { value: 'exploring', label: 'Just exploring options', score: 1 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q9: Budget
  {
    questionNumber: 9,
    questionType: 'multiple_choice',
    questionText: "What's your monthly budget for sales tools?",
    questionSubtext: null,
    options: [
      { value: '<500', label: 'Less than $500', score: 1 },
      { value: '500-2k', label: '$500 - $2,000', score: 3 },
      { value: '2k-5k', label: '$2,000 - $5,000', score: 5 },
      { value: '5k+', label: 'More than $5,000', score: 5 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Q10: Decision Drivers
  {
    questionNumber: 10,
    questionType: 'multiple_choice',
    questionText: 'What would make you sign up today?',
    questionSubtext: 'Be honest - this helps us help you better',
    options: [
      { value: 'see_roi', label: 'Need to see clear ROI proof', score: 4 },
      { value: 'free_trial', label: 'Want to try it free first', score: 5 },
      { value: 'team_approval', label: 'Need team approval', score: 3 },
      { value: 'budget', label: 'Need budget approved', score: 2 },
      { value: 'ready', label: "I'm ready now!", score: 5 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },
];

async function seed() {
  console.log('🌱 Seeding demo quiz questions...\n');

  try {
    // Get demo organization
    const [demoOrg] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.clerkOrgId, DEMO_ORG_CLERK_ID))
      .limit(1);

    if (!demoOrg) {
      console.error('❌ Demo organization not found!');
      console.error('   Please run: pnpm tsx db/seed-demo-org.ts first');
      process.exit(1);
    }

    console.log(`📝 Seeding questions for: ${demoOrg.name}`);
    console.log(`   Org ID: ${demoOrg.clerkOrgId}\n`);

    // Check if questions already exist
    const existingQuestions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.orgId, demoOrg.clerkOrgId));

    if (existingQuestions.length > 0) {
      console.log(`   ⚠️  ${existingQuestions.length} questions already exist for demo org`);
      console.log('   Skipping seed to avoid duplicates');
      console.log('\n   To re-seed, delete existing questions first:');
      console.log(`   DELETE FROM quiz_questions WHERE org_id = '${demoOrg.clerkOrgId}';`);
    } else {
      // Insert questions
      const questionsToInsert = DEMO_QUESTIONS.map(q => ({
        ...q,
        orgId: demoOrg.clerkOrgId,
      }));

      await db.insert(quizQuestions).values(questionsToInsert);

      console.log(`   ✓ ${DEMO_QUESTIONS.length} questions created`);
      console.log('\n   Question breakdown:');
      console.log('   - Q1: Contact information');
      console.log('   - Q2: Lead volume');
      console.log('   - Q3: Team size');
      console.log('   - Q4: Biggest challenge');
      console.log('   - Q5: Current tools (checkbox)');
      console.log('   - Q6: Research time');
      console.log('   - Q7: Average deal size');
      console.log('   - Q8: Implementation timeline');
      console.log('   - Q9: Budget');
      console.log('   - Q10: Decision drivers');
    }

    console.log('\n✅ Demo quiz seeding complete!');
    console.log('\nNext steps:');
    console.log('  1. Create demo assessment UI routes');
    console.log('  2. Test at: http://localhost:3000/assessment');

  } catch (error) {
    console.error('❌ Error seeding demo quiz:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
