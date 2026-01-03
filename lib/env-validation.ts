import { z } from 'zod';

/**
 * Environment Variable Validation
 *
 * Validates required and optional environment variables on application startup.
 * Provides clear error messages for misconfigured environments.
 */

const envSchema = z.object({
  // Required - Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Required - Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_WEBHOOK_SECRET: z.string().min(1, 'CLERK_WEBHOOK_SECRET is required'),

  // Required - Encryption
  ENCRYPTION_SECRET: z
    .string()
    .refine(
      (val) => val.length === 64 && /^[0-9a-fA-F]+$/.test(val),
      'ENCRYPTION_SECRET must be exactly 64 hexadecimal characters (32 bytes). Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    ),

  // AI Providers - At least one should be configured for platform default
  OPENROUTER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Rate Limiting - Upstash Redis (optional but recommended for production)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email - Resend (optional but required for cost alerts and email sending)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // Slack Integration - Optional (all or none required)
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_CHANNEL_ID: z.string().optional(),

  // Search & Research - Optional
  EXA_API_KEY: z.string().optional(),

  // Application URL - Optional
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables on startup
 *
 * Throws detailed error if validation fails.
 * Call this early in the application lifecycle (e.g., in root layout).
 *
 * @returns Validated environment variables
 * @throws Error with detailed validation messages
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment variable validation failed:');
    console.error('');
    result.error.issues.forEach((issue) => {
      console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('');
    console.error('Please check your .env file and ensure all required variables are set.');
    console.error('See .env.example for reference.');

    throw new Error(
      'Invalid environment configuration. See logs above for details.'
    );
  }

  // Cross-field validation
  const warnings: string[] = [];

  // Slack - all or none
  const hasSlackToken = !!result.data.SLACK_BOT_TOKEN;
  const hasSlackSecret = !!result.data.SLACK_SIGNING_SECRET;
  const hasSlackChannel = !!result.data.SLACK_CHANNEL_ID;

  if (hasSlackToken && !hasSlackSecret) {
    throw new Error('SLACK_BOT_TOKEN requires SLACK_SIGNING_SECRET');
  }

  if (hasSlackSecret && !hasSlackToken) {
    throw new Error('SLACK_SIGNING_SECRET requires SLACK_BOT_TOKEN');
  }

  if ((hasSlackToken || hasSlackSecret) && !hasSlackChannel) {
    warnings.push('SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET set but SLACK_CHANNEL_ID is missing - Slack notifications will not be sent');
  }

  // Upstash Redis - both URL and token required
  const hasRedisUrl = !!result.data.UPSTASH_REDIS_REST_URL;
  const hasRedisToken = !!result.data.UPSTASH_REDIS_REST_TOKEN;

  if (hasRedisUrl && !hasRedisToken) {
    throw new Error('UPSTASH_REDIS_REST_URL requires UPSTASH_REDIS_REST_TOKEN');
  }

  if (hasRedisToken && !hasRedisUrl) {
    throw new Error('UPSTASH_REDIS_REST_TOKEN requires UPSTASH_REDIS_REST_URL');
  }

  if (!hasRedisUrl && !hasRedisToken) {
    warnings.push('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN not set - rate limiting will fail open (allow all requests)');
  }

  // Resend - both key and from email recommended
  const hasResendKey = !!result.data.RESEND_API_KEY;
  const hasResendFrom = !!result.data.RESEND_FROM_EMAIL;

  if (hasResendKey && !hasResendFrom) {
    warnings.push('RESEND_API_KEY set but RESEND_FROM_EMAIL is missing - emails will use default sender');
  }

  if (!hasResendKey) {
    warnings.push('RESEND_API_KEY not set - cost alerts and email sending will be disabled');
  }

  // AI Provider - at least one for platform default
  const hasAnyAiProvider = !!(
    result.data.OPENROUTER_API_KEY ||
    result.data.OPENAI_API_KEY ||
    result.data.ANTHROPIC_API_KEY
  );

  if (!hasAnyAiProvider) {
    warnings.push('No AI provider API keys set (OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY) - platform will rely on customer BYOK only');
  }

  // Print warnings if any
  if (warnings.length > 0) {
    console.warn('⚠️  Environment configuration warnings:');
    console.warn('');
    warnings.forEach((warning) => {
      console.warn(`  • ${warning}`);
    });
    console.warn('');
  } else {
    console.log('✅ Environment variables validated successfully');
  }

  return result.data;
}

/**
 * Global flag to ensure validation runs only once
 */
declare global {
   
  var __envValidated: boolean;
}

// Validate on module load (server-side only)
if (!globalThis.__envValidated && typeof window === 'undefined') {
  validateEnv();
  globalThis.__envValidated = true;
}

/**
 * Typed environment variables
 * Use this instead of process.env for type safety
 */
export const env = process.env as Env;
