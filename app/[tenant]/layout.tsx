import { notFound } from 'next/navigation';
import { getTenantBySubdomain } from '@/lib/tenants';

/**
 * Tenant Layout
 * Wraps all tenant pages with tenant-specific branding
 * Validates that the tenant exists
 */
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  // In Next.js 16, params is async
  const { tenant: tenantSlug } = await params;

  // Fetch tenant configuration
  const tenant = await getTenantBySubdomain(tenantSlug);

  // 404 if tenant doesn't exist
  if (!tenant) {
    notFound();
  }

  // Apply tenant branding via CSS variables
  return (
    <div
      style={
        {
          '--primary-color': tenant.branding.primaryColor,
          '--secondary-color': tenant.branding.secondaryColor,
          '--font-family': tenant.branding.fontFamily || 'Inter',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
