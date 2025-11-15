# Timeless Technology Solutions - Setup Guide

## ✅ Completed Setup

### 1. Database Configuration
- ✅ Tenant created with subdomain: `timeless-tech`
- ✅ Clerk Organization ID linked: `org_35XCr3evxdGEl19z2DQpUCE2MAS`
- ✅ Logo configured: `/timeless/hero-image3.png`
- ✅ Branding: Indigo (#6366F1) / Pink (#EC4899)
- ✅ 16 DDIP assessment questions seeded

### 2. URL Configuration
- ✅ Custom domain: `leads.littletownlabs.site`
- ✅ Timeless Tech subdomain: `timeless-tech.leads.littletownlabs.site`
- ✅ Subdomain routing configured

---

## 🔐 Employee Login Instructions

### Sign In URL
**https://leads.littletownlabs.site/sign-in**

### First-Time Setup (For Each Employee)
1. Visit: https://leads.littletownlabs.site/sign-in
2. Click **"Sign Up"** if you don't have an account
3. Sign up with email or Google/Microsoft SSO
4. After signing in, you'll be redirected to **Select Organization**
5. Look for **"Timeless Technology Solutions"** in the list
6. Click to join the organization
7. You'll be redirected to the dashboard

### Existing Users
1. Visit: https://leads.littletownlabs.site/sign-in
2. Sign in with your credentials
3. If you're already a member of the organization, you'll go straight to the dashboard
4. If not, select **"Timeless Technology Solutions"** from the organization switcher

---

## 📊 Dashboard Features

### Main Dashboard (`/dashboard`)
- View lead statistics (pending, approved, rejected)
- Monitor monthly usage limits
- See recent lead submissions
- Quick access to pending reviews

### Leads Management (`/leads`)
- View all lead submissions
- Filter by status (pending/approved/rejected)
- Click on leads to view details and AI research
- Approve/reject personalized email drafts

### Analytics (`/analytics`)
- Performance metrics
- Conversion rates
- Lead quality trends

### Settings (`/settings`)
- Manage team members
- Invite new employees
- Configure organization settings

---

## 🛠️ Admin Panel (Admin Role Only)

**Access**: https://leads.littletownlabs.site/admin

### Admin Features

#### 1. Quiz Builder (`/admin/quiz`)
- Customize assessment questions
- Modify scoring logic
- Add/edit/delete questions
- Preview quiz flow

#### 2. Branding (`/admin/branding`)
- Update logo
- Change primary/secondary colors
- Customize font family
- Configure favicon

#### 3. Landing Page (`/admin/branding`)
- Edit hero title and subtitle
- Customize CTA text
- Configure feature sections

#### 4. Email Templates (`/admin/email`)
- Configure email sequences (cold/warm leads)
- Set up nurture campaigns
- Customize email sender info
- Configure delay timing

#### 5. AI Workflows (`/admin/workflows`)
- Configure AI research settings
- Set qualification thresholds
- Manage workflow execution

#### 6. Knowledge Base (`/admin/knowledge-base`)
- Upload documents for AI research
- Add FAQs, product info, case studies
- Manage semantic search content

---

## 🔔 Clerk Webhook Setup (Required for Auto-Sync)

### Current Status
✅ Webhook code is implemented at `/api/webhooks/clerk`
⚠️ Webhook endpoint needs to be configured in Clerk Dashboard

### Setup Steps

1. **Go to Clerk Dashboard**
   - Visit: https://dashboard.clerk.com/
   - Select your application
   - Navigate to **Webhooks** in the left sidebar

2. **Add Webhook Endpoint**
   - Click **"Add Endpoint"**
   - Enter URL: `https://leads.littletownlabs.site/api/webhooks/clerk`
   - Description: "Lead Agent - User & Organization Sync"

3. **Subscribe to Events**
   Select these events:
   - ✅ `user.created` - When employees sign up
   - ✅ `user.updated` - When profile is updated
   - ✅ `user.deleted` - When user is removed
   - ✅ `organization.created` - New organization created
   - ✅ `organization.updated` - Organization details change
   - ✅ `organization.deleted` - Organization removed
   - ✅ `organizationMembership.created` - Employee joins org
   - ✅ `organizationMembership.deleted` - Employee leaves org

4. **Copy Signing Secret**
   - After creating the endpoint, Clerk shows a **Signing Secret**
   - Copy the secret (starts with `whsec_`)
   - It's already in your `.env.local` as `CLERK_WEBHOOK_SECRET`

5. **Add to Vercel Environment Variables** (For Production)
   - Go to Vercel Project Settings
   - Navigate to **Environment Variables**
   - Verify `CLERK_WEBHOOK_SECRET` is set to the signing secret
   - If missing, add it and redeploy

6. **Test the Webhook**
   - In Clerk Dashboard, click **"Send Test Event"**
   - Select `user.created` or `organizationMembership.created`
   - Click **Send**
   - Check Vercel logs to verify it was received

---

## 👥 Team Member Roles

### Admin Role
- Full access to Admin Panel
- Can manage organization settings
- Can customize branding and quiz
- Can invite/remove team members

### Member Role
- View dashboard and analytics
- Manage leads (view, approve, reject)
- Cannot access Admin Panel
- Cannot modify organization settings

### Assigning Roles
1. Go to Clerk Dashboard → Organizations
2. Find "Timeless Technology Solutions"
3. Click on the organization
4. Manage members and their roles

---

## 🎨 Public-Facing Pages

### Landing Page
**URL**: https://timeless-tech.leads.littletownlabs.site

Features:
- DDIP-focused hero section
- "Your Help Desk Data Knows Why You're Losing Time & Money"
- 4 feature sections explaining DDIP benefits
- Prominent CTA button → "Start Your Free Assessment"
- Indigo branding with Timeless Tech logo

### Assessment Quiz
**URL**: https://timeless-tech.leads.littletownlabs.site/quiz

Features:
- 16 custom questions for help desk assessment
- Contact info collection
- Multiple choice, checkboxes, text inputs
- Scoring system (0-100%)
- Auto-qualification based on responses

### Results Page
**URL**: https://timeless-tech.leads.littletownlabs.site/assessment/results/[leadId]

Features:
- Personalized readiness score
- Tier classification (Cold/Warm/Hot/Qualified)
- Recommendations based on score
- Next steps and contact information

---

## 📧 Email Configuration

### Current Settings
- **From Name**: Timeless Technology Solutions
- **From Email**: ddip@timelesstechs.com
- **Email Service**: Resend (API key configured)

### Email Sequences (Located in `/admin/email`)
Configure automated nurture sequences for:
- **Cold Leads** (0-40% score): Educational content
- **Warm Leads** (40-60% score): Value proposition
- **Hot Leads** (60%+ score): Personalized AI-generated emails

---

## 🚀 Next Steps

### For Employees
1. ✅ Sign up at https://leads.littletownlabs.site/sign-in
2. ✅ Join "Timeless Technology Solutions" organization
3. ✅ Explore the dashboard and lead management

### For Admins
1. ⚠️ Set up Clerk webhook (see Webhook Setup section above)
2. ✅ Review and customize quiz questions in `/admin/quiz`
3. ✅ Configure email sequences in `/admin/email`
4. ✅ Upload knowledge base documents in `/admin/knowledge-base`
5. ✅ Test the full workflow: landing page → quiz → results → dashboard

### For Marketing
1. ✅ Share landing page: https://timeless-tech.leads.littletownlabs.site
2. ✅ Promote the free assessment
3. ✅ Monitor lead quality in the dashboard

---

## 📞 Support & Documentation

- **Main Documentation**: See `/docs` folder
- **Webhook Setup**: See `CLERK_WEBHOOK_SETUP.md`
- **Multi-Tenant Testing**: See `/docs/MULTI-TENANT-TESTING.md`
- **Database Schema**: See `/db/schema.ts`

---

## 🔒 Security Notes

- All routes under `/dashboard`, `/leads`, `/analytics`, `/settings`, and `/admin` require authentication
- Organization membership is required to access tenant-specific data
- Admin Panel requires admin role within the organization
- All data is scoped by `orgId` for multi-tenant isolation
- Webhooks are verified using Svix signature verification
