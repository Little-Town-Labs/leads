/**
 * Vitest setup file
 * Runs before all tests to set up global mocks and environment
 */

// Set required environment variables for tests
process.env.EXA_API_KEY = 'test-exa-api-key';
process.env.ENCRYPTION_SECRET = 'a'.repeat(64);
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.CLERK_SECRET_KEY = 'test-clerk-secret';
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-publishable';
process.env.CLERK_WEBHOOK_SECRET = 'test-webhook-secret';
