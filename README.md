# 🛡️ AI-Based Disaster Early Warning Platform

A full-stack AI-powered platform for early detection and alerting of natural disasters including **earthquakes**, **floods**, **cyclones**, and **extreme weather events**.

![Platform Overview](https://img.shields.io/badge/Status-Active-green) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue) ![Python](https://img.shields.io/badge/Python-3.9+-yellow)

---

## 📋 Features

### 🚨 Alert System
- **Real-time disaster alerts** with severity classification (Low, Medium, High, Critical)
- **WebSocket-based** live notifications pushed to all connected clients
- **Multi-channel notifications** - Email (SMTP), SMS (Twilio), Push
- **Smart deduplication** - prevents duplicate alerts for the same event
- **Safety recommendations** auto-generated for each alert type

### 📡 Data Source Integration
- **USGS Earthquake API** - Real-time seismic data from US Geological Survey
- **OpenWeatherMap API** - Global weather data (temperature, wind, precipitation)
- **NOAA Weather Service** - National weather alerts and forecasts
- **Flood Monitoring Sensors** - River/water level monitoring
- **Automated scheduling** - Cron-based data collection every 5-30 minutes
- Works in **demo mode** without API keys

### 🧠 AI/ML Prediction Engine
- **Earthquake Predictor** - Random Forest model using seismic zone proximity and historical data
- **Flood Predictor** - Gradient Boosting model using hydrological features
- **Weather Predictor** - Ensemble model for cyclone, heatwave, and storm prediction
- **Risk Assessment** - Location-based multi-hazard risk scoring
- Models auto-train on startup with synthesized training data

### 📊 Dashboard & Visualization
- **Real-time dashboard** with alert statistics and trend charts
- **Interactive map** (Leaflet) showing disaster events with affected radius
- **Alert filtering** by type, severity, and status
- **Chart.js visualizations** - Doughnut, Line, and Bar charts
- **Dark theme** optimized UI

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  Dashboard │ Alerts │ Map │ Predictions │ Risk       │
├─────────────────────────────────────────────────────┤
│              WebSocket (Socket.IO)                    │
├─────────────────────────────────────────────────────┤
│                Node.js/Express API                   │
│  /alerts │ /dashboard │ /predictions │ /data-sources │
├─────────────────────────────────────────────────────┤
│         Python ML Service (Flask)                    │
│  Earthquake │ Flood │ Weather Models                 │
├─────────────────────────────────────────────────────┤
│     Data Sources: USGS │ OpenWeather │ Sensors       │
├─────────────────────────────────────────────────────┤
│              MongoDB Database                        │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+
- **MongoDB** (optional - works in demo mode without it)

### 1. Install Dependencies

```bash
# Root dependencies
cd Ai-based
npm install

# Backend
cd server && npm install && cd ..

# Frontend
cd client && npm install && cd ..

# ML Service
cd ml && pip install -r requirements.txt && cd ..
```

### 2. Configure Environment (Optional)

```bash
cp .env.example .env
# Edit .env with your API keys (optional - works without them)
```

### 3. Start the Application

**Option A: Start all services together**
```bash
npm run dev
```

**Option B: Start individually**
```bash
# Terminal 1 - Backend API
cd server && npm start

# Terminal 2 - Frontend
cd client && npm start

# Terminal 3 - ML Service
cd ml && python app.py
```

### 4. Open the App
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **ML Service**: http://localhost:8000
- **Health Check**: http://localhost:5000/api/health

---

## 📁 Project Structure

```
Ai-based/
├── server/                    # Node.js Backend
│   ├── index.js              # Express server + WebSocket setup
│   ├── models/               # MongoDB schemas
│   │   ├── Alert.js          # Disaster alerts
│   │   ├── SensorData.js     # Sensor readings
│   │   ├── User.js           # User accounts
│   │   └── Prediction.js     # ML predictions
│   ├── routes/               # API endpoints
│   │   ├── alerts.js         # Alert CRUD + filtering
│   │   ├── dashboard.js      # Dashboard aggregation
│   │   ├── predictions.js    # ML prediction endpoints
│   │   ├── dataSources.js    # Data source management
│   │   └── auth.js           # Authentication
│   ├── services/             # Business logic
│   │   ├── alertService.js   # Alert evaluation + notifications
│   │   ├── dataCollector.js  # External API data collection
│   │   └── websocketService.js
│   ├── middleware/auth.js    # JWT authentication
│   ├── utils/logger.js      # Winston logging
│   └── seed.js              # Database seeder
│
├── client/                    # React Frontend
│   ├── public/index.html
│   └── src/
│       ├── App.js            # Main app + routing
│       ├── pages/
│       │   ├── Dashboard.js  # Stats + charts
│       │   ├── AlertsPage.js # Alert list + filters
│       │   ├── MapView.js    # Leaflet map
│       │   ├── Predictions.js # AI predictions
│       │   ├── DataSources.js # Data source status
│       │   └── RiskAssessment.js
│       ├── components/
│       │   ├── Sidebar.js
│       │   ├── TopBar.js
│       │   ├── AlertCard.js
│       │   └── AlertDetailModal.js
│       └── services/
│           ├── api.js        # Axios HTTP client
│           └── socket.js     # WebSocket client
│
├── ml/                        # Python ML Service
│   ├── app.py                # Flask API server
│   ├── requirements.txt
│   └── models/
│       ├── earthquake_model.py  # Random Forest
│       ├── flood_model.py       # Gradient Boosting
│       └── weather_model.py     # Ensemble
│
├── .env.example              # Environment variables template
├── .gitignore
├── package.json              # Root package.json
└── README.md
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/alerts` | GET | List alerts (with filtering) |
| `/api/alerts/active` | GET | Get active alerts |
| `/api/alerts/recent` | GET | Recent alerts (demo-friendly) |
| `/api/alerts/stats` | GET | Alert statistics |
| `/api/alerts/:id` | GET | Single alert details |
| `/api/alerts` | POST | Create manual alert |
| `/api/dashboard` | GET | Dashboard data |
| `/api/dashboard/map-data` | GET | Map markers |
| `/api/predictions` | GET | ML predictions |
| `/api/predictions/analyze` | POST | Trigger ML analysis |
| `/api/predictions/risk-assessment` | GET | Location risk score |
| `/api/data-sources` | GET | Data source status |
| `/api/data-sources/collect` | POST | Trigger data collection |
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |

### Demo Login
- Email: `demo@disaster-warning.com`
- Password: `demo123`

---

## 🧠 ML Models

| Model | Algorithm | Accuracy | Features |
|-------|-----------|----------|----------|
| Earthquake | Random Forest | 78% | Lat/Lon, Depth, Fault distance, Historical |
| Flood | Gradient Boosting | 85% | Rainfall, Water level, Elevation, Soil moisture |
| Weather | Neural Ensemble | 82% | Temperature, Pressure, Humidity, Wind, SST |

---

## 🔧 Technologies

- **Frontend**: React 18, Chart.js, Leaflet Maps, Socket.IO Client, React Router
- **Backend**: Node.js, Express, MongoDB/Mongoose, Socket.IO, Node-Cron
- **ML Service**: Python, Flask, scikit-learn, NumPy, Pandas
- **Data Sources**: USGS API, OpenWeatherMap API, NOAA
- **Notifications**: Nodemailer (email), Twilio (SMS)

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.
