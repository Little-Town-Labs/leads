import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

/**
 * Clerk Webhook Handler
 *
 * Handles events from Clerk:
 * - user.created: Create user record in database
 * - user.updated: Update user information
 * - user.deleted: Remove user from database
 * - organization.created: Create organization/tenant
 * - organization.updated: Update organization info
 * - organization.deleted: Remove organization
 * - organizationMembership.created: Add user to org
 * - organizationMembership.deleted: Remove user from org
 *
 * To set up:
 * 1. Go to Clerk Dashboard → Webhooks
 * 2. Click "Add Endpoint"
 * 3. Enter your webhook URL: https://yourdomain.com/api/webhooks/clerk
 * 4. Select events to subscribe to
 * 5. Copy the signing secret and add to CLERK_WEBHOOK_SECRET env var
 */
export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Get the webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Error: CLERK_WEBHOOK_SECRET is not set');
    return new Response('Error: Webhook secret not configured', {
      status: 500,
    });
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error: Webhook verification failed:', err);
    return new Response('Error: Verification failed', {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  console.log(`Webhook received: ${eventType}`, {
    id: evt.data.id,
  });

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;

      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;

      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;

      case 'organization.created':
        await handleOrganizationCreated(evt.data);
        break;

      case 'organization.updated':
        await handleOrganizationUpdated(evt.data);
        break;

      case 'organization.deleted':
        await handleOrganizationDeleted(evt.data);
        break;

      case 'organizationMembership.created':
        await handleMembershipCreated(evt.data);
        break;

      case 'organizationMembership.deleted':
        await handleMembershipDeleted(evt.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error(`Error processing webhook ${eventType}:`, error);
    return new Response('Error processing webhook', { status: 500 });
  }
}

/**
 * Handler functions for each event type
 * TODO: Implement these based on your database schema
 */

async function handleUserCreated(data: any) {
  console.log('User created:', {
    id: data.id,
    email: data.email_addresses?.[0]?.email_address,
    firstName: data.first_name,
    lastName: data.last_name,
  });

  // TODO: Create user record in your database
  // Example:
  // await db.insert(users).values({
  //   clerkUserId: data.id,
  //   email: data.email_addresses?.[0]?.email_address,
  //   firstName: data.first_name,
  //   lastName: data.last_name,
  // });
}

async function handleUserUpdated(data: any) {
  console.log('User updated:', data.id);

  // TODO: Update user record in your database
  // Example:
  // await db.update(users)
  //   .set({
  //     email: data.email_addresses?.[0]?.email_address,
  //     firstName: data.first_name,
  //     lastName: data.last_name,
  //   })
  //   .where(eq(users.clerkUserId, data.id));
}

async function handleUserDeleted(data: any) {
  console.log('User deleted:', data.id);

  // TODO: Delete or soft-delete user record
  // Example:
  // await db.delete(users).where(eq(users.clerkUserId, data.id));
}

async function handleOrganizationCreated(data: any) {
  console.log('Organization created:', {
    id: data.id,
    name: data.name,
    slug: data.slug,
  });

  // TODO: Create tenant record in your database
  // This is important for multi-tenant setup!
  // Example:
  // await db.insert(tenants).values({
  //   clerkOrgId: data.id,
  //   name: data.name,
  //   slug: data.slug,
  //   subdomain: data.slug, // Use org slug as subdomain
  //   branding: {
  //     primaryColor: '#3B82F6',
  //     secondaryColor: '#10B981',
  //   },
  //   landingPage: {
  //     heroTitle: `Welcome to ${data.name}`,
  //     heroSubtitle: 'Complete our assessment to get started',
  //     ctaText: 'Take Assessment',
  //   },
  //   settings: {
  //     enableAiResearch: true,
  //     qualificationThreshold: 60,
  //   },
  //   usageLimits: {
  //     maxQuizCompletionsMonthly: 100,
  //     maxAiWorkflowsMonthly: 50,
  //     maxTeamMembers: 5,
  //   },
  // });
}

async function handleOrganizationUpdated(data: any) {
  console.log('Organization updated:', data.id);

  // TODO: Update tenant record
  // Example:
  // await db.update(tenants)
  //   .set({
  //     name: data.name,
  //     slug: data.slug,
  //   })
  //   .where(eq(tenants.clerkOrgId, data.id));
}

async function handleOrganizationDeleted(data: any) {
  console.log('Organization deleted:', data.id);

  // TODO: Delete or soft-delete tenant
  // Be careful - this should cascade to delete all tenant data
  // Example:
  // await db.delete(tenants).where(eq(tenants.clerkOrgId, data.id));
}

async function handleMembershipCreated(data: any) {
  console.log('Membership created:', {
    orgId: data.organization.id,
    userId: data.public_user_data.user_id,
    role: data.role,
  });

  // TODO: Track organization membership if needed
  // This is useful if you have a separate members table
}

async function handleMembershipDeleted(data: any) {
  console.log('Membership deleted:', {
    orgId: data.organization.id,
    userId: data.public_user_data.user_id,
  });

  // TODO: Remove membership tracking
}
