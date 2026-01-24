import React from 'react';
import { calculateDailyGrade, getGradeColor } from '../services/grading';

/**
 * MonthlyCalendar - Displays a calendar with daily grades
 * Shows the current month with color-coded grades for each day
 */
function MonthlyCalendar({ monthData }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  // Get first and last day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Month name
  const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Create array of day objects
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ isEmpty: true, key: `empty-${i}` });
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    const dayData = monthData.find(entry => entry.date === dateStr);
    const grade = dayData ? calculateDailyGrade(dayData) : null;
    
    days.push({
      day,
      dateStr,
      grade,
      isToday: day === today.getDate() && month === today.getMonth(),
      hasData: !!dayData,
      key: `day-${day}`
    });
  }
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{monthName}</h2>
      
      <div style={styles.calendar}>
        {/* Week day headers */}
        <div style={styles.weekRow}>
          {weekDays.map(day => (
            <div key={day} style={styles.weekDayHeader}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div style={styles.daysGrid}>
          {days.map(dayObj => {
            if (dayObj.isEmpty) {
              return <div key={dayObj.key} style={styles.emptyDay}></div>;
            }
            
            const dayStyle = {
              ...styles.day,
              ...(dayObj.isToday ? styles.today : {}),
              ...(dayObj.grade ? {
                backgroundColor: getGradeColor(dayObj.grade.letter),
                color: 'white'
              } : {})
            };
            
            return (
              <div key={dayObj.key} style={dayStyle}>
                <div style={styles.dayNumber}>{dayObj.day}</div>
                {dayObj.grade && (
                  <div style={styles.dayGrade}>{dayObj.grade.letter}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div style={styles.legend}>
        <h3 style={styles.legendTitle}>Grade Colors</h3>
        <div style={styles.legendItems}>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#1B5E20'}}></div>
            <span>S+</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#4CAF50'}}></div>
            <span>A+/A/A-</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#FFC107'}}></div>
            <span>B+/B/B-</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#FF9800'}}></div>
            <span>C+/C/C-</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#F44336'}}></div>
            <span>D+/D/D-</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendColor, backgroundColor: '#B71C1C'}}></div>
            <span>F</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    margin: '20px auto'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  calendar: {
    marginBottom: '20px'
  },
  weekRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px',
    marginBottom: '10px'
  },
  weekDayHeader: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#666',
    padding: '10px',
    fontSize: '14px'
  },
  daysGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '5px'
  },
  emptyDay: {
    aspectRatio: '1',
    minHeight: '80px'
  },
  day: {
    aspectRatio: '1',
    minHeight: '80px',
    padding: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    position: 'relative'
  },
  today: {
    border: '3px solid #2196F3',
    fontWeight: 'bold'
  },
  dayNumber: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  dayGrade: {
    fontSize: '20px',
    fontWeight: 'bold'
  },
  legend: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px'
  },
  legendTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#555'
  },
  legendItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px'
  },
  legendColor: {
    width: '30px',
    height: '20px',
    borderRadius: '4px'
  }
};

export default MonthlyCalendar;
