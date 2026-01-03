# Implementation Plan: Lead Qualification SaaS Platform - Critical Issues Resolution

## Executive Summary

This plan addresses 9 critical issues, 4 secondary issues, and performance optimizations identified in the comprehensive codebase assessment. Implementation follows a **phased rollout** approach prioritizing critical bugs, security, testing, and performance.

**Timeline**: 5 weeks (52 hours estimated)
**Testing Framework**: Vitest
**Rate Limiting**: Upstash Redis
**Database**: pgvector migration for embeddings

---

## Phase 1: Critical Bug Fixes (Week 1 - 4 hours)

### 1.1 Workflow Error Handling Bug - CRITICAL

**Problem**: `workflows/inbound/index.ts:80` - Cannot access `workflow.id` if `stepCreateWorkflow()` fails, preventing proper error finalization.

**Files to Modify**:
- `workflows/inbound/index.ts` (lines 46-86)

**Changes**:

1. **Line 46-51**: Initialize workflow as nullable
```typescript
export const workflowInbound = async (lead: Lead | LeadWithTenant) => {
  'use workflow';

  let workflow: Workflow | null = null;  // NEW: Initialize as null

  try {
    workflow = await stepCreateWorkflow(lead);  // CHANGED: Remove const
```

2. **Lines 78-83**: Replace catch block with proper finalization
```typescript
  } catch (error) {
    console.error('Workflow error:', error);

    // NEW: If workflow was created, mark it as failed
    if (workflow?.id) {
      try {
        await stepFinalizeWorkflow(workflow.id, 'failed');
      } catch (finalizeError) {
        console.error('Failed to finalize workflow on error:', finalizeError);
      }
    }

    throw error;
  }
};
```

**Testing**: Unit test for catch block with stepCreateWorkflow failure, integration test verifying 'failed' status

**Complexity**: Simple (1 hour)

---

### 1.2 Cost Alerts Email - INCOMPLETE FEATURE

**Problem**: `lib/ai-usage.ts:185` - TODO comment, alerts logged but not emailed via Resend.

**Files to Modify**:
- `lib/ai-usage.ts` (lines 4, 185-194)

**Changes**:

1. **Line 4**: Add Resend import
```typescript
import { Resend } from 'resend';
```

2. **After line 194**: Create email function
```typescript
async function sendCostAlertEmail(
  orgId: string,
  email: string,
  monthlyCost: number,
  monthlyThreshold: number
): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'alerts@leadagent.com',
      to: email,
      subject: 'AI Usage Cost Alert - Threshold Exceeded',
      html: `
        <h2>AI Usage Cost Alert</h2>
        <p>Your organization's monthly AI usage cost has exceeded the configured threshold.</p>
        <ul>
          <li><strong>Current Monthly Cost:</strong> $${monthlyCost / 100}</li>
          <li><strong>Threshold:</strong> $${monthlyThreshold / 100}</li>
          <li><strong>Exceeded By:</strong> $${(monthlyCost - monthlyThreshold) / 100}</li>
        </ul>
        <p><a href="https://leadagent.com/admin/ai-settings">View Usage Details</a></p>
      `,
    });

    console.log(`Cost alert email sent to ${email} for org ${orgId}`);
  } catch (error) {
    console.error(`Failed to send cost alert email to ${email}:`, error);
  }
}
```

3. **Lines 184-190**: Update checkCostAlerts to call email function
```typescript
    if (monthlyCost >= costAlerts.monthlyThreshold) {
      await sendCostAlertEmail(orgId, costAlerts.email, monthlyCost, costAlerts.monthlyThreshold);
      console.warn(
        `Cost alert triggered for ${orgId}: $${monthlyCost / 100} >= $${costAlerts.monthlyThreshold / 100}`
      );
    }
```

**Environment Variables**: Ensure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env`

**Testing**: Unit test with mocked Resend, verify email content

**Complexity**: Simple (2 hours)

---

### 1.3 Permission Check Bug - Wrong Permission for Reject

**Problem**: `app/api/leads/[id]/reject/route.ts:11` uses `'leads:approve'` instead of `'leads:reject'`

**Files to Modify**:
- `lib/permissions.ts` (lines 7-22, 35-50, 59-70)
- `app/api/leads/[id]/reject/route.ts` (line 11)

**Changes**:

1. **permissions.ts line 7-22**: Add to Permission type
```typescript
export type Permission =
  | 'leads:read'
  | 'leads:write'
  | 'leads:approve'
  | 'leads:reject'      // NEW
  | 'leads:delete'
  // ... rest unchanged
```

2. **permissions.ts line 35-50**: Add to org:admin role
```typescript
  'org:admin': [
    'leads:read',
    'leads:write',
    'leads:approve',
    'leads:reject',      // NEW
    'leads:delete',
    // ... rest
  ],
```

3. **permissions.ts line 59-70**: Add to org:manager role
```typescript
  'org:manager': [
    'leads:read',
    'leads:write',
    'leads:approve',
    'leads:reject',      // NEW
    'leads:export',
    // ... rest
  ],
```

4. **reject/route.ts line 11**: Update permission check
```typescript
    await requirePermission('leads:reject');  // CHANGED from 'leads:approve'
```

**Testing**: Verify both endpoints use different permissions

**Complexity**: Simple (1 hour)

---

## Phase 2: Security Hardening (Week 2 - 13 hours)

### 2.1 Rate Limiting Infrastructure - CRITICAL SECURITY GAP

**Problem**: No rate limiting on public endpoints - vulnerable to DDoS, resource exhaustion, cost spikes.

**Affected Endpoints**:
- `app/api/submit/route.ts` (main form)
- `app/api/assessment/submit/route.ts` (assessment)
- `app/api/assessment/demo-submit/route.ts` (demo)
- All public GET endpoints

**Files to Create/Modify**:
- `lib/rate-limit.ts` (NEW)
- `app/api/submit/route.ts` (add rate limiting)
- `app/api/assessment/submit/route.ts` (add rate limiting)
- `app/api/assessment/demo-submit/route.ts` (add rate limiting)

**New File: `lib/rate-limit.ts`**:
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export interface RateLimitConfig {
  requests: number;
  windowMs: number;
  keyPrefix: string;
}

export async function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter: number;
}> {
  const key = `${config.keyPrefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    const count = await redis.zcount(key, windowStart, now);

    if (count >= config.requests) {
      const oldestRequest = await redis.zrange(key, 0, 0, { withscores: true });
      const resetAt = oldestRequest.length > 0
        ? new Date(oldestRequest[0][1] as number + config.windowMs)
        : new Date(now + config.windowMs);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now) / 1000),
      };
    }

    await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
    await redis.zremrangebyscore(key, '-inf', windowStart);
    await redis.expire(key, Math.ceil(config.windowMs / 1000) + 1);

    return {
      allowed: true,
      remaining: config.requests - count - 1,
      resetAt: new Date(now + config.windowMs),
      retryAfter: 0,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open - allow request on error
    return {
      allowed: true,
      remaining: config.requests,
      resetAt: new Date(Date.now() + config.windowMs),
      retryAfter: 0,
    };
  }
}

export const RATE_LIMITS = {
  FORM_SUBMIT: {
    requests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:submit',
  },
  ASSESSMENT_SUBMIT: {
    requests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:assessment',
  },
  ASSESSMENT_QUESTIONS: {
    requests: 30,
    windowMs: 60 * 1000,
    keyPrefix: 'rl:questions',
  },
};
```

**Update `app/api/submit/route.ts`** (after line 14, after bot detection):
```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

export async function POST(request: Request) {
  // ... existing bot detection ...

  // NEW: Rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(clientIp, RATE_LIMITS.FORM_SUBMIT);

  if (!rateLimitResult.allowed) {
    return Response.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMITS.FORM_SUBMIT.requests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        }
      }
    );
  }

  // ... rest of endpoint ...
}
```

**Apply same pattern** to assessment submit endpoints.

**Environment Variables** (add to `.env`):
```bash
UPSTASH_REDIS_REST_URL=https://[region]-[id].upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Dependencies** (add to `package.json`):
```json
"@upstash/redis": "^1.35.0"
```

**Testing**: Unit tests with mocked Redis, integration tests verifying 429 responses, load tests

**Complexity**: Medium (8 hours)

---

### 2.2 Bot Detection on Assessment Endpoints

**Problem**: Assessment endpoints missing bot detection (only main form has it)

**Files to Modify**:
- `app/api/assessment/submit/route.ts` (line 15)
- `app/api/assessment/demo-submit/route.ts` (line 15)

**Changes**: Add after opening POST function, before body validation
```typescript
  // Bot detection
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
```

**Testing**: Unit test with mocked botid module

**Complexity**: Simple (2 hours)

---

### 2.3 Environment Variable Validation

**Problem**: Missing startup validation for required environment variables

**Files to Create**:
- `lib/env-validation.ts` (NEW)

**Files to Modify**:
- `app/layout.tsx` (add validation call)

**New File: `lib/env-validation.ts`**:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  ENCRYPTION_SECRET: z
    .string()
    .refine(
      (val) => val.length === 64 && /^[0-9a-fA-F]+$/.test(val),
      'ENCRYPTION_SECRET must be 64 hex characters'
    ),

  OPENROUTER_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_SIGNING_SECRET: z.string().optional(),
  SLACK_CHANNEL_ID: z.string().optional(),

  EXA_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment variable validation failed:');
    result.error.errors.forEach((error) => {
      console.error(`  ${error.path.join('.')}: ${error.message}`);
    });

    throw new Error(
      'Invalid environment configuration. See logs above for details.'
    );
  }

  // Cross-field validation
  if (result.data.SLACK_BOT_TOKEN && !result.data.SLACK_SIGNING_SECRET) {
    throw new Error('SLACK_BOT_TOKEN requires SLACK_SIGNING_SECRET');
  }

  if (result.data.SLACK_SIGNING_SECRET && !result.data.SLACK_BOT_TOKEN) {
    throw new Error('SLACK_SIGNING_SECRET requires SLACK_BOT_TOKEN');
  }

  return result.data;
}

// Validate on module load
declare global {
  var __envValidated: boolean;
}

if (!globalThis.__envValidated) {
  validateEnv();
  globalThis.__envValidated = true;
}

export const env = process.env as Env;
```

**Update `app/layout.tsx`** (top of file):
```typescript
import { validateEnv } from '@/lib/env-validation';

validateEnv(); // Will throw on startup if invalid

export default function RootLayout({ children }) {
  // ... rest
}
```

**Testing**: Unit tests for each validation case

**Complexity**: Simple (3 hours)

---

## Phase 3: Testing Infrastructure (Week 3-4 - 21 hours)

### 3.1 Vitest Setup

**Files to Create**:
- `vitest.config.ts` (NEW)

**Files to Modify**:
- `package.json` (scripts, devDependencies)

**New File: `vitest.config.ts`**:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.d.ts',
        'vitest.config.ts',
      ],
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**Update `package.json`**:

Add scripts:
```json
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
```

Add devDependencies:
```json
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "msw": "^2.0.0"
  }
```

**Testing**: Run `pnpm test` to verify setup works

**Complexity**: Medium (4 hours)

---

### 3.2 Unit Tests - Encryption Module

**Files to Create**:
- `lib/encryption.test.ts` (NEW)

**Test Coverage**:
- Encrypt/decrypt round-trip
- Different ciphertext for same key (random IV)
- Empty key rejection
- Missing ENCRYPTION_SECRET handling
- Invalid format handling
- Tampered ciphertext detection

**Key Tests**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptApiKey, decryptApiKey, validateEncryption } from './encryption';

describe('Encryption Module', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_SECRET = 'a'.repeat(64);
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_SECRET;
  });

  it('should encrypt and decrypt correctly', () => {
    const apiKey = 'sk-test-key-12345';
    const encrypted = encryptApiKey(apiKey);
    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(apiKey);
  });

  it('should produce different ciphertext for same key', () => {
    const apiKey = 'sk-test-key-12345';
    const encrypted1 = encryptApiKey(apiKey);
    const encrypted2 = encryptApiKey(apiKey);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should throw error for empty key', () => {
    expect(() => encryptApiKey('')).toThrow('API key cannot be empty');
  });

  it('should throw error for tampered ciphertext', () => {
    const apiKey = 'sk-test-key-12345';
    const encrypted = encryptApiKey(apiKey);
    const tampered = encrypted.split(':')[0] + ':tampered:data';
    expect(() => decryptApiKey(tampered)).toThrow();
  });
});
```

**Complexity**: Simple (3 hours)

---

### 3.3 Unit Tests - AI Resolver & Rate Limiting

**Files to Create**:
- `lib/ai-resolver.test.ts` (NEW)
- `lib/rate-limit.test.ts` (NEW)

**AI Resolver Tests**:
- Return chat model from config
- Return default model if config empty
- Handle decryption errors
- Test each provider type

**Rate Limiting Tests**:
- Allow request within limit
- Block request exceeding limit
- Return correct headers
- Handle Redis errors gracefully
- Test sliding window

**Complexity**: Simple + Medium (6 hours total)

---

### 3.4 Integration Tests - Workflows & API Routes

**Files to Create**:
- `workflows/inbound/index.test.ts` (NEW)
- `app/api/submit/route.test.ts` (NEW)

**Workflow Tests**:
- Finalize as failed if stepCreateWorkflow fails
- Finalize as failed if stepResearch fails
- Finalize as completed on success
- Error handling for each step

**API Route Tests**:
- Return 429 when rate limited
- Bot detection blocks requests
- Valid submission creates lead
- Invalid data returns 400

**Complexity**: Medium (8 hours)

---

## Phase 4: Performance Optimization (Week 4-5 - 8 hours)

### 4.1 pgvector Migration for Knowledge Base

**Problem**: Embeddings stored as text, cosine similarity in JavaScript - inefficient for scale

**Files to Create**:
- `db/migrations/0001_add_pgvector.sql` (NEW)

**Files to Modify**:
- `db/schema.ts` (add vector columns)
- `lib/knowledge-base.ts` (use pgvector queries)

**Migration SQL** (`db/migrations/0001_add_pgvector.sql`):
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector columns
ALTER TABLE knowledge_base_docs
  ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

ALTER TABLE knowledge_base_chunks
  ADD COLUMN IF NOT EXISTS embedding_vector vector(1536);

-- Create indexes for faster similarity search
CREATE INDEX IF NOT EXISTS kb_docs_embedding_vector_idx
  ON knowledge_base_docs
  USING ivfflat (embedding_vector vector_cosine_ops);

CREATE INDEX IF NOT EXISTS kb_chunks_embedding_vector_idx
  ON knowledge_base_chunks
  USING ivfflat (embedding_vector vector_cosine_ops);

-- Migrate existing embeddings
UPDATE knowledge_base_docs
  SET embedding_vector = embedding::vector
  WHERE embedding IS NOT NULL AND embedding_vector IS NULL;

UPDATE knowledge_base_chunks
  SET embedding_vector = embedding::vector
  WHERE embedding IS NOT NULL AND embedding_vector IS NULL;
```

**Update `db/schema.ts`**:

In `knowledgeBaseDocs` table (after line 352):
```typescript
    embeddingVector: vector('embedding_vector', { dimensions: 1536 }),
```

In `knowledgeBaseChunks` table (after line 375):
```typescript
    embeddingVector: vector('embedding_vector', { dimensions: 1536 }),
```

**Update `lib/knowledge-base.ts`**:

Replace `searchKnowledgeBase()` function (lines 81-150) with pgvector query:
```typescript
export async function searchKnowledgeBase(
  orgId: string,
  query: string,
  topK: number = 3
): Promise<Array<{ content: string; title: string; similarity: number }>> {
  try {
    const queryEmbedding = await generateEmbedding(query, orgId);

    // Use pgvector cosine similarity operator (<=>)
    const chunks = await db
      .select({
        id: knowledgeBaseChunks.id,
        content: knowledgeBaseChunks.content,
        embeddingVector: knowledgeBaseChunks.embeddingVector,
        docId: knowledgeBaseChunks.docId,
        similarity: sql<number>`
          1 - (${knowledgeBaseChunks.embeddingVector} <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)})
        `,
      })
      .from(knowledgeBaseChunks)
      .innerJoin(knowledgeBaseDocs, eq(knowledgeBaseChunks.docId, knowledgeBaseDocs.id))
      .where(
        and(
          eq(knowledgeBaseChunks.orgId, orgId),
          eq(knowledgeBaseDocs.isActive, true)
        )
      )
      .orderBy((t) => desc(t.similarity))
      .limit(topK);

    if (chunks.length === 0) {
      return [];
    }

    const docIds = [...new Set(chunks.map((c) => c.docId))];
    const docs = await db
      .select({
        id: knowledgeBaseDocs.id,
        title: knowledgeBaseDocs.title,
      })
      .from(knowledgeBaseDocs)
      .where(sql`${knowledgeBaseDocs.id} IN (${sql.join(docIds.map((id) => sql`${id}`), sql`, `)})`);

    const docMap = new Map(docs.map((doc) => [doc.id, doc.title ?? 'Unknown']));

    return chunks.map((chunk) => ({
      content: chunk.content,
      title: docMap.get(chunk.docId) ?? 'Unknown',
      similarity: chunk.similarity,
    }));
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}
```

Update `addDocumentToKnowledgeBase()` to include vector (line 200+):
```typescript
    const [doc] = await db
      .insert(knowledgeBaseDocs)
      .values({
        orgId,
        title,
        content,
        contentType,
        metadata,
        embedding: JSON.stringify(docEmbedding),
        embeddingVector: docEmbedding,  // NEW
      })
      .returning();

    // ... later in chunk insertion ...
      await db.insert(knowledgeBaseChunks).values({
        orgId,
        docId: doc.id,
        chunkIndex: i,
        content: chunks[i],
        embedding: JSON.stringify(chunkEmbedding),
        embeddingVector: chunkEmbedding,  // NEW
        tokenCount: Math.ceil(chunks[i].length / 4),
      });
```

Remove `cosineSimilarity()` function (lines 59-76) - no longer needed.

**Run Migration**:
```bash
pnpm db:migrate
```

**Testing**: Benchmark test comparing performance, integration test verifying correct results

**Complexity**: Medium (6 hours)

---

### 4.2 Database Index Optimization

**Files to Create**:
- `db/migrations/0002_optimize_indexes.sql` (NEW)

**Migration SQL**:
```sql
-- Add missing indexes for common queries

CREATE INDEX IF NOT EXISTS leads_org_status_idx
  ON leads(org_id, status);

CREATE INDEX IF NOT EXISTS leads_created_updated_idx
  ON leads(created_at DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS workflows_org_lead_idx
  ON workflows(org_id, lead_id);

CREATE INDEX IF NOT EXISTS workflows_status_created_idx
  ON workflows(status, created_at DESC);

CREATE INDEX IF NOT EXISTS quiz_responses_org_lead_idx
  ON quiz_responses(org_id, lead_id);

CREATE INDEX IF NOT EXISTS lead_scores_tier_created_idx
  ON lead_scores(org_id, tier, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_org_created_idx
  ON ai_usage(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_usage_operation_idx
  ON ai_usage(org_id, operation, created_at DESC);

CREATE INDEX IF NOT EXISTS email_sends_org_status_idx
  ON email_sends(org_id, status);

CREATE INDEX IF NOT EXISTS email_sends_lead_idx
  ON email_sends(org_id, lead_id, sent_at DESC);
```

**Run Migration**:
```bash
pnpm db:migrate
```

**Complexity**: Simple (2 hours)

---

## Phase 5: Polish & Maintainability (Week 5 - 6 hours)

### 5.1 Soft Deletes Implementation

**Files to Modify**:
- `db/schema.ts` (add deletedAt columns to tables)
- Update query helpers to filter deleted records

**Schema Changes**: Add to leads, workflows, knowledge_base_docs tables (after updatedAt):
```typescript
    deletedAt: timestamp('deleted_at'),
    deletedBy: text('deleted_by'),
    deletionReason: text('deletion_reason'),
```

**Query Pattern**: Update all queries to filter:
```typescript
.where(and(
  eq(leads.orgId, orgId),
  isNull(leads.deletedAt)  // Only non-deleted
))
```

**Complexity**: Medium (4 hours)

---

### 5.2 Documentation Updates

**Files to Modify**:
- `CLAUDE.md` (update with new features)
- `.env.example` (add new env vars)

**Add to `.env.example`**:
```bash
# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Email Alerts (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

**Update CLAUDE.md**: Document rate limiting, testing setup, pgvector migration

**Complexity**: Simple (2 hours)

---

## Critical Files Summary

| File | Changes | Priority | Phase |
|------|---------|----------|-------|
| `workflows/inbound/index.ts` | Error handling fix | CRITICAL | 1 |
| `lib/ai-usage.ts` | Cost alert emails | HIGH | 1 |
| `lib/permissions.ts` | Add reject permission | MEDIUM | 1 |
| `lib/rate-limit.ts` | NEW - Rate limiting | CRITICAL | 2 |
| `app/api/submit/route.ts` | Add rate limiting | CRITICAL | 2 |
| `lib/env-validation.ts` | NEW - Env validation | HIGH | 2 |
| `vitest.config.ts` | NEW - Test setup | HIGH | 3 |
| `lib/encryption.test.ts` | NEW - Security tests | HIGH | 3 |
| `db/schema.ts` | pgvector columns | MEDIUM | 4 |
| `lib/knowledge-base.ts` | pgvector queries | MEDIUM | 4 |
| `db/migrations/0001_add_pgvector.sql` | NEW - Migration | MEDIUM | 4 |
| `db/migrations/0002_optimize_indexes.sql` | NEW - Indexes | LOW | 4 |

---

## Dependencies & Sequencing

**Parallel Work**:
- Phase 1 can run immediately
- Phase 2 (env validation) can overlap with Phase 1
- Phase 3 setup can start during Phase 2
- Phase 4 can run in parallel with Phase 3

**Sequential Dependencies**:
- Phase 3.4 (rate limit tests) requires Phase 2.1 (rate limiting implementation)
- Phase 3 tests require Phase 1 bug fixes to be complete

**Recommended Sequence**:
1. Week 1: Phase 1 complete + Phase 2 env validation
2. Week 2: Phase 2 rate limiting + Phase 3 Vitest setup
3. Week 3: Phase 3 unit tests + integration tests
4. Week 4: Phase 3 coverage completion + Phase 4 pgvector
5. Week 5: Phase 5 polish + documentation

---

## Testing Strategy

**Coverage Goals**:
- Overall: 70%+
- Critical paths (encryption, auth, workflows): 95%+
- Security modules: 90%+

**Test Distribution**:
- Unit tests: 70% (encryption, AI resolver, rate limiting, permissions)
- Integration tests: 20% (API routes, workflows, database operations)
- E2E tests: 10% (full lead submission flow, optional for this plan)

**Key Test Files**:
- `lib/encryption.test.ts` - Security critical
- `lib/rate-limit.test.ts` - Security critical
- `workflows/inbound/index.test.ts` - Business logic critical
- `app/api/submit/route.test.ts` - Integration critical

---

## Environment Setup

**New Environment Variables**:
```bash
# Rate Limiting
UPSTASH_REDIS_REST_URL=https://[region]-[id].upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Email Alerts
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=alerts@yourdomain.com
```

**New Dependencies**:
```bash
pnpm add @upstash/redis resend
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 msw
```

---

## Success Criteria

**Phase 1 Complete**:
- ✅ Workflow errors properly finalized as 'failed'
- ✅ Cost alert emails sent via Resend
- ✅ Separate permissions for approve/reject

**Phase 2 Complete**:
- ✅ Rate limiting active on all public endpoints
- ✅ 429 responses with proper headers
- ✅ Bot detection on assessment endpoints
- ✅ Environment validation on startup

**Phase 3 Complete**:
- ✅ Vitest running with 70%+ coverage
- ✅ Encryption module 95%+ covered
- ✅ Workflow error paths tested
- ✅ API routes tested

**Phase 4 Complete**:
- ✅ pgvector extension enabled
- ✅ Knowledge base using native vector search
- ✅ Database indexes optimized
- ✅ Performance improvement verified

**Phase 5 Complete**:
- ✅ Soft deletes implemented
- ✅ Documentation updated
- ✅ All changes committed and deployed

---

## Estimated Timeline

| Phase | Duration | Hours | Completion |
|-------|----------|-------|------------|
| Phase 1 | Week 1 | 4 | Critical bugs fixed |
| Phase 2 | Week 2 | 13 | Security hardened |
| Phase 3 | Week 3-4 | 21 | Tests implemented |
| Phase 4 | Week 4-5 | 8 | Performance optimized |
| Phase 5 | Week 5 | 6 | Polish complete |
| **Total** | **5 weeks** | **52 hours** | **Production ready** |

---

## Post-Implementation Tasks

1. Run full test suite: `pnpm test:coverage`
2. Verify rate limiting in production with load test
3. Monitor cost alerts for first month
4. Benchmark pgvector performance vs old implementation
5. Review security with penetration testing
6. Update team documentation
7. Create runbook for common issues

---

This plan provides a comprehensive, actionable roadmap to address all critical issues while maintaining code quality and test coverage through a phased rollout approach.
