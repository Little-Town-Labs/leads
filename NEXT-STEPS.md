# Next Steps - Multi-Tenant Lead Agent

## Current Status ✅

**Completed:**
- ✅ Database schema with `tenants` table
- ✅ 2 tenants seeded (lead-agent, timeless-tech)
- ✅ Subdomain routing middleware
- ✅ Dynamic `[tenant]` routes with branding
- ✅ Tenant helper functions
- ✅ Main SaaS landing page preserved
- ✅ Development server running

**Ready to Test:**
You can now test subdomain routing locally! See [MULTI-TENANT-TESTING.md](MULTI-TENANT-TESTING.md) for instructions.

---

## Immediate Next Steps

### Step 1: Test Subdomain Routing (5 minutes)

**Setup hosts file:**
1. Open Notepad as Administrator
2. Edit `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines:
   ```
   127.0.0.1   leadagent.localhost
   127.0.0.1   lead-agent.localhost
   127.0.0.1   timeless-tech.localhost
   ```
4. Save and close

**Test URLs:**
```bash
# Main SaaS site
http://localhost:3000                    → Should show Lead Agent SaaS marketing

# Lead Agent demo tenant
http://lead-agent.localhost:3000         → Should show blue branding, different content

# Timeless Tech tenant
http://timeless-tech.localhost:3000      → Should show indigo branding, DDIP content
```

**What to verify:**
- Each URL loads without errors
- Branding colors are different (blue vs indigo)
- Headlines are different
- CTA buttons link to `/quiz`

---

### Step 2: Understand the Architecture (10 minutes)

Read these files to understand how it works:

1. **[middleware.ts](middleware.ts)** - How subdomains are detected and routed
2. **[lib/tenants.ts](lib/tenants.ts)** - Helper functions for tenant operations
3. **[app/[tenant]/page.tsx](app/[tenant]/page.tsx)** - How landing pages are rendered
4. **[db/schema.ts](db/schema.ts#L7-L80)** - Tenant table structure

**Key concepts:**
- Middleware extracts subdomain from URL
- Rewrites to `/[tenant]` routes
- Pages fetch tenant data from database
- CSS variables apply tenant branding

---

### Step 3: Decide on Quiz Implementation (Discussion needed)

**Question:** Do you want to:

**Option A:** Use existing quiz questions from `db/seed-quiz.ts`
- Already has 16 questions for Timeless Tech (DDIP)
- Need to create different questions for Lead Agent tenant
- Faster to implement

**Option B:** Create completely new quiz structure for both tenants
- More flexibility
- Can customize question types per tenant
- Takes longer

**Recommendation:** Option A - Use existing questions for Timeless Tech, create new ones for Lead Agent.

---

## Phase 3: Quiz Implementation (Next)

Once you decide on the quiz approach, here's what needs to be built:

### Task 1: Seed Quiz Questions for Both Tenants

**File to create:** `db/seed-quiz-multi-tenant.ts`

**Lead Agent Questions (15):**
1. Contact info (email, name, company)
2. Company size
3. Role/title
4. Sales team size
5. Current CRM
6. Lead volume per month
7. Sales cycle length
8. Biggest sales challenge
9. Budget range
10. Decision timeline
11. Research time per lead
12. Lead quality issues
13. Current qualification process
14. Interested in AI automation?
15. Preferred demo format

**Timeless Tech Questions:**
- Use existing 16 DDIP questions from `db/seed-quiz.ts`
- Update `orgId` to match `timeless-tech` tenant

### Task 2: Build Quiz Form Component

**File to create:** `components/tenant/quiz-form.tsx`

**Features needed:**
- Multi-step form (contact info → questions → submit)
- Progress indicator
- Form validation with Zod
- Tenant branding applied
- Submit to tenant-aware API

### Task 3: Create Tenant-Aware API Route

**File to update:** `app/api/submit/route.ts`

**Changes needed:**
```typescript
// Extract tenant from request headers
const tenantSubdomain = request.headers.get('x-tenant-subdomain');
const tenant = await getTenantBySubdomain(tenantSubdomain);

// Store lead with tenant's orgId
await db.insert(leads).values({
  orgId: tenant.clerkOrgId,
  // ... other fields
});

// Check tenant usage limits
if (!checkUsageLimit(tenant, 'quiz')) {
  return Response.json({ error: 'Usage limit reached' }, { status: 429 });
}

// Increment usage
await incrementUsage(tenant.id, 'quiz');

// Trigger workflow with tenant settings
if (leadScore >= tenant.settings.qualificationThreshold) {
  // Run AI research
}
```

### Task 4: Update Results Page

**File to create:** `app/[tenant]/results/[leadId]/page.tsx`

**Features:**
- Show readiness score
- Show tier (cold/warm/hot/qualified)
- Tenant-branded UI
- Next steps based on tier
- Optional: Calendar booking link

---

## Phase 4: Workflow Integration (After Quiz)

### Update Workflow to Be Tenant-Aware

**Files to modify:**
- `workflows/inbound/index.ts`
- `workflows/inbound/steps.ts`
- `lib/services.ts`

**Changes:**
```typescript
// Pass tenant settings to workflow
const workflow = await start(workflowInbound, [{
  leadId,
  tenantId: tenant.id,
  settings: tenant.settings,
}]);

// In workflow steps:
- Use tenant.settings.qualificationThreshold
- Use tenant.settings.emailFromName
- Apply tenant-specific email templates
```

---

## Phase 5: Admin Dashboard Updates (Future)

### Multi-Tenant Dashboard Features

1. **Tenant Switcher**
   - Dropdown to switch between organizations (for multi-org users)
   - Filter all views by selected tenant

2. **Tenant-Specific Analytics**
   - Usage metrics (quizzes, workflows, limits)
   - Lead breakdown by tier
   - Conversion rates

3. **Tenant Settings Page**
   - Edit branding (colors, logo)
   - Manage quiz questions
   - Configure email templates
   - Team member management

---

## Production Deployment (Later)

### Vercel Setup

1. **Domain Configuration**
   - Add `leadagent.com` to Vercel project
   - Add `*.leadagent.com` as wildcard domain

2. **DNS Setup**
   ```
   A     leadagent.com          → Vercel IP (76.76.21.21)
   CNAME *.leadagent.com        → cname.vercel-dns.com
   ```

3. **SSL Certificates**
   - Vercel auto-provisions wildcard SSL
   - Wait 5-10 minutes for propagation

4. **Test Production URLs**
   ```
   https://leadagent.com
   https://lead-agent.leadagent.com
   https://timeless-tech.leadagent.com
   ```

### Custom Domains (Future Tenants)

For tenants wanting `leads.acme.com`:

1. Tenant adds CNAME: `leads.acme.com` → `acme.leadagent.com`
2. Admin adds custom domain to tenant record in database
3. Middleware checks custom domain → maps to tenant
4. Vercel auto-provisions SSL for custom domain

---

## Questions to Answer

Before proceeding with Phase 3, please confirm:

1. **Quiz Questions:** Use existing for Timeless Tech + create new for Lead Agent?
2. **Quiz Length:** 15-16 questions for both tenants?
3. **Scoring:** Same algorithm (0-100%) or tenant-specific?
4. **Qualification Threshold:** 60% for both or configurable?
5. **Results Page:** Show score immediately or after email verification?

---

## Commands Reference

```bash
# Development
pnpm dev                              # Start dev server
pnpm build                            # Build for production
pnpm start                            # Start production server

# Database
pnpm db:generate                      # Generate migration
pnpm db:push                          # Push schema to database
pnpm db:studio                        # Open Drizzle Studio
pnpm tsx db/seed-tenants.ts           # Seed tenants
pnpm tsx db/seed-quiz.ts              # Seed quiz questions (existing)

# Testing
# After updating hosts file:
# Visit http://lead-agent.localhost:3000
# Visit http://timeless-tech.localhost:3000
```

---

## Documentation

- [PROPOSAL.md](PROPOSAL.md) - Business case and product vision
- [CLAUDE.md](CLAUDE.md) - Development guidelines
- [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md) - What was built
- [MULTI-TENANT-TESTING.md](MULTI-TENANT-TESTING.md) - Testing instructions
- **[NEXT-STEPS.md](NEXT-STEPS.md)** ← You are here

---

## Ready to Proceed?

**Current server status:** ✅ Running on http://localhost:3000

**Try it now:**
1. Update your hosts file (instructions above)
2. Visit `http://lead-agent.localhost:3000`
3. Visit `http://timeless-tech.localhost:3000`
4. Compare the branding and content

**Then let me know:**
- Do the subdomains work?
- Should I proceed with Phase 3 (Quiz)?
- Any questions about the architecture?

🚀 **You're ready to test the multi-tenant routing!**
