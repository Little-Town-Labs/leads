# Quick Start Guide

## For the Impatient Developer

Want to get started immediately? Follow this minimal path to get a working prototype.

---

## 30-Minute MVP

### Goal
Get a basic assessment working with database storage and score calculation.

### Steps

#### 1. Create the Entity (5 min)
```bash
# Create new file
touch src/entities/AssessmentLeadEntity.ts
```

Copy the entity definition from `03-DATABASE-SCHEMA.md` into this file.

Add to `src/lib/data-source.ts`:
```typescript
import { AssessmentLeadEntity } from "@/entities/AssessmentLeadEntity";

// In DataSource entities array:
entities: [
  UserEntity,
  CareerRoleEntity,
  // ... other entities
  AssessmentLeadEntity, // ADD THIS
],
```

#### 2. Create Migration (2 min)
```bash
npm run typeorm migration:create src/migrations/CreateAssessmentLeadTables
```

Copy migration code from `03-DATABASE-SCHEMA.md`.

Run migration:
```bash
npm run typeorm migration:run
```

#### 3. Create Scoring Helper (10 min)
```bash
touch src/lib/assessment-scoring.ts
```

Minimal implementation:
```typescript
export function calculateReadinessScore(responses: any): number {
  // Simple: count "best" answers, multiply by 10
  // Full implementation in documentation
  let score = 0;
  // Q5-Q14 scoring logic here
  return Math.min(100, score);
}

export function getScoreTier(score: number) {
  if (score >= 76) return 'blue';
  if (score >= 51) return 'green';
  if (score >= 26) return 'yellow';
  return 'red';
}
```

#### 4. Create Basic API Endpoint (10 min)
```bash
mkdir -p src/app/api/assessment
touch src/app/api/assessment/start/route.ts
```

```typescript
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data-source";
import { AssessmentLeadEntity } from "@/entities/AssessmentLeadEntity";

export async function POST(request: Request) {
  const { email, firstName, lastName } = await request.json();

  const repo = await getRepository(AssessmentLeadEntity);

  // Check if exists
  const existing = await repo.findOne({ where: { email } });
  if (existing && !existing.isComplete) {
    return NextResponse.json({ leadId: existing.id });
  }

  // Create new
  const lead = repo.create({
    email,
    firstName,
    lastName,
    startedAt: new Date(),
  });

  await repo.save(lead);

  return NextResponse.json({ leadId: lead.id });
}
```

#### 5. Test It (3 min)
```bash
npm run dev
```

Use Postman or curl:
```bash
curl -X POST http://localhost:3000/api/assessment/start \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"John","lastName":"Doe"}'
```

Should return: `{"leadId":"uuid-here"}`

✅ **You now have a working assessment backend!**

---

## 2-Hour Working Prototype

### Add These Features

#### 6. Complete Assessment Endpoint (20 min)
```bash
touch src/app/api/assessment/[leadId]/complete/route.ts
```

See `04-API-SPECIFICATION.md` for full implementation.

#### 7. Simple Results Page (30 min)
```bash
touch src/app/assessment/results/[leadId]/page.tsx
```

Minimal version:
```typescript
export default async function ResultsPage({ params }: { params: { leadId: string } }) {
  const response = await fetch(`/api/assessment/results/${params.leadId}`);
  const { lead, results } = await response.json();

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1>Your AI Career Readiness Score</h1>
      <div className="text-6xl font-bold">{lead.finalScore}%</div>
      <p>{results.scoreDescription}</p>
      {/* Add insights and CTAs */}
    </div>
  );
}
```

#### 8. Simple Quiz Page (40 min)
Use React Hook Form to build multi-step form.

See full implementation in `05-IMPLEMENTATION-PLAN.md` Phase 3.

#### 9. Update Landing Page (30 min)
Replace redirect in `src/app/page.tsx` with simple CTA:

```typescript
export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">
          Are you ready for an AI career?
        </h1>
        <p className="text-xl mb-8">
          Take our 5-minute assessment to find out
        </p>
        <a
          href="/assessment/start"
          className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg"
        >
          Start Free Assessment
        </a>
      </div>
    </div>
  );
}
```

✅ **You now have an end-to-end working prototype!**

---

## Recommended Order of Implementation

If you have more time, follow this order:

### Phase 1: Backend (1-2 days)
1. ✅ Database entity + migration
2. ✅ Scoring helper functions
3. ✅ API endpoints (start, progress, complete, results)
4. ✅ Validation schemas (Zod)
5. ✅ Test all endpoints

### Phase 2: Assessment Flow (2-3 days)
1. Quiz page with React Hook Form
2. Multi-step wizard component
3. Progress bar
4. Auto-save functionality
5. Question components (radio, text, etc.)

### Phase 3: Results & Landing (2-3 days)
1. Results page with score visualization
2. Dynamic insights generation
3. Personalized CTA logic
4. Landing page redesign
5. Make everything responsive

### Phase 4: Admin & Email (2-3 days)
1. Admin dashboard (leads list)
2. Lead detail view
3. Analytics page
4. Email templates
5. Automated nurture sequence

### Phase 5: Optimization (ongoing)
1. A/B testing
2. Performance improvements
3. Bug fixes
4. UX refinements

---

## Key Files Reference

### Must Create
```
src/entities/AssessmentLeadEntity.ts
src/lib/assessment-scoring.ts
src/lib/validations/assessment.ts
src/app/api/assessment/start/route.ts
src/app/api/assessment/[leadId]/complete/route.ts
src/app/api/assessment/results/[leadId]/route.ts
src/app/assessment/start/page.tsx
src/app/assessment/results/[leadId]/page.tsx
```

### Must Modify
```
src/lib/data-source.ts (add entity)
src/app/page.tsx (replace redirect)
```

---

## Common Issues & Solutions

### Issue: Migration Fails
**Solution**:
- Check DATABASE_URL is correct
- Ensure uuid-ossp extension exists: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- Check for typos in column types

### Issue: Entity Not Found
**Solution**:
- Ensure entity is added to data-source.ts entities array
- Restart dev server after adding entity
- Check imports are correct

### Issue: CORS Errors
**Solution**:
- API routes should automatically work in Next.js
- If using external client, add CORS headers in route handler

### Issue: Email Already Exists
**Solution**:
- This is expected behavior
- Return existing leadId if assessment incomplete
- If complete, create new assessment or show error

---

## Testing Checklist

### Backend
- [ ] Can create new lead
- [ ] Can save progress
- [ ] Can complete assessment
- [ ] Score calculates correctly
- [ ] Can retrieve results
- [ ] Email uniqueness enforced
- [ ] Invalid leadId returns 404

### Frontend
- [ ] Landing page loads
- [ ] CTA links to quiz
- [ ] Quiz accepts input
- [ ] Progress bar updates
- [ ] Can submit quiz
- [ ] Results page displays score
- [ ] Results are personalized
- [ ] Mobile responsive

### Integration
- [ ] End-to-end flow works
- [ ] Auto-save persists data
- [ ] Browser back button works
- [ ] Can resume incomplete assessment
- [ ] Email sent after completion (if implemented)

---

## Performance Targets

### API Response Times
- Start assessment: < 200ms
- Save progress: < 100ms
- Complete assessment: < 500ms (includes scoring)
- Get results: < 300ms

### Page Load Times
- Landing page: < 1s (LCP)
- Quiz page: < 1.5s
- Results page: < 2s

### Database
- Assessment lead table: < 10ms query time
- Indexed fields: email, createdAt, qualificationTier

---

## Next Steps After MVP

1. **Add Email Automation**
   - Send results email
   - Nurture sequence

2. **Build Admin Dashboard**
   - View all leads
   - Filter and sort
   - Analytics charts

3. **Optimize Conversion**
   - A/B test hooks
   - Improve CTA copy
   - Add social proof

4. **Scale Marketing**
   - Run paid ads
   - SEO optimization
   - Content marketing

---

## Getting Help

### Documentation
- `00-OVERVIEW.md` - High-level strategy
- `01-STRATEGY.md` - Copywriting and marketing
- `02-ASSESSMENT-QUESTIONS.md` - Question design
- `03-DATABASE-SCHEMA.md` - Database structure
- `04-API-SPECIFICATION.md` - Complete API docs
- `05-IMPLEMENTATION-PLAN.md` - Detailed roadmap

### Code Examples
All documentation includes code examples you can copy-paste.

### Debugging
- Check browser console for errors
- Check Vercel/Netlify logs for server errors
- Use `console.log` liberally during development
- Test API endpoints with Postman/curl first

---

**Last Updated**: 2025-10-18
**Ready to Start?** → Begin with Phase 1, Task 1.1 (Database Setup)
