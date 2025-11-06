# Deploying Lead Agent to Vercel

This guide walks you through deploying your multi-tenant Lead Agent application to Vercel.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- ✅ Neon database set up and running
- ✅ Clerk account with organizations enabled
- ✅ Vercel AI Gateway API key
- ✅ Exa API key
- ✅ (Optional) Slack workspace and bot configured

---

## 🚀 Step 1: Push to GitHub

1. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Multi-tenant lead agent"
   ```

2. **Create GitHub repository:**
   - Go to [github.com/new](https://github.com/new)
   - Create a new repository (e.g., `lead-agent`)
   - **Do NOT initialize with README** (you already have one)

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/lead-agent.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com) and sign in**

2. **Click "Add New..." → "Project"**

3. **Import your GitHub repository**
   - Click "Import" next to your `lead-agent` repository
   - If you don't see it, click "Adjust GitHub App Permissions"

4. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave default)
   - **Build Command:** `pnpm build` (auto-detected)
   - **Install Command:** `pnpm install` (auto-detected)

5. **Add Environment Variables** (see below)

6. **Click "Deploy"**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 🔐 Step 3: Configure Environment Variables

In the Vercel dashboard, go to **Settings → Environment Variables** and add:

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://your_neon_connection_string

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...  # Set up webhooks first (see below)

# AI Services
AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key
EXA_API_KEY=your_exa_api_key
```

### Optional Variables (Slack Integration)

```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=C...
```

**Important Notes:**
- Use **production** Clerk keys (pk_live_... and sk_live_...), not test keys
- Make sure to set variables for **Production**, **Preview**, and **Development** environments
- Click "Save" after adding each variable

---

## 🪝 Step 4: Configure Clerk Webhooks

Clerk webhooks keep your database in sync with organization events.

1. **Get your Vercel deployment URL:**
   - After deployment, copy your production URL (e.g., `https://lead-agent.vercel.app`)

2. **Configure webhook in Clerk:**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Navigate to **Webhooks** → **Add Endpoint**

3. **Webhook Configuration:**
   - **Endpoint URL:** `https://your-domain.vercel.app/api/webhooks/clerk`
   - **Subscribe to events:**
     - ✅ `organization.created`
     - ✅ `organization.updated`
     - ✅ `organization.deleted`
     - ✅ `organizationMembership.created`
     - ✅ `organizationMembership.deleted`
     - ✅ `organizationMembership.updated`

4. **Copy the Signing Secret:**
   - After creating the webhook, copy the **Signing Secret** (starts with `whsec_`)
   - Add it to Vercel environment variables as `CLERK_WEBHOOK_SECRET`

5. **Redeploy:**
   ```bash
   # In Vercel dashboard
   Deployments → Latest → Redeploy
   ```

---

## 🔗 Step 5: Update Clerk Domain Settings

1. **Go to Clerk Dashboard → Domains**

2. **Add your Vercel domain:**
   - Add `your-domain.vercel.app` to the allowed domains
   - Or add your custom domain if you've configured one

3. **Update redirect URLs:**
   - Go to **Paths** section
   - Ensure these paths are correct:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in redirect: `/dashboard`
     - After sign-up redirect: `/dashboard`

---

## 📊 Step 6: Verify Database Migrations

Your database should already have tables from local development, but if deploying fresh:

1. **Run migrations locally first:**
   ```bash
   pnpm db:migrate
   ```

2. **Verify in Drizzle Studio:**
   ```bash
   pnpm db:studio
   ```

3. **Check tables exist:**
   - ✅ `leads` table
   - ✅ `workflows` table

---

## ✅ Step 7: Test Your Deployment

1. **Visit your Vercel URL:** `https://your-domain.vercel.app`

2. **Test the flow:**
   - ✅ Sign up with a new account
   - ✅ Create an organization
   - ✅ Submit a test lead via the form
   - ✅ Check dashboard shows the lead
   - ✅ Approve/reject the lead
   - ✅ Verify Slack notification (if configured)

3. **Test permissions:**
   - ✅ Invite a team member with different role
   - ✅ Verify they see appropriate UI based on permissions

---

## 🎨 Step 8: Add Custom Domain (Optional)

1. **In Vercel Dashboard:**
   - Go to **Settings → Domains**
   - Add your custom domain (e.g., `leads.yourcompany.com`)

2. **Update DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Wait for DNS propagation (usually 5-30 minutes)

3. **Update Clerk:**
   - Add custom domain to Clerk's allowed domains
   - Update webhook URL to use custom domain

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Module not found"**
- Ensure all dependencies are in `dependencies`, not `devDependencies`
- Clerk, Drizzle, Next.js should be in `dependencies`

**Error: "Type errors"**
- Run `pnpm build` locally first to catch TypeScript errors
- Fix all type errors before deploying

### Runtime Errors

**Error: "DATABASE_URL is not defined"**
- Verify environment variable is set in Vercel
- Redeploy after adding variables

**Error: "Clerk is not initialized"**
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Use `pk_live_...` for production, not `pk_test_...`

**Error: "No organization context"**
- User needs to create/join an organization
- Ensure organization mode is enabled in Clerk

### Webhook Issues

**Webhooks not firing:**
- Verify webhook URL is correct: `https://yourdomain.com/api/webhooks/clerk`
- Check webhook logs in Clerk dashboard
- Ensure `CLERK_WEBHOOK_SECRET` matches Clerk

---

## 🎯 Post-Deployment Setup

### 1. Monitor Usage

- **Vercel Analytics:** Enable in project settings
- **Clerk User Management:** Monitor sign-ups
- **Neon Database:** Monitor connection usage

### 2. Set Up Monitoring

Consider adding:
- **Sentry** for error tracking
- **LogDrain** for centralized logs
- **Vercel Speed Insights** for performance

### 3. Configure Slack (if not done)

Follow [Slack Bot Setup Guide](https://github.com/vercel-partner-solutions/slack-agent-template/blob/main/README.md)

---

## 📚 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key (production) | `pk_live_...` |
| `CLERK_SECRET_KEY` | ✅ | Clerk secret key (production) | `sk_live_...` |
| `CLERK_WEBHOOK_SECRET` | ✅ | Clerk webhook signing secret | `whsec_...` |
| `AI_GATEWAY_API_KEY` | ✅ | Vercel AI Gateway API key | `vg_...` |
| `EXA_API_KEY` | ✅ | Exa search API key | `exa_...` |
| `SLACK_BOT_TOKEN` | ❌ | Slack bot OAuth token | `xoxb-...` |
| `SLACK_SIGNING_SECRET` | ❌ | Slack app signing secret | `...` |
| `SLACK_CHANNEL_ID` | ❌ | Slack channel for notifications | `C...` |

---

## 🚨 Security Checklist

Before going live:

- ✅ All environment variables are set to **production** values
- ✅ `.env` and `.env.local` are in `.gitignore`
- ✅ Database uses SSL (`?sslmode=require` in connection string)
- ✅ Clerk webhook endpoint is verified with signing secret
- ✅ Middleware is protecting all dashboard routes
- ✅ Permission checks are in place for all sensitive actions
- ✅ Rate limiting is enabled for form submissions
- ✅ Bot detection is enabled (`botid` package)

---

## 📈 Scaling Considerations

As your app grows:

1. **Database:**
   - Monitor Neon connection pool usage
   - Consider enabling connection pooling with `?pgbouncer=true`
   - Upgrade Neon plan if needed

2. **Vercel:**
   - Monitor function execution time
   - Consider Pro plan for better limits
   - Enable edge runtime for faster global performance

3. **Clerk:**
   - Monitor MAU (Monthly Active Users)
   - Upgrade plan as user base grows

---

## 🎉 You're Live!

Congratulations! Your multi-tenant Lead Agent is now deployed to production.

**Next steps:**
- Share your app URL with your team
- Set up your first organization
- Submit test leads
- Monitor for any issues

**Support:**
- Vercel: [vercel.com/support](https://vercel.com/support)
- Clerk: [clerk.com/support](https://clerk.com/support)
- Neon: [neon.tech/docs](https://neon.tech/docs)

---

**Need help?** Check the troubleshooting section or create an issue in your repository.
