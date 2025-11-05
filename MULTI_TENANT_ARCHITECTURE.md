# Multi-Tenant & Multi-User Architecture Guide

## Overview

This document outlines the technical architecture for building a **multi-tenant, multi-user SaaS platform** for the AI Lead Qualification System.

---

## Multi-Tenant Architecture

### What is Multi-Tenancy?

Multiple organizations (tenants) use the same application infrastructure, but their data is completely isolated from each other.

**Example:**
- Company A (Acme Corp) → acme.leadai.com
- Company B (StartupXYZ) → startupxyz.leadai.com
- Both use same codebase, but see completely different data

### Tenant Isolation Strategy

**Option 1: Shared Database with Row-Level Security (Recommended)**

```
Single PostgreSQL Database
├── All tables have tenant_id column
├── Row-Level Security (RLS) policies enforce isolation
└── Application sets tenant context from subdomain
```

**Pros:**
- ✅ Easier to manage (one database)
- ✅ Lower infrastructure costs
- ✅ Simpler backups and migrations
- ✅ PostgreSQL RLS is very secure

**Cons:**
- ⚠️ Must be careful with queries (always filter by tenant_id)
- ⚠️ One DB outage affects all tenants

**Implementation:**
```sql
-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Set tenant context in application
SET LOCAL app.current_tenant_id = 'tenant-uuid-here';
```

**Option 2: Separate Database per Tenant**

```
Multiple PostgreSQL Databases
├── tenant_a_db (Company A's data)
├── tenant_b_db (Company B's data)
└── master_db (tenant metadata, routing)
```

**Pros:**
- ✅ Complete isolation (impossible to leak data)
- ✅ Easy to move tenants to different servers
- ✅ Per-tenant backups and restores

**Cons:**
- ❌ More complex infrastructure
- ❌ Higher costs (more databases)
- ❌ Harder to do cross-tenant analytics

**Recommendation:** Start with **Option 1 (RLS)**, move to Option 2 only if we get large enterprise clients.

---

## Subdomain Routing

### How Subdomain Routing Works

```
User visits: acme.leadai.com
    ↓
Next.js middleware intercepts request
    ↓
Extracts subdomain: "acme"
    ↓
Looks up tenant_id from subdomain
    ↓
Sets tenant context for session
    ↓
All DB queries filtered by tenant_id
```

### Implementation (Next.js)

**middleware.ts:**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Extract subdomain
  const subdomain = hostname.split('.')[0];

  // Skip for main domain and www
  if (subdomain === 'leadai' || subdomain === 'www') {
    return NextResponse.next();
  }

  // Add subdomain to request headers
  const response = NextResponse.next();
  response.headers.set('x-tenant-subdomain', subdomain);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

**Server component:**
```typescript
import { headers } from 'next/headers';
import { getTenantBySubdomain } from '@/lib/tenants';

export default async function Page() {
  const headersList = headers();
  const subdomain = headersList.get('x-tenant-subdomain');

  if (!subdomain) {
    return <div>Invalid subdomain</div>;
  }

  const tenant = await getTenantBySubdomain(subdomain);

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  // Now you have tenant context for all subsequent queries
  return <Dashboard tenant={tenant} />;
}
```

### Custom Domain Support

Allow tenants to use their own domain (e.g., leads.acme.com instead of acme.leadai.com).

**Setup:**
1. Tenant adds CNAME record: `leads.acme.com → leadai.com`
2. Add domain to Vercel project
3. Store custom domain in `tenants.custom_domain`
4. Update middleware to check both subdomain and custom domain

**middleware.ts (enhanced):**
```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  let tenantIdentifier;

  // Check if custom domain
  if (!hostname.endsWith('.leadai.com')) {
    tenantIdentifier = hostname; // Use full domain as identifier
  } else {
    tenantIdentifier = hostname.split('.')[0]; // Extract subdomain
  }

  const response = NextResponse.next();
  response.headers.set('x-tenant-identifier', tenantIdentifier);

  return response;
}
```

---

## Multi-User System

### User Authentication

**Tech Stack:**
- NextAuth.js (authentication)
- PostgreSQL (user storage)
- JWT tokens (session management)

**Login Flow:**
```
User visits: acme.leadai.com/login
    ↓
Enters email/password
    ↓
System finds user in database WHERE email = ? AND tenant_id = ?
    ↓
Verifies password
    ↓
Creates session with { user_id, tenant_id, role }
    ↓
All subsequent requests include tenant context
```

### Role-Based Access Control (RBAC)

**Permission Model:**

```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  // Lead permissions
  'leads:view_all': ['admin', 'manager'],
  'leads:view_assigned': ['admin', 'manager', 'sales'],
  'leads:approve': ['admin', 'sales'],
  'leads:edit': ['admin', 'manager'],
  'leads:export': ['admin', 'manager'],

  // User management
  'users:invite': ['admin'],
  'users:manage': ['admin'],
  'users:view': ['admin', 'manager'],

  // Settings
  'settings:billing': ['admin'],
  'settings:branding': ['admin'],
  'settings:quiz': ['admin', 'manager'],
  'settings:integrations': ['admin'],

  // Analytics
  'analytics:view_all': ['admin', 'manager'],
  'analytics:view_own': ['admin', 'manager', 'sales'],
};

export function hasPermission(
  userRole: string,
  permission: keyof typeof PERMISSIONS
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}
```

**Usage in API routes:**
```typescript
// app/api/leads/route.ts
import { getServerSession } from 'next-auth';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { user } = session;

  // Check permission
  if (!hasPermission(user.role, 'leads:view_all')) {
    // Can only view assigned leads
    return getAssignedLeads(user.id, user.tenant_id);
  }

  // Can view all leads for this tenant
  return getAllLeads(user.tenant_id);
}
```

### User Roles Defined

**Admin**
- Full control over organization
- Manage billing and subscription
- Invite/remove users
- Configure all settings
- Access all leads and analytics
- Approve/reject leads

**Manager**
- View all team activity
- Assign leads to sales reps
- Configure quiz questions and email templates
- View all analytics
- Cannot manage billing or users

**Sales Rep**
- View assigned leads only
- Approve/reject assigned leads
- Edit email drafts
- View own performance analytics
- Cannot access team management

**Viewer** (Read-only)
- View leads and reports
- Cannot take any actions
- Useful for executives who want visibility

---

## Data Isolation Best Practices

### 1. Always Filter by tenant_id

**❌ Bad (leaks data across tenants):**
```typescript
const leads = await db.lead.findMany({
  where: { tier: 'hot' }
});
```

**✅ Good (tenant-isolated):**
```typescript
const leads = await db.lead.findMany({
  where: {
    tenant_id: session.user.tenant_id,
    tier: 'hot'
  }
});
```

### 2. Use Middleware to Set Context

**Create a tenant-aware database client:**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client';

export function getTenantDb(tenantId: string) {
  const prisma = new PrismaClient();

  // Set tenant context for RLS
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Automatically add tenant_id to all queries
          if (args.where) {
            args.where = { ...args.where, tenant_id: tenantId };
          } else {
            args.where = { tenant_id: tenantId };
          }
          return query(args);
        },
      },
    },
  });
}
```

**Usage:**
```typescript
const session = await getServerSession();
const db = getTenantDb(session.user.tenant_id);

// Now all queries are automatically filtered by tenant_id
const leads = await db.lead.findMany({
  where: { tier: 'hot' }
});
// Actual query: SELECT * FROM leads WHERE tenant_id = ? AND tier = 'hot'
```

### 3. Validate Tenant Access in API Routes

**Always verify the resource belongs to the user's tenant:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  const session = await getServerSession();

  const lead = await db.lead.findUnique({
    where: { id: params.leadId }
  });

  // Verify tenant ownership
  if (!lead || lead.tenant_id !== session.user.tenant_id) {
    return new Response('Not found', { status: 404 });
  }

  return Response.json(lead);
}
```

---

## User Management Features

### Invite Users

**Flow:**
1. Admin goes to Settings → Team
2. Clicks "Invite User"
3. Enters email and selects role
4. System sends invitation email with magic link
5. User clicks link, sets password, joins team

**Implementation:**
```typescript
// app/api/users/invite/route.ts
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!hasPermission(session.user.role, 'users:invite')) {
    return new Response('Forbidden', { status: 403 });
  }

  const { email, role } = await request.json();

  // Create invitation
  const invitation = await db.invitation.create({
    data: {
      tenant_id: session.user.tenant_id,
      email,
      role,
      token: generateSecureToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      invited_by_user_id: session.user.id,
    }
  });

  // Send email
  await sendInvitationEmail({
    to: email,
    inviterName: session.user.name,
    organizationName: session.user.tenant.name,
    inviteUrl: `https://${session.user.tenant.subdomain}.leadai.com/accept-invite?token=${invitation.token}`,
  });

  return Response.json({ success: true });
}
```

### Team Management UI

**Pages needed:**
- `/settings/team` - List all users, invite button
- `/settings/team/[userId]` - Edit user (change role, deactivate)
- `/accept-invite?token=...` - Accept invitation, set password

**Features:**
- See all team members
- Filter by role
- See last login time
- Deactivate users (soft delete)
- Change user roles
- Resend invitations

---

## Billing & Usage Tracking

### Per-Tenant Subscription

**Stripe Setup:**
- Each tenant = 1 Stripe Customer
- Subscription attached to customer
- Webhook updates tenant.subscription_status

**Usage Limits:**
```typescript
// Check before creating workflow
const tenant = await db.tenant.findUnique({
  where: { id: session.user.tenant_id },
  include: {
    _count: {
      select: {
        workflows: {
          where: {
            created_at: {
              gte: startOfMonth(new Date())
            }
          }
        }
      }
    }
  }
});

const usageLimit = PLAN_LIMITS[tenant.subscription_tier].workflows_per_month;

if (tenant._count.workflows >= usageLimit) {
  return new Response('Usage limit reached', { status: 429 });
}
```

### Usage Dashboard

Show per-tenant usage:
- Quiz completions this month / limit
- AI workflows this month / limit
- Team members / limit
- Storage used / limit

---

## Security Considerations

### 1. Prevent Tenant Hopping

**Attack:** User tries to access another tenant's data by manipulating IDs

**Defense:**
```typescript
// Always verify tenant_id matches session
const lead = await db.lead.findFirst({
  where: {
    id: params.leadId,
    tenant_id: session.user.tenant_id // CRITICAL
  }
});
```

### 2. Prevent Subdomain Spoofing

**Attack:** User tries to set custom headers to impersonate another tenant

**Defense:**
- Always get subdomain from actual HTTP host header (not user input)
- Validate subdomain format (alphanumeric + hyphens only)
- Rate limit subdomain lookups

### 3. Prevent Privilege Escalation

**Attack:** Sales rep tries to access admin-only endpoints

**Defense:**
- Check permissions on every protected route
- Use middleware for common checks
- Never trust client-side role (always check server-side)

### 4. API Key Security

**For optional integrations (ClickUp, Slack):**
- Encrypt API keys at rest (using Prisma field encryption)
- Store per tenant
- Rotate regularly
- Revoke on user deletion

---

## Scalability Considerations

### Database Performance

**Indexes needed:**
```sql
-- Critical for tenant isolation queries
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_workflows_tenant_id ON workflows(tenant_id);

-- For common queries
CREATE INDEX idx_leads_tenant_tier ON leads(tenant_id, tier);
CREATE INDEX idx_workflows_tenant_status ON workflows(tenant_id, status);
```

### Caching Strategy

**Tenant metadata (rarely changes):**
- Cache tenant lookup by subdomain (Redis, 1 hour TTL)
- Cache user permissions (Redis, 15 min TTL)

**Lead data (frequently changes):**
- Don't cache (always fresh from DB)
- Use optimistic updates on frontend

### Horizontal Scaling

**Stateless design:**
- No in-memory session state
- All sessions in JWT or database
- Can run multiple Next.js instances behind load balancer

---

## Testing Multi-Tenancy

### Unit Tests

```typescript
describe('Lead API', () => {
  it('should not allow access to other tenant leads', async () => {
    const tenantA = await createTestTenant('tenant-a');
    const tenantB = await createTestTenant('tenant-b');

    const leadA = await createTestLead(tenantA.id);
    const userB = await createTestUser(tenantB.id, 'sales');

    const response = await fetch(`/api/leads/${leadA.id}`, {
      headers: {
        'Authorization': `Bearer ${userB.token}`
      }
    });

    expect(response.status).toBe(404); // Not 401, to avoid leaking existence
  });
});
```

### Manual Testing Checklist

- [ ] Create two test tenants (acme.leadai.test, startup.leadai.test)
- [ ] Create leads in both tenants
- [ ] Log in as user from Tenant A
- [ ] Try to access Tenant B's lead by ID → Should fail
- [ ] Try to modify URL subdomain → Should redirect or error
- [ ] Verify analytics only show Tenant A data
- [ ] Invite user to Tenant A → Should only see Tenant A data
- [ ] Check that user can't escalate their own role

---

## Deployment Checklist

### Environment Variables

```bash
# Multi-tenant config
NEXT_PUBLIC_BASE_DOMAIN=leadai.com
ALLOWED_SUBDOMAINS=*  # Or comma-separated list

# Database (with RLS enabled)
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://leadai.com

# Stripe (per-tenant billing)
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

### Vercel Configuration

**vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/api/tenant-router/:path*",
      "has": [
        {
          "type": "host",
          "value": "(?<subdomain>.*).leadai.com"
        }
      ]
    }
  ]
}
```

### DNS Setup

**Wildcard subdomain:**
```
*.leadai.com → CNAME → cname.vercel-dns.com
```

This allows any subdomain (acme.leadai.com, startup.leadai.com) to work automatically.

---

## Migration Path

### Phase 1: Single Tenant (Our Use)
- Build without multi-tenancy
- Hardcode our organization
- Validate product-market fit

### Phase 2: Multi-Tenant MVP
- Add `tenant_id` to all tables
- Add subdomain routing
- Add user management
- Keep billing simple (manual invoices)

### Phase 3: Full SaaS
- Add Stripe billing
- Add self-service signup
- Add usage limits and enforcement
- Add team collaboration features

---

**This architecture provides a solid foundation for building a secure, scalable multi-tenant SaaS platform.**
