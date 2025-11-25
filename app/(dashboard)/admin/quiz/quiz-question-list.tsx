'use client';

import { useState } from 'react';
import { QuizQuestion } from '@/db/schema';
import { Edit, Trash2, GripVertical } from 'lucide-react';
import { deleteQuizQuestion } from './actions';
import { EditQuestionModal } from './edit-question-modal';

type QuizQuestionListProps = {
  questions: QuizQuestion[];
};

export function QuizQuestionList({ questions }: QuizQuestionListProps) {
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, questionText: string) => {
    if (!confirm(`Are you sure you want to delete this question: "${questionText}"?`)) {
      return;
    }

    setIsDeleting(id);
    const result = await deleteQuizQuestion(id);

    if (result.error) {
      alert(result.error);
    }

    setIsDeleting(null);
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      contact_info: 'Contact Info',
      multiple_choice: 'Multiple Choice',
      checkbox: 'Checkbox',
      text: 'Text',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {questions.map((question) => (
            <li key={question.id} className="hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <GripVertical className="w-5 h-5 text-gray-400 mt-1 cursor-move" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Q{question.questionNumber}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {getQuestionTypeLabel(question.questionType)}
                        </span>
                        {question.isRequired && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                        {question.scoringWeight > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Weight: {question.scoringWeight}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {question.questionText}
                      </p>
                      {question.questionSubtext && (
                        <p className="text-sm text-gray-500 mt-1">{question.questionSubtext}</p>
                      )}
                      {question.options && Array.isArray(question.options) ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {question.options.slice(0, 3).map((opt: unknown, idx: number) => {
                            const option = opt as Record<string, unknown>;
                            return (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-600 border border-gray-200"
                            >
                              {String(option.label || option.value)}
                            </span>
                          );
                          })}
                          {question.options.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-50 text-gray-600">
                              +{question.options.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setEditingQuestion(question)}
                      className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                      title="Edit question"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(question.id, question.questionText)}
                      disabled={isDeleting === question.id}
                      className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Delete question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </>
  );
}
