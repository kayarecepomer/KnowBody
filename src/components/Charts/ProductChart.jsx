import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * ProductChart - Individual chart for a single health metric
 * Shows 1 week history with color-coded background based on trend
 */
function ProductChart({ title, data, dataKey, isHarmful, emoji }) {
  // Calculate trend (average change)
  const calculateTrend = () => {
    if (!data || data.length < 2) return 0;
    
    const values = data.map(d => d[dataKey] || 0);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
  };

  const trend = calculateTrend();
  
  // For harmful products (cigarettes, alcohol), going down is good
  // For beneficial products (water), going up is good
  const isImproving = isHarmful ? trend < 0 : trend > 0;
  
  // Background color based on trend
  const backgroundColor = isImproving ? '#e8f5e9' : '#ffebee';
  
  // Message based on trend
  const getMessage = () => {
    const avgValue = data.reduce((sum, d) => sum + (d[dataKey] || 0), 0) / data.length;
    
    if (isHarmful) {
      if (avgValue === 0) {
        return '🎉 Perfect! Keep it up!';
      } else if (isImproving) {
        return '📉 Great progress! You\'re reducing consumption.';
      } else {
        return '⚠️ Try to reduce this for better health.';
      }
    } else {
      if (avgValue >= 8) {
        return '💪 Excellent hydration! Keep it up!';
      } else if (isImproving) {
        return '📈 Good progress! Keep increasing.';
      } else {
        return '💧 Try to drink more water daily.';
      }
    }
  };

  // Don't show suggestion for heart rate chart
  const showMessage = dataKey !== 'heartRate';

  return (
    <div style={{...styles.container, backgroundColor}}>
      <div style={styles.header}>
        <span style={styles.emoji}>{emoji}</span>
        <h3 style={styles.title}>{title}</h3>
      </div>
      
      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
              // Invert Y-axis for harmful products to show reduction as going "up"
              reversed={isHarmful}
            />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={isImproving ? '#4CAF50' : '#f44336'} 
              strokeWidth={2}
              dot={{ fill: isImproving ? '#4CAF50' : '#f44336', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {showMessage && (
        <div style={styles.message}>
          {getMessage()}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
  },
  emoji: {
    fontSize: '32px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333'
  },
  chartContainer: {
    flex: 1,
    marginBottom: '15px'
  },
  message: {
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    padding: '10px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: '8px'
  }
};

export default ProductChart;
