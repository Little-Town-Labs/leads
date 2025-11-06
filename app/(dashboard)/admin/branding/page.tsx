import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { BrandingForm } from './branding-form';
import { LandingPageForm } from './landing-page-form';

export default async function BrandingAdminPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return <div>No organization found</div>;
  }

  // Fetch tenant data
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId),
  });

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Branding & Appearance</h2>
        <p className="mt-1 text-sm text-gray-600">
          Customize your organization's branding and landing page
        </p>
      </div>

      {/* Branding Settings */}
      <BrandingForm branding={tenant.branding} />

      {/* Landing Page Content */}
      <LandingPageForm landingPage={tenant.landingPage} />

      {/* Preview Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Preview Your Changes</h3>
        <p className="text-sm text-blue-800">
          Visit your tenant-specific landing page at: <code className="bg-blue-100 px-2 py-1 rounded">{tenant.subdomain}.yourdomain.com</code>
        </p>
      </div>
    </div>
  );
}
