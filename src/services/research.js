/**
 * Research-based Recommendation Service
 * Provides health recommendations based on med student-curated research
 */

import researchCitations from '../data/research-citations.json';

/**
 * Get research-based recommendations for user's health data
 * @param {Object} healthData - User's health data
 * @returns {Array} Array of recommendation objects
 */
export function getRecommendations(healthData) {
  const recommendations = [];

  // Hydration recommendations
  if (healthData.waterGlasses < 6) {
    recommendations.push({
      category: 'hydration',
      severity: 'medium',
      title: 'Increase Water Intake',
      message: 'You\'re drinking less than the recommended 8 glasses of water per day.',
      research: researchCitations.hydration,
      action: 'Aim for 8 glasses of water daily for optimal hydration.'
    });
  }

  // Alcohol recommendations
  if (healthData.alcoholDrinks > 2) {
    recommendations.push({
      category: 'alcohol',
      severity: 'high',
      title: 'Reduce Alcohol Consumption',
      message: 'Your alcohol intake exceeds moderate consumption guidelines.',
      research: researchCitations.alcohol,
      action: 'Limit alcohol to 1-2 drinks per day or less for better health outcomes.'
    });
  }

  // Smoking recommendations
  if (healthData.cigarettes > 0) {
    recommendations.push({
      category: 'smoking',
      severity: 'high',
      title: 'Smoking Cessation Recommended',
      message: 'Any amount of smoking has significant health risks.',
      research: researchCitations.smoking,
      action: 'Consider seeking support to quit smoking. Resources are available to help.'
    });
  }

  return recommendations;
}

/**
 * Get alerts based on health anomalies
 * @param {Array} weekData - Week of health data
 * @returns {Array} Array of alert objects
 */
export function generateAlerts(weekData) {
  const alerts = [];

  if (!weekData || weekData.length === 0) {
    return alerts;
  }

  // Calculate averages
  const avgWater = weekData.reduce((sum, day) => sum + (day.waterGlasses || 0), 0) / weekData.length;
  const avgAlcohol = weekData.reduce((sum, day) => sum + (day.alcoholDrinks || 0), 0) / weekData.length;
  const totalCigarettes = weekData.reduce((sum, day) => sum + (day.cigarettes || 0), 0);

  // Dehydration alert
  if (avgWater < 4) {
    alerts.push({
      severity: 'high',
      title: 'Dehydration Risk',
      message: 'Your water intake is significantly below recommended levels this week.',
      recommendation: 'Increase water intake immediately. Carry a water bottle to remind yourself.'
    });
  }

  // Excessive alcohol alert
  if (avgAlcohol > 3) {
    alerts.push({
      severity: 'high',
      title: 'Excessive Alcohol Consumption',
      message: 'Your alcohol consumption is above safe limits and may pose health risks.',
      recommendation: 'Consider reducing alcohol intake. Speak with a healthcare provider if needed.'
    });
  }

  // Smoking alert
  if (totalCigarettes > 7) {
    alerts.push({
      severity: 'high',
      title: 'Smoking Health Risk',
      message: `You smoked ${totalCigarettes} cigarettes this week, increasing health risks.`,
      recommendation: 'Quitting smoking is one of the best things you can do for your health.'
    });
  }

  // Positive reinforcement
  if (avgWater >= 8 && avgAlcohol <= 1 && totalCigarettes === 0) {
    alerts.push({
      severity: 'low',
      title: 'Great Progress!',
      message: 'You\'re meeting all your health goals this week!',
      recommendation: 'Keep up the excellent work maintaining these healthy habits.'
    });
  }

  return alerts;
}

/**
 * Compare current week with previous weeks
 * @param {Array} currentWeek - Current week data
 * @param {Array} previousWeeks - Previous weeks data
 * @returns {Object} Comparison results
 */
export function compareWeeks(currentWeek, previousWeeks) {
  if (!currentWeek || !previousWeeks || previousWeeks.length === 0) {
    return null;
  }

  const currentAvg = calculateWeekAverage(currentWeek);
  const previousAvg = calculateWeekAverage(previousWeeks.flat());

  return {
    waterChange: ((currentAvg.water - previousAvg.water) / previousAvg.water) * 100,
    alcoholChange: ((currentAvg.alcohol - previousAvg.alcohol) / previousAvg.alcohol) * 100,
    smokingChange: ((currentAvg.smoking - previousAvg.smoking) / previousAvg.smoking) * 100,
    improvement: calculateOverallImprovement(currentAvg, previousAvg)
  };
}

/**
 * Calculate average metrics for a week
 */
function calculateWeekAverage(weekData) {
  const total = weekData.reduce((acc, day) => ({
    water: acc.water + (day.waterGlasses || 0),
    alcohol: acc.alcohol + (day.alcoholDrinks || 0),
    smoking: acc.smoking + (day.cigarettes || 0)
  }), { water: 0, alcohol: 0, smoking: 0 });

  return {
    water: total.water / weekData.length,
    alcohol: total.alcohol / weekData.length,
    smoking: total.smoking / weekData.length
  };
}

/**
 * Calculate overall improvement percentage
 */
function calculateOverallImprovement(current, previous) {
  const waterImprovement = (current.water - previous.water) / 8; // Normalized to 8 glasses target
  const alcoholImprovement = (previous.alcohol - current.alcohol) / 2; // Normalized to 2 drinks limit
  const smokingImprovement = (previous.smoking - current.smoking) / 1; // Normalized to 0 target

  return ((waterImprovement + alcoholImprovement + smokingImprovement) / 3) * 100;
}
