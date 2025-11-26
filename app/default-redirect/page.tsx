import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Default redirect page for Clerk
 * Handles Clerk's internal redirects and routes users to appropriate locations
 */
export default async function DefaultRedirectPage() {
  const { userId, orgId } = await auth();

  // If not authenticated, redirect to sign-in
  if (!userId) {
    redirect('/sign-in');
  }

  // If user has an organization, redirect to dashboard
  if (orgId) {
    redirect('/dashboard');
  }

  // Otherwise, redirect to organization selection
  redirect('/select-organization');
}
