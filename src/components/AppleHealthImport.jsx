import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * AppleHealthImport - Upload and parse Apple Health export.xml
 * Extracts step count and other health metrics
 */
function AppleHealthImport({ onDataImported }) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const parseAppleHealthXML = (xmlText) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Invalid XML file');
      }

      // Extract step count records
      const records = xmlDoc.querySelectorAll('Record[type="HKQuantityTypeIdentifierStepCount"]');
      const stepData = [];

      records.forEach(record => {
        const date = record.getAttribute('startDate');
        const value = parseFloat(record.getAttribute('value'));
        
        if (date && !isNaN(value)) {
          const dateOnly = date.split(' ')[0]; // Extract date part
          stepData.push({
            date: dateOnly,
            steps: value
          });
        }
      });

      // Aggregate steps by day
      const dailySteps = {};
      stepData.forEach(({ date, steps }) => {
        if (!dailySteps[date]) {
          dailySteps[date] = 0;
        }
        dailySteps[date] += steps;
      });

      // Convert to array and sort by date
      const aggregatedData = Object.entries(dailySteps)
        .map(([date, steps]) => ({ date, steps: Math.round(steps) }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        success: true,
        recordsFound: aggregatedData.length,
        data: aggregatedData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to parse XML file'
      };
    }
  };

  const mergeWithExistingData = (importedData) => {
    // Get existing health data
    const existingDataStr = localStorage.getItem('healthData');
    const existingData = existingDataStr ? JSON.parse(existingDataStr) : [];

    // Create a map of existing data by date
    const dataMap = {};
    existingData.forEach(entry => {
      dataMap[entry.date] = entry;
    });

    // Merge imported step data
    let updatedCount = 0;
    importedData.forEach(({ date, steps }) => {
      if (dataMap[date]) {
        // Update existing entry
        dataMap[date].steps = steps;
        updatedCount++;
      } else {
        // Create new entry with just steps
        dataMap[date] = {
          date,
          steps,
          cigarettes: 0,
          alcoholDrinks: 0,
          waterGlasses: 0
        };
      }
    });

    // Convert back to array and sort
    const mergedData = Object.values(dataMap)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Save to localStorage
    localStorage.setItem('healthData', JSON.stringify(mergedData));

    return {
      totalEntries: mergedData.length,
      updatedCount
    };
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xml')) {
      setResult({
        success: false,
        error: 'Please upload an XML file'
      });
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const parseResult = parseAppleHealthXML(text);

      if (parseResult.success) {
        const mergeResult = mergeWithExistingData(parseResult.data);
        
        setResult({
          success: true,
          recordsFound: parseResult.recordsFound,
          totalEntries: mergeResult.totalEntries,
          updatedCount: mergeResult.updatedCount
        });

        // Notify parent component
        if (onDataImported) {
          onDataImported(parseResult.data);
        }
      } else {
        setResult(parseResult);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to read file: ' + error.message
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FileText size={24} color="#4CAF50" />
        <h3 style={styles.title}>Import Apple Health Data</h3>
      </div>

      <div style={styles.instructions}>
        <p><strong>How to export from Apple Health:</strong></p>
        <ol style={styles.list}>
          <li>Open the Health app on your iPhone</li>
          <li>Tap your profile picture in the top right</li>
          <li>Scroll down and tap "Export All Health Data"</li>
          <li>Wait for the export to complete</li>
          <li>Save the export.zip file</li>
          <li>Extract the export.xml file from the zip</li>
          <li>Upload the export.xml file below</li>
        </ol>
      </div>

      <div style={styles.uploadArea}>
        <input
          type="file"
          accept=".xml"
          onChange={handleFileUpload}
          style={styles.fileInput}
          id="apple-health-upload"
          disabled={importing}
        />
        <label htmlFor="apple-health-upload" style={styles.uploadLabel}>
          <Upload size={32} />
          <span style={styles.uploadText}>
            {importing ? 'Processing...' : 'Click to Upload export.xml'}
          </span>
          <span style={styles.uploadSubtext}>
            XML files only
          </span>
        </label>
      </div>

      {result && (
        <div style={{
          ...styles.resultBox,
          backgroundColor: result.success ? '#e8f5e9' : '#ffebee',
          borderColor: result.success ? '#4CAF50' : '#f44336'
        }}>
          {result.success ? (
            <>
              <CheckCircle size={24} color="#4CAF50" />
              <div style={styles.resultContent}>
                <strong>Import Successful!</strong>
                <p>
                  Found {result.recordsFound} days of step data.
                  Updated {result.updatedCount} existing entries.
                  Total entries in database: {result.totalEntries}.
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={24} color="#f44336" />
              <div style={styles.resultContent}>
                <strong>Import Failed</strong>
                <p>{result.error}</p>
              </div>
            </>
          )}
        </div>
      )}

      <div style={styles.noteBox}>
        <strong>Note:</strong> This import will merge step count data with your existing 
        health tracking data. Your cigarette, alcohol, and water data will be preserved.
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '700px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#333'
  },
  instructions: {
    backgroundColor: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#666'
  },
  list: {
    marginTop: '10px',
    marginBottom: 0,
    paddingLeft: '20px'
  },
  uploadArea: {
    marginBottom: '20px'
  },
  fileInput: {
    display: 'none'
  },
  uploadLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '40px',
    border: '2px dashed #4CAF50',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  uploadText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333'
  },
  uploadSubtext: {
    fontSize: '14px',
    color: '#666'
  },
  resultBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid',
    marginBottom: '20px'
  },
  resultContent: {
    flex: 1
  },
  noteBox: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1976d2'
  }
};

export default AppleHealthImport;
