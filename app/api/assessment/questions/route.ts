import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizQuestions } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

const DEFAULT_ORG_ID = 'default'; // For Phase 1

/**
 * GET /api/assessment/questions
 * Fetches all quiz questions for the assessment
 */
export async function GET() {
  try {
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.orgId, DEFAULT_ORG_ID))
      .orderBy(asc(quizQuestions.questionNumber));

    return NextResponse.json({
      success: true,
      questions,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quiz questions',
      },
      { status: 500 }
    );
  }
}
