'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { quizQuestions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createQuizQuestion(formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const questionNumber = parseInt(formData.get('questionNumber') as string);
    const questionType = formData.get('questionType') as string;
    const questionText = formData.get('questionText') as string;
    const questionSubtext = formData.get('questionSubtext') as string || null;
    const placeholder = formData.get('placeholder') as string || null;
    const scoringWeight = parseInt(formData.get('scoringWeight') as string) || 0;
    const isRequired = formData.get('isRequired') === 'true';
    const minSelections = formData.get('minSelections') ? parseInt(formData.get('minSelections') as string) : null;
    const options = formData.get('options') ? JSON.parse(formData.get('options') as string) : null;

    await db.insert(quizQuestions).values({
      orgId,
      questionNumber,
      questionType,
      questionText,
      questionSubtext,
      placeholder,
      scoringWeight,
      isRequired,
      minSelections,
      options,
    });

    revalidatePath('/admin/quiz');
    return { success: true };
  } catch (error) {
    console.error('Error creating quiz question:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create quiz question' };
  }
}

export async function updateQuizQuestion(id: string, formData: FormData) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    const questionNumber = parseInt(formData.get('questionNumber') as string);
    const questionType = formData.get('questionType') as string;
    const questionText = formData.get('questionText') as string;
    const questionSubtext = formData.get('questionSubtext') as string || null;
    const placeholder = formData.get('placeholder') as string || null;
    const scoringWeight = parseInt(formData.get('scoringWeight') as string) || 0;
    const isRequired = formData.get('isRequired') === 'true';
    const minSelections = formData.get('minSelections') ? parseInt(formData.get('minSelections') as string) : null;
    const options = formData.get('options') ? JSON.parse(formData.get('options') as string) : null;

    await db
      .update(quizQuestions)
      .set({
        questionNumber,
        questionType,
        questionText,
        questionSubtext,
        placeholder,
        scoringWeight,
        isRequired,
        minSelections,
        options,
        updatedAt: new Date(),
      })
      .where(and(eq(quizQuestions.id, id), eq(quizQuestions.orgId, orgId)));

    revalidatePath('/admin/quiz');
    return { success: true };
  } catch (error) {
    console.error('Error updating quiz question:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update quiz question' };
  }
}

export async function deleteQuizQuestion(id: string) {
  const { orgId } = await auth();

  if (!orgId) {
    return { error: 'No organization found' };
  }

  try {
    await db
      .delete(quizQuestions)
      .where(and(eq(quizQuestions.id, id), eq(quizQuestions.orgId, orgId)));

    revalidatePath('/admin/quiz');
    return { success: true };
  } catch (error) {
    console.error('Error deleting quiz question:', error);
    return { error: error instanceof Error ? error.message : 'Failed to delete quiz question' };
  }
}
