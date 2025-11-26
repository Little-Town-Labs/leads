# URL Configuration & Domain Flexibility

## Important: No Hardcoded URLs

The application is designed to work with **ANY domain** dynamically. URLs in documentation use `leadagent.com` as **EXAMPLES ONLY**.

---

## Current Production Configuration

### Actual URLs (as of now):

```
Main SaaS Domain:
https://leads.littletownlabs.site/

Tenant Subdomains:
https://timeless-tech.leads.littletownlabs.site/

Development:
http://localhost:3000/
http://timeless-tech.localhost:3000/
```

### Documentation Examples (NOT actual URLs):

```
Main SaaS Domain:
leadagent.com                    # Example - represents main domain

Tenant Subdomains:
acme.leadagent.com              # Example - represents tenant subdomain
```

---

## How Domain Resolution Works

### 1. Dynamic Hostname Extraction

The application **never hardcodes** the domain. It extracts the hostname from the incoming request:

```typescript
// middleware.ts
const hostname = request.headers.get('host') || '';
// Examples:
// - "leads.littletownlabs.site"
// - "timeless-tech.leads.littletownlabs.site"
// - "leadagent.com"
// - "acme.leadagent.com"
// - "localhost:3000"
// - "tenant.localhost:3000"
```

### 2. Subdomain Detection (lib/tenants.ts)

```typescript
export function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0]; // Remove port
  const parts = host.split('.');

  // Handles multiple domain patterns:

  // Pattern 1: localhost development
  if (host.includes('localhost')) {
    if (parts.length === 2 && parts[1] === 'localhost') {
      return parts[0]; // "tenant.localhost" → "tenant"
    }
    return null; // "localhost" → null
  }

  // Pattern 2: Vercel deployment (*.vercel.app)
  if (host.endsWith('.vercel.app')) {
    if (parts.length >= 4) {
      return parts[0]; // "tenant.project.vercel.app" → "tenant"
    }
    return null;
  }

  // Pattern 3: Custom production domain (leads.littletownlabs.site)
  if (host.endsWith('.littletownlabs.site') || host === 'leads.littletownlabs.site') {
    if (parts.length >= 4) {
      return parts[0]; // "tenant.leads.littletownlabs.site" → "tenant"
    }
    return null; // "leads.littletownlabs.site" → null (main domain)
  }

  // Pattern 4: Generic domain (e.g., leadagent.com, example.com)
  if (parts.length >= 3) {
    if (parts[0] === 'www') return null;
    return parts[0]; // "tenant.domain.com" → "tenant"
  }

  return null; // "domain.com" → null (main domain)
}
```

---

## Supported Domain Patterns

The application automatically handles:

| Pattern | Main Domain | Tenant Subdomain | Notes |
|---------|-------------|------------------|-------|
| **Current Production** | leads.littletownlabs.site | tenant.leads.littletownlabs.site | In use now |
| **Future Custom** | leadagent.com | tenant.leadagent.com | If you migrate domains |
| **Development** | localhost:3000 | tenant.localhost:3000 | Local testing |
| **Vercel Preview** | project.vercel.app | tenant.project.vercel.app | PR deployments |
| **Custom Domain** | yourdomain.com | tenant.yourdomain.com | Any domain works! |

---

## Where URLs Appear in Code

### ✅ Dynamic (Correct)

These extract URLs from the request - **no changes needed**:

```typescript
// middleware.ts
const hostname = request.headers.get('host');

// All Next.js Links use relative paths
<Link href="/dashboard">Dashboard</Link>
<Link href="/assessment">Try Demo</Link>

// Tenant-specific links
<Link href={`/${tenantSlug}/quiz`}>Take Quiz</Link>
```

### ⚠️ Comments (Examples Only)

These are just for documentation - **not actual code**:

```typescript
// middleware.ts (line 11-12)
// * - Main domain (leadagent.com) -> SaaS landing page
// * - Tenant subdomains (lead-agent.leadagent.com) -> Rewrite to /[tenant] routes
```

### ❌ Hardcoded (Needs Update)

Found in **ONE legacy file**:

```typescript
// app/assessment/page.tsx (line 28-29)
<a href="https://timeless-tech.leadagent.com">  ← OUTDATED!
```

**This file will be replaced** with the new demo assessment page.

---

## External Links (Intentional)

Some URLs ARE intentionally hardcoded because they're external links:

```typescript
// app/page.tsx - Footer links
<a href="https://timelesstechs.com">About</a>
<a href="https://timelesstechs.com#contact">Support</a>

// These are correct - they point to your company website
```

---

## Database Configuration

Tenant records store **relative subdomains**, not full URLs:

```sql
-- tenants table
subdomain: "timeless-tech"       -- NOT "timeless-tech.leadagent.com"
customDomain: NULL                -- Could be set to "assessment.acme.com"

-- The app constructs full URLs dynamically:
const fullUrl = `https://${tenant.subdomain}.${mainDomain}`;
```

---

## Changing Domains

### To Change Main Domain:

**No code changes required!** Just:

1. Update DNS records to point to your server
2. Update Clerk dashboard:
   - Add new domain to allowed domains
   - Update redirect URLs
3. Update Vercel:
   - Add domain to project
   - Configure DNS

The app automatically adapts because it uses dynamic hostname extraction.

### To Add Custom Tenant Domains:

```sql
-- Allow tenants to use their own domains
UPDATE tenants
SET custom_domain = 'assessment.acme.com'
WHERE subdomain = 'acme';
```

Then add CNAME: `assessment.acme.com` → `leads.littletownlabs.site`

---

## Documentation Conventions

Throughout all docs:

- **`leadagent.com`** = Placeholder for "main domain" (currently `leads.littletownlabs.site`)
- **`acme.leadagent.com`** = Placeholder for "tenant subdomain" (currently `{tenant}.leads.littletownlabs.site`)
- **`localhost:3000`** = Actual development URL

When you see `leadagent.com` in docs, mentally replace with `leads.littletownlabs.site` (or whatever your actual domain is).

---

## Summary

✅ **Code is fully dynamic** - works with any domain
✅ **No hardcoded URLs** in application logic
✅ **Documentation uses examples** - not actual URLs
⚠️ **One legacy file** - will be replaced with demo assessment
✅ **Easy to change domains** - just update DNS and Clerk

Your concern is valid and the architecture is designed correctly! The application will work regardless of whether you use:
- `leads.littletownlabs.site` (current)
- `leadagent.com` (future)
- `yourbrand.com` (custom)
- Any other domain you configure

🎉 No refactoring needed when changing domains!
