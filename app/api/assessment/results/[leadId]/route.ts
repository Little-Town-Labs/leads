import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, leadScores, quizResponses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTierDescription } from '@/lib/scoring';

/**
 * GET /api/assessment/results/[leadId]
 * Fetches assessment results for a specific lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;

    if (!leadId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch lead data
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assessment results not found',
        },
        { status: 404 }
      );
    }

    // Fetch lead score
    const score = await db.query.leadScores.findFirst({
      where: eq(leadScores.leadId, leadId),
    });

    if (!score) {
      return NextResponse.json(
        {
          success: false,
          error: 'Score not found',
        },
        { status: 404 }
      );
    }

    // Fetch quiz responses (optional, for detailed breakdown)
    const responses = await db.query.quizResponses.findMany({
      where: eq(quizResponses.leadId, leadId),
    });

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
      },
      score: {
        readinessScore: score.readinessScore,
        tier: score.tier,
        tierDescription: getTierDescription(score.tier),
        totalPoints: score.totalPoints,
        maxPossiblePoints: score.maxPossiblePoints,
        breakdown: score.scoringBreakdown,
      },
      responsesCount: responses.length,
    });
  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch assessment results',
      },
      { status: 500 }
    );
  }
}
