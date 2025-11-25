'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Loader2, TrendingUp, Target, Calendar, Mail } from 'lucide-react';
import Link from 'next/link';

interface AssessmentResult {
  lead: {
    id: string;
    name: string;
    email: string;
    company: string | null;
  };
  score: {
    readinessScore: number;
    tier: 'cold' | 'warm' | 'hot' | 'qualified';
    tierDescription: string;
    totalPoints: number;
    maxPossiblePoints: number;
    breakdown: {
      contactInfo: number;
      currentState: number;
      goals: number;
      readiness: number;
    };
  };
  responsesCount: number;
}

export default function ResultsPage() {
  const params = useParams();
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leadId = params.leadId as string;

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/assessment/results/${leadId}`);
        const data = await res.json();

        if (data.success) {
          setResult(data);
        } else {
          setError(data.error || 'Failed to load results');
        }
      } catch {
        setError('Failed to load assessment results');
      } finally {
        setLoading(false);
      }
    }

    if (leadId) {
      fetchResults();
    }
  }, [leadId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error || 'Results not found'}</p>
          <Link
            href="/assessment"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Return to Assessment
          </Link>
        </div>
      </div>
    );
  }

  const { lead, score } = result;
  const tierConfig = getTierConfig(score.tier, score.readinessScore);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="text-xl font-bold text-primary">
            Timeless Technology Solutions
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-chart-4/10 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-chart-4" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Assessment Complete!
            </h1>
            <p className="text-lg text-muted-foreground">
              Thank you, {lead.name}. Here are your results.
            </p>
          </div>

          {/* Score Card */}
          <div className={`bg-card border-2 rounded-lg shadow-lg p-8 mb-8 ${tierConfig.borderColor}`}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Score Circle */}
              <div className="flex-shrink-0">
                <div className="relative w-40 h-40">
                  <svg className="transform -rotate-90 w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-muted"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - score.readinessScore / 100)}`}
                      className={tierConfig.scoreColor}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-foreground">{score.readinessScore}%</div>
                      <div className="text-sm text-muted-foreground">Ready</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier Info */}
              <div className="flex-1 text-center md:text-left">
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-3 ${tierConfig.badgeClass}`}>
                  {tierConfig.label}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {tierConfig.title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {tierConfig.description}
                </p>
                <div className="text-sm text-muted-foreground">
                  Based on {result.responsesCount} questions • Score: {score.totalPoints} / {score.maxPossiblePoints} points
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4">Score Breakdown</h3>
            <div className="space-y-4">
              <ScoreBar
                label="Company & Industry"
                value={score.breakdown.contactInfo}
                maxValue={60}
                color="chart-1"
              />
              <ScoreBar
                label="Current Help Desk State"
                value={score.breakdown.currentState}
                maxValue={200}
                color="chart-2"
              />
              <ScoreBar
                label="Goals & Strategic Fit"
                value={score.breakdown.goals}
                maxValue={150}
                color="chart-3"
              />
              <ScoreBar
                label="Readiness Indicators"
                value={score.breakdown.readiness}
                maxValue={289}
                color="chart-4"
              />
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              What Happens Next
            </h3>
            <div className="space-y-4">
              {tierConfig.nextSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className={`rounded-lg p-8 text-center ${tierConfig.ctaBackground}`}>
            <h3 className="text-2xl font-bold text-foreground mb-3">
              {tierConfig.ctaTitle}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {tierConfig.ctaDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {tierConfig.primaryCta && (
                <a
                  href={tierConfig.primaryCta.link}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                >
                  {tierConfig.primaryCta.icon}
                  {tierConfig.primaryCta.text}
                </a>
              )}
              {tierConfig.secondaryCta && (
                <a
                  href={tierConfig.secondaryCta.link}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 text-lg font-semibold text-foreground bg-card border-2 border-border rounded-lg hover:bg-muted transition-all"
                >
                  {tierConfig.secondaryCta.icon}
                  {tierConfig.secondaryCta.text}
                </a>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Questions? Contact us at{' '}
              <a href="https://timelesstechs.com/#contact" className="text-accent hover:underline">
                timelesstechs.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">
          {value} / {maxValue} pts
        </span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full bg-${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function getTierConfig(tier: string, _score: number) {
  switch (tier) {
    case 'qualified':
      return {
        label: 'QUALIFIED LEAD',
        title: 'High Priority - Ready to Buy',
        description:
          'Your help desk shows strong readiness for DDIP analysis. We\'re preparing a personalized proposal based on your specific needs.',
        borderColor: 'border-chart-4',
        scoreColor: 'text-chart-4',
        badgeClass: 'bg-chart-4/10 text-chart-4',
        ctaBackground: 'bg-chart-4/10 border border-chart-4/20',
        ctaTitle: 'Let\'s Get Started',
        ctaDescription:
          'Our team will reach out within 24 hours to discuss your DDIP implementation and share sample insights from similar help desks.',
        primaryCta: {
          text: 'Schedule Strategy Call',
          link: 'https://timelesstechs.com/#contact',
          icon: <Calendar className="w-5 h-5" />,
        },
        secondaryCta: {
          text: 'Email Us',
          link: 'mailto:contact@timelesstechs.com',
          icon: <Mail className="w-5 h-5" />,
        },
        nextSteps: [
          {
            title: 'Personalized Analysis (24-48 hours)',
            description:
              'Our AI is researching your company and help desk environment to create a customized DDIP proposal.',
          },
          {
            title: 'Strategy Call',
            description:
              'We\'ll show you sample insights from similar help desks and discuss your specific improvement opportunities.',
          },
          {
            title: 'DDIP Implementation',
            description:
              'If it\'s a fit, we\'ll start analyzing your help desk data and deliver actionable recommendations within 2-3 weeks.',
          },
        ],
      };

    case 'hot':
      return {
        label: 'HOT LEAD',
        title: 'Strong Fit - Near-Term Opportunity',
        description:
          'Your help desk has significant improvement potential. We\'re preparing personalized insights to show what DDIP could discover.',
        borderColor: 'border-chart-5',
        scoreColor: 'text-chart-5',
        badgeClass: 'bg-chart-5/10 text-chart-5',
        ctaBackground: 'bg-chart-5/10 border border-chart-5/20',
        ctaTitle: 'Discover Your Improvement Potential',
        ctaDescription:
          'We\'ll contact you soon with sample insights showing what DDIP would uncover in your help desk data.',
        primaryCta: {
          text: 'Book a Call',
          link: 'https://timelesstechs.com/#contact',
          icon: <Calendar className="w-5 h-5" />,
        },
        secondaryCta: {
          text: 'Learn More About DDIP',
          link: 'https://timelesstechs.com',
          icon: <Target className="w-5 h-5" />,
        },
        nextSteps: [
          {
            title: 'Personalized Insights (2-3 days)',
            description:
              'We\'ll research your help desk environment and share examples of what DDIP typically discovers in similar organizations.',
          },
          {
            title: 'Review Sample Analysis',
            description:
              'See a sample DDIP report showing potential improvements, cost savings, and root cause identification.',
          },
          {
            title: 'Optional Strategy Call',
            description:
              'If interested, we\'ll discuss implementing DDIP for your help desk.',
          },
        ],
      };

    case 'warm':
      return {
        label: 'WARM LEAD',
        title: 'Potential Fit - Mid-Term Nurture',
        description:
          'Your help desk could benefit from DDIP, but timing or readiness may need development. Let\'s stay in touch.',
        borderColor: 'border-chart-2',
        scoreColor: 'text-chart-2',
        badgeClass: 'bg-chart-2/10 text-chart-2',
        ctaBackground: 'bg-chart-2/10 border border-chart-2/20',
        ctaTitle: 'Stay Connected',
        ctaDescription:
          'We\'ll send you helpful resources about help desk optimization and case studies showing DDIP results.',
        primaryCta: {
          text: 'Get Free Resources',
          link: 'https://timelesstechs.com/#contact',
          icon: <Mail className="w-5 h-5" />,
        },
        secondaryCta: {
          text: 'Retake Assessment',
          link: '/assessment/quiz',
          icon: <ArrowRight className="w-5 h-5" />,
        },
        nextSteps: [
          {
            title: 'Receive Educational Content',
            description:
              'We\'ll email case studies and guides about help desk process improvement and data-driven insights.',
          },
          {
            title: 'Join Our Workshop (Optional)',
            description:
              'Get invited to webinars showing live DDIP demonstrations and help desk optimization strategies.',
          },
          {
            title: 'Retake When Ready',
            description:
              'As your help desk matures or budget/timeline aligns, retake the assessment to explore DDIP implementation.',
          },
        ],
      };

    case 'cold':
    default:
      return {
        label: 'EARLY STAGE',
        title: 'Early Stage - Long-Term Nurture',
        description:
          'DDIP works best with established help desks and clear improvement goals. Let\'s stay in touch as your needs evolve.',
        borderColor: 'border-muted',
        scoreColor: 'text-muted-foreground',
        badgeClass: 'bg-muted text-muted-foreground',
        ctaBackground: 'bg-muted/30 border border-muted',
        ctaTitle: 'Build Your Foundation',
        ctaDescription:
          'We\'ll share resources to help you establish help desk best practices and prepare for data-driven optimization.',
        primaryCta: {
          text: 'Get Help Desk Resources',
          link: 'https://timelesstechs.com/#contact',
          icon: <Mail className="w-5 h-5" />,
        },
        secondaryCta: null,
        nextSteps: [
          {
            title: 'Foundational Resources',
            description:
              'Receive guides on help desk setup, ticketing best practices, and metrics to track.',
          },
          {
            title: 'Build Your Data History',
            description:
              'Focus on collecting 12-18 months of ticket data - this is essential for DDIP to deliver value.',
          },
          {
            title: 'Reconnect in 6-12 Months',
            description:
              'Once your help desk is established and you have data history, retake the assessment to explore DDIP.',
          },
        ],
      };
  }
}
