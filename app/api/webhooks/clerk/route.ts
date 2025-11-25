import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { db } from '@/db';
import { users, tenants, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

async function handleUserCreated(data: unknown) {
  const userData = data as Record<string, unknown>;
  const emailAddresses = userData.email_addresses as Array<Record<string, unknown>> | undefined;

  console.log('User created:', {
    id: userData.id,
    email: emailAddresses?.[0]?.email_address,
    firstName: userData.first_name,
    lastName: userData.last_name,
  });

  await db.insert(users).values({
    clerkUserId: userData.id as string,
    email: (emailAddresses?.[0]?.email_address as string) || '',
    firstName: userData.first_name as string | null | undefined,
    lastName: userData.last_name as string | null | undefined,
    imageUrl: userData.image_url as string | null | undefined,
  });
}

async function handleUserUpdated(data: unknown) {
  const userData = data as Record<string, unknown>;
  const emailAddresses = userData.email_addresses as Array<Record<string, unknown>> | undefined;

  console.log('User updated:', userData.id);

  await db.update(users)
    .set({
      email: (emailAddresses?.[0]?.email_address as string) || '',
      firstName: userData.first_name as string | null | undefined,
      lastName: userData.last_name as string | null | undefined,
      imageUrl: userData.image_url as string | null | undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, userData.id as string));
}

async function handleUserDeleted(data: unknown) {
  const userData = data as Record<string, unknown>;

  console.log('User deleted:', userData.id);

  // Delete user record and cascade to organization memberships
  await db.delete(users).where(eq(users.clerkUserId, userData.id as string));
  await db.delete(organizationMembers).where(eq(organizationMembers.clerkUserId, userData.id as string));
}

async function handleOrganizationCreated(data: unknown) {
  const orgData = data as Record<string, unknown>;

  console.log('Organization created:', {
    id: orgData.id,
    name: orgData.name,
    slug: orgData.slug,
  });

  await db.insert(tenants).values({
    clerkOrgId: orgData.id as string,
    name: orgData.name as string,
    slug: orgData.slug as string,
    subdomain: orgData.slug as string, // Use org slug as subdomain
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
    landingPage: {
      heroTitle: `Welcome to ${orgData.name as string}`,
      heroSubtitle: 'Complete our assessment to get started',
      ctaText: 'Take Assessment',
    },
    settings: {
      enableAiResearch: true,
      qualificationThreshold: 60,
    },
    usageLimits: {
      maxQuizCompletionsMonthly: 100,
      maxAiWorkflowsMonthly: 50,
      maxTeamMembers: 5,
    },
  });
}

async function handleOrganizationUpdated(data: unknown) {
  const orgData = data as Record<string, unknown>;

  console.log('Organization updated:', orgData.id);

  await db.update(tenants)
    .set({
      name: orgData.name as string,
      slug: orgData.slug as string,
      subdomain: orgData.slug as string,
      updatedAt: new Date(),
    })
    .where(eq(tenants.clerkOrgId, orgData.id as string));
}

async function handleOrganizationDeleted(data: unknown) {
  const orgData = data as Record<string, unknown>;

  console.log('Organization deleted:', orgData.id);

  // Delete tenant - this will cascade to delete org-specific data
  await db.delete(tenants).where(eq(tenants.clerkOrgId, orgData.id as string));
  // Also clean up organization memberships
  await db.delete(organizationMembers).where(eq(organizationMembers.clerkOrgId, orgData.id as string));
}

async function handleMembershipCreated(data: unknown) {
  const memberData = data as Record<string, unknown>;
  const organization = memberData.organization as Record<string, unknown> | undefined;
  const publicUserData = memberData.public_user_data as Record<string, unknown> | undefined;

  console.log('Membership created:', {
    orgId: organization?.id,
    userId: publicUserData?.user_id,
    role: memberData.role,
  });

  await db.insert(organizationMembers).values({
    clerkOrgId: organization?.id as string,
    clerkUserId: publicUserData?.user_id as string,
    role: memberData.role as string,
  });
}

async function handleMembershipDeleted(data: unknown) {
  const memberData = data as Record<string, unknown>;
  const organization = memberData.organization as Record<string, unknown> | undefined;
  const publicUserData = memberData.public_user_data as Record<string, unknown> | undefined;

  console.log('Membership deleted:', {
    orgId: organization?.id,
    userId: publicUserData?.user_id,
  });

  await db.delete(organizationMembers)
    .where(and(
      eq(organizationMembers.clerkOrgId, organization?.id as string),
      eq(organizationMembers.clerkUserId, publicUserData?.user_id as string)
    ));
}
