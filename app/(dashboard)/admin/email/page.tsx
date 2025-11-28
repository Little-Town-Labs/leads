import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tenants, emailSequences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { EmailSettingsForm } from './email-settings-form';
import { EmailSequenceList } from './email-sequence-list';
import { AddSequenceButton } from './add-sequence-button';

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

  // Fetch email sequences for this organization
  const sequences = await db
    .select()
    .from(emailSequences)
    .where(eq(emailSequences.orgId, orgId))
    .orderBy(emailSequences.tier, emailSequences.sequenceNumber);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email & Workflow Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure email settings and AI workflow behavior
        </p>
      </div>

      <EmailSettingsForm settings={tenant.settings} />

      {/* Email Templates Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Email Sequences</h3>
            <p className="mt-1 text-sm text-gray-600">
              Automated email sequences for different lead tiers
            </p>
          </div>
          <AddSequenceButton />
        </div>

        <EmailSequenceList sequences={sequences} />
      </div>
    </div>
  );
}
