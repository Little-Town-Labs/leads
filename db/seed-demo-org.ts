/**
 * Seed script for creating the demo organization
 *
 * This organization is used for the "Try Before You Buy" demo assessment
 * on the main SaaS landing page, separate from actual tenant quizzes.
 *
 * Run with: pnpm tsx db/seed-demo-org.ts
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tenants, type NewTenant } from './schema';
import { eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Use HTTP driver for Node.js scripts (WebSocket driver doesn't work in Node)
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const DEMO_ORG: NewTenant = {
  clerkOrgId: 'org_demo_leadagent',
  subdomain: 'demo',
  customDomain: null,
  name: 'Lead Agent Demo',
  slug: 'demo',

  branding: {
    primaryColor: '#3B82F6', // Blue
    secondaryColor: '#10B981', // Green
    fontFamily: 'Inter',
  },

  landingPage: {
    heroTitle: 'Demo Assessment',
    heroSubtitle: 'Try our product assessment to see if Lead Agent is right for your business',
    ctaText: 'Start Demo',
  },

  settings: {
    enableAiResearch: false, // No AI workflow for demo leads
    qualificationThreshold: 0, // Not applicable for demo
    emailFromName: 'Lead Agent Demo',
    emailFromAddress: 'demo@leads.littletownlabs.site',
  },

  subscriptionTier: 'enterprise',
  subscriptionStatus: 'active',

  usageLimits: {
    maxQuizCompletionsMonthly: 100000, // Very high limit for demo
    maxAiWorkflowsMonthly: 0, // No AI workflows for demo
    maxTeamMembers: 1,
  },

  currentUsage: {
    quizCompletionsThisMonth: 0,
    aiWorkflowsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
  },
};

async function seed() {
  console.log('🌱 Seeding demo organization...\n');

  try {
    // Check if demo org already exists
    console.log('📝 Creating demo organization...');
    const existingDemo = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, 'demo'))
      .limit(1);

    if (existingDemo.length > 0) {
      console.log('   ✓ Demo organization already exists');
      console.log(`      - ID: ${existingDemo[0].id}`);
      console.log(`      - Subdomain: ${existingDemo[0].subdomain}`);
      console.log(`      - Name: ${existingDemo[0].name}`);
      console.log(`      - Clerk Org ID: ${existingDemo[0].clerkOrgId}`);
    } else {
      const [demoOrg] = await db.insert(tenants).values(DEMO_ORG).returning();
      console.log('   ✓ Demo organization created');
      console.log(`      - ID: ${demoOrg.id}`);
      console.log(`      - Subdomain: ${demoOrg.subdomain}`);
      console.log(`      - Name: ${demoOrg.name}`);
      console.log(`      - Clerk Org ID: ${demoOrg.clerkOrgId}`);
    }

    console.log('\n✅ Demo organization seeding complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: pnpm tsx db/seed-demo-quiz.ts (to create demo quiz questions)');
    console.log('  2. Test at: http://localhost:3000/assessment');

  } catch (error) {
    console.error('❌ Error seeding demo organization:', error);
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
