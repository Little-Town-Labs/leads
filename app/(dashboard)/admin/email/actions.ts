'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
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
  } catch (error: any) {
    console.error('Error updating email settings:', error);
    return { error: error.message || 'Failed to update email settings' };
  }
}
