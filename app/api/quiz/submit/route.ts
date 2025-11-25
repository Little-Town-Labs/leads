import { db } from '@/db';
import { leads, quizResponses, leadScores, quizQuestions } from '@/db/schema';
import { getTenantBySubdomain } from '@/lib/tenants';
import { checkBotId } from 'botid/server';
import { start } from 'workflow/api';
import { workflowInbound } from '@/workflows/inbound';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ContactInfo } from '@/lib/quiz-types';

/**
 * Quiz Submission API Route
 * Handles tenant-aware quiz submissions
 * - Validates tenant
 * - Calculates scores
 * - Creates lead and saves responses
 * - Starts AI workflow
 */

const quizSubmissionSchema = z.object({
  tenantSlug: z.string(),
  responses: z.record(z.string(), z.any()),
});

export async function POST(request: Request) {
  try {
    // Bot detection
    const verification = await checkBotId();
    if (verification.isBot) {
      return Response.json({ error: 'Access denied' }, { status: 403 });
    }

    // Validate request body
    const body = await request.json();
    const parsedBody = quizSubmissionSchema.safeParse(body);

    if (!parsedBody.success) {
      return Response.json({ error: 'Invalid request data', details: parsedBody.error }, { status: 400 });
    }

    const { tenantSlug, responses } = parsedBody.data;

    // Get tenant configuration
    const tenant = await getTenantBySubdomain(tenantSlug);
    if (!tenant) {
      return Response.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Get all quiz questions for this tenant
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.orgId, tenant.clerkOrgId))
      .orderBy(quizQuestions.questionNumber);

    if (questions.length === 0) {
      return Response.json({ error: 'No quiz questions found for this tenant' }, { status: 400 });
    }

    // Extract contact info from first question (should be contact_info type)
    const contactQuestion = questions.find((q) => q.questionType === 'contact_info');
    const contactInfo = (contactQuestion ? responses[contactQuestion.id] : {}) as ContactInfo;

    if (!contactInfo.email || !contactInfo.full_name) {
      return Response.json(
        { error: 'Missing required contact information (email and name)' },
        { status: 400 }
      );
    }

    // Calculate total score
    let totalPoints = 0;
    let maxPossiblePoints = 0;

    const scoreBreakdown: Record<string, { points: number; maxPoints: number }> = {};

    for (const question of questions) {
      const answer = responses[question.id];
      let pointsEarned = 0;
      const weight = question.scoringWeight || 0;

      if (question.questionType === 'multiple_choice') {
        // Find selected option and get its score
        const options = question.options as Array<{ value: string; score?: number }>;
        const selectedOption = options?.find((opt) => opt.value === answer);
        if (selectedOption && selectedOption.score !== undefined) {
          pointsEarned = selectedOption.score * weight;
        }
        // Max is highest score for this question
        const maxScore = Math.max(...(options?.map((opt) => opt.score || 0) || [0]));
        maxPossiblePoints += maxScore * weight;
      } else if (question.questionType === 'checkbox') {
        // Sum scores of selected options
        const options = question.options as Array<{ value: string; score?: number }>;
        if (Array.isArray(answer)) {
          answer.forEach((val: string) => {
            const option = options?.find((opt) => opt.value === val);
            if (option && option.score !== undefined) {
              pointsEarned += option.score * weight;
            }
          });
        }
        // Max is sum of all option scores
        const maxScore = options?.reduce((sum, opt) => sum + (opt.score || 0), 0) || 0;
        maxPossiblePoints += maxScore * weight;
      }

      totalPoints += pointsEarned;

      // Track breakdown by question type
      const category = question.questionType;
      if (!scoreBreakdown[category]) {
        scoreBreakdown[category] = { points: 0, maxPoints: 0 };
      }
      scoreBreakdown[category].points += pointsEarned;
      scoreBreakdown[category].maxPoints += weight;
    }

    // Calculate readiness score (0-100)
    const readinessScore =
      maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0;

    // Determine tier based on readiness score
    let tier: 'cold' | 'warm' | 'hot' | 'qualified';
    if (readinessScore >= 80) {
      tier = 'qualified';
    } else if (readinessScore >= 60) {
      tier = 'hot';
    } else if (readinessScore >= 40) {
      tier = 'warm';
    } else {
      tier = 'cold';
    }

    // Create lead record
    const [lead] = await db
      .insert(leads)
      .values({
        orgId: tenant.clerkOrgId,
        userId: 'quiz_submission', // Public quiz, no logged-in user
        email: contactInfo.email,
        name: contactInfo.full_name,
        company: contactInfo.company || null,
        phone: contactInfo.phone || null,
        message: `Quiz submission - Readiness Score: ${readinessScore}% (${tier})`,
        status: 'pending',
      })
      .returning();

    // Save quiz responses
    const responseRecords = questions.map((question) => {
      const answer = responses[question.id];
      let pointsEarned = 0;

      // Calculate points for this specific response
      if (question.questionType === 'multiple_choice') {
        const options = question.options as Array<{ value: string; score?: number }>;
        const selectedOption = options?.find((opt) => opt.value === answer);
        if (selectedOption && selectedOption.score !== undefined) {
          pointsEarned = selectedOption.score * (question.scoringWeight || 0);
        }
      } else if (question.questionType === 'checkbox' && Array.isArray(answer)) {
        const options = question.options as Array<{ value: string; score?: number }>;
        answer.forEach((val: string) => {
          const option = options?.find((opt) => opt.value === val);
          if (option && option.score !== undefined) {
            pointsEarned += option.score * (question.scoringWeight || 0);
          }
        });
      }

      return {
        orgId: tenant.clerkOrgId,
        leadId: lead.id,
        questionId: question.id,
        questionNumber: question.questionNumber,
        answer,
        pointsEarned,
      };
    });

    await db.insert(quizResponses).values(responseRecords);

    // Save lead score
    await db.insert(leadScores).values({
      orgId: tenant.clerkOrgId,
      leadId: lead.id,
      readinessScore,
      totalPoints,
      maxPossiblePoints,
      tier,
      scoringBreakdown: scoreBreakdown,
    });

    // Start AI workflow if enabled
    if (tenant.settings.enableAiResearch) {
      await start(workflowInbound, [
        {
          ...lead,
          tenantId: tenant.id,
          tenantSettings: tenant.settings,
        },
      ]);
    }

    return Response.json(
      {
        message: 'Quiz submitted successfully',
        leadId: lead.id,
        readinessScore,
        tier,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting quiz:', error);
    return Response.json(
      { error: 'Failed to submit quiz', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
