"""
Flood Prediction Model
Uses Gradient Boosting for flood risk prediction based on hydrological features.
"""
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Known flood-prone regions
FLOOD_ZONES = [
    {'name': 'Ganges-Brahmaputra Delta', 'lat': 23.5, 'lon': 89.0, 'risk_base': 0.8, 'elevation': 5},
    {'name': 'Mekong Delta', 'lat': 10.0, 'lon': 106.0, 'risk_base': 0.75, 'elevation': 3},
    {'name': 'Mississippi Basin', 'lat': 30.0, 'lon': -90.0, 'risk_base': 0.6, 'elevation': 15},
    {'name': 'Rhine Valley', 'lat': 51.0, 'lon': 7.0, 'risk_base': 0.5, 'elevation': 25},
    {'name': 'Yellow River Basin', 'lat': 35.0, 'lon': 110.0, 'risk_base': 0.65, 'elevation': 20},
    {'name': 'Nile Delta', 'lat': 31.0, 'lon': 31.0, 'risk_base': 0.55, 'elevation': 8},
    {'name': 'Amazon Basin', 'lat': -3.0, 'lon': -60.0, 'risk_base': 0.7, 'elevation': 10},
    {'name': 'Indus Valley', 'lat': 26.0, 'lon': 68.0, 'risk_base': 0.7, 'elevation': 12},
]


class FloodPredictor:
    def __init__(self):
        self.model = None
        self.model_version = '3.0'
        self._train_model()

    def _train_model(self):
        """Train a Gradient Boosting model for flood prediction"""
        try:
            np.random.seed(42)
            n_samples = 2000

            # Generate synthetic features
            rainfall = np.random.exponential(30, n_samples)
            water_level = np.random.exponential(2, n_samples) + 1
            elevation = np.random.exponential(50, n_samples)
            soil_moisture = np.random.uniform(0, 1, n_samples)
            river_proximity = np.random.exponential(20, n_samples)
            days_since_rain = np.random.exponential(5, n_samples)

            X = np.column_stack([rainfall, water_level, elevation, soil_moisture, river_proximity, days_since_rain])

            # Generate labels based on physical relationships
            flood_score = (
                0.3 * (rainfall / 100) +
                0.25 * (water_level / 10) +
                0.15 * (1 - elevation / 200) +
                0.15 * soil_moisture +
                0.1 * (1 / (river_proximity + 1)) +
                0.05 * (1 / (days_since_rain + 1))
            )
            flood_score = np.clip(flood_score + np.random.normal(0, 0.1, n_samples), 0, 1)
            labels = np.digitize(flood_score, [0.33, 0.66])

            self.model = GradientBoostingClassifier(n_estimators=100, max_depth=6, random_state=42)
            self.model.fit(X, labels)
            logger.info('Flood prediction model trained successfully')

        except Exception as e:
            logger.error(f'Failed to train flood model: {e}')
            self.model = None

    def _min_flood_zone_distance(self, lat, lon):
        min_dist = float('inf')
        for zone in FLOOD_ZONES:
            dist = np.sqrt((lat - zone['lat'])**2 + (lon - zone['lon'])**2)
            min_dist = min(min_dist, dist)
        return min_dist

    def is_ready(self):
        return self.model is not None

    def predict(self, location, features):
        """Predict flood risk"""
        rainfall = features.get('rainfall', 20)
        water_level = features.get('water_level', 2)
        elevation = features.get('elevation', 50)
        soil_moisture = features.get('soil_moisture', 0.5)
        river_proximity = features.get('river_proximity', 10)
        days_since_rain = features.get('days_since_rain', 3)

        X = np.array([[rainfall, water_level, elevation, soil_moisture, river_proximity, days_since_rain]])

        if self.model:
            risk_class = int(self.model.predict(X)[0])
            probabilities = self.model.predict_proba(X)[0]
        else:
            risk_class = 1
            probabilities = [0.3, 0.4, 0.3]

        severity_map = {0: 'low', 1: 'medium', 2: 'high'}
        probability = float(probabilities[risk_class]) if risk_class < len(probabilities) else 0.5

        return {
            'disaster_type': 'flood',
            'probability': round(probability, 3),
            'confidence': round(float(max(probabilities)), 3),
            'severity': severity_map.get(risk_class, 'medium'),
            'predicted_time': (datetime.utcnow() + timedelta(hours=np.random.randint(6, 48))).isoformat(),
            'model_used': 'flood-gradient-boosting',
            'model_version': self.model_version,
            'risk_factors': [
                f'Rainfall: {rainfall:.1f} mm',
                f'Water level: {water_level:.1f} m',
                f'Elevation: {elevation:.0f} m',
                f'Soil moisture: {soil_moisture:.0%}',
                f'River proximity: {river_proximity:.1f} km',
            ],
        }

    def assess_risk(self, location):
        """Assess flood risk for a location"""
        lat = location.get('latitude', 0)
        lon = location.get('longitude', 0)
        zone_dist = self._min_flood_zone_distance(lat, lon)

        score = max(0, 1 - (zone_dist / 30))
        score = min(1.0, score)

        level = 'low'
        if score >= 0.7:
            level = 'critical'
        elif score >= 0.5:
            level = 'high'
        elif score >= 0.3:
            level = 'medium'

        closest_zone = min(FLOOD_ZONES, key=lambda z: np.sqrt((lat - z['lat'])**2 + (lon - z['lon'])**2))

        factors = [
            f'Proximity to {closest_zone["name"]}',
            f'Typical elevation: {closest_zone["elevation"]}m',
        ]

        # Add seasonal factor
        month = datetime.utcnow().month
        if month in [6, 7, 8, 9]:  # Monsoon season (Northern hemisphere)
            factors.append('Monsoon season active')
            score = min(1.0, score + 0.1)

        return {
            'flood': {
                'level': level,
                'score': round(float(score), 3),
                'factors': factors,
            }
        }
