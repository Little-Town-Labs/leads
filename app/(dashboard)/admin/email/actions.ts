'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tenants, emailSequences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateEmailSettings(formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const emailFromName = formData.get('emailFromName') as string || undefined;
    const emailFromAddress = formData.get('emailFromAddress') as string || undefined;
    const quizCompletionRedirect = formData.get('quizCompletionRedirect') as string || undefined;
    const enableAiResearch = formData.get('enableAiResearch') === 'true';
    const qualificationThreshold = parseInt(formData.get('qualificationThreshold') as string) || 60;

    // Get current tenant settings
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.clerkOrgId, orgId),
    });

    if (!tenant) {
      return { error: 'Tenant not found' };
    }

    await db
      .update(tenants)
      .set({
        settings: {
          ...tenant.settings,
          emailFromName,
          emailFromAddress,
          quizCompletionRedirect,
          enableAiResearch,
          qualificationThreshold,
        },
        updatedAt: new Date(),
      })
      .where(eq(tenants.clerkOrgId, orgId));

    revalidatePath('/admin/email');
    return { success: true };
  } catch (error) {
    console.error('Error updating email settings:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update email settings' };
  }
}

export async function createEmailSequence(formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const tier = formData.get('tier') as string;
    const sequenceNumber = parseInt(formData.get('sequenceNumber') as string);
    const delayDays = parseInt(formData.get('delayDays') as string);
    const subject = formData.get('subject') as string;
    const body = formData.get('body') as string;
    const isActive = formData.get('isActive') === 'true';

    await db.insert(emailSequences).values({
      orgId,
      tier,
      sequenceNumber,
      delayDays,
      subject,
      body,
      isActive,
    });

    revalidatePath('/admin/email');
    return { success: true };
  } catch (error) {
    console.error('Error creating email sequence:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create email sequence' };
  }
}

export async function updateEmailSequence(id: string, formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const tier = formData.get('tier') as string;
    const sequenceNumber = parseInt(formData.get('sequenceNumber') as string);
    const delayDays = parseInt(formData.get('delayDays') as string);
    const subject = formData.get('subject') as string;
    const body = formData.get('body') as string;
    const isActive = formData.get('isActive') === 'true';

    await db
      .update(emailSequences)
      .set({
        tier,
        sequenceNumber,
        delayDays,
        subject,
        body,
        isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(emailSequences.id, id), eq(emailSequences.orgId, orgId)));

    revalidatePath('/admin/email');
    return { success: true };
  } catch (error) {
    console.error('Error updating email sequence:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update email sequence' };
  }
}

export async function deleteEmailSequence(id: string) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    await db
      .delete(emailSequences)
      .where(and(eq(emailSequences.id, id), eq(emailSequences.orgId, orgId)));

    revalidatePath('/admin/email');
    return { success: true };
  } catch (error) {
    console.error('Error deleting email sequence:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete email sequence' };
  }
}

export async function toggleEmailSequenceStatus(id: string, isActive: boolean) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    await db
      .update(emailSequences)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(emailSequences.id, id), eq(emailSequences.orgId, orgId)));

    revalidatePath('/admin/email');
    return { success: true };
  } catch (error) {
    console.error('Error toggling email sequence status:', error);
    return { error: error instanceof Error ? error.message : 'Failed to toggle email sequence status' };
  }
}
