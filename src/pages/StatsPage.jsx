import React, { useState, useEffect } from 'react';
import WeeklyGrade from '../components/WeeklyGrade';
import MonthlyCalendar from '../components/MonthlyCalendar';
import AlertsPanel from '../components/AlertsPanel';
import WeeklyTrendsChart from '../components/Charts/WeeklyTrendsChart';
import { getCurrentWeekData, getCurrentMonthData } from '../utils/storage';
import { generateAlerts } from '../services/research';

/**
 * StatsPage - Statistics page showing monthly calendar, weekly trends, and alerts
 */
function StatsPage() {
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Load data on mount and set up refresh
  useEffect(() => {
    loadData();
    
    // Refresh data every minute
    const interval = setInterval(loadData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const week = getCurrentWeekData();
    const month = getCurrentMonthData();
    
    setWeekData(week);
    setMonthData(month);
    
    // Generate alerts based on week data
    const newAlerts = generateAlerts(week);
    setAlerts(newAlerts);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Health Statistics</h1>
      <p style={styles.pageDescription}>
        View your comprehensive health statistics, trends, and monthly progress
      </p>
      
      <MonthlyCalendar monthData={monthData} />
      
      <WeeklyGrade weekData={weekData} />
      
      <AlertsPanel alerts={alerts} />
      
      <WeeklyTrendsChart data={weekData} />
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

export default StatsPage;
