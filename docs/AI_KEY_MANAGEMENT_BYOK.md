# AI Key Management & BYOK (Bring Your Own Key)

**Status**: Planning
**Priority**: High
**Estimated Effort**: 2-3 weeks
**Last Updated**: 2025-01-27

## Overview

This document outlines the implementation of a "Bring Your Own Key" (BYOK) system that allows customers to use their own AI provider API keys instead of relying solely on the platform's shared keys.

**Recommended Primary Option**: **OpenRouter** - Provides access to 100+ models (GPT-4, Claude, Gemini, Llama, Mixtral, etc.) with a single API key.

This provides cost transparency, eliminates usage limits, and gives customers control over their AI spending and model choice.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Why BYOK with OpenRouter?](#why-byok-with-openrouter)
3. [Architecture Design](#architecture-design)
4. [Schema Changes](#schema-changes)
5. [Implementation Steps](#implementation-steps)
6. [Vercel AI SDK Integration](#vercel-ai-sdk-integration)
7. [Security Considerations](#security-considerations)
8. [API Key Encryption](#api-key-encryption)
9. [Usage Tracking](#usage-tracking)
10. [UI/UX Design](#uiux-design)
11. [Migration Strategy](#migration-strategy)

---

## Current State Analysis

### Current AI Integration

**Current Stack:**
- **Vercel AI SDK v5** (`ai@^5.0.68`)
- **Models Used**:
  - Lead Qualification: `'openai/gpt-5'` via `generateObject()`
  - Email Generation: `'openai/gpt-5'` via `generateText()`
  - Research Agent: `'openai/gpt-5'` via `Experimental_Agent`
  - Embeddings: `text-embedding-3-small` via direct fetch to Cloudflare AI Gateway

**Configuration:**
- Single `AI_GATEWAY_API_KEY` environment variable (platform-wide)
- Models hardcoded as **strings** (e.g., `model: 'openai/gpt-5'`)
- Hardcoded Cloudflare Gateway URL in `lib/knowledge-base.ts:10`
- No tenant-specific configuration

### Problems with Current Approach

❌ **String-based models**: Can't customize API keys per tenant

❌ **No Cost Isolation**: All tenants use the platform's API key, making it impossible to track per-customer costs

❌ **Usage Limits**: Platform must limit AI usage to control costs, restricting customer value

❌ **No Model Choice**: Customers stuck with hardcoded GPT-4, can't use Claude, Gemini, Llama, etc.

❌ **Scalability Issues**: As customer base grows, platform AI costs become unsustainable

❌ **Vendor Lock-in**: Platform locked into OpenAI, can't easily switch or offer alternatives

---

## Why BYOK with OpenRouter?

### Why OpenRouter?

**OpenRouter Benefits**:
- ✅ **100+ Models**: Access GPT-4, Claude 3.5, Gemini Pro, Llama 3, Mixtral, and more with one key
- ✅ **Unified Billing**: Single invoice for all AI providers
- ✅ **Competitive Pricing**: Often cheaper than going direct (volume discounts)
- ✅ **Automatic Fallbacks**: If one model is down, auto-route to similar model
- ✅ **Usage Analytics**: Built-in dashboard for tracking costs
- ✅ **Simple Integration**: OpenAI-compatible API (works with Vercel AI SDK)
- ✅ **No Rate Limits**: Access to uncapped endpoints with credits

### Business Benefits

✅ **Cost Transparency**: Customers pay their own AI provider bills directly

✅ **Remove Usage Limits**: Unlimited AI usage when using own keys

✅ **Competitive Advantage**: Enterprise customers prefer BYOK for security/compliance

✅ **Flexibility**: Support 100+ models through one integration (OpenRouter)

✅ **Platform Scalability**: Reduce platform's AI infrastructure costs

✅ **Customer Choice**: Let customers pick the best model for their use case

### Customer Benefits

✅ **Cost Control**: See exactly what they're spending on AI

✅ **Model Choice**: Use GPT-4, Claude 3.5 Sonnet, Gemini, Llama, etc.

✅ **Data Privacy**: API calls go directly to their AI account

✅ **Performance**: Choose fastest/cheapest model per operation

✅ **Latest Models**: Access newest models as soon as OpenRouter adds them

### Technical Benefits

✅ **Simpler Billing**: No need to calculate and charge for AI usage

✅ **Better Attribution**: Know exactly which customer is using what

✅ **Easier Compliance**: Customer's data stays in their AI account

✅ **Single Integration**: One API (OpenRouter) supports all major providers

---

## Architecture Design

### High-Level Flow

```
1. Customer configures AI settings in dashboard
   ↓
2. Chooses provider:
   - OpenRouter (recommended) → Access to 100+ models
   - OpenAI Direct → OpenAI models only
   - Anthropic Direct → Claude models only
   - Platform Default → Free tier (limited)
   ↓
3. API key encrypted and stored in database
   ↓
4. When AI is needed:
   - Check tenant's AI config
   - Create provider instance with customer's key
   - Use custom model
   - Fall back to platform key (with limits)
   ↓
5. Track usage per tenant (tokens, cost, operation)
   ↓
6. Display analytics in dashboard
```

### Key Components

```
┌─────────────────────────────────────────────────────┐
│                  UI Layer                           │
│  - AI Settings Page (provider + model selection)   │
│  - Usage Dashboard (analytics + charts)            │
│  - Model Catalog (browse 100+ models)              │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              Application Layer                      │
│  - AI Config Service (lib/ai-config.ts)             │
│  - AI Resolver (lib/ai-resolver.ts)                 │
│  - Usage Tracker (lib/ai-usage.ts)                  │
│  - Model Registry (lib/model-registry.ts)           │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│                Data Layer                           │
│  - tenants.aiConfig (JSONB column)                  │
│  - aiUsage table (usage tracking)                   │
│  - Encrypted API keys (AES-256-GCM)                 │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│            Vercel AI SDK Layer                      │
│  - createOpenAI() for OpenRouter/OpenAI             │
│  - createAnthropic() for Anthropic                  │
│  - Model instances with custom keys                 │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│              AI Provider Layer                      │
│  - OpenRouter (100+ models) ⭐ RECOMMENDED          │
│  - OpenAI Direct                                    │
│  - Anthropic Direct                                 │
└─────────────────────────────────────────────────────┘
```

### Provider Support Matrix

| Provider | Access | Chat Models | Embedding Models | Recommended |
|----------|--------|-------------|------------------|-------------|
| **OpenRouter** | Single API key | GPT-4, Claude 3.5, Gemini, Llama 3, Mixtral, DeepSeek, etc. (100+) | text-embedding-3-small/large via OpenAI fallback | ⭐ **YES** |
| OpenAI Direct | OpenAI API key | GPT-4, GPT-4 Turbo, GPT-3.5 | text-embedding-3-small/large | Secondary |
| Anthropic Direct | Anthropic API key | Claude 3.5 Sonnet, Claude 3 Haiku/Opus | ❌ (use OpenAI) | Secondary |
| Platform Default | Platform key | GPT-4 | text-embedding-3-small | Free tier only |

### Popular Models Available Through OpenRouter

**Premium Models** (High Quality):
- `openai/gpt-4-turbo` - OpenAI GPT-4 Turbo
- `openai/gpt-4o` - OpenAI GPT-4 Omni
- `anthropic/claude-3.5-sonnet` - Anthropic Claude 3.5 Sonnet
- `anthropic/claude-3-opus` - Anthropic Claude 3 Opus
- `google/gemini-pro-1.5` - Google Gemini Pro 1.5

**Cost-Effective Models** (Good Balance):
- `anthropic/claude-3-haiku` - Anthropic Claude 3 Haiku (fast, cheap)
- `openai/gpt-3.5-turbo` - OpenAI GPT-3.5 Turbo
- `google/gemini-flash-1.5` - Google Gemini Flash

**Open Source Models** (Very Cheap):
- `meta-llama/llama-3-70b-instruct` - Meta Llama 3 70B
- `mistralai/mixtral-8x7b-instruct` - Mistral Mixtral 8x7B
- `deepseek/deepseek-chat` - DeepSeek Chat

See full model list: https://openrouter.ai/models

---

## Schema Changes

### 1. Extend Tenants Table

Add `aiConfig` JSONB column:

```typescript
// db/schema.ts - Add to tenants table
export const tenants = pgTable('tenants', {
  // ... existing fields ...

  // AI Configuration
  aiConfig: jsonb('ai_config').$type<{
    // Which provider customer wants to use
    provider: 'openrouter' | 'openai' | 'anthropic' | 'platform_default';

    // Model preferences per operation
    models: {
      chat: string; // e.g., 'anthropic/claude-3.5-sonnet', 'openai/gpt-4-turbo'
      embedding: string; // e.g., 'text-embedding-3-small'
    };

    // Customer's encrypted API key
    encryptedApiKey?: string; // AES-256-GCM encrypted

    // OpenRouter-specific settings
    openrouterSettings?: {
      siteUrl?: string; // For OpenRouter rankings
      siteName?: string; // For OpenRouter rankings
    };

    // Settings
    usageTracking: boolean; // Whether to track detailed usage
    costAlerts?: {
      enabled: boolean;
      monthlyThreshold: number; // Alert when monthly cost exceeds (in cents)
      email: string; // Where to send alerts
    };
  }>(),
});
```

### 2. Create AI Usage Table

Track all AI API calls:

```typescript
// db/schema.ts - New table
export const aiUsage = pgTable(
  'ai_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: text('org_id').notNull(),

    // Request identification
    operation: text('operation').notNull(), // 'qualification', 'email_generation', 'research', 'embedding'
    provider: text('provider').notNull(), // 'openrouter', 'openai', 'anthropic', 'platform'
    model: text('model').notNull(), // 'anthropic/claude-3.5-sonnet', 'openai/gpt-4-turbo', etc.

    // Token usage
    inputTokens: integer('input_tokens').default(0),
    outputTokens: integer('output_tokens').default(0),
    totalTokens: integer('total_tokens').default(0),

    // Cost (in cents) - from provider's response or estimation
    actualCost: integer('actual_cost'), // From OpenRouter usage API
    estimatedCost: integer('estimated_cost').default(0),

    // Context
    leadId: uuid('lead_id').references(() => leads.id),
    workflowId: text('workflow_id'),

    // Request metadata
    requestDuration: integer('request_duration'), // milliseconds
    success: boolean('success').default(true),
    errorMessage: text('error_message'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    orgIdIndex: index('ai_usage_org_id_idx').on(table.orgId),
    createdAtIndex: index('ai_usage_created_at_idx').on(table.createdAt),
    operationIndex: index('ai_usage_operation_idx').on(table.operation),
    providerIndex: index('ai_usage_provider_idx').on(table.provider),
    modelIndex: index('ai_usage_model_idx').on(table.model),
  })
);

export type AiUsage = typeof aiUsage.$inferSelect;
export type NewAiUsage = typeof aiUsage.$inferInsert;
```

### 3. Migration Script

```sql
-- Add aiConfig column to tenants table
ALTER TABLE tenants ADD COLUMN ai_config JSONB;

-- Set default configuration for existing tenants
UPDATE tenants SET ai_config = '{
  "provider": "platform_default",
  "models": {
    "chat": "gpt-4",
    "embedding": "text-embedding-3-small"
  },
  "usageTracking": true
}'::jsonb WHERE ai_config IS NULL;

-- Create ai_usage table
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  actual_cost INTEGER,
  estimated_cost INTEGER DEFAULT 0,
  lead_id UUID REFERENCES leads(id),
  workflow_id TEXT,
  request_duration INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX ai_usage_org_id_idx ON ai_usage(org_id);
CREATE INDEX ai_usage_created_at_idx ON ai_usage(created_at);
CREATE INDEX ai_usage_operation_idx ON ai_usage(operation);
CREATE INDEX ai_usage_provider_idx ON ai_usage(provider);
CREATE INDEX ai_usage_model_idx ON ai_usage(model);
```

---

## Implementation Steps

### Phase 1: Dependencies & Core Infrastructure (2-3 days)

#### 1.1 Install Dependencies

```bash
# Install Vercel AI SDK provider packages
pnpm add @ai-sdk/openai @ai-sdk/anthropic

# AI SDK is already installed: "ai": "^5.0.68"
```

#### 1.2 Database Setup

- [ ] Create database migration for `aiConfig` column
- [ ] Create `ai_usage` table
- [ ] Update Drizzle schema types
- [ ] Run migration on development database

#### 1.3 Encryption Service

- [ ] Create `lib/encryption.ts` with AES-256-GCM functions
- [ ] Add `ENCRYPTION_SECRET` to environment variables
- [ ] Write unit tests for encryption/decryption
- [ ] Implement key rotation capability

#### 1.4 AI Configuration Service

- [ ] Create `lib/ai-config.ts`
- [ ] Implement `getAiConfig(orgId)` function
- [ ] Implement `saveAiConfig(orgId, config)` function
- [ ] Implement `testAiConnection(apiKey, provider)` function
- [ ] Add validation for API key formats

### Phase 2: Vercel AI SDK Integration (3-4 days)

#### 2.1 Model Registry

- [ ] Create `lib/model-registry.ts`
- [ ] Define available models per provider
- [ ] Categorize by use case (fast, balanced, premium)
- [ ] Add pricing information

#### 2.2 AI Resolver (Vercel AI SDK)

- [ ] Create `lib/ai-resolver.ts`
- [ ] Implement `getModelForTenant(orgId, modelType)` using provider instances
- [ ] Support OpenRouter via `createOpenAI()` with custom baseURL
- [ ] Support OpenAI Direct via `createOpenAI()`
- [ ] Support Anthropic via `createAnthropic()`
- [ ] Add fallback logic to platform keys

#### 2.3 Update Existing Services

- [ ] Update `qualify()` to accept `orgId` parameter
- [ ] Update `writeEmail()` to accept `orgId` parameter
- [ ] Update `researchAgent` to be created per-tenant
- [ ] Update `generateEmbedding()` to accept `orgId` parameter
- [ ] Change from string models to model instances
- [ ] Update all function calls in workflows

#### 2.4 Workflow Integration

- [ ] Update `workflows/inbound/steps.ts` to pass `orgId`
- [ ] Ensure all AI calls have tenant context
- [ ] Add error handling for missing/invalid keys

### Phase 3: Usage Tracking (2-3 days)

#### 3.1 Usage Tracker Implementation

- [ ] Create `lib/ai-usage.ts`
- [ ] Implement `trackAiUsage()` function
- [ ] Add pricing table for cost estimation (OpenRouter rates)
- [ ] Implement monthly cost calculation
- [ ] Add cost alert logic
- [ ] Optional: Integrate with OpenRouter's usage API for actual costs

#### 3.2 Analytics Functions

- [ ] Create `getAiUsageStats(orgId, period)` function
- [ ] Create `getTotalCostByPeriod(orgId)` function
- [ ] Create `getUsageByOperation(orgId)` function
- [ ] Create `getModelDistribution(orgId)` function

#### 3.3 Integration

- [ ] Add usage tracking to all AI calls
- [ ] Handle tracking failures gracefully (don't block AI requests)
- [ ] Add batch insert for high-volume tracking

### Phase 4: API Endpoints (2 days)

#### 4.1 AI Config API

- [ ] Create `app/api/ai-config/route.ts`
- [ ] `GET` - Fetch current configuration
- [ ] `POST` - Save new configuration
- [ ] `PUT` - Test API key connection
- [ ] Add role-based access control (admin only)

#### 4.2 Models API

- [ ] Create `app/api/ai-models/route.ts`
- [ ] `GET /api/ai-models` - List available models for selected provider
- [ ] Return model metadata (name, description, pricing, context window)

#### 4.3 Usage API

- [ ] Create `app/api/ai-usage/route.ts`
- [ ] `GET /api/ai-usage/stats` - Get usage statistics
- [ ] `GET /api/ai-usage/history` - Get usage history
- [ ] `GET /api/ai-usage/export` - Export usage data (CSV)

### Phase 5: UI Implementation (4-5 days)

#### 5.1 AI Settings Page

- [ ] Create `app/(dashboard)/settings/ai/page.tsx`
- [ ] Display current configuration
- [ ] Provider selection dropdown (OpenRouter, OpenAI, Anthropic, Platform)
- [ ] Model selection with search/filter (for OpenRouter's 100+ models)
- [ ] API key input (masked)
- [ ] Test connection button
- [ ] Save configuration button
- [ ] Show recommended models per operation type

#### 5.2 Model Catalog

- [ ] Create model browsing interface
- [ ] Filter by provider, cost, speed
- [ ] Show pricing, context window, capabilities
- [ ] "Select for chat" / "Select for embedding" buttons

#### 5.3 Usage Dashboard

- [ ] Create usage statistics cards
- [ ] Token usage chart (over time)
- [ ] Cost breakdown by operation
- [ ] Model distribution chart
- [ ] Top 5 most-used models
- [ ] Export usage data button

#### 5.4 Form Components

- [ ] Create `ai-config-form.tsx`
- [ ] Add form validation
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add success toasts

### Phase 6: Testing & Documentation (2-3 days)

#### 6.1 Testing

- [ ] Test with real OpenRouter API keys
- [ ] Test with real OpenAI API keys
- [ ] Test with real Anthropic API keys
- [ ] Test fallback to platform keys
- [ ] Test encryption/decryption
- [ ] Test usage tracking accuracy
- [ ] Test cost estimation
- [ ] Test model switching
- [ ] Load test with concurrent AI requests

#### 6.2 Documentation

- [ ] Update CLAUDE.md with BYOK patterns
- [ ] Create customer-facing docs on how to configure
- [ ] Document supported providers and models
- [ ] Create troubleshooting guide
- [ ] Add API key security best practices
- [ ] Document OpenRouter setup process

### Phase 7: Migration & Launch (1-2 days)

#### 7.1 Data Migration

- [ ] Run migration on production database
- [ ] Set default config for all existing tenants
- [ ] Verify data integrity

#### 7.2 Feature Flag Rollout

- [ ] Deploy with feature flag disabled
- [ ] Enable for internal testing
- [ ] Enable for beta customers
- [ ] Full rollout

---

## Vercel AI SDK Integration

### Current Setup (String-based Models)

```typescript
// lib/services.ts - CURRENT (won't work with BYOK)
import { generateObject } from 'ai';

export async function qualify(lead: FormSchema, research: string) {
  const { object } = await generateObject({
    model: 'openai/gpt-5', // ❌ String - can't customize API key
    schema: qualificationSchema,
    prompt: `Qualify the lead...`
  });

  return object;
}
```

### New Setup (Provider Instances with BYOK)

#### Install Provider Packages

```bash
pnpm add @ai-sdk/openai @ai-sdk/anthropic
```

#### AI Configuration Service

```typescript
// lib/ai-config.ts
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { encryptApiKey, decryptApiKey } from './encryption';

/**
 * Get AI configuration for a tenant
 */
export async function getAiConfig(orgId: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId),
  });

  if (!tenant?.aiConfig) {
    // Return platform defaults
    return {
      provider: 'platform_default' as const,
      models: {
        chat: 'gpt-4',
        embedding: 'text-embedding-3-small',
      },
      apiKey: process.env.AI_GATEWAY_API_KEY!,
      isCustomerKey: false,
    };
  }

  const config = tenant.aiConfig;

  // Decrypt customer's API key if provided
  const apiKey = config.encryptedApiKey
    ? decryptApiKey(config.encryptedApiKey)
    : process.env.AI_GATEWAY_API_KEY!;

  return {
    provider: config.provider,
    models: config.models,
    apiKey,
    isCustomerKey: !!config.encryptedApiKey,
    openrouterSettings: config.openrouterSettings,
  };
}

/**
 * Save AI configuration for a tenant
 */
export async function saveAiConfig(
  orgId: string,
  config: {
    provider: 'openrouter' | 'openai' | 'anthropic' | 'platform_default';
    models: {
      chat: string;
      embedding: string;
    };
    apiKey?: string; // Customer's raw API key
    openrouterSettings?: {
      siteUrl?: string;
      siteName?: string;
    };
  }
) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId),
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  const aiConfig = {
    provider: config.provider,
    models: config.models,
    encryptedApiKey: config.apiKey ? encryptApiKey(config.apiKey) : undefined,
    openrouterSettings: config.openrouterSettings,
    usageTracking: true,
  };

  await db.update(tenants)
    .set({
      aiConfig,
      updatedAt: new Date(),
    })
    .where(eq(tenants.clerkOrgId, orgId));
}
```

#### AI Resolver (Vercel AI SDK)

```typescript
// lib/ai-resolver.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getAiConfig } from './ai-config';

/**
 * Get the appropriate AI model for a tenant using Vercel AI SDK
 * Returns a model instance (not a string)
 */
export async function getModelForTenant(
  orgId: string,
  modelType: 'chat' | 'embedding'
) {
  const config = await getAiConfig(orgId);
  const modelName = config.models[modelType];

  // OpenRouter (RECOMMENDED)
  if (config.provider === 'openrouter') {
    const openrouter = createOpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'HTTP-Referer': config.openrouterSettings?.siteUrl || 'https://leadagent.com',
        'X-Title': config.openrouterSettings?.siteName || 'Lead Agent',
      },
    });

    // OpenRouter uses provider/model format: 'anthropic/claude-3.5-sonnet'
    return openrouter(modelName);
  }

  // OpenAI Direct
  if (config.provider === 'openai' || modelName.startsWith('gpt')) {
    const openai = createOpenAI({
      apiKey: config.apiKey,
      compatibility: 'strict',
    });

    // Remove 'openai/' prefix if present for direct OpenAI
    const cleanModelName = modelName.replace('openai/', '');
    return openai(cleanModelName);
  }

  // Anthropic Direct
  if (config.provider === 'anthropic' || modelName.startsWith('claude')) {
    const anthropic = createAnthropic({
      apiKey: config.apiKey,
    });

    // Remove 'anthropic/' prefix if present
    const cleanModelName = modelName.replace('anthropic/', '');
    return anthropic(cleanModelName);
  }

  // Fallback to platform default (OpenAI)
  const openai = createOpenAI({
    apiKey: process.env.AI_GATEWAY_API_KEY!,
  });

  return openai('gpt-4');
}

/**
 * Get embedding configuration for a tenant
 */
export async function getEmbeddingConfig(orgId: string) {
  const config = await getAiConfig(orgId);

  // For embeddings, we'll always use OpenAI (via direct or OpenRouter)
  const apiKey = config.apiKey;

  let baseURL = 'https://api.openai.com/v1';

  if (config.provider === 'openrouter') {
    baseURL = 'https://openrouter.ai/api/v1';
  }

  return {
    model: config.models.embedding,
    apiKey,
    baseURL,
  };
}
```

#### Updated Services

```typescript
// lib/services.ts - UPDATED for BYOK with Vercel AI SDK
import { generateObject, generateText } from 'ai';
import { getModelForTenant } from './ai-resolver';
import { trackAiUsage } from './ai-usage';

/**
 * Qualify the lead (with BYOK support)
 */
export async function qualify(
  lead: FormSchema,
  research: string,
  orgId: string // ← Add orgId parameter
): Promise<QualificationSchema> {
  // Get tenant's preferred model (returns model instance, not string)
  const model = await getModelForTenant(orgId, 'chat');

  const result = await generateObject({
    model, // ← Model instance with customer's API key
    schema: qualificationSchema,
    prompt: `Qualify the lead and give a reason for the qualification based on the following information: LEAD DATA: ${JSON.stringify(
      lead
    )} and RESEARCH: ${research}`
  });

  // Track usage
  await trackAiUsage({
    orgId,
    operation: 'qualification',
    model: result.experimental_providerMetadata?.modelId || 'unknown',
    usage: result.usage,
    leadId: lead.id,
  });

  return result.object;
}

/**
 * Write an email (with BYOK support)
 */
export async function writeEmail(
  research: string,
  qualification: QualificationSchema,
  orgId: string // ← Add orgId parameter
) {
  const model = await getModelForTenant(orgId, 'chat');

  const result = await generateText({
    model, // ← Model instance
    prompt: `Write an email for a ${
      qualification.category
    } lead based on the following information: ${JSON.stringify(research)}`
  });

  // Track usage
  await trackAiUsage({
    orgId,
    operation: 'email_generation',
    model: result.experimental_providerMetadata?.modelId || 'unknown',
    usage: result.usage,
  });

  return result.text;
}

/**
 * Create research agent with tenant's model
 */
export async function createResearchAgent(orgId: string) {
  const model = await getModelForTenant(orgId, 'chat');

  return new Agent({
    model, // ← Model instance
    system: `You are a researcher to find information about a lead. You are given a lead and you need to find information about the lead.

    You can use the tools provided to you to find information about the lead:
    - search: Searches the web for information
    - queryKnowledgeBase: Queries the knowledge base for the given query
    - fetchUrl: Fetches the contents of a public URL
    - crmSearch: Searches the CRM for the given company name
    - techStackAnalysis: Analyzes the tech stack of the given domain

    Synthesize the information you find into a comprehensive report.
    `,
    tools: {
      search,
      queryKnowledgeBase,
      fetchUrl,
      crmSearch,
      techStackAnalysis
    },
    stopWhen: [stepCountIs(20)]
  });
}
```

#### Updated Embeddings

```typescript
// lib/knowledge-base.ts - UPDATED for BYOK

import { getEmbeddingConfig } from './ai-resolver';
import { trackAiUsage } from './ai-usage';

export async function generateEmbedding(
  text: string,
  orgId: string // ← Add orgId parameter
): Promise<number[]> {
  const config = await getEmbeddingConfig(orgId);

  try {
    const response = await fetch(`${config.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embedding API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Track usage
    await trackAiUsage({
      orgId,
      operation: 'embedding',
      model: config.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    });

    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Update all calls to include orgId
export async function searchKnowledgeBase(
  orgId: string,
  query: string,
  topK: number = 3
): Promise<Array<{ content: string; title: string; similarity: number }>> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query, orgId); // ← Pass orgId

  // ... rest of function
}

export async function addDocumentToKnowledgeBase(
  orgId: string,
  title: string,
  content: string,
  contentType: string = 'document',
  metadata?: { source?: string; author?: string; tags?: string[]; category?: string }
): Promise<string> {
  // Generate embedding for the full document
  const docEmbedding = await generateEmbedding(content.slice(0, 8000), orgId); // ← Pass orgId

  // ... chunk and embed each chunk with orgId
  for (let i = 0; i < chunks.length; i++) {
    const chunkEmbedding = await generateEmbedding(chunks[i], orgId); // ← Pass orgId
    // ... rest
  }

  // ... rest of function
}
```

---

## Security Considerations

### API Key Storage

**Encryption**: API keys are encrypted using AES-256-GCM before storage

**Key Management**:
- Encryption secret stored in environment variables
- Never logged or exposed in error messages
- Separate encryption keys for dev/staging/production

**Access Control**:
- Only organization admins can configure AI settings
- API keys never returned in API responses (only mask shown)
- Audit log for all configuration changes

### Data Privacy

**Request Routing**:
- Customer's AI requests go directly to their account (OpenRouter/OpenAI/Anthropic)
- Platform never sees request content when using customer keys
- Usage metadata (tokens, cost) stored locally

**Compliance**:
- GDPR: Customer data processed with their AI provider account
- SOC 2: Encryption at rest and in transit
- HIPAA: Customer can use their HIPAA-compliant AI accounts

### Attack Vectors & Mitigations

| Attack | Mitigation |
|--------|-----------|
| API key theft from database | AES-256-GCM encryption with secret key rotation |
| API key exposure in logs | Never log raw keys, only mask or hash |
| Unauthorized config changes | Role-based access control (admin only) |
| Key reuse across tenants | Tenant isolation in database queries |
| Man-in-the-middle | HTTPS everywhere, certificate pinning for API calls |
| OpenRouter account abuse | Rate limiting, usage monitoring per tenant |

---

## API Key Encryption

### Encryption Implementation

```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

/**
 * Generate encryption key from secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET!;

  if (!secret || secret.length < 64) {
    throw new Error('ENCRYPTION_SECRET must be at least 64 characters (hex string)');
  }

  // Use the hex secret directly as the key
  return Buffer.from(secret, 'hex');
}

/**
 * Encrypt API key
 * Returns: iv:authTag:encrypted (all hex-encoded)
 */
export function encryptApiKey(apiKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // 128-bit IV for GCM

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt API key
 */
export function decryptApiKey(encryptedData: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask API key for display
 * Example: sk-or-v1-abc...xyz → sk-••••••••••xyz
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 12) return '••••••••';

  const prefix = apiKey.slice(0, 3);
  const suffix = apiKey.slice(-3);

  return `${prefix}••••••••••${suffix}`;
}
```

### Key Rotation Strategy

**When to Rotate**:
- Every 90 days (automated)
- When team member with access leaves
- After suspected security incident
- During compliance audits

**Rotation Process**:
1. Generate new `ENCRYPTION_SECRET`
2. Re-encrypt all API keys with new secret
3. Deploy new secret to production
4. Verify all AI requests still work
5. Invalidate old secret

---

## Usage Tracking

### Tracked Metrics

| Metric | Description | Use Case |
|--------|-------------|----------|
| inputTokens | Tokens in prompt/request | Cost calculation |
| outputTokens | Tokens in response | Cost calculation |
| totalTokens | Sum of input + output | Rate limiting |
| actualCost | Real cost from provider | Accurate billing (OpenRouter provides this) |
| estimatedCost | Calculated cost in cents | Fallback estimation |
| operation | Type of AI request | Analytics |
| model | Specific model used | Model comparison |
| requestDuration | API call latency | Performance monitoring |
| success | Whether request succeeded | Error tracking |

### Cost Estimation

**OpenRouter Pricing** (approximate, check https://openrouter.ai/models for current rates):

```typescript
// lib/pricing.ts
const OPENROUTER_PRICING = {
  // Premium models ($/1M tokens)
  'openai/gpt-4-turbo': { input: 10.00, output: 30.00 },
  'openai/gpt-4o': { input: 2.50, output: 10.00 },
  'anthropic/claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  'anthropic/claude-3-opus': { input: 15.00, output: 75.00 },
  'google/gemini-pro-1.5': { input: 3.50, output: 10.50 },

  // Balanced models
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  'openai/gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'google/gemini-flash-1.5': { input: 0.075, output: 0.30 },

  // Open source models (very cheap)
  'meta-llama/llama-3-70b-instruct': { input: 0.59, output: 0.79 },
  'mistralai/mixtral-8x7b-instruct': { input: 0.24, output: 0.24 },
  'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },

  // Embeddings
  'text-embedding-3-small': { input: 0.02, output: 0 },
  'text-embedding-3-large': { input: 0.13, output: 0 },
};

// Direct OpenAI pricing (if not using OpenRouter)
const OPENAI_DIRECT_PRICING = {
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-4': { input: 30.00, output: 60.00 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
  'text-embedding-3-large': { input: 0.13, output: 0 },
};

// Anthropic direct pricing
const ANTHROPIC_DIRECT_PRICING = {
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
};

export function getPricing(provider: string, model: string) {
  // Normalize model name
  const modelKey = model.replace(/^(openai|anthropic|google|meta-llama|mistralai|deepseek)\//, '');

  if (provider === 'openrouter') {
    return OPENROUTER_PRICING[model] || OPENROUTER_PRICING['openai/gpt-4-turbo'];
  }

  if (provider === 'openai') {
    return OPENAI_DIRECT_PRICING[modelKey] || OPENAI_DIRECT_PRICING['gpt-4-turbo'];
  }

  if (provider === 'anthropic') {
    return ANTHROPIC_DIRECT_PRICING[modelKey] || ANTHROPIC_DIRECT_PRICING['claude-3-5-sonnet-20241022'];
  }

  // Fallback
  return { input: 10.00, output: 30.00 };
}
```

**Calculation**:
```typescript
// lib/ai-usage.ts
import { getPricing } from './pricing';

function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getPricing(provider, model);

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  // Return cost in cents
  return Math.round((inputCost + outputCost) * 100);
}

export async function trackAiUsage(params: {
  orgId: string;
  operation: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  leadId?: string;
  workflowId?: string;
}) {
  if (!params.usage) return;

  const inputTokens = params.usage.promptTokens || 0;
  const outputTokens = params.usage.completionTokens || 0;
  const totalTokens = params.usage.totalTokens || (inputTokens + outputTokens);

  // Get provider from AI config
  const config = await getAiConfig(params.orgId);

  // Calculate estimated cost
  const estimatedCost = calculateCost(
    config.provider,
    params.model,
    inputTokens,
    outputTokens
  );

  await db.insert(aiUsage).values({
    orgId: params.orgId,
    operation: params.operation,
    provider: config.provider,
    model: params.model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost,
    leadId: params.leadId,
    workflowId: params.workflowId,
  });
}
```

### Usage Analytics Queries

```typescript
// lib/ai-usage.ts (continued)

// Get monthly usage stats
export async function getMonthlyUsageStats(orgId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageRecords = await db.query.aiUsage.findMany({
    where: and(
      eq(aiUsage.orgId, orgId),
      gte(aiUsage.createdAt, startOfMonth)
    ),
  });

  const stats = {
    totalRequests: usageRecords.length,
    successfulRequests: usageRecords.filter(r => r.success).length,
    totalTokens: usageRecords.reduce((sum, r) => sum + r.totalTokens, 0),
    estimatedCost: usageRecords.reduce((sum, r) => sum + r.estimatedCost, 0),

    byOperation: {} as Record<string, { count: number; cost: number; tokens: number }>,
    byModel: {} as Record<string, { count: number; tokens: number; cost: number }>,

    topModels: [] as Array<{ model: string; count: number; cost: number }>,
  };

  // Group by operation
  usageRecords.forEach(record => {
    if (!stats.byOperation[record.operation]) {
      stats.byOperation[record.operation] = { count: 0, cost: 0, tokens: 0 };
    }
    stats.byOperation[record.operation].count++;
    stats.byOperation[record.operation].cost += record.estimatedCost;
    stats.byOperation[record.operation].tokens += record.totalTokens;
  });

  // Group by model
  usageRecords.forEach(record => {
    if (!stats.byModel[record.model]) {
      stats.byModel[record.model] = { count: 0, tokens: 0, cost: 0 };
    }
    stats.byModel[record.model].count++;
    stats.byModel[record.model].tokens += record.totalTokens;
    stats.byModel[record.model].cost += record.estimatedCost;
  });

  // Get top 5 models by usage count
  stats.topModels = Object.entries(stats.byModel)
    .map(([model, data]) => ({ model, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
}
```

---

## UI/UX Design

### AI Settings Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  AI Configuration                                   [?] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Current Setup                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Provider: OpenRouter                              │ │
│  │ Chat Model: anthropic/claude-3.5-sonnet          │ │
│  │ Embedding Model: text-embedding-3-small          │ │
│  │ API Key: sk-or-••••••••••xyz                     │ │
│  │ Status: ✓ Connected                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  This Month's Usage                                     │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ Requests     │ Tokens       │ Est. Cost        │    │
│  │ 1,234        │ 245,678      │ $3.45            │    │
│  └──────────────┴──────────────┴──────────────────┘    │
│                                                         │
│  💡 Recommended: OpenRouter gives you access to 100+   │
│     models with one API key. Get started at            │
│     openrouter.ai                                      │
│                                                         │
│  Update Configuration                                   │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Provider: [OpenRouter (Recommended) ▼]           │ │
│  │                                                   │ │
│  │ API Key: [sk-or-v1-••••••••••••••••••••••••••]  │ │
│  │ [Test Connection]                                │ │
│  │                                                   │ │
│  │ Chat Model: [Search 100+ models...             ] │ │
│  │   Recommended:                                   │ │
│  │   • anthropic/claude-3.5-sonnet (Best quality)  │ │
│  │   • anthropic/claude-3-haiku (Fast & cheap)     │ │
│  │   • openai/gpt-4-turbo (OpenAI flagship)        │ │
│  │   • deepseek/deepseek-chat (Very cheap)         │ │
│  │                                                   │ │
│  │ Embedding Model: [text-embedding-3-small ▼]     │ │
│  │                                                   │ │
│  │ [Browse All Models →]                             │ │
│  │                                                   │ │
│  │                            [Cancel] [Save Config] │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Model Catalog/Browser

```
┌─────────────────────────────────────────────────────────┐
│  Available AI Models                     [Filter ▼]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Filters: [ All ] [ Premium ] [ Balanced ] [ Cheap ]   │
│           [ OpenAI ] [ Anthropic ] [ Google ] [ Meta ] │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ anthropic/claude-3.5-sonnet              ⭐ TOP │   │
│  │ Anthropic's most intelligent model               │   │
│  │ Context: 200K tokens | Cost: $3/$15 per 1M      │   │
│  │ Best for: Complex reasoning, analysis           │   │
│  │                      [Select for Chat] [Learn More] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ openai/gpt-4-turbo                        POPULAR │   │
│  │ OpenAI's flagship model with vision              │   │
│  │ Context: 128K tokens | Cost: $10/$30 per 1M     │   │
│  │ Best for: General purpose, coding               │   │
│  │                      [Select for Chat] [Learn More] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ anthropic/claude-3-haiku                  💰 CHEAP │   │
│  │ Fast, affordable Anthropic model                │   │
│  │ Context: 200K tokens | Cost: $0.25/$1.25 per 1M │   │
│  │ Best for: Simple tasks, high volume             │   │
│  │                      [Select for Chat] [Learn More] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ deepseek/deepseek-chat                    💰 CHEAP │   │
│  │ Open source model, extremely cheap               │   │
│  │ Context: 64K tokens | Cost: $0.14/$0.28 per 1M  │   │
│  │ Best for: Cost-sensitive applications           │   │
│  │                      [Select for Chat] [Learn More] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Showing 4 of 100+ models        [Load More]           │
└─────────────────────────────────────────────────────────┘
```

### Usage Dashboard

```
┌─────────────────────────────────────────────────────────┐
│  AI Usage Analytics                          [Export ▼] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Period: [This Month ▼]                                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │             Tokens Used Over Time               │   │
│  │  300k ┤                                 ╭─      │   │
│  │  200k ┤                       ╭────────╯        │   │
│  │  100k ┤          ╭───────────╯                  │   │
│  │     0 └──────────────────────────────────────   │   │
│  │       Jan 1    Jan 10    Jan 20    Jan 30      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Cost Breakdown by Operation                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Email Generation    ████████████ 45% ($1.55)   │   │
│  │ Lead Qualification  ████████ 30% ($1.04)        │   │
│  │ Research            ██████ 20% ($0.69)          │   │
│  │ Embeddings          ██ 5% ($0.17)               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Top Models This Month                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. anthropic/claude-3.5-sonnet  (567 requests)  │   │
│  │ 2. anthropic/claude-3-haiku     (234 requests)  │   │
│  │ 3. openai/gpt-4-turbo           (123 requests)  │   │
│  │ 4. deepseek/deepseek-chat       (89 requests)   │   │
│  │ 5. openai/gpt-3.5-turbo         (45 requests)   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Detailed Usage Log                                     │
│  ┌───────┬──────────┬────────────────┬────────┬───────┐│
│  │ Date  │ Operation│ Model          │ Tokens │ Cost  ││
│  ├───────┼──────────┼────────────────┼────────┼───────┤│
│  │ 1/27  │ Qualify  │ claude-3.5     │ 1,234  │ $0.02 ││
│  │ 1/27  │ Email    │ claude-haiku   │ 2,456  │ $0.01 ││
│  │ 1/26  │ Research │ gpt-4-turbo    │ 5,678  │ $0.08 ││
│  └───────┴──────────┴────────────────┴────────┴───────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Customer Onboarding Flow

**For New Customers:**
1. Sign up and create organization
2. Prompted to configure AI during onboarding wizard
3. **Option A**: "Use platform AI (50 requests/month free)"
4. **Option B**: "Bring your own API key (unlimited)"
   - **Recommended**: OpenRouter (100+ models)
   - Alternative: OpenAI Direct or Anthropic Direct
5. If choosing B, simple form to enter API key
6. Test connection automatically
7. Browse and select preferred models
8. Done!

**For Existing Customers:**
1. Notice in dashboard: "You've used 45/50 free AI requests this month"
2. CTA: "Upgrade to unlimited by adding your API key"
3. Click → Redirected to AI settings page
4. Recommended: "Get OpenRouter API key for access to 100+ models"
5. Enter key, test, select models, save
6. Immediately see "Unlimited" badge

---

## Migration Strategy

### For New Installations

- Default configuration automatically set to `platform_default`
- Customers can optionally configure their own keys
- No migration needed

### For Existing Installations

#### Step 1: Install Dependencies

```bash
pnpm add @ai-sdk/openai @ai-sdk/anthropic
```

#### Step 2: Database Migration

```bash
# Add column with default value
pnpm db:push

# Or create migration script
pnpm drizzle-kit generate:pg
pnpm db:migrate
```

#### Step 3: Backfill Existing Data

```typescript
// scripts/backfill-ai-config.ts
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { sql } from 'drizzle-orm';

async function backfillAiConfig() {
  const tenantsWithoutConfig = await db.query.tenants.findMany({
    where: sql`ai_config IS NULL`,
  });

  for (const tenant of tenantsWithoutConfig) {
    await db.update(tenants)
      .set({
        aiConfig: {
          provider: 'platform_default',
          models: {
            chat: 'gpt-4',
            embedding: 'text-embedding-3-small',
          },
          usageTracking: true,
        },
      })
      .where(eq(tenants.id, tenant.id));
  }

  console.log(`Backfilled ${tenantsWithoutConfig.length} tenants`);
}

backfillAiConfig();
```

#### Step 4: Code Deployment

```bash
# Feature flag approach
# Deploy with BYOK_ENABLED=false
vercel deploy

# Test internally
# Enable for specific org IDs
BYOK_ENABLED=true
BYOK_ALLOWED_ORGS=org_123,org_456

# Full rollout
BYOK_ENABLED=true
```

#### Step 5: Communication

**Email to Customers:**
```
Subject: New Feature: Bring Your Own AI Key + 100+ Model Choices

Hi [Customer Name],

We're excited to announce a major upgrade to Lead Agent: Bring Your Own AI Key (BYOK) with access to 100+ AI models!

What this means for you:
✅ Unlimited AI-powered lead qualification (no more monthly limits)
✅ Choose from 100+ models: GPT-4, Claude 3.5 Sonnet, Gemini, Llama 3, and more
✅ Full cost transparency - pay your AI provider directly
✅ Enhanced data privacy - requests go to your account
✅ Often cheaper than our platform pricing due to volume discounts

Recommended: Get started with OpenRouter
→ One API key = Access to 100+ models from all major providers
→ Competitive pricing with volume discounts
→ Sign up at: openrouter.ai

Getting started is easy:
1. Go to Settings → AI Configuration
2. Select "OpenRouter" (recommended) or choose OpenAI/Anthropic direct
3. Add your API key
4. Browse and select your preferred models
5. Save and you're done!

Don't have an API key? You can continue using our platform AI with the existing free tier (50 requests/month).

Questions? Reply to this email or check our documentation: [link]

Happy qualifying!
The Lead Agent Team
```

---

## Testing Checklist

### Unit Tests

- [ ] Encryption/decryption functions
- [ ] API key masking
- [ ] Cost calculation accuracy (OpenRouter, OpenAI, Anthropic)
- [ ] Model resolution logic
- [ ] Usage tracking
- [ ] Provider instance creation (Vercel AI SDK)

### Integration Tests

- [ ] Save and retrieve AI config
- [ ] Encrypt and decrypt API keys
- [ ] Make AI request with OpenRouter key
- [ ] Make AI request with OpenAI key
- [ ] Make AI request with Anthropic key
- [ ] Fallback to platform key
- [ ] Track usage correctly
- [ ] Calculate costs accurately
- [ ] Test different model providers through OpenRouter

### E2E Tests

- [ ] Full workflow with OpenRouter key and Claude 3.5 Sonnet
- [ ] Full workflow with OpenRouter key and GPT-4 Turbo
- [ ] Full workflow with OpenRouter key and Llama 3
- [ ] Full workflow with OpenAI direct key
- [ ] Full workflow with Anthropic direct key
- [ ] Full workflow with platform key
- [ ] Switch between providers
- [ ] Switch between models
- [ ] API key validation
- [ ] Usage dashboard displays correctly
- [ ] Model catalog browsing

### Security Tests

- [ ] API keys never logged
- [ ] API keys never in error messages
- [ ] Encrypted keys can't be decrypted without secret
- [ ] Authorization checks work
- [ ] SQL injection protection
- [ ] XSS protection in UI
- [ ] OpenRouter-specific headers working

### Performance Tests

- [ ] AI request latency unchanged with provider instances
- [ ] Database queries optimized
- [ ] Concurrent requests handled
- [ ] Large usage data loads quickly
- [ ] Model instance caching (if implemented)

---

## Environment Variables

Add to `.env`:

```bash
# Encryption
ENCRYPTION_SECRET=your-64-character-random-hex-string-here-must-be-exactly-64-chars

# Platform AI keys (fallback for free tier)
AI_GATEWAY_API_KEY=your-platform-openai-key
ANTHROPIC_API_KEY=your-platform-anthropic-key

# Optional: Platform OpenRouter key for free tier
OPENROUTER_API_KEY=your-platform-openrouter-key

# Feature flags
BYOK_ENABLED=true
BYOK_ALLOWED_ORGS=org_123,org_456  # Optional: limit to specific orgs during beta
```

**Generate Encryption Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Cost Analysis

### Platform Cost Savings

**Before BYOK** (100 customers, 500 AI requests/month each):
- Total AI requests: 50,000/month
- Average cost per request: $0.05 (GPT-4)
- Monthly AI cost: **$2,500**
- Annual AI cost: **$30,000**

**After BYOK** (70% adoption with OpenRouter):
- Platform requests: 15,000/month (30% still on free tier)
- Platform AI cost: **$750/month**
- Annual savings: **$21,000**

**Customer savings with OpenRouter** (vs platform markup):
- Platform price: $0.05/request
- OpenRouter (Claude Haiku): $0.006/request (12x cheaper)
- Customer saves 88% on AI costs

### Customer Value Proposition

**Platform AI** (Free Tier):
- 50 requests/month = $2.50 value
- Limited to platform-chosen model
- Shared rate limits

**BYOK with OpenRouter**:
- Unlimited requests
- Choose from 100+ models
- Direct API access (faster)
- Often 50-90% cheaper than platform pricing
- Best for 50+ requests/month

---

## Success Metrics

### Adoption Metrics
- % of customers who configure BYOK
- % choosing OpenRouter vs direct providers
- % of AI requests using customer keys vs platform keys
- Time to first BYOK configuration
- Model diversity (how many different models are being used)

### Usage Metrics
- Average AI requests per customer (before vs after BYOK)
- Model distribution (Claude vs GPT vs Gemini vs Llama)
- Average cost per request by provider
- Token usage trends

### Business Metrics
- Platform AI cost reduction
- Customer churn rate (expect lower with BYOK)
- Upsell rate to higher tiers
- Enterprise deal closure rate (BYOK is often requirement)
- Customer satisfaction with model choice

### Technical Metrics
- API key encryption/decryption performance
- Usage tracking accuracy
- Error rate for customer-provided keys
- Dashboard load time
- Model resolution latency

---

## Future Enhancements

### Phase 2 (Q2 2025)
- [ ] Support for Google Gemini Direct (not just via OpenRouter)
- [ ] Support for Azure OpenAI
- [ ] Custom model fine-tuning support (via OpenRouter)
- [ ] AI usage budgets and caps per tenant
- [ ] Slack alerts for cost thresholds
- [ ] Model recommendation engine (suggest cheaper alternatives)

### Phase 3 (Q3 2025)
- [ ] Multi-region AI routing
- [ ] Automatic model fallback (GPT-4 → GPT-3.5 if rate limited)
- [ ] A/B testing different models for same operation
- [ ] AI prompt versioning and management
- [ ] Cost optimization recommendations
- [ ] OpenRouter credits integration

### Phase 4 (Q4 2025)
- [ ] Custom AI model hosting
- [ ] Vector database BYOD (Bring Your Own Database)
- [ ] AI audit logs and compliance reports
- [ ] Advanced cost allocation and chargebacks
- [ ] AI performance analytics (quality metrics, not just cost)
- [ ] Model performance comparison dashboard

---

## Support & Troubleshooting

### Common Issues

**Issue**: "Invalid API key" error
- **Solution**: Verify key format matches provider
  - OpenRouter: `sk-or-v1-...`
  - OpenAI: `sk-proj-...` or `sk-...`
  - Anthropic: `sk-ant-...`
- **Check**: Key hasn't expired or been revoked
- **Test**: Use Test Connection button

**Issue**: "Model not found" error with OpenRouter
- **Solution**: Check model name format is `provider/model`
  - ✅ Correct: `anthropic/claude-3.5-sonnet`
  - ❌ Wrong: `claude-3.5-sonnet`
- **Check**: Model is available on OpenRouter (check openrouter.ai/models)
- **Try**: Use a different model temporarily

**Issue**: "High costs" alert
- **Solution**: Review usage dashboard for unexpected operations
- **Check**: Which models are being used (switch to cheaper alternatives)
- **Optimize**: Use cheaper models for simple tasks (Haiku instead of Sonnet)
- **Compare**: Check if OpenRouter is actually cheaper than direct API

**Issue**: "Rate limit exceeded"
- **Solution**: This is from customer's AI provider account, not our platform
- **Check**: Their account tier and rate limits at provider
- **Fix**: Upgrade their AI provider account or implement request queuing
- **OpenRouter**: Usually has higher limits than direct APIs

**Issue**: Usage stats don't match AI provider bill
- **Solution**: Our cost estimates are approximate
- **Check**: Provider's actual pricing (may vary by region, volume)
- **OpenRouter**: Check actual usage in OpenRouter dashboard
- **Note**: Always refer to provider's bill for actual costs

**Issue**: Embedding errors with OpenRouter
- **Solution**: OpenRouter proxies to OpenAI for embeddings
- **Check**: Make sure embedding model is OpenAI-compatible
- **Recommended**: Use `text-embedding-3-small` or `text-embedding-3-large`

---

## Resources

- **OpenRouter**:
  - [OpenRouter Homepage](https://openrouter.ai)
  - [Model List & Pricing](https://openrouter.ai/models)
  - [API Documentation](https://openrouter.ai/docs)
  - [Get API Key](https://openrouter.ai/keys)

- **Vercel AI SDK**:
  - [AI SDK Documentation](https://sdk.vercel.ai/docs)
  - [Provider Setup](https://sdk.vercel.ai/docs/providers)
  - [Custom Providers](https://sdk.vercel.ai/docs/providers/custom)

- **Direct Providers**:
  - [OpenAI API Documentation](https://platform.openai.com/docs)
  - [Anthropic API Documentation](https://docs.anthropic.com)
  - [Google Gemini API](https://ai.google.dev/docs)

- **Security**:
  - [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
  - [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
  - [OWASP API Security](https://owasp.org/www-project-api-security/)

---

**Document Version**: 2.0
**Author**: Development Team
**Last Updated**: 2025-01-27
**Next Review**: After Phase 1 completion
