import React from 'react';

function AlertDetailModal({ alert, onClose }) {
  if (!alert) return null;

  const typeIcons = {
    earthquake: '🌍', flood: '🌊', cyclone: '🌀', storm: '⛈️',
    heatwave: '🌡️', wildfire: '🔥', tsunami: '🌊',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>{typeIcons[alert.type] || '⚠️'}</span>
            <div>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>{alert.title}</h3>
              <span className={`severity-badge ${alert.severity}`}>{alert.severity}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '15px' }}>
            <p style={{ color: '#a0a0b8', lineHeight: '1.6' }}>{alert.description}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
            <InfoBox label="Location" value={alert.location?.name} />
            <InfoBox label="Status" value={alert.status} />
            <InfoBox label="Source" value={alert.source} />
            <InfoBox
              label="Time"
              value={new Date(alert.createdAt).toLocaleString()}
            />
          </div>

          {/* Data readings */}
          {alert.data && (
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px', color: '#a0a0b8' }}>Readings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {alert.data.magnitude && <InfoBox label="Magnitude" value={`M${alert.data.magnitude}`} />}
                {alert.data.depth && <InfoBox label="Depth" value={`${alert.data.depth} km`} />}
                {alert.data.windSpeed && <InfoBox label="Wind Speed" value={`${alert.data.windSpeed} km/h`} />}
                {alert.data.waterLevel && <InfoBox label="Water Level" value={`${alert.data.waterLevel} m`} />}
                {alert.data.temperature && <InfoBox label="Temperature" value={`${alert.data.temperature}°C`} />}
                {alert.data.rainfall && <InfoBox label="Rainfall" value={`${alert.data.rainfall} mm`} />}
                {alert.data.pressure && <InfoBox label="Pressure" value={`${alert.data.pressure} hPa`} />}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {alert.recommendations && alert.recommendations.length > 0 && (
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px', color: '#4facfe' }}>
                Safety Recommendations
              </h4>
              <ul className="recommendation-list">
                {alert.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      padding: '8px 12px',
      borderRadius: '6px',
    }}>
      <div style={{ fontSize: '0.7rem', color: '#6c6c8a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '0.9rem', fontWeight: '500', marginTop: '2px' }}>
        {value || 'N/A'}
      </div>
    </div>
  );
}

export default AlertDetailModal;
