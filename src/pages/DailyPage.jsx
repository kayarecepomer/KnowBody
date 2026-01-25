import React, { useState, useEffect } from 'react';
import { Flame } from 'lucide-react';
import DataInput from '../components/DataInput';
import DailyGrade from '../components/DailyGrade';
import { getTodayData, getStreakData } from '../utils/storage';
import { getStreakColor, getStreakMessage } from '../services/streakService';
import { updateStreakWithGrade, calculateDailyGrade } from '../services/grading';

/**
 * DailyPage - Main page showing today's health metrics and grade
 */
function DailyPage() {
  const [todayData, setTodayData] = useState(null);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Load today's data on mount and set up refresh
  useEffect(() => {
    loadTodayData();
    
    // Refresh data every 10 seconds to reflect new inputs
    const interval = setInterval(loadTodayData, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadTodayData = () => {
    const data = getTodayData();
    setTodayData(data);
    
    // Update streak if we have data
    if (data) {
      const today = new Date().toISOString().split('T')[0];
      const grade = calculateDailyGrade(data);
      updateStreakWithGrade(today, grade.letter);
    }
    
    // Load streak data
    const streakData = getStreakData();
    if (streakData) {
      setCurrentStreak(streakData.currentStreak);
    }
  };

  const streakColor = getStreakColor(currentStreak);
  const streakMessage = getStreakMessage(currentStreak);

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Daily Health Tracking</h1>
      <p style={styles.pageDescription}>
        Track your daily health metrics and see how you're doing today
      </p>
      
      {/* Streak Display */}
      <div style={{...styles.streakCard, borderColor: streakColor}}>
        <Flame size={40} color={streakColor} />
        <div style={styles.streakContent}>
          <div style={styles.streakNumber}>{currentStreak}</div>
          <div style={styles.streakLabel}>Day Streak</div>
        </div>
      </div>
      
      <DataInput onDataSaved={loadTodayData} />
      
      <DailyGrade dayData={todayData} />
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  pageTitle: {
    textAlign: 'center',
    color: '#333',
    fontSize: '2em',
    marginBottom: '10px'
  },
  pageDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: '1.1em',
    marginBottom: '30px'
  },
  streakCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    maxWidth: '500px',
    margin: '0 auto 30px auto',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '3px solid',
    justifyContent: 'center'
  },
  streakContent: {
    textAlign: 'center'
  },
  streakNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#333',
    lineHeight: '1'
  },
  streakLabel: {
    fontSize: '16px',
    color: '#666',
    fontWeight: '600',
    marginTop: '5px'
  }
};

export default DailyPage;
