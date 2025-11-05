import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTenantBySubdomain } from '@/lib/tenants';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Tenant Landing Page
 * Dynamically rendered based on tenant configuration
 *
 * Examples:
 * - lead-agent.leadagent.com -> Lead Agent Demo landing page
 * - timeless-tech.leadagent.com -> Timeless Tech DDIP landing page
 */
export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: tenantSlug } = await params;
  const tenant = await getTenantBySubdomain(tenantSlug);

  if (!tenant) {
    notFound();
  }

  const { landingPage, branding, name } = tenant;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header/Navigation */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {branding.logoUrl && (
              <img
                src={branding.logoUrl}
                alt={`${name} logo`}
                className="h-8 w-auto"
              />
            )}
            <div
              className="text-xl font-bold"
              style={{ color: branding.primaryColor }}
            >
              {name}
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
            <Link
              href={`/${tenantSlug}/quiz`}
              className="px-4 py-2 rounded-md hover:opacity-90 transition-colors text-white"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              {landingPage.heroTitle}
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              {landingPage.heroSubtitle}
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href={`/${tenantSlug}/quiz`}
                className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {landingPage.ctaText}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground pt-8 border-t border-border">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" style={{ color: branding.primaryColor }} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" style={{ color: branding.primaryColor }} />
                <span>Takes 4-5 minutes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        {landingPage.featureSections && landingPage.featureSections.length > 0 && (
          <section id="features" className="container mx-auto px-4 py-16 bg-muted/30">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
                What You'll Discover
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                {landingPage.featureSections.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center border"
                        style={{
                          backgroundColor: `${branding.primaryColor}10`,
                          borderColor: `${branding.primaryColor}20`,
                        }}
                      >
                        {/* Icon placeholder - you can map icon names to actual icons */}
                        <span
                          className="text-2xl"
                          style={{ color: branding.primaryColor }}
                        >
                          {feature.icon?.[0] || '✓'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <div
            className="max-w-3xl mx-auto text-center rounded-2xl p-12"
            style={{
              background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})`,
            }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Take the assessment to see your personalized results and recommendations.
            </p>

            <Link
              href={`/${tenantSlug}/quiz`}
              className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold bg-white rounded-lg hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl"
              style={{ color: branding.primaryColor }}
            >
              {landingPage.ctaText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <p className="text-sm text-white/80 mt-6">
              ✓ No credit card required  •  ✓ Results in 5 minutes  •  ✓ Personalized insights
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-border">
          <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
            <p>
              Powered by <strong className="text-foreground">{name}</strong>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
