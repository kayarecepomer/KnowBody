import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { getAllHealthData } from '../utils/storage';

/**
 * ReportPage - Shows research papers and recommendations based on user's health stats
 */
function ReportPage() {
  const [userStats, setUserStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const loadData = () => {
      const allData = getAllHealthData();
      if (allData.length === 0) {
        setUserStats(null);
        return;
      }

      // Calculate averages from last 7 days
      const last7Days = allData.slice(0, 7);
      const avgCigarettes = last7Days.reduce((sum, d) => sum + (d.cigarettes || 0), 0) / last7Days.length;
      const avgAlcohol = last7Days.reduce((sum, d) => sum + (d.alcoholDrinks || 0), 0) / last7Days.length;
      const avgWater = last7Days.reduce((sum, d) => sum + (d.waterGlasses || 0), 0) / last7Days.length;

      setUserStats({
        avgCigarettes,
        avgAlcohol,
        avgWater
      });

      // Generate recommendations based on stats
      generateRecommendations(avgCigarettes, avgAlcohol, avgWater);
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateRecommendations = (cigarettes, alcohol, water) => {
    const recs = [];

    // Smoking recommendations
    if (cigarettes >= 10) {
      recs.push({
        id: 1,
        category: 'Smoking',
        severity: 'high',
        title: 'Heavy Smoking Impact on Health',
        description: `You're averaging ${cigarettes.toFixed(1)} cigarettes per day. Research shows this significantly increases health risks.`,
        impact: 'Studies indicate heavy smoking (10+ cigarettes/day) can reduce lifespan by 8-10 years on average.',
        researchLinks: [
          { title: 'WHO Report on Tobacco', url: 'https://www.who.int/news-room/fact-sheets/detail/tobacco' },
          { title: 'CDC Smoking & Health Effects', url: 'https://www.cdc.gov/tobacco/data_statistics/fact_sheets/health_effects/effects_cig_smoking/index.htm' }
        ],
        recommendation: 'Consider seeking professional help to quit. Even reducing by 50% would significantly improve your health outcomes.'
      });
    } else if (cigarettes > 0) {
      recs.push({
        id: 2,
        category: 'Smoking',
        severity: 'medium',
        title: 'Any Smoking is Harmful',
        description: `You're averaging ${cigarettes.toFixed(1)} cigarettes per day.`,
        impact: 'Even light smoking increases cardiovascular disease risk by 50-60% compared to non-smokers.',
        researchLinks: [
          { title: 'Light Smoking Health Risks', url: 'https://www.heart.org/en/healthy-living/healthy-lifestyle/quit-smoking-tobacco' }
        ],
        recommendation: 'The best time to quit is now. Every cigarette avoided improves your health.'
      });
    }

    // Alcohol recommendations
    if (alcohol >= 3) {
      recs.push({
        id: 3,
        category: 'Alcohol',
        severity: 'high',
        title: 'Excessive Alcohol Consumption',
        description: `You're averaging ${alcohol.toFixed(1)} drinks per day, which exceeds safe limits.`,
        impact: 'Chronic heavy drinking increases risk of liver disease, certain cancers, and reduces life expectancy by 5-10 years.',
        researchLinks: [
          { title: 'NIH Alcohol Health Risks', url: 'https://www.niaaa.nih.gov/alcohols-effects-health' },
          { title: 'CDC Alcohol & Health', url: 'https://www.cdc.gov/alcohol/fact-sheets/alcohol-use.htm' }
        ],
        recommendation: 'Reduce to ≤2 drinks/day for men or ≤1 for women. Consider speaking with a healthcare provider.'
      });
    } else if (alcohol > 1.5) {
      recs.push({
        id: 4,
        category: 'Alcohol',
        severity: 'medium',
        title: 'Moderate Alcohol Consumption',
        description: `You're averaging ${alcohol.toFixed(1)} drinks per day.`,
        impact: 'Moderate drinking still carries health risks including increased cancer risk.',
        researchLinks: [
          { title: 'Moderate Drinking Guidelines', url: 'https://www.niaaa.nih.gov/alcohol-health/overview-alcohol-consumption/moderate-binge-drinking' }
        ],
        recommendation: 'Try to limit to 1 drink per day or less for optimal health.'
      });
    }

    // Hydration recommendations
    if (water < 6) {
      recs.push({
        id: 5,
        category: 'Hydration',
        severity: water < 4 ? 'high' : 'medium',
        title: 'Insufficient Water Intake',
        description: `You're averaging ${water.toFixed(1)} glasses per day, below the recommended 8 glasses.`,
        impact: 'Chronic dehydration affects cognitive function, physical performance, and increases kidney stone risk.',
        researchLinks: [
          { title: 'Hydration Science', url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/water/art-20044256' }
        ],
        recommendation: 'Aim for 8 glasses (64oz) of water daily. Set reminders if needed.'
      });
    }

    // Positive feedback
    if (cigarettes === 0 && alcohol <= 1 && water >= 7) {
      recs.push({
        id: 6,
        category: 'Overall Health',
        severity: 'positive',
        title: 'Excellent Health Habits!',
        description: 'Your current habits are aligned with health research recommendations.',
        impact: 'Maintaining these habits can add years to your life and significantly improve quality of life.',
        researchLinks: [
          { title: 'Healthy Lifestyle Benefits', url: 'https://www.health.harvard.edu/staying-healthy/healthy-lifestyle-5-keys-to-a-longer-life' }
        ],
        recommendation: 'Keep up the great work! Continue tracking to maintain these healthy patterns.'
      });
    }

    setRecommendations(recs);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'positive': return '#4CAF50';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'positive': return '✅';
      default: return 'ℹ️';
    }
  };

  if (!userStats) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Health Reports & Research</h1>
        <div style={styles.noData}>
          <AlertCircle size={64} color="#666" />
          <h2>No Data Available</h2>
          <p>Start tracking your health metrics to receive personalized research and recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>📚 Health Reports & Research</h1>
      <p style={styles.pageDescription}>
        Personalized research and recommendations based on your tracked health data
      </p>

      <div style={styles.statsOverview}>
        <h3>Your Weekly Averages</h3>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>🚬</span>
            <span style={styles.statValue}>{userStats.avgCigarettes.toFixed(1)}</span>
            <span style={styles.statLabel}>cigarettes/day</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>🍷</span>
            <span style={styles.statValue}>{userStats.avgAlcohol.toFixed(1)}</span>
            <span style={styles.statLabel}>drinks/day</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statIcon}>💧</span>
            <span style={styles.statValue}>{userStats.avgWater.toFixed(1)}</span>
            <span style={styles.statLabel}>glasses/day</span>
          </div>
        </div>
      </div>

      <div style={styles.recommendations}>
        <h2 style={styles.sectionTitle}>Research-Based Recommendations</h2>
        
        {recommendations.length === 0 && (
          <div style={styles.noRecommendations}>
            <p>No specific recommendations at this time. Keep tracking your health!</p>
          </div>
        )}

        {recommendations.map(rec => (
          <div 
            key={rec.id} 
            style={{
              ...styles.reportCard,
              borderLeft: `6px solid ${getSeverityColor(rec.severity)}`
            }}
          >
            <div style={styles.reportHeader}>
              <div style={styles.reportTitle}>
                <span style={styles.severityIcon}>{getSeverityIcon(rec.severity)}</span>
                <h3 style={{margin: 0}}>{rec.title}</h3>
              </div>
              <span style={{
                ...styles.categoryBadge,
                backgroundColor: getSeverityColor(rec.severity)
              }}>
                {rec.category}
              </span>
            </div>

            <div style={styles.reportContent}>
              <p style={styles.description}>{rec.description}</p>
              
              <div style={styles.impactSection}>
                <strong>📊 Health Impact:</strong>
                <p>{rec.impact}</p>
              </div>

              <div style={styles.researchLinks}>
                <strong>🔬 Research References:</strong>
                {rec.researchLinks.map((link, idx) => (
                  <a 
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.researchLink}
                  >
                    <FileText size={16} />
                    <span>{link.title}</span>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>

              <div style={styles.recommendationBox}>
                <strong>💡 Recommendation:</strong>
                <p>{rec.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
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
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  statsOverview: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  statIcon: {
    fontSize: '32px',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px'
  },
  recommendations: {
    marginTop: '30px'
  },
  sectionTitle: {
    fontSize: '1.8em',
    color: '#333',
    marginBottom: '20px'
  },
  noRecommendations: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    color: '#666'
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  reportTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  severityIcon: {
    fontSize: '24px'
  },
  categoryBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  reportContent: {
    lineHeight: '1.6'
  },
  description: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '15px'
  },
  impactSection: {
    backgroundColor: '#fff3e0',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  researchLinks: {
    marginBottom: '15px'
  },
  researchLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px',
    marginTop: '8px',
    backgroundColor: '#e3f2fd',
    borderRadius: '6px',
    textDecoration: 'none',
    color: '#1976d2',
    transition: 'background-color 0.2s'
  },
  recommendationBox: {
    backgroundColor: '#e8f5e9',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px'
  }
};

export default ReportPage;
