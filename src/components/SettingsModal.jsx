import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * SettingsModal - Settings popup with date selection, personal data, and dark mode
 */
function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    selectedDate: new Date().toISOString().split('T')[0],
    age: '',
    weight: '',
    height: '',
    darkMode: false
  });

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('userSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  const handleChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));

    // Apply dark mode if changed
    if (field === 'darkMode') {
      document.body.style.backgroundColor = value ? '#1a1a1a' : '#f0f0f0';
      document.body.style.color = value ? '#ffffff' : '#000000';
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>⚙️ Settings</h2>
          <button style={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div style={styles.content}>
          {/* Date Selection */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>📅 Date Selection</h3>
            <p style={styles.sectionDescription}>
              Select a date to view or enter data for previous/future days
            </p>
            <input
              type="date"
              value={settings.selectedDate}
              onChange={(e) => handleChange('selectedDate', e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Personal Data */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>👤 Personal Data</h3>
            <p style={styles.sectionDescription}>
              Enter your personal information for more accurate recommendations
            </p>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Age (years)</label>
              <input
                type="number"
                value={settings.age}
                onChange={(e) => handleChange('age', e.target.value)}
                placeholder="Enter your age"
                style={styles.input}
                min="0"
                max="120"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Weight (kg)</label>
              <input
                type="number"
                value={settings.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                placeholder="Enter your weight"
                style={styles.input}
                min="0"
                max="300"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Height (cm)</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => handleChange('height', e.target.value)}
                placeholder="Enter your height"
                style={styles.input}
                min="0"
                max="300"
              />
            </div>
          </div>

          {/* Dark Mode */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🌙 Appearance</h3>
            <div style={styles.toggleContainer}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => handleChange('darkMode', e.target.checked)}
                  style={styles.checkbox}
                />
                <span>Dark Mode</span>
              </label>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.saveButton} onClick={onClose}>
            Done
          </button>
        </div>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e0e0e0'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    color: '#333'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '5px',
    display: 'flex',
    alignItems: 'center'
  },
  content: {
    padding: '20px'
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e0e0e0'
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#333',
    marginBottom: '10px'
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '5px'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxSizing: 'border-box'
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    fontSize: '16px'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  saveButton: {
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default SettingsModal;

// Export a function to get the selected date from settings
export function getSelectedDate() {
  const saved = localStorage.getItem('userSettings');
  if (saved) {
    const settings = JSON.parse(saved);
    return settings.selectedDate || new Date().toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}
