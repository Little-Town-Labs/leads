'use client';

import { QuizForm } from '@/components/quiz-form';
import { useRouter } from 'next/navigation';
import { QuizQuestion } from '@/lib/quiz-types';

type QuizFormWrapperProps = {
  questions: QuizQuestion[];
  tenantSlug: string;
  primaryColor: string;
};

export function QuizFormWrapper({ questions, tenantSlug, primaryColor }: QuizFormWrapperProps) {
  const router = useRouter();

  const handleComplete = async (responses: Record<string, unknown>) => {
    // Submit quiz responses to the API
    const response = await fetch(`/api/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantSlug,
        responses,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit quiz');
    }

    const result = await response.json();

    // Redirect to results page with the lead ID
    router.push(`/${tenantSlug}/quiz/results?leadId=${result.leadId}`);
  };

  return (
    <QuizForm
      questions={questions}
      tenantSlug={tenantSlug}
      primaryColor={primaryColor}
      onComplete={handleComplete}
    />
  );
}
