/**
 * Update Timeless Tech tenant logo
 * Sets logoUrl to /timeless/hero-image3.png
 *
 * Run with: pnpm tsx db/update-timeless-logo.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { tenants } from './schema';
import { eq } from 'drizzle-orm';

// Use HTTP driver for Node.js scripts
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function updateLogo() {
  console.log('🎨 Updating Timeless Tech logo...\n');

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
    console.log(`Current logo: ${tenant.branding.logoUrl || 'none'}`);

    // Update the logo URL
    const updatedBranding = {
      ...tenant.branding,
      logoUrl: '/timeless/hero-image3.png',
    };

    await db
      .update(tenants)
      .set({ branding: updatedBranding })
      .where(eq(tenants.id, tenant.id));

    console.log(`\n✅ Logo updated to: /timeless/hero-image3.png`);
    console.log(`\nView at: https://timeless-tech.leads.littletownlabs.site`);

  } catch (error) {
    console.error('❌ Error updating logo:', error);
    throw error;
  }
}

// Run the update
updateLogo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
