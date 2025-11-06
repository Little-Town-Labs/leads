# Lead Agent Documentation

This folder contains comprehensive documentation for the Lead Agent multi-tenant SaaS platform.

## 📚 Documentation Index

### Business & Planning
- **[PROPOSAL.md](PROPOSAL.md)** - Complete business proposal, product vision, market analysis, and roadmap

### Implementation Guides
- **[IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)** - Multi-tenant implementation summary (Phases 1-2 complete)
- **[MULTI-TENANT-TESTING.md](MULTI-TENANT-TESTING.md)** - Local testing guide for subdomain routing

### Deployment
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete Vercel deployment guide with environment setup

---

## Quick Reference

### Current Status
✅ **Phase 1 & 2 Complete**: Multi-tenant architecture with subdomain routing
⏭️ **Phase 3 Next**: Quiz implementation for tenant-specific assessments

### Active Tenants
1. **Lead Agent Demo** (`lead-agent` subdomain) - Product demo
2. **Timeless Technology Solutions** (`timeless-tech` subdomain) - DDIP business

### Key Files in Root
- [README.md](../README.md) - Project overview and tech stack
- [CLAUDE.md](../CLAUDE.md) - Development guidelines for Claude Code
- [CLERK_WEBHOOK_SETUP.md](../CLERK_WEBHOOK_SETUP.md) - Clerk webhook configuration
- [NEXT-STEPS.md](../NEXT-STEPS.md) - Current next steps and priorities

---

## Architecture Overview

### Multi-Tenant Structure
```
Main Domain (leadagent.com)
├── SaaS marketing landing page
└── Admin dashboard

Tenant Subdomains
├── lead-agent.leadagent.com → Lead Agent Demo
├── timeless-tech.leadagent.com → Timeless Tech DDIP
└── [future-tenant].leadagent.com → Custom tenants
```

### Tech Stack
- **Framework**: Next.js 16
- **Database**: Neon PostgreSQL + Drizzle ORM
- **Auth**: Clerk (with organizations)
- **AI**: Vercel AI SDK + Workflow DevKit
- **Deployment**: Vercel

---

## Getting Started

### For Development
1. Read [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md) - Understand what's been built
2. Read [MULTI-TENANT-TESTING.md](MULTI-TENANT-TESTING.md) - Set up local testing
3. Read [../CLAUDE.md](../CLAUDE.md) - Development patterns and conventions
4. Read [../NEXT-STEPS.md](../NEXT-STEPS.md) - See what to work on next

### For Deployment
1. Read [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment walkthrough
2. Follow [../CLERK_WEBHOOK_SETUP.md](../CLERK_WEBHOOK_SETUP.md) - Set up webhooks
3. Configure environment variables in Vercel
4. Deploy and test

### For Business Context
1. Read [PROPOSAL.md](PROPOSAL.md) - Full product vision and strategy
2. Understand the two-product approach:
   - Lead Agent SaaS (multi-tenant platform)
   - Timeless Tech DDIP (help desk insights)

---

## Need Help?

- **Codebase questions**: See [../CLAUDE.md](../CLAUDE.md)
- **Testing issues**: See [MULTI-TENANT-TESTING.md](MULTI-TENANT-TESTING.md)
- **Deployment problems**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Next tasks**: See [../NEXT-STEPS.md](../NEXT-STEPS.md)
