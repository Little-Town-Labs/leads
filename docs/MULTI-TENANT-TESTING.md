# Multi-Tenant Testing Guide

## Local Development Setup

### Step 1: Configure Hosts File

Add these entries to your hosts file to test subdomains locally:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux:** `/etc/hosts`

```
127.0.0.1   leadagent.localhost
127.0.0.1   lead-agent.localhost
127.0.0.1   timeless-tech.localhost
```

**How to edit (Windows):**
1. Open Notepad as Administrator
2. File → Open → Navigate to `C:\Windows\System32\drivers\etc\`
3. Change file type filter to "All Files (*.*)"
4. Open `hosts`
5. Add the lines above at the bottom
6. Save and close

### Step 2: Start Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000` (or 3001 if 3000 is in use).

### Step 3: Test URLs

| URL | Expected Result |
|-----|----------------|
| `http://localhost:3000` | Main SaaS landing page (Lead Agent product marketing) |
| `http://leadagent.localhost:3000` | Main SaaS landing page (same as above) |
| `http://lead-agent.localhost:3000` | Lead Agent Demo tenant landing page |
| `http://lead-agent.localhost:3000/quiz` | Lead Agent quiz page (placeholder) |
| `http://timeless-tech.localhost:3000` | Timeless Tech DDIP landing page |
| `http://timeless-tech.localhost:3000/quiz` | Timeless Tech quiz page (placeholder) |
| `http://localhost:3000/assessment` | Migration message to timeless-tech subdomain |
| `http://localhost:3000/dashboard` | Admin dashboard (existing) |

---

## What to Verify

### 1. Main Domain (SaaS Marketing)
✅ Visit `http://localhost:3000`
- Should show the Lead Agent SaaS product landing page
- Navigation links to Features, How It Works, Pricing
- Links to `/assessment` and `/dashboard`
- Blue/green branding

### 2. Lead Agent Tenant
✅ Visit `http://lead-agent.localhost:3000`
- Should show Lead Agent Demo tenant landing page
- **Different from main domain** - this is for prospects testing the product
- Blue branding (#3B82F6)
- Headline: "Stop Wasting 70% of Your Sales Time on Unqualified Leads"
- CTA button links to `/quiz`

✅ Visit `http://lead-agent.localhost:3000/quiz`
- Should show quiz placeholder page
- Shows "Lead Agent Demo" as tenant name
- Shows question count from database

### 3. Timeless Tech Tenant
✅ Visit `http://timeless-tech.localhost:3000`
- Should show Timeless Tech DDIP landing page
- Indigo branding (#6366F1)
- Headline: "Your Help Desk Data Knows Why You're Losing Time & Money"
- CTA button links to `/quiz`

✅ Visit `http://timeless-tech.localhost:3000/quiz`
- Should show quiz placeholder page
- Shows "Timeless Technology Solutions" as tenant name
- Shows question count from database

### 4. Legacy Routes
✅ Visit `http://localhost:3000/assessment`
- Should show migration message
- Links to both localhost and production subdomain URLs

### 5. Middleware & Routing
✅ Check browser DevTools → Network → Headers
- For tenant subdomains, should see `x-tenant-subdomain` header
- URL in browser should stay as subdomain (not rewritten)

---

## Troubleshooting

### "This site can't be reached" for subdomain URLs
- **Problem:** Hosts file not configured or not saved correctly
- **Solution:**
  1. Verify hosts file has the entries
  2. Flush DNS cache (Windows: `ipconfig /flushdns`, Mac: `sudo dscacheutil -flushcache`)
  3. Restart browser

### Subdomain shows 404 "Not Found"
- **Problem:** Middleware or dynamic routes not working
- **Solution:**
  1. Check `middleware.ts` is in root directory
  2. Verify `app/[tenant]/` folder exists
  3. Restart dev server (`pnpm dev`)
  4. Check terminal for errors

### Tenant page shows but wrong content
- **Problem:** Database tenant not seeded correctly
- **Solution:**
  1. Run: `pnpm tsx db/seed-tenants.ts`
  2. Verify tenants exist: Check database or add logging to `getTenantBySubdomain()`

### CSS variables not applying
- **Problem:** Tenant branding not loading
- **Solution:**
  1. Check tenant layout is wrapping the page
  2. Verify tenant.branding object has primaryColor and secondaryColor
  3. Check browser DevTools → Elements → Styles for custom properties

---

## Database Verification

### Check Tenants Table

```sql
SELECT id, subdomain, name, "clerkOrgId" FROM tenants;
```

Expected results:
```
| id                                   | subdomain     | name                              | clerkOrgId                |
|--------------------------------------|---------------|-----------------------------------|---------------------------|
| d90a5dc2-f8cc-471b-aabe-3d7de8a493b1 | lead-agent    | Lead Agent Demo                   | org_lead_agent_demo       |
| bcc39d88-af87-497d-a85a-0586ecc7daa4 | timeless-tech | Timeless Technology Solutions     | org_timeless_tech_solutions|
```

### Check Quiz Questions

```sql
SELECT COUNT(*), "orgId" FROM quiz_questions GROUP BY "orgId";
```

If count is 0, you need to seed quiz questions for each tenant.

---

## Next Steps After Testing

Once local subdomain routing works:

1. **Seed Quiz Questions** - Update quiz seed script to create tenant-specific questions
2. **Build Quiz Form Component** - Replace placeholder with actual quiz UI
3. **Update API Routes** - Make submission endpoints tenant-aware
4. **Deploy to Vercel** - Configure wildcard domains
5. **Test Production** - Verify `lead-agent.leadagent.com` and `timeless-tech.leadagent.com`

---

## Production Deployment Notes

### Vercel Configuration

1. **Add Wildcard Domain**
   - Go to Vercel project settings
   - Add domain: `*.leadagent.com`
   - Vercel will provide DNS records

2. **DNS Setup** (in your DNS provider)
   ```
   A     leadagent.com          → Vercel IP
   CNAME *.leadagent.com        → cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Vercel automatically provisions wildcard SSL
   - Wait 5-10 minutes for propagation

### Environment Variables
Make sure these are set in Vercel:
- `DATABASE_URL` - Neon database connection string
- `CLERK_SECRET_KEY` - Clerk authentication
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway
- `EXA_API_KEY` - Exa search API

---

## Success Criteria

✅ All URLs above work correctly
✅ Each tenant shows unique branding (colors, logo, copy)
✅ Middleware adds `x-tenant-subdomain` header
✅ No 404 errors on tenant routes
✅ Main domain still works for SaaS landing page
✅ Dashboard and other admin routes unaffected

Once these work, Phase 2 (Routing) is complete!
