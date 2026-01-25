/**
 * Streak Service
 * Handles streak calculations and management
 * Streak is maintained with A- or higher (A-, A, A+, S)
 * Streak breaks with B+ or lower
 */

/**
 * Check if a grade qualifies for streak continuation
 * @param {string} letterGrade - Letter grade (e.g., 'A-', 'B+')
 * @returns {boolean} True if grade maintains streak
 */
export function isStreakGrade(letterGrade) {
  const streakGrades = ['A-', 'A', 'A+', 'S', 'S+'];
  return streakGrades.includes(letterGrade);
}

/**
 * Calculate streak data from historical grade data
 * @param {Array} gradeHistory - Array of {date, grade} objects sorted by date
 * @returns {Object} Streak data with current streak, longest streak, and history
 */
export function calculateStreakData(gradeHistory = []) {
  if (!gradeHistory || gradeHistory.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakHistory: [],
      lastGradeDate: null
    };
  }

  // Sort by date (oldest first) for streak calculation
  const sortedHistory = [...gradeHistory].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const streakHistory = [];

  // Calculate streaks
  sortedHistory.forEach((entry) => {
    const isStreak = isStreakGrade(entry.grade);
    
    if (isStreak) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }

    streakHistory.push({
      date: entry.date,
      grade: entry.grade,
      streakDay: isStreak
    });
  });

  // Current streak is the streak at the most recent date
  const mostRecentEntry = sortedHistory[sortedHistory.length - 1];
  
  // Calculate current streak by going backwards from the most recent entry
  for (let i = sortedHistory.length - 1; i >= 0; i--) {
    if (isStreakGrade(sortedHistory[i].grade)) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakHistory,
    lastGradeDate: mostRecentEntry.date
  };
}

/**
 * Get streak statistics for display
 * @param {Object} streakData - Streak data object
 * @returns {Object} Formatted streak statistics
 */
export function getStreakStats(streakData) {
  const { currentStreak, longestStreak, streakHistory } = streakData;
  
  // Count total streak days
  const totalStreakDays = streakHistory.filter(day => day.streakDay).length;
  
  // Calculate streak percentage
  const streakPercentage = streakHistory.length > 0
    ? Math.round((totalStreakDays / streakHistory.length) * 100)
    : 0;

  return {
    currentStreak,
    longestStreak,
    totalStreakDays,
    streakPercentage,
    totalDaysTracked: streakHistory.length
  };
}

/**
 * Get streak message based on current streak
 * @param {number} currentStreak - Current streak count
 * @returns {string} Motivational message
 */
export function getStreakMessage(currentStreak) {
  if (currentStreak === 0) {
    return "Start your health streak today! Achieve A- or higher to begin.";
  } else if (currentStreak === 1) {
    return "Great start! Keep going to build your streak.";
  } else if (currentStreak < 7) {
    return `${currentStreak} days strong! You're building healthy habits.`;
  } else if (currentStreak < 30) {
    return `Amazing! ${currentStreak} day streak! Keep up the excellent work.`;
  } else if (currentStreak < 100) {
    return `Incredible! ${currentStreak} day streak! You're a health champion!`;
  } else {
    return `Legendary! ${currentStreak} day streak! You're an inspiration!`;
  }
}

/**
 * Get color for streak display based on streak count
 * @param {number} streak - Streak count
 * @returns {string} Hex color code
 */
export function getStreakColor(streak) {
  if (streak === 0) return '#9E9E9E'; // Gray
  if (streak < 7) return '#4CAF50'; // Green
  if (streak < 30) return '#FF9800'; // Orange
  if (streak < 100) return '#9C27B0'; // Purple
  return '#F44336'; // Red (fire/hot streak)
}
