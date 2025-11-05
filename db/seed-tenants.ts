/**
 * Seed script for creating initial tenants
 *
 * Creates 2 tenants:
 * 1. Lead Agent (demo tenant for showcasing the product)
 * 2. Timeless Tech Solutions (actual business tenant for DDIP)
 *
 * Run with: pnpm tsx db/seed-tenants.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tenants, type NewTenant } from './schema';
import { eq } from 'drizzle-orm';

// Use HTTP driver for Node.js scripts (WebSocket driver doesn't work in Node)
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const LEAD_AGENT_TENANT: NewTenant = {
  clerkOrgId: 'org_lead_agent_demo', // Placeholder - will be updated when Clerk org is created
  subdomain: 'lead-agent',
  customDomain: null,
  name: 'Lead Agent Demo',
  slug: 'lead-agent',

  branding: {
    logoUrl: '/logo-lead-agent.svg',
    primaryColor: '#3B82F6', // Blue
    secondaryColor: '#10B981', // Green
    fontFamily: 'Inter',
  },

  landingPage: {
    heroTitle: 'Stop Wasting 70% of Your Sales Time on Unqualified Leads',
    heroSubtitle: 'AI-powered lead qualification demo - see how automated research and personalized outreach works in action.',
    ctaText: 'Try the Assessment',
    featureSections: [
      {
        title: 'Smart Assessment Quiz',
        description: '15-question assessment captures contact info + calculates readiness score (0-100%). Converts 20-40% vs. 5-15% for simple forms.',
        icon: 'Target',
      },
      {
        title: 'AI Research Engine',
        description: 'Autonomous AI agent researches company data, LinkedIn profiles, tech stack, and recent news in minutes.',
        icon: 'Bot',
      },
      {
        title: 'Personalized Outreach',
        description: 'AI writes personalized emails referencing specific quiz answers and research findings. 3x higher response rates.',
        icon: 'Sparkles',
      },
      {
        title: 'Built-in Approval Dashboard',
        description: 'Review queue with lead scores, quiz responses, research reports, and editable email drafts. No external tools required.',
        icon: 'Users',
      },
    ],
  },

  settings: {
    quizCompletionRedirect: '/results',
    emailFromName: 'Lead Agent Demo',
    emailFromAddress: 'demo@leadagent.com',
    enableAiResearch: true,
    qualificationThreshold: 60, // Only leads scoring 60%+ get AI research
  },

  subscriptionTier: 'enterprise', // Full features for demo
  subscriptionStatus: 'active',

  usageLimits: {
    maxQuizCompletionsMonthly: 10000, // Unlimited for demo
    maxAiWorkflowsMonthly: 2000,
    maxTeamMembers: 100,
  },

  currentUsage: {
    quizCompletionsThisMonth: 0,
    aiWorkflowsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
  },
};

const TIMELESS_TECH_TENANT: NewTenant = {
  clerkOrgId: 'org_timeless_tech_solutions', // Placeholder - will be updated when Clerk org is created
  subdomain: 'timeless-tech',
  customDomain: null, // Future: assessment.timelesstechs.com
  name: 'Timeless Technology Solutions',
  slug: 'timeless-tech',

  branding: {
    logoUrl: '/logo-timeless.svg',
    primaryColor: '#6366F1', // Indigo (matching current /assessment page)
    secondaryColor: '#EC4899', // Pink
    fontFamily: 'Inter',
  },

  landingPage: {
    heroTitle: "Your Help Desk Data Knows Why You're Losing Time & Money",
    heroSubtitle: 'Transform months of help desk tickets into actionable insights with our Data-Driven Insights Platform (DDIP). Start with a free 5-minute assessment to discover your improvement potential.',
    ctaText: 'Start Your Free Assessment',
    featureSections: [
      {
        title: 'Hidden Inefficiencies',
        description: 'DDIP processes both structured (ticket categories, resolution times) and unstructured data (descriptions, notes) to find recurring root causes.',
        icon: 'BarChart3',
      },
      {
        title: 'Process Improvements',
        description: 'Identify which 3-5 recurring issues are costing you the most time and money, with specific, actionable recommendations.',
        icon: 'Target',
      },
      {
        title: 'Cross-Departmental Insights',
        description: 'Help desk tickets reveal broader organizational problems: training gaps, software issues, onboarding weaknesses.',
        icon: 'Database',
      },
      {
        title: 'Validated ROI Projections',
        description: 'Every recommendation includes source-referenced validation from your actual data, plus projected cost savings.',
        icon: 'Shield',
      },
    ],
  },

  settings: {
    quizCompletionRedirect: '/results',
    emailFromName: 'Timeless Technology Solutions',
    emailFromAddress: 'ddip@timelesstechs.com',
    enableAiResearch: true,
    qualificationThreshold: 60,
  },

  subscriptionTier: 'enterprise',
  subscriptionStatus: 'active',

  usageLimits: {
    maxQuizCompletionsMonthly: 10000,
    maxAiWorkflowsMonthly: 2000,
    maxTeamMembers: 100,
  },

  currentUsage: {
    quizCompletionsThisMonth: 0,
    aiWorkflowsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
  },
};

async function seed() {
  console.log('🌱 Seeding tenants...\n');

  try {
    // Seed Lead Agent tenant
    console.log('📝 Creating Lead Agent tenant...');
    const existingLeadAgent = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, 'lead-agent'))
      .limit(1);

    if (existingLeadAgent.length > 0) {
      console.log('   ✓ Lead Agent tenant already exists (subdomain: lead-agent)');
    } else {
      const [leadAgentTenant] = await db.insert(tenants).values(LEAD_AGENT_TENANT).returning();
      console.log('   ✓ Lead Agent tenant created');
      console.log(`      - ID: ${leadAgentTenant.id}`);
      console.log(`      - Subdomain: ${leadAgentTenant.subdomain}`);
      console.log(`      - Name: ${leadAgentTenant.name}`);
    }

    // Seed Timeless Tech tenant
    console.log('\n📝 Creating Timeless Tech Solutions tenant...');
    const existingTimeless = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, 'timeless-tech'))
      .limit(1);

    if (existingTimeless.length > 0) {
      console.log('   ✓ Timeless Tech tenant already exists (subdomain: timeless-tech)');
    } else {
      const [timelessTenant] = await db.insert(tenants).values(TIMELESS_TECH_TENANT).returning();
      console.log('   ✓ Timeless Tech tenant created');
      console.log(`      - ID: ${timelessTenant.id}`);
      console.log(`      - Subdomain: ${timelessTenant.subdomain}`);
      console.log(`      - Name: ${timelessTenant.name}`);
    }

    console.log('\n✅ Tenant seeding complete!');
    console.log('\nNext steps:');
    console.log('  1. Run quiz seed scripts for each tenant');
    console.log('  2. Update Clerk organization IDs in the tenants table');
    console.log('  3. Configure subdomain routing in middleware');

  } catch (error) {
    console.error('❌ Error seeding tenants:', error);
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
