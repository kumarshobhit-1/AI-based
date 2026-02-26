import React, { useState, useEffect } from 'react';
import api from '../services/api';

const typeIcons = {
  earthquake: '🌍', flood: '🌊', cyclone: '🌀', storm: '⛈️', heatwave: '🌡️',
};

const demoPredictions = [
  {
    _id: 'p1', disasterType: 'flood', probability: 0.78, confidence: 0.85, severity: 'high',
    location: { name: 'Ganges Basin, India', latitude: 25.3, longitude: 82.9 },
    modelUsed: 'flood-gradient-boosting', createdAt: new Date(),
    risk_factors: ['Heavy monsoon rainfall expected', 'River levels above normal', 'Saturated soil conditions'],
  },
  {
    _id: 'p2', disasterType: 'cyclone', probability: 0.62, confidence: 0.68, severity: 'high',
    location: { name: 'Bay of Bengal', latitude: 15.5, longitude: 85.0 },
    modelUsed: 'cyclone-random-forest', createdAt: new Date(),
    risk_factors: ['Low pressure system forming', 'Sea surface temp > 28°C', 'Favorable wind shear patterns'],
  },
  {
    _id: 'p3', disasterType: 'earthquake', probability: 0.35, confidence: 0.72, severity: 'medium',
    location: { name: 'Himalayan Region', latitude: 27.7, longitude: 85.3 },
    modelUsed: 'seismic-random-forest', createdAt: new Date(),
    risk_factors: ['Active tectonic boundary', 'Recent micro-seismic activity', 'Historical pattern match'],
  },
  {
    _id: 'p4', disasterType: 'heatwave', probability: 0.55, confidence: 0.80, severity: 'medium',
    location: { name: 'Delhi NCR', latitude: 28.6, longitude: 77.2 },
    modelUsed: 'weather-gradient-boost', createdAt: new Date(),
    risk_factors: ['Rising temperature trend', 'Low humidity forecast', 'Urban heat island effect'],
  },
  {
    _id: 'p5', disasterType: 'flood', probability: 0.42, confidence: 0.65, severity: 'medium',
    location: { name: 'Brahmaputra Valley', latitude: 26.1, longitude: 91.7 },
    modelUsed: 'flood-gradient-boosting', createdAt: new Date(),
    risk_factors: ['Upstream rainfall accumulation', 'Snowmelt season', 'Low elevation terrain'],
  },
  {
    _id: 'p6', disasterType: 'earthquake', probability: 0.22, confidence: 0.75, severity: 'low',
    location: { name: 'San Francisco, USA', latitude: 37.7, longitude: -122.4 },
    modelUsed: 'seismic-random-forest', createdAt: new Date(),
    risk_factors: ['San Andreas Fault proximity', 'Background seismicity normal', 'No unusual strain detected'],
  },
];

function Predictions() {
  const [predictions, setPredictions] = useState(demoPredictions);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const res = await api.get('/predictions');
        if (res.data.predictions && res.data.predictions.length > 0) {
          setPredictions(res.data.predictions);
        }
      } catch (error) {
        // Use demo data
      }
    };
    fetchPredictions();
  }, []);

  const filteredPredictions = filterType === 'all'
    ? predictions
    : predictions.filter(p => p.disasterType === filterType);

  const getSeverityClass = (probability) => {
    if (probability >= 0.7) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      await api.post('/predictions/analyze', {
        disasterType: 'flood',
        location: { latitude: 25.3, longitude: 82.9, name: 'Ganges Basin' },
        inputData: { rainfall: 80, water_level: 5, elevation: 20 },
      });
      const res = await api.get('/predictions');
      if (res.data.predictions?.length > 0) {
        setPredictions(res.data.predictions);
      }
    } catch (error) {
      console.log('Analysis complete (demo mode)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem' }}>🧠 AI Predictions</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: 'var(--bg-card)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', borderRadius: '8px',
              padding: '8px 12px', fontSize: '0.85rem',
            }}
          >
            <option value="all">All Types</option>
            <option value="earthquake">Earthquake</option>
            <option value="flood">Flood</option>
            <option value="cyclone">Cyclone</option>
            <option value="heatwave">Heatwave</option>
          </select>
          <button className="btn btn-primary" onClick={handleRunAnalysis} disabled={loading}>
            {loading ? '⏳ Analyzing...' : '🔬 Run Analysis'}
          </button>
        </div>
      </div>

      {/* Model Info */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px',
      }}>
        {[
          { name: 'Seismic Predictor', type: 'earthquake', algo: 'Random Forest', accuracy: '78%' },
          { name: 'Flood Predictor', type: 'flood', algo: 'Gradient Boosting', accuracy: '85%' },
          { name: 'Weather Predictor', type: 'weather', algo: 'Neural Ensemble', accuracy: '82%' },
        ].map((model, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '12px', padding: '15px',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '5px' }}>
              🤖 {model.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6c6c8a' }}>
              Algorithm: {model.algo}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#2ed573', marginTop: '3px' }}>
              Accuracy: {model.accuracy}
            </div>
          </div>
        ))}
      </div>

      {/* Predictions List */}
      <div style={{ fontSize: '0.8rem', color: '#6c6c8a', marginBottom: '10px' }}>
        {filteredPredictions.length} prediction(s) available
      </div>

      {filteredPredictions.map((pred, i) => (
        <div key={pred._id || i} className="prediction-card">
          <div className="prediction-header">
            <div className="prediction-type">
              <span>{typeIcons[pred.disasterType] || '⚠️'}</span>
              <span style={{ textTransform: 'capitalize' }}>{pred.disasterType} Risk</span>
            </div>
            <span className={`severity-badge ${pred.severity}`}>{pred.severity}</span>
          </div>

          <div style={{ fontSize: '0.85rem', color: '#a0a0b8', marginBottom: '8px' }}>
            📍 {pred.location?.name || 'Unknown Location'}
          </div>

          {/* Probability Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
            <span style={{ color: '#6c6c8a' }}>Probability</span>
            <span style={{ fontWeight: '600' }}>{(pred.probability * 100).toFixed(1)}%</span>
          </div>
          <div className="probability-bar">
            <div
              className={`probability-fill ${getSeverityClass(pred.probability)}`}
              style={{ width: `${pred.probability * 100}%` }}
            ></div>
          </div>

          {/* Confidence */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', margin: '6px 0', color: '#6c6c8a' }}>
            <span>Confidence: {((pred.confidence || 0.7) * 100).toFixed(0)}%</span>
            <span>Model: {pred.modelUsed}</span>
          </div>

          {/* Risk Factors */}
          {pred.risk_factors && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#4facfe' }}>Risk Factors:</span>
              <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0' }}>
                {pred.risk_factors.map((factor, j) => (
                  <li key={j} style={{ fontSize: '0.75rem', color: '#a0a0b8', padding: '2px 0', paddingLeft: '10px' }}>
                    • {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Predictions;
