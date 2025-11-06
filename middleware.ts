import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { extractSubdomain } from '@/lib/tenants';

/**
 * Combined middleware for:
 * 1. Clerk authentication
 * 2. Multi-tenant subdomain routing
 *
 * Routing behavior:
 * - Main domain (leadagent.com) -> SaaS landing page
 * - Tenant subdomains (lead-agent.leadagent.com) -> Rewrite to /[tenant] routes
 * - Localhost development (tenant.localhost:3000) -> Rewrite to /[tenant] routes
 */
export default clerkMiddleware((auth, request: NextRequest) => {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Skip subdomain routing for static files, auth pages, and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Extract subdomain from hostname
  const subdomain = extractSubdomain(hostname);

  // Main domain (no subdomain) - serve root routes normally
  if (!subdomain) {
    return NextResponse.next();
  }

  // Tenant subdomain detected - rewrite to /[tenant] routes
  // Example: lead-agent.leadagent.com/quiz -> /lead-agent/quiz
  const url = request.nextUrl.clone();
  url.pathname = `/${subdomain}${pathname}`;

  // Add custom header so pages can access tenant info
  const response = NextResponse.rewrite(url);
  response.headers.set('x-tenant-subdomain', subdomain);

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
