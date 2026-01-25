import React, { useState, useEffect } from 'react';
import { Flame, Trophy, TrendingUp, Calendar } from 'lucide-react';
import StreakCalendar from '../components/StreakCalendar';
import { getStreakData } from '../utils/storage';
import { getStreakStats, getStreakMessage, getStreakColor } from '../services/streakService';

/**
 * StreakPage - Main page displaying streak statistics and calendar
 * Shows current streak, longest streak, and Duolingo-style calendar
 */
function StreakPage() {
  const [streakData, setStreakData] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStreakData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadStreakData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStreakData = () => {
    const data = getStreakData();
    
    if (data) {
      setStreakData(data);
      setStats(getStreakStats(data));
    } else {
      // Initialize with empty data
      setStreakData({
        currentStreak: 0,
        longestStreak: 0,
        streakHistory: [],
        lastGradeDate: null
      });
      setStats({
        currentStreak: 0,
        longestStreak: 0,
        totalStreakDays: 0,
        streakPercentage: 0,
        totalDaysTracked: 0
      });
    }
  };

  if (!stats) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Loading...</h1>
      </div>
    );
  }

  const streakMessage = getStreakMessage(stats.currentStreak);
  const streakColor = getStreakColor(stats.currentStreak);

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>🔥 Your Health Streak</h1>
      <p style={styles.pageDescription}>
        Maintain A- or higher grades to keep your streak alive!
      </p>

      {/* Current Streak Display */}
      <div style={{...styles.currentStreakCard, borderColor: streakColor}}>
        <Flame size={60} color={streakColor} />
        <div style={styles.streakNumber}>{stats.currentStreak}</div>
        <div style={styles.streakLabel}>Day Streak</div>
        <p style={styles.streakMessage}>{streakMessage}</p>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Trophy size={40} color="#FFD700" />
          <div style={styles.statNumber}>{stats.longestStreak}</div>
          <div style={styles.statLabel}>Longest Streak</div>
        </div>

        <div style={styles.statCard}>
          <TrendingUp size={40} color="#4CAF50" />
          <div style={styles.statNumber}>{stats.totalStreakDays}</div>
          <div style={styles.statLabel}>Total Streak Days</div>
        </div>

        <div style={styles.statCard}>
          <Calendar size={40} color="#2196F3" />
          <div style={styles.statNumber}>{stats.streakPercentage}%</div>
          <div style={styles.statLabel}>Success Rate</div>
        </div>
      </div>

      {/* Streak Calendar */}
      <StreakCalendar streakHistory={streakData?.streakHistory || []} />

      {/* Tips Section */}
      <div style={styles.tipsCard}>
        <h3 style={styles.tipsTitle}>Tips to Maintain Your Streak:</h3>
        <ul style={styles.tipsList}>
          <li>Drink 8 glasses of water daily for full hydration points</li>
          <li>Limit alcohol consumption to maintain high scores</li>
          <li>Avoid smoking - there's no safe level</li>
          <li>Aim for 10,000 steps per day for optimal activity points</li>
          <li>Track your metrics daily to see consistent progress</li>
        </ul>
      </div>
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
    fontSize: '2.5em',
    marginBottom: '10px'
  },
  pageDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: '1.2em',
    marginBottom: '30px'
  },
  currentStreakCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '30px',
    border: '4px solid',
    transition: 'transform 0.2s'
  },
  streakNumber: {
    fontSize: '96px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: '10px',
    lineHeight: '1'
  },
  streakLabel: {
    fontSize: '24px',
    color: '#666',
    fontWeight: '600',
    marginTop: '10px'
  },
  streakMessage: {
    fontSize: '18px',
    color: '#666',
    marginTop: '20px',
    fontStyle: 'italic'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s'
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#333',
    marginTop: '15px'
  },
  statLabel: {
    fontSize: '16px',
    color: '#666',
    marginTop: '10px',
    fontWeight: '600'
  },
  tipsCard: {
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    padding: '25px',
    marginTop: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  tipsTitle: {
    color: '#1976d2',
    marginBottom: '15px',
    fontSize: '20px'
  },
  tipsList: {
    color: '#1565c0',
    lineHeight: '1.8',
    paddingLeft: '25px'
  }
};

export default StreakPage;
