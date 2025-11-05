import { clerkClient } from '@clerk/nextjs/server';

/**
 * Subscription tier definitions
 */
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: 'Starter',
    leadLimit: 100,
    userLimit: 3,
    price: 49,
  },
  pro: {
    name: 'Pro',
    leadLimit: 1000,
    userLimit: 10,
    price: 199,
  },
  enterprise: {
    name: 'Enterprise',
    leadLimit: Infinity,
    userLimit: Infinity,
    price: null,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Organization metadata interface
 */
export interface OrganizationMetadata {
  subscriptionTier: SubscriptionTier;
  monthlyLeadLimit: number;
  usageThisMonth: number;
  usageResetDate: string; // ISO date string
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  [key: string]: unknown; // Index signature for Clerk compatibility
}

/**
 * Check if an organization has reached its usage limit
 */
export async function checkUsageLimit(orgId: string): Promise<boolean> {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as Partial<OrganizationMetadata>;

  const usage = metadata.usageThisMonth || 0;
  const limit = metadata.monthlyLeadLimit || SUBSCRIPTION_TIERS.starter.leadLimit;

  return usage < limit;
}

/**
 * Increment the usage counter for an organization
 */
export async function incrementUsage(orgId: string): Promise<void> {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as Partial<OrganizationMetadata>;

  await client.organizations.updateOrganization(orgId, {
    publicMetadata: {
      ...metadata,
      usageThisMonth: (metadata.usageThisMonth || 0) + 1,
    },
  });
}

/**
 * Reset monthly usage counter for an organization
 */
export async function resetMonthlyUsage(orgId: string): Promise<void> {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as Partial<OrganizationMetadata>;

  await client.organizations.updateOrganization(orgId, {
    publicMetadata: {
      ...metadata,
      usageThisMonth: 0,
      usageResetDate: new Date().toISOString(),
    },
  });
}

/**
 * Get usage statistics for an organization
 */
export async function getUsageStats(orgId: string) {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as Partial<OrganizationMetadata>;

  const tier = metadata.subscriptionTier || 'starter';
  const usage = metadata.usageThisMonth || 0;
  const limit = metadata.monthlyLeadLimit || SUBSCRIPTION_TIERS[tier].leadLimit;

  return {
    tier,
    usage,
    limit,
    remaining: limit === Infinity ? Infinity : limit - usage,
    percentage: limit === Infinity ? 0 : (usage / limit) * 100,
  };
}

/**
 * Initialize metadata for a new organization
 */
export async function initializeOrganizationMetadata(orgId: string): Promise<void> {
  const client = await clerkClient();

  await client.organizations.updateOrganization(orgId, {
    publicMetadata: {
      subscriptionTier: 'starter',
      monthlyLeadLimit: SUBSCRIPTION_TIERS.starter.leadLimit,
      usageThisMonth: 0,
      usageResetDate: new Date().toISOString(),
    } as OrganizationMetadata,
  });
}

/**
 * Update organization subscription tier
 */
export async function updateSubscriptionTier(
  orgId: string,
  tier: SubscriptionTier
): Promise<void> {
  const client = await clerkClient();
  const org = await client.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as Partial<OrganizationMetadata>;

  await client.organizations.updateOrganization(orgId, {
    publicMetadata: {
      ...metadata,
      subscriptionTier: tier,
      monthlyLeadLimit: SUBSCRIPTION_TIERS[tier].leadLimit,
    },
  });
}
