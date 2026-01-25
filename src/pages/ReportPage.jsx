import React, { useState, useEffect } from 'react';
import { FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { getAllHealthData } from '../utils/storage';
import researchDatabase from '../data/research-database.json';

/**
 * ReportPage - Shows research papers and recommendations based on user's health stats
 */
function ReportPage() {
  const [userStats, setUserStats] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const loadData = () => {
      // Load user profile
      const profileStr = localStorage.getItem('userProfile');
      if (profileStr) {
        setUserProfile(JSON.parse(profileStr));
      }

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
      const avgSteps = last7Days.reduce((sum, d) => sum + (d.steps || 0), 0) / last7Days.length;

      const stats = {
        avgCigarettes,
        avgAlcohol,
        avgWater,
        avgSteps
      };

      setUserStats(stats);

      // Generate recommendations based on stats and age
      const profile = profileStr ? JSON.parse(profileStr) : null;
      generateRecommendations(stats, profile);
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateRecommendations = (stats, profile) => {
    const recs = [];
    const age = profile?.age || 30;
    const isElderly = age >= 60;

    // Smoking recommendations with research
    if (stats.avgCigarettes >= 10) {
      const research = researchDatabase.cigarettes[0];
      const ageNote = isElderly ? ` At age ${age}, the cumulative effects are especially significant.` : "";
      
      recs.push({
        id: 1,
        category: 'Smoking',
        severity: 'high',
        title: 'Heavy Smoking Impact on Health',
        description: `You're averaging ${stats.avgCigarettes.toFixed(1)} cigarettes per day. Research shows this significantly increases health risks.${ageNote}`,
        impact: research.keyFindings,
        researchLinks: [research],
        recommendation: 'Consider seeking professional help to quit. Even reducing by 50% would significantly improve your health outcomes.'
      });
    } else if (stats.avgCigarettes > 0) {
      const research = researchDatabase.cigarettes[1];
      
      recs.push({
        id: 2,
        category: 'Smoking',
        severity: 'medium',
        title: 'Any Smoking is Harmful',
        description: `You're averaging ${stats.avgCigarettes.toFixed(1)} cigarettes per day.`,
        impact: research.keyFindings,
        researchLinks: [research],
        recommendation: 'The best time to quit is now. Every cigarette avoided improves your health.'
      });
    }

    // Alcohol recommendations with research
    if (stats.avgAlcohol >= 3) {
      const research = researchDatabase.alcohol[0];
      const ageNote = isElderly ? ` At age ${age}, the liver's ability to process alcohol decreases, increasing health risks.` : "";
      
      recs.push({
        id: 3,
        category: 'Alcohol',
        severity: 'high',
        title: 'Excessive Alcohol Consumption',
        description: `You're averaging ${stats.avgAlcohol.toFixed(1)} drinks per day, which exceeds safe limits.${ageNote}`,
        impact: research.keyFindings,
        researchLinks: [research, researchDatabase.alcohol[1]],
        recommendation: 'Reduce to ≤2 drinks/day for men or ≤1 for women. Consider speaking with a healthcare provider.'
      });
    } else if (stats.avgAlcohol > 1.5) {
      const research = researchDatabase.alcohol[1];
      
      recs.push({
        id: 4,
        category: 'Alcohol',
        severity: 'medium',
        title: 'Moderate Alcohol Consumption',
        description: `You're averaging ${stats.avgAlcohol.toFixed(1)} drinks per day.`,
        impact: research.keyFindings,
        researchLinks: [research],
        recommendation: 'Try to limit to 1 drink per day or less for optimal health.'
      });
    }

    // Hydration recommendations with research
    if (stats.avgWater < 6) {
      const research = researchDatabase.water[0];
      const severity = stats.avgWater < 4 ? 'high' : 'medium';
      const ageNote = isElderly 
        ? ` Since you are ${age} years old, adequate hydration is especially important for cognitive function and reducing fall risk.`
        : "";
      
      recs.push({
        id: 5,
        category: 'Hydration',
        severity: severity,
        title: 'Insufficient Water Intake',
        description: `You're averaging ${stats.avgWater.toFixed(1)} glasses per day, below the recommended 8 glasses.${ageNote}`,
        impact: research.keyFindings,
        researchLinks: [research, researchDatabase.water[1]],
        recommendation: 'Aim for 8 glasses (64oz) of water daily. Set reminders if needed.'
      });
    }

    // Walking/Activity recommendations with research
    if (stats.avgSteps > 0) {
      if (stats.avgSteps < 5000) {
        const research = researchDatabase.walking[0];
        const ageNote = isElderly 
          ? ` For adults ${age}+, maintaining mobility through regular walking is crucial for independence and longevity.`
          : "";
        
        recs.push({
          id: 6,
          category: 'Physical Activity',
          severity: 'high',
          title: 'Low Physical Activity',
          description: `You're averaging only ${Math.round(stats.avgSteps)} steps per day.${ageNote}`,
          impact: research.keyFindings,
          researchLinks: [research, researchDatabase.walking[1]],
          recommendation: isElderly 
            ? 'Aim for 6,000-8,000 steps per day. Start gradually and increase slowly.'
            : 'Aim for 8,000-10,000 steps per day. Start with small increases.'
        });
      } else if (stats.avgSteps < 7000) {
        const research = researchDatabase.walking[1];
        
        recs.push({
          id: 7,
          category: 'Physical Activity',
          severity: 'medium',
          title: 'Moderate Activity Level',
          description: `You're averaging ${Math.round(stats.avgSteps)} steps per day.`,
          impact: research.keyFindings,
          researchLinks: [research],
          recommendation: 'You\'re moderately active but below optimal. Try to increase by 1,000-2,000 steps.'
        });
      }
    }

    // Positive feedback
    if (stats.avgCigarettes === 0 && stats.avgAlcohol <= 1 && stats.avgWater >= 7 && stats.avgSteps >= 7000) {
      const research = researchDatabase.general[0];
      
      recs.push({
        id: 8,
        category: 'Overall Health',
        severity: 'positive',
        title: 'Excellent Health Habits!',
        description: 'Your current habits are aligned with health research recommendations.',
        impact: research.keyFindings,
        researchLinks: [research, researchDatabase.general[1]],
        recommendation: 'Keep up the great work! Continue tracking to maintain these healthy patterns.'
      });
    }

    // Add elderly-specific recommendations if applicable
    if (isElderly && (stats.avgCigarettes > 0 || stats.avgAlcohol > 0 || stats.avgSteps < 6000)) {
      const research = researchDatabase.elderly_specific[0];
      
      recs.push({
        id: 9,
        category: 'Age-Specific',
        severity: 'medium',
        title: 'Healthy Aging Recommendations',
        description: `At age ${age}, lifestyle factors have a significant impact on longevity and quality of life.`,
        impact: research.keyFindings,
        researchLinks: [research, researchDatabase.elderly_specific[1]],
        recommendation: 'Focus on maintaining social connections, regular physical activity, and avoiding smoking and excessive alcohol for healthy aging.'
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
        {userProfile && (
          <p style={styles.ageDisplay}>Age: {userProfile.age} years | Recommendations personalized for your age</p>
        )}
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
          <div style={styles.statItem}>
            <span style={styles.statIcon}>🚶</span>
            <span style={styles.statValue}>{userStats.avgSteps > 0 ? Math.round(userStats.avgSteps) : 'N/A'}</span>
            <span style={styles.statLabel}>steps/day</span>
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
  ageDisplay: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '10px',
    marginBottom: '10px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
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
