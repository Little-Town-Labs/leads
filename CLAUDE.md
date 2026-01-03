# CLAUDE.md

Development guide for Claude Code when working with this repository.

## Overview

Multi-tenant SaaS platform for AI-powered lead qualification with subdomain routing, Clerk Organizations, and durable workflow execution.

**Stack**: Next.js 16 (App Router), Drizzle ORM, Neon PostgreSQL, Clerk Auth, Vercel AI SDK, Workflow DevKit

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Development server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix ESLint issues
pnpm type-check       # TypeScript type checking
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run tests with Vitest
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
pnpm test:ui          # Open Vitest UI
```

## Architecture

### Multi-Tenant Data Model

**Database Schema** ([db/schema.ts](db/schema.ts)):
```typescript
// All tables include organizationId for tenant isolation
organizations      // Synced from Clerk via webhook
users             // Synced from Clerk via webhook
organizationMembers // Links users to organizations
leads             // Lead data per organization
quizzes           // Custom assessment quizzes per org
```

**Subdomain Routing** ([middleware.ts](middleware.ts)):
- Extracts subdomain from host header
- Matches to `organizations.subdomain`
- Sets in request headers for route handlers
- Falls back to organization selection page

### Workflow Execution

**Lead Processing Flow**:
1. Form submission → [app/api/submit/route.ts](app/api/submit/route.ts) validates with Zod
2. `start(workflowInbound, [data])` kicks off durable workflow
3. **Research step** → AI Agent with tools (search, fetchUrl, crmSearch)
4. **Qualification step** → `generateObject` with structured schema
5. **Email generation** → `generateText` for personalized outreach
6. **Human approval** → Dashboard or Slack with approve/reject
7. **Send email** → On approval (placeholder to implement)

**Workflow DevKit Directives**:
- `'use workflow'` → Marks function as durable workflow
- `'use step'` → Marks step for automatic retry/recovery
- Start workflows: `start(workflowFunction, [args])`

### AI SDK Patterns & BYOK (Bring Your Own Key)

**✅ IMPLEMENTED**: Multi-tenant AI with customer-managed API keys

**Per-Organization AI Configuration**:
- Each organization can use their own AI provider and models
- Supports OpenRouter (100+ models), OpenAI Direct, Anthropic Direct
- Platform default (free tier with limits) or custom BYOK (unlimited)
- All AI requests automatically use organization's configured model

**AI Services** ([lib/ai-resolver.ts](lib/ai-resolver.ts)):
```typescript
// Get model identifier for organization (returns string like 'openai/gpt-4o')
const model = await getChatModel(orgId);

// Use in AI SDK functions - AI SDK v5 handles provider resolution
const { object } = await generateObject({
  model,  // String identifier - AI SDK resolves to provider
  schema,
  prompt
});
```

**Research Agent** ([lib/services.ts](lib/services.ts)):
```typescript
// Creates agent with org's configured model
const agent = await createResearchAgent(orgId);
const { text } = await agent.generate({
  prompt: '...'
});
```

**Model Resolution**:
- Returns model identifier strings (e.g., 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet')
- AI SDK v5 automatically resolves providers based on API keys in environment
- Customer API keys managed per-request via getApiKeyForOrg()
- No additional provider packages needed (works with base `ai` package)

**Usage Tracking** ([lib/ai-usage.ts](lib/ai-usage.ts)):
- All AI requests tracked for cost monitoring
- Token counts, actual/estimated costs, provider, model
- Per-lead and per-operation analytics
- Monthly spending reports and cost alerts
- **Email Alerts**: Automatic email notifications via Resend when monthly cost threshold exceeded

**Encryption** ([lib/encryption.ts](lib/encryption.ts)):
- Customer API keys encrypted with AES-256-GCM
- Stored in `tenants.aiConfig` JSONB column
- Automatic decryption when resolving models

### Clerk Integration

**Organization Management**:
- Webhook handler: [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts)
- Syncs organization and user data to database
- Handles create/update/delete events
- Organization switcher: [app/select-organization/page.tsx](app/select-organization/page.tsx)

**Role-Based Access**:
- Admin role can manage members and settings
- Regular members can view analytics and leads

### Rate Limiting & Security

**Rate Limiting** ([lib/rate-limit.ts](lib/rate-limit.ts)):
- Upstash Redis-based rate limiting with sliding window algorithm
- Protects public endpoints from DDoS and resource exhaustion
- Fail-open pattern (allows requests if Redis unavailable)
- Returns 429 status with `Retry-After` header when limit exceeded
- Configurable limits per endpoint type

**Rate Limit Configuration**:
```typescript
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

// In API route
const clientIp = getClientIp(request);
const result = await checkRateLimit(clientIp, RATE_LIMITS.FORM_SUBMIT);

if (!result.allowed) {
  return Response.json({ error: 'Too many requests' }, {
    status: 429,
    headers: {
      'Retry-After': result.retryAfter.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
    }
  });
}
```

**Default Rate Limits**:
- Form submissions: 10 requests/minute per IP
- Assessment submissions: 10 requests/minute per IP
- Assessment questions: 30 requests/minute per IP

**Bot Detection**:
- All public form endpoints protected with `botid` package
- Assessment endpoints include bot detection
- Returns 403 Forbidden for detected bots

**Environment Validation** ([lib/env-validation.ts](lib/env-validation.ts)):
- Validates all required environment variables on application startup
- Uses Zod schema for type-safe validation
- Enforces ENCRYPTION_SECRET format (64 hex characters)
- Cross-field validation (e.g., SLACK_BOT_TOKEN requires SLACK_SIGNING_SECRET)
- Application fails fast with detailed error messages if misconfigured

### Knowledge Base & pgvector

**Native Vector Similarity Search**:
- Uses PostgreSQL pgvector extension for semantic search
- IVFFlat indexing for fast similarity queries at scale
- Cosine similarity operator (`<=>`) for native database-level search
- 1536-dimension embeddings (OpenAI text-embedding-3-small compatible)

**pgvector Migration** ([db/migrations/0001_add_pgvector.sql](db/migrations/0001_add_pgvector.sql)):
- Enables pgvector extension
- Adds vector columns to knowledge_base_docs and knowledge_base_chunks
- Creates IVFFlat indexes with 100 lists
- Migrates existing JSON embeddings to native vector type
- Maintains backward compatibility with text embedding fields

**Search Performance**:
- Database-level similarity search (vs JavaScript O(n) iteration)
- Index-accelerated queries for sub-millisecond results
- Automatic filtering of soft-deleted documents
- Configurable topK parameter for result count

**Example Usage**:
```typescript
import { searchKnowledgeBase } from '@/lib/knowledge-base';

const results = await searchKnowledgeBase(orgId, 'pricing plans', 5);
// Returns: [{ content: '...', title: '...', similarity: 0.85 }, ...]
```

### Soft Deletes

**Soft Delete Support** ([lib/query-helpers.ts](lib/query-helpers.ts)):
- Leads, workflows, and knowledge base documents support soft deletes
- Records marked with `deletedAt`, `deletedBy`, `deletionReason`
- Soft-deleted records excluded from queries by default
- Restore capability for accidental deletions
- Permanent deletion after configurable retention period (default 90 days)

**Migration** ([db/migrations/0003_add_soft_deletes.sql](db/migrations/0003_add_soft_deletes.sql)):
- Adds deletedAt, deletedBy, deletionReason columns
- Creates partial indexes for efficient filtering
- Includes documentation comments

**Soft Delete Functions**:
```typescript
import {
  softDeleteLead,
  restoreLead,
  getActiveLeads,
  permanentlyDeleteOldRecords
} from '@/lib/query-helpers';

// Soft delete a lead
await softDeleteLead(leadId, clerkUserId, 'Duplicate entry');

// Restore a lead
await restoreLead(leadId);

// Get only active (non-deleted) leads
const leads = await getActiveLeads(orgId);

// Cleanup: Permanently delete records older than 90 days
const { leadsDeleted } = await permanentlyDeleteOldRecords(90);
```

**Query Helper Utilities**:
```typescript
import { notDeleted } from '@/lib/query-helpers';

// Use in Drizzle queries
const leads = await db
  .select()
  .from(leadsTable)
  .where(and(
    eq(leadsTable.orgId, orgId),
    notDeleted(leadsTable) // Excludes soft-deleted records
  ));
```

### Testing

**Testing Framework**: Vitest with coverage reporting

**Test Configuration** ([vitest.config.ts](vitest.config.ts)):
- Node environment for server-side code
- Global test utilities (describe, it, expect)
- V8 coverage provider with 70%+ targets
- Path aliases (@/) for imports

**Test Coverage**:
- **Encryption Module**: 35+ tests covering round-trip encryption, tampered data detection, Unicode support
- **Rate Limiting**: 30+ tests for sliding window algorithm, Redis operations, fail-open behavior
- **Workflow Error Handling**: 15+ integration tests for workflow finalization and error paths
- **Target Coverage**: 70% overall, 95%+ for critical security modules

**Running Tests**:
```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode for development
pnpm test:coverage     # Generate coverage report
pnpm test:ui           # Interactive UI for debugging tests
```

**Key Test Files**:
- [lib/encryption.test.ts](lib/encryption.test.ts) - Security critical encryption tests
- [lib/rate-limit.test.ts](lib/rate-limit.test.ts) - Rate limiting behavior tests
- [workflows/inbound/index.test.ts](workflows/inbound/index.test.ts) - Workflow integration tests

## Key Files

**Core Services**:
- [lib/services.ts](lib/services.ts) - Business logic: qualify, writeEmail, createResearchAgent, tool definitions
- [lib/types.ts](lib/types.ts) - Zod schemas for forms and qualification categories
- [lib/slack.ts](lib/slack.ts) - Slack integration (optional, graceful degradation)

**AI & BYOK**:
- [lib/ai-resolver.ts](lib/ai-resolver.ts) - Resolve AI models per organization
- [lib/ai-config.ts](lib/ai-config.ts) - Manage organization AI configuration
- [lib/ai-usage.ts](lib/ai-usage.ts) - Track usage, costs, and analytics (with email alerts)
- [lib/encryption.ts](lib/encryption.ts) - Encrypt/decrypt customer API keys
- [lib/knowledge-base.ts](lib/knowledge-base.ts) - Semantic search with pgvector embeddings

**Security & Rate Limiting**:
- [lib/rate-limit.ts](lib/rate-limit.ts) - Upstash Redis rate limiting with sliding window
- [lib/env-validation.ts](lib/env-validation.ts) - Startup environment validation
- [lib/permissions.ts](lib/permissions.ts) - Role-based access control (RBAC)
- [lib/query-helpers.ts](lib/query-helpers.ts) - Soft delete utilities and query filters

**Database & Workflows**:
- [db/schema.ts](db/schema.ts) - Drizzle database schema with multi-tenant tables
- [workflows/inbound/index.ts](workflows/inbound/index.ts) - Main workflow orchestration
- [workflows/inbound/steps.ts](workflows/inbound/steps.ts) - Individual durable steps

**API Routes**:
- [app/api/submit/route.ts](app/api/submit/route.ts) - Form submission with bot detection
- [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts) - Clerk organization sync
- [middleware.ts](middleware.ts) - Subdomain routing and auth

**Admin UI**:
- [app/(dashboard)/admin/ai-settings/page.tsx](app/(dashboard)/admin/ai-settings/page.tsx) - AI configuration UI
- [app/(dashboard)/admin/ai-settings/actions.ts](app/(dashboard)/admin/ai-settings/actions.ts) - Server actions for AI config

## Customization Guide

### Add Qualification Categories
Edit [lib/types.ts](lib/types.ts):
```typescript
export const qualificationCategorySchema = z.enum([
  'QUALIFIED',
  'UNQUALIFIED',
  'SUPPORT',
  'FOLLOW_UP',
  'YOUR_CATEGORY' // Add new category
]);
```

### Implement Service Placeholders
[lib/services.ts](lib/services.ts) has functions ready to extend:
- `sendEmail()` → ✅ **Implemented** with Resend
- `crmSearch.execute()` → Placeholder for Salesforce/HubSpot/Snowflake connector
- `techStackAnalysis.execute()` → ✅ **Implemented** with simple-wappalyzer (free, unlimited)
- `queryKnowledgeBase.execute()` → ✅ **Implemented** with pgvector

### Add Agent Tools
In [lib/services.ts](lib/services.ts):
```typescript
const myTool = tool({
  description: 'Tool description',
  parameters: z.object({ ... }),
  execute: async ({ param }) => { ... }
});

// Add to agent tools object
const agent = new Experimental_Agent({
  tools: { search, fetchUrl, myTool }
});
```

### Customize Prompts
All prompts in [lib/services.ts](lib/services.ts):
- Research agent system prompt → `createResearchAgent()` function
- Qualification prompt → `qualify()` function
- Email generation prompt → `writeEmail()` function

### Configure Organization AI Settings
Customers can configure AI via Admin UI:
1. Navigate to `/admin/ai-settings`
2. Choose provider: OpenRouter (recommended), OpenAI, Anthropic, or Platform Default
3. Enter API key (encrypted with AES-256-GCM)
4. Select models from provider catalog
5. Configure cost alerts and usage tracking

**Programmatic Access**:
```typescript
import { updateAiConfig } from '@/lib/ai-config';
import { encryptApiKey } from '@/lib/encryption';

await updateAiConfig(orgId, {
  provider: 'openrouter',
  models: {
    chat: 'anthropic/claude-3.5-sonnet',
    embedding: 'text-embedding-3-small',
  },
  encryptedApiKey: encryptApiKey('sk-or-v1-...'),
  usageTracking: true,
});
```

### Extend Workflows
Add steps to [workflows/inbound/index.ts](workflows/inbound/index.ts):
```typescript
async function newStep() {
  'use step';
  // Step logic
}

export async function workflowInbound(data: LeadFormData) {
  'use workflow';
  const research = await researchStep(data);
  const custom = await newStep(); // Add here
  // ...
}
```

## Environment Variables

**Required**:
```bash
DATABASE_URL                         # Neon PostgreSQL connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    # Clerk public key
CLERK_SECRET_KEY                     # Clerk secret key
CLERK_WEBHOOK_SECRET                 # Clerk webhook signing secret
EXA_API_KEY                          # Exa.ai search API key
ENCRYPTION_SECRET                    # 32-byte hex key for encrypting customer API keys
```

**AI Configuration** (at least one required):
```bash
AI_GATEWAY_API_KEY                   # Vercel AI Gateway API key (deprecated)
OPENROUTER_API_KEY                   # OpenRouter API key (platform default for free tier)
```

**Rate Limiting** (Upstash Redis):
```bash
UPSTASH_REDIS_REST_URL               # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN             # Upstash Redis REST token
```

**Email Notifications** (Cost alerts via Resend):
```bash
RESEND_API_KEY                       # Resend API key for sending emails
RESEND_FROM_EMAIL                    # From email address (e.g., alerts@yourdomain.com)
NEXT_PUBLIC_APP_URL                  # Application URL for email links (optional)
```

**Optional** (Slack integration disabled without these):
```bash
SLACK_BOT_TOKEN                      # xoxb-... bot token
SLACK_SIGNING_SECRET                 # Slack app signing secret
SLACK_CHANNEL_ID                     # C... channel ID for notifications
```

**Generate Encryption Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Setup Upstash Redis** (for rate limiting):
1. Create account at https://upstash.com
2. Create a new Redis database (global for low latency)
3. Copy REST URL and REST token to environment variables

## Implementation Notes

**Security**:
- **Rate Limiting**: Upstash Redis-based rate limiting on all public endpoints
  - Sliding window algorithm with configurable limits per endpoint
  - Fail-open pattern (allows requests if Redis unavailable)
  - Returns 429 with Retry-After header when exceeded
- **Bot Detection**: `botid` package on all form submissions (main + assessment)
- **Environment Validation**: Startup validation with Zod schema
  - Validates required variables, formats, and cross-field dependencies
  - Enforces ENCRYPTION_SECRET format (64 hex characters)
  - Application fails fast with detailed error messages
- **BYOK Security**: Customer API keys encrypted with AES-256-GCM
  - API keys stored encrypted in `tenants.aiConfig` JSONB column
  - Encryption secret must be set in environment (never commit to repo)
  - Automatic decryption only when resolving AI models
- **Tenant Isolation**: All database queries scoped by `organizationId`
- **Authentication**: Clerk middleware protects dashboard routes
- **CSRF Protection**: Via Clerk session tokens
- **Permissions**: Separate permissions for approve/reject actions (`leads:approve`, `leads:reject`)

**Reliability**:
- **Workflow DevKit**: Automatic retries and crash recovery for durable workflows
- **Error Handling**: Workflows properly finalize as 'failed' on errors
  - Nullable workflow initialization prevents undefined access
  - Try-catch blocks with finalization in error handler
- **Agent Safety**: Limited to 20 steps to prevent runaway execution
- **Graceful Degradation**: Slack integration disabled without credentials
- **Cost Alerts**: Automatic email notifications via Resend when thresholds exceeded

**Multi-Tenancy**:
- Subdomain extracted via middleware and passed to routes
- Organization data synced from Clerk via webhook
- All queries filtered by `organizationId` from auth context

**Performance**:
- **pgvector Search**: Native database-level vector similarity search
  - IVFFlat indexing for sub-millisecond queries
  - Cosine similarity operator (`<=>`) in PostgreSQL
  - Replaces O(n) JavaScript iteration with indexed queries
- **Database Indexes**: Optimized composite indexes for common query patterns
  - 20+ indexes on leads, workflows, ai_usage, email_sends
  - Partial indexes for soft delete filtering
  - Organization-scoped indexes for multi-tenant isolation
- **Background Processing**: Workflows run async, don't block form submission
- **Message Truncation**: Research results truncated to 500 chars in Slack

**AI Usage Tracking**:
- All AI requests logged to `ai_usage` table with tokens, costs, models
- Automatic cost estimation using model-specific pricing tables
- Per-organization, per-lead, and per-operation analytics
- Monthly usage reports and cost alerts via email (Resend)
- Export usage data to CSV for billing reconciliation
- Indexed by orgId, operation, provider, model for fast queries

**Data Management**:
- **Soft Deletes**: Leads, workflows, and knowledge base docs support soft deletion
  - Records marked with deletedAt, deletedBy, deletionReason
  - Excluded from queries by default using query helpers
  - Restore capability for accidental deletions
  - Permanent deletion after 90-day retention period
- **Query Helpers**: Utilities for filtering deleted records (`notDeleted()`)
- **Audit Trail**: Track who deleted records and why

**Tech Stack Analysis**:
- Uses `simple-wappalyzer` for free, unlimited technology detection
- Detects 70-80% of technologies (CMS, frameworks, servers, analytics)
- No external API required - runs locally in serverless functions
- Update package quarterly: `pnpm update simple-wappalyzer`
- Best detection for traditional websites, less accurate for SPAs
- Tool available to AI agent during research phase
