import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, leadScores, workflows } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const DEFAULT_ORG_ID = 'default';
const DEFAULT_USER_ID = 'system';

/**
 * GET /api/dashboard/approve/[leadId]
 * Fetches approval data for a specific lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;

    // Fetch lead
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead not found',
        },
        { status: 404 }
      );
    }

    // Fetch score
    const score = await db.query.leadScores.findFirst({
      where: eq(leadScores.leadId, leadId),
    });

    // Fetch most recent workflow
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.leadId, leadId),
      orderBy: desc(workflows.createdAt),
    });

    if (!workflow || !workflow.emailDraft) {
      return NextResponse.json(
        {
          success: false,
          error: 'No email draft available for this lead',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        phone: lead.phone,
        qualificationCategory: lead.qualificationCategory,
        qualificationReason: lead.qualificationReason,
        tier: score?.tier || 'unknown',
        readinessScore: score?.readinessScore || 0,
        createdAt: lead.createdAt,
      },
      workflow: {
        id: workflow.id,
        emailDraft: workflow.emailDraft,
        researchResults: workflow.researchResults,
      },
    });
  } catch (error) {
    console.error('Error fetching approval data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch approval data',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/approve/[leadId]
 * Handles approve or reject actions for a lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const body = await request.json();
    const { action, emailDraft } = body;

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Must be "approve" or "reject"',
        },
        { status: 400 }
      );
    }

    // Fetch lead to ensure it exists
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead not found',
        },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      if (!emailDraft || !emailDraft.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email draft is required for approval',
          },
          { status: 400 }
        );
      }

      // Update lead status to approved and save the email draft
      await db
        .update(leads)
        .set({
          status: 'approved',
          emailDraft: emailDraft,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      // Update workflow to mark as approved
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.leadId, leadId),
        orderBy: desc(workflows.createdAt),
      });

      if (workflow) {
        await db
          .update(workflows)
          .set({
            approvedBy: DEFAULT_USER_ID,
            emailDraft: emailDraft,
          })
          .where(eq(workflows.id, workflow.id));
      }

      return NextResponse.json({
        success: true,
        message: 'Lead approved successfully',
        action: 'approved',
      });
    } else if (action === 'reject') {
      // Update lead status to rejected
      await db
        .update(leads)
        .set({
          status: 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(leads.id, leadId));

      // Update workflow to mark as rejected
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.leadId, leadId),
        orderBy: desc(workflows.createdAt),
      });

      if (workflow) {
        await db
          .update(workflows)
          .set({
            rejectedBy: DEFAULT_USER_ID,
          })
          .where(eq(workflows.id, workflow.id));
      }

      return NextResponse.json({
        success: true,
        message: 'Lead rejected successfully',
        action: 'rejected',
      });
    }
  } catch (error) {
    console.error('Error processing approval action:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process action',
      },
      { status: 500 }
    );
  }
}
