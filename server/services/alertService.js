const Alert = require('../models/Alert');
const SensorData = require('../models/SensorData');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class AlertService {
  constructor(io) {
    this.io = io;
    this.thresholds = {
      earthquake: {
        low: 3.0,
        medium: 4.5,
        high: 6.0,
        critical: 7.0,
      },
      windSpeed: {
        low: 40,
        medium: 70,
        high: 100,
        critical: 150,
      },
      rainfall: {
        low: 30,
        medium: 60,
        high: 100,
        critical: 150,
      },
      temperature: {
        heatwave: 42,
        extreme: 45,
      },
      waterLevel: {
        low: 3,
        medium: 5,
        high: 8,
        critical: 12,
      },
    };

    this._setupMailer();
  }

  _setupMailer() {
    try {
      if (process.env.SMTP_HOST) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }
    } catch (error) {
      logger.warn('Email transport not configured:', error.message);
    }
  }

  /**
   * Evaluate all recent sensor data and generate alerts
   */
  async evaluateAlerts() {
    try {
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentData = await SensorData.find({
        createdAt: { $gte: thirtyMinAgo },
      }).sort({ createdAt: -1 });

      if (recentData.length === 0) {
        logger.info('No recent sensor data to evaluate');
        return [];
      }

      const newAlerts = [];

      for (const data of recentData) {
        const alert = await this._evaluateDataPoint(data);
        if (alert) {
          newAlerts.push(alert);
        }
      }

      // Broadcast new alerts via WebSocket
      for (const alert of newAlerts) {
        this._broadcastAlert(alert);
      }

      logger.info(`Alert evaluation complete. ${newAlerts.length} new alerts generated.`);
      return newAlerts;
    } catch (error) {
      logger.error('Alert evaluation failed:', error.message);
      return [];
    }
  }

  async _evaluateDataPoint(data) {
    try {
      switch (data.type) {
        case 'earthquake':
          return this._evaluateEarthquake(data);
        case 'weather':
          return this._evaluateWeather(data);
        case 'flood':
          return this._evaluateFlood(data);
        default:
          return null;
      }
    } catch (error) {
      logger.error('Error evaluating data point:', error.message);
      return null;
    }
  }

  async _evaluateEarthquake(data) {
    const magnitude = data.readings.magnitude;
    if (!magnitude || magnitude < this.thresholds.earthquake.low) return null;

    let severity = 'low';
    if (magnitude >= this.thresholds.earthquake.critical) severity = 'critical';
    else if (magnitude >= this.thresholds.earthquake.high) severity = 'high';
    else if (magnitude >= this.thresholds.earthquake.medium) severity = 'medium';

    // Check for existing alert for same event
    const existing = await Alert.findOne({
      type: 'earthquake',
      status: 'active',
      'location.latitude': { $gte: data.location.latitude - 0.5, $lte: data.location.latitude + 0.5 },
      'location.longitude': { $gte: data.location.longitude - 0.5, $lte: data.location.longitude + 0.5 },
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (existing) return null;

    const recommendations = this._getEarthquakeRecommendations(severity, magnitude);

    const alert = new Alert({
      title: `Earthquake M${magnitude.toFixed(1)} - ${data.location.name}`,
      type: 'earthquake',
      severity,
      description: `A magnitude ${magnitude.toFixed(1)} earthquake detected at depth ${data.readings.depth?.toFixed(1) || 'unknown'} km near ${data.location.name}.`,
      location: {
        name: data.location.name,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        radius: magnitude * 20,
      },
      data: {
        magnitude,
        depth: data.readings.depth,
      },
      source: data.source,
      recommendations,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await alert.save();
    logger.warn(`🚨 EARTHQUAKE ALERT: M${magnitude.toFixed(1)} near ${data.location.name} [${severity}]`);
    return alert;
  }

  async _evaluateWeather(data) {
    const { windSpeed, rainfall, temperature } = data.readings;
    let alert = null;

    // Check for extreme wind / storm
    if (windSpeed && windSpeed >= this.thresholds.windSpeed.low) {
      let severity = 'low';
      if (windSpeed >= this.thresholds.windSpeed.critical) severity = 'critical';
      else if (windSpeed >= this.thresholds.windSpeed.high) severity = 'high';
      else if (windSpeed >= this.thresholds.windSpeed.medium) severity = 'medium';

      const type = windSpeed >= this.thresholds.windSpeed.high ? 'cyclone' : 'storm';

      const existing = await Alert.findOne({
        type,
        status: 'active',
        'location.name': data.location.name,
        createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      });

      if (!existing) {
        alert = new Alert({
          title: `${type === 'cyclone' ? 'Cyclone' : 'Storm'} Warning - ${data.location.name}`,
          type,
          severity,
          description: `Wind speeds of ${windSpeed.toFixed(0)} km/h detected at ${data.location.name}. ${rainfall ? `Rainfall: ${rainfall.toFixed(0)} mm.` : ''}`,
          location: {
            name: data.location.name,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            radius: 100,
          },
          data: { windSpeed, rainfall, pressure: data.readings.pressure },
          source: data.source,
          recommendations: this._getStormRecommendations(severity),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        });
        await alert.save();
        logger.warn(`🌪️ STORM ALERT: ${windSpeed.toFixed(0)} km/h at ${data.location.name} [${severity}]`);
      }
    }

    // Check for heatwave
    if (temperature && temperature >= this.thresholds.temperature.heatwave) {
      const severity = temperature >= this.thresholds.temperature.extreme ? 'critical' : 'high';

      const existing = await Alert.findOne({
        type: 'heatwave',
        status: 'active',
        'location.name': data.location.name,
        createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      });

      if (!existing) {
        alert = new Alert({
          title: `Heatwave Alert - ${data.location.name}`,
          type: 'heatwave',
          severity,
          description: `Temperature of ${temperature.toFixed(1)}°C recorded at ${data.location.name}. Stay hydrated and avoid prolonged sun exposure.`,
          location: {
            name: data.location.name,
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            radius: 50,
          },
          data: { temperature, humidity: data.readings.humidity },
          source: data.source,
          recommendations: [
            'Stay indoors during peak hours (11 AM - 4 PM)',
            'Drink plenty of water and fluids',
            'Avoid strenuous outdoor activities',
            'Check on elderly and vulnerable people',
            'Keep pets indoors with water',
          ],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        await alert.save();
        logger.warn(`🌡️ HEATWAVE ALERT: ${temperature.toFixed(1)}°C at ${data.location.name} [${severity}]`);
      }
    }

    return alert;
  }

  async _evaluateFlood(data) {
    const { waterLevel, rainfall } = data.readings;
    if (!waterLevel || waterLevel < this.thresholds.waterLevel.low) return null;

    let severity = 'low';
    if (waterLevel >= this.thresholds.waterLevel.critical) severity = 'critical';
    else if (waterLevel >= this.thresholds.waterLevel.high) severity = 'high';
    else if (waterLevel >= this.thresholds.waterLevel.medium) severity = 'medium';

    const existing = await Alert.findOne({
      type: 'flood',
      status: 'active',
      'location.name': data.location.name,
      createdAt: { $gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
    });

    if (existing) return null;

    const alert = new Alert({
      title: `Flood Warning - ${data.location.name}`,
      type: 'flood',
      severity,
      description: `Water level at ${waterLevel.toFixed(1)}m with ${rainfall?.toFixed(0) || 0}mm rainfall near ${data.location.name}.`,
      location: {
        name: data.location.name,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        radius: 75,
      },
      data: { waterLevel, rainfall },
      source: data.source,
      recommendations: this._getFloodRecommendations(severity),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    await alert.save();
    logger.warn(`🌊 FLOOD ALERT: Level ${waterLevel.toFixed(1)}m at ${data.location.name} [${severity}]`);
    return alert;
  }

  _getEarthquakeRecommendations(severity, magnitude) {
    const base = [
      'Drop, Cover, and Hold On if shaking occurs',
      'Move away from windows and heavy objects',
      'Check for gas leaks after shaking stops',
    ];
    if (severity === 'high' || severity === 'critical') {
      return [
        ...base,
        'Be prepared for aftershocks',
        'Evacuate damaged buildings immediately',
        'Move to open areas away from structures',
        'Have emergency kit ready',
        'Follow official evacuation orders',
      ];
    }
    return base;
  }

  _getStormRecommendations(severity) {
    const base = [
      'Secure loose outdoor objects',
      'Stay indoors until storm passes',
      'Keep emergency supplies ready',
    ];
    if (severity === 'high' || severity === 'critical') {
      return [
        ...base,
        'Move to reinforced shelter immediately',
        'Stay away from windows and exterior walls',
        'Follow evacuation orders if issued',
        'Charge all communication devices',
        'Fill bathtubs and containers with water',
      ];
    }
    return base;
  }

  _getFloodRecommendations(severity) {
    const base = [
      'Move to higher ground if water is rising',
      'Avoid walking or driving through floodwater',
      'Keep important documents in waterproof bags',
    ];
    if (severity === 'high' || severity === 'critical') {
      return [
        ...base,
        'Evacuate immediately if ordered',
        'Disconnect electrical appliances',
        'Do not attempt to cross flooded roads',
        'Signal for help if stranded',
        'Boil drinking water after flooding',
      ];
    }
    return base;
  }

  _broadcastAlert(alert) {
    if (this.io) {
      this.io.emit('new-alert', {
        id: alert._id,
        title: alert.title,
        type: alert.type,
        severity: alert.severity,
        description: alert.description,
        location: alert.location,
        createdAt: alert.createdAt,
      });
    }
  }

  /**
   * Send email notification
   */
  async sendEmailAlert(alert, recipients) {
    if (!this.transporter) return;

    const severityColors = {
      low: '#3498db',
      medium: '#f39c12',
      high: '#e74c3c',
      critical: '#c0392b',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${severityColors[alert.severity]}; color: white; padding: 20px; text-align: center;">
          <h1>⚠️ DISASTER ALERT</h1>
          <h2>${alert.title}</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd;">
          <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Location:</strong> ${alert.location.name}</p>
          <p>${alert.description}</p>
          <h3>Recommendations:</h3>
          <ul>
            ${alert.recommendations.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;

    for (const email of recipients) {
      try {
        await this.transporter.sendMail({
          from: '"Disaster Warning System" <alerts@disaster-warning.com>',
          to: email,
          subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          html,
        });
      } catch (error) {
        logger.error(`Failed to send email to ${email}:`, error.message);
      }
    }
  }
}

module.exports = AlertService;
