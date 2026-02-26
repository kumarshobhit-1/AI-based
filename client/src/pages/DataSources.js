import React, { useState, useEffect } from 'react';
import api from '../services/api';

function DataSources() {
  const [sources, setSources] = useState([]);
  const [latestData, setLatestData] = useState([]);
  const [collecting, setCollecting] = useState(false);

  useEffect(() => {
    fetchSources();
    fetchLatestData();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await api.get('/data-sources');
      setSources(res.data.sources || []);
    } catch (error) {
      setSources(getDefaultSources());
    }
  };

  const fetchLatestData = async () => {
    try {
      const res = await api.get('/data-sources/latest');
      setLatestData(res.data.data || []);
    } catch (error) {
      // Demo data
    }
  };

  const handleCollect = async () => {
    setCollecting(true);
    try {
      await api.post('/data-sources/collect', {});
      await fetchLatestData();
    } catch (error) {
      console.log('Collection triggered (demo mode)');
    } finally {
      setCollecting(false);
    }
  };

  const statusIcons = {
    active: '🟢',
    demo: '🟡',
    inactive: '🔴',
  };

  const sourceIcons = {
    earthquake: '🌍',
    weather: '🌤️',
    flood: '🌊',
    prediction: '🧠',
  };

  const displaySources = sources.length > 0 ? sources : getDefaultSources();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem' }}>📡 Data Sources</h2>
        <button className="btn btn-primary" onClick={handleCollect} disabled={collecting}>
          {collecting ? '⏳ Collecting...' : '🔄 Collect Now'}
        </button>
      </div>

      {/* Data Sources Grid */}
      <div className="source-list" style={{ marginBottom: '30px' }}>
        {displaySources.map((source, i) => (
          <div key={source.id || i} className="source-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.3rem' }}>{sourceIcons[source.type] || '📊'}</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{source.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#6c6c8a', textTransform: 'uppercase' }}>{source.type}</div>
                </div>
              </div>
              <span className={`source-status ${source.status}`}>
                {statusIcons[source.status] || '⚪'} {source.status}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#a0a0b8', marginBottom: '8px', lineHeight: '1.4' }}>
              {source.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6c6c8a' }}>
              <span>Update: {source.updateFrequency}</span>
              {source.url && source.url !== '#' && (
                <a href={source.url} target="_blank" rel="noreferrer" style={{ color: '#4facfe' }}>
                  API Docs ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Latest Data Readings */}
      <div className="card">
        <div className="card-header">
          <h3>📋 Latest Data Readings</h3>
          <span style={{ fontSize: '0.75rem', color: '#6c6c8a' }}>
            {latestData.length} records
          </span>
        </div>
        <div className="card-body">
          {latestData.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Key Reading</th>
                  <th>Quality</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {latestData.slice(0, 15).map((data, i) => (
                  <tr key={i}>
                    <td>{data.source}</td>
                    <td style={{ textTransform: 'capitalize' }}>{data.type}</td>
                    <td>{data.location?.name || 'Unknown'}</td>
                    <td>{getKeyReading(data)}</td>
                    <td>
                      <span style={{ color: data.quality === 'good' ? '#2ed573' : '#ffa502' }}>
                        {data.quality || 'moderate'}
                      </span>
                    </td>
                    <td className="time-ago">{new Date(data.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: '#6c6c8a' }}>
              <p>No data collected yet. Click "Collect Now" to fetch data from all sources.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '10px' }}>
                💡 Data is automatically collected on schedule (earthquakes every 5min, weather every 15min)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getKeyReading(data) {
  const r = data.readings || {};
  if (r.magnitude) return `M${r.magnitude.toFixed(1)}`;
  if (r.temperature) return `${r.temperature.toFixed(1)}°C`;
  if (r.waterLevel) return `${r.waterLevel.toFixed(1)}m`;
  if (r.windSpeed) return `${r.windSpeed.toFixed(0)} km/h`;
  return 'N/A';
}

function getDefaultSources() {
  return [
    { id: 'usgs', name: 'USGS Earthquake Hazards', type: 'earthquake', status: 'active', updateFrequency: '5 minutes', url: 'https://earthquake.usgs.gov', description: 'Real-time earthquake data from the US Geological Survey' },
    { id: 'openweather', name: 'OpenWeatherMap', type: 'weather', status: 'demo', updateFrequency: '15 minutes', url: 'https://openweathermap.org', description: 'Global weather data including temperature, wind, and precipitation' },
    { id: 'noaa', name: 'NOAA Weather Service', type: 'weather', status: 'active', updateFrequency: '30 minutes', url: 'https://www.weather.gov', description: 'National Oceanic and Atmospheric Administration weather alerts' },
    { id: 'flood', name: 'Flood Monitoring Network', type: 'flood', status: 'active', updateFrequency: '30 minutes', url: '#', description: 'River and water level monitoring sensors across flood-prone regions' },
    { id: 'ml', name: 'AI Prediction Engine', type: 'prediction', status: 'active', updateFrequency: '1 hour', url: '#', description: 'Machine learning models for disaster prediction and risk assessment' },
  ];
}

export default DataSources;
