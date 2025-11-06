'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { QuestionFormModal } from './question-form-modal';

type AddQuestionButtonProps = {
  nextQuestionNumber: number;
};

export function AddQuestionButton({ nextQuestionNumber }: AddQuestionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Question
      </button>

      {isOpen && (
        <QuestionFormModal
          questionNumber={nextQuestionNumber}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
