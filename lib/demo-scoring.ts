interface QuizResponse {
  questionNumber: number;
  answer: unknown;
  pointsEarned: number;
}

interface ProductFitResult {
  score: number; // 0-100
  tier: 'great-fit' | 'good-fit' | 'not-ready';
  totalPoints: number;
  maxPossiblePoints: number;
  breakdown: {
    volume: number;
    team: number;
    pain: number;
    readiness: number;
  };
}

export function calculateProductFitScore(
  responses: QuizResponse[]
): ProductFitResult {
  // Calculate total points earned
  const totalPoints = responses.reduce((sum, r) => sum + (r.pointsEarned || 0), 0);

  // Calculate max possible points based on demo quiz structure
  // Q2: Lead volume (weight: 2, max score: 5) = 10 points
  // Q3: Team size (weight: 1, max score: 5) = 5 points
  // Q4: Biggest challenge (weight: 3, max score: 5) = 15 points
  // Q5: Current tools (weight: 1, max per option: 3, assume 4 selections) = 12 points
  // Q6: Research time (weight: 2, max score: 5) = 10 points
  // Q7: Deal size (weight: 2, max score: 5) = 10 points
  // Q8: Timeline (weight: 2, max score: 5) = 10 points
  // Q9: Budget (weight: 2, max score: 5) = 10 points
  // Q10: Decision drivers (weight: 2, max score: 5) = 10 points
  // Total max possible: 92 points
  const maxPossiblePoints = 92;

  // Calculate percentage
  const score = Math.min(100, Math.round((totalPoints / maxPossiblePoints) * 100));

  // Determine tier
  let tier: 'great-fit' | 'good-fit' | 'not-ready';
  if (score >= 70) {
    tier = 'great-fit';
  } else if (score >= 40) {
    tier = 'good-fit';
  } else {
    tier = 'not-ready';
  }

  // Calculate breakdown by category
  const breakdown = {
    volume: responses.find(r => r.questionNumber === 2)?.pointsEarned || 0,
    team: responses.find(r => r.questionNumber === 3)?.pointsEarned || 0,
    pain: responses.find(r => r.questionNumber === 4)?.pointsEarned || 0,
    readiness: responses
      .filter(r => [6, 7, 8, 9].includes(r.questionNumber))
      .reduce((sum, r) => sum + (r.pointsEarned || 0), 0),
  };

  return {
    score,
    tier,
    totalPoints,
    maxPossiblePoints,
    breakdown,
  };
}
