import { NextResponse } from 'next/server';
import { getOrgDb } from '@/lib/db';
import { requirePermission } from '@/lib/permissions';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check permission
    await requirePermission('leads:approve');

    const orgDb = await getOrgDb();
    const { id } = await params;

    // Update lead status
    const [updatedLead] = await orgDb.leads.update(id, {
      status: 'approved',
    });

    if (!updatedLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Error approving lead:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to approve lead' },
      { status: 500 }
    );
  }
}
