import React from 'react';

/**
 * StreakCalendar - Duolingo-style calendar showing streak history
 * Displays days with successful streaks (A- or higher) and broken streaks
 * Now shows only the current week and hides days without data
 */
function StreakCalendar({ streakHistory = [] }) {
  // Get the last 7 days for display (current week)
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  };

  const days = getLast7Days();
  
  // Create a map for quick lookup
  const historyMap = new Map();
  streakHistory.forEach(entry => {
    historyMap.set(entry.date, entry);
  });

  // Filter to only show days with data
  const daysWithData = days.filter(date => historyMap.has(date));

  // If no data at all, show message
  if (daysWithData.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>This Week's Streak</h3>
        <div style={styles.noData}>
          <p>No tracked days this week yet.</p>
          <p>Start tracking your health metrics to see your streak!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>This Week's Streak</h3>
      
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendBox, backgroundColor: '#4CAF50'}}></div>
          <span>Streak day (A- or higher)</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendBox, backgroundColor: '#FFC107'}}></div>
          <span>No streak (B+ or lower)</span>
        </div>
      </div>

      <div style={styles.calendar}>
        <div style={styles.week}>
          {daysWithData.map((date) => {
            const entry = historyMap.get(date);
            const isStreak = entry.streakDay;
            const backgroundColor = isStreak ? '#4CAF50' : '#FFC107';
            
            const dateObj = new Date(date);
            const dayOfMonth = dateObj.getDate();
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            
            return (
              <div
                key={date}
                style={{
                  ...styles.dayCard
                }}
                title={`${date}: ${entry.grade}`}
              >
                <div style={styles.dayName}>{dayName}</div>
                <div
                  style={{
                    ...styles.day,
                    backgroundColor
                  }}
                >
                  <span style={styles.dayNumber}>{dayOfMonth}</span>
                </div>
                <div style={styles.gradeLabel}>{entry.grade}</div>
              </div>
            );
          })}
        </div>
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
    marginBottom: '20px',
    fontSize: '1.5em'
  },
  noData: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    fontSize: '16px'
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '25px',
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
  week: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    flexWrap: 'wrap'
  },
  dayCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    minWidth: '80px'
  },
  dayName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    textAlign: 'center'
  },
  day: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  dayNumber: {
    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
  },
  gradeLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center'
  }
};

export default StreakCalendar;
