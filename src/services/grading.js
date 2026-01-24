/**
 * Health Grading Service
 * Calculates weekly health grades based on metrics
 * Uses research-based scoring system
 */

/**
 * Calculate weekly health grade from user data
 * @param {Array} weekData - Array of daily health data for the week
 * @returns {Object} Grade object with letter, score, breakdown, and recommendation
 */
export function calculateWeeklyGrade(weekData = []) {
  if (!weekData || weekData.length === 0) {
    return {
      letter: 'N/A',
      score: 0,
      breakdown: {
        hydration: 0,
        alcohol: 0,
        smoking: 0,
        activity: 0
      },
      recommendation: 'Start tracking your health metrics to get a grade!'
    };
  }

  // Calculate scores for each category (25 points each)
  const hydrationScore = calculateHydrationScore(weekData);
  const alcoholScore = calculateAlcoholScore(weekData);
  const smokingScore = calculateSmokingScore(weekData);
  const activityScore = calculateActivityScore(weekData);

  const totalScore = hydrationScore + alcoholScore + smokingScore + activityScore;
  const letter = getLetterGrade(totalScore);
  const recommendation = getRecommendation(totalScore, {
    hydration: hydrationScore,
    alcohol: alcoholScore,
    smoking: smokingScore,
    activity: activityScore
  });

  return {
    letter,
    score: Math.round(totalScore),
    breakdown: {
      hydration: Math.round(hydrationScore),
      alcohol: Math.round(alcoholScore),
      smoking: Math.round(smokingScore),
      activity: Math.round(activityScore)
    },
    recommendation
  };
}

/**
 * Calculate hydration score (0-25 points)
 * Research: Adults should drink 8 glasses of water per day
 */
function calculateHydrationScore(weekData) {
  const totalWater = weekData.reduce((sum, day) => sum + (day.waterGlasses || 0), 0);
  const avgWater = totalWater / weekData.length;
  
  // Full points for 8+ glasses per day
  const score = Math.min(25, (avgWater / 8) * 25);
  return score;
}

/**
 * Calculate alcohol moderation score (0-25 points)
 * Research: Moderation is <2 drinks per day for men, <1 for women
 */
function calculateAlcoholScore(weekData) {
  const totalAlcohol = weekData.reduce((sum, day) => sum + (day.alcoholDrinks || 0), 0);
  const avgAlcohol = totalAlcohol / weekData.length;
  
  // Full points for 0 drinks, reduced for >1.5 drinks per day
  if (avgAlcohol === 0) return 25;
  if (avgAlcohol <= 1.5) return 20;
  if (avgAlcohol <= 3) return 15;
  if (avgAlcohol <= 5) return 10;
  return 5;
}

/**
 * Calculate smoking score (0-25 points)
 * Research: No safe level of smoking
 */
function calculateSmokingScore(weekData) {
  const totalCigarettes = weekData.reduce((sum, day) => sum + (day.cigarettes || 0), 0);
  
  // Full points for no smoking
  if (totalCigarettes === 0) return 25;
  if (totalCigarettes <= 7) return 15; // Less than 1 per day
  if (totalCigarettes <= 35) return 10; // Less than 5 per day
  return 5;
}

/**
 * Calculate activity score (0-25 points)
 * Research: 10,000 steps per day is recommended
 */
function calculateActivityScore(weekData) {
  const totalSteps = weekData.reduce((sum, day) => sum + (day.steps || 0), 0);
  const avgSteps = totalSteps / weekData.length;
  
  // Full points for 10,000+ steps per day
  const score = Math.min(25, (avgSteps / 10000) * 25);
  return score;
}

/**
 * Convert numeric score to letter grade
 */
function getLetterGrade(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

/**
 * Generate personalized recommendation based on scores
 */
function getRecommendation(totalScore, breakdown) {
  const weakest = Object.entries(breakdown).reduce((a, b) => a[1] < b[1] ? a : b);
  
  const recommendations = {
    hydration: 'Focus on drinking more water. Aim for 8 glasses per day to stay properly hydrated.',
    alcohol: 'Consider reducing alcohol intake. Moderate consumption is key to better health.',
    smoking: 'Smoking has significant health impacts. Consider seeking support to quit or reduce.',
    activity: 'Increase your daily activity. Aim for 10,000 steps per day for optimal health.'
  };

  if (totalScore >= 90) {
    return 'Excellent work! Keep maintaining these healthy habits.';
  } else if (totalScore >= 80) {
    return `Good progress! ${recommendations[weakest[0]]}`;
  } else if (totalScore >= 70) {
    return `There's room for improvement. ${recommendations[weakest[0]]}`;
  } else {
    return `Let's work on your health together. ${recommendations[weakest[0]]}`;
  }
}

/**
 * Calculate daily health grade from single day data
 * @param {Object} dayData - Single day's health data
 * @returns {Object} Grade object with letter, score, breakdown, and recommendation
 */
export function calculateDailyGrade(dayData) {
  if (!dayData) {
    return {
      letter: 'N/A',
      score: 0,
      breakdown: {
        hydration: 0,
        alcohol: 0,
        smoking: 0,
        activity: 0
      },
      recommendation: 'Enter your daily metrics to get a grade!'
    };
  }

  // Calculate scores for each category (25 points each)
  const hydrationScore = calculateDailyHydrationScore(dayData);
  const alcoholScore = calculateDailyAlcoholScore(dayData);
  const smokingScore = calculateDailySmokingScore(dayData);
  const activityScore = calculateDailyActivityScore(dayData);

  const totalScore = hydrationScore + alcoholScore + smokingScore + activityScore;
  const letter = getLetterGrade(totalScore);
  const recommendation = getRecommendation(totalScore, {
    hydration: hydrationScore,
    alcohol: alcoholScore,
    smoking: smokingScore,
    activity: activityScore
  });

  return {
    letter,
    score: Math.round(totalScore),
    breakdown: {
      hydration: Math.round(hydrationScore),
      alcohol: Math.round(alcoholScore),
      smoking: Math.round(smokingScore),
      activity: Math.round(activityScore)
    },
    recommendation
  };
}

/**
 * Calculate daily hydration score (0-25 points)
 */
function calculateDailyHydrationScore(dayData) {
  const water = dayData.waterGlasses || 0;
  return Math.min(25, (water / 8) * 25);
}

/**
 * Calculate daily alcohol moderation score (0-25 points)
 */
function calculateDailyAlcoholScore(dayData) {
  const alcohol = dayData.alcoholDrinks || 0;
  
  if (alcohol === 0) return 25;
  if (alcohol <= 1.5) return 20;
  if (alcohol <= 3) return 15;
  if (alcohol <= 5) return 10;
  return 5;
}

/**
 * Calculate daily smoking score (0-25 points)
 */
function calculateDailySmokingScore(dayData) {
  const cigarettes = dayData.cigarettes || 0;
  
  if (cigarettes === 0) return 25;
  if (cigarettes <= 1) return 15;
  if (cigarettes <= 5) return 10;
  return 5;
}

/**
 * Calculate daily activity score (0-25 points)
 */
function calculateDailyActivityScore(dayData) {
  const steps = dayData.steps || 0;
  return Math.min(25, (steps / 10000) * 25);
}

/**
 * Get enhanced color for grade letter
 * @param {string} letterGrade - Letter grade (e.g., 'A+', 'B-', 'F')
 * @returns {string} Hex color code
 */
export function getGradeColor(letterGrade) {
  if (letterGrade === 'S+') return '#1B5E20'; // Dark green
  if (letterGrade.startsWith('A')) return '#4CAF50'; // Green
  if (letterGrade.startsWith('B')) return '#FFC107'; // Yellow
  if (letterGrade.startsWith('C')) return '#FF9800'; // Orange
  if (letterGrade.startsWith('D')) return '#F44336'; // Red
  if (letterGrade === 'F') return '#B71C1C'; // Dark red
  return '#9E9E9E'; // Gray for N/A
}
