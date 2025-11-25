'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { QuizQuestion } from '@/lib/quiz-types';

/**
 * Quiz Form Component
 * Multi-step form that renders tenant-specific quiz questions
 * Handles contact info, multiple choice, checkbox, and text questions
 */

type QuizFormProps = {
  questions: QuizQuestion[];
  tenantSlug: string;
  primaryColor: string;
  onComplete: (responses: Record<string, unknown>) => Promise<void>;
};

export function QuizForm({ questions, primaryColor, onComplete }: QuizFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleNext = () => {
    // Validate current question
    if (!validateCurrentQuestion()) {
      toast.error('Please answer this question to continue');
      return;
    }

    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion.isRequired) return true;

    const answer = responses[currentQuestion.id] as Record<string, unknown> | undefined;

    if (currentQuestion.questionType === 'contact_info') {
      // Check all required fields
      const requiredFields = (currentQuestion.options as unknown[] || [])?.filter((opt) => (opt as Record<string, unknown>).required) || [];
      return requiredFields.every((field) => {
        const typedField = field as Record<string, unknown>;
        const fieldName = typedField.name as string || '';
        const value = answer?.[fieldName];
        return value && String(value).trim() !== '';
      });
    }

    if (currentQuestion.questionType === 'checkbox') {
      const minSelections = currentQuestion.minSelections || 1;
      return Array.isArray(answer) && answer.length >= minSelections;
    }

    return typeof answer === 'string' && answer !== undefined && answer !== null && answer !== '';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onComplete(responses);
      toast.success('Quiz submitted successfully!');
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateResponse = (questionId: string, value: unknown) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const renderQuestion = () => {
    switch (currentQuestion.questionType) {
      case 'contact_info':
        return (
          <div className="space-y-4">
            {(currentQuestion.options as unknown[] | undefined)?.map((field) => {
              const typedField = field as Record<string, unknown>;
              const fieldName = typedField.name as string;
              return (
              <div key={fieldName} className="space-y-2">
                <Label htmlFor={fieldName}>
                  {typedField.label ? String(typedField.label) : 'Field'}
                  {Boolean(typedField.required) && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Input
                  id={fieldName}
                  name={fieldName}
                  type={fieldName === 'email' ? 'email' : fieldName === 'phone' ? 'tel' : 'text'}
                  placeholder={String(typedField.label)}
                  value={(responses[currentQuestion.id] as Record<string, unknown> | undefined)?.[fieldName] as string || ''}
                  onChange={(e) => {
                    const contactInfo = (responses[currentQuestion.id] as Record<string, unknown>) || {};
                    updateResponse(currentQuestion.id, {
                      ...contactInfo,
                      [fieldName]: e.target.value,
                    });
                  }}
                  required={typedField.required as boolean}
                />
              </div>
              );
            })}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {(currentQuestion.options as unknown[] | undefined)?.map((option) => {
              const typedOption = option as Record<string, unknown>;
              const optionValue = typedOption.value as string;
              return (
              <button
                key={optionValue}
                type="button"
                onClick={() => updateResponse(currentQuestion.id, optionValue)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-opacity-60 ${
                  responses[currentQuestion.id] === optionValue
                    ? 'border-current bg-current bg-opacity-5'
                    : 'border-border hover:bg-muted'
                }`}
                style={
                  responses[currentQuestion.id] === optionValue
                    ? { borderColor: primaryColor, color: primaryColor }
                    : {}
                }
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{String(typedOption.label)}</span>
                  {responses[currentQuestion.id] === optionValue && (
                    <Check className="w-5 h-5" style={{ color: primaryColor }} />
                  )}
                </div>
              </button>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-3">
            {currentQuestion.questionSubtext && (
              <p className="text-sm text-muted-foreground mb-4">{currentQuestion.questionSubtext}</p>
            )}
            {(currentQuestion.options as unknown[] | undefined)?.map((option) => {
              const typedOption = option as Record<string, unknown>;
              const optionValue = typedOption.value as string;
              const selected = Array.isArray(responses[currentQuestion.id])
                ? (responses[currentQuestion.id] as unknown[]).includes(optionValue)
                : false;

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => {
                    const current = (responses[currentQuestion.id] as unknown[]) || [];
                    const newValue = selected
                      ? current.filter((v: unknown) => v !== optionValue)
                      : [...current, optionValue];
                    updateResponse(currentQuestion.id, newValue);
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-opacity-60 ${
                    selected
                      ? 'border-current bg-current bg-opacity-5'
                      : 'border-border hover:bg-muted'
                  }`}
                  style={selected ? { borderColor: primaryColor, color: primaryColor } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{String(typedOption.label)}</span>
                    {selected && <Check className="w-5 h-5" style={{ color: primaryColor }} />}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            {currentQuestion.questionSubtext && (
              <p className="text-sm text-muted-foreground">{currentQuestion.questionSubtext}</p>
            )}
            <Input
              type="text"
              placeholder={currentQuestion.placeholder || 'Type your answer...'}
              value={(responses[currentQuestion.id] as string) || ''}
              onChange={(e) => updateResponse(currentQuestion.id, e.target.value)}
              className="text-base"
            />
          </div>
        );

      default:
        return <p>Unknown question type</p>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Question {currentStep + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: primaryColor }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-card border border-border rounded-lg p-8 mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {currentQuestion.questionText}
        </h2>
        {currentQuestion.questionSubtext && currentQuestion.questionType !== 'checkbox' && (
          <p className="text-muted-foreground mb-6">{currentQuestion.questionSubtext}</p>
        )}

        <div className="mt-6">{renderQuestion()}</div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Button
          type="button"
          onClick={handleNext}
          disabled={isSubmitting}
          className="gap-2 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {isLastQuestion ? (
            <>
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
