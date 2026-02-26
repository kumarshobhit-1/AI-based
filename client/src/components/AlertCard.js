import React from 'react';

const typeIcons = {
  earthquake: '🌍',
  flood: '🌊',
  cyclone: '🌀',
  tsunami: '🌊',
  storm: '⛈️',
  heatwave: '🌡️',
  wildfire: '🔥',
  extreme_weather: '⚡',
};

const severityColors = {
  critical: '#ff4757',
  high: '#ff6348',
  medium: '#ffa502',
  low: '#4facfe',
};

function AlertCard({ alert, onClick }) {
  const icon = typeIcons[alert.type] || '⚠️';
  const timeAgo = getTimeAgo(alert.createdAt);

  return (
    <div
      className={`alert-item severity-${alert.severity}`}
      onClick={() => onClick && onClick(alert)}
    >
      <div className="alert-type-icon">{icon}</div>
      <div className="alert-info">
        <div className="alert-title">{alert.title}</div>
        <div className="alert-meta">
          <span>{alert.location?.name || 'Unknown Location'}</span>
          <span>•</span>
          <span className="time-ago">{timeAgo}</span>
        </div>
      </div>
      <span className={`severity-badge ${alert.severity}`}>
        {alert.severity}
      </span>
    </div>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export { typeIcons, severityColors };
export default AlertCard;
