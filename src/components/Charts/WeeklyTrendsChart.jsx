import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * WeeklyTrendsChart - Displays weekly health trends
 * Visualizes metrics over time using line charts
 */
function WeeklyTrendsChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Weekly Trends</h3>
        <p style={styles.noData}>No data available. Start tracking to see your trends!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Weekly Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="waterGlasses" 
            stroke="#2196F3" 
            name="Water (glasses)" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="alcoholDrinks" 
            stroke="#FF9800" 
            name="Alcohol (drinks)" 
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="cigarettes" 
            stroke="#F44336" 
            name="Cigarettes" 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    margin: '20px auto',
    maxWidth: '800px'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    padding: '40px'
  }
};

export default WeeklyTrendsChart;
