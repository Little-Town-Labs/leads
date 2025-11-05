# Database Schema Design

## Entity Overview

The landing page sales system introduces **one primary new entity** with supporting relationships to existing entities.

### New Entity: `AssessmentLeadEntity`

---

## AssessmentLeadEntity

### Purpose
Capture and qualify leads through the 15-question assessment before they become full users.

### Table Name
`assessment_leads`

### TypeORM Entity Definition

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("assessment_leads")
export class AssessmentLeadEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // ================================
  // Contact Information (Q1-4)
  // ================================

  @Column({ type: "varchar", length: 100 })
  firstName: string;

  @Column({ type: "varchar", length: 100 })
  lastName: string;

  @Column({ type: "varchar", length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string | null;

  @Column({ type: "boolean", default: false })
  smsOptIn: boolean; // Did they check "Text me results"

  // Auto-captured metadata
  @Column({ type: "varchar", length: 100, nullable: true })
  ipAddress: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  location: string | null; // City, State, Country from IP

  @Column({ type: "varchar", length: 50, nullable: true })
  country: string | null;

  @Column({ type: "varchar", length: 20, nullable: true })
  deviceType: string | null; // mobile, tablet, desktop

  // UTM tracking
  @Column({ type: "varchar", length: 255, nullable: true })
  utmSource: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  utmMedium: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  utmCampaign: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  referrerUrl: string | null;

  // ================================
  // Scoring & Assessment Results
  // ================================

  @Column({ type: "int", default: 0 })
  @Index()
  readinessScore: number; // 0-100 calculated from Q5-14

  @Column({ type: "varchar", length: 20 })
  @Index()
  scoreTier: "red" | "yellow" | "green" | "blue"; // Based on score range

  @Column({ type: "int", default: 0 })
  bonusPoints: number; // From certifications, GitHub, etc.

  @Column({ type: "int", default: 0 })
  penaltyPoints: number; // From disqualifying answers

  @Column({ type: "int", default: 0 })
  finalScore: number; // readinessScore + bonus - penalty

  // ================================
  // Big 5 Qualifying Questions (Q15-19)
  // ================================

  @Column({
    type: "enum",
    enum: [
      "student",
      "early_career",
      "mid_career",
      "senior",
      "career_break",
      "entrepreneur",
    ],
    nullable: true,
  })
  currentSituation:
    | "student"
    | "early_career"
    | "mid_career"
    | "senior"
    | "career_break"
    | "entrepreneur"
    | null;

  @Column({
    type: "enum",
    enum: [
      "first_project",
      "full_time_role",
      "upskill",
      "start_business",
      "transition_role",
      "exploring",
    ],
    nullable: true,
  })
  desiredOutcome:
    | "first_project"
    | "full_time_role"
    | "upskill"
    | "start_business"
    | "transition_role"
    | "exploring"
    | null;

  @Column({
    type: "enum",
    enum: [
      "technical_skills",
      "no_education",
      "dont_know_start",
      "imposter_syndrome",
      "time_constraints",
      "financial",
      "no_network",
      "age_concerns",
    ],
    nullable: true,
  })
  biggestObstacle:
    | "technical_skills"
    | "no_education"
    | "dont_know_start"
    | "imposter_syndrome"
    | "time_constraints"
    | "financial"
    | "no_network"
    | "age_concerns"
    | null;

  @Column({
    type: "enum",
    enum: [
      "free_resources",
      "online_course",
      "coaching",
      "done_with_you",
      "bootcamp",
      "exploring",
    ],
    nullable: true,
  })
  @Index()
  preferredSolution:
    | "free_resources"
    | "online_course"
    | "coaching"
    | "done_with_you"
    | "bootcamp"
    | "exploring"
    | null;

  @Column({ type: "text", nullable: true })
  additionalNotes: string | null; // Q19 open field

  // ================================
  // Individual Question Responses
  // ================================

  @Column({ type: "jsonb" })
  questionResponses: {
    q5_programming?: string;
    q6_education?: string;
    q7_tool_usage?: string;
    q8_time_commitment?: string;
    q9_portfolio?: string;
    q10_community?: string;
    q11_industry_news?: string;
    q12_prompt_engineering?: string;
    q13_ml_fundamentals?: string;
    q14_ai_ethics?: string;
    q15_current_situation?: string;
    q16_desired_outcome?: string;
    q17_biggest_obstacle?: string;
    q18_preferred_solution?: string;
    q19_additional_notes?: string;
  };

  @Column({ type: "jsonb", nullable: true })
  questionTimings: {
    // Time spent on each question in seconds
    [key: string]: number;
  } | null;

  // ================================
  // Lead Qualification
  // ================================

  @Column({
    type: "enum",
    enum: ["cold", "warm", "hot", "qualified"],
    default: "cold",
  })
  @Index()
  qualificationTier: "cold" | "warm" | "hot" | "qualified";

  @Column({ type: "varchar", length: 50 })
  recommendedNextStep: string; // e.g., "book_call", "join_workshop", "download_guide"

  @Column({ type: "int", default: 0 })
  leadScore: number; // 0-100 composite score (readiness + urgency + budget)

  // ================================
  // Conversion Tracking
  // ================================

  @Column({ type: "boolean", default: false })
  hasViewedResults: boolean;

  @Column({ type: "timestamp", nullable: true })
  resultsViewedAt: Date | null;

  @Column({ type: "boolean", default: false })
  hasClickedCTA: boolean;

  @Column({ type: "timestamp", nullable: true })
  ctaClickedAt: Date | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  ctaClicked: string | null; // Which CTA they clicked

  @Column({ type: "boolean", default: false })
  hasTakenAction: boolean; // Booked call, bought course, etc.

  @Column({ type: "timestamp", nullable: true })
  actionTakenAt: Date | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  actionType: string | null; // "booked_call", "purchased_course", etc.

  // ================================
  // Assessment Progress
  // ================================

  @Column({ type: "boolean", default: false })
  isComplete: boolean;

  @Column({ type: "int", default: 0 })
  questionsAnswered: number; // 0-15

  @Column({ type: "int", default: 0 })
  totalTimeSeconds: number; // Total time to complete

  @Column({ type: "timestamp", nullable: true })
  startedAt: Date | null;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date | null;

  // ================================
  // Follow-up & Sales
  // ================================

  @Column({ type: "boolean", default: false })
  emailSent: boolean;

  @Column({ type: "int", default: 0 })
  emailsSentCount: number;

  @Column({ type: "timestamp", nullable: true })
  lastEmailSentAt: Date | null;

  @Column({ type: "boolean", default: false })
  hasBeenContacted: boolean;

  @Column({ type: "timestamp", nullable: true })
  contactedAt: Date | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  contactedBy: string | null; // Admin user ID or "automated"

  @Column({ type: "text", nullable: true })
  salesNotes: string | null; // Admin notes

  @Column({
    type: "enum",
    enum: ["new", "contacted", "nurturing", "converted", "lost", "unsubscribed"],
    default: "new",
  })
  @Index()
  status: "new" | "contacted" | "nurturing" | "converted" | "lost" | "unsubscribed";

  // ================================
  // User Conversion
  // ================================

  @Column({ type: "uuid", nullable: true })
  @Index()
  convertedToUserId: string | null; // If they become a full user

  @Column({ type: "timestamp", nullable: true })
  convertedAt: Date | null;

  // ================================
  // Timestamps
  // ================================

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## Lead Scoring Algorithm (Composite)

### Formula
```typescript
leadScore = (readinessScore * 0.4) + (urgencyScore * 0.3) + (budgetScore * 0.3)
```

### Urgency Score (0-100)
Based on `desiredOutcome` and `additionalNotes`:

| Desired Outcome | Urgency Score |
|-----------------|---------------|
| first_project | 80 |
| full_time_role | 100 |
| upskill | 60 |
| start_business | 70 |
| transition_role | 50 |
| exploring | 20 |

**Bonus urgency points**:
- Mentions specific deadline in notes: +20
- "ASAP", "urgent", "soon" in notes: +10
- Laid off / job searching: +15

### Budget Score (0-100)
Based on `preferredSolution`:

| Preferred Solution | Budget Score |
|--------------------|--------------|
| free_resources | 10 |
| online_course | 40 |
| coaching | 70 |
| done_with_you | 90 |
| bootcamp | 100 |
| exploring | 20 |

**Bonus budget points**:
- Mentions "budget", "invest" in notes: +10
- Senior professional: +15
- Entrepreneur: +10

### Qualification Tier Assignment

```typescript
if (leadScore >= 80) {
  qualificationTier = "qualified"; // Hot, ready to buy
  recommendedNextStep = "book_strategy_call";
} else if (leadScore >= 60) {
  qualificationTier = "hot"; // Very interested
  recommendedNextStep = "join_workshop";
} else if (leadScore >= 40) {
  qualificationTier = "warm"; // Interested but barriers
  recommendedNextStep = "download_course_catalog";
} else {
  qualificationTier = "cold"; // Early stage
  recommendedNextStep = "download_free_guide";
}
```

---

## Database Indexes

### Primary Indexes (Already in Entity)
- `id` (Primary Key, UUID)
- `email` (Unique)
- `readinessScore`
- `scoreTier`
- `qualificationTier`
- `preferredSolution`
- `status`
- `convertedToUserId`
- `createdAt`

### Composite Indexes (Add in Migration)
```typescript
@Index(["status", "qualificationTier"])
@Index(["createdAt", "isComplete"])
@Index(["hasViewedResults", "hasClickedCTA"])
```

**Rationale**:
- Filter leads by status + tier for sales dashboard
- Find recent incomplete assessments
- Track conversion funnel drop-off

---

## Relationships to Existing Entities

### Optional: Link to UserEntity
If lead converts to full user:

```typescript
// In AssessmentLeadEntity
@ManyToOne(() => UserEntity, { nullable: true })
@JoinColumn({ name: "convertedToUserId" })
convertedToUser?: UserEntity;
```

### Future: Link to Campaigns
If you add email campaigns:

```typescript
@Entity("lead_campaigns")
export class LeadCampaignEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => AssessmentLeadEntity)
  lead: AssessmentLeadEntity;

  @Column()
  campaignName: string;

  @Column()
  emailSentAt: Date;

  @Column({ default: false })
  opened: boolean;

  @Column({ default: false })
  clicked: boolean;
}
```

---

## Migration File

```typescript
// src/migrations/1700000001000-CreateAssessmentLeadTables.ts

import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateAssessmentLeadTables1700000001000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "assessment_leads",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            default: "uuid_generate_v4()",
          },
          // Contact Info
          {
            name: "firstName",
            type: "varchar",
            length: "100",
          },
          {
            name: "lastName",
            type: "varchar",
            length: "100",
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "phone",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          {
            name: "smsOptIn",
            type: "boolean",
            default: false,
          },
          // Auto-captured
          {
            name: "ipAddress",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "location",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "country",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "deviceType",
            type: "varchar",
            length: "20",
            isNullable: true,
          },
          // UTM
          {
            name: "utmSource",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "utmMedium",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "utmCampaign",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "referrerUrl",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          // Scoring
          {
            name: "readinessScore",
            type: "int",
            default: 0,
          },
          {
            name: "scoreTier",
            type: "varchar",
            length: "20",
          },
          {
            name: "bonusPoints",
            type: "int",
            default: 0,
          },
          {
            name: "penaltyPoints",
            type: "int",
            default: 0,
          },
          {
            name: "finalScore",
            type: "int",
            default: 0,
          },
          // Big 5
          {
            name: "currentSituation",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "desiredOutcome",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "biggestObstacle",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "preferredSolution",
            type: "varchar",
            length: "50",
            isNullable: true,
          },
          {
            name: "additionalNotes",
            type: "text",
            isNullable: true,
          },
          // Question data
          {
            name: "questionResponses",
            type: "jsonb",
          },
          {
            name: "questionTimings",
            type: "jsonb",
            isNullable: true,
          },
          // Lead qualification
          {
            name: "qualificationTier",
            type: "varchar",
            length: "20",
            default: "'cold'",
          },
          {
            name: "recommendedNextStep",
            type: "varchar",
            length: "50",
          },
          {
            name: "leadScore",
            type: "int",
            default: 0,
          },
          // Conversion tracking
          {
            name: "hasViewedResults",
            type: "boolean",
            default: false,
          },
          {
            name: "resultsViewedAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "hasClickedCTA",
            type: "boolean",
            default: false,
          },
          {
            name: "ctaClickedAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "ctaClicked",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "hasTakenAction",
            type: "boolean",
            default: false,
          },
          {
            name: "actionTakenAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "actionType",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          // Progress
          {
            name: "isComplete",
            type: "boolean",
            default: false,
          },
          {
            name: "questionsAnswered",
            type: "int",
            default: 0,
          },
          {
            name: "totalTimeSeconds",
            type: "int",
            default: 0,
          },
          {
            name: "startedAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "completedAt",
            type: "timestamp",
            isNullable: true,
          },
          // Follow-up
          {
            name: "emailSent",
            type: "boolean",
            default: false,
          },
          {
            name: "emailsSentCount",
            type: "int",
            default: 0,
          },
          {
            name: "lastEmailSentAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "hasBeenContacted",
            type: "boolean",
            default: false,
          },
          {
            name: "contactedAt",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "contactedBy",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "salesNotes",
            type: "text",
            isNullable: true,
          },
          {
            name: "status",
            type: "varchar",
            length: "20",
            default: "'new'",
          },
          // User conversion
          {
            name: "convertedToUserId",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "convertedAt",
            type: "timestamp",
            isNullable: true,
          },
          // Timestamps
          {
            name: "createdAt",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      "assessment_leads",
      new TableIndex({
        name: "IDX_assessment_leads_email",
        columnNames: ["email"],
      })
    );

    await queryRunner.createIndex(
      "assessment_leads",
      new TableIndex({
        name: "IDX_assessment_leads_score",
        columnNames: ["readinessScore"],
      })
    );

    await queryRunner.createIndex(
      "assessment_leads",
      new TableIndex({
        name: "IDX_assessment_leads_status_tier",
        columnNames: ["status", "qualificationTier"],
      })
    );

    await queryRunner.createIndex(
      "assessment_leads",
      new TableIndex({
        name: "IDX_assessment_leads_created",
        columnNames: ["createdAt"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("assessment_leads");
  }
}
```

---

## Sample Data Queries

### Find Hot Leads from Last 7 Days
```sql
SELECT
  email,
  firstName,
  finalScore,
  leadScore,
  qualificationTier,
  recommendedNextStep,
  createdAt
FROM assessment_leads
WHERE
  qualificationTier IN ('hot', 'qualified')
  AND status = 'new'
  AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY leadScore DESC;
```

### Conversion Funnel Analysis
```sql
SELECT
  COUNT(*) as total_started,
  COUNT(CASE WHEN isComplete = true THEN 1 END) as completed,
  COUNT(CASE WHEN hasViewedResults = true THEN 1 END) as viewed_results,
  COUNT(CASE WHEN hasClickedCTA = true THEN 1 END) as clicked_cta,
  COUNT(CASE WHEN hasTakenAction = true THEN 1 END) as took_action,
  ROUND(
    100.0 * COUNT(CASE WHEN isComplete = true THEN 1 END) / COUNT(*),
    2
  ) as completion_rate
FROM assessment_leads
WHERE createdAt >= NOW() - INTERVAL '30 days';
```

### Lead Distribution by Score Tier
```sql
SELECT
  scoreTier,
  COUNT(*) as count,
  AVG(finalScore) as avg_score,
  AVG(leadScore) as avg_lead_score
FROM assessment_leads
WHERE isComplete = true
GROUP BY scoreTier
ORDER BY avg_score DESC;
```

---

**Last Updated**: 2025-10-18
**Status**: Planning Phase
**Next**: Add to TypeORM entities and create migration
