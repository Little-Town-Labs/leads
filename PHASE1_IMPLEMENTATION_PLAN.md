# Phase 1 Implementation Plan
## Multi-Tenant Architecture with Drizzle + Neon + Clerk

---

## **Tech Stack Overview**

### **Database: Neon PostgreSQL + Drizzle ORM**
- **Neon**: Serverless Postgres with auto-scaling and instant provisioning
- **Drizzle**: TypeScript-first ORM with zero runtime overhead

### **Authentication: Clerk**
- Built-in organizations (multi-tenancy)
- User management and invitations
- Subscription management via Stripe
- Role-based access control
- Pre-built UI components

---

## **Why This Stack is Better**

### **Clerk Benefits:**
- ✅ **Organizations built-in** - No need to build tenant management
- ✅ **User management UI** - Pre-built components for invites, roles
- ✅ **Authentication handled** - Sign up, login, SSO, MFA all included
- ✅ **Subscriptions** - Stripe integration built-in
- ✅ **Role-based access** - Org roles (admin, member, custom roles)
- ✅ **Webhooks** - Sync org/user events to database
- ✅ **Subdomain routing** - Built-in support for org slugs

### **Drizzle Benefits:**
- ✅ **TypeScript-first** - Better type inference than Prisma
- ✅ **SQL-like syntax** - Easier to understand and debug
- ✅ **Zero runtime overhead** - Just SQL query builder
- ✅ **Great Neon integration** - Serverless-optimized

### **Neon Benefits:**
- ✅ **Serverless Postgres** - Auto-scaling, pay-per-use
- ✅ **Instant provisioning** - No warm-up time
- ✅ **Branching** - Database branches for dev/staging
- ✅ **Built-in connection pooling** - Perfect for serverless

---

## **Implementation Tasks**

### **Phase 1: Database Setup** (Tasks 1-2)

#### Task 1: Install Dependencies & Configure Neon

**Install packages:**
```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit
```

**Key deliverables:**
- Create Neon project at [neon.tech](https://neon.tech)
- Get connection string (with pooling enabled)
- Create `drizzle.config.ts`
- Create `db/schema.ts`
- Create `db/index.ts` for database client

**Files to create:**
- `drizzle.config.ts` - Drizzle configuration
- `db/schema.ts` - Database schema definitions
- `db/index.ts` - Database client initialization

**Environment variable:**
```bash
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

---

#### Task 2: Define Drizzle Schema

Since Clerk manages organizations and users, we only need application-specific tables:

**Schema definition (`db/schema.ts`):**

```typescript
import { pgTable, text, uuid, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: text('org_id').notNull(), // Clerk organization ID
  userId: text('user_id').notNull(), // Clerk user ID who created it
  email: text('email').notNull(),
  name: text('name').notNull(),
  company: text('company'),
  phone: text('phone'),
  message: text('message').notNull(),
  qualificationCategory: text('qualification_category'), // QUALIFIED, UNQUALIFIED, etc.
  qualificationReason: text('qualification_reason'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  orgIdIndex: index('leads_org_id_idx').on(table.orgId),
  statusIndex: index('leads_status_idx').on(table.status),
  createdAtIndex: index('leads_created_at_idx').on(table.createdAt),
}));

export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: text('org_id').notNull(),
  leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // running, completed, failed
  researchResults: jsonb('research_results'),
  emailDraft: text('email_draft'),
  approvedBy: text('approved_by'), // Clerk user ID
  rejectedBy: text('rejected_by'), // Clerk user ID
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  orgIdIndex: index('workflows_org_id_idx').on(table.orgId),
  leadIdIndex: index('workflows_lead_id_idx').on(table.leadId),
  statusIndex: index('workflows_status_idx').on(table.status),
}));

// Types
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
```

**Database client (`db/index.ts`):**

```typescript
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
```

**Drizzle configuration (`drizzle.config.ts`):**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Tables we DON'T need:**
- ❌ `users` table (Clerk handles this)
- ❌ `tenants` table (Clerk organizations)
- ❌ `invitations` table (Clerk handles invites)
- ❌ `subscriptions` table (Clerk + Stripe handles this)

**Run migrations:**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

---

### **Phase 2: Clerk Setup** (Tasks 3-4)

#### Task 3: Set Up Clerk with Organizations

**Install Clerk:**
```bash
pnpm add @clerk/nextjs
```

**Key deliverables:**
1. Create Clerk app at [clerk.com](https://clerk.com)
2. Enable **Organizations** feature in dashboard
3. Configure organization roles:
   - `org:admin` - Full control (manage billing, users, settings)
   - `org:manager` - Manage leads, view all analytics, configure workflows
   - `org:member` - View assigned leads only, basic analytics
4. Configure authentication settings:
   - Enable email/password
   - Optional: OAuth providers (Google, Microsoft)
   - Optional: SSO for enterprise
5. Set up subdomain routing (optional for later)

**Create middleware (`middleware.ts`):**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/submit',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Update layout (`app/layout.tsx`):**

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Environment variables:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_ORGANIZATION_PROFILE_URL=/settings/team
```

---

#### Task 4: Configure Clerk Subscriptions

**Key deliverables:**
1. Enable Stripe integration in Clerk dashboard
2. Define subscription tiers using Clerk's `publicMetadata` on organizations:
   - **Starter**: 100 leads/month, 3 users, $49/month
   - **Pro**: 1000 leads/month, 10 users, $199/month
   - **Enterprise**: Unlimited, unlimited users, custom pricing

**Organization metadata schema:**
```typescript
{
  subscriptionTier: 'starter' | 'pro' | 'enterprise',
  monthlyLeadLimit: number,
  usageThisMonth: number,
  usageResetDate: string, // ISO date
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
}
```

**Create subscription helper (`lib/subscriptions.ts`):**

```typescript
import { clerkClient } from '@clerk/nextjs/server';

export const SUBSCRIPTION_TIERS = {
  starter: { leadLimit: 100, userLimit: 3, price: 49 },
  pro: { leadLimit: 1000, userLimit: 10, price: 199 },
  enterprise: { leadLimit: Infinity, userLimit: Infinity, price: null },
};

export async function checkUsageLimit(orgId: string): Promise<boolean> {
  const org = await clerkClient.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as any;

  const usage = metadata.usageThisMonth || 0;
  const limit = metadata.monthlyLeadLimit || 100;

  return usage < limit;
}

export async function incrementUsage(orgId: string): Promise<void> {
  const org = await clerkClient.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as any;

  await clerkClient.organizations.updateOrganization(orgId, {
    publicMetadata: {
      ...metadata,
      usageThisMonth: (metadata.usageThisMonth || 0) + 1,
    },
  });
}

export async function resetMonthlyUsage(orgId: string): Promise<void> {
  const org = await clerkClient.organizations.getOrganization({ organizationId: orgId });
  const metadata = org.publicMetadata as any;

  await clerkClient.organizations.updateOrganization(orgId, {
    publicMetadata: {
      ...metadata,
      usageThisMonth: 0,
      usageResetDate: new Date().toISOString(),
    },
  });
}
```

---

### **Phase 3: Integration Layer** (Tasks 5-7)

#### Task 5: Middleware for Auth + Org Context

The middleware from Task 3 already handles authentication. Now we enhance it:

**Enhanced middleware (`middleware.ts`):**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/submit',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk'
]);

const requiresOrg = createRouteMatcher([
  '/dashboard(.*)',
  '/leads(.*)',
  '/settings(.*)',
  '/api/leads(.*)',
  '/api/workflows(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect authenticated routes
  await auth.protect();

  // Check organization requirement
  if (requiresOrg(req)) {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.redirect(new URL('/select-organization', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

---

#### Task 6: Org-Aware Database Helper

**Create database helper (`lib/db.ts`):**

```typescript
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { leads, workflows } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getOrgContext() {
  const { orgId, userId } = await auth();

  if (!orgId) {
    throw new Error('No organization context');
  }

  return { orgId, userId: userId! };
}

export async function getOrgDb() {
  const { orgId, userId } = await getOrgContext();

  return {
    orgId,
    userId,

    // Org-scoped lead queries
    leads: {
      findMany: () => db.query.leads.findMany({
        where: eq(leads.orgId, orgId),
        orderBy: (leads, { desc }) => [desc(leads.createdAt)],
      }),

      findById: (id: string) => db.query.leads.findFirst({
        where: and(eq(leads.id, id), eq(leads.orgId, orgId))
      }),

      create: (data: Omit<typeof leads.$inferInsert, 'orgId' | 'userId'>) =>
        db.insert(leads).values({ ...data, orgId, userId }).returning(),

      update: (id: string, data: Partial<typeof leads.$inferInsert>) =>
        db.update(leads).set(data).where(
          and(eq(leads.id, id), eq(leads.orgId, orgId))
        ).returning(),

      delete: (id: string) =>
        db.delete(leads).where(
          and(eq(leads.id, id), eq(leads.orgId, orgId))
        ),
    },

    // Org-scoped workflow queries
    workflows: {
      findMany: () => db.query.workflows.findMany({
        where: eq(workflows.orgId, orgId),
        orderBy: (workflows, { desc }) => [desc(workflows.createdAt)],
      }),

      findById: (id: string) => db.query.workflows.findFirst({
        where: and(eq(workflows.id, id), eq(workflows.orgId, orgId))
      }),

      create: (data: Omit<typeof workflows.$inferInsert, 'orgId'>) =>
        db.insert(workflows).values({ ...data, orgId }).returning(),

      update: (id: string, data: Partial<typeof workflows.$inferInsert>) =>
        db.update(workflows).set(data).where(
          and(eq(workflows.id, id), eq(workflows.orgId, orgId))
        ).returning(),
    },
  };
}
```

---

#### Task 7: RBAC Using Clerk Roles

**Create permissions helper (`lib/permissions.ts`):**

```typescript
import { auth } from '@clerk/nextjs/server';

export type Permission =
  | 'leads:view_all'
  | 'leads:view_assigned'
  | 'leads:approve'
  | 'leads:edit'
  | 'leads:delete'
  | 'leads:export'
  | 'workflows:view_all'
  | 'workflows:cancel'
  | 'settings:manage'
  | 'settings:billing'
  | 'analytics:view_all'
  | 'analytics:view_own'
  | 'users:manage';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  'org:admin': [
    'leads:view_all',
    'leads:approve',
    'leads:edit',
    'leads:delete',
    'leads:export',
    'workflows:view_all',
    'workflows:cancel',
    'settings:manage',
    'settings:billing',
    'analytics:view_all',
    'users:manage',
  ],
  'org:manager': [
    'leads:view_all',
    'leads:approve',
    'leads:edit',
    'leads:export',
    'workflows:view_all',
    'settings:manage',
    'analytics:view_all',
  ],
  'org:member': [
    'leads:view_assigned',
    'leads:approve',
    'analytics:view_own',
  ],
};

export async function hasPermission(permission: Permission): Promise<boolean> {
  const { orgRole } = await auth();

  if (!orgRole) {
    return false;
  }

  const allowedPermissions = ROLE_PERMISSIONS[orgRole] || [];
  return allowedPermissions.includes(permission);
}

export async function requirePermission(permission: Permission): Promise<void> {
  const allowed = await hasPermission(permission);

  if (!allowed) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

export async function getOrgRole(): Promise<string | null> {
  const { orgRole } = await auth();
  return orgRole;
}
```

---

### **Phase 4: API & Workflow Updates** (Tasks 8-9)

#### Task 8: Update API Routes

**Update submit route (`app/api/submit/route.ts`):**

```typescript
import { formSchema } from '@/lib/types';
import { checkBotId } from 'botid/server';
import { start } from 'workflow/api';
import { workflowInbound } from '@/workflows/inbound';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { checkUsageLimit, incrementUsage } from '@/lib/subscriptions';
import { getOrgDb } from '@/lib/db';

export async function POST(request: Request) {
  // Bot detection
  const verification = await checkBotId();
  if (verification.isBot) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Validate form data
  const body = await request.json();
  const parsedBody = formSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }

  // Get org context
  const { orgId } = await auth();
  if (!orgId) {
    return Response.json({ error: 'No organization context' }, { status: 400 });
  }

  // Check usage limits
  const canCreate = await checkUsageLimit(orgId);
  if (!canCreate) {
    return Response.json({
      error: 'Monthly lead limit reached. Please upgrade your plan.'
    }, { status: 429 });
  }

  // Create lead in database
  const orgDb = await getOrgDb();
  const [lead] = await orgDb.leads.create(parsedBody.data);

  // Start workflow
  await start(workflowInbound, [lead]);

  // Increment usage counter
  await incrementUsage(orgId);

  return Response.json(
    { message: 'Form submitted successfully', leadId: lead.id },
    { status: 200 }
  );
}
```

**Create leads API (`app/api/leads/route.ts`):**

```typescript
import { NextRequest } from 'next/server';
import { getOrgDb } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  await requirePermission('leads:view_all');

  const orgDb = await getOrgDb();
  const leads = await orgDb.leads.findMany();

  return Response.json({ leads });
}
```

**Create lead detail API (`app/api/leads/[id]/route.ts`):**

```typescript
import { NextRequest } from 'next/server';
import { getOrgDb } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requirePermission('leads:view_all');

  const orgDb = await getOrgDb();
  const lead = await orgDb.leads.findById(params.id);

  if (!lead) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  return Response.json({ lead });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requirePermission('leads:edit');

  const body = await request.json();
  const orgDb = await getOrgDb();

  const [updated] = await orgDb.leads.update(params.id, body);

  if (!updated) {
    return Response.json({ error: 'Lead not found' }, { status: 404 });
  }

  return Response.json({ lead: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await requirePermission('leads:delete');

  const orgDb = await getOrgDb();
  await orgDb.leads.delete(params.id);

  return Response.json({ success: true });
}
```

---

#### Task 9: Update Workflow System to Use Database

**Update workflow (`workflows/inbound/index.ts`):**

```typescript
'use workflow';

import { step } from 'workflow/api';
import { qualify, writeEmail, researchAgent } from '@/lib/services';
import { sendSlackApproval } from '@/lib/slack';
import { db } from '@/db';
import { leads, workflows } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Lead } from '@/db/schema';

export async function workflowInbound(lead: Lead) {
  // Create workflow record
  const [workflow] = await step('create-workflow', async () => {
    return db.insert(workflows).values({
      orgId: lead.orgId,
      leadId: lead.id,
      status: 'running',
    }).returning();
  });

  try {
    // Research step
    const research = await step('research', async () => {
      return await researchAgent(lead);
    });

    // Qualify step
    const qualification = await step('qualify', async () => {
      return await qualify(lead, research);
    });

    // Save qualification to lead
    await step('save-qualification', async () => {
      await db.update(leads).set({
        qualificationCategory: qualification.category,
        qualificationReason: qualification.reason,
      }).where(eq(leads.id, lead.id));
    });

    // Generate email
    const email = await step('generate-email', async () => {
      return await writeEmail(lead, research, qualification);
    });

    // Save email draft to workflow
    await step('save-email', async () => {
      await db.update(workflows).set({
        emailDraft: email,
        researchResults: research,
      }).where(eq(workflows.id, workflow.id));
    });

    // Request approval via Slack
    const approval = await step('request-approval', async () => {
      return await sendSlackApproval(lead, qualification, email, workflow.id);
    });

    // Update workflow status based on approval
    await step('finalize', async () => {
      await db.update(workflows).set({
        status: 'completed',
        completedAt: new Date(),
        approvedBy: approval.approved ? approval.userId : null,
        rejectedBy: approval.approved ? null : approval.userId,
      }).where(eq(workflows.id, workflow.id));

      // Update lead status
      await db.update(leads).set({
        status: approval.approved ? 'approved' : 'rejected',
      }).where(eq(leads.id, lead.id));
    });

    // Send email if approved
    if (approval.approved) {
      await step('send-email', async () => {
        // TODO: Implement email sending
        console.log(`Sending email to ${lead.email}`);
      });
    }

  } catch (error) {
    // Mark workflow as failed
    await step('mark-failed', async () => {
      await db.update(workflows).set({
        status: 'failed',
        completedAt: new Date(),
      }).where(eq(workflows.id, workflow.id));
    });

    throw error;
  }
}
```

**Update Slack approval handler (`app/api/slack/route.ts`):**

```typescript
import { App } from '@slack/bolt';
import { receiver } from '@/lib/slack';
import { db } from '@/db';
import { workflows, leads } from '@/db/schema';
import { eq } from 'drizzle-orm';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
});

app.action('approve_lead', async ({ ack, action, client, body }) => {
  await ack();

  const workflowId = (action as any).value;
  const userId = body.user.id;

  // Update workflow in database
  await db.update(workflows).set({
    status: 'completed',
    approvedBy: userId,
    completedAt: new Date(),
  }).where(eq(workflows.id, workflowId));

  // Update lead status
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
  });

  if (workflow?.leadId) {
    await db.update(leads).set({
      status: 'approved',
    }).where(eq(leads.id, workflow.leadId));
  }

  // Update Slack message
  await client.chat.update({
    channel: body.channel!.id,
    ts: body.message!.ts,
    text: '✅ Lead approved',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *Lead approved* by <@${userId}>`,
        },
      },
    ],
  });
});

app.action('reject_lead', async ({ ack, action, client, body }) => {
  await ack();

  const workflowId = (action as any).value;
  const userId = body.user.id;

  // Update workflow in database
  await db.update(workflows).set({
    status: 'completed',
    rejectedBy: userId,
    completedAt: new Date(),
  }).where(eq(workflows.id, workflowId));

  // Update lead status
  const workflow = await db.query.workflows.findFirst({
    where: eq(workflows.id, workflowId),
  });

  if (workflow?.leadId) {
    await db.update(leads).set({
      status: 'rejected',
    }).where(eq(leads.id, workflow.leadId));
  }

  // Update Slack message
  await client.chat.update({
    channel: body.channel!.id,
    ts: body.message!.ts,
    text: '❌ Lead rejected',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *Lead rejected* by <@${userId}>`,
        },
      },
    ],
  });
});

export async function POST(request: Request) {
  return receiver.handler(request);
}
```

---

### **Phase 5: UI & Webhooks** (Tasks 10-11)

#### Task 10: Build Admin Dashboard with Clerk Components

**Create organization selector (`app/select-organization/page.tsx`):**

```tsx
import { OrganizationList } from '@clerk/nextjs';

export default function SelectOrganizationPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <OrganizationList
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
      />
    </div>
  );
}
```

**Create team management page (`app/settings/team/page.tsx`):**

```tsx
import { OrganizationProfile } from '@clerk/nextjs';

export default function TeamPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Team Management</h1>
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: 'w-full',
            cardBox: 'shadow-none border',
          },
        }}
      />
    </div>
  );
}
```

**Create dashboard page (`app/dashboard/page.tsx`):**

```tsx
import { auth } from '@clerk/nextjs/server';
import { getOrgDb } from '@/lib/db';
import { LeadsTable } from '@/components/leads-table';

export default async function DashboardPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect('/select-organization');
  }

  const orgDb = await getOrgDb();
  const leads = await orgDb.leads.findMany();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <LeadsTable leads={leads} />
    </div>
  );
}
```

**Features you get for free from Clerk:**
- ✅ Invite members by email
- ✅ Manage user roles (admin, manager, member)
- ✅ Remove members
- ✅ View organization settings
- ✅ Customize organization profile

---

#### Task 11: Set Up Clerk Webhooks for Org/User Lifecycle Events

**Install Svix for webhook verification:**
```bash
pnpm add svix
```

**Create webhook handler (`app/api/webhooks/clerk/route.ts`):**

```typescript
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  // Get webhook secret from Clerk dashboard
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env');
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error: Verification failed', { status: 400 });
  }

  // Handle events
  const eventType = evt.type;

  switch (eventType) {
    case 'organization.created':
      // Initialize organization metadata with default subscription
      await clerkClient.organizations.updateOrganization(evt.data.id, {
        publicMetadata: {
          subscriptionTier: 'starter',
          monthlyLeadLimit: 100,
          usageThisMonth: 0,
          usageResetDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      });
      console.log(`✅ Organization created: ${evt.data.name}`);
      break;

    case 'organization.updated':
      console.log(`✅ Organization updated: ${evt.data.name}`);
      break;

    case 'organization.deleted':
      // Clean up organization data from database
      const { db } = await import('@/db');
      const { leads, workflows } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');

      await db.delete(workflows).where(eq(workflows.orgId, evt.data.id));
      await db.delete(leads).where(eq(leads.orgId, evt.data.id));

      console.log(`✅ Organization deleted: ${evt.data.id}`);
      break;

    case 'organizationMembership.created':
      console.log(`✅ User joined organization: ${evt.data.public_user_data.user_id}`);
      break;

    case 'organizationMembership.deleted':
      console.log(`✅ User left organization: ${evt.data.public_user_data.user_id}`);
      break;

    case 'organizationMembership.updated':
      console.log(`✅ Organization membership updated: ${evt.data.public_user_data.user_id}`);
      break;

    default:
      console.log(`Unhandled event type: ${eventType}`);
  }

  return new Response('Webhook processed', { status: 200 });
}
```

**Configure webhook in Clerk dashboard:**
1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Subscribe to events:
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
   - `organizationMembership.created`
   - `organizationMembership.deleted`
   - `organizationMembership.updated`
4. Copy webhook secret to `.env.local` as `CLERK_WEBHOOK_SECRET`

---

### **Phase 6: Testing** (Task 12)

#### Task 12: Write Security Tests for Org Isolation

**Create test utilities (`__tests__/utils/test-helpers.ts`):**

```typescript
import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/db';
import { leads } from '@/db/schema';

export async function createTestOrg(name: string) {
  return await clerkClient.organizations.createOrganization({
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
  });
}

export async function createTestUser(orgId: string, role: string) {
  const user = await clerkClient.users.createUser({
    emailAddress: [`test-${Date.now()}@example.com`],
    password: 'TestPassword123!',
  });

  await clerkClient.organizations.createOrganizationMembership({
    organizationId: orgId,
    userId: user.id,
    role,
  });

  return user;
}

export async function createTestLead(orgId: string, userId: string) {
  const [lead] = await db.insert(leads).values({
    orgId,
    userId,
    email: 'test@example.com',
    name: 'Test Lead',
    message: 'Test message',
  }).returning();

  return lead;
}

export async function cleanupTestData(orgId: string) {
  const { eq } = await import('drizzle-orm');
  const { workflows } = await import('@/db/schema');

  await db.delete(workflows).where(eq(workflows.orgId, orgId));
  await db.delete(leads).where(eq(leads.orgId, orgId));
}
```

**Create org isolation tests (`__tests__/org-isolation.test.ts`):**

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestOrg, createTestUser, createTestLead, cleanupTestData } from './utils/test-helpers';

describe('Organization Isolation', () => {
  let orgA: any;
  let orgB: any;
  let userA: any;
  let userB: any;

  beforeAll(async () => {
    orgA = await createTestOrg('Test Org A');
    orgB = await createTestOrg('Test Org B');
    userA = await createTestUser(orgA.id, 'org:admin');
    userB = await createTestUser(orgB.id, 'org:admin');
  });

  afterAll(async () => {
    await cleanupTestData(orgA.id);
    await cleanupTestData(orgB.id);
  });

  it('should not allow access to other org leads', async () => {
    const leadA = await createTestLead(orgA.id, userA.id);

    // Try to access lead from org B
    const response = await fetch(`http://localhost:3000/api/leads/${leadA.id}`, {
      headers: {
        Authorization: `Bearer ${userB.sessionToken}`,
      },
    });

    expect(response.status).toBe(404);
  });

  it('should only return leads for current org', async () => {
    await createTestLead(orgA.id, userA.id);
    await createTestLead(orgA.id, userA.id);
    await createTestLead(orgB.id, userB.id);

    const response = await fetch(`http://localhost:3000/api/leads`, {
      headers: {
        Authorization: `Bearer ${userA.sessionToken}`,
      },
    });

    const data = await response.json();

    expect(data.leads.length).toBe(2);
    expect(data.leads.every((l: any) => l.orgId === orgA.id)).toBe(true);
  });

  it('should not allow updating leads from other org', async () => {
    const leadA = await createTestLead(orgA.id, userA.id);

    const response = await fetch(`http://localhost:3000/api/leads/${leadA.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${userB.sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'approved' }),
    });

    expect(response.status).toBe(404);
  });
});
```

**Create permission tests (`__tests__/permissions.test.ts`):**

```typescript
import { describe, it, expect } from '@jest/globals';
import { createTestOrg, createTestUser } from './utils/test-helpers';

describe('Role-Based Permissions', () => {
  it('should allow admin to access all endpoints', async () => {
    const org = await createTestOrg('Test Org');
    const admin = await createTestUser(org.id, 'org:admin');

    const endpoints = [
      '/api/leads',
      '/api/settings',
      '/api/users',
    ];

    for (const endpoint of endpoints) {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: { Authorization: `Bearer ${admin.sessionToken}` },
      });

      expect(response.status).not.toBe(403);
    }
  });

  it('should restrict member from admin-only endpoints', async () => {
    const org = await createTestOrg('Test Org');
    const member = await createTestUser(org.id, 'org:member');

    const response = await fetch(`http://localhost:3000/api/settings`, {
      headers: { Authorization: `Bearer ${member.sessionToken}` },
    });

    expect(response.status).toBe(403);
  });
});
```

---

## **Environment Variables Summary**

Create `.env.local` file:

```bash
# Neon Database
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_ORGANIZATION_PROFILE_URL=/settings/team

# AI & Services (existing)
AI_GATEWAY_API_KEY=...
EXA_API_KEY=...

# Slack (optional)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=...
```

---

## **Implementation Timeline**

### **Week 1: Database & Clerk Setup**
- **Day 1-2**: Tasks 1-2 (Neon + Drizzle setup, schema definition)
- **Day 3-4**: Task 3 (Clerk authentication setup)
- **Day 5**: Task 4 (Clerk subscriptions configuration)

### **Week 2: Integration Layer**
- **Day 1-2**: Task 5 (Enhanced middleware)
- **Day 3-4**: Task 6 (Org-aware database helper)
- **Day 5**: Task 7 (RBAC implementation)

### **Week 3: API & Workflows**
- **Day 1-3**: Task 8 (Update all API routes)
- **Day 4-5**: Task 9 (Update workflow system)

### **Week 4: UI & Testing**
- **Day 1-2**: Task 10 (Admin dashboard UI)
- **Day 3**: Task 11 (Clerk webhooks)
- **Day 4-5**: Task 12 (Security testing)

---

## **Success Criteria**

By the end of Phase 1, you should have:

- ✅ Multi-tenant architecture with complete org isolation
- ✅ User authentication and authorization via Clerk
- ✅ Organization management (invites, roles, permissions)
- ✅ Subscription tiers with usage limits
- ✅ Persistent storage for leads and workflows
- ✅ Updated API routes with org context
- ✅ Org-aware workflow system
- ✅ Admin dashboard with Clerk components
- ✅ Security tests proving tenant isolation

---

## **Next Steps After Phase 1**

### **Phase 2: Enhanced Features**
- Analytics dashboard (per-org metrics)
- Advanced search and filtering
- Bulk operations (export, assign, tag)
- Email template customization per org
- Custom qualification categories per org

### **Phase 3: Integrations**
- CRM integrations (Salesforce, HubSpot)
- Email providers (SendGrid, Resend)
- Calendar integrations (for meetings)
- Zapier/webhooks for extensibility

### **Phase 4: Enterprise Features**
- SSO (SAML, OIDC)
- Custom domains per org
- White-labeling
- Advanced analytics and reporting
- API for programmatic access

---

**Ready to begin implementation!** 🚀
