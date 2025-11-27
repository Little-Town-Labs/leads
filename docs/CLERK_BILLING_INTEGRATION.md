# Clerk Billing Integration Plan

**Status**: Planning
**Priority**: High
**Estimated Effort**: 2-3 weeks
**Last Updated**: 2025-01-27

## Overview

This document outlines the plan to integrate Clerk Billing for subscription management in the lead qualification platform. Clerk Billing provides native subscription capabilities that integrate seamlessly with our existing Clerk Organizations architecture.

## Table of Contents

1. [Clerk Billing Overview](#clerk-billing-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [B2C vs B2B Model](#b2c-vs-b2b-model)
4. [Schema Changes](#schema-changes)
5. [Implementation Steps](#implementation-steps)
6. [Platform Admin Monitoring](#platform-admin-monitoring)
7. [Feature Gating](#feature-gating)
8. [Webhook Events](#webhook-events)
9. [Revenue Metrics](#revenue-metrics)
10. [Migration Strategy](#migration-strategy)

---

## Clerk Billing Overview

### What is Clerk Billing?

Clerk Billing enables subscription management for both B2C (individual users) and B2B (organizations) models. It integrates exclusively with Stripe for payment processing while Clerk manages plans, features, and subscriptions.

### Key Features

- **Pre-built UI Components**: `<PricingTable />` component with checkout flow
- **Feature Gating**: `has()` method and `<Protect>` component for access control
- **Webhook Events**: Track subscription lifecycle and payment attempts
- **Multi-Model Support**: Both user-level and organization-level subscriptions
- **Stripe Integration**: Payment processing via Stripe, managed through Clerk

### Important Considerations

- **Beta Status**: APIs are experimental and may have breaking changes (pin SDK versions)
- **Pricing**: 0.7% per transaction + Stripe fees
- **Limitations**:
  - USD only (no multi-currency yet)
  - No tax/VAT calculation built-in
  - No custom per-customer pricing
  - Clerk manages plans separately from Stripe (doesn't sync to Stripe Billing)

### Documentation References

- [Clerk Billing Overview](https://clerk.com/docs/billing/overview)
- [B2B Billing Guide](https://clerk.com/docs/nextjs/guides/billing/for-b2b)
- [Billing Webhooks](https://clerk.com/docs/guides/development/webhooks/billing)
- [Billing Webhooks Changelog](https://clerk.com/changelog/2025-07-02-billing-webhooks)

---

## Architecture Decisions

### Decision: Use Clerk Billing Instead of Custom Stripe Integration

**Rationale**:
- ✅ Reduces development time (no custom checkout UI)
- ✅ Seamless integration with existing Clerk Organizations
- ✅ Built-in feature gating and access control
- ✅ Automatic webhook handling for subscription events
- ✅ Pre-built components for pricing and billing management

**Trade-offs**:
- ⚠️ Beta status requires careful version management
- ⚠️ 0.7% transaction fee on top of Stripe fees
- ⚠️ Less customization than direct Stripe integration
- ⚠️ Limited to USD initially

### What Clerk Billing Handles

- ✅ Plan management (Starter, Professional, Enterprise)
- ✅ Feature entitlements (AI workflows, advanced analytics, etc.)
- ✅ Payment processing (via Stripe)
- ✅ Subscription lifecycle (trials, upgrades, downgrades, cancellations)
- ✅ Access control (`has()`, `<Protect>`)

### What Custom Code Handles

- ✅ Usage tracking (quiz completions, AI workflows count)
- ✅ Monthly usage reset logic
- ✅ Overage handling
- ✅ Custom notifications and alerts
- ✅ Platform-level analytics and monitoring
- ✅ Revenue metrics calculation (MRR, ARR, churn)

---

## B2C vs B2B Model

### Challenge

The platform needs to support both:
- **B2C**: Individual freelancers/consultants who want personal lead qualification
- **B2B**: Companies/teams that need multi-user collaboration

### Recommended Approach: Organization-First Hybrid Model

**Strategy**: Treat all subscriptions as organizations, with personal workspaces for B2C users.

#### B2C Users (Individual Subscriptions)

When an individual user signs up:
1. Auto-create a single-member "personal organization"
2. Mark organization with `privateMetadata.isPersonal = true`
3. Subscribe to "User Plans" in Clerk
4. Show simplified UI (hide team features like invitations, role management)
5. Allow easy upgrade to team plan later

```typescript
// Auto-create personal organization on user signup
async function handleUserCreated(data: UserWebhookData) {
  // Create user record
  await db.insert(users).values({
    clerkUserId: data.id,
    email: data.email_addresses[0].email_address,
    // ... other fields
  });

  // Auto-create personal organization for B2C users
  const personalOrg = await clerkClient().organizations.createOrganization({
    name: `${data.first_name}'s Workspace`,
    createdBy: data.id,
    privateMetadata: {
      isPersonal: true,
      userId: data.id,
    }
  });

  // This triggers organization.created webhook
  // which creates tenant record with tenantType: 'personal'
}
```

#### B2B Organizations (Team Subscriptions)

Traditional multi-member organizations:
1. User creates organization via Clerk UI
2. `isPersonal` is not set (or explicitly false)
3. Subscribe to "Organization Plans" in Clerk
4. Full team collaboration features enabled
5. Can invite members, assign roles, etc.

#### Detection Logic

```typescript
// lib/tenant-type.ts
export async function isPersonalWorkspace(orgId: string): Promise<boolean> {
  const org = await clerkClient().organizations.getOrganization({
    organizationId: orgId,
  });

  return org.privateMetadata.isPersonal === true;
}

// Usage in components
const isPersonal = await isPersonalWorkspace(orgId);

if (isPersonal) {
  // Hide: team members, invitations, role management
  // Show: personal branding, individual limits
} else {
  // Show: full team collaboration features
}
```

#### Benefits of This Approach

- ✅ **Consistent Architecture**: Everything is organization-based
- ✅ **No Routing Changes**: Reuse existing subdomain/tenant logic
- ✅ **Easy Upgrade Path**: Personal org → team org (just add members)
- ✅ **Unified Codebase**: Same components with conditional rendering
- ✅ **Flexible Billing**: Support both "User Plans" and "Organization Plans" in Clerk

---

## Schema Changes

### Current Schema (Existing)

Our `tenants` table already has subscription fields (db/schema.ts:96-114):
- `subscriptionTier`: 'starter' | 'professional' | 'enterprise'
- `subscriptionStatus`: 'active' | 'trial' | 'canceled' | 'suspended'
- `usageLimits`: Monthly quota limits
- `currentUsage`: Current month's usage tracking

### Recommended Changes

#### 1. Remove Redundant Fields (Managed by Clerk)

```typescript
// REMOVE these (now managed by Clerk Billing):
subscriptionTier: text('subscription_tier')
subscriptionStatus: text('subscription_status')
```

#### 2. Add Tenant Type and Context

```typescript
// ADD to tenants table:
tenantType: text('tenant_type').notNull().default('organization'), // 'organization' | 'personal'
primaryUserId: text('primary_user_id'), // For personal accounts, who owns it
billingContext: text('billing_context').notNull().default('b2b'), // 'b2b' | 'b2c'
```

#### 3. Add Subscription History (Optional - for analytics)

```typescript
// OPTIONAL: Track subscription changes over time
subscriptionHistory: jsonb('subscription_history').$type<{
  planChanges: Array<{
    planId: string;
    planName: string;
    changedAt: string; // ISO date
    changedBy: string; // User who made the change
    event: 'created' | 'updated' | 'canceled' | 'reactivated';
  }>;
}>()
```

#### 4. New Table: Billing Events (Platform Analytics)

```typescript
// db/schema.ts - Add new table for platform admin monitoring
export const billingEvents = pgTable(
  'billing_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    // Event identification
    eventType: text('event_type').notNull(), // subscription.created, paymentAttempt.failed, etc.
    clerkEventId: text('clerk_event_id').unique(), // From Clerk webhook

    // Context
    orgId: text('org_id'), // Which tenant (if org subscription)
    userId: text('user_id'), // Which user (if user subscription)

    // Subscription details
    subscriptionId: text('subscription_id'),
    planId: text('plan_id'),
    planName: text('plan_name'),

    // Financial data
    amount: integer('amount'), // In cents
    currency: text('currency').default('USD'),
    status: text('status'), // active, past_due, canceled, etc.

    // Payment details (if applicable)
    paymentMethod: text('payment_method'), // card, ach, etc.
    lastFourDigits: text('last_four_digits'),

    // Full payload for debugging
    rawPayload: jsonb('raw_payload'),

    // Metadata
    processedAt: timestamp('processed_at').defaultNow(),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => ({
    eventTypeIndex: index('billing_events_event_type_idx').on(table.eventType),
    orgIdIndex: index('billing_events_org_id_idx').on(table.orgId),
    createdAtIndex: index('billing_events_created_at_idx').on(table.createdAt),
    statusIndex: index('billing_events_status_idx').on(table.status),
  })
);
```

#### 5. New Table: Revenue Metrics (Platform Analytics)

```typescript
// db/schema.ts - Add revenue tracking table
export const revenueMetrics = pgTable('revenue_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),

  // Time period
  period: text('period').notNull(), // '2025-01', '2025-Q1', '2025'
  periodType: text('period_type').notNull(), // 'month', 'quarter', 'year'

  // Core metrics
  mrr: integer('mrr').notNull().default(0), // Monthly Recurring Revenue (cents)
  arr: integer('arr').notNull().default(0), // Annual Recurring Revenue (cents)
  activeSubscriptions: integer('active_subscriptions').default(0),
  newSubscriptions: integer('new_subscriptions').default(0),
  churnedSubscriptions: integer('churned_subscriptions').default(0),
  upgrades: integer('upgrades').default(0),
  downgrades: integer('downgrades').default(0),

  // Breakdown by plan
  planBreakdown: jsonb('plan_breakdown').$type<{
    [planId: string]: {
      count: number;
      revenue: number; // cents
    };
  }>(),

  // Timestamps
  calculatedAt: timestamp('calculated_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### 6. New Table: Admin Notifications (Platform Operations)

```typescript
// db/schema.ts - Track platform admin alerts
export const adminNotifications = pgTable('admin_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),

  type: text('type').notNull(), // 'payment_failed', 'high_value_subscription', 'churn_risk'
  title: text('title').notNull(),
  message: text('message').notNull(),
  severity: text('severity').notNull().default('medium'), // 'low', 'medium', 'high'

  // Related entities
  relatedOrgId: text('related_org_id'),
  relatedUserId: text('related_user_id'),

  // Status
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  readBy: text('read_by'), // Admin user ID who read it

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
});
```

---

## Implementation Steps

### Phase 1: Clerk Dashboard Setup (1 day)

1. **Enable Billing in Clerk Dashboard**
   - Navigate to Billing Settings
   - Enable Billing feature
   - Connect Stripe account (production) or use test gateway (development)

2. **Create Plans for Organizations**
   - Navigate to Plans → "Plans for Organizations"
   - Create tiers with pricing:
     - **Starter**: $49/month
     - **Professional**: $149/month
     - **Enterprise**: $499/month
   - Set annual pricing (e.g., $490/year for Starter = 2 months free)

3. **Create Plans for Users (B2C)**
   - Navigate to Plans → "Plans for Users"
   - Create personal tiers:
     - **Personal**: $29/month
     - **Personal Pro**: $79/month

4. **Define Features**
   - Create features and assign to plans:
     - `basic_analytics` → All plans
     - `email_sequences` → All plans
     - `ai_workflows` → Professional and above
     - `advanced_analytics` → Professional and above
     - `custom_branding` → Professional and above
     - `slack_integration` → Professional and above
     - `unlimited_ai_workflows` → Enterprise only
     - `priority_support` → Enterprise only
     - `custom_integrations` → Enterprise only
   - Mark features as "Publicly available" to show in pricing table

5. **Configure Webhooks**
   - Add webhook endpoint: `https://yourdomain.com/api/webhooks/clerk`
   - Subscribe to billing events:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.active`
     - `subscription.past_due`
     - `subscriptionItem.created`
     - `subscriptionItem.updated`
     - `subscriptionItem.canceled`
     - `paymentAttempt.created`
     - `paymentAttempt.updated`
   - Copy webhook signing secret to `.env`

### Phase 2: Database Schema Migration (1-2 days)

1. **Create Migration File**
   ```bash
   pnpm db:migrate
   ```

2. **Add New Tables**
   - `billing_events`
   - `revenue_metrics`
   - `admin_notifications`

3. **Modify Tenants Table**
   - Add `tenantType`, `primaryUserId`, `billingContext`
   - Add `subscriptionHistory` (optional)
   - Keep `usageLimits` and `currentUsage` (not managed by Clerk)

4. **Run Migration**
   ```bash
   pnpm db:push
   ```

### Phase 3: Webhook Handler Implementation (2-3 days)

1. **Extend Clerk Webhook Handler**
   - File: `app/api/webhooks/clerk/route.ts`
   - Add handlers for all billing events
   - Log events to `billing_events` table
   - Update revenue metrics
   - Trigger admin notifications

2. **Implement Event Handlers**
   - `handleSubscriptionCreated()`
   - `handleSubscriptionUpdated()`
   - `handleSubscriptionActive()`
   - `handleSubscriptionPastDue()`
   - `handlePaymentAttemptFailed()`
   - See [Webhook Events](#webhook-events) section for details

3. **Add User Creation Handler**
   - Auto-create personal organization for B2C users
   - Set `isPersonal` metadata

### Phase 4: Billing Settings Page (2-3 days)

1. **Create Pricing/Billing Page**
   - File: `app/(dashboard)/settings/billing/page.tsx`
   - Add `<PricingTable for="organization" />` component
   - Display current plan and subscription status
   - Show usage limits and current usage
   - Add "Manage Billing" button (links to Clerk's billing portal)

2. **Create Current Usage Component**
   - Display monthly quotas vs current usage
   - Progress bars for each limit
   - Warning when approaching limits
   - Upgrade CTA when limits reached

3. **Add Billing History**
   - Show past invoices (from Stripe via Clerk)
   - Download receipts
   - View payment method

### Phase 5: Feature Gating Implementation (3-4 days)

1. **Server-Side Feature Gates**
   - Use `has({ feature: 'feature_name' })` in server components
   - Redirect to billing page if feature not available
   - Example: Advanced analytics, Slack integration

2. **Client-Side Feature Gates**
   - Use `<Protect feature="feature_name">` in client components
   - Show upgrade prompts for unavailable features
   - Graceful fallbacks

3. **Usage-Based Limits**
   - Implement `checkAiWorkflowLimit()` function
   - Call before triggering AI workflows
   - Increment usage after successful workflow
   - Handle limit reached scenarios

4. **Middleware Enhancement**
   - Detect personal vs team workspaces
   - Show/hide features based on tenant type
   - Route B2C users appropriately

### Phase 6: Platform Admin Dashboard (3-5 days)

1. **Create Admin Billing Dashboard**
   - File: `app/(platform-admin)/admin/billing/page.tsx`
   - Display MRR, ARR, churn rate
   - Show active subscriptions count
   - List failed payments and at-risk subscriptions
   - Recent billing events table

2. **Revenue Analytics**
   - Monthly/quarterly/yearly revenue charts
   - Subscription growth trends
   - Churn analysis
   - Plan distribution breakdown

3. **Customer Management**
   - List all customers with subscription status
   - Filter by plan, status, at-risk
   - Quick actions: contact, upgrade offer, etc.

4. **Alert System**
   - Real-time notifications for critical events
   - Slack integration for platform ops channel
   - Email alerts for high-severity issues

### Phase 7: Testing & QA (2-3 days)

1. **Test Subscription Flows**
   - Sign up and subscribe
   - Upgrade/downgrade plans
   - Cancel and reactivate
   - Failed payment scenarios (use Stripe test cards)

2. **Test Feature Gating**
   - Verify access control for each feature
   - Test usage limit enforcement
   - Confirm proper redirects and fallbacks

3. **Test Webhooks**
   - Verify all webhook events are logged
   - Check revenue metrics calculations
   - Confirm admin notifications work

4. **Test B2C vs B2B**
   - Personal workspace creation
   - Team workspace features
   - Conditional UI rendering

### Phase 8: Documentation & Launch (1-2 days)

1. **Update CLAUDE.md**
   - Add billing integration details
   - Document feature gating patterns
   - Add usage limit checking examples

2. **Create Customer Documentation**
   - Pricing page content
   - FAQs about billing
   - How to upgrade/downgrade
   - Usage limits by plan

3. **Soft Launch**
   - Enable for internal testing
   - Invite beta customers
   - Monitor metrics closely

4. **Full Launch**
   - Announce to all users
   - Marketing push
   - Monitor support requests

---

## Platform Admin Monitoring

### Why Platform-Level Monitoring?

While Clerk manages subscription state per organization/user, the platform needs:
- **Revenue tracking**: MRR, ARR, churn rate
- **Payment health**: Failed payments, at-risk subscriptions
- **Customer success**: Identify upsell opportunities, churn risks
- **Operational alerts**: Immediate notification of critical issues

### Monitoring Architecture

```
Clerk Billing Event
  ↓
Clerk Webhook → app/api/webhooks/clerk/route.ts
  ↓
1. Log to billing_events table
2. Update revenue_metrics table
3. Send admin_notification (if needed)
4. Trigger customer success workflow (if applicable)
```

### Key Metrics to Track

#### Revenue Metrics
- **MRR (Monthly Recurring Revenue)**: Sum of all active monthly subscriptions
- **ARR (Annual Recurring Revenue)**: MRR × 12
- **New MRR**: Revenue from new subscriptions this month
- **Churned MRR**: Revenue lost from cancellations this month
- **Expansion MRR**: Additional revenue from upgrades
- **Contraction MRR**: Lost revenue from downgrades
- **Net New MRR**: New + Expansion - Churned - Contraction

#### Subscription Metrics
- **Active Subscriptions**: Count of currently active subscriptions
- **New Subscriptions**: New signups this period
- **Churned Subscriptions**: Cancellations this period
- **Churn Rate**: (Churned Subscriptions / Active Subscriptions) × 100
- **Upgrades**: Count of users moving to higher tiers
- **Downgrades**: Count of users moving to lower tiers

#### Health Metrics
- **Failed Payments**: Payment attempts that failed
- **Past Due Subscriptions**: Active but payment overdue
- **Trial Conversion Rate**: Trials that convert to paid
- **Average Revenue Per User (ARPU)**: MRR / Active Subscriptions

### Revenue Calculation Example

```typescript
// lib/revenue-metrics.ts
export async function updateRevenueMetrics(
  eventType: string,
  data: SubscriptionEventData
) {
  const currentMonth = new Date().toISOString().slice(0, 7); // '2025-01'

  switch (eventType) {
    case 'subscription_created':
      await db.update(revenueMetrics)
        .set({
          mrr: sql`${revenueMetrics.mrr} + ${data.amount}`,
          activeSubscriptions: sql`${revenueMetrics.activeSubscriptions} + 1`,
          newSubscriptions: sql`${revenueMetrics.newSubscriptions} + 1`,
          calculatedAt: new Date(),
        })
        .where(eq(revenueMetrics.period, currentMonth));
      break;

    case 'subscription_canceled':
      await db.update(revenueMetrics)
        .set({
          mrr: sql`${revenueMetrics.mrr} - ${data.amount}`,
          activeSubscriptions: sql`${revenueMetrics.activeSubscriptions} - 1`,
          churnedSubscriptions: sql`${revenueMetrics.churnedSubscriptions} + 1`,
          calculatedAt: new Date(),
        })
        .where(eq(revenueMetrics.period, currentMonth));
      break;

    case 'subscription_updated':
      const oldAmount = await getPreviousSubscriptionAmount(data.id);
      const diff = data.amount - oldAmount;

      if (diff > 0) {
        // Upgrade
        await db.update(revenueMetrics)
          .set({
            mrr: sql`${revenueMetrics.mrr} + ${diff}`,
            upgrades: sql`${revenueMetrics.upgrades} + 1`,
          })
          .where(eq(revenueMetrics.period, currentMonth));
      } else if (diff < 0) {
        // Downgrade
        await db.update(revenueMetrics)
          .set({
            mrr: sql`${revenueMetrics.mrr} + ${diff}`,
            downgrades: sql`${revenueMetrics.downgrades} + 1`,
          })
          .where(eq(revenueMetrics.period, currentMonth));
      }
      break;
  }
}
```

### Admin Notification System

```typescript
// lib/admin-notifications.ts
export async function sendAdminNotification(notification: {
  type: string;
  title: string;
  message: string;
  severity?: 'low' | 'medium' | 'high';
  orgId?: string;
  userId?: string;
}) {
  // 1. Store in database
  await db.insert(adminNotifications).values({
    type: notification.type,
    title: notification.title,
    message: notification.message,
    severity: notification.severity || 'medium',
    relatedOrgId: notification.orgId,
    relatedUserId: notification.userId,
    isRead: false,
  });

  // 2. Send to Slack
  if (process.env.PLATFORM_SLACK_WEBHOOK) {
    await fetch(process.env.PLATFORM_SLACK_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify({
        text: `🔔 ${notification.title}`,
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${notification.title}*\n${notification.message}`,
          },
        }],
      }),
    });
  }

  // 3. Email for high-severity
  if (notification.severity === 'high') {
    await sendEmail({
      to: process.env.PLATFORM_ADMIN_EMAIL!,
      subject: `[High Priority] ${notification.title}`,
      html: renderAdminAlertEmail(notification),
    });
  }
}
```

### Notification Triggers

| Event | Severity | Notification |
|-------|----------|--------------|
| `subscription.created` (>$500/mo) | Medium | "New Enterprise Subscription" |
| `paymentAttempt.failed` | High | "Payment Failed - Immediate Action Required" |
| `subscription.past_due` | High | "Subscription Past Due - Customer at Risk" |
| `subscription.canceled` (>$100/mo) | Medium | "Subscription Canceled - Exit Interview Needed" |
| Daily: Churn rate > 5% | High | "Churn Rate Spike Detected" |
| Daily: MRR decreased | Medium | "MRR Decrease Alert" |

---

## Feature Gating

### Overview

Feature gating controls access to features based on the organization's subscription plan. Clerk provides built-in methods for this.

### Server-Side Feature Gates

**Using `has()` method:**

```typescript
// app/(dashboard)/analytics/advanced/page.tsx
import { auth, has } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function AdvancedAnalyticsPage() {
  const { orgId } = await auth();

  // Check if org has the feature
  const hasAdvancedAnalytics = has({ feature: 'advanced_analytics' });

  if (!hasAdvancedAnalytics) {
    redirect('/settings/billing?upgrade=advanced_analytics');
  }

  return <AdvancedAnalyticsDashboard />;
}
```

**Check by plan:**

```typescript
// Check if org has specific plan or higher
const hasProPlan = has({ plan: 'professional' });
const hasEnterprisePlan = has({ plan: 'enterprise' });
```

### Client-Side Feature Gates

**Using `<Protect>` component:**

```typescript
// components/slack-integration-button.tsx
'use client';
import { Protect } from '@clerk/nextjs';

export function SlackIntegrationButton() {
  return (
    <Protect
      feature="slack_integration"
      fallback={
        <div className="p-4 border rounded bg-gray-50">
          <p className="text-sm text-gray-600">
            Slack integration is available on Professional plan and above.
          </p>
          <a href="/settings/billing" className="text-blue-600 underline">
            Upgrade now →
          </a>
        </div>
      }
    >
      <button onClick={connectSlack} className="btn-primary">
        Connect Slack
      </button>
    </Protect>
  );
}
```

### Usage-Based Limits

**Check before AI workflow:**

```typescript
// lib/usage-limits.ts
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { has } from '@clerk/nextjs/server';

export async function checkAiWorkflowLimit(orgId: string): Promise<boolean> {
  // Check if unlimited (Enterprise plan)
  const hasUnlimited = has({ feature: 'unlimited_ai_workflows' });
  if (hasUnlimited) return true;

  // Get usage and limits
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId)
  });

  if (!tenant) return false;

  // Reset if new month
  const lastReset = new Date(tenant.currentUsage.lastResetDate);
  const now = new Date();
  if (lastReset.getMonth() !== now.getMonth()) {
    await resetMonthlyUsage(orgId);
    return true;
  }

  // Check against limit
  return tenant.currentUsage.aiWorkflowsThisMonth < tenant.usageLimits.maxAiWorkflowsMonthly;
}

export async function incrementAiWorkflowUsage(orgId: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.clerkOrgId, orgId)
  });

  if (!tenant) return;

  await db.update(tenants)
    .set({
      currentUsage: {
        ...tenant.currentUsage,
        aiWorkflowsThisMonth: tenant.currentUsage.aiWorkflowsThisMonth + 1,
      },
      updatedAt: new Date(),
    })
    .where(eq(tenants.clerkOrgId, orgId));
}
```

**Apply in workflow:**

```typescript
// workflows/inbound/index.ts
export async function workflowInbound(data: LeadFormData) {
  'use workflow';

  // Check usage limit
  const canRunWorkflow = await checkAiWorkflowLimit(data.orgId);

  if (!canRunWorkflow) {
    await notifyLimitReached(data.orgId, 'ai_workflows');
    return processLeadWithoutAI(data);
  }

  // Run AI workflow
  const research = await researchStep(data);
  const qualification = await qualifyStep(data, research);

  // Increment usage
  await incrementAiWorkflowUsage(data.orgId);

  // ... rest of workflow
}
```

### Feature Matrix

Define plan capabilities:

```typescript
// lib/subscription-features.ts
export const FEATURE_MATRIX = {
  personal: {
    maxQuizCompletionsMonthly: 50,
    maxAiWorkflowsMonthly: 20,
    maxTeamMembers: 1,
    features: ['basic_analytics', 'email_sequences']
  },
  personal_pro: {
    maxQuizCompletionsMonthly: 200,
    maxAiWorkflowsMonthly: 100,
    maxTeamMembers: 1,
    features: ['basic_analytics', 'advanced_analytics', 'email_sequences', 'ai_workflows']
  },
  starter: {
    maxQuizCompletionsMonthly: 100,
    maxAiWorkflowsMonthly: 50,
    maxTeamMembers: 5,
    features: ['basic_analytics', 'email_sequences']
  },
  professional: {
    maxQuizCompletionsMonthly: 500,
    maxAiWorkflowsMonthly: 250,
    maxTeamMembers: 15,
    features: [
      'basic_analytics',
      'advanced_analytics',
      'email_sequences',
      'ai_workflows',
      'custom_branding',
      'slack_integration'
    ]
  },
  enterprise: {
    maxQuizCompletionsMonthly: -1, // unlimited
    maxAiWorkflowsMonthly: -1,     // unlimited
    maxTeamMembers: -1,             // unlimited
    features: ['all'] // Full access
  }
};
```

---

## Webhook Events

### Subscription Events

| Event | Description | When It Fires |
|-------|-------------|---------------|
| `subscription.created` | New subscription started | User completes checkout |
| `subscription.updated` | Subscription changed | Plan upgrade/downgrade |
| `subscription.active` | Subscription became active | After successful payment or trial start |
| `subscription.past_due` | Payment overdue | Payment failed but subscription not yet canceled |

### Subscription Item Events

| Event | Description | When It Fires |
|-------|-------------|---------------|
| `subscriptionItem.created` | Plan added to subscription | User subscribes to a plan |
| `subscriptionItem.updated` | Plan details changed | Quantity or plan changed |
| `subscriptionItem.active` | Plan item is active | Plan successfully activated |
| `subscriptionItem.canceled` | Plan removed | User canceled this specific plan |
| `subscriptionItem.ended` | Plan fully ended | After cancellation period |
| `subscriptionItem.abandoned` | Checkout abandoned | User didn't complete payment |
| `subscriptionItem.incomplete` | Payment pending | Waiting for payment method |
| `subscriptionItem.past_due` | Item payment overdue | Specific plan payment failed |
| `subscriptionItem.upcoming` | Renewal upcoming | 3 days before renewal |

### Payment Events

| Event | Description | When It Fires |
|-------|-------------|---------------|
| `paymentAttempt.created` | Payment initiated | Checkout started or recurring charge triggered |
| `paymentAttempt.updated` | Payment status changed | Payment succeeded or failed |

### Webhook Handler Implementation

```typescript
// app/api/webhooks/clerk/route.ts (extend existing)

switch (eventType) {
  // ... existing cases (user, organization, membership) ...

  // Subscription lifecycle
  case 'subscription.created':
    await handleSubscriptionCreated(evt.data);
    break;

  case 'subscription.updated':
    await handleSubscriptionUpdated(evt.data);
    break;

  case 'subscription.active':
    await handleSubscriptionActive(evt.data);
    break;

  case 'subscription.past_due':
    await handleSubscriptionPastDue(evt.data);
    break;

  // Subscription items
  case 'subscriptionItem.created':
    await handleSubscriptionItemCreated(evt.data);
    break;

  case 'subscriptionItem.canceled':
    await handleSubscriptionItemCanceled(evt.data);
    break;

  // Payment attempts
  case 'paymentAttempt.created':
    await handlePaymentAttemptCreated(evt.data);
    break;

  case 'paymentAttempt.updated':
    await handlePaymentAttemptUpdated(evt.data);
    break;
}
```

### Event Handler Examples

#### Subscription Created

```typescript
async function handleSubscriptionCreated(data: unknown) {
  const subData = data as {
    id: string;
    organization_id?: string;
    user_id?: string;
    plan_id: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    amount: number;
    currency: string;
  };

  // 1. Log billing event
  await db.insert(billingEvents).values({
    eventType: 'subscription.created',
    clerkEventId: subData.id,
    orgId: subData.organization_id || null,
    userId: subData.user_id || null,
    subscriptionId: subData.id,
    planId: subData.plan_id,
    planName: await getPlanName(subData.plan_id),
    amount: subData.amount,
    currency: subData.currency,
    status: subData.status,
    rawPayload: subData,
    createdAt: new Date(subData.current_period_start * 1000),
  });

  // 2. Update revenue metrics
  await updateRevenueMetrics('subscription_created', subData);

  // 3. Update tenant subscription history
  if (subData.organization_id) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.clerkOrgId, subData.organization_id),
    });

    if (tenant) {
      await db.update(tenants)
        .set({
          subscriptionHistory: {
            planChanges: [
              ...(tenant.subscriptionHistory?.planChanges || []),
              {
                planId: subData.plan_id,
                planName: await getPlanName(subData.plan_id),
                changedAt: new Date().toISOString(),
                event: 'created',
              },
            ],
          },
          updatedAt: new Date(),
        })
        .where(eq(tenants.clerkOrgId, subData.organization_id));
    }
  }

  // 4. Send admin notification for high-value subscriptions
  const monthlyRevenue = subData.amount / 100;
  if (monthlyRevenue >= 500) {
    await sendAdminNotification({
      type: 'high_value_subscription',
      severity: 'medium',
      title: 'New Enterprise Subscription',
      message: `${await getEntityName(subData)} subscribed to ${await getPlanName(subData.plan_id)} - $${monthlyRevenue}/mo`,
      orgId: subData.organization_id,
      userId: subData.user_id,
    });
  }

  // 5. Send welcome email to customer
  await sendWelcomeEmail(subData);
}
```

#### Payment Failed

```typescript
async function handlePaymentAttemptUpdated(data: unknown) {
  const paymentData = data as {
    id: string;
    subscription_id: string;
    organization_id?: string;
    user_id?: string;
    amount: number;
    status: string; // 'succeeded' | 'failed'
    error_message?: string;
  };

  if (paymentData.status === 'failed') {
    // 1. Log event
    await db.insert(billingEvents).values({
      eventType: 'paymentAttempt.failed',
      clerkEventId: paymentData.id,
      orgId: paymentData.organization_id,
      userId: paymentData.user_id,
      subscriptionId: paymentData.subscription_id,
      amount: paymentData.amount,
      status: 'failed',
      rawPayload: paymentData,
      createdAt: new Date(),
    });

    // 2. Alert platform admin IMMEDIATELY
    await sendAdminNotification({
      type: 'payment_failed',
      severity: 'high',
      title: 'Payment Failed - Action Required',
      message: `${await getEntityName(paymentData)} payment failed ($${paymentData.amount / 100}): ${paymentData.error_message}`,
      orgId: paymentData.organization_id,
      userId: paymentData.user_id,
    });

    // 3. Email customer
    await sendPaymentFailedEmail({
      entityId: paymentData.organization_id || paymentData.user_id!,
      amount: paymentData.amount / 100,
      errorMessage: paymentData.error_message,
    });
  }
}
```

---

## Revenue Metrics

### Monthly Revenue Calculation

Revenue metrics are calculated in real-time via webhook events and stored in the `revenue_metrics` table.

### Metrics Breakdown

```typescript
// Calculate churn rate
function calculateChurnRate(metrics: RevenueMetrics): number {
  if (metrics.activeSubscriptions === 0) return 0;
  return (metrics.churnedSubscriptions / metrics.activeSubscriptions) * 100;
}

// Calculate net new MRR
function calculateNetNewMRR(metrics: RevenueMetrics): number {
  // This month's MRR - last month's MRR
  const lastMonth = getPreviousMonth(metrics.period);
  const lastMonthMetrics = await db.query.revenueMetrics.findFirst({
    where: eq(revenueMetrics.period, lastMonth),
  });

  if (!lastMonthMetrics) return metrics.mrr;
  return metrics.mrr - lastMonthMetrics.mrr;
}

// ARPU (Average Revenue Per User)
function calculateARPU(metrics: RevenueMetrics): number {
  if (metrics.activeSubscriptions === 0) return 0;
  return metrics.mrr / metrics.activeSubscriptions;
}
```

### Monthly Reset Job

Create a cron job to reset usage counters monthly:

```typescript
// app/api/cron/reset-usage/route.ts
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Reset all tenants' usage
  const allTenants = await db.query.tenants.findMany();

  for (const tenant of allTenants) {
    await db.update(tenants)
      .set({
        currentUsage: {
          quizCompletionsThisMonth: 0,
          aiWorkflowsThisMonth: 0,
          lastResetDate: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenant.id));
  }

  return Response.json({
    success: true,
    resetCount: allTenants.length
  });
}
```

**Vercel Cron Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/reset-usage",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

---

## Migration Strategy

### Option 1: Clean Slate (Recommended for New Projects)

If you haven't launched billing yet:
1. Implement Clerk Billing from scratch
2. No migration needed
3. Set all new organizations to "trial" status initially

### Option 2: Parallel Run (For Existing Subscriptions)

If you have existing subscriptions in your database:

#### Phase 1: Parallel Systems (2 weeks)
- Keep existing `subscriptionTier` and `subscriptionStatus` fields
- Enable Clerk Billing
- New subscriptions use Clerk
- Existing subscriptions remain in database
- Sync both systems via webhook

#### Phase 2: Migration (1 week)
- Manually create Clerk subscriptions for existing customers
- Send migration emails to customers
- Offer migration incentive (e.g., 1 month free)
- Verify both systems match

#### Phase 3: Cutover (1 week)
- Switch all feature gates to use Clerk
- Deprecate old subscription fields
- Monitor for issues
- Keep old data for historical analysis

### Option 3: Full Migration Script

```typescript
// scripts/migrate-to-clerk-billing.ts
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { clerkClient } from '@clerk/nextjs/server';

async function migrateSubscriptions() {
  const allTenants = await db.query.tenants.findMany();

  for (const tenant of allTenants) {
    if (tenant.subscriptionStatus === 'active') {
      // Create Clerk subscription for this org
      const plan = await clerkClient().billing.createSubscription({
        organizationId: tenant.clerkOrgId,
        planId: mapTierToPlanId(tenant.subscriptionTier),
      });

      console.log(`Migrated ${tenant.name} to Clerk Billing`);
    }
  }
}

function mapTierToPlanId(tier: string): string {
  const mapping = {
    'starter': 'plan_starter_id',
    'professional': 'plan_pro_id',
    'enterprise': 'plan_enterprise_id',
  };
  return mapping[tier] || mapping.starter;
}
```

---

## Environment Variables

Add to `.env`:

```bash
# Clerk Billing (Stripe is connected via Clerk Dashboard)
# No additional Stripe keys needed - Clerk manages the connection

# Platform Admin Monitoring
PLATFORM_ADMIN_EMAIL=admin@yourdomain.com
PLATFORM_SLACK_WEBHOOK=https://hooks.slack.com/services/xxx/yyy/zzz

# Cron job secret (for usage reset)
CRON_SECRET=your-random-secret-here
```

---

## Success Metrics

Track these metrics to measure billing integration success:

### Technical Metrics
- ✅ Webhook processing success rate (target: >99%)
- ✅ Feature gate accuracy (target: 100%)
- ✅ Usage limit enforcement (target: 100%)
- ✅ Revenue calculation accuracy (verified against Stripe)

### Business Metrics
- 📈 Trial to paid conversion rate (target: >20%)
- 📈 Upgrade rate (target: >10% per year)
- 📉 Churn rate (target: <5% monthly)
- 💰 MRR growth (target: >15% monthly)
- 💰 ARPU (track trend, aim for growth)

### Customer Success Metrics
- ⏱️ Time to first subscription (target: <5 minutes)
- 😊 Billing UI satisfaction (target: >4.5/5)
- 📞 Billing support tickets (target: <5% of users)

---

## Next Steps

1. **Review this plan** with team and stakeholders
2. **Set up Clerk Billing** in dashboard (Phase 1)
3. **Create database migration** (Phase 2)
4. **Implement webhook handlers** (Phase 3)
5. **Build billing UI** (Phase 4)
6. **Add feature gates** (Phase 5)
7. **Create admin dashboard** (Phase 6)
8. **Test thoroughly** (Phase 7)
9. **Launch** (Phase 8)

---

## Resources

- [Clerk Billing Docs](https://clerk.com/docs/billing/overview)
- [Clerk B2B Billing Guide](https://clerk.com/docs/nextjs/guides/billing/for-b2b)
- [Clerk Webhooks](https://clerk.com/docs/guides/development/webhooks/billing)
- [Stripe Testing](https://stripe.com/docs/testing)
- [SaaS Metrics Guide](https://www.saastr.com/saas-metrics-guide/)

---

**Document Version**: 1.0
**Author**: Development Team
**Next Review**: After Phase 1 completion
