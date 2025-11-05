import { notFound } from 'next/navigation';
import { getTenantBySubdomain } from '@/lib/tenants';
import Link from 'next/link';
import { db } from '@/db';
import { leads, leadScores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CheckCircle, TrendingUp, Calendar, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Quiz Results Page
 * Displays the readiness score and next steps after quiz completion
 */
export default async function QuizResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const { leadId } = await searchParams;

  const tenant = await getTenantBySubdomain(tenantSlug);

  if (!tenant) {
    notFound();
  }

  if (!leadId) {
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Results Not Found</h1>
            <p className="text-lg text-muted-foreground mb-8">
              We couldn't find your quiz results. Please try taking the quiz again.
            </p>
            <Link href={`/${tenantSlug}/quiz`}>
              <Button style={{ backgroundColor: tenant.branding.primaryColor }} className="text-white">
                Take Quiz
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Fetch lead and score data
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

  if (!lead || lead.orgId !== tenant.clerkOrgId) {
    notFound();
  }

  const [score] = await db.select().from(leadScores).where(eq(leadScores.leadId, leadId)).limit(1);

  if (!score) {
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
            <h1 className="text-4xl font-bold text-foreground mb-4">Processing Your Results</h1>
            <p className="text-lg text-muted-foreground">
              Your quiz is being scored. Please check back in a moment.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Determine messaging based on tier
  const getTierMessage = () => {
    switch (score.tier) {
      case 'qualified':
        return {
          title: "You're a Perfect Fit!",
          description: 'Based on your responses, our solution aligns excellently with your needs.',
          badge: 'Highly Qualified',
          badgeColor: '#10B981', // Green
        };
      case 'hot':
        return {
          title: "You're on the Right Track!",
          description: "You'd benefit significantly from our solution. Let's explore how we can help.",
          badge: 'Strong Fit',
          badgeColor: '#F59E0B', // Amber
        };
      case 'warm':
        return {
          title: 'Potential Opportunity',
          description: 'There are some areas where we might be able to help you improve.',
          badge: 'Good Potential',
          badgeColor: '#3B82F6', // Blue
        };
      case 'cold':
        return {
          title: 'Thanks for Your Interest',
          description: 'Based on your current situation, you may want to explore our resources first.',
          badge: 'Early Stage',
          badgeColor: '#6B7280', // Gray
        };
      default:
        return {
          title: 'Assessment Complete',
          description: 'Thank you for completing our assessment.',
          badge: 'Complete',
          badgeColor: '#6B7280',
        };
    }
  };

  const tierInfo = getTierMessage();

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
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${tenant.branding.primaryColor}20` }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: tenant.branding.primaryColor }} />
            </div>
            <div
              className="inline-block px-4 py-1 rounded-full text-sm font-semibold text-white mb-4"
              style={{ backgroundColor: tierInfo.badgeColor }}
            >
              {tierInfo.badge}
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{tierInfo.title}</h1>
            <p className="text-lg text-muted-foreground">{tierInfo.description}</p>
          </div>

          {/* Score Card */}
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <div className="text-center">
              <div className="mb-6">
                <div
                  className="text-6xl font-bold mb-2"
                  style={{ color: tenant.branding.primaryColor }}
                >
                  {score.readinessScore}%
                </div>
                <p className="text-lg font-medium text-muted-foreground">Readiness Score</p>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Points Earned</p>
                  <p className="text-2xl font-bold text-foreground">{score.totalPoints}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Maximum Possible</p>
                  <p className="text-2xl font-bold text-foreground">{score.maxPossiblePoints}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" style={{ color: tenant.branding.primaryColor }} />
              What Happens Next?
            </h2>

            <div className="space-y-4">
              {score.tier === 'qualified' || score.tier === 'hot' ? (
                <>
                  <div className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tenant.branding.primaryColor}20` }}
                    >
                      <Calendar
                        className="w-5 h-5"
                        style={{ color: tenant.branding.primaryColor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        We'll Review Your Responses
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our team will analyze your answers to better understand your specific needs
                        and challenges.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tenant.branding.primaryColor}20` }}
                    >
                      <Mail className="w-5 h-5" style={{ color: tenant.branding.primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Personalized Recommendations
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        You'll receive a customized email with insights and recommendations tailored
                        to your situation within 24 hours.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tenant.branding.primaryColor}20` }}
                    >
                      <CheckCircle
                        className="w-5 h-5"
                        style={{ color: tenant.branding.primaryColor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Next Steps</h3>
                      <p className="text-sm text-muted-foreground">
                        Our team may reach out to schedule a brief call to discuss how we can best
                        support your goals.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tenant.branding.primaryColor}20` }}
                    >
                      <Mail className="w-5 h-5" style={{ color: tenant.branding.primaryColor }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Check Your Email</h3>
                      <p className="text-sm text-muted-foreground">
                        We'll send you personalized resources and information to help you get
                        started.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${tenant.branding.primaryColor}20` }}
                    >
                      <TrendingUp
                        className="w-5 h-5"
                        style={{ color: tenant.branding.primaryColor }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Explore Resources</h3>
                      <p className="text-sm text-muted-foreground">
                        Take some time to explore our knowledge base and resources to learn more
                        about our solution.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link href={`/${tenantSlug}`}>
              <Button
                size="lg"
                style={{ backgroundColor: tenant.branding.primaryColor }}
                className="text-white"
              >
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
