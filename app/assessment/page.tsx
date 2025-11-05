import Link from 'next/link';
import { ArrowRight, CheckCircle, BarChart3, Database, Target, Shield, Clock } from 'lucide-react';

export default function AssessmentLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header/Navigation */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-primary">
              Timeless Technology Solutions
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="https://timelesstechs.com" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </a>
            <a href="https://timelesstechs.com/#services" className="text-muted-foreground hover:text-foreground transition-colors">
              Services
            </a>
            <a href="https://timelesstechs.com/#contact" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Contact Us
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-primary bg-accent/10 rounded-full border border-accent/20">
              <Database className="w-4 h-4" />
              Powered by DDIP: Data-Driven Insights Platform
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Your Help Desk Data Knows Why{' '}
              <span className="text-accent">You're Losing Time & Money</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Transform months of help desk tickets into actionable insights with our{' '}
              <strong className="text-foreground">Data-Driven Insights Platform (DDIP)</strong>.{' '}
              Start with a free 5-minute assessment to discover your improvement potential.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/assessment/quiz"
                className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                Start Your Free Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Takes 4-5 minutes • No credit card required
              </p>
            </div>

            {/* Trust Indicator */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground pt-8 border-t border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-chart-4" />
                <span>Used by healthcare, finance & tech leaders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-chart-4" />
                <span>Source-referenced & audit-validated insights</span>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
              The Problem: Your Data Isn't Ready for AI
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-center max-w-3xl mx-auto">
              You have months (or years) of help desk tickets sitting in ServiceNow, Zendesk, or Jira.
              But that data isn't telling you <strong className="text-foreground">why</strong> issues keep recurring or{' '}
              <strong className="text-foreground">where</strong> to improve first.
            </p>

            {/* Problem Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h3 className="font-bold text-card-foreground mb-2">❌ Same Issues Repeating</h3>
                <p className="text-muted-foreground text-sm">
                  30-40% of tickets are preventable, but you can't identify the root causes without deep analysis.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h3 className="font-bold text-card-foreground mb-2">❌ No Visibility</h3>
                <p className="text-muted-foreground text-sm">
                  Your ticketing system has reports, but they don't reveal cross-departmental patterns or strategic insights.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <h3 className="font-bold text-card-foreground mb-2">❌ Data Silos</h3>
                <p className="text-muted-foreground text-sm">
                  Ticket descriptions, resolutions, and user feedback are unstructured data that's impossible to analyze at scale.
                </p>
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 text-center">
              <p className="text-lg font-medium text-foreground">
                <strong>DDIP solves this:</strong> We transform raw, unstructured help desk data into{' '}
                <span className="text-accent">actionable business intelligence</span> with source-referenced recommendations.
              </p>
            </div>
          </div>
        </section>

        {/* What You'll Discover Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
              What Your Assessment Reveals
            </h2>
            <p className="text-lg text-muted-foreground mb-12 text-center">
              Our 16-question assessment analyzes your help desk readiness and shows you{' '}
              <strong className="text-foreground">what DDIP would discover</strong> in your data.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Discovery 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center border border-chart-1/20">
                    <BarChart3 className="w-6 h-6 text-chart-1" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Hidden Inefficiencies</h3>
                  <p className="text-muted-foreground">
                    DDIP processes both structured (ticket categories, resolution times) and unstructured data
                    (descriptions, notes) to find recurring root causes you're missing.
                  </p>
                </div>
              </div>

              {/* Discovery 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center border border-chart-4/20">
                    <Target className="w-6 h-6 text-chart-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Process Improvements</h3>
                  <p className="text-muted-foreground">
                    Identify which 3-5 recurring issues are costing you the most time and money, with{' '}
                    <strong className="text-foreground">specific, actionable recommendations</strong> for elimination.
                  </p>
                </div>
              </div>

              {/* Discovery 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center border border-chart-3/20">
                    <Database className="w-6 h-6 text-chart-3" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Cross-Departmental Insights</h3>
                  <p className="text-muted-foreground">
                    Help desk tickets reveal broader organizational problems: training gaps, software issues,
                    onboarding weaknesses, and vendor performance problems.
                  </p>
                </div>
              </div>

              {/* Discovery 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center border border-chart-5/20">
                    <Shield className="w-6 h-6 text-chart-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Validated ROI Projections</h3>
                  <p className="text-muted-foreground">
                    Every recommendation includes <strong className="text-foreground">source-referenced validation</strong> from your actual data,
                    plus projected cost savings and efficiency gains.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How DDIP Works Section */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              How the Data-Driven Insights Platform Works
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Data Cleansing & Analysis</h3>
                  <p className="text-muted-foreground">
                    Extract 12-18 months of ticket data from your help desk system (ServiceNow, Zendesk, Jira, etc.).
                    DDIP cleanses, normalizes, and processes both structured fields and unstructured text.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Process Improvement Identification</h3>
                  <p className="text-muted-foreground">
                    AI-powered analysis identifies recurring patterns, root causes, knowledge gaps, and bottlenecks.
                    Every insight is ranked by impact potential (time saved, cost reduction).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Strategic Roadmap & Execution Plans</h3>
                  <p className="text-muted-foreground">
                    Receive a prioritized roadmap: which improvements to tackle first, specific actions to take,
                    and realistic timelines. Plus implementation support if needed.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Source-Reference & Audit Validation</h3>
                  <p className="text-muted-foreground">
                    Unlike generic consulting advice, every DDIP recommendation links back to{' '}
                    <strong className="text-foreground">specific tickets and data points</strong> in your system. Fully auditable and verifiable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof / Results Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              Typical Results from DDIP Analysis
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-chart-4 mb-2">25-35%</div>
                <div className="text-foreground font-medium">Reduction in Ticket Volume</div>
                <p className="text-sm text-muted-foreground mt-2">
                  By eliminating preventable recurring issues at the source
                </p>
              </div>
              <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-chart-1 mb-2">40-50%</div>
                <div className="text-foreground font-medium">Faster Resolution Times</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Through knowledge base improvements and process optimization
                </p>
              </div>
              <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-chart-3 mb-2">3-5x</div>
                <div className="text-foreground font-medium">ROI Within 6 Months</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Cost savings from reduced tickets and improved efficiency
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-primary to-secondary">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Unlock Your Help Desk's Hidden Insights?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Take the 5-minute assessment to see your improvement potential and what DDIP would discover in your data.
            </p>

            <Link
              href="/assessment/quiz"
              className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary bg-primary-foreground rounded-lg hover:bg-primary-foreground/90 transition-all shadow-lg hover:shadow-xl"
            >
              Start Your Free Assessment Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <p className="text-sm text-primary-foreground/70 mt-6">
              ✓ No credit card required  •  ✓ Results in 5 minutes  •  ✓ Personalized to your help desk
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-border">
          <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
            <p>
              Powered by <strong className="text-foreground">Timeless Technology Solutions</strong> •{' '}
              <a href="https://timelesstechs.com" className="text-accent hover:underline">
                timelesstechs.com
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
