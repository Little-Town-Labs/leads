# API Endpoints Specification

## Overview
This document defines all API endpoints required for the landing page sales system.

## Base Path
All endpoints prefixed with `/api/assessment/`

---

## Public Endpoints (No Auth Required)

### 1. Start Assessment

**POST** `/api/assessment/start`

**Purpose**: Create a new assessment lead and return leadId for tracking.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890", // optional
  "smsOptIn": false, // optional
  "utmSource": "google", // optional
  "utmMedium": "cpc", // optional
  "utmCampaign": "ai-careers-2025", // optional
  "referrerUrl": "https://google.com" // optional
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Assessment started successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid email format, missing required fields
- **409 Conflict**: Email already exists (return existing leadId instead)

**Implementation Notes**:
- Check for existing email, if found return existing incomplete assessment
- Auto-capture IP address and derive location
- Auto-detect device type from User-Agent
- Set `startedAt` timestamp
- Initialize `questionResponses` as empty object

---

### 2. Save Progress

**PUT** `/api/assessment/{leadId}/progress`

**Purpose**: Save individual question responses as user progresses.

**Request Body**:
```json
{
  "questionId": "q5_programming",
  "answer": "Yes, proficient in at least one language",
  "timeSpent": 12 // seconds spent on this question
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "questionsAnswered": 5,
  "progressPercentage": 33
}
```

**Error Responses**:
- **404 Not Found**: Invalid leadId
- **400 Bad Request**: Invalid questionId or answer format

**Implementation Notes**:
- Update `questionResponses` JSONB field
- Update `questionTimings` with time spent
- Increment `questionsAnswered`
- Auto-save, no user action required

---

### 3. Complete Assessment

**POST** `/api/assessment/{leadId}/complete`

**Purpose**: Mark assessment complete, calculate scores, and trigger results generation.

**Request Body**:
```json
{
  "finalAnswers": {
    "q15_current_situation": "mid_career",
    "q16_desired_outcome": "full_time_role",
    "q17_biggest_obstacle": "technical_skills",
    "q18_preferred_solution": "coaching",
    "q19_additional_notes": "I need to transition by June for financial reasons"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "readinessScore": 67,
  "scoreTier": "green",
  "leadScore": 78,
  "qualificationTier": "hot",
  "recommendedNextStep": "join_workshop",
  "resultsUrl": "/assessment/results/550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses**:
- **404 Not Found**: Invalid leadId
- **400 Bad Request**: Missing required answers
- **409 Conflict**: Assessment already completed

**Implementation Notes**:
- Calculate `readinessScore` from Q5-14
- Apply bonus/penalty points
- Calculate composite `leadScore`
- Determine `qualificationTier` and `recommendedNextStep`
- Set `isComplete = true`, `completedAt = now()`
- Trigger email send (async background job)
- Return results URL for immediate redirect

---

### 4. Get Results

**GET** `/api/assessment/results/{leadId}`

**Purpose**: Retrieve assessment results and personalized recommendations.

**Query Parameters**:
- `track=true` (optional): Track that user viewed results

**Response** (200 OK):
```json
{
  "success": true,
  "lead": {
    "firstName": "John",
    "email": "john@example.com",
    "finalScore": 67,
    "scoreTier": "green",
    "readinessScore": 67,
    "leadScore": 78,
    "qualificationTier": "hot"
  },
  "results": {
    "scoreLabel": "Nearly Qualified - Close the Gaps",
    "scoreDescription": "You have a strong foundation but need 2-3 months of focused learning to become job-ready.",
    "insights": [
      {
        "type": "strength",
        "title": "Strong Technical Foundation",
        "description": "Your programming experience and AI tool usage give you a solid starting point."
      },
      {
        "type": "gap",
        "title": "Portfolio Development Needed",
        "description": "You need to build 3-5 projects showcasing your AI skills to stand out to employers."
      },
      {
        "type": "timeline",
        "title": "Estimated Timeline",
        "description": "With consistent effort (5-10 hrs/week), you could be job-ready in 2-3 months."
      }
    ],
    "nextSteps": {
      "primary": {
        "ctaType": "join_workshop",
        "ctaText": "Join Our AI Career Accelerator Workshop",
        "ctaUrl": "/workshop",
        "headline": "You're 70% ready - let's close the gaps together",
        "description": "In this live workshop, you'll learn exactly what to build, where to learn, and how to position yourself for AI roles.",
        "benefits": [
          "Personalized gap analysis review",
          "90-day action plan template",
          "Portfolio project ideas tailored to your goals",
          "Q&A with AI career experts"
        ]
      },
      "secondary": {
        "ctaType": "download_roadmap",
        "ctaText": "Download Your Personalized Roadmap",
        "ctaUrl": "/download/roadmap/{leadId}",
        "description": "Not ready for the workshop? Get a PDF roadmap sent to your email."
      }
    }
  },
  "additionalResources": [
    {
      "title": "Free: 5 AI Projects to Build in 30 Days",
      "url": "/resources/ai-projects-guide",
      "type": "guide"
    },
    {
      "title": "Recommended: AI Career Transition Masterclass",
      "url": "/courses/masterclass",
      "type": "course"
    }
  ]
}
```

**Error Responses**:
- **404 Not Found**: Invalid leadId or assessment not complete
- **400 Bad Request**: Assessment not yet completed

**Implementation Notes**:
- If `track=true`, update `hasViewedResults = true`, `resultsViewedAt = now()`
- Generate dynamic insights based on question responses
- Customize next steps based on `qualificationTier` and `preferredSolution`
- Cache results for 1 hour to reduce DB queries

---

### 5. Track CTA Click

**POST** `/api/assessment/{leadId}/track-cta`

**Purpose**: Track when user clicks on recommended next step CTA.

**Request Body**:
```json
{
  "ctaType": "join_workshop",
  "ctaUrl": "/workshop"
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Implementation Notes**:
- Update `hasClickedCTA = true`, `ctaClickedAt = now()`
- Store `ctaClicked` value
- Fire analytics event for conversion tracking
- No error if already tracked (idempotent)

---

### 6. Resume Assessment

**GET** `/api/assessment/resume/{email}`

**Purpose**: Allow users to resume incomplete assessment via email link.

**Response** (200 OK):
```json
{
  "success": true,
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "questionsAnswered": 8,
  "progressPercentage": 53,
  "lastQuestion": "q8_time_commitment"
}
```

**Error Responses**:
- **404 Not Found**: No incomplete assessment for this email
- **410 Gone**: Assessment already completed (redirect to results)

**Implementation Notes**:
- Find most recent incomplete assessment for email
- If complete, return 410 with resultsUrl
- Return current progress state

---

## Admin Endpoints (Auth Required - Admin Only)

### 7. List Leads

**GET** `/api/admin/assessment/leads`

**Purpose**: Admin dashboard to view and filter all leads.

**Query Parameters**:
- `status` (optional): Filter by status (new, contacted, nurturing, etc.)
- `qualificationTier` (optional): Filter by tier (cold, warm, hot, qualified)
- `scoreTier` (optional): Filter by score range (red, yellow, green, blue)
- `minScore` (optional): Minimum readiness score
- `minLeadScore` (optional): Minimum composite lead score
- `dateFrom` (optional): Filter by creation date
- `dateTo` (optional): Filter by creation date
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 25, max: 100)
- `sortBy` (optional): Sort field (createdAt, leadScore, finalScore)
- `sortOrder` (optional): asc or desc (default: desc)

**Response** (200 OK):
```json
{
  "success": true,
  "leads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "finalScore": 67,
      "scoreTier": "green",
      "leadScore": 78,
      "qualificationTier": "hot",
      "recommendedNextStep": "join_workshop",
      "status": "new",
      "hasViewedResults": true,
      "hasClickedCTA": false,
      "createdAt": "2025-10-18T10:30:00Z",
      "completedAt": "2025-10-18T10:37:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 147,
    "totalPages": 6
  },
  "stats": {
    "totalLeads": 147,
    "newLeads": 45,
    "hotLeads": 23,
    "qualified": 12,
    "avgReadinessScore": 58,
    "avgLeadScore": 62,
    "completionRate": 72.5
  }
}
```

**Implementation Notes**:
- Require admin authentication via `requireAdmin()` helper
- Build dynamic WHERE clause based on filters
- Return aggregated stats for dashboard
- Exclude sensitive data like IP addresses from list view

---

### 8. Get Lead Details

**GET** `/api/admin/assessment/leads/{leadId}`

**Purpose**: View complete lead profile including all responses and timeline.

**Response** (200 OK):
```json
{
  "success": true,
  "lead": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "San Francisco, CA, USA",
    "deviceType": "mobile",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "ai-careers-2025",
    "finalScore": 67,
    "scoreTier": "green",
    "readinessScore": 67,
    "bonusPoints": 2,
    "penaltyPoints": 0,
    "leadScore": 78,
    "qualificationTier": "hot",
    "currentSituation": "mid_career",
    "desiredOutcome": "full_time_role",
    "biggestObstacle": "technical_skills",
    "preferredSolution": "coaching",
    "additionalNotes": "I need to transition by June for financial reasons",
    "questionResponses": {
      "q5_programming": "Yes, basic familiarity",
      "q6_education": "Yes, one completed",
      // ... all 15 questions
    },
    "questionTimings": {
      "q5_programming": 12,
      "q6_education": 8,
      // ...
    },
    "timeline": [
      {
        "event": "Assessment started",
        "timestamp": "2025-10-18T10:30:00Z"
      },
      {
        "event": "Assessment completed",
        "timestamp": "2025-10-18T10:37:00Z"
      },
      {
        "event": "Results email sent",
        "timestamp": "2025-10-18T10:37:15Z"
      },
      {
        "event": "Results viewed",
        "timestamp": "2025-10-18T11:45:00Z"
      }
    ],
    "salesNotes": null,
    "status": "new",
    "createdAt": "2025-10-18T10:30:00Z",
    "updatedAt": "2025-10-18T11:45:00Z"
  }
}
```

**Implementation Notes**:
- Require admin authentication
- Return full lead profile with all fields
- Build timeline from timestamps
- Include UTM and device data for attribution

---

### 9. Update Lead Status

**PUT** `/api/admin/assessment/leads/{leadId}/status`

**Purpose**: Update lead status and add sales notes.

**Request Body**:
```json
{
  "status": "contacted",
  "salesNotes": "Spoke with John on 10/19. Interested in coaching package. Following up next week.",
  "hasBeenContacted": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lead status updated"
}
```

**Implementation Notes**:
- Require admin authentication
- Auto-set `contactedAt` if `hasBeenContacted = true`
- Store `contactedBy` as admin user ID
- Append to `salesNotes` with timestamp prefix

---

### 10. Track Lead Action

**POST** `/api/admin/assessment/leads/{leadId}/action`

**Purpose**: Manually track when lead takes action (books call, purchases, etc.).

**Request Body**:
```json
{
  "actionType": "booked_call",
  "actionDetails": "Booked strategy call for 10/25 at 2pm"
}
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Implementation Notes**:
- Update `hasTakenAction = true`, `actionTakenAt = now()`
- Store `actionType`
- Add to sales notes timeline

---

### 11. Convert Lead to User

**POST** `/api/admin/assessment/leads/{leadId}/convert`

**Purpose**: Link lead to actual user account when they sign up.

**Request Body**:
```json
{
  "userId": "auth0|123456789",
  "conversionType": "self_signup" // or "admin_created"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lead converted to user"
}
```

**Implementation Notes**:
- Update `convertedToUserId`, `convertedAt`
- Update `status = 'converted'`
- Optionally create initial roadmap from assessment data

---

### 12. Lead Analytics

**GET** `/api/admin/assessment/analytics`

**Purpose**: Get aggregate analytics for lead generation performance.

**Query Parameters**:
- `dateFrom` (optional): Start date for analysis
- `dateTo` (optional): End date for analysis
- `groupBy` (optional): day, week, month

**Response** (200 OK):
```json
{
  "success": true,
  "period": {
    "from": "2025-09-18",
    "to": "2025-10-18"
  },
  "overview": {
    "totalLeads": 342,
    "completedAssessments": 248,
    "completionRate": 72.5,
    "avgReadinessScore": 58,
    "avgLeadScore": 62,
    "avgTimeToComplete": 287 // seconds
  },
  "conversion": {
    "viewedResults": 235,
    "clickedCTA": 87,
    "tookAction": 23,
    "converted": 12,
    "viewedResultsRate": 94.8,
    "ctaClickRate": 37.0,
    "actionRate": 26.4,
    "conversionRate": 52.2
  },
  "scoreDistribution": {
    "red": 45,
    "yellow": 89,
    "green": 78,
    "blue": 36
  },
  "qualificationDistribution": {
    "cold": 112,
    "warm": 78,
    "hot": 42,
    "qualified": 16
  },
  "topObstacles": [
    { "obstacle": "technical_skills", "count": 98 },
    { "obstacle": "dont_know_start", "count": 76 },
    { "obstacle": "time_constraints", "count": 54 }
  ],
  "budgetDistribution": {
    "free_resources": 89,
    "online_course": 78,
    "coaching": 56,
    "done_with_you": 18,
    "bootcamp": 7
  },
  "timeline": [
    {
      "date": "2025-10-11",
      "leads": 12,
      "completed": 9,
      "avgScore": 62
    },
    // ... daily breakdown
  ]
}
```

**Implementation Notes**:
- Require admin authentication
- Use SQL aggregations for performance
- Cache results for 15 minutes
- Support date range filtering

---

## Email Automation Endpoints (Internal/Cron)

### 13. Send Results Email

**POST** `/api/assessment/email/send-results`

**Purpose**: Trigger results email (called internally after assessment completion).

**Request Body**:
```json
{
  "leadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Implementation Notes**:
- Should be called from background job queue (BullMQ, Inngest, etc.)
- Update `emailSent = true`, `emailsSentCount++`, `lastEmailSentAt`
- Use email template with personalized results summary
- Include magic link to view full results

---

### 14. Send Nurture Sequence

**POST** `/api/assessment/email/nurture`

**Purpose**: Cron job to send automated nurture emails.

**Implementation Notes**:
- Run daily via cron
- Find leads based on criteria:
  - Day 1: Results not viewed → reminder email
  - Day 3: Viewed but no CTA click → value content
  - Day 7: Still no action → last chance offer
- Respect unsubscribe status
- Track in `emailsSentCount`

---

## Validation Schemas (Zod)

```typescript
// src/lib/validations/assessment.ts

import { z } from "zod";

export const StartAssessmentSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  smsOptIn: z.boolean().optional().default(false),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  referrerUrl: z.string().url().optional(),
});

export const SaveProgressSchema = z.object({
  questionId: z.enum([
    "q5_programming",
    "q6_education",
    "q7_tool_usage",
    "q8_time_commitment",
    "q9_portfolio",
    "q10_community",
    "q11_industry_news",
    "q12_prompt_engineering",
    "q13_ml_fundamentals",
    "q14_ai_ethics",
  ]),
  answer: z.string().min(1),
  timeSpent: z.number().min(0),
});

export const CompleteAssessmentSchema = z.object({
  finalAnswers: z.object({
    q15_current_situation: z.enum([
      "student",
      "early_career",
      "mid_career",
      "senior",
      "career_break",
      "entrepreneur",
    ]),
    q16_desired_outcome: z.enum([
      "first_project",
      "full_time_role",
      "upskill",
      "start_business",
      "transition_role",
      "exploring",
    ]),
    q17_biggest_obstacle: z.enum([
      "technical_skills",
      "no_education",
      "dont_know_start",
      "imposter_syndrome",
      "time_constraints",
      "financial",
      "no_network",
      "age_concerns",
    ]),
    q18_preferred_solution: z.enum([
      "free_resources",
      "online_course",
      "coaching",
      "done_with_you",
      "bootcamp",
      "exploring",
    ]),
    q19_additional_notes: z.string().max(500).optional(),
  }),
});
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message here",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "issue": "Invalid email format"
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Resource doesn't exist
- `ALREADY_EXISTS`: Duplicate email
- `ALREADY_COMPLETED`: Assessment already finished
- `UNAUTHORIZED`: Missing or invalid auth
- `FORBIDDEN`: Insufficient permissions
- `RATE_LIMIT_EXCEEDED`: Too many requests

---

## Rate Limiting

### Public Endpoints
- **Assessment Start**: 5 requests per 15 minutes per IP
- **Save Progress**: 60 requests per minute per leadId
- **Complete Assessment**: 3 requests per minute per leadId

### Admin Endpoints
- **Lead List**: 60 requests per minute per admin
- **Analytics**: 10 requests per minute per admin

---

**Last Updated**: 2025-10-18
**Status**: Planning Phase
**Next**: Implement API routes in src/app/api/assessment/
