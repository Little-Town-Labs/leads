# Implementation Plan

## Overview
Phased approach to building the landing page sales system over 6-8 weeks.

---

## Phase 1: Foundation & Database (Week 1)

### Goals
- Set up database schema
- Create TypeORM entity
- Build core API endpoints for assessment flow

### Tasks

#### 1.1 Database Setup
- [ ] Create `AssessmentLeadEntity` in `src/entities/`
- [ ] Add entity to data-source.ts entities array
- [ ] Create migration file `src/migrations/TIMESTAMP-CreateAssessmentLeadTables.ts`
- [ ] Run migration locally and verify schema
- [ ] Test entity CRUD operations

**Files to Create/Modify**:
- `src/entities/AssessmentLeadEntity.ts` (new)
- `src/lib/data-source.ts` (modify - add entity)
- `src/migrations/TIMESTAMP-CreateAssessmentLeadTables.ts` (new)

#### 1.2 Scoring Logic Helper
- [ ] Create `src/lib/assessment-scoring.ts`
- [ ] Implement readiness score calculation
- [ ] Implement lead score calculation (composite)
- [ ] Implement tier assignment logic
- [ ] Write unit tests for scoring

**Functions to Implement**:
```typescript
calculateReadinessScore(responses): number
calculateLeadScore(readiness, urgency, budget): number
assignScoreTier(score): 'red' | 'yellow' | 'green' | 'blue'
assignQualificationTier(leadScore): 'cold' | 'warm' | 'hot' | 'qualified'
getRecommendedNextStep(tier, solution): string
```

#### 1.3 Validation Schemas
- [ ] Create `src/lib/validations/assessment.ts`
- [ ] Define Zod schemas for all request bodies
- [ ] Export validation functions

#### 1.4 Core API Endpoints
- [ ] `POST /api/assessment/start` - Create lead
- [ ] `PUT /api/assessment/[leadId]/progress` - Save progress
- [ ] `POST /api/assessment/[leadId]/complete` - Complete & score
- [ ] `GET /api/assessment/results/[leadId]` - Get results
- [ ] `POST /api/assessment/[leadId]/track-cta` - Track CTA click

**Deliverable**: Working API that can create leads, save progress, and calculate scores.

---

## Phase 2: Landing Page (Week 2)

### Goals
- Design and build high-converting landing page
- Implement quiz start flow

### Tasks

#### 2.1 Landing Page Design
- [ ] Review and finalize copy from `01-STRATEGY.md`
- [ ] Choose hook (frustration vs readiness)
- [ ] Write credibility section with your bio
- [ ] Select/create images and icons
- [ ] Design mobile-first layout

#### 2.2 Landing Page Component
- [ ] Replace `src/app/page.tsx` redirect with full landing page
- [ ] Implement hero section with hook
- [ ] Add value proposition section
- [ ] Add credibility section
- [ ] Add "How It Works" section
- [ ] Add FAQ accordion
- [ ] Add trust signals footer
- [ ] Make responsive (mobile-first)

**Files to Create/Modify**:
- `src/app/page.tsx` (modify - full redesign)
- `src/components/landing/HeroSection.tsx` (new)
- `src/components/landing/ValueProposition.tsx` (new)
- `src/components/landing/HowItWorks.tsx` (new)
- `src/components/landing/FAQ.tsx` (new)

#### 2.3 CTA Buttons
- [ ] Create reusable CTA button component
- [ ] Add tracking on click (analytics event)
- [ ] Link to `/assessment/start` route

#### 2.4 Analytics Integration
- [ ] Set up conversion tracking
- [ ] Track landing page views
- [ ] Track CTA clicks
- [ ] Track scroll depth

**Deliverable**: Beautiful landing page that drives users to start assessment.

---

## Phase 3: Assessment Quiz (Week 3-4)

### Goals
- Build multi-step assessment quiz
- Implement auto-save and resume functionality
- Create smooth UX with progress tracking

### Tasks

#### 3.1 Quiz Page Structure
- [ ] Create `src/app/assessment/start/page.tsx`
- [ ] Implement multi-step form wizard
- [ ] Add progress bar (0-100%)
- [ ] Add question counter (1 of 15)
- [ ] Add back/next navigation

#### 3.2 Question Components
- [ ] Create `src/components/assessment/QuestionWrapper.tsx`
- [ ] Create question type components:
  - `TextInput.tsx` (name, email)
  - `PhoneInput.tsx` (phone with country code)
  - `RadioGroup.tsx` (single choice)
  - `Textarea.tsx` (additional notes)
- [ ] Add validation per question
- [ ] Add time tracking per question

**Files to Create**:
- `src/app/assessment/start/page.tsx` (new)
- `src/components/assessment/QuestionWrapper.tsx` (new)
- `src/components/assessment/ProgressBar.tsx` (new)
- `src/components/assessment/questions/*` (multiple new files)

#### 3.3 Assessment State Management
- [ ] Use React Hook Form for form state
- [ ] Implement auto-save after each question
- [ ] Handle browser back/forward buttons
- [ ] Show loading states during saves

#### 3.4 Question Flow Logic
- [ ] Step 1: Contact info (Q1-4)
- [ ] Step 2: Best practices Part 1 (Q5-9)
- [ ] Step 3: Best practices Part 2 (Q10-14)
- [ ] Step 4: Big 5 qualifiers (Q15-19)
- [ ] Implement conditional logic if needed

#### 3.5 Resume Functionality
- [ ] Create "Resume Assessment" email link
- [ ] `GET /api/assessment/resume/[email]` endpoint
- [ ] Redirect to quiz with pre-filled answers
- [ ] Show "Continue where you left off" message

**Deliverable**: Fully functional 15-question assessment with auto-save.

---

## Phase 4: Dynamic Results Page (Week 4-5)

### Goals
- Build results page with personalized insights
- Implement dynamic CTA based on qualification tier
- Create compelling visual score display

### Tasks

#### 4.1 Results Page Layout
- [ ] Create `src/app/assessment/results/[leadId]/page.tsx`
- [ ] Fetch results from API
- [ ] Handle loading and error states
- [ ] Track results view on page load

#### 4.2 Score Visualization
- [ ] Create score gauge/speedometer component
- [ ] Color-code by tier (red/yellow/green/blue)
- [ ] Display percentage score prominently
- [ ] Add tier label (Significant Gaps, Nearly Qualified, etc.)

#### 4.3 Insights Generation
- [ ] Create `src/lib/results-generator.ts`
- [ ] Generate 3 dynamic insights based on responses
- [ ] Strength insight (what they're doing well)
- [ ] Gap insight (what they need to improve)
- [ ] Timeline insight (realistic timeframe)

**Logic Examples**:
```typescript
if (q9_portfolio === 'No portfolio' && finalScore > 50) {
  addInsight({
    type: 'gap',
    title: 'Portfolio Development Needed',
    description: 'You have the skills but need projects to showcase them.'
  });
}
```

#### 4.4 Personalized Next Steps
- [ ] Implement tier-based CTA logic
- [ ] Create CTA card component
- [ ] Add primary and secondary CTAs
- [ ] Different CTAs for each tier:
  - Qualified (76-100 + high budget) → Book 1-on-1 call
  - Hot (51-75 + medium budget) → Join workshop
  - Warm (26-50 + low budget) → Download guide
  - Cold (0-25) → Watch free training

#### 4.5 Additional Resources Section
- [ ] List recommended free resources
- [ ] Link to existing careers page
- [ ] Add social proof (testimonials if available)

**Files to Create**:
- `src/app/assessment/results/[leadId]/page.tsx` (new)
- `src/components/results/ScoreGauge.tsx` (new)
- `src/components/results/InsightCard.tsx` (new)
- `src/components/results/NextStepCTA.tsx` (new)
- `src/lib/results-generator.ts` (new)

**Deliverable**: Personalized results page that drives next step action.

---

## Phase 5: Admin Dashboard (Week 5-6)

### Goals
- Build admin interface to view and manage leads
- Implement filtering and analytics
- Enable sales team to track conversions

### Tasks

#### 5.1 Admin Leads List
- [ ] Create `src/app/admin/leads/page.tsx`
- [ ] Implement `GET /api/admin/assessment/leads` endpoint
- [ ] Add authentication guard (requireAdmin)
- [ ] Display leads in table with key fields
- [ ] Add filters: status, tier, score range, date
- [ ] Add sorting by score, date, lead score
- [ ] Implement pagination

#### 5.2 Admin Lead Detail View
- [ ] Create `src/app/admin/leads/[leadId]/page.tsx`
- [ ] Implement `GET /api/admin/assessment/leads/[leadId]` endpoint
- [ ] Show full lead profile
- [ ] Display all question responses
- [ ] Show timeline of events
- [ ] Add sales notes field

#### 5.3 Lead Management Actions
- [ ] Implement `PUT /api/admin/assessment/leads/[leadId]/status`
- [ ] Add "Mark as Contacted" button
- [ ] Add sales notes textarea
- [ ] Add "Convert to User" action
- [ ] Track who contacted the lead (admin user ID)

#### 5.4 Analytics Dashboard
- [ ] Create `src/app/admin/leads/analytics/page.tsx`
- [ ] Implement `GET /api/admin/assessment/analytics` endpoint
- [ ] Show overview metrics:
  - Total leads, completion rate, avg scores
  - Conversion funnel visualization
  - Score distribution chart
  - Top obstacles chart
  - Budget distribution
- [ ] Add date range filter
- [ ] Show daily timeline graph

**Files to Create**:
- `src/app/admin/leads/page.tsx` (new)
- `src/app/admin/leads/[leadId]/page.tsx` (new)
- `src/app/admin/leads/analytics/page.tsx` (new)
- `src/components/admin/LeadsTable.tsx` (new)
- `src/components/admin/LeadFilters.tsx` (new)
- `src/components/admin/AnalyticsCharts.tsx` (new)
- All admin API endpoints from `04-API-SPECIFICATION.md`

**Deliverable**: Full-featured admin dashboard for lead management.

---

## Phase 6: Email Automation (Week 6-7)

### Goals
- Set up email templates
- Implement automated email sequences
- Enable email tracking

### Tasks

#### 6.1 Email Service Setup
- [ ] Choose email provider (Resend recommended)
- [ ] Set up API credentials
- [ ] Configure DNS (SPF, DKIM)
- [ ] Create email templates

#### 6.2 Results Email Template
- [ ] Design HTML email template
- [ ] Include personalized score and insights
- [ ] Add magic link to view full results
- [ ] Add CTA button to next step
- [ ] Test rendering across email clients

#### 6.3 Immediate Email (Triggered)
- [ ] Implement `POST /api/assessment/email/send-results`
- [ ] Trigger from complete assessment endpoint
- [ ] Send within 5 minutes of completion
- [ ] Track email sent status

#### 6.4 Nurture Sequence (Automated)
- [ ] Set up cron job or scheduled task
- [ ] Day 1: "You haven't viewed your results" (if not viewed)
- [ ] Day 3: Value content based on tier
- [ ] Day 7: Last chance / special offer
- [ ] Respect unsubscribe status

#### 6.5 Email Tracking
- [ ] Track opens (via tracking pixel)
- [ ] Track link clicks
- [ ] Store in database
- [ ] Display in admin dashboard

**Files to Create**:
- `src/lib/email-service.ts` (new)
- `src/emails/templates/results.tsx` (new - React Email)
- `src/emails/templates/nurture-*.tsx` (multiple new files)
- `src/app/api/assessment/email/send-results/route.ts` (new)
- `src/app/api/cron/nurture-emails/route.ts` (new)

**Deliverable**: Automated email system that nurtures leads.

---

## Phase 7: Optimization & Testing (Week 7-8)

### Goals
- A/B test variations
- Optimize conversion rates
- Fix bugs and improve UX

### Tasks

#### 7.1 A/B Testing Setup
- [ ] Choose A/B testing tool (Vercel Flags, PostHog, etc.)
- [ ] Set up test variants
- [ ] Test A: Frustration hook vs Test B: Readiness hook
- [ ] Track conversion rates per variant

#### 7.2 Performance Optimization
- [ ] Optimize images (WebP, lazy loading)
- [ ] Reduce bundle size
- [ ] Add caching for results page
- [ ] Optimize API queries (indexes)
- [ ] Test on slow 3G network

#### 7.3 Mobile Optimization
- [ ] Test all flows on mobile
- [ ] Ensure touch targets are 44x44px min
- [ ] Fix any mobile-specific bugs
- [ ] Test on iOS and Android

#### 7.4 Analytics Review
- [ ] Set up conversion goal tracking
- [ ] Add funnel visualization
- [ ] Track drop-off points
- [ ] Identify confusing questions (high time spent)

#### 7.5 User Testing
- [ ] Get 5-10 people to complete assessment
- [ ] Watch session recordings
- [ ] Collect feedback
- [ ] Make UX improvements

#### 7.6 Security Audit
- [ ] Review all public endpoints for vulnerabilities
- [ ] Add rate limiting
- [ ] Prevent email enumeration attacks
- [ ] Add CAPTCHA if needed (reCAPTCHA v3)
- [ ] Sanitize all inputs

**Deliverable**: Optimized, tested, production-ready system.

---

## Phase 8: Launch & Monitor (Week 8+)

### Goals
- Deploy to production
- Monitor performance
- Iterate based on data

### Tasks

#### 8.1 Pre-Launch Checklist
- [ ] All features tested in staging
- [ ] Email templates tested
- [ ] Admin dashboard tested
- [ ] Analytics tracking verified
- [ ] Mobile tested on real devices
- [ ] Load testing completed
- [ ] Backup/restore tested

#### 8.2 Deployment
- [ ] Run database migrations on production
- [ ] Deploy to Netlify
- [ ] Verify all environment variables
- [ ] Test production deployment
- [ ] Monitor error logs

#### 8.3 Launch Marketing
- [ ] Update existing pages to link to new landing page
- [ ] Create social media posts
- [ ] Email existing users about assessment
- [ ] Set up paid ads (Google, Facebook) pointing to landing page

#### 8.4 Monitoring (First 30 Days)
- [ ] Daily check of lead volume
- [ ] Monitor completion rates
- [ ] Track conversion funnel
- [ ] Review error logs
- [ ] Respond to user feedback

#### 8.5 Iteration
- [ ] Analyze which questions have high drop-off
- [ ] Review sales notes for common objections
- [ ] A/B test new variations
- [ ] Optimize underperforming CTAs
- [ ] Update copy based on feedback

**Deliverable**: Live, optimized lead generation system.

---

## Success Criteria

### Week 4 (MVP)
- ✅ Assessment can be completed end-to-end
- ✅ Scores calculated correctly
- ✅ Results page displays personalized insights
- ✅ Leads stored in database

### Week 6 (Beta)
- ✅ Admin dashboard functional
- ✅ Email automation working
- ✅ Landing page live
- ✅ A/B testing set up

### Week 8 (Launch)
- ✅ All features production-ready
- ✅ 20%+ landing page → quiz conversion rate
- ✅ 70%+ quiz completion rate
- ✅ 15%+ CTA click rate on results

### Month 3 (Optimization)
- ✅ 100+ qualified leads captured
- ✅ Conversion funnel optimized
- ✅ Sales team actively using admin dashboard
- ✅ Positive ROI on paid traffic (if running ads)

---

## Resource Requirements

### Development
- **1 Full-Stack Developer** (you or team)
- **6-8 weeks** development time
- **4-8 hours per week** for iteration after launch

### Design
- **Landing page mockups** (Figma or similar)
- **Email templates** (React Email or Mailchimp)
- **Icon library** (Heroicons, Lucide)
- **Stock images** (Unsplash or custom)

### Infrastructure
- **Database**: NeonDB (existing)
- **Email**: Resend ($0-$20/mo for 100-3000 emails)
- **Analytics**: Vercel Analytics (free tier) or PostHog
- **Hosting**: Netlify (existing)

### Optional
- **A/B Testing**: Vercel Flags (free) or PostHog ($0-$20/mo)
- **Email Marketing**: Resend + React Email (free for 100 emails/day)
- **Calendar**: Cal.com (free, open source) or Calendly ($10/mo)

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Database schema changes needed later | Design schema with flexibility (JSONB fields) |
| High email bounce rate | Use reputable email service, verify DNS |
| Low completion rate | A/B test question order, reduce to 12 questions if needed |
| Spam/bot submissions | Add reCAPTCHA v3, rate limiting, honeypot fields |

### Business Risks
| Risk | Mitigation |
|------|------------|
| Low traffic to landing page | Plan marketing strategy before launch |
| Leads don't convert to customers | A/B test CTAs, improve offer, add social proof |
| Email deliverability issues | Warm up email domain gradually |
| Admin team doesn't use dashboard | Train team, gather feedback, iterate |

---

## Dependencies

### External Services
- ✅ Clerk (existing)
- ✅ NeonDB (existing)
- ✅ Vercel/Netlify (existing)
- 🆕 Resend (email) - new
- 🆕 Posthog (analytics) - new (optional)

### Internal Dependencies
- ✅ TypeORM entities working
- ✅ Admin authentication system
- 🆕 Email templates
- 🆕 React Hook Form for multi-step forms

---

## Timeline Summary

```
Week 1: Database + API ██████████░░░░░░░░░░ 50%
Week 2: Landing Page   ████████████████████ 100%
Week 3-4: Quiz Flow    ████████████████████ 100%
Week 4-5: Results Page ████████████████████ 100%
Week 5-6: Admin        ████████████████████ 100%
Week 6-7: Email        ████████████████████ 100%
Week 7-8: Testing      ████████████████████ 100%
Week 8+: Launch        🚀
```

**Total**: 6-8 weeks to production launch

---

**Last Updated**: 2025-10-18
**Status**: Planning Phase
**Next**: Review plan and begin Phase 1
