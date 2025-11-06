import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { quizQuestions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { QuizQuestionList } from './quiz-question-list';
import { AddQuestionButton } from './add-question-button';
import { Plus } from 'lucide-react';

export default async function QuizBuilderPage() {
  const { orgId } = await auth();

  if (!orgId) {
    return <div>No organization found</div>;
  }

  // Fetch existing quiz questions for this organization
  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.orgId, orgId))
    .orderBy(quizQuestions.questionNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Question Builder</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage assessment quiz questions for your leads
          </p>
        </div>
        <AddQuestionButton nextQuestionNumber={questions.length + 1} />
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <Plus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first quiz question
          </p>
          <div className="mt-6">
            <AddQuestionButton nextQuestionNumber={1} />
          </div>
        </div>
      ) : (
        <QuizQuestionList questions={questions} />
      )}

      {/* Helper Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Question Types</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Contact Info:</strong> Collects name, email, company, etc.</li>
          <li><strong>Multiple Choice:</strong> Single selection from options</li>
          <li><strong>Checkbox:</strong> Multiple selections allowed</li>
          <li><strong>Text:</strong> Open-ended text response</li>
        </ul>
      </div>
    </div>
  );
}
