import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leads, quizResponses, leadScores } from '@/db/schema';
import { calculateScore, extractContactInfo, getTierAction, type QuizResponseData } from '@/lib/scoring';
import { start } from 'workflow/api';
import { workflowInbound } from '@/workflows/inbound';
import { checkBotId } from 'botid/server';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/rate-limit';

const DEFAULT_ORG_ID = 'default'; // For Phase 1
const DEFAULT_USER_ID = 'system'; // For Phase 1 (no auth yet)

/**
 * POST /api/assessment/submit
 * Processes quiz submission, calculates score, creates lead, and triggers workflows
 */
export async function POST(request: NextRequest) {
  try {
    // Bot detection
    const verification = await checkBotId();

    if (verification.isBot) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, RATE_LIMITS.ASSESSMENT_SUBMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter.toString(),
            'X-RateLimit-Limit': RATE_LIMITS.ASSESSMENT_SUBMIT.requests.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { responses } = body as { responses: QuizResponseData[] };

    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid quiz responses',
        },
        { status: 400 }
      );
    }

    // 1. Calculate score and tier
    const scoringResult = calculateScore(responses);
    console.log('Scoring result:', scoringResult);

    // 2. Extract contact information
    const contactInfo = extractContactInfo(responses);
    console.log('Contact info:', contactInfo);

    if (!contactInfo.email || !contactInfo.name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contact information is required',
        },
        { status: 400 }
      );
    }

    // 3. Create lead record
    const [lead] = await db
      .insert(leads)
      .values({
        orgId: DEFAULT_ORG_ID,
        userId: DEFAULT_USER_ID,
        email: contactInfo.email,
        name: contactInfo.name,
        company: contactInfo.company || null,
        phone: contactInfo.phone || null,
        message: `Help Desk Assessment - ${scoringResult.tier.toUpperCase()} tier (${scoringResult.readinessScore}% score)`,
        status: 'pending',
        qualificationCategory: null, // Will be set by AI workflow if triggered
        qualificationReason: null,
        emailDraft: null,
        researchResults: null,
      })
      .returning();

    console.log('Lead created:', lead.id);

    // 4. Save quiz responses
    const responseRecords = responses.map((response) => ({
      orgId: DEFAULT_ORG_ID,
      leadId: lead.id,
      questionId: response.questionId,
      questionNumber: response.questionNumber,
      answer: response.answer,
      pointsEarned: response.pointsEarned,
    }));

    await db.insert(quizResponses).values(responseRecords);
    console.log('Quiz responses saved:', responseRecords.length);

    // 5. Save lead score
    await db.insert(leadScores).values({
      orgId: DEFAULT_ORG_ID,
      leadId: lead.id,
      readinessScore: scoringResult.readinessScore,
      qualificationScore: null, // Will be set by AI workflow
      totalPoints: scoringResult.totalPoints,
      maxPossiblePoints: scoringResult.maxPossiblePoints,
      tier: scoringResult.tier,
      scoringBreakdown: scoringResult.breakdown,
    });

    console.log('Lead score saved');

    // 6. Determine next action based on tier
    const tierAction = getTierAction(scoringResult.tier);
    console.log('Tier action:', tierAction);

    // 7. Trigger AI workflow for HOT/QUALIFIED leads
    if (tierAction.action === 'ai_workflow') {
      try {
        console.log('Starting AI workflow for lead:', lead.id);

        // Start the workflow with the lead object in an array
        // The workflow will handle research, qualification, and email generation
        await start(workflowInbound, [lead]);

        console.log('AI workflow started successfully');
      } catch (workflowError) {
        console.error('Failed to start workflow:', workflowError);
        // Continue - don't fail the submission if workflow fails
      }
    }

    // 8. Return success with leadId for results page
    return NextResponse.json({
      success: true,
      leadId: lead.id,
      score: scoringResult.readinessScore,
      tier: scoringResult.tier,
      message: 'Assessment submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit assessment',
      },
      { status: 500 }
    );
  }
}
