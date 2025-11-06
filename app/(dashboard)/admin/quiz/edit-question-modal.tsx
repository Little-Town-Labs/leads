'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { QuizQuestion } from '@/db/schema';
import { updateQuizQuestion } from './actions';

type EditQuestionModalProps = {
  question: QuizQuestion;
  onClose: () => void;
};

export function EditQuestionModal({ question, onClose }: EditQuestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questionType, setQuestionType] = useState(question.questionType);
  const [options, setOptions] = useState<Array<{ label: string; value: string; score?: number }>>(
    Array.isArray(question.options) ? question.options : []
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Add options as JSON string if needed
    if (['multiple_choice', 'checkbox', 'contact_info'].includes(questionType)) {
      const validOptions = options.filter(opt => opt.label.trim() !== '');
      formData.set('options', JSON.stringify(validOptions));
    }

    const result = await updateQuizQuestion(question.id, formData);

    if (result.error) {
      alert(result.error);
      setIsSubmitting(false);
    } else {
      onClose();
    }
  };

  const addOption = () => {
    setOptions([...options, { label: '', value: '', score: 0 }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'label' | 'value' | 'score', value: string | number) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Quiz Question</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="questionNumber" value={question.questionNumber} />
          <input type="hidden" name="questionType" value={questionType} />

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Question Type</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="contact_info">Contact Info</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="checkbox">Checkbox (Multi-select)</option>
              <option value="text">Text Input</option>
            </select>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Question Text *</label>
            <input
              type="text"
              name="questionText"
              required
              defaultValue={question.questionText}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Subtext */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Subtext (optional)</label>
            <input
              type="text"
              name="questionSubtext"
              defaultValue={question.questionSubtext || ''}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Placeholder */}
          {questionType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Placeholder</label>
              <input
                type="text"
                name="placeholder"
                defaultValue={question.placeholder || ''}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Options */}
          {['multiple_choice', 'checkbox'].includes(questionType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Option label"
                    />
                    <input
                      type="number"
                      value={option.score || 0}
                      onChange={(e) => updateOption(index, 'score', parseInt(e.target.value))}
                      className="w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Score"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </button>
              </div>
            </div>
          )}

          {/* Min Selections */}
          {questionType === 'checkbox' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Selections</label>
              <input
                type="number"
                name="minSelections"
                min="1"
                defaultValue={question.minSelections || 1}
                className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Scoring Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Scoring Weight</label>
            <input
              type="number"
              name="scoringWeight"
              min="0"
              defaultValue={question.scoringWeight}
              className="mt-1 block w-32 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Is Required */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isRequired"
              value="true"
              defaultChecked={question.isRequired}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Required question
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
