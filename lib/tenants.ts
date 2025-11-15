/**
 * Tenant helper functions
 * Provides utilities for querying and managing multi-tenant data
 */

import { db } from '@/db';
import { tenants, quizQuestions, type Tenant } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { cache } from 'react';

/**
 * Get tenant by subdomain (cached for performance)
 * Used by middleware and dynamic routes
 *
 * @example
 * const tenant = await getTenantBySubdomain('lead-agent');
 */
export const getTenantBySubdomain = cache(async (subdomain: string): Promise<Tenant | null> => {
  const results = await db
    .select()
    .from(tenants)
    .where(eq(tenants.subdomain, subdomain))
    .limit(1);

  return results[0] || null;
});

/**
 * Get tenant by custom domain
 * Used when clients have custom domains mapped
 *
 * @example
 * const tenant = await getTenantByCustomDomain('leads.acme.com');
 */
export const getTenantByCustomDomain = cache(async (domain: string): Promise<Tenant | null> => {
  const results = await db
    .select()
    .from(tenants)
    .where(eq(tenants.customDomain, domain))
    .limit(1);

  return results[0] || null;
});

/**
 * Get tenant by Clerk organization ID
 * Used when authenticating users
 *
 * @example
 * const tenant = await getTenantByClerkOrgId('org_2abc123');
 */
export const getTenantByClerkOrgId = cache(async (clerkOrgId: string): Promise<Tenant | null> => {
  const results = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkOrgId, clerkOrgId))
    .limit(1);

  return results[0] || null;
});

/**
 * Get tenant by ID
 *
 * @example
 * const tenant = await getTenantById('uuid-here');
 */
export const getTenantById = cache(async (id: string): Promise<Tenant | null> => {
  const results = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, id))
    .limit(1);

  return results[0] || null;
});

/**
 * Get quiz questions for a tenant's organization
 * Returns questions sorted by question_number
 *
 * @example
 * const questions = await getQuizQuestions('org_id_here');
 */
export const getQuizQuestions = cache(async (orgId: string) => {
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.orgId, orgId))
    .orderBy(quizQuestions.questionNumber);

  return questions;
});

/**
 * Extract subdomain from hostname
 * Handles both production and localhost scenarios
 *
 * @example
 * extractSubdomain('lead-agent.leadagent.com') // 'lead-agent'
 * extractSubdomain('lead-agent.localhost') // 'lead-agent'
 * extractSubdomain('leadagent.com') // null (main domain)
 * extractSubdomain('localhost:3000') // null (main domain)
 */
export function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Split by dots
  const parts = host.split('.');

  // For localhost (e.g., lead-agent.localhost)
  if (host.includes('localhost')) {
    if (parts.length === 2 && parts[1] === 'localhost') {
      return parts[0]; // Return subdomain
    }
    return null; // Just localhost, no subdomain
  }

  // Handle Vercel deployment URLs (*.vercel.app)
  // Support tenant subdomains like: timeless-tech.leads-five-tau.vercel.app
  if (host.endsWith('.vercel.app')) {
    // If we have 4+ parts (subdomain.project.vercel.app), extract tenant subdomain
    if (parts.length >= 4) {
      return parts[0]; // Return the tenant subdomain (e.g., 'timeless-tech')
    }
    return null; // No tenant subdomain (just project.vercel.app)
  }

  // Handle custom production domain: leads.littletownlabs.site
  // Base domain: leads.littletownlabs.site (3 parts) - no subdomain
  // Tenant subdomain: timeless-tech.leads.littletownlabs.site (4 parts) - extract subdomain
  if (host.endsWith('.littletownlabs.site') || host === 'leads.littletownlabs.site') {
    if (parts.length >= 4) {
      // Don't treat 'www' as a tenant subdomain
      if (parts[0] === 'www') {
        return null;
      }
      return parts[0]; // Return subdomain (e.g., 'timeless-tech')
    }
    return null; // Base domain, no subdomain
  }

  // For other production domains (e.g., lead-agent.leadagent.com)
  if (parts.length >= 3) {
    // Don't treat 'www' as a tenant subdomain
    if (parts[0] === 'www') {
      return null;
    }
    return parts[0]; // Return subdomain
  }

  // Main domain - no subdomain
  return null;
}

/**
 * Check if tenant has reached usage limits
 *
 * @example
 * const canSubmitQuiz = await checkUsageLimit(tenant, 'quiz');
 * const canRunWorkflow = await checkUsageLimit(tenant, 'workflow');
 */
export function checkUsageLimit(
  tenant: Tenant,
  type: 'quiz' | 'workflow'
): boolean {
  const { currentUsage, usageLimits } = tenant;

  if (type === 'quiz') {
    return currentUsage.quizCompletionsThisMonth < usageLimits.maxQuizCompletionsMonthly;
  }

  if (type === 'workflow') {
    return currentUsage.aiWorkflowsThisMonth < usageLimits.maxAiWorkflowsMonthly;
  }

  return false;
}

/**
 * Increment usage counter for a tenant
 * Should be called after quiz submission or workflow execution
 *
 * @example
 * await incrementUsage(tenantId, 'quiz');
 * await incrementUsage(tenantId, 'workflow');
 */
export async function incrementUsage(
  tenantId: string,
  type: 'quiz' | 'workflow'
): Promise<void> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return;

  const { currentUsage } = tenant;

  // Check if we need to reset monthly counters
  const lastReset = new Date(currentUsage.lastResetDate);
  const now = new Date();
  const shouldReset =
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  let updatedUsage;
  if (shouldReset) {
    // Reset counters for new month
    updatedUsage = {
      quizCompletionsThisMonth: type === 'quiz' ? 1 : 0,
      aiWorkflowsThisMonth: type === 'workflow' ? 1 : 0,
      lastResetDate: now.toISOString(),
    };
  } else {
    // Increment counter
    updatedUsage = {
      ...currentUsage,
      quizCompletionsThisMonth:
        type === 'quiz'
          ? currentUsage.quizCompletionsThisMonth + 1
          : currentUsage.quizCompletionsThisMonth,
      aiWorkflowsThisMonth:
        type === 'workflow'
          ? currentUsage.aiWorkflowsThisMonth + 1
          : currentUsage.aiWorkflowsThisMonth,
    };
  }

  await db
    .update(tenants)
    .set({ currentUsage: updatedUsage })
    .where(eq(tenants.id, tenantId));
}

/**
 * Get tenant from request headers (set by middleware)
 * Use this in API routes to get the current tenant
 *
 * @example
 * // In API route:
 * const tenant = await getTenantFromRequest(request);
 */
export async function getTenantFromRequest(request: Request): Promise<Tenant | null> {
  const subdomain = request.headers.get('x-tenant-subdomain');
  if (!subdomain) return null;

  return getTenantBySubdomain(subdomain);
}
