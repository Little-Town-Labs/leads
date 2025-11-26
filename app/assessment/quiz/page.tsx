'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { QuizQuestion } from '@/lib/quiz-types';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QuizForm } from '@/components/quiz-form';

export default function DemoQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDemoQuestions() {
      try {
        // Fetch demo questions from API
        const res = await fetch(`/api/assessment/demo-questions`);

        if (!res.ok) {
          throw new Error('Failed to load demo questions');
        }

        const data = await res.json();

        if (data.success) {
          setQuestions(data.questions);
        } else {
          setError('Failed to load demo questions');
        }
      } catch (err) {
        console.error('Error fetching demo questions:', err);
        setError('Failed to load assessment');
      } finally {
        setLoading(false);
      }
    }

    fetchDemoQuestions();
  }, []);

  const handleComplete = async (responses: Record<string, unknown>) => {
    // Submit demo assessment
    try {
      const response = await fetch(`/api/assessment/demo-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit assessment');
      }

      const result = await response.json();

      // Redirect to results page with the lead ID
      router.push(`/assessment/results/${result.leadId}`);
    } catch (err) {
      console.error('Error submitting demo assessment:', err);
      throw err;
    }
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
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/assessment">
            <Button>Back to Assessment</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/assessment" className="text-xl font-bold text-primary">
            ← Lead Agent Demo
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Product Fit Assessment
          </h1>
          <p className="text-lg text-muted-foreground">
            Answer {questions.length} questions to discover if Lead Agent is right for your business.
          </p>
        </div>

        <QuizForm
          questions={questions}
          tenantSlug="demo"
          primaryColor="#3B82F6"
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}
