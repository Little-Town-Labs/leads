# Lead Agent

<img width="1819" height="1738" alt="hero" src="https://github.com/user-attachments/assets/347757fd-ad00-487d-bdd8-97113f13878b" />

A **multi-tenant SaaS platform** for AI-powered lead qualification and research. Built with [Next.js 16](http://nextjs.org/), [Clerk](https://clerk.com), [Drizzle ORM](https://orm.drizzle.team), [Neon Database](https://neon.tech), [Vercel AI SDK](https://ai-sdk.dev/), and [Workflow DevKit](https://useworkflow.dev/).

## Overview

An intelligent lead qualification system that:
- Captures leads through customized assessment quizzes per tenant
- Automatically researches and qualifies leads using AI
- Generates personalized outreach emails
- Provides human-in-the-loop approval via dashboard or Slack
- Supports multiple organizations with complete data isolation
- **BYOK (Bring Your Own Key)**: Organizations can use their own AI API keys for unlimited usage

**Multi-Tenant Architecture**: Each organization gets their own branded subdomain, custom quiz, isolated data, and optional custom AI configuration.

## Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Flead-agent&env=AI_GATEWAY_API_KEY,SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET,SLACK_CHANNEL_ID,EXA_API_KEY&project-name=lead-agent&repository-name=lead-agent)

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **Database**: [Neon PostgreSQL](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: [Clerk](https://clerk.com)
- **AI**: [Vercel AI SDK](https://ai-sdk.dev/) with [AI Gateway](https://vercel.com/ai-gateway)
- **Workflows**: [Workflow DevKit](http://useworkflow.dev/)
- **Search**: [Exa.ai](https://exa.ai/)

## Documentation

- [NEXT-STEPS.md](NEXT-STEPS.md) - Current status and next steps
- [CLAUDE.md](CLAUDE.md) - Development guide and architecture
- [CLERK_WEBHOOK_SETUP.md](CLERK_WEBHOOK_SETUP.md) - Webhook configuration
- [docs/](docs/) - Comprehensive documentation

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)
- [Neon Database](https://neon.tech) account
- [Clerk](https://clerk.com) account (with Organizations enabled)
- [OpenRouter](https://openrouter.ai/) API key (recommended for 100+ models) OR [Vercel AI Gateway](https://vercel.com/ai-gateway) API key
- [Exa.ai](https://exa.ai/) API key
- Encryption secret for BYOK (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- (Optional) Slack workspace

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Generate encryption secret for BYOK
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Configure required variables in .env.local:
# - DATABASE_URL (from Neon)
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY + CLERK_WEBHOOK_SECRET
# - ENCRYPTION_SECRET (generated above)
# - OPENROUTER_API_KEY (recommended) OR AI_GATEWAY_API_KEY
# - EXA_API_KEY
# - (Optional) SLACK_BOT_TOKEN + SLACK_SIGNING_SECRET + SLACK_CHANNEL_ID

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
lead-agent/
├── app/
│   ├── (dashboard)/        # Multi-tenant dashboard (subdomain routing)
│   │   ├── admin/          # Admin management panel
│   │   │   ├── ai-settings/# AI configuration & usage analytics
│   │   │   ├── branding/   # Brand customization
│   │   │   └── quiz/       # Quiz builder
│   │   ├── analytics/      # Analytics dashboard
│   │   └── settings/       # Organization settings
│   ├── api/
│   │   ├── submit/         # Form submission endpoint
│   │   ├── slack/          # Slack webhook handler
│   │   └── webhooks/clerk/ # Clerk organization sync
│   └── select-organization/# Organization switcher
├── db/
│   └── schema.ts           # Drizzle database schema (with AI config)
├── lib/
│   ├── ai-config.ts        # AI configuration management
│   ├── ai-resolver.ts      # Model resolution per organization
│   ├── ai-usage.ts         # Usage tracking & analytics
│   ├── encryption.ts       # API key encryption (AES-256-GCM)
│   ├── services.ts         # Business logic (qualify, research, email)
│   ├── slack.ts            # Slack integration
│   └── types.ts            # Zod schemas and types
└── workflows/
    └── inbound/            # Lead qualification workflow
```

## Key Features

### Multi-Tenant with Subdomain Routing
Each organization gets a branded subdomain (`[org].leadagent.app`) with complete data isolation via Clerk Organizations.

### AI-Powered Research & Qualification
Autonomous AI agent researches leads using web search and CRM data, then categorizes them (QUALIFIED, FOLLOW_UP, SUPPORT, etc.) with reasoning.

### Durable Workflow Execution
Uses Workflow DevKit's `'use workflow'` directive for reliable background processing with automatic retries.

### Human-in-the-Loop Approval
Generated emails require approval via built-in dashboard or optional Slack integration before sending.

### BYOK (Bring Your Own Key)
Organizations can configure their own AI provider and API keys:
- **OpenRouter** (recommended): Access to 100+ models with a single API key
- **OpenAI Direct**: Use enterprise OpenAI agreements
- **Anthropic Direct**: Use enterprise Anthropic agreements
- **Platform Default**: Free tier with usage limits

**Features**:
- Encrypted API key storage (AES-256-GCM)
- Real-time usage tracking (tokens, costs, success rates)
- Per-operation and per-model analytics
- Cost alerts and monthly reports
- CSV export for billing reconciliation

Navigate to `/admin/ai-settings` to configure AI settings for your organization.

## License

MIT
