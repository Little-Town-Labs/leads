import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock Redis methods using vi.hoisted to avoid temporal dead zone
const { mockZcount, mockZadd, mockZrange, mockZremrangebyscore, mockExpire } = vi.hoisted(() => ({
  mockZcount: vi.fn(),
  mockZadd: vi.fn(),
  mockZrange: vi.fn(),
  mockZremrangebyscore: vi.fn(),
  mockExpire: vi.fn(),
}));

// Mock Upstash Redis before importing rate-limit
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(() => ({
    zcount: mockZcount,
    zadd: mockZadd,
    zrange: mockZrange,
    zremrangebyscore: mockZremrangebyscore,
    expire: mockExpire,
  })),
}));

// Import after mock is set up
import { checkRateLimit, getClientIp, RATE_LIMITS } from './rate-limit';

describe('Rate Limiting Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZcount.mockReset();
    mockZadd.mockReset();
    mockZrange.mockReset();
    mockZremrangebyscore.mockReset();
    mockExpire.mockReset();
  });

  describe('checkRateLimit', () => {
    it('should allow request when under limit', async () => {
      // Mock: current count is 5, limit is 10
      mockZcount.mockResolvedValue(5);

      const result = await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 10 - 5 - 1
      expect(result.retryAfter).toBe(0);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should block request when limit exceeded', async () => {
      // Mock: current count is 10, limit is 10
      mockZcount.mockResolvedValue(10);
      mockZrange.mockResolvedValue([
        { score: Date.now() - 30000 }, // Oldest request 30s ago
      ]);

      const result = await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should add request to Redis when allowed', async () => {
      mockZcount.mockResolvedValue(2);

      await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(mockZadd).toHaveBeenCalled();
      expect(mockZremrangebyscore).toHaveBeenCalled();
      expect(mockExpire).toHaveBeenCalled();
    });

    it('should not add request to Redis when blocked', async () => {
      mockZcount.mockResolvedValue(10);
      mockZrange.mockResolvedValue([{ score: Date.now() }]);

      await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(mockZadd).not.toHaveBeenCalled();
    });

    it('should use correct Redis key with prefix', async () => {
      mockZcount.mockResolvedValue(0);

      await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(mockZcount).toHaveBeenCalledWith(
        'rl:submit:192.168.1.1',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle different IPs independently', async () => {
      mockZcount.mockResolvedValue(0);

      await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);
      await checkRateLimit('192.168.1.2', RATE_LIMITS.FORM_SUBMIT);

      expect(mockZcount).toHaveBeenCalledWith(
        'rl:submit:192.168.1.1',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockZcount).toHaveBeenCalledWith(
        'rl:submit:192.168.1.2',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should fail open on Redis error (allow request)', async () => {
      mockZcount.mockRejectedValue(new Error('Redis connection failed'));

      const result = await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.FORM_SUBMIT.requests);
    });

    it('should clean up old entries', async () => {
      mockZcount.mockResolvedValue(5);

      await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(mockZremrangebyscore).toHaveBeenCalledWith(
        'rl:submit:192.168.1.1',
        '-inf',
        expect.any(Number)
      );
    });

    it('should set expiry on Redis key', async () => {
      mockZcount.mockResolvedValue(5);

      await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(mockExpire).toHaveBeenCalledWith(
        'rl:submit:192.168.1.1',
        expect.any(Number)
      );
    });

    it('should calculate correct retry-after time', async () => {
      const now = Date.now();
      const windowMs = 60000; // 1 minute

      mockZcount.mockResolvedValue(10);
      mockZrange.mockResolvedValue([
        { score: now - 30000 }, // 30 seconds ago
      ]);

      const result = await checkRateLimit('192.168.1.1', {
        requests: 10,
        windowMs,
        keyPrefix: 'test',
      });

      expect(result.allowed).toBe(false);
      // Should be approximately 30 seconds (60s window - 30s elapsed)
      expect(result.retryAfter).toBeGreaterThan(25);
      expect(result.retryAfter).toBeLessThan(35);
    });
  });

  describe('RATE_LIMITS configuration', () => {
    it('should have FORM_SUBMIT config', () => {
      expect(RATE_LIMITS.FORM_SUBMIT).toBeDefined();
      expect(RATE_LIMITS.FORM_SUBMIT.requests).toBe(10);
      expect(RATE_LIMITS.FORM_SUBMIT.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.FORM_SUBMIT.keyPrefix).toBe('rl:submit');
    });

    it('should have ASSESSMENT_SUBMIT config', () => {
      expect(RATE_LIMITS.ASSESSMENT_SUBMIT).toBeDefined();
      expect(RATE_LIMITS.ASSESSMENT_SUBMIT.requests).toBe(10);
      expect(RATE_LIMITS.ASSESSMENT_SUBMIT.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.ASSESSMENT_SUBMIT.keyPrefix).toBe('rl:assessment');
    });

    it('should have DEMO_SUBMIT config', () => {
      expect(RATE_LIMITS.DEMO_SUBMIT).toBeDefined();
      expect(RATE_LIMITS.DEMO_SUBMIT.requests).toBe(10);
      expect(RATE_LIMITS.DEMO_SUBMIT.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.DEMO_SUBMIT.keyPrefix).toBe('rl:demo');
    });

    it('should have ASSESSMENT_QUESTIONS config with higher limit', () => {
      expect(RATE_LIMITS.ASSESSMENT_QUESTIONS).toBeDefined();
      expect(RATE_LIMITS.ASSESSMENT_QUESTIONS.requests).toBe(30);
      expect(RATE_LIMITS.ASSESSMENT_QUESTIONS.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.ASSESSMENT_QUESTIONS.keyPrefix).toBe('rl:questions');
    });

    it('should have QUIZ_SUBMIT config', () => {
      expect(RATE_LIMITS.QUIZ_SUBMIT).toBeDefined();
      expect(RATE_LIMITS.QUIZ_SUBMIT.requests).toBe(10);
      expect(RATE_LIMITS.QUIZ_SUBMIT.windowMs).toBe(60 * 1000);
      expect(RATE_LIMITS.QUIZ_SUBMIT.keyPrefix).toBe('rl:quiz');
    });
  });

  describe('getClientIp', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should handle multiple IPs in X-Forwarded-For (take first)', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should trim whitespace from IP', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '  192.168.1.100  ',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.100');
    });

    it('should return "unknown" if no X-Forwarded-For header', () => {
      const request = new Request('http://localhost:3000');

      const ip = getClientIp(request);
      expect(ip).toBe('unknown');
    });

    it('should handle IPv6 addresses', () => {
      const request = new Request('http://localhost:3000', {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('Sliding window behavior', () => {
    it('should allow requests throughout the window', async () => {
      const now = Date.now();

      // Simulate 9 requests spread across 60 seconds
      for (let i = 0; i < 9; i++) {
        mockZcount.mockResolvedValue(i);

        const result = await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block 11th request within window', async () => {
      mockZcount.mockResolvedValue(10);
      mockZrange.mockResolvedValue([{ score: Date.now() }]);

      const result = await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(false);
    });

    it('should allow request again after old requests slide out of window', async () => {
      const now = Date.now();

      // Simulate old requests outside the window
      mockZcount.mockResolvedValue(0); // After cleanup, count is 0

      const result = await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(true);
    });
  });

  describe('Custom rate limit configs', () => {
    it('should work with custom config', async () => {
      mockZcount.mockResolvedValue(0);

      const customConfig = {
        requests: 5,
        windowMs: 30000, // 30 seconds
        keyPrefix: 'custom',
      };

      const result = await checkRateLimit('192.168.1.1', customConfig);

      expect(result.allowed).toBe(true);
      expect(mockZcount).toHaveBeenCalledWith(
        'custom:192.168.1.1',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should enforce custom limit', async () => {
      const customConfig = {
        requests: 3,
        windowMs: 60000,
        keyPrefix: 'strict',
      };

      mockZcount.mockResolvedValue(3);
      mockZrange.mockResolvedValue([{ score: Date.now() }]);

      const result = await checkRateLimit('192.168.1.1', customConfig);

      expect(result.allowed).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty IP string', async () => {
      mockZcount.mockResolvedValue(0);

      const result = await checkRateLimit('', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(true);
      expect(mockZcount).toHaveBeenCalledWith(
        'rl:submit:',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle special characters in IP', async () => {
      mockZcount.mockResolvedValue(0);

      const result = await checkRateLimit('::1', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(true);
    });

    it('should handle exactly at limit', async () => {
      mockZcount.mockResolvedValue(9);

      const result = await checkRateLimit('192.168.1.1', RATE_LIMITS.FORM_SUBMIT);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0); // 10 - 9 - 1 = 0
    });

    it('should handle zero window time edge case', async () => {
      mockZcount.mockResolvedValue(0);

      const result = await checkRateLimit('192.168.1.1', {
        requests: 10,
        windowMs: 1, // 1ms window
        keyPrefix: 'instant',
      });

      expect(result.allowed).toBe(true);
    });
  });
});
