import Link from 'next/link';
import { Bot, Workflow, ArrowRight, CheckCircle, Users, Sparkles, Target, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Bot className="w-6 h-6" />
              <Workflow className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">Lead Agent</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>

            {/* Only show Dashboard link to signed-in users */}
            <SignedIn>
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* Show Sign In button to non-authenticated users */}
            <SignedOut>
              <SignInButton
                mode="redirect"
                redirectUrl="/dashboard"
                signInFallbackRedirectUrl="/dashboard"
              >
                <Button variant="outline" size="sm">Sign In</Button>
              </SignInButton>
            </SignedOut>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4" />
              AI-Powered Lead Qualification
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Stop Wasting{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-1">
                70% of Your Sales Time
              </span>
              {' '}on Unqualified Leads
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
              AI-powered lead qualification that researches, scores, and personalizes outreach—automatically.
              Turn website visitors into qualified sales conversations in minutes, not hours.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/assessment"
                className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
              >
                Try Demo Assessment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-foreground bg-white border-2 border-border rounded-lg hover:bg-slate-50 transition-all"
              >
                View Dashboard
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground pt-8 border-t border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-chart-4" />
                <span>20-40% conversion vs. 5-15% for simple forms</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-chart-4" />
                <span>Qualify leads in seconds, not hours</span>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
              The Problem Every B2B Business Faces
            </h2>
            <p className="text-lg text-muted-foreground mb-12 text-center max-w-3xl mx-auto">
              Sales teams waste <strong className="text-foreground">60-70% of their time</strong> on leads that will never buy.
              Manual research is slow, generic outreach gets ignored, and you have no visibility into lead quality until it's too late.
            </p>

            {/* Problem Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="text-3xl mb-3">❌</div>
                <h3 className="font-bold text-card-foreground mb-2">No Pre-Qualification</h3>
                <p className="text-muted-foreground text-sm">
                  Sales teams spend hours researching and qualifying leads manually, only to discover 70% aren't a good fit.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="text-3xl mb-3">❌</div>
                <h3 className="font-bold text-card-foreground mb-2">Manual Research is Slow</h3>
                <p className="text-muted-foreground text-sm">
                  LinkedIn stalking, company research, and personalization takes 30-60 minutes per lead. Inconsistent and unsustainable.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="text-3xl mb-3">❌</div>
                <h3 className="font-bold text-card-foreground mb-2">Generic Outreach Fails</h3>
                <p className="text-muted-foreground text-sm">
                  Templates get ignored. Personalized outreach converts 3x better, but doesn't scale without automation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                The Complete Lead Qualification System
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Everything you need to transform website visitors into qualified, researched, personalized sales opportunities—automatically.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center border border-chart-1/20">
                    <Target className="w-6 h-6 text-chart-1" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Smart Assessment Quiz</h3>
                  <p className="text-muted-foreground">
                    15-question assessment captures contact info + calculates readiness score (0-100%).
                    Converts 20-40% vs. 5-15% for simple forms. Only qualified leads (60%+) trigger AI research.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center border border-chart-4/20">
                    <Bot className="w-6 h-6 text-chart-4" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">AI Research Engine</h3>
                  <p className="text-muted-foreground">
                    Autonomous AI agent researches company data, LinkedIn profiles, tech stack, recent news, and funding status.
                    Produces comprehensive research report in minutes, not hours.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center border border-chart-3/20">
                    <Sparkles className="w-6 h-6 text-chart-3" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Personalized Outreach</h3>
                  <p className="text-muted-foreground">
                    AI writes personalized emails that reference specific quiz answers and research findings.
                    Custom value proposition for each lead. 3x higher response rates than templates.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center border border-chart-5/20">
                    <Users className="w-6 h-6 text-chart-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Built-in Approval Dashboard</h3>
                  <p className="text-muted-foreground">
                    Review queue with lead scores, quiz responses, research reports, and editable email drafts.
                    Approve/reject/revise with one click. No external tools required.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Automated Nurture</h3>
                  <p className="text-muted-foreground">
                    Cold/warm leads enter email sequences automatically. Content tailored to their tier.
                    When score improves, AI workflow triggers for re-qualification.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center border border-chart-2/20">
                    <Shield className="w-6 h-6 text-chart-2" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Multi-Tenant & Multi-User</h3>
                  <p className="text-muted-foreground">
                    Complete data isolation, role-based access control, team collaboration, lead assignment,
                    and activity tracking. Each organization gets branded subdomain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              How Lead Agent Works
            </h2>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Visitor Takes Assessment</h3>
                  <p className="text-muted-foreground">
                    15-question quiz captures contact info and calculates readiness score (0-100%).
                    Questions reveal skills, goals, obstacles, timeline, and budget signals. 70%+ completion rate.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">AI Research (60%+ Qualified Only)</h3>
                  <p className="text-muted-foreground">
                    For qualified leads, AI agent researches: company data, LinkedIn profiles, tech stack analysis,
                    recent news, funding status. Cold/warm leads enter nurture sequences instead.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">AI Generates Personalized Email</h3>
                  <p className="text-muted-foreground">
                    Combines quiz responses + research findings to write personalized email.
                    References specific answers ("You mentioned struggling with X...") and insights ("I saw your company just raised Series A...").
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-6 items-start bg-card p-6 rounded-lg shadow-sm border border-border">
                <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Human Review & Approval</h3>
                  <p className="text-muted-foreground">
                    Review in built-in dashboard: lead score, quiz responses, research summary, editable email draft.
                    Approve/reject/revise with one click. Approved emails send automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              What You Get with Lead Agent
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-chart-4 mb-2">10x</div>
                <div className="text-foreground font-medium mb-2">Higher Lead Capture Rate</div>
                <p className="text-sm text-muted-foreground">
                  Assessment converts 20-40% vs. 5-15% for simple contact forms
                </p>
              </div>
              <div className="bg-chart-1/10 border border-chart-1/20 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-chart-1 mb-2">95%</div>
                <div className="text-foreground font-medium mb-2">Time Saved on Research</div>
                <p className="text-sm text-muted-foreground">
                  AI research in minutes vs. 30-60 minutes of manual work per lead
                </p>
              </div>
              <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-chart-3 mb-2">3x</div>
                <div className="text-foreground font-medium mb-2">Better Response Rates</div>
                <p className="text-sm text-muted-foreground">
                  Personalized emails referencing quiz + research vs. generic templates
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground mb-12 text-center">
              Choose the plan that fits your team size and lead volume
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter */}
              <div className="bg-card border-2 border-border rounded-lg p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-foreground mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$299</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">500 quiz completions/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">100 AI research workflows/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">3 team members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Built-in approval dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Email nurture sequences</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom branding (subdomain)</span>
                  </li>
                </ul>
                <Link href="/sign-up">
                  <Button variant="outline" className="w-full">Get Started</Button>
                </Link>
              </div>

              {/* Professional */}
              <div className="bg-card border-2 border-primary rounded-lg p-8 shadow-lg relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Professional</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$599</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">2,000 quiz completions/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">500 AI research workflows/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">10 team members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Slack & ClickUp integrations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Advanced email automation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Custom domain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">A/B testing</span>
                  </li>
                </ul>
                <Link href="/sign-up">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-card border-2 border-border rounded-lg p-8 shadow-sm">
                <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">$999</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited quiz completions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">2,000 AI workflows/month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Unlimited team members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All integrations + webhooks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">White-label (remove branding)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">API access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-chart-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated success manager</span>
                  </li>
                </ul>
                <a href="mailto:sales@leadagent.com">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary to-chart-1 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Stop Wasting Time on Bad Leads?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8">
              Try our assessment demo to see how Lead Agent qualifies and researches leads automatically.
            </p>

            <Link
              href="/assessment"
              className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary bg-white rounded-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl"
            >
              Try the Demo Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <p className="text-sm text-primary-foreground/80 mt-6">
              ✓ No credit card required  •  ✓ See results in 5 minutes  •  ✓ Full demo walkthrough
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-5 h-5 text-primary" />
                  <span className="font-bold">Lead Agent</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI-powered lead qualification that saves your sales team time and increases conversion rates.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                  <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                  <li><Link href="/assessment" className="hover:text-foreground transition-colors">Demo</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="https://timelesstechs.com" className="hover:text-foreground transition-colors">About</a></li>
                  <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
                  <li><Link href="/assessment" className="hover:text-foreground transition-colors">DDIP Assessment</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="https://timelesstechs.com" className="hover:text-foreground transition-colors">Documentation</a></li>
                  <li><a href="https://timelesstechs.com#contact" className="hover:text-foreground transition-colors">Support</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
              <p>
                Powered by <strong className="text-foreground">Timeless Technology Solutions</strong> •{' '}
                <a href="https://timelesstechs.com" className="text-primary hover:underline">
                  timelesstechs.com
                </a>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
