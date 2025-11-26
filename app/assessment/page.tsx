import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Target, Bot, Sparkles, Users } from 'lucide-react';

export default function DemoAssessmentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">Lead Agent</Link>
          <Link href="/sign-in">
            <Button variant="outline" size="sm">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Try Lead Agent Yourself
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Experience AI-Powered Lead Qualification{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-1">
              Firsthand
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Take our 5-minute assessment to see how Lead Agent works.
            We'll analyze YOUR business and show you exactly what your customers would experience.
          </p>

          {/* CTA Button */}
          <Link href="/assessment/quiz">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Assessment
              <Target className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground pt-8 mt-8 border-t border-border">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-chart-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-chart-4" />
              <span>Takes only 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-chart-4" />
              <span>Instant personalized results</span>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll See Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            What You'll Experience
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center border border-chart-1/20">
                  <Target className="w-6 h-6 text-chart-1" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Smart Assessment</h3>
                <p className="text-muted-foreground">
                  Answer 10 questions about your business. See how we calculate lead readiness scores.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center border border-chart-4/20">
                  <Bot className="w-6 h-6 text-chart-4" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Product Fit Analysis</h3>
                <p className="text-muted-foreground">
                  Get your personalized Product Fit Score and see if Lead Agent is right for you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center border border-chart-3/20">
                  <Sparkles className="w-6 h-6 text-chart-3" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">ROI Calculator</h3>
                <p className="text-muted-foreground">
                  See time saved, cost analysis, and break-even calculations based on YOUR inputs.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center border border-chart-5/20">
                  <Users className="w-6 h-6 text-chart-5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Preview Your Experience</h3>
                <p className="text-muted-foreground">
                  See mockups of what YOUR customers will experience with your branded assessments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary to-chart-1 rounded-2xl p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to See If Lead Agent Is Right for You?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Takes 5 minutes. Get instant, personalized results.
          </p>

          <Link href="/assessment/quiz">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Assessment Now
              <Target className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="text-sm text-primary-foreground/80 mt-6">
            ✓ No credit card  •  ✓ Instant results  •  ✓ See the platform in action
          </p>
        </div>
      </section>
    </div>
  );
}
