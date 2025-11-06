import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { EmailSettingsForm } from './email-settings-form';

export default async function EmailAdminPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return <div>No organization found</div>;
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId),
  });

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email & Workflow Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure email settings and AI workflow behavior
        </p>
      </div>

      <EmailSettingsForm settings={tenant.settings} />

      {/* Email Templates Section - Future Enhancement */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-600">
            Email template management coming soon
          </p>
          <p className="text-xs text-gray-500 mt-1">
            You'll be able to create and manage email sequences here
          </p>
        </div>
      </div>
    </div>
  );
}
