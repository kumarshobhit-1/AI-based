import React, { useState, useEffect } from 'react';

function TopBar({ alertCount }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h2>Disaster Early Warning System</h2>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span>LIVE MONITORING</span>
        </div>
      </div>
      <div className="top-bar-right">
        {alertCount > 0 && (
          <span className="alert-count-badge">
            ⚠️ {alertCount} Active Alert{alertCount !== 1 ? 's' : ''}
          </span>
        )}
        <span style={{ fontSize: '0.85rem', color: '#a0a0b8' }}>
          {currentTime.toLocaleString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

export default TopBar;
