# Vercel Deployment Checklist

Quick reference for deploying Lead Agent to Vercel.

---

## ⚡ Quick Deploy (5 minutes)

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import to Vercel
- Go to [vercel.com/new](https://vercel.com/new)
- Import your GitHub repository
- Framework: Next.js (auto-detected)
- Click "Deploy"

### 3. Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```bash
# Copy from your .env.local
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
AI_GATEWAY_API_KEY=...
EXA_API_KEY=...

# Optional (Slack)
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
SLACK_CHANNEL_ID=C...
```

### 4. Set Up Clerk Webhook

After first deployment:

1. Copy your Vercel URL (e.g., `https://lead-agent.vercel.app`)
2. Clerk Dashboard → Webhooks → Add Endpoint
3. URL: `https://your-domain.vercel.app/api/webhooks/clerk`
4. Events: `organization.*`, `organizationMembership.*`
5. Copy signing secret → Add to Vercel as `CLERK_WEBHOOK_SECRET`
6. Redeploy in Vercel

### 5. Update Clerk Domain

Clerk Dashboard → Domains:
- Add `your-domain.vercel.app`
- Set redirect paths (sign-in: `/sign-in`, after-sign-in: `/dashboard`)

---

## ✅ Pre-Deployment Checklist

- [ ] All environment variables in `.env.local` have production values
- [ ] Database migrations have been run (`pnpm db:migrate`)
- [ ] Clerk organizations are enabled
- [ ] Test build passes locally (`pnpm build`)
- [ ] `.env` and `.env.local` are in `.gitignore`
- [ ] Code is pushed to GitHub

---

## 🚨 After Deployment

- [ ] Visit deployed URL and test sign-up
- [ ] Create an organization
- [ ] Submit a test lead
- [ ] Verify dashboard shows the lead
- [ ] Test approve/reject functionality
- [ ] Check Slack notifications (if configured)
- [ ] Invite a team member to test permissions

---

## 🔧 Common Issues

**Build fails with type errors:**
```bash
# Fix locally first
pnpm build
# Fix errors, then push
```

**"Clerk is not initialized":**
- Use `pk_live_...` not `pk_test_...` for production
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set

**Webhooks not working:**
- Check URL: `https://yourdomain.com/api/webhooks/clerk` (no trailing slash)
- Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Check webhook logs in Clerk

**Database connection fails:**
- Verify `DATABASE_URL` is set in Vercel
- Ensure connection string includes `?sslmode=require`
- Check Neon dashboard for connection limits

---

## 📚 Full Documentation

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive deployment guide.

---

## 🎯 Environment Variables Template

For easy copy-paste to Vercel:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
AI_GATEWAY_API_KEY=
EXA_API_KEY=
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_CHANNEL_ID=
```

Remember to set these for **all environments**: Production, Preview, and Development.
