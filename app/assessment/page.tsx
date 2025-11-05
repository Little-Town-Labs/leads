/**
 * Legacy /assessment route
 * Redirects to timeless-tech subdomain for backward compatibility
 *
 * Old: leadagent.com/assessment
 * New: timeless-tech.leadagent.com (or timeless-tech.localhost:3000 in dev)
 *
 * Note: Original DDIP landing page content has been migrated to the timeless-tech tenant
 * and is now rendered via app/[tenant]/page.tsx with data from the tenants table.
 */
export default function AssessmentRedirect() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Assessment Has Moved</h1>
        <p className="text-lg text-muted-foreground mb-8">
          The Timeless Technology Solutions assessment is now available at its dedicated subdomain.
        </p>
        <div className="bg-card border border-border rounded-lg p-8">
          <p className="text-sm text-muted-foreground mb-4">
            <strong>Development:</strong> Visit{' '}
            <a href="http://timeless-tech.localhost:3000" className="text-primary hover:underline">
              http://timeless-tech.localhost:3000
            </a>
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Production:</strong> Visit{' '}
            <a href="https://timeless-tech.leadagent.com" className="text-primary hover:underline">
              https://timeless-tech.leadagent.com
            </a>
          </p>
        </div>
        <p className="text-sm text-muted-foreground mt-8">
          Update your bookmark to the new URL for the best experience.
        </p>
      </div>
    </div>
  );
}
