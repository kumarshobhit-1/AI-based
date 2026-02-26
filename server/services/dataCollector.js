const axios = require('axios');
const SensorData = require('../models/SensorData');
const logger = require('../utils/logger');

class DataCollectorService {
  constructor() {
    this.openWeatherKey = process.env.OPENWEATHER_API_KEY || '';
    this.usgsApiUrl = process.env.USGS_API_URL || 'https://earthquake.usgs.gov/fdsnws/event/1/query';
    
    // Cities to monitor
    this.monitoredLocations = [
      { name: 'Mumbai, India', lat: 19.076, lon: 72.8777 },
      { name: 'Delhi, India', lat: 28.6139, lon: 77.2090 },
      { name: 'Chennai, India', lat: 13.0827, lon: 80.2707 },
      { name: 'Kolkata, India', lat: 22.5726, lon: 88.3639 },
      { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503 },
      { name: 'San Francisco, USA', lat: 37.7749, lon: -122.4194 },
      { name: 'Jakarta, Indonesia', lat: -6.2088, lon: 106.8456 },
      { name: 'Manila, Philippines', lat: 14.5995, lon: 120.9842 },
      { name: 'Dhaka, Bangladesh', lat: 23.8103, lon: 90.4125 },
      { name: 'Kathmandu, Nepal', lat: 27.7172, lon: 85.3240 },
    ];
  }

  /**
   * Collect weather data from OpenWeatherMap API
   */
  async collectWeatherData() {
    if (!this.openWeatherKey || this.openWeatherKey === 'your_openweather_api_key_here') {
      logger.info('OpenWeather API key not configured, generating simulated weather data');
      return this._generateSimulatedWeatherData();
    }

    const results = [];
    for (const location of this.monitoredLocations) {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${this.openWeatherKey}&units=metric`
        );

        const data = response.data;
        const sensorData = new SensorData({
          source: 'openweather',
          type: 'weather',
          location: {
            name: location.name,
            latitude: location.lat,
            longitude: location.lon,
          },
          readings: {
            temperature: data.main.temp,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
            windDirection: data.wind.deg,
            rainfall: data.rain ? data.rain['1h'] || 0 : 0,
            visibility: data.visibility / 1000, // Convert to km
          },
          rawData: data,
          quality: 'good',
          processedAt: new Date(),
        });

        await sensorData.save();
        results.push(sensorData);
        logger.info(`Weather data collected for ${location.name}`);
      } catch (error) {
        logger.error(`Failed to collect weather for ${location.name}:`, error.message);
      }
    }
    return results;
  }

  /**
   * Collect earthquake data from USGS API
   */
  async collectEarthquakeData() {
    try {
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const response = await axios.get(this.usgsApiUrl, {
        params: {
          format: 'geojson',
          starttime: startTime,
          minmagnitude: 2.5,
          orderby: 'time',
          limit: 50,
        },
        timeout: 10000,
      });

      const results = [];
      for (const feature of response.data.features) {
        const props = feature.properties;
        const coords = feature.geometry.coordinates;

        const sensorData = new SensorData({
          source: 'usgs',
          type: 'earthquake',
          location: {
            name: props.place || 'Unknown',
            latitude: coords[1],
            longitude: coords[0],
          },
          readings: {
            magnitude: props.mag,
            depth: coords[2],
          },
          rawData: feature,
          quality: props.status === 'reviewed' ? 'good' : 'moderate',
          processedAt: new Date(),
        });

        await sensorData.save();
        results.push(sensorData);
      }

      logger.info(`Collected ${results.length} earthquake events from USGS`);
      return results;
    } catch (error) {
      logger.error('USGS earthquake data collection failed:', error.message);
      return this._generateSimulatedEarthquakeData();
    }
  }

  /**
   * Collect flood monitoring data
   */
  async collectFloodData() {
    // In production, this would integrate with national flood monitoring APIs
    // Using simulated data for demonstration
    logger.info('Collecting flood monitoring data (simulated)');
    return this._generateSimulatedFloodData();
  }

  /**
   * Generate simulated weather data for demo/testing
   */
  _generateSimulatedWeatherData() {
    const results = [];
    for (const location of this.monitoredLocations) {
      const baseTemp = 25 + (Math.random() - 0.5) * 20;
      const isExtreme = Math.random() > 0.85;

      const data = {
        source: 'openweather',
        type: 'weather',
        location: {
          name: location.name,
          latitude: location.lat,
          longitude: location.lon,
        },
        readings: {
          temperature: isExtreme ? baseTemp + 15 : baseTemp,
          humidity: Math.floor(40 + Math.random() * 55),
          pressure: Math.floor(990 + Math.random() * 40),
          windSpeed: isExtreme ? 80 + Math.random() * 100 : 5 + Math.random() * 30,
          windDirection: Math.floor(Math.random() * 360),
          rainfall: isExtreme ? 50 + Math.random() * 150 : Math.random() * 20,
          visibility: isExtreme ? 0.5 + Math.random() * 2 : 5 + Math.random() * 10,
        },
        quality: 'moderate',
        processedAt: new Date(),
      };

      results.push(data);
    }
    return results;
  }

  /**
   * Generate simulated earthquake data
   */
  _generateSimulatedEarthquakeData() {
    const zones = [
      { name: 'Pacific Ring of Fire', lat: 35.6762, lon: 139.6503 },
      { name: 'Himalayan Belt', lat: 27.7172, lon: 85.3240 },
      { name: 'San Andreas Fault', lat: 37.7749, lon: -122.4194 },
      { name: 'Indonesian Arc', lat: -6.2088, lon: 106.8456 },
      { name: 'Philippine Fault', lat: 14.5995, lon: 120.9842 },
    ];

    const results = [];
    const numEvents = Math.floor(2 + Math.random() * 5);

    for (let i = 0; i < numEvents; i++) {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      results.push({
        source: 'usgs',
        type: 'earthquake',
        location: {
          name: `Near ${zone.name}`,
          latitude: zone.lat + (Math.random() - 0.5) * 5,
          longitude: zone.lon + (Math.random() - 0.5) * 5,
        },
        readings: {
          magnitude: 2.5 + Math.random() * 5,
          depth: 5 + Math.random() * 300,
        },
        quality: 'moderate',
        processedAt: new Date(),
      });
    }
    return results;
  }

  /**
   * Generate simulated flood data
   */
  _generateSimulatedFloodData() {
    const floodProne = [
      { name: 'Ganges Basin, India', lat: 25.3176, lon: 82.9739 },
      { name: 'Brahmaputra Valley, India', lat: 26.1445, lon: 91.7362 },
      { name: 'Mekong Delta, Vietnam', lat: 10.0452, lon: 105.7469 },
      { name: 'Mississippi River, USA', lat: 29.9511, lon: -90.0715 },
      { name: 'Rhine River, Germany', lat: 50.9375, lon: 6.9603 },
    ];

    const results = [];
    for (const area of floodProne) {
      const isFlooding = Math.random() > 0.7;
      results.push({
        source: 'sensor',
        type: 'flood',
        location: {
          name: area.name,
          latitude: area.lat,
          longitude: area.lon,
        },
        readings: {
          waterLevel: isFlooding ? 5 + Math.random() * 10 : 1 + Math.random() * 3,
          rainfall: isFlooding ? 80 + Math.random() * 120 : 5 + Math.random() * 30,
        },
        quality: 'moderate',
        processedAt: new Date(),
      });
    }
    return results;
  }
}

module.exports = DataCollectorService;
