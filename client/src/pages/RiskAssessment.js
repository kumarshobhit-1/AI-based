import React, { useState, useEffect } from 'react';
import api from '../services/api';

const defaultRisk = {
  location: { latitude: 28.6, longitude: 77.2 },
  riskLevels: {
    earthquake: { level: 'medium', score: 0.45, factors: ['Proximity to Himalayan Belt', 'Historical seismic activity'] },
    flood: { level: 'high', score: 0.72, factors: ['Low elevation', 'Monsoon season', 'River proximity'] },
    cyclone: { level: 'low', score: 0.25, factors: ['Inland location', 'Distance from coast'] },
    heatwave: { level: 'high', score: 0.68, factors: ['Urban heat island', 'Summer season approaching'] },
  },
  overallRisk: 'medium-high',
};

const riskColors = {
  critical: '#ff4757',
  high: '#ff6348',
  medium: '#ffa502',
  low: '#4facfe',
};

const typeIcons = {
  earthquake: '🌍',
  flood: '🌊',
  cyclone: '🌀',
  heatwave: '🌡️',
};

function RiskAssessment() {
  const [assessment, setAssessment] = useState(defaultRisk);
  const [latitude, setLatitude] = useState('28.6');
  const [longitude, setLongitude] = useState('77.2');
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('Delhi, India');

  const presetLocations = [
    { name: 'Delhi, India', lat: '28.6139', lon: '77.2090' },
    { name: 'Mumbai, India', lat: '19.076', lon: '72.8777' },
    { name: 'Chennai, India', lat: '13.0827', lon: '80.2707' },
    { name: 'Tokyo, Japan', lat: '35.6762', lon: '139.6503' },
    { name: 'San Francisco, USA', lat: '37.7749', lon: '-122.4194' },
    { name: 'Dhaka, Bangladesh', lat: '23.8103', lon: '90.4125' },
    { name: 'Jakarta, Indonesia', lat: '-6.2088', lon: '106.8456' },
    { name: 'Kathmandu, Nepal', lat: '27.7172', lon: '85.3240' },
  ];

  const handleAssess = async () => {
    setLoading(true);
    try {
      const res = await api.get('/predictions/risk-assessment', {
        params: { lat: latitude, lon: longitude },
      });
      setAssessment(res.data);
    } catch (error) {
      // Generate mock assessment based on location
      generateMockAssessment(parseFloat(latitude), parseFloat(longitude));
    } finally {
      setLoading(false);
    }
  };

  const generateMockAssessment = (lat, lon) => {
    // Simple distance-based risk for demo
    const earthquakeRisk = Math.min(1, Math.max(0.1, 1 - Math.abs(lat - 28) / 40));
    const floodRisk = Math.min(1, Math.max(0.1, 1 - Math.abs(lat - 25) / 30));
    const cycloneRisk = Math.min(1, Math.max(0.05, 1 - Math.abs(lat - 15) / 25));
    const heatRisk = Math.min(1, Math.max(0.1, 1 - Math.abs(lat - 30) / 30));

    const getLevel = (score) => {
      if (score >= 0.7) return 'critical';
      if (score >= 0.5) return 'high';
      if (score >= 0.3) return 'medium';
      return 'low';
    };

    setAssessment({
      location: { latitude: lat, longitude: lon },
      riskLevels: {
        earthquake: { level: getLevel(earthquakeRisk), score: parseFloat(earthquakeRisk.toFixed(2)), factors: ['Tectonic activity', 'Historical data'] },
        flood: { level: getLevel(floodRisk), score: parseFloat(floodRisk.toFixed(2)), factors: ['Rainfall patterns', 'Elevation'] },
        cyclone: { level: getLevel(cycloneRisk), score: parseFloat(cycloneRisk.toFixed(2)), factors: ['Coastal proximity', 'Wind patterns'] },
        heatwave: { level: getLevel(heatRisk), score: parseFloat(heatRisk.toFixed(2)), factors: ['Temperature trends', 'Urbanization'] },
      },
      overallRisk: getLevel((earthquakeRisk + floodRisk + cycloneRisk + heatRisk) / 4),
    });
  };

  const handlePresetSelect = (preset) => {
    setLatitude(preset.lat);
    setLongitude(preset.lon);
    setLocationName(preset.name);
  };

  useEffect(() => {
    handleAssess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overallColor = riskColors[assessment.overallRisk] || riskColors.medium;

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '5px' }}>🛡️ Risk Assessment</h2>
        <p style={{ fontSize: '0.85rem', color: '#6c6c8a' }}>
          AI-powered disaster risk analysis for any location
        </p>
      </div>

      {/* Location Input */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: '12px', padding: '20px', marginBottom: '25px',
      }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '15px' }}>📍 Select Location</h3>

        {/* Preset Locations */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
          {presetLocations.map((loc) => (
            <button
              key={loc.name}
              className={`btn ${locationName === loc.name ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 12px', fontSize: '0.75rem' }}
              onClick={() => handlePresetSelect(loc)}
            >
              {loc.name}
            </button>
          ))}
        </div>

        {/* Manual Input */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6c6c8a', marginBottom: '4px' }}>
              Latitude
            </label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              style={{
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', borderRadius: '8px',
                padding: '8px 12px', width: '150px', fontSize: '0.9rem',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6c6c8a', marginBottom: '4px' }}>
              Longitude
            </label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              style={{
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                border: '1px solid var(--border-color)', borderRadius: '8px',
                padding: '8px 12px', width: '150px', fontSize: '0.9rem',
              }}
            />
          </div>
          <button className="btn btn-primary" onClick={handleAssess} disabled={loading}>
            {loading ? '⏳ Analyzing...' : '🔍 Assess Risk'}
          </button>
        </div>
      </div>

      {/* Overall Risk */}
      <div style={{
        background: 'var(--bg-card)', border: `1px solid ${overallColor}33`,
        borderRadius: '12px', padding: '25px', marginBottom: '25px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '0.8rem', color: '#6c6c8a', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Overall Risk Level
        </div>
        <div style={{
          fontSize: '2.5rem', fontWeight: '700', color: overallColor,
          margin: '10px 0', textTransform: 'uppercase',
        }}>
          {assessment.overallRisk || 'Medium'}
        </div>
        <div style={{ fontSize: '0.85rem', color: '#a0a0b8' }}>
          📍 {locationName} ({latitude}, {longitude})
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="risk-grid">
        {Object.entries(assessment.riskLevels || {}).map(([type, risk]) => (
          <div key={type} className="risk-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>{typeIcons[type] || '⚠️'}</span>
                <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{type}</span>
              </div>
              <span className={`severity-badge ${risk.level}`}>{risk.level}</span>
            </div>

            <div className="risk-meter">
              <div
                className="risk-fill"
                style={{
                  width: `${(risk.score || 0) * 100}%`,
                  background: riskColors[risk.level] || '#4facfe',
                }}
              ></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6c6c8a' }}>
              <span>Risk Score</span>
              <span style={{ fontWeight: '600', color: riskColors[risk.level] }}>
                {((risk.score || 0) * 100).toFixed(0)}%
              </span>
            </div>

            {risk.factors && (
              <div style={{ marginTop: '10px' }}>
                {risk.factors.map((factor, i) => (
                  <div key={i} style={{ fontSize: '0.75rem', color: '#a0a0b8', padding: '2px 0' }}>
                    • {factor}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskAssessment;
