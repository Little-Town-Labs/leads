# Dynamic Results Page Logic

## Overview
The results page adapts content based on user responses to create a personalized experience. This document defines the logic for generating insights, recommendations, and CTAs.

---

## Score-Based Personalization

### Tier Labels & Descriptions

#### Red Tier (0-25%): "Significant Gaps Identified"
```typescript
{
  tier: 'red',
  label: 'Foundation Building Required',
  description: 'You have several gaps to address before you\'re ready for AI career opportunities. With dedicated effort, you could be prepared in 6-12 months.',
  timelineEstimate: '6-12 months',
  emoji: '📚',
  color: '#EF4444' // red-500
}
```

#### Yellow Tier (26-50%): "Building Your Foundation"
```typescript
{
  tier: 'yellow',
  label: 'On the Path - Keep Building',
  description: 'You\'re making progress but need 4-6 months of focused learning to become job-ready. The good news: you\'re asking the right questions.',
  timelineEstimate: '4-6 months',
  emoji: '⚡',
  color: '#F59E0B' // amber-500
}
```

#### Green Tier (51-75%): "Nearly Qualified"
```typescript
{
  tier: 'green',
  label: 'Nearly Qualified - Close the Gaps',
  description: 'You have a strong foundation and are closer than you think. With targeted effort, you could be job-ready in 2-3 months.',
  timelineEstimate: '2-3 months',
  emoji: '🚀',
  color: '#10B981' // green-500
}
```

#### Blue Tier (76-100%): "Highly Qualified"
```typescript
{
  tier: 'blue',
  label: 'Ready to Launch Your AI Career',
  description: 'You\'re well-prepared and could start applying for roles or taking on projects immediately. Let\'s help you land that first opportunity.',
  timelineEstimate: 'Ready now',
  emoji: '🎯',
  color: '#3B82F6' // blue-500
}
```

---

## Insight Generation Logic

### Insight Types
1. **Strength** - What they're doing well
2. **Gap** - What needs improvement
3. **Timeline** - Realistic timeframe
4. **Opportunity** - Next best action

### Rules for Generating 3 Insights

#### Always Include
1. One strength (positive reinforcement)
2. One gap (honest feedback)
3. One timeline or opportunity (actionable)

---

### Strength Insights

#### Programming Experience (Q5)
```typescript
if (q5_programming === 'Yes, proficient' || q5_programming === 'Yes, basic familiarity') {
  insights.push({
    type: 'strength',
    icon: '💻',
    title: 'Strong Technical Foundation',
    description: 'Your programming experience gives you a significant advantage. You already think like a developer, which is 50% of the battle in AI roles.'
  });
}
```

#### AI Tool Usage (Q7)
```typescript
if (q7_tool_usage === 'Daily') {
  insights.push({
    type: 'strength',
    icon: '🤖',
    title: 'AI-Native Mindset',
    description: 'You\'re already using AI tools daily, which means you understand their practical applications. This hands-on experience is invaluable.'
  });
}
```

#### Time Commitment (Q8)
```typescript
if (q8_time_commitment === 'Yes, 10+ hours/week' || q8_time_commitment === 'Yes, 5-10 hours/week') {
  insights.push({
    type: 'strength',
    icon: '⏰',
    title: 'Realistic Time Commitment',
    description: 'You have the time and commitment needed to make real progress. Consistency beats intensity in career transitions.'
  });
}
```

#### Community Involvement (Q10)
```typescript
if (q10_community === 'Very active' || q10_community === 'Moderately active') {
  insights.push({
    type: 'strength',
    icon: '🌐',
    title: 'Strong Network Building',
    description: 'You\'re already building your network in AI communities. Many opportunities come from connections, not job boards.'
  });
}
```

---

### Gap Insights

#### No Portfolio (Q9)
```typescript
if (q9_portfolio === 'No portfolio' && finalScore > 40) {
  insights.push({
    type: 'gap',
    icon: '📁',
    title: 'Portfolio Development Critical',
    description: 'You have the skills but need to showcase them. Build 3-5 projects that solve real problems. This is your #1 priority.',
    actionable: 'Start with one small project this week - an AI tool that solves a problem you personally have.'
  });
}
```

#### No Technical Skills (Q5)
```typescript
if (q5_programming === 'No, and not interested') {
  insights.push({
    type: 'gap',
    icon: '⚠️',
    title: 'Technical Skills Required',
    description: 'Most AI roles require at least basic programming knowledge. You\'ll need to address this gap to access the majority of AI career opportunities.',
    actionable: 'Consider AI Content Creator or AI Coach roles that require minimal coding.'
  });
}
```

#### Time Constraints (Q8)
```typescript
if (q8_time_commitment === 'Less than 3 hours/week' || q8_time_commitment === 'No time currently') {
  insights.push({
    type: 'gap',
    icon: '🕐',
    title: 'Time Commitment Gap',
    description: 'Career transitions require consistent effort. With less than 5 hours per week, progress will be very slow (12-18 months).',
    actionable: 'Start small: dedicate 30 minutes daily to learning. Consistency matters more than intensity.'
  });
}
```

#### No Industry Awareness (Q11)
```typescript
if (q11_industry_news === 'Rarely' || q11_industry_news === 'Never') {
  insights.push({
    type: 'gap',
    icon: '📰',
    title: 'Stay Current in Fast-Moving Field',
    description: 'AI evolves weekly. You need to follow industry trends to remain relevant and spot opportunities.',
    actionable: 'Subscribe to 2-3 AI newsletters (The Batch, TLDR AI) and spend 15 min daily reading.'
  });
}
```

---

### Timeline Insights

Based on final score and time commitment:

```typescript
function getTimelineInsight(finalScore: number, timeCommitment: string) {
  let months = 12;

  if (finalScore >= 76) months = 0; // Ready now
  else if (finalScore >= 51) months = 2;
  else if (finalScore >= 26) months = 4;
  else months = 6;

  // Adjust for time commitment
  if (timeCommitment === 'Less than 3 hours/week') {
    months *= 1.5;
  } else if (timeCommitment === 'Yes, 10+ hours/week') {
    months *= 0.75;
  }

  return {
    type: 'timeline',
    icon: '📅',
    title: 'Your Realistic Timeline',
    description: `With your current score (${finalScore}%) and time commitment, you could be job-ready in approximately ${Math.ceil(months)} months.`,
    actionable: months === 0
      ? 'Start applying to roles or taking on freelance projects this week.'
      : `Focus on high-impact activities: portfolio projects, networking, and skill-building in your top gap areas.`
  };
}
```

---

### Opportunity Insights

Based on desired outcome (Q16):

#### Full-Time Role
```typescript
if (q16_desired_outcome === 'full_time_role' && finalScore >= 60) {
  insights.push({
    type: 'opportunity',
    icon: '🎯',
    title: 'Job Market Opportunity',
    description: 'The AI job market is growing 3x faster than general tech. With your score, you\'re competitive for junior to mid-level roles.',
    actionable: 'Start customizing your resume for AI roles and engaging with recruiters on LinkedIn.'
  });
}
```

#### First Project
```typescript
if (q16_desired_outcome === 'first_project' && finalScore >= 50) {
  insights.push({
    type: 'opportunity',
    icon: '💼',
    title: 'Freelance Opportunity',
    description: 'AI freelancing is booming. Even with moderate skills, you can land $500-$2,000 projects on Upwork or Fiverr.',
    actionable: 'Create profiles on Upwork and Contra. Target "AI prompt optimization" or "ChatGPT integration" gigs.'
  });
}
```

---

## Next Step CTA Logic

### Decision Tree

```typescript
function getRecommendedCTA(
  qualificationTier: string,
  preferredSolution: string,
  finalScore: number
): CTAConfig {
  // Qualified tier (leadScore >= 80)
  if (qualificationTier === 'qualified') {
    if (preferredSolution === 'bootcamp' || preferredSolution === 'done_with_you') {
      return {
        type: 'book_premium_call',
        headline: 'You\'re 90% Ready - Let\'s Close the Final Gap',
        ctaText: 'Book Your 1-on-1 Strategy Call',
        ctaUrl: '/book-call?tier=qualified',
        description: 'In this complimentary 30-minute call, we\'ll create a custom plan to land your first AI role within 90 days.',
        benefits: [
          'Personalized gap analysis with AI career expert',
          'Custom 90-day action plan',
          'Resume review and positioning strategy',
          'Direct introductions to hiring partners (if qualified)'
        ],
        urgency: 'Limited to 5 calls per week',
        color: 'blue'
      };
    } else {
      return {
        type: 'join_accelerator',
        headline: 'You\'re Ready for the Accelerator',
        ctaText: 'Join AI Career Accelerator Program',
        ctaUrl: '/programs/accelerator',
        description: '8-week intensive program to land your AI role with coaching, portfolio projects, and job placement support.',
        benefits: [
          '8 live coaching sessions',
          '3 portfolio projects with code reviews',
          'Resume + LinkedIn optimization',
          'Interview prep and mock interviews',
          'Job placement assistance'
        ],
        pricing: 'Starting at $2,997 (payment plans available)',
        color: 'blue'
      };
    }
  }

  // Hot tier (leadScore 60-79)
  if (qualificationTier === 'hot') {
    return {
      type: 'join_workshop',
      headline: 'You\'re 70% Ready - Let\'s Close the Gaps Together',
      ctaText: 'Join Our Free AI Career Workshop',
      ctaUrl: '/workshop',
      description: 'Live 90-minute workshop where you\'ll learn exactly what to build, where to learn, and how to position yourself for AI roles.',
      benefits: [
        'Live gap analysis walkthrough',
        '90-day action plan template',
        'Portfolio project ideas tailored to your goals',
        'Q&A with AI career experts',
        'Bonus: Access to private community ($97 value)'
      ],
      nextSession: 'Next session: Thursday, Oct 24 at 2pm ET',
      color: 'green'
    };
  }

  // Warm tier (leadScore 40-59)
  if (qualificationTier === 'warm') {
    if (preferredSolution === 'online_course') {
      return {
        type: 'purchase_course',
        headline: 'Build Your Foundation with Our Course',
        ctaText: 'Get the AI Career Transition Course',
        ctaUrl: '/courses/transition',
        description: 'Self-paced course with 6 modules covering technical skills, portfolio building, and job search strategy.',
        benefits: [
          '40+ video lessons (8 hours content)',
          '10 hands-on projects with solutions',
          'AI tools cheat sheet and templates',
          'Private community access',
          'Lifetime updates'
        ],
        pricing: '$197 (One-time payment)',
        guarantee: '30-day money-back guarantee',
        color: 'amber'
      };
    } else {
      return {
        type: 'download_roadmap',
        headline: 'Get Your Personalized Roadmap',
        ctaText: 'Download Free AI Career Roadmap',
        ctaUrl: '/download/roadmap',
        description: 'Detailed PDF roadmap showing exactly what to learn, build, and do to become job-ready in your timeframe.',
        benefits: [
          'Custom learning path based on your assessment',
          'Week-by-week action plan',
          'Resource links (courses, tools, communities)',
          'Project ideas tailored to your background',
          'Bonus: Skills gap checklist'
        ],
        followUp: 'Plus: Get weekly tips via email to stay on track',
        color: 'amber'
      };
    }
  }

  // Cold tier (leadScore < 40)
  return {
    type: 'watch_training',
    headline: 'Start with the Fundamentals',
    ctaText: 'Watch Free AI Career Foundations Training',
    ctaUrl: '/training/foundations',
    description: '45-minute video training covering the essentials of breaking into AI careers without a technical background.',
    benefits: [
      'Understand the AI career landscape',
      'Learn which roles match your background',
      'Get the 5-step framework for career transitions',
      'See real case studies of successful transitions'
    ],
    followUp: 'After watching, you\'ll receive a free beginner\'s guide via email',
    color: 'gray'
  };
}
```

---

## Secondary CTA Options

### For All Tiers

Always offer a secondary, lower-commitment option:

```typescript
function getSecondaryCTA(primaryType: string): CTAConfig {
  const secondaryOptions = {
    book_premium_call: {
      type: 'download_roadmap',
      ctaText: 'Not ready? Download Your Free Roadmap',
      ctaUrl: '/download/roadmap',
    },
    join_accelerator: {
      type: 'book_call',
      ctaText: 'Schedule a Free Consultation First',
      ctaUrl: '/book-call?tier=consultation',
    },
    join_workshop: {
      type: 'watch_recording',
      ctaText: 'Can\'t make it live? Watch the Recording',
      ctaUrl: '/workshop/recording',
    },
    purchase_course: {
      type: 'preview_course',
      ctaText: 'Preview the Course for Free',
      ctaUrl: '/courses/transition/preview',
    },
    download_roadmap: {
      type: 'join_newsletter',
      ctaText: 'Join Our Newsletter Instead',
      ctaUrl: '/newsletter',
    },
    watch_training: {
      type: 'read_guide',
      ctaText: 'Prefer Reading? Get the Free Guide',
      ctaUrl: '/guide/ai-careers-101',
    },
  };

  return secondaryOptions[primaryType];
}
```

---

## Additional Resources Section

Based on their biggest obstacle (Q17):

```typescript
function getRecommendedResources(biggestObstacle: string) {
  const resourceMap = {
    technical_skills: [
      {
        title: 'Free: Python for Beginners (Codecademy)',
        url: 'https://codecademy.com/python',
        type: 'course',
        duration: '25 hours'
      },
      {
        title: 'Free: AI For Everyone (Andrew Ng)',
        url: 'https://coursera.org/ai-for-everyone',
        type: 'course',
        duration: '10 hours'
      }
    ],
    dont_know_start: [
      {
        title: 'Guide: The Complete AI Career Roadmap',
        url: '/guides/complete-roadmap',
        type: 'guide',
        description: 'Step-by-step guide from zero to job-ready'
      },
      {
        title: 'Video: Choosing Your AI Career Path',
        url: '/videos/choose-path',
        type: 'video',
        duration: '15 min'
      }
    ],
    imposter_syndrome: [
      {
        title: 'Article: Overcoming Imposter Syndrome in Tech',
        url: '/blog/imposter-syndrome',
        type: 'article'
      },
      {
        title: 'Join: AI Career Changers Community',
        url: '/community',
        type: 'community',
        description: 'Connect with 500+ people in the same boat'
      }
    ],
    time_constraints: [
      {
        title: 'Guide: Learning AI with 1 Hour Per Day',
        url: '/guides/1-hour-daily',
        type: 'guide'
      }
    ],
    financial: [
      {
        title: 'List: 50 Free AI Learning Resources',
        url: '/resources/free',
        type: 'resource-list'
      }
    ],
    no_network: [
      {
        title: 'Guide: Building Your AI Network from Zero',
        url: '/guides/networking',
        type: 'guide'
      },
      {
        title: 'Join: Weekly AI Career Office Hours',
        url: '/office-hours',
        type: 'community'
      }
    ]
  };

  return resourceMap[biggestObstacle] || [];
}
```

---

## Results Page Layout Structure

```typescript
interface ResultsPageData {
  // Header section
  header: {
    firstName: string;
    finalScore: number;
    scoreTier: 'red' | 'yellow' | 'green' | 'blue';
    tierLabel: string;
    tierDescription: string;
    emoji: string;
  };

  // Score breakdown
  scoreBreakdown: {
    readinessScore: number;
    bonusPoints: number;
    penaltyPoints: number;
    totalScore: number;
  };

  // Three insights
  insights: Array<{
    type: 'strength' | 'gap' | 'timeline' | 'opportunity';
    icon: string;
    title: string;
    description: string;
    actionable?: string;
  }>;

  // Primary CTA
  primaryCTA: CTAConfig;

  // Secondary CTA
  secondaryCTA: CTAConfig;

  // Recommended resources
  resources: Array<{
    title: string;
    url: string;
    type: string;
    description?: string;
    duration?: string;
  }>;

  // Next steps section
  nextSteps: {
    immediate: string[]; // 3-5 action items for this week
    short_term: string[]; // 3-5 action items for this month
    resources: string[]; // Links to learn more
  };
}
```

---

## Personalization Variables

### Available for Templates

```typescript
interface PersonalizationVars {
  // User data
  firstName: string;
  currentSituation: string;
  desiredOutcome: string;
  biggestObstacle: string;
  timelineEstimate: string;

  // Scores
  finalScore: number;
  scoreTier: string;
  tierLabel: string;

  // Qualification
  qualificationTier: string;
  leadScore: number;

  // Question responses
  hasProgramming: boolean;
  hasPortfolio: boolean;
  usesAIDaily: boolean;
  timeCommitment: string;
  preferredSolution: string;

  // Calculated
  topStrength: string;
  topGap: string;
  monthsToReady: number;
}
```

### Usage in Copy

```typescript
const personalizedHeadline = `${firstName}, you scored ${finalScore}% - ${tierLabel}`;

const personalizedTimeline = `With your ${timeCommitment} commitment, you could be ready in ${monthsToReady} months.`;

const personalizedAction = hasProgramming
  ? "Focus on building your portfolio with 3-5 projects."
  : "Start with free Python courses to build your technical foundation.";
```

---

## A/B Testing Variants

### CTA Button Text
Test these variations:

**Control**:
- "Get Started Now"

**Variants**:
- "Show Me How to Close My Gaps"
- "Build My Custom Roadmap"
- "Book My Strategy Call"
- "Join the Workshop"

### Headlines
Test score emphasis vs. action emphasis:

**Score Focus**:
- "You Scored 67% - Here's What That Means"

**Action Focus**:
- "You're 2-3 Months Away from an AI Career"

**Urgency Focus**:
- "Your Gaps Are Closing - Don't Wait"

---

**Last Updated**: 2025-10-18
**Status**: Planning Phase
**Next**: Use this logic when building results page component
