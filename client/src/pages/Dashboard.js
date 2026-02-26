import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import AlertCard from '../components/AlertCard';
import AlertDetailModal from '../components/AlertDetailModal';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
);

const defaultData = {
  summary: { activeAlerts: 7, criticalAlerts: 2, monitoredLocations: 10, dataSourcesActive: 5 },
  recentAlerts: [],
  alertsByType: [
    { _id: 'earthquake', count: 15 },
    { _id: 'flood', count: 12 },
    { _id: 'storm', count: 10 },
    { _id: 'heatwave', count: 8 },
    { _id: 'cyclone', count: 3 },
  ],
  alertsByDay: [
    { _id: '2026-02-20', count: 5 },
    { _id: '2026-02-21', count: 8 },
    { _id: '2026-02-22', count: 3 },
    { _id: '2026-02-23', count: 12 },
    { _id: '2026-02-24', count: 7 },
    { _id: '2026-02-25', count: 6 },
    { _id: '2026-02-26', count: 9 },
  ],
};

function Dashboard({ data, alerts, loading }) {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const dashData = data || defaultData;

  const displayAlerts = useMemo(() => {
    if (alerts && alerts.length > 0) return alerts.slice(0, 8);
    return dashData.recentAlerts?.slice(0, 8) || [];
  }, [alerts, dashData]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  // Chart: Alerts by Type (Doughnut)
  const typeChartData = {
    labels: (dashData.alertsByType || defaultData.alertsByType).map(t => t._id?.charAt(0).toUpperCase() + t._id?.slice(1)),
    datasets: [{
      data: (dashData.alertsByType || defaultData.alertsByType).map(t => t.count),
      backgroundColor: ['#ff6348', '#4facfe', '#ffa502', '#ff4757', '#2ed573', '#a855f7'],
      borderWidth: 0,
    }],
  };

  // Chart: Alerts Over Time (Line)
  const timeChartData = {
    labels: (dashData.alertsByDay || defaultData.alertsByDay).map(d => {
      const date = new Date(d._id);
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      label: 'Alerts',
      data: (dashData.alertsByDay || defaultData.alertsByDay).map(d => d.count),
      borderColor: '#4facfe',
      backgroundColor: 'rgba(79, 172, 254, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#4facfe',
      pointBorderWidth: 0,
      pointRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#6c6c8a' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#6c6c8a' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#a0a0b8', padding: 15, font: { size: 11 } },
      },
    },
    cutout: '60%',
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card critical">
          <div className="stat-icon">🚨</div>
          <div className="stat-value">{dashData.summary?.activeAlerts || 7}</div>
          <div className="stat-label">Active Alerts</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{dashData.summary?.criticalAlerts || 2}</div>
          <div className="stat-label">Critical Alerts</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">📍</div>
          <div className="stat-value">{dashData.summary?.monitoredLocations || 10}</div>
          <div className="stat-label">Monitored Locations</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">📡</div>
          <div className="stat-value">{dashData.summary?.dataSourcesActive || 5}</div>
          <div className="stat-label">Active Data Sources</div>
        </div>
      </div>

      {/* Charts + Alerts */}
      <div className="cards-grid">
        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <h3>🔴 Recent Alerts</h3>
            <span style={{ fontSize: '0.75rem', color: '#6c6c8a' }}>
              {displayAlerts.length} alerts
            </span>
          </div>
          <div className="card-body">
            <div className="alert-list">
              {displayAlerts.length > 0 ? (
                displayAlerts.map((alert, i) => (
                  <AlertCard
                    key={alert._id || i}
                    alert={alert}
                    onClick={setSelectedAlert}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <div className="icon">✅</div>
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alert Distribution */}
        <div className="card">
          <div className="card-header">
            <h3>📊 Alert Distribution by Type</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Doughnut data={typeChartData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Alerts Over Time - Full Width */}
        <div className="card card-full">
          <div className="card-header">
            <h3>📈 Alert Trend (Last 7 Days)</h3>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <Line data={timeChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;
