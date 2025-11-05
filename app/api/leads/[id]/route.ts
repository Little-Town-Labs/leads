import { NextRequest } from 'next/server';
import { getOrgDb } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

/**
 * GET /api/leads/[id]
 * Get a specific lead by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('leads:view_all');

    const { id } = await params;
    const orgDb = await getOrgDb();
    const lead = await orgDb.leads.findById(id);

    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ lead });
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

/**
 * PATCH /api/leads/[id]
 * Update a specific lead
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('leads:edit');

    const { id } = await params;
    const body = await request.json();
    const orgDb = await getOrgDb();

    const [updated] = await orgDb.leads.update(id, body);

    if (!updated) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ lead: updated });
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

/**
 * DELETE /api/leads/[id]
 * Delete a specific lead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission('leads:delete');

    const { id } = await params;
    const orgDb = await getOrgDb();

    const [deleted] = await orgDb.leads.delete(id);

    if (!deleted) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ success: true });
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
