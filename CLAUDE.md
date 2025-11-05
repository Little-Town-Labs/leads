# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Lead Agent is an inbound lead qualification and research system that uses AI-powered workflows for automated lead processing with human-in-the-loop approval via Slack. Built with Next.js 16, Vercel AI SDK, and Workflow DevKit.

## Development Commands

```bash
# Install dependencies (use pnpm preferred)
pnpm install

# Run development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture

### Request Flow

1. **Form Submission** (`app/api/submit/route.ts`) - POST endpoint validates form data with Zod and starts workflow
2. **Workflow Execution** (`workflows/inbound/`) - Durable workflow with 'use workflow' directive
3. **Research Step** - AI SDK Agent with tools (search, fetchUrl, crmSearch, etc.)
4. **Qualification Step** - `generateObject` with structured output
5. **Email Generation** - `generateText` for personalized response
6. **Human Approval** - Slack message with interactive buttons
7. **Slack Webhook** (`app/api/slack/route.ts`) - Handles approve/reject actions

### Workflow DevKit Integration

Workflows use special directives:
- `'use workflow'` - Marks async function as durable workflow
- `'use step'` - Marks individual steps for retry/recovery

Workflows are started with `start(workflowInbound, [data])` and run in the background.

### AI SDK Patterns

**Agent Class** (`lib/services.ts:197-220`):
- Uses `Experimental_Agent` for autonomous research
- Configure with `stopWhen: [stepCountIs(20)]` to limit iterations
- Tools are defined with `tool()` helper and Zod schemas

**Structured Generation**:
- `generateObject` for qualification with schema validation
- `generateText` for email composition
- Model configured via Vercel AI Gateway: `'openai/gpt-5'`

### Slack Integration

Uses `@slack/bolt` with `@vercel/slack-bolt` adapter:
- Slack credentials are optional - app gracefully degrades if not configured
- Interactive messages use Block Kit format (`lib/slack.ts:57-90`)
- Action handlers in `app/api/slack/route.ts` respond to button clicks
- `manifest.json` contains Slack app configuration

## Key Files

- **`lib/services.ts`** - Core business logic: qualify, writeEmail, researchAgent, and tool definitions
- **`lib/types.ts`** - Zod schemas for forms and qualification categories
- **`workflows/inbound/index.ts`** - Main workflow orchestration
- **`workflows/inbound/steps.ts`** - Individual workflow steps
- **`app/api/submit/route.ts`** - Form submission endpoint with bot detection
- **`app/api/slack/route.ts`** - Slack event and action handlers

## Customization Points

### Add Qualification Categories
Edit `qualificationCategorySchema` in `lib/types.ts`:
```typescript
export const qualificationCategorySchema = z.enum([
  'QUALIFIED',
  'UNQUALIFIED',
  'SUPPORT',
  'FOLLOW_UP',
  'YOUR_CATEGORY' // add here
]);
```

### Implement Service Placeholders
`lib/services.ts` contains empty functions to implement:
- `sendEmail()` (line 75) - Integrate with Sendgrid/Mailgun/Resend
- `crmSearch.execute()` (line 114) - Connect to Salesforce/Hubspot/Snowflake
- `techStackAnalysis.execute()` (line 128) - Fetch tech stack data
- `queryKnowledgeBase.execute()` (line 182) - Query vector DB (Turbopuffer/Pinecone/Postgres)

### Add Agent Tools
Define new tools in `lib/services.ts` with `tool()` helper, then add to `researchAgent.tools` object (line 211).

### Modify Prompts
- Research agent system prompt: `lib/services.ts:199-210`
- Qualification prompt: `lib/services.ts:27-29`
- Email generation prompt: `lib/services.ts:44-46`

### Extend Workflow
Add new steps to `workflows/inbound/index.ts` - each step function must have `'use step'` directive.

## Environment Variables

Required:
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway for model access
- `EXA_API_KEY` - Exa.ai for web search

Optional (Slack features disabled without these):
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET`
- `SLACK_CHANNEL_ID`

## Important Implementation Notes

- Bot detection using `botid` package in submit endpoint
- Workflow DevKit provides automatic retries and durability
- Slack app initialization is deferred and conditional
- Agent stops after 20 steps by default to prevent runaway execution
- Research results are truncated to 500 chars in Slack messages
