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

### AI SDK Patterns

**Agent Class** ([lib/services.ts:197-220](lib/services.ts#L197-L220)):
```typescript
const agent = new Experimental_Agent({
  model: aiGateway('openai/gpt-4o'),
  stopWhen: [stepCountIs(20)], // Prevent runaway
  tools: { search, fetchUrl, crmSearch, ... }
});
```

**Structured Output**:
- `generateObject` with Zod schema for qualification
- `generateText` for email composition
- Model: `aiGateway('openai/gpt-4o')` via Vercel AI Gateway

### Clerk Integration

**Organization Management**:
- Webhook handler: [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts)
- Syncs organization and user data to database
- Handles create/update/delete events
- Organization switcher: [app/select-organization/page.tsx](app/select-organization/page.tsx)

**Role-Based Access**:
- Admin role can manage members and settings
- Regular members can view analytics and leads

## Key Files

- [lib/services.ts](lib/services.ts) - Business logic: qualify, writeEmail, researchAgent, tool definitions
- [lib/types.ts](lib/types.ts) - Zod schemas for forms and qualification categories
- [lib/slack.ts](lib/slack.ts) - Slack integration (optional, graceful degradation)
- [db/schema.ts](db/schema.ts) - Drizzle database schema with multi-tenant tables
- [workflows/inbound/index.ts](workflows/inbound/index.ts) - Main workflow orchestration
- [workflows/inbound/steps.ts](workflows/inbound/steps.ts) - Individual durable steps
- [app/api/submit/route.ts](app/api/submit/route.ts) - Form submission with bot detection
- [app/api/webhooks/clerk/route.ts](app/api/webhooks/clerk/route.ts) - Clerk organization sync
- [middleware.ts](middleware.ts) - Subdomain routing and auth

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
- Research agent system prompt → `researchAgent()` function
- Qualification prompt → `qualify()` function
- Email generation prompt → `writeEmail()` function

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
AI_GATEWAY_API_KEY                   # Vercel AI Gateway API key
EXA_API_KEY                          # Exa.ai search API key
```

**Optional** (Slack integration disabled without these):
```bash
SLACK_BOT_TOKEN                      # xoxb-... bot token
SLACK_SIGNING_SECRET                 # Slack app signing secret
SLACK_CHANNEL_ID                     # C... channel ID for notifications
```

## Implementation Notes

**Security**:
- Bot detection using `botid` package in form submission
- All database queries scoped by `organizationId` for tenant isolation
- Clerk middleware protects dashboard routes
- CSRF protection via Clerk session tokens

**Reliability**:
- Workflow DevKit provides automatic retries and crash recovery
- Agent limited to 20 steps to prevent runaway execution
- Graceful degradation when Slack credentials missing

**Multi-Tenancy**:
- Subdomain extracted via middleware and passed to routes
- Organization data synced from Clerk via webhook
- All queries filtered by `organizationId` from auth context

**Performance**:
- Research results truncated to 500 chars in Slack messages
- Database uses indexes on `organizationId` for fast queries
- Workflow runs in background, doesn't block form submission

**Tech Stack Analysis**:
- Uses `simple-wappalyzer` for free, unlimited technology detection
- Detects 70-80% of technologies (CMS, frameworks, servers, analytics)
- No external API required - runs locally in serverless functions
- Update package quarterly: `pnpm update simple-wappalyzer`
- Best detection for traditional websites, less accurate for SPAs
- Tool available to AI agent during research phase
