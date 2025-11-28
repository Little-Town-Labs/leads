import { db } from '../db';
import { tenants } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Ensure tenant exists for a Clerk organization
 * Run this if you get "Organization not found" errors
 *
 * Usage: tsx scripts/ensure-tenant.ts <clerk-org-id> <org-name> <subdomain>
 */

async function ensureTenant() {
  const orgId = process.argv[2];
  const orgName = process.argv[3] || 'My Organization';
  const subdomain = process.argv[4] || 'my-org';

  if (!orgId) {
    console.error('Usage: tsx scripts/ensure-tenant.ts <clerk-org-id> [org-name] [subdomain]');
    console.error('Example: tsx scripts/ensure-tenant.ts org_2abc123 "Acme Inc" acme');
    process.exit(1);
  }

  console.log(`Checking for tenant with orgId: ${orgId}`);

  try {
    // Check if tenant exists
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.clerkOrgId, orgId),
    });

    if (existing) {
      console.log('✓ Tenant already exists:');
      console.log(`  - ID: ${existing.id}`);
      console.log(`  - Name: ${existing.name}`);
      console.log(`  - Subdomain: ${existing.subdomain}`);
      console.log(`  - AI Config: ${existing.aiConfig ? 'Configured' : 'Not configured'}`);
      return;
    }

    console.log('Tenant not found. Creating...');

    // Create tenant
    const [newTenant] = await db.insert(tenants).values({
      clerkOrgId: orgId,
      name: orgName,
      slug: subdomain,
      subdomain: subdomain,
      branding: {
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
      },
      landingPage: {
        heroTitle: `Welcome to ${orgName}`,
        heroSubtitle: 'Complete our assessment to get started',
        ctaText: 'Take Assessment',
      },
      settings: {
        enableAiResearch: true,
        qualificationThreshold: 60,
      },
      usageLimits: {
        maxQuizCompletionsMonthly: 100,
        maxAiWorkflowsMonthly: 50,
        maxTeamMembers: 5,
      },
    }).returning();

    console.log('✓ Tenant created successfully:');
    console.log(`  - ID: ${newTenant.id}`);
    console.log(`  - Name: ${newTenant.name}`);
    console.log(`  - Subdomain: ${newTenant.subdomain}`);
    console.log('\nYou can now configure AI settings for this organization.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

ensureTenant();
