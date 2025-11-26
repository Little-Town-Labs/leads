import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, quizResponses, leadScores } from '@/db/schema';
import { calculateProductFitScore } from '@/lib/demo-scoring';
import { notifySalesTeam } from '@/lib/sales-notifications';

const DEMO_ORG_ID = 'org_demo_leadagent';
const DEMO_USER_ID = 'system_demo';

interface QuizResponseData {
  questionId: string;
  questionNumber: number;
  answer: unknown;
  pointsEarned: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { responses } = body as { responses: QuizResponseData[] };

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid quiz responses' },
        { status: 400 }
      );
    }

    const contactResponse = responses.find(r => r.questionNumber === 1);
    if (!contactResponse || typeof contactResponse.answer !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Contact information required' },
        { status: 400 }
      );
    }

    const contactInfo = contactResponse.answer as Record<string, string>;
    const { name, email, company, title } = contactInfo;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const fitScoreResult = calculateProductFitScore(responses);
    console.log('Product fit score:', fitScoreResult);

    const tierUpper = fitScoreResult.tier.toUpperCase();
    const message = 'Demo Assessment - ' + tierUpper + ' (' + fitScoreResult.score + '% product fit)' + (title ? ' - ' + title : '');

    const [lead] = await db.insert(leads).values({
      orgId: DEMO_ORG_ID,
      userId: DEMO_USER_ID,
      email: email,
      name: name,
      company: company || null,
      phone: null,
      message: message,
      status: 'pending',
      qualificationCategory: null,
      qualificationReason: null,
      emailDraft: null,
      researchResults: null,
    }).returning();

    console.log('Demo lead created:', lead.id);

    const responseRecords = responses.map((response) => ({
      orgId: DEMO_ORG_ID,
      leadId: lead.id,
      questionId: response.questionId,
      questionNumber: response.questionNumber,
      answer: response.answer,
      pointsEarned: response.pointsEarned,
    }));

    await db.insert(quizResponses).values(responseRecords);
    console.log('Quiz responses saved:', responseRecords.length);

    await db.insert(leadScores).values({
      orgId: DEMO_ORG_ID,
      leadId: lead.id,
      readinessScore: fitScoreResult.score,
      qualificationScore: null,
      totalPoints: fitScoreResult.totalPoints,
      maxPossiblePoints: fitScoreResult.maxPossiblePoints,
      tier: fitScoreResult.tier,
      scoringBreakdown: fitScoreResult.breakdown,
    });

    console.log('Lead score saved');

    notifySalesTeam({
      lead: {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company: lead.company,
      },
      fitScore: fitScoreResult.score,
      tier: fitScoreResult.tier,
    }).catch(err => {
      console.error('Sales notification failed (non-blocking):', err);
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      fitScore: fitScoreResult.score,
      tier: fitScoreResult.tier,
    });

  } catch (error) {
    console.error('Error submitting demo assessment:', error);
    return NextResponse.json(
      { success: false, error: 'Submission failed. Please try again.' },
      { status: 500 }
    );
  }
}
