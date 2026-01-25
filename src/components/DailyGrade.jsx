import React from 'react';
import { calculateDailyGrade, getGradeColor } from '../services/grading';

/**
 * DailyGrade - Displays the user's daily health grade
 * Shows letter grade (A+, B-, etc.) and score breakdown for a single day
 */
function DailyGrade({ dayData }) {
  const grade = calculateDailyGrade(dayData);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Today's Health Grade</h2>
      
      <div style={{
        ...styles.gradeDisplay,
        backgroundColor: getGradeColor(grade.letter)
      }}>
        <div style={styles.gradeLetter}>{grade.letter}</div>
        <div style={styles.gradeScore}>{grade.score} / 100</div>
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
    marginBottom: '20px',
    fontSize: '1.5em'
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
  recommendation: {
    padding: '15px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    color: '#1976d2',
    lineHeight: '1.6',
    fontSize: '16px'
  }
};

export default DailyGrade;
