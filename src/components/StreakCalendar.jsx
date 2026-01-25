import React from 'react';

/**
 * StreakCalendar - Duolingo-style calendar showing streak history
 * Displays days with successful streaks (A- or higher) and broken streaks
 */
function StreakCalendar({ streakHistory = [] }) {
  // Get the last 90 days for display
  const getLast90Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const days = getLast90Days();
  
  // Create a map for quick lookup
  const historyMap = new Map();
  streakHistory.forEach(entry => {
    historyMap.set(entry.date, entry);
  });

  // Group days by week
  const weeks = [];
  let currentWeek = [];
  
  days.forEach((date, index) => {
    currentWeek.push(date);
    
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Last 90 Days</h3>
      
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendBox, backgroundColor: '#4CAF50'}}></div>
          <span>Streak day (A- or higher)</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendBox, backgroundColor: '#FFC107'}}></div>
          <span>No streak (B+ or lower)</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendBox, backgroundColor: '#e0e0e0'}}></div>
          <span>No data</span>
        </div>
      </div>

      <div style={styles.calendar}>
        <div style={styles.weekLabels}>
          <div style={styles.weekLabel}>Sun</div>
          <div style={styles.weekLabel}>Mon</div>
          <div style={styles.weekLabel}>Tue</div>
          <div style={styles.weekLabel}>Wed</div>
          <div style={styles.weekLabel}>Thu</div>
          <div style={styles.weekLabel}>Fri</div>
          <div style={styles.weekLabel}>Sat</div>
        </div>
        
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} style={styles.week}>
            {week.map((date) => {
              const entry = historyMap.get(date);
              const hasData = entry !== undefined;
              const isStreak = hasData && entry.streakDay;
              
              let backgroundColor = '#e0e0e0'; // No data
              if (hasData) {
                backgroundColor = isStreak ? '#4CAF50' : '#FFC107';
              }
              
              const dayOfMonth = new Date(date).getDate();
              
              return (
                <div
                  key={date}
                  style={{
                    ...styles.day,
                    backgroundColor
                  }}
                  title={hasData ? `${date}: ${entry.grade}` : `${date}: No data`}
                >
                  <span style={styles.dayNumber}>{dayOfMonth}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  legendBox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px'
  },
  calendar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  weekLabels: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px',
    marginBottom: '5px'
  },
  weekLabel: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#666'
  },
  week: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px'
  },
  day: {
    aspectRatio: '1',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white'
  },
  dayNumber: {
    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
  }
};

export default StreakCalendar;
