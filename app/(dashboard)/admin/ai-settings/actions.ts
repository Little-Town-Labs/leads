'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getAiConfig, updateAiConfig } from '@/lib/ai-config';
import { encryptApiKey, validateEncryption } from '@/lib/encryption';
import { testAiConfig } from '@/lib/ai-resolver';

/**
 * Get current AI configuration for the organization
 */
export async function getAiConfigAction() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('No organization context');
  }

  const config = await getAiConfig(orgId);

  // Don't return encrypted API key to client
  return {
    ...config,
    hasApiKey: !!config.encryptedApiKey,
    encryptedApiKey: undefined,
  };
}

/**
 * Update AI configuration for the organization
 */
export async function updateAiConfigAction(formData: {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'platform_default';
  chatModel: string;
  embeddingModel: string;
  apiKey?: string;
  openrouterSiteUrl?: string;
  openrouterSiteName?: string;
  usageTracking: boolean;
  costAlertsEnabled: boolean;
  costAlertsThreshold?: number;
  costAlertsEmail?: string;
}) {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('No organization context');
  }

  try {

    console.log('Updating AI config for orgId:', orgId);
    console.log('Form data:', {
      provider: formData.provider,
      chatModel: formData.chatModel,
      embeddingModel: formData.embeddingModel,
      hasApiKey: !!formData.apiKey,
    });

    // Validate encryption is set up if using BYOK
    if (formData.apiKey && formData.provider !== 'platform_default') {
      try {
        validateEncryption();
      } catch (error) {
        throw new Error('Encryption not configured. Set ENCRYPTION_SECRET environment variable.');
      }
    }

    // Encrypt API key if provided
    const encryptedApiKey = formData.apiKey && formData.provider !== 'platform_default'
      ? encryptApiKey(formData.apiKey)
      : undefined;

    // Build config object
    const config = {
      provider: formData.provider,
      models: {
        chat: formData.chatModel,
        embedding: formData.embeddingModel,
      },
      encryptedApiKey,
      openrouterSettings: formData.provider === 'openrouter' ? {
        siteUrl: formData.openrouterSiteUrl,
        siteName: formData.openrouterSiteName,
      } : undefined,
      usageTracking: formData.usageTracking,
      costAlerts: formData.costAlertsEnabled ? {
        enabled: true,
        monthlyThreshold: formData.costAlertsThreshold || 10000, // Default $100
        email: formData.costAlertsEmail || '',
      } : undefined,
    };

    // Update in database
    await updateAiConfig(orgId, config);

    // Revalidate the page
    revalidatePath('/admin/ai-settings');

    return { success: true };
  } catch (error) {
    console.error('updateAiConfigAction error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orgId,
      provider: formData.provider,
      hasApiKey: !!formData.apiKey,
    });
    // Return error message to client
    throw error;
  }
}

/**
 * Test AI configuration
 */
export async function testAiConfigAction() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('No organization context');
  }

  const result = await testAiConfig(orgId);
  return result;
}

/**
 * Reset to platform default
 */
export async function resetToPlatformDefaultAction() {
  const { orgId } = await auth();

  if (!orgId) {
    throw new Error('No organization context');
  }

  await updateAiConfig(orgId, {
    provider: 'platform_default',
    models: {
      chat: 'openai/gpt-4o',
      embedding: 'text-embedding-3-small',
    },
    usageTracking: true,
  });

  revalidatePath('/admin/ai-settings');

  return { success: true };
}
