/**
 * Scoring algorithm for Help Desk Assessment Quiz
 * Calculates readiness score and determines lead tier
 */

export interface QuizResponseData {
  questionId: string;
  questionNumber: number;
  answer: any;
  pointsEarned: number;
}

export interface ScoringResult {
  totalPoints: number;
  maxPossiblePoints: number;
  readinessScore: number; // 0-100 percentage
  tier: 'cold' | 'warm' | 'hot' | 'qualified';
  breakdown: {
    contactInfo: number;
    currentState: number;
    goals: number;
    readiness: number;
  };
}

/**
 * Max possible score from seed data: 699 points
 * Scoring tiers:
 * - COLD (0-39%): 0-272 points
 * - WARM (40-59%): 279-412 points
 * - HOT (60-79%): 419-552 points
 * - QUALIFIED (80-100%): 559-699 points
 */
const MAX_POSSIBLE_POINTS = 699;

export function calculateScore(responses: QuizResponseData[]): ScoringResult {
  // Sum up all points earned
  const totalPoints = responses.reduce((sum, response) => sum + response.pointsEarned, 0);

  // Calculate percentage score (0-100)
  const readinessScore = Math.round((totalPoints / MAX_POSSIBLE_POINTS) * 100);

  // Determine tier based on percentage
  let tier: 'cold' | 'warm' | 'hot' | 'qualified';
  if (readinessScore >= 80) {
    tier = 'qualified';
  } else if (readinessScore >= 60) {
    tier = 'hot';
  } else if (readinessScore >= 40) {
    tier = 'warm';
  } else {
    tier = 'cold';
  }

  // Calculate breakdown by category
  const breakdown = calculateBreakdown(responses);

  return {
    totalPoints,
    maxPossiblePoints: MAX_POSSIBLE_POINTS,
    readinessScore,
    tier,
    breakdown,
  };
}

function calculateBreakdown(responses: QuizResponseData[]) {
  // Question categories:
  // Q1-3: Contact & Company Info (baseline qualification)
  // Q4-8: Current State Assessment (pain & scale)
  // Q9-11: Goals & Strategic Fit (sophistication)
  // Q12-16: Readiness Indicators (buying signals)

  const contactInfo = responses
    .filter((r) => r.questionNumber >= 1 && r.questionNumber <= 3)
    .reduce((sum, r) => sum + r.pointsEarned, 0);

  const currentState = responses
    .filter((r) => r.questionNumber >= 4 && r.questionNumber <= 8)
    .reduce((sum, r) => sum + r.pointsEarned, 0);

  const goals = responses
    .filter((r) => r.questionNumber >= 9 && r.questionNumber <= 11)
    .reduce((sum, r) => sum + r.pointsEarned, 0);

  const readiness = responses
    .filter((r) => r.questionNumber >= 12 && r.questionNumber <= 16)
    .reduce((sum, r) => sum + r.pointsEarned, 0);

  return {
    contactInfo,
    currentState,
    goals,
    readiness,
  };
}

/**
 * Extract contact information from quiz responses
 */
export function extractContactInfo(responses: QuizResponseData[]) {
  // Question 1 is contact_info type
  const contactResponse = responses.find((r) => r.questionNumber === 1);

  if (!contactResponse || typeof contactResponse.answer !== 'object') {
    return {
      name: '',
      email: '',
      company: '',
      phone: '',
      jobTitle: '',
    };
  }

  const answer = contactResponse.answer as Record<string, string>;

  return {
    name: answer.full_name || '',
    email: answer.email || '',
    company: answer.company || '',
    phone: answer.phone || '',
    jobTitle: answer.job_title || '',
  };
}

/**
 * Get human-readable tier description
 */
export function getTierDescription(tier: string): string {
  switch (tier) {
    case 'qualified':
      return 'High Priority - Ready to Buy';
    case 'hot':
      return 'Strong Fit - Near-Term Opportunity';
    case 'warm':
      return 'Potential Fit - Mid-Term Nurture';
    case 'cold':
      return 'Early Stage - Long-Term Nurture';
    default:
      return 'Unknown';
  }
}

/**
 * Determine which action to take based on tier
 */
export function getTierAction(tier: string): {
  action: 'ai_workflow' | 'nurture' | 'manual_review';
  description: string;
} {
  switch (tier) {
    case 'qualified':
    case 'hot':
      return {
        action: 'ai_workflow',
        description: 'Trigger AI research workflow and personalized outreach',
      };
    case 'warm':
      return {
        action: 'nurture',
        description: 'Add to warm lead nurture sequence',
      };
    case 'cold':
      return {
        action: 'nurture',
        description: 'Add to cold lead nurture sequence',
      };
    default:
      return {
        action: 'manual_review',
        description: 'Manual review required',
      };
  }
}
