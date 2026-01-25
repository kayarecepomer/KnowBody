import React, { useState, useEffect } from 'react';
import ProductChart from '../components/Charts/ProductChart';
import { getAllHealthData } from '../utils/storage';

/**
 * StatsPage - Statistics page showing individual product charts and additional stats
 */
function StatsPage() {
  const [chartData, setChartData] = useState([]);

  // Load data on mount and set up refresh
  useEffect(() => {
    loadData();
    
    // Refresh data every minute
    const interval = setInterval(loadData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    // Get last 7 days of data
    const allData = getAllHealthData();
    const last7Days = allData.slice(0, 7).reverse();
    
    // Transform data for charts
    const transformed = last7Days.map((entry, index) => {
      const date = new Date(entry.date);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      
      return {
        day: dayName,
        water: entry.waterGlasses || 0,
        cigarettes: entry.cigarettes || 0,
        alcohol: entry.alcoholDrinks || 0,
        steps: entry.steps || 0,
        heartRate: entry.heartRate || null
      };
    });
    
    setChartData(transformed);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Health Statistics</h1>
      <p style={styles.pageDescription}>
        Track your weekly progress for each health metric
      </p>
      
      {/* Product Charts Grid */}
      <div style={styles.chartsGrid}>
        <ProductChart 
          title="Water Intake"
          data={chartData}
          dataKey="water"
          isHarmful={false}
          emoji="💧"
        />
        
        <ProductChart 
          title="Cigarettes"
          data={chartData}
          dataKey="cigarettes"
          isHarmful={true}
          emoji="🚬"
        />
        
        <ProductChart 
          title="Alcohol"
          data={chartData}
          dataKey="alcohol"
          isHarmful={true}
          emoji="🍷"
        />
        
        <ProductChart 
          title="Heart Rate (bpm)"
          data={chartData}
          dataKey="heartRate"
          isHarmful={false}
          emoji="❤️"
        />
      </div>

      {/* Additional Stats */}
      <div style={styles.additionalStats}>
        <h2 style={styles.sectionTitle}>Weekly Summary</h2>
        <div style={styles.summaryGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statLabel}>Total Days Tracked</div>
            <div style={styles.statValue}>{chartData.length}</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💪</div>
            <div style={styles.statLabel}>Avg Water/Day</div>
            <div style={styles.statValue}>
              {chartData.length > 0 
                ? (chartData.reduce((sum, d) => sum + d.water, 0) / chartData.length).toFixed(1)
                : 0}
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statLabel}>Healthy Days</div>
            <div style={styles.statValue}>
              {chartData.filter(d => d.water >= 6 && d.cigarettes === 0 && d.alcohol <= 1).length}
            </div>
          </div>
        </div>
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
    fontSize: '2em',
    marginBottom: '10px'
  },
  pageDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: '1.1em',
    marginBottom: '30px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  additionalStats: {
    marginTop: '40px'
  },
  sectionTitle: {
    textAlign: 'center',
    color: '#333',
    fontSize: '1.8em',
    marginBottom: '20px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '25px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    minHeight: '150px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  statIcon: {
    fontSize: '48px',
    marginBottom: '10px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
    fontWeight: '600'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#4CAF50'
  }
};

export default StatsPage;
