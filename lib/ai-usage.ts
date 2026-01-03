import { db } from '@/db';
import { aiUsage, type NewAiUsage } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { getAiConfig } from './ai-config';
import { Resend } from 'resend';

/**
 * AI Usage Tracking Service
 *
 * Tracks all AI API requests for cost monitoring, analytics, and billing.
 * Supports token counting, cost estimation, and usage reports.
 */

/**
 * Usage tracking data for an AI request
 */
export interface AiUsageData {
  orgId: string;
  operation: 'research' | 'qualification' | 'email_generation' | 'embedding' | 'knowledge_base' | 'other';
  provider: 'openrouter' | 'openai' | 'anthropic' | 'platform_default';
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  actualCost?: number; // In cents (e.g., 123 = $1.23)
  estimatedCost?: number; // In cents
  leadId?: string;
  workflowId?: string;
  requestDuration?: number; // In milliseconds
  success: boolean;
  errorMessage?: string;
}

/**
 * Track an AI request
 *
 * Call this after every AI API call to log usage.
 * Should be called from services that use AI models.
 *
 * @param data - Usage data to track
 *
 * @example
 * const startTime = Date.now();
 * try {
 *   const result = await generateText({ model, prompt });
 *   await trackAiUsage({
 *     orgId: 'org_2abc123',
 *     operation: 'qualification',
 *     provider: 'openrouter',
 *     model: 'anthropic/claude-3.5-sonnet',
 *     inputTokens: result.usage.promptTokens,
 *     outputTokens: result.usage.completionTokens,
 *     totalTokens: result.usage.totalTokens,
 *     leadId: leadId,
 *     requestDuration: Date.now() - startTime,
 *     success: true,
 *   });
 * } catch (error) {
 *   await trackAiUsage({
 *     orgId: 'org_2abc123',
 *     operation: 'qualification',
 *     provider: 'openrouter',
 *     model: 'anthropic/claude-3.5-sonnet',
 *     inputTokens: 0,
 *     outputTokens: 0,
 *     totalTokens: 0,
 *     leadId: leadId,
 *     requestDuration: Date.now() - startTime,
 *     success: false,
 *     errorMessage: error.message,
 *   });
 * }
 */
export async function trackAiUsage(data: AiUsageData): Promise<void> {
  try {
    // Check if usage tracking is enabled for this org
    const config = await getAiConfig(data.orgId);
    if (!config.usageTracking) {
      return; // Skip tracking if disabled
    }

    // Estimate cost if not provided
    const estimatedCost = data.estimatedCost || estimateCost(data.model, data.totalTokens);

    await db.insert(aiUsage).values({
      orgId: data.orgId,
      operation: data.operation,
      provider: data.provider,
      model: data.model,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      totalTokens: data.totalTokens || 0,
      actualCost: data.actualCost,
      estimatedCost,
      leadId: data.leadId,
      workflowId: data.workflowId,
      requestDuration: data.requestDuration,
      success: data.success,
      errorMessage: data.errorMessage,
    });

    // Check cost alerts if enabled
    if (config.costAlerts?.enabled) {
      await checkCostAlerts(data.orgId, config.costAlerts);
    }
  } catch (error) {
    // Don't fail the main operation if tracking fails
    console.error('Failed to track AI usage:', error);
  }
}

/**
 * Estimate cost for an AI request
 *
 * Uses rough pricing estimates. Actual costs may vary.
 * Costs are in cents (e.g., 123 = $1.23).
 *
 * @param model - Model ID
 * @param totalTokens - Total tokens used
 * @returns Estimated cost in cents
 */
function estimateCost(model: string, totalTokens: number): number {
  // Rough pricing estimates per million tokens (in cents)
  // These are approximations - update based on actual pricing
  const pricingTable: Record<string, number> = {
    // OpenRouter/Anthropic Claude
    'anthropic/claude-3.5-sonnet': 300, // $3/M input, $15/M output (avg $9/M)
    'anthropic/claude-3-opus': 1500, // $15/M input, $75/M output (avg $45/M)
    'anthropic/claude-3-sonnet': 300,
    'anthropic/claude-3-haiku': 25,

    // OpenRouter/OpenAI
    'openai/gpt-4o': 250, // $2.50/M input, $10/M output (avg $6.25/M)
    'openai/gpt-4-turbo': 1000,
    'openai/gpt-4': 3000,
    'openai/gpt-3.5-turbo': 50,

    // OpenRouter/Google
    'google/gemini-pro-1.5': 125,
    'google/gemini-flash-1.5': 10,

    // OpenRouter/Meta
    'meta-llama/llama-3.1-405b-instruct': 300,
    'meta-llama/llama-3.1-70b-instruct': 50,

    // Embeddings
    'text-embedding-3-small': 2, // $0.02/M tokens
    'text-embedding-3-large': 13, // $0.13/M tokens
  };

  // Find matching price or use default
  let pricePerMillion = 100; // Default $1/M tokens

  for (const [key, price] of Object.entries(pricingTable)) {
    if (model.includes(key) || model === key) {
      pricePerMillion = price;
      break;
    }
  }

  // Calculate cost in cents
  return Math.round((totalTokens / 1_000_000) * pricePerMillion);
}

/**
 * Check cost alerts for an organization
 *
 * Sends alerts if monthly spending exceeds threshold.
 *
 * @param orgId - Clerk organization ID
 * @param costAlerts - Cost alert configuration
 */
async function checkCostAlerts(
  orgId: string,
  costAlerts: {
    enabled: boolean;
    monthlyThreshold: number;
    email: string;
  }
): Promise<void> {
  try {
    const monthlyUsage = await getMonthlyUsage(orgId);
    const monthlyCost = monthlyUsage.totalCost;

    if (monthlyCost >= costAlerts.monthlyThreshold) {
      await sendCostAlertEmail(orgId, costAlerts.email, monthlyCost, costAlerts.monthlyThreshold);
      console.warn(
        `Cost alert triggered for ${orgId}: $${monthlyCost / 100} >= $${costAlerts.monthlyThreshold / 100}`
      );
    }
  } catch (error) {
    console.error('Failed to check cost alerts:', error);
  }
}

/**
 * Send cost alert email to organization
 *
 * @param orgId - Clerk organization ID
 * @param email - Email address to send alert to
 * @param monthlyCost - Current monthly cost in cents
 * @param monthlyThreshold - Threshold that was exceeded in cents
 */
async function sendCostAlertEmail(
  orgId: string,
  email: string,
  monthlyCost: number,
  monthlyThreshold: number
): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set, skipping cost alert email');
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'alerts@leadagent.com',
      to: email,
      subject: 'AI Usage Cost Alert - Threshold Exceeded',
      html: `
        <h2>AI Usage Cost Alert</h2>
        <p>Your organization's monthly AI usage cost has exceeded the configured threshold.</p>
        <ul>
          <li><strong>Current Monthly Cost:</strong> $${(monthlyCost / 100).toFixed(2)}</li>
          <li><strong>Threshold:</strong> $${(monthlyThreshold / 100).toFixed(2)}</li>
          <li><strong>Exceeded By:</strong> $${((monthlyCost - monthlyThreshold) / 100).toFixed(2)}</li>
        </ul>
        <p>Please review your AI usage settings and consider adjusting your threshold or optimizing your usage.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://leadagent.com'}/admin/ai-settings">View Usage Details</a></p>
      `,
    });

    console.log(`Cost alert email sent to ${email} for org ${orgId}`);
  } catch (error) {
    console.error(`Failed to send cost alert email to ${email}:`, error);
    // Don't throw - we don't want to fail the usage tracking if email fails
  }
}

/**
 * Get usage statistics for an organization
 *
 * @param orgId - Clerk organization ID
 * @param startDate - Start date for the report (default: 30 days ago)
 * @param endDate - End date for the report (default: now)
 * @returns Usage statistics
 *
 * @example
 * const usage = await getUsageStats('org_2abc123');
 * console.log(`Total cost: $${usage.totalCost / 100}`);
 * console.log(`Total tokens: ${usage.totalTokens}`);
 */
export async function getUsageStats(
  orgId: string,
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: Date = new Date()
) {
  try {
    const records = await db.query.aiUsage.findMany({
      where: and(
        eq(aiUsage.orgId, orgId),
        gte(aiUsage.createdAt, startDate),
        lte(aiUsage.createdAt, endDate)
      ),
      orderBy: [desc(aiUsage.createdAt)],
    });

    const totalTokens = records.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
    const totalCost = records.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);
    const totalRequests = records.length;
    const successfulRequests = records.filter((r) => r.success).length;
    const failedRequests = records.filter((r) => !r.success).length;

    // Group by operation
    const byOperation = records.reduce(
      (acc, r) => {
        if (!acc[r.operation]) {
          acc[r.operation] = { count: 0, tokens: 0, cost: 0 };
        }
        acc[r.operation].count++;
        acc[r.operation].tokens += r.totalTokens || 0;
        acc[r.operation].cost += r.actualCost || r.estimatedCost || 0;
        return acc;
      },
      {} as Record<string, { count: number; tokens: number; cost: number }>
    );

    // Group by model
    const byModel = records.reduce(
      (acc, r) => {
        if (!acc[r.model]) {
          acc[r.model] = { count: 0, tokens: 0, cost: 0 };
        }
        acc[r.model].count++;
        acc[r.model].tokens += r.totalTokens || 0;
        acc[r.model].cost += r.actualCost || r.estimatedCost || 0;
        return acc;
      },
      {} as Record<string, { count: number; tokens: number; cost: number }>
    );

    return {
      totalTokens,
      totalCost, // In cents
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      byOperation,
      byModel,
      records,
    };
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    // Return empty stats if table doesn't exist or query fails
    return {
      totalTokens: 0,
      totalCost: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      successRate: 0,
      byOperation: {},
      byModel: {},
      records: [],
    };
  }
}

/**
 * Get current month usage for an organization
 *
 * @param orgId - Clerk organization ID
 * @returns Current month usage statistics
 */
export async function getMonthlyUsage(orgId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return getUsageStats(orgId, startOfMonth, now);
}

/**
 * Get usage by lead
 *
 * Useful for understanding AI costs per lead.
 *
 * @param orgId - Clerk organization ID
 * @param leadId - Lead ID
 * @returns Usage statistics for this lead
 */
export async function getLeadUsage(orgId: string, leadId: string) {
  const records = await db.query.aiUsage.findMany({
    where: and(eq(aiUsage.orgId, orgId), eq(aiUsage.leadId, leadId)),
    orderBy: [desc(aiUsage.createdAt)],
  });

  const totalTokens = records.reduce((sum, r) => sum + (r.totalTokens || 0), 0);
  const totalCost = records.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);

  return {
    totalTokens,
    totalCost, // In cents
    records,
  };
}

/**
 * Export usage data for an organization
 *
 * Returns CSV-formatted data for billing and reporting.
 *
 * @param orgId - Clerk organization ID
 * @param startDate - Start date
 * @param endDate - End date
 * @returns CSV string
 */
export async function exportUsageData(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const records = await db.query.aiUsage.findMany({
    where: and(
      eq(aiUsage.orgId, orgId),
      gte(aiUsage.createdAt, startDate),
      lte(aiUsage.createdAt, endDate)
    ),
    orderBy: [desc(aiUsage.createdAt)],
  });

  // CSV header
  const csv = [
    [
      'Date',
      'Operation',
      'Provider',
      'Model',
      'Input Tokens',
      'Output Tokens',
      'Total Tokens',
      'Cost (USD)',
      'Lead ID',
      'Workflow ID',
      'Duration (ms)',
      'Success',
      'Error',
    ].join(','),
  ];

  // CSV rows
  for (const record of records) {
    const cost = (record.actualCost || record.estimatedCost || 0) / 100;
    csv.push(
      [
        record.createdAt?.toISOString() || '',
        record.operation,
        record.provider,
        record.model,
        record.inputTokens || 0,
        record.outputTokens || 0,
        record.totalTokens || 0,
        cost.toFixed(4),
        record.leadId || '',
        record.workflowId || '',
        record.requestDuration || 0,
        record.success ? 'Yes' : 'No',
        record.errorMessage || '',
      ].join(',')
    );
  }

  return csv.join('\n');
}
