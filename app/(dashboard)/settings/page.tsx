import { auth, clerkClient } from '@clerk/nextjs/server';
import { hasPermission } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import { Users, Crown, Shield, Eye } from 'lucide-react';

export default async function SettingsPage() {
  const { orgId } = await auth();
  const canManageTeam = await hasPermission('team:manage');
  const canManageOrg = await hasPermission('org:manage');
  const canManageBilling = await hasPermission('billing:manage');

  if (!orgId) {
    redirect('/select-organization');
  }

  // Fetch organization details
  const client = await clerkClient();
  const organization = await client.organizations.getOrganization({
    organizationId: orgId,
  });

  // Fetch organization members
  const membershipList = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
  });

  // Get subscription info from metadata
  const metadata = organization.publicMetadata as {
    subscriptionTier?: string;
    monthlyLeadLimit?: number;
    usageThisMonth?: number;
  };

  const subscriptionTier = metadata.subscriptionTier || 'starter';
  const monthlyLeadLimit = metadata.monthlyLeadLimit || 100;
  const usageThisMonth = metadata.usageThisMonth || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage your organization settings and team members
        </p>
      </div>

      {/* Organization Info */}
      {canManageOrg && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Organization Details
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
                {organization.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(organization.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Total Members</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {membershipList.data.length}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Subscription & Usage */}
      {canManageBilling && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Subscription & Usage
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="border-l-4 border-blue-500 pl-4">
              <dt className="text-sm font-medium text-gray-500">Current Plan</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                {subscriptionTier}
              </dd>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <dt className="text-sm font-medium text-gray-500">Monthly Limit</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {monthlyLeadLimit} leads
              </dd>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <dt className="text-sm font-medium text-gray-500">Used This Month</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {usageThisMonth} / {monthlyLeadLimit}
              </dd>
            </div>
          </div>
          <div className="mt-6">
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div
                  style={{
                    width: `${Math.min((usageThisMonth / monthlyLeadLimit) * 100, 100)}%`,
                  }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                    usageThisMonth / monthlyLeadLimit > 0.9
                      ? 'bg-red-500'
                      : usageThisMonth / monthlyLeadLimit > 0.7
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {Math.round((usageThisMonth / monthlyLeadLimit) * 100)}% of monthly quota used
            </p>
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
          {canManageTeam && (
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Invite Member
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {canManageTeam && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {membershipList.data.map((membership) => {
                const user = membership.publicUserData;
                const roleIcon =
                  membership.role === 'org:admin' ? (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  ) : membership.role === 'org:manager' ? (
                    <Shield className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  );

                if (!user) {
                  return null;
                }

                return (
                  <tr key={membership.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.imageUrl ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.imageUrl}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.identifier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {roleIcon}
                        <span className="ml-2 text-sm text-gray-900">
                          {membership.role.replace('org:', '')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(membership.createdAt).toLocaleDateString()}
                    </td>
                    {canManageTeam && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">
                          Manage
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Role Permissions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <div>
            <div className="flex items-center font-medium text-blue-900 mb-1">
              <Crown className="h-4 w-4 mr-1" />
              Admin
            </div>
            <p className="text-blue-700 text-xs">Full access to all features</p>
          </div>
          <div>
            <div className="flex items-center font-medium text-blue-900 mb-1">
              <Shield className="h-4 w-4 mr-1" />
              Manager
            </div>
            <p className="text-blue-700 text-xs">
              Manage leads, invite members
            </p>
          </div>
          <div>
            <div className="flex items-center font-medium text-blue-900 mb-1">
              <Eye className="h-4 w-4 mr-1" />
              Member
            </div>
            <p className="text-blue-700 text-xs">View leads and add comments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
