import React, { useState, useEffect } from 'react';
import DataInput from '../components/DataInput';
import DailyGrade from '../components/DailyGrade';
import { getTodayData } from '../utils/storage';

/**
 * DailyPage - Main page showing today's health metrics and grade
 */
function DailyPage() {
  const [todayData, setTodayData] = useState(null);

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
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Daily Health Tracking</h1>
      <p style={styles.pageDescription}>
        Track your daily health metrics and see how you're doing today
      </p>
      
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
  }
};

export default DailyPage;
