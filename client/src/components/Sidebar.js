import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiAlertTriangle, FiMap, FiCpu, FiDatabase, FiShield } from 'react-icons/fi';

const navItems = [
  { path: '/', label: 'Dashboard', icon: <FiGrid /> },
  { path: '/alerts', label: 'Alerts', icon: <FiAlertTriangle /> },
  { path: '/map', label: 'Map View', icon: <FiMap /> },
  { path: '/predictions', label: 'AI Predictions', icon: <FiCpu /> },
  { path: '/data-sources', label: 'Data Sources', icon: <FiDatabase /> },
  { path: '/risk-assessment', label: 'Risk Assessment', icon: <FiShield /> },
];

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>🛡️ DisasterGuard AI</h1>
        <div className="subtitle">Early Warning Platform</div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div>AI Disaster Warning v1.0</div>
        <div style={{ marginTop: '4px', opacity: 0.6 }}>Powered by ML Models</div>
      </div>
    </div>
  );
}

export default Sidebar;
