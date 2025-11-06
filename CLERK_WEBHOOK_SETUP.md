# Clerk Webhook Setup Guide

This guide will help you set up Clerk webhooks to keep your database synchronized with Clerk user and organization events.

## Prerequisites

- Clerk account with your application configured
- Your application deployed to production (or using a service like ngrok for local testing)
- `CLERK_WEBHOOK_SECRET` environment variable ready to configure

## Step 1: Access Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Select your application
3. Navigate to **Webhooks** in the left sidebar

## Step 2: Create Webhook Endpoint

1. Click **"Add Endpoint"** button
2. Configure the endpoint:

### Production URL
```
https://yourdomain.com/api/webhooks/clerk
```

### Local Development (using ngrok)
```bash
# Install ngrok if not already installed
npm install -g ngrok

# Start your Next.js app
pnpm dev

# In another terminal, expose port 3000
ngrok http 3000

# Use the HTTPS URL provided by ngrok
https://your-ngrok-url.ngrok.io/api/webhooks/clerk
```

## Step 3: Subscribe to Events

Select the following events (check all that apply to your use case):

### User Events
- ✅ `user.created` - When a new user signs up
- ✅ `user.updated` - When user profile is updated
- ✅ `user.deleted` - When a user is deleted

### Organization Events (Important for Multi-Tenant)
- ✅ `organization.created` - When a new organization is created
- ✅ `organization.updated` - When organization details change
- ✅ `organization.deleted` - When an organization is deleted

### Membership Events
- ✅ `organizationMembership.created` - When a user joins an organization
- ✅ `organizationMembership.updated` - When membership role changes
- ✅ `organizationMembership.deleted` - When a user leaves an organization

## Step 4: Copy Signing Secret

1. After creating the endpoint, Clerk will show you a **Signing Secret**
2. Copy this secret (it starts with `whsec_`)
3. Add it to your environment variables:

### Local Development (.env.local)
```bash
CLERK_WEBHOOK_SECRET=whsec_your_secret_here
```

### Production (Vercel)
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add new variable:
   - **Name**: `CLERK_WEBHOOK_SECRET`
   - **Value**: `whsec_your_secret_here`
   - **Environment**: Production (and Preview if needed)
4. Redeploy your application

## Step 5: Test the Webhook

Clerk provides a testing interface:

1. In the Clerk Dashboard webhook settings, find your endpoint
2. Click **"Send Test Event"**
3. Select an event type (e.g., `user.created`)
4. Click **Send**
5. Check your application logs to verify the webhook was received

### Expected Log Output
```
Webhook received: user.created { id: 'user_xxx' }
User created: {
  id: 'user_xxx',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
}
```

## Step 6: Implement Database Handlers

The webhook endpoint at `app/api/webhooks/clerk/route.ts` has TODO comments for each handler. You need to implement these based on your database schema:

### Example: Handle Organization Created

```typescript
async function handleOrganizationCreated(data: any) {
  const { db } = await import('@/db');
  const { tenants } = await import('@/db/schema');

  await db.insert(tenants).values({
    clerkOrgId: data.id,
    name: data.name,
    slug: data.slug,
    subdomain: data.slug,
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    landingPage: {
      heroTitle: `Welcome to ${data.name}`,
      heroSubtitle: 'Complete our assessment',
      ctaText: 'Get Started',
    },
    settings: {
      enableAiResearch: true,
      qualificationThreshold: 60,
    },
    subscriptionTier: 'starter',
    usageLimits: {
      maxQuizCompletionsMonthly: 100,
      maxAiWorkflowsMonthly: 50,
      maxTeamMembers: 5,
    },
  });
}
```

## Webhook Events and Use Cases

| Event | When It Fires | What To Do |
|-------|---------------|------------|
| `user.created` | User signs up | Create user profile in your DB |
| `user.updated` | User updates profile | Sync changes to your DB |
| `user.deleted` | User account deleted | Remove user data (GDPR compliance) |
| `organization.created` | New org created | **Create tenant record** (important!) |
| `organization.updated` | Org name/settings change | Update tenant info |
| `organization.deleted` | Org is deleted | Remove tenant and cascade delete data |
| `organizationMembership.created` | User joins org | Grant user access to tenant |
| `organizationMembership.deleted` | User leaves org | Revoke user access |

## Monitoring Webhooks

### Clerk Dashboard
- View webhook delivery status
- See failed deliveries and retry them
- Check payload and response for debugging

### Your Application Logs
- Check Vercel logs for webhook processing
- Monitor for errors in webhook handlers
- Set up error tracking (Sentry, LogRocket, etc.)

## Troubleshooting

### Webhook Verification Failed
- **Cause**: Incorrect `CLERK_WEBHOOK_SECRET`
- **Fix**: Double-check the secret matches exactly what Clerk shows

### 404 Not Found
- **Cause**: Webhook URL is incorrect
- **Fix**: Verify URL is `https://yourdomain.com/api/webhooks/clerk` (no trailing slash)

### Timeout Errors
- **Cause**: Webhook handler taking too long (>10 seconds)
- **Fix**: Move database operations to background jobs for complex operations

### Events Not Triggering
- **Cause**: Events not subscribed in Clerk dashboard
- **Fix**: Go to webhook settings and ensure all needed events are checked

## Security Best Practices

1. ✅ **Always verify webhook signatures** - The endpoint uses `svix` to verify all requests
2. ✅ **Never skip verification** - Reject requests without valid signatures
3. ✅ **Use HTTPS in production** - Clerk requires HTTPS endpoints
4. ✅ **Rotate secrets regularly** - Update webhook secrets periodically
5. ✅ **Log webhook events** - Keep audit trail of all webhook activity
6. ✅ **Handle idempotency** - Webhooks may be delivered multiple times

## Next Steps

After setting up webhooks:

1. ✅ Test creating a new organization in Clerk
2. ✅ Verify tenant record is created in your database
3. ✅ Test user signup and profile updates
4. ✅ Monitor webhook logs for any errors
5. ✅ Implement remaining TODO handlers in the webhook route

## Resources

- [Clerk Webhooks Documentation](https://clerk.com/docs/integrations/webhooks/overview)
- [Svix Webhook Verification](https://docs.svix.com/receiving/verifying-payloads/how)
- [Webhook Event Types](https://clerk.com/docs/integrations/webhooks/overview#supported-events)
