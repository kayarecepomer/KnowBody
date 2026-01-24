import React, { useState } from 'react';
import { saveHealthData } from '../utils/storage';

/**
 * DataInput - Component for user to input daily health metrics
 * Captures cigarettes, alcohol, and water intake
 */
function DataInput() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    cigarettes: 0,
    alcoholDrinks: 0,
    waterGlasses: 0
  });

  const [message, setMessage] = useState('');

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'date' ? value : parseInt(value) || 0
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
      
      // Reset form after 2 seconds
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
      <h2 style={styles.title}>Daily Health Metrics</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Date:
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Cigarettes:
            <input
              type="number"
              name="cigarettes"
              value={formData.cigarettes}
              onChange={handleChange}
              min="0"
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Alcohol (drinks):
            <input
              type="number"
              name="alcoholDrinks"
              value={formData.alcoholDrinks}
              onChange={handleChange}
              min="0"
              style={styles.input}
            />
          </label>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Water (glasses):
            <input
              type="number"
              name="waterGlasses"
              value={formData.waterGlasses}
              onChange={handleChange}
              min="0"
              style={styles.input}
            />
          </label>
        </div>

        <button type="submit" style={styles.button}>
          Save Data
        </button>

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
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    maxWidth: '500px',
    margin: '20px auto'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontWeight: 'bold',
    marginBottom: '5px',
    color: '#555'
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '16px',
    marginTop: '5px'
  },
  button: {
    padding: '12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  successMessage: {
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    textAlign: 'center'
  },
  errorMessage: {
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    textAlign: 'center'
  }
};

export default DataInput;
