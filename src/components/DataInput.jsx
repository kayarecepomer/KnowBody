import React, { useState } from 'react';
import { Cigarette, Wine, Droplets, Save } from 'lucide-react';
import { saveHealthData } from '../utils/storage';

/**
 * DataInput - Component for user to input daily health metrics
 * Uses increment buttons for cigarettes, alcohol, and water intake
 */
function DataInput({ onDataSaved }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cigarettes: 0,
    alcoholDrinks: 0,
    waterGlasses: 0
  });

  const [message, setMessage] = useState('');

  /**
   * Handle date change
   */
  const handleDateChange = (e) => {
    setFormData(prev => ({
      ...prev,
      date: e.target.value
    }));
  };

  /**
   * Increment a metric value
   */
  const increment = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] + 1
    }));
  };

  /**
   * Decrement a metric value (minimum 0)
   */
  const decrement = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] - 1)
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      saveHealthData(formData);
      setMessage('Data saved successfully!');
      
      // Notify parent component if callback is provided
      if (onDataSaved) {
        onDataSaved();
      }
      
      // Reset message after 2 seconds
      setTimeout(() => {
        setMessage('');
      }, 2000);
    } catch (error) {
      setMessage('Error saving data. Please try again.');
      console.error('Error saving health data:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Track Your Day</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Date Input */}
        <div style={styles.dateGroup}>
          <label style={styles.dateLabel}>Date:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleDateChange}
            style={styles.dateInput}
            required
          />
        </div>

        {/* Metrics Section */}
        <div style={styles.metricsGrid}>
          {/* Cigarettes */}
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>
              <Cigarette size={40} color="#F44336" />
            </div>
            <div style={styles.metricName}>🚬 Cigarettes</div>
            <div style={styles.metricValue}>{formData.cigarettes}</div>
            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => decrement('cigarettes')}
                style={styles.decrementButton}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => increment('cigarettes')}
                style={styles.incrementButton}
              >
                +
              </button>
            </div>
          </div>

          {/* Alcohol */}
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>
              <Wine size={40} color="#9C27B0" />
            </div>
            <div style={styles.metricName}>🍷 Drinks</div>
            <div style={styles.metricValue}>{formData.alcoholDrinks}</div>
            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => decrement('alcoholDrinks')}
                style={styles.decrementButton}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => increment('alcoholDrinks')}
                style={styles.incrementButton}
              >
                +
              </button>
            </div>
          </div>

          {/* Water */}
          <div style={styles.metricCard}>
            <div style={styles.metricIcon}>
              <Droplets size={40} color="#2196F3" />
            </div>
            <div style={styles.metricName}>💧 Water Glasses</div>
            <div style={styles.metricValue}>{formData.waterGlasses}</div>
            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => decrement('waterGlasses')}
                style={styles.decrementButton}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => increment('waterGlasses')}
                style={styles.incrementButton}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button type="submit" style={styles.saveButton}>
          <Save size={20} />
          <span>Save Data</span>
        </button>

        {/* Success/Error Message */}
        {message && (
          <div style={message.includes('Error') ? styles.errorMessage : styles.successMessage}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '800px',
    margin: '20px auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '25px',
    fontSize: '2em'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  dateGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '10px'
  },
  dateLabel: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#555'
  },
  dateInput: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '2px solid #ddd',
    fontSize: '16px',
    fontWeight: '600'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '10px'
  },
  metricCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: '12px',
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    cursor: 'default'
  },
  metricIcon: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  metricName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center'
  },
  metricValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#4CAF50',
    lineHeight: '1'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    width: '100%'
  },
  decrementButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    ':hover': {
      backgroundColor: '#d32f2f'
    },
    ':active': {
      transform: 'scale(0.95)'
    }
  },
  incrementButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    ':hover': {
      backgroundColor: '#45a049'
    },
    ':active': {
      transform: 'scale(0.95)'
    }
  },
  saveButton: {
    padding: '18px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background-color 0.2s, transform 0.1s',
    ':hover': {
      backgroundColor: '#1976D2'
    },
    ':active': {
      transform: 'scale(0.98)'
    }
  },
  successMessage: {
    padding: '15px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '16px'
  },
  errorMessage: {
    padding: '15px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: '16px'
  }
};

export default DataInput;
