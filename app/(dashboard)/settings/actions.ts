'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

/**
 * Invite a member to the organization via email
 */
export async function inviteMember(formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  const email = formData.get('email') as string;
  const role = (formData.get('role') as string) || 'org:member';

  if (!email) {
    return { error: 'Email is required' };
  }

  try {
    const client = await clerkClient();

    // Create an invitation
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      emailAddress: email,
      role: role as 'org:admin' | 'org:member',
    });

    revalidatePath('/settings');
    return { success: true, invitation };
  } catch (error: any) {
    console.error('Error inviting member:', error);
    return { error: error.message || 'Failed to invite member' };
  }
}

/**
 * Update a member's role in the organization
 */
export async function updateMemberRole(membershipId: string, newRole: string) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const client = await clerkClient();

    await client.organizations.updateOrganizationMembership({
      organizationId: orgId,
      userId: membershipId,
      role: newRole as 'org:admin' | 'org:member',
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating member role:', error);
    return { error: error.message || 'Failed to update member role' };
  }
}

/**
 * Remove a member from the organization
 */
export async function removeMember(userId: string) {
  const { orgId, userId: currentUserId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  // Prevent self-removal
  if (userId === currentUserId) {
    return { error: 'You cannot remove yourself from the organization' };
  }

  try {
    const client = await clerkClient();

    await client.organizations.deleteOrganizationMembership({
      organizationId: orgId,
      userId: userId,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error removing member:', error);
    return { error: error.message || 'Failed to remove member' };
  }
}
