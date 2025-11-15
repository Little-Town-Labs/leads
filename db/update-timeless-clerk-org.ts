/**
 * Update Timeless Tech tenant with real Clerk Organization ID
 * Sets clerkOrgId to org_35XCr3evxdGEl19z2DQpUCE2MAS
 *
 * Run with: pnpm tsx db/update-timeless-clerk-org.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tenants } from './schema';
import { eq } from 'drizzle-orm';

// Use HTTP driver for Node.js scripts
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const REAL_CLERK_ORG_ID = 'org_35XCr3evxdGEl19z2DQpUCE2MAS';

async function updateClerkOrgId() {
  console.log('🔑 Updating Timeless Tech Clerk Organization ID...\n');

  try {
    // Find the Timeless Tech tenant
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, 'timeless-tech'))
      .limit(1);

    if (!tenant) {
      console.error('❌ Timeless Tech tenant not found');
      process.exit(1);
    }

    console.log(`Found tenant: ${tenant.name}`);
    console.log(`Current Clerk Org ID: ${tenant.clerkOrgId}`);

    // Update the Clerk Org ID
    await db
      .update(tenants)
      .set({ clerkOrgId: REAL_CLERK_ORG_ID })
      .where(eq(tenants.id, tenant.id));

    console.log(`\n✅ Clerk Org ID updated to: ${REAL_CLERK_ORG_ID}`);
    console.log(`\nTimeless Tech employees can now:`);
    console.log(`  1. Sign in at: https://leads.littletownlabs.site/sign-in`);
    console.log(`  2. Join organization: Timeless Technology Solutions`);
    console.log(`  3. Access dashboard at: https://leads.littletownlabs.site/dashboard`);

  } catch (error) {
    console.error('❌ Error updating Clerk Org ID:', error);
    throw error;
  }
}

// Run the update
updateClerkOrgId()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
