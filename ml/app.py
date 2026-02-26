"""
AI-Based Disaster Early Warning Platform - ML Prediction Service
Provides prediction endpoints for earthquake, flood, cyclone, and weather disasters.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging
import os

from models.earthquake_model import EarthquakePredictor
from models.flood_model import FloodPredictor
from models.weather_model import WeatherPredictor

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize models
earthquake_model = EarthquakePredictor()
flood_model = FloodPredictor()
weather_model = WeatherPredictor()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'ml-prediction',
        'models': {
            'earthquake': earthquake_model.is_ready(),
            'flood': flood_model.is_ready(),
            'weather': weather_model.is_ready(),
        },
        'timestamp': datetime.utcnow().isoformat(),
    })


@app.route('/predict', methods=['POST'])
def predict():
    """General prediction endpoint"""
    try:
        data = request.json
        disaster_type = data.get('disaster_type')
        location = data.get('location', {})
        features = data.get('features', {})

        if disaster_type == 'earthquake':
            result = earthquake_model.predict(location, features)
        elif disaster_type in ('flood',):
            result = flood_model.predict(location, features)
        elif disaster_type in ('cyclone', 'storm', 'heatwave', 'extreme_weather'):
            result = weather_model.predict(disaster_type, location, features)
        else:
            return jsonify({'error': f'Unknown disaster type: {disaster_type}'}), 400

        return jsonify(result)

    except Exception as e:
        logger.error(f'Prediction error: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/predict/earthquake', methods=['POST'])
def predict_earthquake():
    """Earthquake-specific prediction"""
    try:
        data = request.json
        location = data.get('location', {})
        features = data.get('features', {})
        result = earthquake_model.predict(location, features)
        return jsonify(result)
    except Exception as e:
        logger.error(f'Earthquake prediction error: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/predict/flood', methods=['POST'])
def predict_flood():
    """Flood-specific prediction"""
    try:
        data = request.json
        location = data.get('location', {})
        features = data.get('features', {})
        result = flood_model.predict(location, features)
        return jsonify(result)
    except Exception as e:
        logger.error(f'Flood prediction error: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/predict/weather', methods=['POST'])
def predict_weather():
    """Weather disaster prediction (cyclone, heatwave, storm)"""
    try:
        data = request.json
        disaster_type = data.get('disaster_type', 'extreme_weather')
        location = data.get('location', {})
        features = data.get('features', {})
        result = weather_model.predict(disaster_type, location, features)
        return jsonify(result)
    except Exception as e:
        logger.error(f'Weather prediction error: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/risk-assessment', methods=['GET'])
def risk_assessment():
    """Combined risk assessment for a location"""
    try:
        lat = float(request.args.get('lat', 28.6))
        lon = float(request.args.get('lon', 77.2))
        location = {'latitude': lat, 'longitude': lon}

        earthquake_risk = earthquake_model.assess_risk(location)
        flood_risk = flood_model.assess_risk(location)
        weather_risk = weather_model.assess_risk(location)

        risks = {**earthquake_risk, **flood_risk, **weather_risk}

        # Calculate overall risk
        scores = [v['score'] for v in risks.values()]
        avg_score = np.mean(scores) if scores else 0

        overall = 'low'
        if avg_score >= 0.75:
            overall = 'critical'
        elif avg_score >= 0.55:
            overall = 'high'
        elif avg_score >= 0.35:
            overall = 'medium'

        return jsonify({
            'location': location,
            'riskLevels': risks,
            'overallRisk': overall,
            'overallScore': round(float(avg_score), 3),
            'lastUpdated': datetime.utcnow().isoformat(),
        })

    except Exception as e:
        logger.error(f'Risk assessment error: {str(e)}')
        return jsonify({'error': str(e)}), 500


@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about loaded models"""
    return jsonify({
        'models': [
            {
                'name': 'Seismic Activity Predictor',
                'type': 'earthquake',
                'algorithm': 'Random Forest + Feature Engineering',
                'version': '2.0',
                'accuracy': 0.78,
                'features': ['latitude', 'longitude', 'depth', 'historical_frequency', 'plate_distance'],
            },
            {
                'name': 'Flood Risk Predictor',
                'type': 'flood',
                'algorithm': 'Gradient Boosting + Time Series',
                'version': '3.0',
                'accuracy': 0.85,
                'features': ['rainfall', 'water_level', 'elevation', 'soil_moisture', 'river_proximity'],
            },
            {
                'name': 'Extreme Weather Predictor',
                'type': 'weather',
                'algorithm': 'Neural Network + Ensemble',
                'version': '1.5',
                'accuracy': 0.82,
                'features': ['temperature', 'pressure', 'humidity', 'wind_speed', 'sea_surface_temp'],
            },
        ],
    })


if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 8000))
    logger.info(f'🧠 ML Prediction Service starting on port {port}')
    app.run(host='0.0.0.0', port=port, debug=True)
