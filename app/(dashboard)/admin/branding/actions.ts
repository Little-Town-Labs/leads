'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateBranding(formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const logoUrl = formData.get('logoUrl') as string || undefined;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const fontFamily = formData.get('fontFamily') as string || undefined;
    const faviconUrl = formData.get('faviconUrl') as string || undefined;

    await db
      .update(tenants)
      .set({
        branding: {
          logoUrl,
          primaryColor,
          secondaryColor,
          fontFamily,
          faviconUrl,
        },
        updatedAt: new Date(),
      })
      .where(eq(tenants.clerkOrgId, orgId));

    revalidatePath('/admin/branding');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating branding:', error);
    return { error: error.message || 'Failed to update branding' };
  }
}

export async function updateLandingPage(formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const heroTitle = formData.get('heroTitle') as string;
    const heroSubtitle = formData.get('heroSubtitle') as string;
    const ctaText = formData.get('ctaText') as string;

    await db
      .update(tenants)
      .set({
        landingPage: {
          heroTitle,
          heroSubtitle,
          ctaText,
        },
        updatedAt: new Date(),
      })
      .where(eq(tenants.clerkOrgId, orgId));

    revalidatePath('/admin/branding');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating landing page:', error);
    return { error: error.message || 'Failed to update landing page' };
  }
}
