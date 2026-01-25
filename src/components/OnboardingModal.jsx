import React, { useState } from 'react';
import { User, Ruler, Weight } from 'lucide-react';

/**
 * OnboardingModal - First-time user data collection
 * Collects Age, Height, Weight for personalized recommendations
 */
function OnboardingModal({ isOpen, onComplete }) {
  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: ''
  });
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.age || formData.age < 1 || formData.age > 120) {
      newErrors.age = 'Please enter a valid age (1-120)';
    }
    
    if (!formData.height || formData.height < 50 || formData.height > 300) {
      newErrors.height = 'Please enter a valid height in cm (50-300)';
    }
    
    if (!formData.weight || formData.weight < 20 || formData.weight > 500) {
      newErrors.weight = 'Please enter a valid weight in kg (20-500)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify({
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        createdAt: new Date().toISOString()
      }));
      
      onComplete();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Welcome to Health Tracker! 🏃‍♂️</h2>
          <p style={styles.subtitle}>
            Let's personalize your experience. Tell us a bit about yourself:
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <User size={20} />
              <span>Age (years)</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              style={{
                ...styles.input,
                borderColor: errors.age ? '#f44336' : '#ddd'
              }}
              placeholder="e.g., 25"
              min="1"
              max="120"
            />
            {errors.age && <span style={styles.error}>{errors.age}</span>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Ruler size={20} />
              <span>Height (cm)</span>
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              style={{
                ...styles.input,
                borderColor: errors.height ? '#f44336' : '#ddd'
              }}
              placeholder="e.g., 175"
              min="50"
              max="300"
              step="0.1"
            />
            {errors.height && <span style={styles.error}>{errors.height}</span>}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Weight size={20} />
              <span>Weight (kg)</span>
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              style={{
                ...styles.input,
                borderColor: errors.weight ? '#f44336' : '#ddd'
              }}
              placeholder="e.g., 70"
              min="20"
              max="500"
              step="0.1"
            />
            {errors.weight && <span style={styles.error}>{errors.weight}</span>}
          </div>

          <div style={styles.infoBox}>
            <strong>Why we need this:</strong>
            <p>
              Your personal data helps us provide age-appropriate health recommendations
              and personalized insights based on medical research.
            </p>
          </div>

          <button type="submit" style={styles.submitButton}>
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '10px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  error: {
    color: '#f44336',
    fontSize: '14px',
    marginTop: '4px'
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1976d2'
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default OnboardingModal;
