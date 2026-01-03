import { Redis } from '@upstash/redis';

/**
 * Rate Limiting Service
 *
 * Implements IP-based rate limiting using Upstash Redis for distributed state.
 * Uses sliding window algorithm for accurate rate limiting.
 */

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export interface RateLimitConfig {
  requests: number;      // Number of requests allowed
  windowMs: number;      // Time window in milliseconds
  keyPrefix: string;     // Redis key prefix (e.g., 'rl:submit')
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter: number;    // Seconds until next request allowed
}

/**
 * Check if client has exceeded rate limit
 *
 * Uses Redis sorted sets with sliding window algorithm for accurate rate limiting.
 *
 * @param ip - Client IP address (from X-Forwarded-For or socket)
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Get count of requests in current window
    const count = await redis.zcount(key, windowStart, now);

    if (count >= config.requests) {
      // Rate limit exceeded
      const oldestRequest = await redis.zrange<Array<{ score: number; member: string }>>(key, 0, 0, { withScores: true });
      const resetAt = oldestRequest.length > 0
        ? new Date(oldestRequest[0].score + config.windowMs)
        : new Date(now + config.windowMs);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now) / 1000),
      };
    }

    // Add this request to the sorted set
    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });

    // Clean up old entries outside the window
    await redis.zremrangebyscore(key, '-inf', windowStart);

    // Set expiry on the key (cleanup)
    await redis.expire(key, Math.ceil(config.windowMs / 1000) + 1);

    return {
      allowed: true,
      remaining: config.requests - count - 1,
      resetAt: new Date(now + config.windowMs),
      retryAfter: 0,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request on error to prevent blocking legitimate traffic
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: new Date(Date.now() + config.windowMs),
      retryAfter: 0,
    };
  }
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  /**
   * Form submission endpoint
   * 10 requests per minute per IP
   */
  FORM_SUBMIT: {
    requests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:submit',
  },

  /**
   * Assessment submission endpoint
   * 10 requests per minute per IP
   */
  ASSESSMENT_SUBMIT: {
    requests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:assessment',
  },

  /**
   * Demo assessment submission
   * 10 requests per minute per IP
   */
  DEMO_SUBMIT: {
    requests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:demo',
  },

  /**
   * Assessment questions endpoint (read-only)
   * 30 requests per minute per IP (higher limit for reads)
   */
  ASSESSMENT_QUESTIONS: {
    requests: 30,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:questions',
  },

  /**
   * Quiz submission endpoint
   * 10 requests per minute per IP
   */
  QUIZ_SUBMIT: {
    requests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:quiz',
  },
};

/**
 * Helper to extract client IP from request
 *
 * Checks X-Forwarded-For header first (Vercel, proxies),
 * falls back to 'unknown' if not found.
 *
 * @param request - Next.js Request object
 * @returns Client IP address
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first
    return forwarded.split(',')[0].trim();
  }

  // Fallback for local development
  return 'unknown';
}
