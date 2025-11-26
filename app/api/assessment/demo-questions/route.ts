import { NextResponse } from 'next/server';
import { db } from '@/db';
import { quizQuestions } from '@/db/schema';
import { eq } from 'drizzle-orm';

const DEMO_ORG_ID = 'org_demo_leadagent';

export async function GET() {
  try {
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.orgId, DEMO_ORG_ID))
      .orderBy(quizQuestions.questionNumber);

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Error fetching demo questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}
