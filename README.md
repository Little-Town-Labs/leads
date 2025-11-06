# Lead Agent

<img width="1819" height="1738" alt="hero" src="https://github.com/user-attachments/assets/347757fd-ad00-487d-bdd8-97113f13878b" />

A **multi-tenant SaaS platform** for AI-powered lead qualification and research. Built with [Next.js 16](http://nextjs.org/), [Clerk](https://clerk.com), [Drizzle ORM](https://orm.drizzle.team), [Neon Database](https://neon.tech), [Vercel AI SDK](https://ai-sdk.dev/), and [Workflow DevKit](https://useworkflow.dev/).

## 🎯 What This Is

An intelligent lead qualification system that:
- Captures leads through customized assessment quizzes per tenant
- Automatically researches and qualifies leads using AI
- Generates personalized outreach emails
- Provides human-in-the-loop approval via Slack or built-in dashboard
- Supports multiple organizations with complete data isolation

**Multi-Tenant Architecture**: Each organization gets their own branded subdomain, custom quiz, and isolated data.

## 📋 Current Status

✅ **Phase 1 & 2 Complete**: Multi-tenant infrastructure with subdomain routing
⏭️ **Phase 3 Next**: Quiz implementation for tenant-specific assessments

### Active Tenants
1. **Lead Agent Demo** (`lead-agent` subdomain) - Product demonstration
2. **Timeless Technology Solutions** (`timeless-tech` subdomain) - DDIP business

## 🚀 Quick Start

See [NEXT-STEPS.md](NEXT-STEPS.md) for setup instructions and [docs/](docs/) for comprehensive documentation.

## Deploy with Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel-labs%2Flead-agent&env=AI_GATEWAY_API_KEY,SLACK_BOT_TOKEN,SLACK_SIGNING_SECRET,SLACK_CHANNEL_ID,EXA_API_KEY&project-name=lead-agent&repository-name=lead-agent)

## Architecture

<img width="1778" height="1958" alt="architecture" src="https://github.com/user-attachments/assets/53943961-4692-4b42-8e8d-47b03a01d233" />

```
User submits form
     ↓
start(workflow) ← (Workflow DevKit)
     ↓
Research agent ← (AI SDK Agent)
     ↓
Qualify lead ← (AI SDK generateObject)
     ↓
Generate email ← (AI SDK generateText)
     ↓
Slack approval (human-in-the-loop) ← (Slack integration)
     ↓
Send email (on approval)
```

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org)
- **Database**: [Neon PostgreSQL](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team)
- **Authentication**: [Clerk](https://clerk.com) (with Organizations)
- **AI**: [Vercel AI SDK](https://ai-sdk.dev/) with [AI Gateway](https://vercel.com/ai-gateway)
- **Workflows**: [Workflow DevKit](http://useworkflow.dev/) (durable execution)
- **Human-in-the-Loop**: Built-in dashboard + optional [Slack integration](https://vercel.com/templates/ai/slack-agent-template)
- **Web Search**: [Exa.ai](https://exa.ai/)

## 📂 Documentation

- **[NEXT-STEPS.md](NEXT-STEPS.md)** - Current status and immediate next steps
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines and code patterns
- **[CLERK_WEBHOOK_SETUP.md](CLERK_WEBHOOK_SETUP.md)** - Clerk webhook configuration guide
- **[docs/](docs/)** - Comprehensive documentation
  - [Business Proposal](docs/PROPOSAL.md) - Product vision and strategy
  - [Implementation Summary](docs/IMPLEMENTATION-SUMMARY.md) - What's been built
  - [Deployment Guide](docs/DEPLOYMENT.md) - Vercel deployment walkthrough
  - [Testing Guide](docs/MULTI-TENANT-TESTING.md) - Local subdomain testing

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended)
- [Neon Database](https://neon.tech) account
- [Clerk](https://clerk.com) account
- [Vercel AI Gateway API Key](https://vercel.com/ai-gateway)
- [Exa API key](https://exa.ai/)
- (Optional) Slack workspace for notifications

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure these required variables:
```bash
# Database
DATABASE_URL=postgresql://...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI Services
AI_GATEWAY_API_KEY=...
EXA_API_KEY=...

# Optional: Slack
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=C...
```

3. Run database migrations:
```bash
pnpm db:migrate
```

4. Start the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) to see the application and submit a test lead.

## Project Structure

```
lead-agent/
├── app/
│   ├── api/
│   │   ├── submit/       # Form submission endpoint that kicks off workflow
│   │   └── slack/        # Slack webhook handler (receives slack events)
│   └── page.tsx          # Home page
├── lib/
│   ├── services.ts       # Core business logic (qualify, research, email)
│   ├── slack.ts          # Slack integration
│   └── types.ts          # TypeScript schemas and types
├── components/
│   ├── lead-form.tsx     # Main form component
└── workflows/
    └── inbound/          # Inbound lead workflow
        ├── index.ts      # Exported workflow function
        └── steps.ts      # Workflow steps
```

## Key Features

### Workflow durable execution with `use workflow`

This project uses [Workflow DevKit](https://useworkflow.dev) to kick off a workflow that runs the agent, qualification, and other actions.

### AI-Powered Qualification

Leads are automatically categorized (QUALIFIED, FOLLOW_UP, SUPPORT, etc.) using the latest OpenAI model via the Vercel AI SDK and `generateObject`. Reasoning is also provided for each qualification decision. Edit the qualification categories by changing the `qualificationCategorySchema` in `lib/types.ts`.

### AI SDK Agent class

Uses the [AI SDK Agent class](https://ai-sdk.dev/docs/agents/overview) to create an autonomous research agent. Create new tools for the Agent and edit prompts in `lib/services.ts`.

### Human-in-the-Loop Workflow

Generated emails are sent to Slack with approve/reject buttons, ensuring human oversight before any outbound communication.

The Slack message is defined with [Slack's Block Kit](https://docs.slack.dev/block-kit/). It can be edited in `lib/slack.ts`.

### Extensible Architecture

- Add new qualification categories in the `qualificationCategorySchema` in `types.ts`
- Adjust the prompts and configuration for all AI calls in `lib/services.ts`
- Alter the agent by tuning parameters in `lib/services.ts`
- Add new service functions if needed in `lib/services.ts`
- Follow [Vercel Workflow docs](https://useworkflow.dev) to add new steps to the workflow
- Create new workflows for other qualification flows, outbound outreach, etc.

## License

MIT
