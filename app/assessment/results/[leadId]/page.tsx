import { notFound } from 'next/navigation';
import { db } from '@/db';
import { leads, leadScores } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Mail, TrendingUp, Target } from 'lucide-react';

export default async function DemoResultsPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;

  // Fetch lead and score
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);

  if (!lead || lead.orgId !== 'org_demo_leadagent') {
    notFound();
  }

  const [score] = await db.select().from(leadScores).where(eq(leadScores.leadId, leadId)).limit(1);

  if (!score) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Processing your results...</p>
      </div>
    );
  }

  const fitScore = score.readinessScore;
  const tierConfig = getFitTierConfig(fitScore);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold">Lead Agent</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
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
              Thank you, {lead.name}. Here's your Product Fit analysis.
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
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - fitScore / 100)}`}
                      className={tierConfig.scoreColor}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-foreground">{fitScore}%</div>
                      <div className="text-sm text-muted-foreground">Fit Score</div>
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
                  Based on your responses • Score: {score.totalPoints} / {score.maxPossiblePoints} points
                </div>
              </div>
            </div>
          </div>

          {/* ROI Calculation */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Potential ROI
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Time Saved</p>
                <p className="text-2xl font-bold text-chart-4">60 hrs/mo</p>
              </div>
              <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Monthly Cost</p>
                <p className="text-2xl font-bold text-chart-1">$599</p>
              </div>
              <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">Break-Even</p>
                <p className="text-2xl font-bold text-chart-3">1 lead/mo</p>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              What Your Customers Will Experience
            </h3>
            <p className="text-muted-foreground mb-4">
              This is what you just went through. Your customers will get the same smart,
              branded experience customized for YOUR business.
            </p>
            {/* Add preview mockups here in future iterations */}
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
                <Link href={tierConfig.primaryCta.link}>
                  <Button size="lg" className="w-full sm:w-auto">
                    {tierConfig.primaryCta.icon}
                    {tierConfig.primaryCta.text}
                  </Button>
                </Link>
              )}
              {tierConfig.secondaryCta && (
                <Link href={tierConfig.secondaryCta.link}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    {tierConfig.secondaryCta.icon}
                    {tierConfig.secondaryCta.text}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getFitTierConfig(score: number) {
  if (score >= 70) {
    return {
      label: 'GREAT FIT',
      title: 'Lead Agent is Perfect for You!',
      description: 'Based on your responses, you have the volume, team size, and pain points where Lead Agent delivers maximum value.',
      borderColor: 'border-chart-4',
      scoreColor: 'text-chart-4',
      badgeClass: 'bg-chart-4/10 text-chart-4',
      ctaBackground: 'bg-chart-4/10 border border-chart-4/20',
      ctaTitle: "Let's Get Started",
      ctaDescription: 'Start your free trial today and see results within 24 hours.',
      primaryCta: {
        text: 'Start Free Trial',
        link: '/sign-up',
        icon: <CheckCircle className="w-5 h-5 mr-2" />,
      },
      secondaryCta: {
        text: 'Schedule Demo',
        link: 'https://calendly.com/your-link',
        icon: <Calendar className="w-5 h-5 mr-2" />,
      },
    };
  } else if (score >= 40) {
    return {
      label: 'GOOD FIT',
      title: 'Lead Agent Could Help',
      description: 'You have some good indicators. Let us discuss how Lead Agent can address your specific needs.',
      borderColor: 'border-chart-2',
      scoreColor: 'text-chart-2',
      badgeClass: 'bg-chart-2/10 text-chart-2',
      ctaBackground: 'bg-chart-2/10 border border-chart-2/20',
      ctaTitle: 'Learn More About Lead Agent',
      ctaDescription: 'Schedule a demo to see if we can solve your specific challenges.',
      primaryCta: {
        text: 'Schedule Demo',
        link: 'https://calendly.com/your-link',
        icon: <Calendar className="w-5 h-5 mr-2" />,
      },
      secondaryCta: {
        text: 'See Pricing',
        link: '/#pricing',
        icon: <TrendingUp className="w-5 h-5 mr-2" />,
      },
    };
  } else {
    return {
      label: 'EARLY STAGE',
      title: 'Build Your Foundation First',
      description: 'Lead Agent works best with established lead flow. We will send resources to help you get there.',
      borderColor: 'border-muted',
      scoreColor: 'text-muted-foreground',
      badgeClass: 'bg-muted text-muted-foreground',
      ctaBackground: 'bg-muted/30 border border-muted',
      ctaTitle: 'Stay in Touch',
      ctaDescription: 'Get free resources to grow your lead volume and qualification process.',
      primaryCta: {
        text: 'Get Free Resources',
        link: 'https://calendly.com/your-link',
        icon: <Mail className="w-5 h-5 mr-2" />,
      },
      secondaryCta: null,
    };
  }
}
