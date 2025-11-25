'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import type { QuizQuestion } from '@/db/schema';

interface QuizResponse {
  questionId: string;
  questionNumber: number;
  answer: unknown;
  pointsEarned: number;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Map<number, QuizResponse>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quiz questions on mount
  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch('/api/assessment/questions');
        const data = await res.json();

        if (data.success) {
          setQuestions(data.questions);
          // Load saved responses from localStorage
          const saved = localStorage.getItem('quiz_responses');
          if (saved) {
            const savedResponses: Map<number, QuizResponse> = new Map(JSON.parse(saved));
            setResponses(savedResponses);

            // Find last answered question
            const lastAnswered = Math.max(...Array.from(savedResponses.keys()), 0) as number;
            setCurrentQuestionIndex(Math.min(lastAnswered + 1, data.questions.length - 1));
          }
        } else {
          setError('Failed to load quiz questions');
        }
      } catch {
        setError('Failed to load quiz. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  // Auto-save responses to localStorage
  useEffect(() => {
    if (responses.size > 0) {
      localStorage.setItem('quiz_responses', JSON.stringify(Array.from(responses.entries())));
    }
  }, [responses]);

  // Load saved answer when question changes
  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion) {
      const savedResponse = responses.get(currentQuestion.questionNumber);
      setCurrentAnswer(savedResponse?.answer || null);
    }
  }, [currentQuestionIndex, questions, responses]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Calculate points for current answer
  const calculatePoints = (answer: unknown): number => {
    if (!currentQuestion || !answer) return 0;

    const options = currentQuestion.options as unknown[];
    const scoringWeight = currentQuestion.scoringWeight || 1;

    if (currentQuestion.questionType === 'multiple_choice') {
      const selectedOption = (options as Record<string, unknown>[])?.find((opt) => opt.value === answer);
      return (selectedOption?.score as number || 0) * scoringWeight;
    } else if (currentQuestion.questionType === 'checkbox') {
      if (!Array.isArray(answer)) return 0;
      const totalScore = answer.reduce((sum, value) => {
        const option = (options as Record<string, unknown>[])?.find((opt) => opt.value === value);
        return sum + (option?.score as number || 0);
      }, 0);
      return totalScore * scoringWeight;
    } else if (currentQuestion.questionType === 'contact_info') {
      return 0; // Contact info doesn't contribute to score
    } else if (currentQuestion.questionType === 'text') {
      return 0; // Text answers don't contribute to score
    }

    return 0;
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    // Validate answer
    if (currentQuestion.isRequired && !isAnswerValid()) {
      alert('Please answer this question before continuing.');
      return;
    }

    // Save response
    const pointsEarned = calculatePoints(currentAnswer);
    responses.set(currentQuestion.questionNumber, {
      questionId: currentQuestion.id,
      questionNumber: currentQuestion.questionNumber,
      answer: currentAnswer,
      pointsEarned,
    });
    setResponses(new Map(responses));

    // Move to next question or submit
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const res = await fetch('/api/assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: Array.from(responses.values()),
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Clear saved responses
        localStorage.removeItem('quiz_responses');
        // Redirect to results page
        router.push(`/assessment/results/${data.leadId}`);
      } else {
        setError('Failed to submit assessment. Please try again.');
        setSubmitting(false);
      }
    } catch {
      setError('Failed to submit assessment. Please try again.');
      setSubmitting(false);
    }
  };

  const isAnswerValid = (): boolean => {
    if (!currentAnswer) return false;

    if (currentQuestion.questionType === 'contact_info') {
      const fields = currentQuestion.options as unknown[];
      return (fields as Record<string, unknown>[]).every((field) => {
        if (!(field as Record<string, unknown>).required) return true;
        const answer = currentAnswer as Record<string, unknown>;
        const fieldName = (field as Record<string, unknown>).name as string;
        return answer[fieldName] && String(answer[fieldName]).trim() !== '';
      });
    } else if (currentQuestion.questionType === 'checkbox') {
      const minSelections = currentQuestion.minSelections || 0;
      return Array.isArray(currentAnswer) && currentAnswer.length >= minSelections;
    } else if (currentQuestion.questionType === 'text') {
      return typeof currentAnswer === 'string' && currentAnswer.trim() !== '';
    } else if (currentQuestion.questionType === 'multiple_choice') {
      return typeof currentAnswer === 'string' && currentAnswer.trim() !== '';
    }

    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="text-xl font-bold text-primary">
            Help Desk Health Assessment
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 md:p-8 mb-6">
            {/* Question Text */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {currentQuestion.questionText}
              </h2>
              {currentQuestion.questionSubtext && (
                <p className="text-sm text-muted-foreground">
                  {currentQuestion.questionSubtext}
                </p>
              )}
            </div>

            {/* Question Input */}
            <div className="space-y-4">
              {currentQuestion.questionType === 'contact_info' && (
                <ContactInfoQuestion
                  question={currentQuestion}
                  value={(currentAnswer as Record<string, string>) || {}}
                  onChange={(val) => setCurrentAnswer(val)}
                />
              )}

              {currentQuestion.questionType === 'multiple_choice' && (
                <MultipleChoiceQuestion
                  question={currentQuestion}
                  value={(currentAnswer as string) || ''}
                  onChange={(val) => setCurrentAnswer(val)}
                />
              )}

              {currentQuestion.questionType === 'checkbox' && (
                <CheckboxQuestion
                  question={currentQuestion}
                  value={(currentAnswer as string[]) || []}
                  onChange={(val) => setCurrentAnswer(val)}
                />
              )}

              {currentQuestion.questionType === 'text' && (
                <TextQuestion
                  question={currentQuestion}
                  value={(currentAnswer as string) || ''}
                  onChange={(val) => setCurrentAnswer(val)}
                />
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={submitting || !isAnswerValid()}
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : isLastQuestion ? (
                <>
                  Complete Assessment
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Completion Indicators */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`w-3 h-3 rounded-full transition-colors ${
                  responses.has(q.questionNumber)
                    ? 'bg-primary'
                    : index === currentQuestionIndex
                    ? 'bg-accent'
                    : 'bg-muted'
                }`}
                title={`Question ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// Question Components

function ContactInfoQuestion({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  const fields = question.options as unknown[];

  const handleFieldChange = (fieldName: string, fieldValue: string) => {
    onChange({ ...value, [fieldName]: fieldValue });
  };

  return (
    <div className="space-y-4">
      {(fields as Record<string, unknown>[]).map((field) => {
        const typedField = field as Record<string, unknown>;
        const fieldName = typedField.name as string;
        return (
        <div key={fieldName}>
          <label className="block text-sm font-medium text-foreground mb-2">
            {typedField.label ? String(typedField.label) : 'Field'}
            {Boolean(typedField.required) && <span className="text-destructive ml-1">*</span>}
          </label>
          <input
            type={fieldName === 'email' ? 'email' : fieldName === 'phone' ? 'tel' : 'text'}
            value={value[fieldName] || ''}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            required={typedField.required as boolean}
          />
        </div>
        );
      })}
    </div>
  );
}

function MultipleChoiceQuestion({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  const options = question.options as unknown[];

  return (
    <div className="space-y-3">
      {(options as Record<string, unknown>[]).map((option) => {
        const typedOption = option as Record<string, unknown>;
        const optionValue = typedOption.value as string;
        return (
        <label
          key={optionValue}
          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            value === optionValue
              ? 'border-primary bg-accent/10'
              : 'border-border hover:border-accent'
          }`}
        >
          <input
            type="radio"
            name={`question-${question.id}`}
            value={optionValue}
            checked={value === optionValue}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-4 h-4 text-primary focus:ring-primary"
          />
          <span className="flex-1 text-foreground">{String(typedOption.label)}</span>
        </label>
        );
      })}
    </div>
  );
}

function CheckboxQuestion({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const options = question.options as unknown[];

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-3">
      {(options as Record<string, unknown>[]).map((option) => {
        const typedOption = option as Record<string, unknown>;
        const optionValue = typedOption.value as string;
        return (
        <label
          key={optionValue}
          className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
            value.includes(optionValue)
              ? 'border-primary bg-accent/10'
              : 'border-border hover:border-accent'
          }`}
        >
          <input
            type="checkbox"
            value={optionValue}
            checked={value.includes(optionValue)}
            onChange={() => handleToggle(optionValue)}
            className="mt-1 w-4 h-4 text-primary rounded focus:ring-primary"
          />
          <span className="flex-1 text-foreground">{String(typedOption.label)}</span>
        </label>
        );
      })}
    </div>
  );
}

function TextQuestion({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder || ''}
      rows={4}
      className="w-full px-4 py-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
    />
  );
}
