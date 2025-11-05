import { notFound } from 'next/navigation';
import { getTenantBySubdomain, getQuizQuestions } from '@/lib/tenants';
import Link from 'next/link';
import { QuizFormWrapper } from './quiz-form-wrapper';
import { QuizQuestion } from '@/lib/quiz-types';

/**
 * Tenant Quiz Page
 * Displays tenant-specific assessment quiz with multi-step form
 */
export default async function TenantQuizPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySubdomain(tenantSlug);

  if (!tenant) {
    notFound();
  }

  // Get tenant's quiz questions
  const questions = await getQuizQuestions(tenant.clerkOrgId);

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <header className="border-b border-border bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Link
              href={`/${tenantSlug}`}
              className="text-xl font-bold"
              style={{ color: tenant.branding.primaryColor }}
            >
              ← Back to {tenant.name}
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">No Questions Available</h1>
            <p className="text-lg text-muted-foreground">
              This assessment quiz has not been configured yet. Please contact support.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/${tenantSlug}`}
            className="text-xl font-bold"
            style={{ color: tenant.branding.primaryColor }}
          >
            ← Back to {tenant.name}
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Assessment Quiz</h1>
          <p className="text-lg text-muted-foreground">
            Complete this {questions.length}-question assessment to receive personalized insights
            and recommendations.
          </p>
        </div>

        <QuizFormWrapper
          questions={questions as QuizQuestion[]}
          tenantSlug={tenantSlug}
          primaryColor={tenant.branding.primaryColor}
        />
      </main>
    </div>
  );
}
