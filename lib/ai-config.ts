import { db } from '@/db';
import { tenants, type Tenant } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { decryptApiKey } from './encryption';

/**
 * AI Configuration structure stored in tenants.aiConfig
 */
export interface AiConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'platform_default';
  models: {
    chat: string; // e.g., 'anthropic/claude-3.5-sonnet'
    embedding: string; // e.g., 'text-embedding-3-small'
  };
  encryptedApiKey?: string; // AES-256-GCM encrypted
  openrouterSettings?: {
    siteUrl?: string;
    siteName?: string;
  };
  usageTracking: boolean;
  costAlerts?: {
    enabled: boolean;
    monthlyThreshold: number;
    email: string;
  };
}

/**
 * AI Configuration with decrypted API key
 */
export interface DecryptedAiConfig extends Omit<AiConfig, 'encryptedApiKey'> {
  apiKey?: string; // Decrypted API key
}

/**
 * Default AI configuration (uses platform API key)
 */
export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'platform_default',
  models: {
    chat: 'openai/gpt-4o',
    embedding: 'text-embedding-3-small',
  },
  usageTracking: true,
};

/**
 * Get AI configuration for an organization
 *
 * @param orgId - Clerk organization ID
 * @returns AI configuration with encrypted API key
 *
 * @example
 * const config = await getAiConfig('org_2abc123');
 * console.log(config.provider); // 'openrouter'
 */
export async function getAiConfig(orgId: string): Promise<AiConfig> {
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.clerkOrgId, orgId),
      columns: {
        aiConfig: true,
      },
    });

    if (!tenant?.aiConfig) {
      return DEFAULT_AI_CONFIG;
    }

    // TypeScript type assertion - we know the structure from our schema
    return tenant.aiConfig as AiConfig;
  } catch (error) {
    console.error('Failed to get AI config:', error);
    // Return default config on error to prevent service disruption
    return DEFAULT_AI_CONFIG;
  }
}

/**
 * Get AI configuration with decrypted API key
 *
 * @param orgId - Clerk organization ID
 * @returns AI configuration with decrypted API key
 *
 * @example
 * const config = await getDecryptedAiConfig('org_2abc123');
 * console.log(config.apiKey); // 'sk-or-v1-abc123...'
 */
export async function getDecryptedAiConfig(orgId: string): Promise<DecryptedAiConfig> {
  const config = await getAiConfig(orgId);

  // If no encrypted key or using platform default, return as is
  if (!config.encryptedApiKey || config.provider === 'platform_default') {
    return {
      ...config,
      apiKey: undefined,
    };
  }

  try {
    const decryptedKey = decryptApiKey(config.encryptedApiKey);
    return {
      provider: config.provider,
      models: config.models,
      openrouterSettings: config.openrouterSettings,
      usageTracking: config.usageTracking,
      costAlerts: config.costAlerts,
      apiKey: decryptedKey,
    };
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    // Return config without API key on decryption error
    return {
      ...config,
      apiKey: undefined,
    };
  }
}

/**
 * Update AI configuration for an organization
 *
 * @param orgId - Clerk organization ID
 * @param config - New AI configuration (with encrypted API key)
 *
 * @example
 * await updateAiConfig('org_2abc123', {
 *   provider: 'openrouter',
 *   models: {
 *     chat: 'anthropic/claude-3.5-sonnet',
 *     embedding: 'text-embedding-3-small',
 *   },
 *   encryptedApiKey: 'encrypted-string...',
 *   usageTracking: true,
 * });
 */
export async function updateAiConfig(orgId: string, config: AiConfig): Promise<void> {
  try {
    await db
      .update(tenants)
      .set({
        aiConfig: config as any, // Type assertion for JSONB
        updatedAt: new Date(),
      })
      .where(eq(tenants.clerkOrgId, orgId));
  } catch (error) {
    console.error('Failed to update AI config:', error);
    throw new Error('Failed to update AI configuration');
  }
}

/**
 * Check if organization is using custom API key (BYOK)
 *
 * @param orgId - Clerk organization ID
 * @returns true if using custom API key, false if using platform default
 *
 * @example
 * const isUsingByok = await isUsingCustomApiKey('org_2abc123');
 * if (isUsingByok) {
 *   console.log('Customer is using their own API key');
 * }
 */
export async function isUsingCustomApiKey(orgId: string): Promise<boolean> {
  const config = await getAiConfig(orgId);
  return config.provider !== 'platform_default' && !!config.encryptedApiKey;
}

/**
 * Get the platform default API key from environment
 * Used when customer doesn't have their own API key
 *
 * @returns Platform API key from environment
 */
export function getPlatformApiKey(): string {
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Platform API key not configured. Set AI_GATEWAY_API_KEY or OPENROUTER_API_KEY environment variable.'
    );
  }

  return apiKey;
}

/**
 * Get the appropriate API key for an organization
 * Returns customer's key if they have one, otherwise platform key
 *
 * @param orgId - Clerk organization ID
 * @returns API key to use for this organization
 *
 * @example
 * const apiKey = await getApiKeyForOrg('org_2abc123');
 * // Returns customer's key if BYOK, otherwise platform key
 */
export async function getApiKeyForOrg(orgId: string): Promise<string> {
  const config = await getDecryptedAiConfig(orgId);

  // If customer has their own API key, use it
  if (config.apiKey && config.provider !== 'platform_default') {
    return config.apiKey;
  }

  // Otherwise, use platform key
  return getPlatformApiKey();
}
