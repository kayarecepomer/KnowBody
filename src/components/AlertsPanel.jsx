import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * AlertsPanel - Displays health alerts and anomalies
 * Shows prioritized alerts based on health data analysis
 */
function AlertsPanel({ alerts = [] }) {
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertCircle size={24} color="#F44336" />;
      case 'medium':
        return <AlertTriangle size={24} color="#FF9800" />;
      default:
        return <Info size={24} color="#2196F3" />;
    }
  };

  const getAlertStyle = (severity) => {
    const baseStyle = { ...styles.alert };
    
    switch (severity) {
      case 'high':
        return { ...baseStyle, borderLeft: '4px solid #F44336' };
      case 'medium':
        return { ...baseStyle, borderLeft: '4px solid #FF9800' };
      default:
        return { ...baseStyle, borderLeft: '4px solid #2196F3' };
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Health Alerts</h2>
        <div style={styles.noAlerts}>
          <Info size={48} color="#4CAF50" />
          <p style={styles.noAlertsText}>No alerts! Keep up the great work!</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Health Alerts</h2>
      <div style={styles.alertsList}>
        {alerts.map((alert, index) => (
          <div key={index} style={getAlertStyle(alert.severity)}>
            <div style={styles.alertHeader}>
              {getAlertIcon(alert.severity)}
              <span style={styles.alertTitle}>{alert.title}</span>
            </div>
            <p style={styles.alertMessage}>{alert.message}</p>
            {alert.recommendation && (
              <div style={styles.recommendation}>
                <strong>Recommendation:</strong> {alert.recommendation}
              </div>
            )}
          </div>
        ))}
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
    maxWidth: '600px',
    margin: '20px auto'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  alert: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  alertTitle: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#333'
  },
  alertMessage: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '10px'
  },
  recommendation: {
    padding: '10px',
    backgroundColor: '#e3f2fd',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#1976d2'
  },
  noAlerts: {
    textAlign: 'center',
    padding: '40px',
    color: '#4CAF50'
  },
  noAlertsText: {
    marginTop: '15px',
    fontSize: '18px',
    color: '#666'
  }
};

export default AlertsPanel;
