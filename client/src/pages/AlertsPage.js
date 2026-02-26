import React, { useState, useMemo } from 'react';
import AlertCard from '../components/AlertCard';
import AlertDetailModal from '../components/AlertDetailModal';

const demoAlerts = [
  {
    _id: 'demo1', title: 'Earthquake M6.2 - Nepal-India Border', type: 'earthquake', severity: 'high', status: 'active',
    description: 'A magnitude 6.2 earthquake detected at depth 15 km near the Nepal-India Border region.',
    location: { name: 'Nepal-India Border', latitude: 27.7, longitude: 85.3, radius: 120 },
    data: { magnitude: 6.2, depth: 15 }, source: 'usgs',
    recommendations: ['Drop, Cover, and Hold On', 'Be prepared for aftershocks', 'Evacuate damaged buildings'],
    createdAt: new Date(Date.now() - 30 * 60000),
  },
  {
    _id: 'demo2', title: 'Cyclone Warning - Bay of Bengal', type: 'cyclone', severity: 'critical', status: 'active',
    description: 'Severe cyclonic storm with wind speeds of 140 km/h approaching eastern coast of India.',
    location: { name: 'Bay of Bengal', latitude: 15.5, longitude: 85.0, radius: 300 },
    data: { windSpeed: 140, pressure: 960, rainfall: 120 }, source: 'openweather',
    recommendations: ['Move to reinforced shelter immediately', 'Stay away from coast', 'Follow evacuation orders'],
    createdAt: new Date(Date.now() - 2 * 3600000),
  },
  {
    _id: 'demo3', title: 'Flood Warning - Ganges Basin', type: 'flood', severity: 'high', status: 'active',
    description: 'Water level at 8.5m with heavy rainfall exceeding 100mm near the Ganges Basin region.',
    location: { name: 'Ganges Basin, India', latitude: 25.3, longitude: 82.9, radius: 75 },
    data: { waterLevel: 8.5, rainfall: 110 }, source: 'sensor',
    recommendations: ['Move to higher ground', 'Avoid walking through floodwater', 'Evacuate if ordered'],
    createdAt: new Date(Date.now() - 4 * 3600000),
  },
  {
    _id: 'demo4', title: 'Heatwave Alert - Delhi NCR', type: 'heatwave', severity: 'medium', status: 'active',
    description: 'Temperature of 43.5°C recorded in Delhi NCR. Stay hydrated and avoid prolonged sun exposure.',
    location: { name: 'Delhi NCR, India', latitude: 28.6, longitude: 77.2, radius: 50 },
    data: { temperature: 43.5, humidity: 25 }, source: 'openweather',
    recommendations: ['Stay indoors during peak hours', 'Drink plenty of water', 'Check on elderly people'],
    createdAt: new Date(Date.now() - 6 * 3600000),
  },
  {
    _id: 'demo5', title: 'Earthquake M4.8 - Tokyo Region', type: 'earthquake', severity: 'medium', status: 'monitoring',
    description: 'A magnitude 4.8 earthquake detected at depth 45 km near Tokyo, Japan.',
    location: { name: 'Near Tokyo, Japan', latitude: 35.9, longitude: 140.2, radius: 80 },
    data: { magnitude: 4.8, depth: 45 }, source: 'usgs',
    recommendations: ['Drop, Cover, and Hold On if shaking occurs', 'Move away from windows'],
    createdAt: new Date(Date.now() - 8 * 3600000),
  },
  {
    _id: 'demo6', title: 'Storm Warning - Manila', type: 'storm', severity: 'medium', status: 'active',
    description: 'Strong winds of 65 km/h with heavy rainfall approaching Manila, Philippines.',
    location: { name: 'Manila, Philippines', latitude: 14.5, longitude: 120.9, radius: 100 },
    data: { windSpeed: 65, rainfall: 55, pressure: 1005 }, source: 'openweather',
    recommendations: ['Secure loose outdoor objects', 'Stay indoors until storm passes'],
    createdAt: new Date(Date.now() - 10 * 3600000),
  },
];

function AlertsPage({ alerts, loading }) {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const allAlerts = alerts && alerts.length > 0 ? alerts : demoAlerts;

  const filteredAlerts = useMemo(() => {
    return allAlerts.filter(alert => {
      if (filterType !== 'all' && alert.type !== filterType) return false;
      if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
      return true;
    });
  }, [allAlerts, filterType, filterSeverity]);

  if (loading) {
    return <div className="loading"><div className="spinner"></div><p>Loading alerts...</p></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem' }}>⚠️ All Alerts</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.85rem',
            }}
          >
            <option value="all">All Types</option>
            <option value="earthquake">Earthquake</option>
            <option value="flood">Flood</option>
            <option value="cyclone">Cyclone</option>
            <option value="storm">Storm</option>
            <option value="heatwave">Heatwave</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.85rem',
            }}
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '15px', fontSize: '0.8rem', color: '#6c6c8a' }}>
        Showing {filteredAlerts.length} of {allAlerts.length} alerts
      </div>

      <div className="alert-list">
        {filteredAlerts.map((alert, i) => (
          <AlertCard
            key={alert._id || i}
            alert={alert}
            onClick={setSelectedAlert}
          />
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p>No alerts match your filters</p>
        </div>
      )}

      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
}

export default AlertsPage;
