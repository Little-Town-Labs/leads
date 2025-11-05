import { NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, leadScores, workflows } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const DEFAULT_ORG_ID = 'default';

/**
 * GET /api/dashboard/leads
 * Fetches all leads with their scores and workflow data for the dashboard
 */
export async function GET() {
  try {
    // Fetch all leads with their scores
    const allLeads = await db
      .select({
        lead: leads,
        score: leadScores,
      })
      .from(leads)
      .leftJoin(leadScores, eq(leads.id, leadScores.leadId))
      .where(eq(leads.orgId, DEFAULT_ORG_ID))
      .orderBy(desc(leads.createdAt));

    // For each lead, fetch associated workflow if exists
    const leadsWithWorkflows = await Promise.all(
      allLeads.map(async ({ lead, score }) => {
        const workflow = await db.query.workflows.findFirst({
          where: eq(workflows.leadId, lead.id),
          orderBy: desc(workflows.createdAt),
        });

        return {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          phone: lead.phone,
          message: lead.message,
          qualificationCategory: lead.qualificationCategory,
          qualificationReason: lead.qualificationReason,
          status: lead.status,
          createdAt: lead.createdAt,
          tier: score?.tier || 'unknown',
          readinessScore: score?.readinessScore || 0,
          workflow: workflow
            ? {
                id: workflow.id,
                status: workflow.status,
                emailDraft: workflow.emailDraft,
                researchResults: workflow.researchResults,
              }
            : null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      leads: leadsWithWorkflows,
      count: leadsWithWorkflows.length,
    });
  } catch (error) {
    console.error('Error fetching dashboard leads:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leads',
      },
      { status: 500 }
    );
  }
}
