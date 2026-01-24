import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3 } from 'lucide-react';

/**
 * Navigation - Navigation tabs for switching between Daily and Stats pages
 */
function Navigation() {
  const location = useLocation();
  const isDaily = location.pathname === '/';
  const isStats = location.pathname === '/stats';

  return (
    <nav style={styles.nav}>
      <Link
        to="/"
        style={{
          ...styles.navItem,
          ...(isDaily ? styles.navItemActive : {})
        }}
      >
        <Home size={20} />
        <span>Daily</span>
      </Link>
      
      <Link
        to="/stats"
        style={{
          ...styles.navItem,
          ...(isStats ? styles.navItemActive : {})
        }}
      >
        <BarChart3 size={20} />
        <span>Stats</span>
      </Link>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    padding: '15px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 30px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '16px',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  navItemActive: {
    backgroundColor: '#4CAF50',
    color: 'white'
  }
};

export default Navigation;
