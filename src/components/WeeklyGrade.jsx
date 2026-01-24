import React from 'react';
import { calculateWeeklyGrade } from '../services/grading';

/**
 * WeeklyGrade - Displays the user's weekly health grade
 * Shows letter grade (A+, B-, etc.) and score breakdown
 */
function WeeklyGrade({ weekData }) {
  const grade = calculateWeeklyGrade(weekData);

  const getGradeColor = (letterGrade) => {
    if (letterGrade.startsWith('A')) return '#4CAF50';
    if (letterGrade.startsWith('B')) return '#8BC34A';
    if (letterGrade.startsWith('C')) return '#FFC107';
    if (letterGrade.startsWith('D')) return '#FF9800';
    return '#F44336';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Your Weekly Health Grade</h2>
      
      <div style={{
        ...styles.gradeDisplay,
        backgroundColor: getGradeColor(grade.letter)
      }}>
        <div style={styles.gradeLetter}>{grade.letter}</div>
        <div style={styles.gradeScore}>{grade.score} / 100</div>
      </div>

      <div style={styles.breakdown}>
        <h3 style={styles.breakdownTitle}>Score Breakdown</h3>
        
        <div style={styles.metricRow}>
          <span style={styles.metricLabel}>Hydration:</span>
          <span style={styles.metricValue}>{grade.breakdown.hydration}/25</span>
        </div>

        <div style={styles.metricRow}>
          <span style={styles.metricLabel}>Alcohol Moderation:</span>
          <span style={styles.metricValue}>{grade.breakdown.alcohol}/25</span>
        </div>

        <div style={styles.metricRow}>
          <span style={styles.metricLabel}>Smoking:</span>
          <span style={styles.metricValue}>{grade.breakdown.smoking}/25</span>
        </div>

        <div style={styles.metricRow}>
          <span style={styles.metricLabel}>Activity:</span>
          <span style={styles.metricValue}>{grade.breakdown.activity}/25</span>
        </div>
      </div>

      <div style={styles.recommendation}>
        <strong>Recommendation:</strong> {grade.recommendation}
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
    maxWidth: '500px',
    margin: '20px auto'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  gradeDisplay: {
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
    color: 'white',
    marginBottom: '20px'
  },
  gradeLetter: {
    fontSize: '72px',
    fontWeight: 'bold',
    lineHeight: '1'
  },
  gradeScore: {
    fontSize: '24px',
    marginTop: '10px'
  },
  breakdown: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  breakdownTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#555'
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e0e0e0'
  },
  metricLabel: {
    color: '#666'
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#333'
  },
  recommendation: {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    color: '#1976d2',
    lineHeight: '1.6'
  }
};

export default WeeklyGrade;
