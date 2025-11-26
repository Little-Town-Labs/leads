# Multi-Tenant SaaS Architecture Design

> **Note on URLs**: This document uses `leadagent.com` as an example domain for clarity. The actual production URL is `leads.littletownlabs.site`. The application is **fully dynamic** and works with any domain without code changes. See [URL_CONFIGURATION.md](./URL_CONFIGURATION.md) for details.

## Overview

Lead Agent is a **multi-tenant SaaS** platform where:
- **SaaS customers** (businesses) sign up, configure their branded assessment, and manage leads
- **End customers** (leads/prospects) visit tenant subdomains to take assessments (no account needed)
- **Team members** can be invited to help manage leads within a tenant

---

## URL Structure

### Main SaaS Domain
```
leadagent.com (or leads.littletownlabs.site)
├── /                          → SaaS marketing page (public)
├── /assessment                → Demo assessment - "Try Before You Buy" (public)
│   ├── /quiz                  → Demo quiz for potential SaaS customers
│   └── /results/[leadId]      → Demo results with sign-up CTA
├── /sign-in                   → Clerk sign-in for SaaS customers
├── /sign-up                   → Clerk sign-up for SaaS customers
├── /dashboard                 → SaaS customer dashboard (protected)
├── /leads                     → Lead management (protected)
├── /analytics                 → Analytics (protected)
├── /settings                  → Team & account settings (protected)
└── /admin                     → Tenant configuration (protected, admin only)
    ├── /admin/branding        → Configure logo, colors, landing page
    ├── /admin/quiz            → Configure assessment questions
    ├── /admin/email           → Email templates
    └── /admin/workflows       → AI workflow settings
```

### Tenant Subdomains
```
{tenant-slug}.leadagent.com (e.g., acme.leadagent.com)
├── /                          → Tenant's branded landing page (public)
├── /quiz                      → Assessment quiz (public)
└── /results                   → Quiz results page (public)
```

### Custom Domains (Optional Future Feature)
```
assessment.acme.com (CNAME → acme.leadagent.com)
```

---

## User Flows

### Flow 1: Potential SaaS Customer (Demo Experience)

**Goal**: Experience the product before signing up - "Try Before You Buy"

```
1. Visit leadagent.com
   ↓
2. Click "Try Demo Assessment" → /assessment
   - See explanation of what they'll experience
   ↓
3. Take demo quiz → /assessment/quiz
   - Questions about THEIR business (lead volume, team size, pain points)
   - Calculate "Product Fit Score" (0-100%)
   ↓
4. View results → /assessment/results/[leadId]
   - See fit score (e.g., 87% = "Great Fit!")
   - ROI calculator based on their inputs
   - Preview of what THEIR customers would experience
   - Tier-specific CTAs:
     * Great Fit (70%+): "Start Free Trial" + "Schedule Demo"
     * Good Fit (40-69%): "Learn More" + "Talk to Sales"
     * Not Ready (<40%): "Get Resources" + nurture sequence
   ↓
5. Convert:
   - Option A: Click "Sign Up" → Create account (Flow 2)
   - Option B: Click "Schedule Demo" → Sales call
   - Option C: Not ready → Email nurture sequence
```

**Key Difference**: This is about acquiring SaaS customers, NOT qualifying their leads.

---

### Flow 2: SaaS Customer (Business Owner)

**Goal**: Set up their branded lead qualification system

```
1. Visit leadagent.com
   ↓
2. Click "Sign Up" → Create Clerk account (email/password or OAuth)
   ↓
3. Create Organization → Becomes a "tenant"
   - Organization name: "Acme Corp"
   - Subdomain: acme.leadagent.com
   ↓
4. Redirected to /admin/branding
   - Upload logo
   - Choose brand colors
   - Customize landing page copy
   ↓
5. Configure quiz at /admin/quiz
   - Add/edit assessment questions
   - Set scoring weights
   - Configure qualification thresholds
   ↓
6. Share acme.leadagent.com with their customers
   ↓
7. Manage incoming leads at /leads
   - View lead scores
   - Review AI research
   - Approve/reject AI-generated emails
   ↓
8. (Optional) Invite team members at /settings
   - Send email invites
   - Assign roles (admin or member)
```

---

### Flow 3: End Customer (Lead/Prospect - Sub-Tenant)

**Goal**: Take tenant's assessment and receive personalized response

```
1. Visit acme.leadagent.com (from ad, email, QR code, etc.)
   ↓
2. See Acme's branded landing page
   - Hero section with Acme's value prop
   - CTA: "Start Your Free Assessment"
   ↓
3. Click "Start Assessment" → /quiz
   - Multi-step form with progress bar
   - 8-15 questions (configured by Acme)
   - Contact info collected
   ↓
4. Submit quiz → Instant scoring
   - Score calculated: 0-100%
   - Tier assigned: cold/warm/hot/qualified
   ↓
5. Redirected to /results
   - See readiness score
   - Tier-specific messaging
   - Next steps (e.g., "We'll contact you within 24 hours")
   ↓
6. (Backend) AI workflow triggers (if qualified)
   - AI researches company/LinkedIn
   - AI generates personalized email
   - Email queued for human approval
   ↓
7. Acme's team approves → Email sent
   - Lead receives personalized outreach
```

**Key Point**: Leads do NOT need a Clerk account. They're anonymous visitors.

---

### Flow 4: Team Member (Invited User)

**Goal**: Help manage leads for their organization

```
1. Receive email invite from admin
   - Link: leadagent.com/accept-invite?token=...
   ↓
2. Click link → Sign up with Clerk
   - Create account (email/password or OAuth)
   ↓
3. Automatically joined to organization
   - Role: "member" (not admin)
   ↓
4. Redirected to /dashboard
   - See organization's leads
   - Review & approve AI-generated emails
   - View analytics
   ↓
5. Limited access:
   ✅ /dashboard, /leads, /analytics
   ❌ /admin (admin-only routes)
```

---

## Dual-Purpose Assessment System

### Critical Design Decision: Two Assessment Contexts

The platform uses the **same quiz infrastructure** for two different purposes:

#### 1. Main Tenant Demo Assessment (SaaS Acquisition)

| Aspect | Details |
|--------|---------|
| **URL** | `leadagent.com/assessment` |
| **Purpose** | Acquire SaaS customers |
| **Target User** | Potential business owners considering Lead Agent |
| **Questions Focus** | Their business needs (lead volume, team size, pain points) |
| **Scoring Algorithm** | "Product Fit Score" (0-100%) |
| **Tier Labels** | Great Fit, Good Fit, Not Ready |
| **Results Page** | Conversion-focused with ROI calculator |
| **CTA** | "Start Free Trial" / "Schedule Demo" |
| **Follow-up Action** | Sales team notification, CRM entry, nurture sequence |
| **Branding** | Lead Agent branding |
| **Database** | Stored with `orgId: 'demo-org-id'` |

#### 2. Sub-Tenant Production Assessment (Lead Qualification)

| Aspect | Details |
|--------|---------|
| **URL** | `acme.leadagent.com/quiz` |
| **Purpose** | Qualify leads for tenant's business |
| **Target User** | Tenant's prospects/end customers |
| **Questions Focus** | Prospect's needs for tenant's product |
| **Scoring Algorithm** | "Readiness Score" (0-100%) |
| **Tier Labels** | Qualified, Hot, Warm, Cold |
| **Results Page** | Informational with next steps |
| **CTA** | "We'll contact you soon" |
| **Follow-up Action** | AI research → personalized email → human approval |
| **Branding** | Tenant's custom branding |
| **Database** | Stored with `orgId: tenant.clerkOrgId` |

### Why This Design Works

1. **Shared Infrastructure**: Same quiz engine, components, API routes
2. **Different Context**: Questions, scoring, and outcomes customized per use case
3. **Dual Value**:
   - Demo converts prospects to SaaS customers
   - Production generates qualified leads for tenants
4. **Scalability**: One codebase serves both flows efficiently

---

## Architecture Layers

### 1. Domain & Routing Layer

**Middleware Logic** (`middleware.ts`):

```typescript
1. Extract hostname from request
   - Example: "acme.leadagent.com" or "leadagent.com"

2. Check for subdomain
   - If NO subdomain (e.g., "leadagent.com"):
     → Serve main SaaS routes (/, /assessment, /sign-in, /dashboard, etc.)
     → /assessment → Demo assessment for SaaS acquisition

   - If subdomain exists (e.g., "acme"):
     → Rewrite to /[tenant] routes
     → Example: acme.leadagent.com/quiz → /acme/quiz
     → This serves tenant's production assessment

3. Skip rewriting for:
   - /api/* (API routes)
   - /_next/* (Next.js internals)
   - /sign-in, /sign-up (Clerk routes)
   - /assessment/* (Main tenant demo - do NOT rewrite)
   - /default-redirect (Clerk fallback)
   - /select-organization (Org picker)
```

---

### 2. Authentication & Authorization Layer (Clerk)

#### Clerk Organizations = Tenants

```
Clerk Organization
├── id: org_abc123
├── name: "Acme Corp"
├── slug: "acme"
└── members:
    ├── user_1 (admin role)
    ├── user_2 (member role)
    └── user_3 (member role)

Maps to:

Database Tenant Record
├── id: uuid
├── clerkOrgId: "org_abc123"
├── subdomain: "acme"
├── branding: { logoUrl, primaryColor, ... }
├── landingPage: { heroTitle, heroSubtitle, ... }
└── settings: { enableAiResearch, ... }
```

#### User Roles

| Role   | Can Access                          | Cannot Access |
|--------|-------------------------------------|---------------|
| Admin  | Everything (/dashboard, /admin)     | N/A           |
| Member | /dashboard, /leads, /analytics      | /admin        |

**Implementation**:
```typescript
// In /admin routes
const { orgRole } = await auth();
if (orgRole !== 'admin') {
  redirect('/dashboard');
}
```

#### Public vs Protected Routes

```
PUBLIC (No auth required):
├── / (main SaaS landing)
├── /[tenant]/* (tenant landing pages & quizzes)

PROTECTED (Clerk auth required):
├── /dashboard
├── /leads
├── /analytics
├── /settings
├── /admin
```

---

### 3. Data Layer

#### Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                    tenants                              │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ clerkOrgId (text) → Links to Clerk Organization        │
│ subdomain (text) → "acme"                               │
│ customDomain (text, nullable) → "assessment.acme.com"   │
│ name (text) → "Acme Corp"                               │
│ branding (jsonb) → { logoUrl, colors, fonts }           │
│ landingPage (jsonb) → { heroTitle, features }           │
│ settings (jsonb) → { enableAiResearch, threshold }      │
│ subscriptionTier → "starter" | "professional" | "enterprise" │
│ usageLimits (jsonb) → { maxQuizzes, maxWorkflows }     │
│ currentUsage (jsonb) → { quizzesThisMonth, ... }        │
└─────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴───────────────────────────┐
│              organizationMembers                        │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ clerkOrgId → Links to tenant                            │
│ clerkUserId → Links to user                             │
│ role → "admin" | "member"                               │
└─────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴───────────────────────────┐
│                      users                              │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ clerkUserId (text) → "user_abc123"                      │
│ email (text)                                            │
│ firstName, lastName                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    quizQuestions                        │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ orgId → Links to tenant's clerkOrgId                    │
│ questionNumber (int)                                    │
│ questionType → "contact_info" | "multiple_choice" | ... │
│ questionText, questionSubtext                           │
│ options (jsonb) → Question-specific options             │
│ scoringWeight (int)                                     │
└─────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴───────────────────────────┐
│                      leads                              │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ orgId → Which tenant this lead belongs to               │
│ name, email, company (from quiz)                        │
│ status → "pending" | "approved" | "rejected"            │
│ createdAt                                               │
└─────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────┴───────────────────────────┐
│                   leadScores                            │
├─────────────────────────────────────────────────────────┤
│ id (uuid)                                               │
│ leadId → Links to lead                                  │
│ readinessScore (int) → 0-100                            │
│ tier → "cold" | "warm" | "hot" | "qualified"            │
│ totalPoints, maxPossiblePoints                          │
│ breakdown (jsonb) → Score by category                   │
└─────────────────────────────────────────────────────────┘
```

---

### 4. Route Structure & Components

```
app/
├── layout.tsx                        # Root layout (Clerk provider)
├── page.tsx                          # SaaS landing page
│
├── assessment/                       # Demo assessment (SaaS acquisition)
│   ├── page.tsx                      # Demo landing page
│   ├── quiz/page.tsx                 # Demo quiz
│   └── results/[leadId]/page.tsx     # Demo results with conversion CTAs
│
├── sign-in/[[...sign-in]]/           # Clerk sign-in
├── sign-up/[[...sign-up]]/           # Clerk sign-up
├── select-organization/              # Org picker/creator
├── default-redirect/                 # Clerk fallback
│
├── (dashboard)/                      # Protected SaaS customer routes
│   ├── layout.tsx                    # Auth check + nav header
│   ├── dashboard/page.tsx            # Dashboard overview
│   ├── leads/page.tsx                # Lead list
│   ├── leads/[id]/page.tsx           # Lead detail
│   ├── analytics/page.tsx            # Analytics
│   ├── settings/page.tsx             # Team management
│   └── admin/                        # Admin-only routes
│       ├── branding/page.tsx         # Configure branding
│       ├── quiz/page.tsx             # Configure quiz
│       ├── email/page.tsx            # Email templates
│       └── workflows/page.tsx        # AI settings
│
└── [tenant]/                         # Public tenant routes
    ├── layout.tsx                    # Tenant branding wrapper
    ├── page.tsx                      # Tenant landing page
    ├── quiz/page.tsx                 # Assessment quiz
    └── results/page.tsx              # Results page
```

---

## Key Design Decisions

### 1. **Two Separate User Types**

| User Type        | Has Clerk Account? | Access                          | Purpose                    |
|------------------|--------------------|---------------------------------|----------------------------|
| SaaS Customer    | ✅ Yes             | /dashboard, /admin              | Manage their tenant        |
| End Customer     | ❌ No              | /[tenant] (public)              | Take assessment            |

### 2. **Tenant Isolation**

Every query must be scoped by organization:

```typescript
// ❌ BAD - Returns all leads across all tenants
const leads = await db.select().from(leads);

// ✅ GOOD - Returns only leads for current tenant
const { orgId } = await auth();
const leads = await db
  .select()
  .from(leads)
  .where(eq(leads.orgId, orgId));
```

### 3. **Subdomain = Tenant Lookup**

```typescript
// middleware.ts extracts subdomain
const subdomain = "acme"; // from acme.leadagent.com

// [tenant]/page.tsx looks up tenant
const tenant = await getTenantBySubdomain(subdomain);

// Renders tenant's branded landing page
<h1>{tenant.landingPage.heroTitle}</h1>
```

### 4. **Branding Customization**

Each tenant can customize:
- Logo (uploaded to S3/Vercel Blob)
- Primary & secondary colors (hex codes)
- Landing page content (hero title, subtitle, features)
- Email templates (AI uses these as base)

Applied via CSS variables and dynamic rendering:

```tsx
<div
  style={{
    '--primary-color': tenant.branding.primaryColor,
    '--secondary-color': tenant.branding.secondaryColor,
  }}
>
  <h1>{tenant.landingPage.heroTitle}</h1>
</div>
```

### 5. **Role-Based Access Control**

```typescript
// app/(dashboard)/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const { orgRole } = await auth();

  if (orgRole !== 'admin') {
    redirect('/dashboard'); // Members can't access admin
  }

  return <>{children}</>;
}
```

---

## Example User Scenarios

### Scenario A: "Acme Corp" Sets Up Lead Agent

1. **Sarah (CEO)** visits `leadagent.com`
2. Signs up → Creates organization "Acme Corp"
3. Gets subdomain: `acme.leadagent.com`
4. Configures branding:
   - Uploads Acme logo
   - Sets brand color: #FF6B00 (orange)
   - Writes hero: "Transform Your Help Desk with AI"
5. Creates 10-question assessment
6. Invites **John (Sales Manager)** to help manage leads
7. Shares `acme.leadagent.com` in email campaign

### Scenario B: "XYZ Inc" Discovers Acme

1. **Mike (IT Director at XYZ)** receives email with link
2. Visits `acme.leadagent.com` → Sees Acme's orange-branded landing page
3. Clicks "Start Assessment" → Fills out 10 questions
4. Submits → Gets 78% readiness score (HOT tier)
5. Sees: "We'll reach out within 24 hours with personalized insights"
6. **(Backend)**: AI researches XYZ Inc → Generates email
7. **Sarah** (Acme admin) reviews AI email → Approves
8. **Mike** receives personalized email from Acme

### Scenario C: Team Collaboration

1. **Sarah** invites **John** to help manage leads
2. **John** gets invite email → Signs up with Clerk
3. Automatically added to "Acme Corp" organization as "member"
4. **John** can:
   - ✅ View leads at `/leads`
   - ✅ Approve AI-generated emails
   - ✅ View analytics
   - ❌ Cannot change branding (admin-only)
   - ❌ Cannot edit quiz questions (admin-only)

---

## Technical Implementation Checklist

### ✅ Already Implemented

- [x] Clerk authentication
- [x] Organization-based multi-tenancy
- [x] Subdomain routing middleware
- [x] Tenant database schema with branding
- [x] Dynamic tenant landing pages (`app/[tenant]/page.tsx`)
- [x] Quiz system with scoring
- [x] Admin branding configuration
- [x] Team member invites
- [x] Role-based access control

### 🔄 Needs Improvement

- [ ] Custom domain support (CNAME records)
- [ ] Tenant onboarding flow (wizard after signup)
- [ ] Usage limits enforcement (tier-based quotas)
- [ ] Billing integration (Stripe)
- [ ] Email sequence automation
- [ ] Advanced analytics (conversion funnels)

### 📋 Future Enhancements

- [ ] White-label option (remove "Powered by Lead Agent")
- [ ] API access for enterprise customers
- [ ] Webhook support for integrations
- [ ] A/B testing for landing pages
- [ ] Multi-language support
- [ ] Mobile app for lead management

---

## Security Considerations

### 1. **Data Isolation**
- All queries MUST filter by `orgId`
- Database indexes on `orgId` for performance
- Middleware validates tenant exists before serving pages

### 2. **Authentication**
- SaaS customers: Clerk-protected routes
- End customers: No auth (public forms with bot detection)
- API routes: Validate Clerk session + organization membership

### 3. **Authorization**
- Admin-only routes check `orgRole === 'admin'`
- Webhook endpoints validate signing secrets
- File uploads scoped by organization

### 4. **Rate Limiting**
- Quiz submissions: 10/hour per IP (prevent spam)
- API endpoints: 100 requests/min per organization
- Workflow executions: Tier-based monthly limits

---

## Deployment Architecture

```
                    ┌─────────────────┐
                    │   Vercel Edge   │
                    │    Network      │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼──────┐          ┌──────▼──────┐
        │  Main Domain │          │  Subdomains │
        │leadagent.com │          │  *.leadagent│
        └───────┬──────┘          └──────┬──────┘
                │                         │
        ┌───────▼──────────────────┬──────▼──────┐
        │     Next.js App          │             │
        │  ┌──────────────────┐    │             │
        │  │   Middleware     │────┼─────────────┤
        │  └──────────────────┘    │             │
        │  ┌──────────────────┐    │             │
        │  │  Route Handlers  │    │             │
        │  └──────────────────┘    │             │
        └─────────────┬─────────────┘             │
                      │                           │
        ┌─────────────▼─────────────┐             │
        │     Neon PostgreSQL       │             │
        │  (Multi-tenant database)  │             │
        └───────────────────────────┘             │
                                                  │
        ┌─────────────────────────────────────────▼──┐
        │          Clerk (Auth Provider)              │
        │  - User management                          │
        │  - Organization management                  │
        │  - SSO, MFA, session management             │
        └─────────────────────────────────────────────┘
```

---

## Summary

This architecture provides:

✅ **Clear separation** between SaaS customers (authenticated) and end customers (public)
✅ **Tenant isolation** via Clerk Organizations + database scoping
✅ **Scalability** via subdomain routing and shared infrastructure
✅ **Customization** via per-tenant branding and content
✅ **Security** via role-based access and data isolation
✅ **Team collaboration** via Clerk organization memberships

The current implementation is **90% aligned** with this design. Main gaps are billing integration and advanced tier management.
