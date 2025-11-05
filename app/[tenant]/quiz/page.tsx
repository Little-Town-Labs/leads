import { notFound } from 'next/navigation';
import { getTenantBySubdomain, getQuizQuestions } from '@/lib/tenants';
import Link from 'next/link';

/**
 * Tenant Quiz Page
 * Displays tenant-specific assessment quiz
 *
 * TODO: Implement actual quiz form component
 * For now, shows placeholder with quiz questions count
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Assessment Quiz
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Complete this {questions.length}-question assessment to receive personalized insights.
          </p>

          {/* Placeholder - will be replaced with actual quiz component */}
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="space-y-4">
              <p className="text-foreground">
                <strong>Tenant:</strong> {tenant.name}
              </p>
              <p className="text-foreground">
                <strong>Questions Found:</strong> {questions.length}
              </p>
              <p className="text-foreground">
                <strong>Qualification Threshold:</strong> {tenant.settings.qualificationThreshold}%
              </p>
              <p className="text-foreground">
                <strong>AI Research Enabled:</strong>{' '}
                {tenant.settings.enableAiResearch ? 'Yes' : 'No'}
              </p>
            </div>

            <div className="mt-8 p-4 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                🚧 Quiz form component coming in next phase
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                This will display tenant-specific questions and submit responses to the workflow
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
