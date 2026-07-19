import { generateHourlyData, generateHistoricalData } from '../data/aqiData.js';

/**
 * AI-powered AQI Prediction Engine
 * Uses exponential smoothing with trend decomposition and weather correlation
 */

// Triple Exponential Smoothing (Holt-Winters-like)
function exponentialSmoothing(data, alpha = 0.3, beta = 0.1) {
  if (data.length < 2) return data;

  let level = data[0];
  let trend = data[1] - data[0];
  const smoothed = [level];

  for (let i = 1; i < data.length; i++) {
    const prevLevel = level;
    level = alpha * data[i] + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    smoothed.push(level);
  }

  return { level, trend, smoothed };
}

// Weather impact simulation
function getWeatherImpact(hour, dayOffset) {
  // Simulate weather factors: wind speed, humidity, temperature inversions
  const windFactor = 0.8 + 0.4 * Math.sin((hour / 24 + dayOffset / 7) * Math.PI * 2);
  const humidityFactor = 1 + 0.15 * Math.cos((hour / 24) * Math.PI * 2);
  const inversionFactor = hour < 8 || hour > 20 ? 1.15 : 0.9;

  return windFactor * humidityFactor * inversionFactor;
}

/**
 * Generate 72-hour AQI forecast
 */
export function generateForecast(cityKey) {
  const hourlyData = generateHourlyData(cityKey);
  const aqiValues = hourlyData.map(h => h.aqi);

  const { level, trend } = exponentialSmoothing(aqiValues);

  const forecast = [];
  const now = new Date();

  for (let i = 1; i <= 72; i++) {
    const futureHour = (now.getHours() + i) % 24;
    const dayOffset = Math.floor(i / 24);

    // Base prediction from trend
    let predictedAQI = level + trend * i * 0.3;

    // Apply diurnal cycle
    const morningPeak = Math.exp(-0.5 * Math.pow((futureHour - 9) / 2, 2));
    const eveningPeak = Math.exp(-0.5 * Math.pow((futureHour - 20) / 2.5, 2));
    const diurnalEffect = 0.8 + 0.3 * morningPeak + 0.35 * eveningPeak;
    predictedAQI *= diurnalEffect;

    // Apply weather impact
    const weatherImpact = getWeatherImpact(futureHour, dayOffset);
    predictedAQI *= weatherImpact;

    // Add controlled noise
    const noise = (Math.sin(i * 0.7) * 8 + Math.cos(i * 1.3) * 5);
    predictedAQI += noise;

    // Confidence interval widens with time
    const confidenceSpread = 10 + i * 1.5;

    const forecastTime = new Date(now);
    forecastTime.setHours(forecastTime.getHours() + i);

    forecast.push({
      hour: i,
      time: forecastTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      date: forecastTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      label: `${forecastTime.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${forecastTime.toLocaleTimeString('en-IN', { hour: '2-digit', hour12: true })}`,
      aqi: Math.max(15, Math.min(500, Math.round(predictedAQI))),
      upper: Math.max(15, Math.min(500, Math.round(predictedAQI + confidenceSpread))),
      lower: Math.max(15, Math.min(500, Math.round(predictedAQI - confidenceSpread))),
      confidence: Math.max(50, Math.round(95 - i * 0.5)),
      weatherImpact: weatherImpact > 1.1 ? 'Adverse' : weatherImpact < 0.9 ? 'Favorable' : 'Neutral',
    });
  }

  return forecast;
}

/**
 * Generate trend analysis summary
 */
export function analyzeTrend(cityKey) {
  const historical = generateHistoricalData(cityKey, 14);
  const aqiValues = historical.map(d => d.aqi);

  const recent7 = aqiValues.slice(-7);
  const prior7 = aqiValues.slice(0, 7);

  const recentAvg = recent7.reduce((a, b) => a + b, 0) / 7;
  const priorAvg = prior7.reduce((a, b) => a + b, 0) / 7;

  const changePercent = ((recentAvg - priorAvg) / priorAvg) * 100;

  // Find peak and trough
  const peak = Math.max(...aqiValues);
  const trough = Math.min(...aqiValues);
  const peakDay = historical[aqiValues.indexOf(peak)].label;
  const troughDay = historical[aqiValues.indexOf(trough)].label;

  return {
    recentAvg: Math.round(recentAvg),
    priorAvg: Math.round(priorAvg),
    changePercent: Math.round(changePercent * 10) / 10,
    direction: changePercent > 5 ? 'worsening' : changePercent < -5 ? 'improving' : 'stable',
    directionIcon: changePercent > 5 ? 'trending-up' : changePercent < -5 ? 'trending-down' : 'minus',
    peak: { value: peak, day: peakDay },
    trough: { value: trough, day: troughDay },
    volatility: Math.round(Math.sqrt(aqiValues.reduce((sum, v) => sum + Math.pow(v - recentAvg, 2), 0) / aqiValues.length)),
  };
}
