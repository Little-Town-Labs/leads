/**
 * Seed script for Help Desk Assessment Quiz
 * Populates quiz_questions table with Timeless Technology Solutions' help desk assessment
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { quizQuestions } from './schema';
import { eq } from 'drizzle-orm';

// Use HTTP driver for Node.js scripts (WebSocket driver doesn't work in Node)
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const DEFAULT_ORG_ID = 'default'; // For Phase 1, all questions use default org

const HELP_DESK_QUIZ_QUESTIONS = [
  // Question 1: Contact Info
  {
    orgId: DEFAULT_ORG_ID,
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

  // Question 2: Company Size
  {
    orgId: DEFAULT_ORG_ID,
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

  // Question 3: Industry
  {
    orgId: DEFAULT_ORG_ID,
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

  // Question 4: Help Desk Size
  {
    orgId: DEFAULT_ORG_ID,
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

  // Question 5: Ticket Volume
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 5,
    questionType: 'multiple_choice',
    questionText: 'Approximately how many support tickets do you receive per month?',
    questionSubtext: null,
    options: [
      { value: '0-50', label: '0-50 tickets', score: 3 },
      { value: '51-200', label: '51-200 tickets', score: 8 },
      { value: '201-500', label: '201-500 tickets', score: 15 },
      { value: '501-1000', label: '501-1,000 tickets', score: 20 },
      { value: '1001+', label: '1,001+ tickets', score: 25 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 6: Help Desk Software
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 6,
    questionType: 'multiple_choice',
    questionText: 'What help desk/ticketing system do you currently use?',
    questionSubtext: "We'll use this to understand what data DDIP can analyze",
    options: [
      { value: 'zendesk', label: 'Zendesk', score: 15, ddip_compatible: true },
      { value: 'freshdesk', label: 'Freshdesk', score: 15, ddip_compatible: true },
      { value: 'servicenow', label: 'ServiceNow', score: 20, ddip_compatible: true },
      { value: 'jira', label: 'Jira Service Management', score: 15, ddip_compatible: true },
      { value: 'salesforce', label: 'Salesforce Service Cloud', score: 15, ddip_compatible: true },
      { value: 'email', label: 'Email/Spreadsheets', score: 5, ddip_compatible: false },
      { value: 'other', label: 'Other system', score: 10, ddip_compatible: true },
      { value: 'none', label: 'No formal system', score: 3, ddip_compatible: false },
    ],
    scoringWeight: 1,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 7: Pain Points (Multi-select)
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 7,
    questionType: 'checkbox',
    questionText: 'What are your biggest help desk challenges? (Select all that apply)',
    questionSubtext: null,
    options: [
      { value: 'slow_response', label: 'Slow response times', score: 5 },
      { value: 'high_volume', label: 'Overwhelming ticket volume', score: 5 },
      { value: 'repeat_issues', label: 'Same issues keep recurring', score: 8 },
      { value: 'no_visibility', label: 'Lack of visibility into problems', score: 8 },
      { value: 'manual_processes', label: 'Too many manual processes', score: 8 },
      { value: 'knowledge_gaps', label: 'Knowledge gaps on the team', score: 5 },
      { value: 'no_metrics', label: "Don't have meaningful metrics", score: 10 },
      { value: 'root_cause', label: "Can't identify root causes", score: 10 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: 1,
  },

  // Question 8: Current Metrics
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 8,
    questionType: 'multiple_choice',
    questionText: 'How do you currently measure help desk performance?',
    questionSubtext: null,
    options: [
      { value: 'comprehensive', label: 'We have comprehensive KPIs and dashboards', score: 15 },
      { value: 'basic', label: 'We track basic metrics (response time, resolution time)', score: 10 },
      { value: 'manual', label: 'We manually pull reports when needed', score: 5 },
      { value: 'none', label: "We don't really track metrics", score: 3 },
    ],
    scoringWeight: 1,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 9: Primary Goal
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 9,
    questionType: 'multiple_choice',
    questionText: "What's your PRIMARY goal for improving your help desk?",
    questionSubtext: null,
    options: [
      { value: 'reduce_costs', label: 'Reduce operational costs', score: 15 },
      { value: 'improve_satisfaction', label: 'Improve employee satisfaction', score: 12 },
      { value: 'faster_resolution', label: 'Faster issue resolution', score: 15 },
      { value: 'prevent_issues', label: 'Prevent recurring problems', score: 18 },
      { value: 'better_visibility', label: 'Better visibility into IT operations', score: 18 },
      { value: 'strategic_insights', label: 'Use data for strategic decisions', score: 20 },
    ],
    scoringWeight: 2,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 10: Data Readiness
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 10,
    questionType: 'multiple_choice',
    questionText: 'How much historical help desk data do you have available?',
    questionSubtext: 'DDIP works best with 12-18 months of ticket history',
    options: [
      { value: '18_months+', label: '18+ months of data', score: 25 },
      { value: '12-18_months', label: '12-18 months of data', score: 20 },
      { value: '6-12_months', label: '6-12 months of data', score: 15 },
      { value: '3-6_months', label: '3-6 months of data', score: 10 },
      { value: 'under_3_months', label: 'Under 3 months of data', score: 5 },
      { value: 'unknown', label: "I'm not sure", score: 8 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 11: Previous Attempts
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 11,
    questionType: 'multiple_choice',
    questionText: 'Have you tried to improve your help desk processes before?',
    questionSubtext: null,
    options: [
      { value: 'yes_success', label: 'Yes, with some success', score: 15 },
      { value: 'yes_failed', label: "Yes, but it didn't work out", score: 18 },
      { value: 'no_resources', label: "No, we haven't had the resources/expertise", score: 12 },
      { value: 'no_priority', label: "No, it hasn't been a priority", score: 5 },
    ],
    scoringWeight: 1,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 12: Budget Authority
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 12,
    questionType: 'multiple_choice',
    questionText: "What's your role in making decisions about help desk improvements?",
    questionSubtext: null,
    options: [
      { value: 'final_decision', label: 'I make the final decision', score: 25 },
      { value: 'strong_influence', label: 'I have strong influence on the decision', score: 20 },
      { value: 'recommend', label: 'I can recommend, but someone else decides', score: 10 },
      { value: 'no_authority', label: "I'm just gathering information", score: 3 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 13: Timeline
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 13,
    questionType: 'multiple_choice',
    questionText: 'When are you looking to start a help desk improvement project?',
    questionSubtext: null,
    options: [
      { value: 'immediately', label: 'Immediately - this is urgent', score: 30 },
      { value: '1-3_months', label: 'Within 1-3 months', score: 25 },
      { value: '3-6_months', label: 'Within 3-6 months', score: 15 },
      { value: '6-12_months', label: '6-12 months', score: 8 },
      { value: 'exploring', label: 'Just exploring options', score: 3 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 14: Budget Range
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 14,
    questionType: 'multiple_choice',
    questionText: 'What budget range are you considering for this project?',
    questionSubtext: null,
    options: [
      { value: '50k+', label: '$50,000+', score: 30 },
      { value: '25-50k', label: '$25,000 - $50,000', score: 25 },
      { value: '10-25k', label: '$10,000 - $25,000', score: 20 },
      { value: '5-10k', label: '$5,000 - $10,000', score: 10 },
      { value: 'under_5k', label: 'Under $5,000', score: 3 },
      { value: 'unsure', label: 'Not sure yet', score: 12 },
    ],
    scoringWeight: 3,
    isRequired: true,
    placeholder: null,
    minSelections: null,
  },

  // Question 15: Biggest Obstacle
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 15,
    questionType: 'text',
    questionText: "What's the biggest obstacle preventing you from improving your help desk today?",
    questionSubtext: null,
    options: null,
    scoringWeight: 0,
    isRequired: false,
    placeholder: "e.g., 'We don't know where to start', 'No budget approved yet', 'Too busy firefighting'",
    minSelections: null,
  },

  // Question 16: Cross-Departmental Insights
  {
    orgId: DEFAULT_ORG_ID,
    questionNumber: 16,
    questionType: 'checkbox',
    questionText: 'Beyond help desk metrics, what other insights would be valuable?',
    questionSubtext: 'DDIP can identify cross-departmental improvement opportunities',
    options: [
      { value: 'training_gaps', label: 'Employee training gaps', score: 5 },
      { value: 'software_issues', label: 'Problematic software/systems', score: 5 },
      { value: 'process_bottlenecks', label: 'Process bottlenecks', score: 5 },
      { value: 'onboarding_issues', label: 'Onboarding weaknesses', score: 5 },
      { value: 'vendor_performance', label: 'Vendor performance problems', score: 5 },
      { value: 'security_risks', label: 'Security/compliance risks', score: 8 },
    ],
    scoringWeight: 1,
    isRequired: false,
    placeholder: null,
    minSelections: 0,
  },
];

async function seedQuiz() {
  console.log('🌱 Seeding Help Desk Assessment Quiz...');

  try {
    // Delete existing questions for default org
    const deleted = await db
      .delete(quizQuestions)
      .where(eq(quizQuestions.orgId, DEFAULT_ORG_ID));
    console.log(`🗑️  Cleared ${deleted.rowCount || 0} existing questions`);

    // Insert new questions
    const inserted = await db.insert(quizQuestions).values(HELP_DESK_QUIZ_QUESTIONS).returning();
    console.log(`✅ Seeded ${inserted.length} quiz questions`);

    // Calculate max possible score
    const maxScore = HELP_DESK_QUIZ_QUESTIONS.reduce((total, q) => {
      if (q.questionType === 'multiple_choice' && q.options) {
        const maxOptionScore = Math.max(...q.options.map((opt: any) => opt.score || 0));
        return total + maxOptionScore * q.scoringWeight;
      } else if (q.questionType === 'checkbox' && q.options) {
        const totalCheckboxScore = q.options.reduce((sum: number, opt: any) => sum + (opt.score || 0), 0);
        return total + totalCheckboxScore * q.scoringWeight;
      }
      return total;
    }, 0);

    console.log(`📊 Max possible score: ${maxScore} points`);
    console.log(`📊 Scoring tiers:`);
    console.log(`   - COLD (0-39%): 0-${Math.floor(maxScore * 0.39)} points`);
    console.log(`   - WARM (40-59%): ${Math.floor(maxScore * 0.4)}-${Math.floor(maxScore * 0.59)} points`);
    console.log(`   - HOT (60-79%): ${Math.floor(maxScore * 0.6)}-${Math.floor(maxScore * 0.79)} points`);
    console.log(`   - QUALIFIED (80-100%): ${Math.floor(maxScore * 0.8)}-${maxScore} points`);

    console.log('\n✨ Quiz seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding quiz:', error);
    throw error;
  }
}

// Run the seed
seedQuiz()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
