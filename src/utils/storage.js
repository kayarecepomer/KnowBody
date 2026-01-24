/**
 * Local Storage Utility
 * Handles storing and retrieving health data from browser local storage
 */

const STORAGE_KEY = 'healthTrackerData';

/**
 * Save health data for a specific date
 * @param {Object} data - Health data to save
 */
export function saveHealthData(data) {
  try {
    const existingData = getAllHealthData();
    
    // Update or add new entry
    const dataIndex = existingData.findIndex(entry => entry.date === data.date);
    
    if (dataIndex >= 0) {
      existingData[dataIndex] = data;
    } else {
      existingData.push(data);
    }
    
    // Sort by date (newest first)
    existingData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
    
    return true;
  } catch (error) {
    console.error('Error saving health data:', error);
    throw error;
  }
}

/**
 * Get all health data from storage
 * @returns {Array} Array of health data entries
 */
export function getAllHealthData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving health data:', error);
    return [];
  }
}

/**
 * Get health data for a specific date range
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Array} Filtered health data
 */
export function getHealthDataByDateRange(startDate, endDate) {
  const allData = getAllHealthData();
  
  return allData.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= new Date(startDate) && entryDate <= new Date(endDate);
  });
}

/**
 * Get health data for the current week
 * @returns {Array} Current week's health data
 */
export function getCurrentWeekData() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return getHealthDataByDateRange(
    startOfWeek.toISOString().split('T')[0],
    endOfWeek.toISOString().split('T')[0]
  );
}

/**
 * Get health data for the last N weeks
 * @param {number} weeks - Number of weeks to retrieve
 * @returns {Array} Array of arrays, each containing a week's data
 */
export function getLastNWeeksData(weeks = 4) {
  const today = new Date();
  const weeksData = [];
  
  for (let i = 0; i < weeks; i++) {
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() - (i * 7));
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    
    const weekData = getHealthDataByDateRange(
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    );
    
    weeksData.push(weekData);
  }
  
  return weeksData;
}

/**
 * Clear all health data from storage
 */
export function clearAllHealthData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing health data:', error);
    throw error;
  }
}

/**
 * Export health data as JSON
 * @returns {string} JSON string of all health data
 */
export function exportHealthData() {
  const data = getAllHealthData();
  return JSON.stringify(data, null, 2);
}

/**
 * Import health data from JSON
 * @param {string} jsonData - JSON string of health data
 */
export function importHealthData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format');
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error importing health data:', error);
    throw error;
  }
}

/**
 * Get health data for a specific date
 * @param {string} date - Date in ISO format (YYYY-MM-DD)
 * @returns {Object|null} Health data for the date or null if not found
 */
export function getHealthDataByDate(date) {
  const allData = getAllHealthData();
  return allData.find(entry => entry.date === date) || null;
}

/**
 * Get health data for the current month
 * @returns {Array} Current month's health data
 */
export function getCurrentMonthData() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  
  return getHealthDataByDateRange(
    startOfMonth.toISOString().split('T')[0],
    endOfMonth.toISOString().split('T')[0]
  );
}

/**
 * Get today's health data
 * @returns {Object|null} Today's health data or null if not found
 */
export function getTodayData() {
  const today = new Date().toISOString().split('T')[0];
  return getHealthDataByDate(today);
}
