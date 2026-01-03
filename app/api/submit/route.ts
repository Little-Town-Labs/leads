import { formSchema } from '@/lib/types';
import { checkBotId } from 'botid/server';
import { start } from 'workflow/api';
import { workflowInbound } from '@/workflows/inbound';
import { auth } from '@clerk/nextjs/server';
import { checkUsageLimit, incrementUsage } from '@/lib/subscriptions';
import { getOrgDb } from '@/lib/db';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Bot detection
  const verification = await checkBotId();

  if (verification.isBot) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(clientIp, RATE_LIMITS.FORM_SUBMIT);

  if (!rateLimitResult.allowed) {
    return Response.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter.toString(),
          'X-RateLimit-Limit': RATE_LIMITS.FORM_SUBMIT.requests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
        },
      }
    );
  }

  // Validate form data
  const body = await request.json();
  const parsedBody = formSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json({ error: parsedBody.error.message }, { status: 400 });
  }

  // Get organization context
  const { orgId } = await auth();

  if (!orgId) {
    return Response.json(
      { error: 'No organization context. Please select or create an organization.' },
      { status: 400 }
    );
  }

  // Check usage limits
  const canCreate = await checkUsageLimit(orgId);

  if (!canCreate) {
    return Response.json(
      { error: 'Monthly lead limit reached. Please upgrade your plan.' },
      { status: 429 }
    );
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
