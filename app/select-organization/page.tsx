import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { OrganizationList } from '@clerk/nextjs';

export default async function SelectOrganizationPage() {
  const { userId, orgId } = await auth();

  // Require authentication
  if (!userId) {
    redirect('/sign-in');
  }

  // If user already has an org, redirect to dashboard
  if (orgId) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">L</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Select an Organization
          </h2>
          <p className="text-gray-600">
            Choose an organization to continue, or create a new one to get started.
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <OrganizationList
            afterSelectOrganizationUrl="/dashboard"
            afterCreateOrganizationUrl="/dashboard"
            hidePersonal={true}
            skipInvitationScreen={false}
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none',
              },
            }}
          />
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Need help? Contact support at{' '}
          <a href="mailto:support@leadagent.com" className="text-blue-600 hover:text-blue-700">
            support@leadagent.com
          </a>
        </p>
      </div>
    </div>
  );
}
