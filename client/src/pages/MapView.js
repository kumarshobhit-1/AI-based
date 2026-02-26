import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const severityColors = {
  critical: '#ff4757',
  high: '#ff6348',
  medium: '#ffa502',
  low: '#4facfe',
};

const typeIcons = {
  earthquake: '🌍',
  flood: '🌊',
  cyclone: '🌀',
  storm: '⛈️',
  heatwave: '🌡️',
  wildfire: '🔥',
};

const defaultMarkers = [
  { id: 'dm1', title: 'Earthquake M6.2', type: 'earthquake', severity: 'high', lat: 27.7, lng: 85.3, radius: 120, locationName: 'Nepal-India Border', data: { magnitude: 6.2 } },
  { id: 'dm2', title: 'Cyclone Warning', type: 'cyclone', severity: 'critical', lat: 15.5, lng: 85.0, radius: 300, locationName: 'Bay of Bengal', data: { windSpeed: 140 } },
  { id: 'dm3', title: 'Flood Warning', type: 'flood', severity: 'high', lat: 25.3, lng: 82.9, radius: 75, locationName: 'Ganges Basin', data: { waterLevel: 8.5 } },
  { id: 'dm4', title: 'Heatwave', type: 'heatwave', severity: 'medium', lat: 28.6, lng: 77.2, radius: 50, locationName: 'Delhi', data: { temperature: 43.5 } },
  { id: 'dm5', title: 'Earthquake M4.8', type: 'earthquake', severity: 'medium', lat: 35.9, lng: 140.2, radius: 80, locationName: 'Tokyo Region', data: { magnitude: 4.8 } },
  { id: 'dm6', title: 'Storm Warning', type: 'storm', severity: 'medium', lat: 14.5, lng: 120.9, radius: 100, locationName: 'Manila', data: { windSpeed: 65 } },
  { id: 'dm7', title: 'Flood Risk', type: 'flood', severity: 'low', lat: 23.8, lng: 90.4, radius: 60, locationName: 'Dhaka', data: { waterLevel: 3.2 } },
  { id: 'dm8', title: 'Earthquake M3.5', type: 'earthquake', severity: 'low', lat: -6.2, lng: 106.8, radius: 40, locationName: 'Jakarta Region', data: { magnitude: 3.5 } },
];

function MapView({ alerts }) {
  const [markers, setMarkers] = useState(defaultMarkers);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await api.get('/dashboard/map-data');
        if (res.data.markers && res.data.markers.length > 0) {
          setMarkers(res.data.markers);
        }
      } catch (error) {
        // Use default markers
      }
    };
    fetchMapData();
  }, []);

  const filteredMarkers = filterType === 'all'
    ? markers
    : markers.filter(m => m.type === filterType);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem' }}>🗺️ Disaster Map</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#6c6c8a' }}>Filter:</span>
          {['all', 'earthquake', 'flood', 'cyclone', 'storm', 'heatwave'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`btn ${filterType === type ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '5px 12px', fontSize: '0.75rem' }}
            >
              {type === 'all' ? 'All' : `${typeIcons[type] || ''} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: '20px', marginBottom: '15px', padding: '10px 15px',
        background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: '0.75rem', color: '#6c6c8a' }}>Severity:</span>
        {Object.entries(severityColors).map(([sev, color]) => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}></div>
            <span style={{ fontSize: '0.75rem', color: '#a0a0b8', textTransform: 'capitalize' }}>{sev}</span>
          </div>
        ))}
        <span style={{ fontSize: '0.75rem', color: '#6c6c8a', marginLeft: 'auto' }}>
          {filteredMarkers.length} events shown
        </span>
      </div>

      {/* Map */}
      <div className="map-container">
        <MapContainer
          center={[20, 78]}
          zoom={3}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {filteredMarkers.map((marker) => (
            <React.Fragment key={marker.id}>
              {/* Affected radius */}
              <Circle
                center={[marker.lat, marker.lng]}
                radius={(marker.radius || 50) * 1000}
                pathOptions={{
                  color: severityColors[marker.severity] || '#4facfe',
                  fillColor: severityColors[marker.severity] || '#4facfe',
                  fillOpacity: 0.08,
                  weight: 1,
                  opacity: 0.3,
                }}
              />
              {/* Marker point */}
              <CircleMarker
                center={[marker.lat, marker.lng]}
                radius={marker.severity === 'critical' ? 12 : marker.severity === 'high' ? 10 : 7}
                pathOptions={{
                  color: severityColors[marker.severity] || '#4facfe',
                  fillColor: severityColors[marker.severity] || '#4facfe',
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ color: '#333', minWidth: '200px' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>{typeIcons[marker.type]} {marker.title}</h4>
                    <p style={{ margin: '3px 0', fontSize: '0.85rem' }}>
                      <strong>Location:</strong> {marker.locationName}
                    </p>
                    <p style={{ margin: '3px 0', fontSize: '0.85rem' }}>
                      <strong>Severity:</strong> <span style={{ color: severityColors[marker.severity], fontWeight: 'bold' }}>
                        {marker.severity?.toUpperCase()}
                      </span>
                    </p>
                    {marker.data?.magnitude && (
                      <p style={{ margin: '3px 0', fontSize: '0.85rem' }}>
                        <strong>Magnitude:</strong> M{marker.data.magnitude}
                      </p>
                    )}
                    {marker.data?.windSpeed && (
                      <p style={{ margin: '3px 0', fontSize: '0.85rem' }}>
                        <strong>Wind:</strong> {marker.data.windSpeed} km/h
                      </p>
                    )}
                    {marker.data?.waterLevel && (
                      <p style={{ margin: '3px 0', fontSize: '0.85rem' }}>
                        <strong>Water Level:</strong> {marker.data.waterLevel}m
                      </p>
                    )}
                    {marker.data?.temperature && (
                      <p style={{ margin: '3px 0', fontSize: '0.85rem' }}>
                        <strong>Temperature:</strong> {marker.data.temperature}°C
                      </p>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;
