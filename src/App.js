import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import DailyPage from './pages/DailyPage';
import StatsPage from './pages/StatsPage';
import StreakPage from './pages/StreakPage';
import { Activity } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="App">
        <header style={styles.header}>
          <div style={styles.headerContent}>
            <Activity size={40} color="#4CAF50" />
            <h1 style={styles.title}>Health Tracker</h1>
          </div>
          <p style={styles.subtitle}>Research-based health tracking for better living</p>
        </header>

        <Navigation />

        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<DailyPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/streak" element={<StreakPage />} />
          </Routes>
        </main>

        <footer style={styles.footer}>
          <p>Built for ConUHacksX | All recommendations based on medical research</p>
        </footer>
      </div>
    </Router>
  );
}

const styles = {
  header: {
    backgroundColor: '#282c34',
    padding: '30px 20px',
    color: 'white',
    textAlign: 'center'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px'
  },
  title: {
    margin: 0,
    fontSize: '2.5em'
  },
  subtitle: {
    margin: '10px 0 0 0',
    fontSize: '1.1em',
    color: '#aaa'
  },
  main: {
    minHeight: 'calc(100vh - 250px)',
    backgroundColor: '#f0f0f0',
    padding: '20px'
  },
  footer: {
    backgroundColor: '#282c34',
    padding: '20px',
    color: 'white',
    textAlign: 'center',
    fontSize: '0.9em'
  }
};

export default App;
