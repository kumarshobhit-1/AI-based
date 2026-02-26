import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import AlertsPage from './pages/AlertsPage';
import MapView from './pages/MapView';
import Predictions from './pages/Predictions';
import DataSources from './pages/DataSources';
import RiskAssessment from './pages/RiskAssessment';
import { connectSocket, disconnectSocket, subscribeToAlerts } from './services/socket';
import api from './services/api';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      setDashboardData(res.data);
    } catch (error) {
      console.log('Using demo data');
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/alerts/recent');
      setAlerts(res.data.alerts || []);
    } catch (error) {
      console.log('Using demo alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchAlerts();

    // Connect WebSocket
    connectSocket();
    subscribeToAlerts((alert) => {
      setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
      toast.warn(`🚨 ${alert.title}`, {
        position: 'top-right',
        autoClose: 8000,
        theme: 'dark',
      });
    });

    // Refresh every 2 minutes
    const interval = setInterval(() => {
      fetchDashboard();
      fetchAlerts();
    }, 120000);

    return () => {
      clearInterval(interval);
      disconnectSocket();
    };
  }, [fetchDashboard, fetchAlerts]);

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-content">
          <TopBar alertCount={alerts.filter(a => a.status === 'active').length || alerts.length} />
          <div className="page-content">
            <Routes>
              <Route
                path="/"
                element={<Dashboard data={dashboardData} alerts={alerts} loading={loading} />}
              />
              <Route
                path="/alerts"
                element={<AlertsPage alerts={alerts} loading={loading} />}
              />
              <Route path="/map" element={<MapView alerts={alerts} />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="/risk-assessment" element={<RiskAssessment />} />
            </Routes>
          </div>
        </div>
      </div>
      <ToastContainer />
    </Router>
  );
}

export default App;
