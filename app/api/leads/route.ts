import { NextRequest } from 'next/server';
import { getOrgDb } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

/**
 * GET /api/leads
 * Get all leads for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission('leads:view_all');

    const orgDb = await getOrgDb();
    const leads = await orgDb.leads.findMany();

    return Response.json({ leads });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('No organization')) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
