import React, { useState, useEffect } from 'react';
import './App.css';
import DataInput from './components/DataInput';
import WeeklyGrade from './components/WeeklyGrade';
import AlertsPanel from './components/AlertsPanel';
import WeeklyTrendsChart from './components/Charts/WeeklyTrendsChart';
import { getCurrentWeekData } from './utils/storage';
import { generateAlerts } from './services/research';
import { Activity } from 'lucide-react';

function App() {
  const [weekData, setWeekData] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Load data on mount and set up refresh
  useEffect(() => {
    loadWeekData();
    
    // Refresh data every minute
    const interval = setInterval(loadWeekData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadWeekData = () => {
    const data = getCurrentWeekData();
    setWeekData(data);
    
    // Generate alerts based on week data
    const newAlerts = generateAlerts(data);
    setAlerts(newAlerts);
  };

  return (
    <div className="App">
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Activity size={40} color="#4CAF50" />
          <h1 style={styles.title}>Health Tracker</h1>
        </div>
        <p style={styles.subtitle}>Research-based health tracking for better living</p>
      </header>

      <main style={styles.main}>
        <DataInput />
        
        <WeeklyGrade weekData={weekData} />
        
        <AlertsPanel alerts={alerts} />
        
        <WeeklyTrendsChart data={weekData} />
      </main>

      <footer style={styles.footer}>
        <p>Built for ConUHacksX | All recommendations based on medical research</p>
      </footer>
    </div>
  );
}

const styles = {
  header: {
    backgroundColor: '#282c34',
    padding: '30px 20px',
    color: 'white',
    textAlign: 'center'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px'
  },
  title: {
    margin: 0,
    fontSize: '2.5em'
  },
  subtitle: {
    margin: '10px 0 0 0',
    fontSize: '1.1em',
    color: '#aaa'
  },
  main: {
    minHeight: 'calc(100vh - 250px)',
    backgroundColor: '#f0f0f0',
    padding: '20px'
  },
  footer: {
    backgroundColor: '#282c34',
    padding: '20px',
    color: 'white',
    textAlign: 'center',
    fontSize: '0.9em'
  }
};

export default App;
