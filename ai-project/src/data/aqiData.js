import { CITIES } from './cities.js';

// Seed-based pseudo-random number generator for reproducible data
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Base AQI profiles per city (seasonal averages)
const CITY_PROFILES = {
  delhi: { winter: 310, summer: 180, monsoon: 120, autumn: 260, baseVariance: 45 },
  mumbai: { winter: 165, summer: 120, monsoon: 75, autumn: 140, baseVariance: 30 },
  bengaluru: { winter: 125, summer: 95, monsoon: 60, autumn: 110, baseVariance: 20 },
  kolkata: { winter: 210, summer: 145, monsoon: 85, autumn: 185, baseVariance: 35 },
  chennai: { winter: 115, summer: 100, monsoon: 55, autumn: 95, baseVariance: 18 },
};

// Pollutant proportions relative to AQI (µg/m³ approximations)
const POLLUTANT_RATIOS = {
  'PM2.5': { factor: 0.42, unit: 'µg/m³' },
  'PM10': { factor: 0.85, unit: 'µg/m³' },
  'NO2': { factor: 0.18, unit: 'ppb' },
  'SO2': { factor: 0.08, unit: 'ppb' },
  'O3': { factor: 0.12, unit: 'ppb' },
  'CO': { factor: 0.005, unit: 'mg/m³' },
};

function getSeason(month) {
  if (month >= 10 || month <= 1) return 'winter';
  if (month >= 2 && month <= 5) return 'summer';
  if (month >= 6 && month <= 8) return 'monsoon';
  return 'autumn';
}

function getSeasonalAQI(profile, month) {
  const season = getSeason(month);
  const seasonAQI = profile[season];
  // Add monthly micro-variation
  const monthFactor = 1 + Math.sin((month / 12) * Math.PI * 2) * 0.1;
  return seasonAQI * monthFactor;
}

// Generate hourly AQI pattern (diurnal cycle)
function getDiurnalFactor(hour) {
  // AQI peaks during morning rush (8-10) and evening (18-21)
  // Lowest during early morning (3-5) and afternoon (13-15)
  const morningPeak = Math.exp(-0.5 * Math.pow((hour - 9) / 2, 2));
  const eveningPeak = Math.exp(-0.5 * Math.pow((hour - 20) / 2.5, 2));
  const afternoonDip = -0.2 * Math.exp(-0.5 * Math.pow((hour - 14) / 3, 2));
  return 0.75 + 0.35 * morningPeak + 0.4 * eveningPeak + afternoonDip;
}

/**
 * Generate realistic AQI data for a station
 */
export function generateStationAQI(cityKey, stationIndex) {
  const profile = CITY_PROFILES[cityKey];
  const now = new Date();
  const month = now.getMonth();
  const hour = now.getHours();
  const rng = seededRandom(cityKey.length * 1000 + stationIndex * 100 + now.getDate());

  const baseAQI = getSeasonalAQI(profile, month);
  const diurnal = getDiurnalFactor(hour);
  const stationVariance = (rng() - 0.5) * profile.baseVariance * 2;
  const dailyNoise = (rng() - 0.5) * 20;

  const aqi = Math.max(15, Math.min(500, Math.round(baseAQI * diurnal + stationVariance + dailyNoise)));

  const pollutants = {};
  for (const [name, config] of Object.entries(POLLUTANT_RATIOS)) {
    const variation = 0.7 + rng() * 0.6;
    pollutants[name] = {
      value: Math.round(aqi * config.factor * variation * 10) / 10,
      unit: config.unit,
    };
  }

  return { aqi, pollutants };
}

/**
 * Generate historical AQI data (last 30 days, daily averages)
 */
export function generateHistoricalData(cityKey, days = 30) {
  const profile = CITY_PROFILES[cityKey];
  const data = [];
  const now = new Date();
  const rng = seededRandom(cityKey.length * 500 + days);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const month = date.getMonth();
    const baseAQI = getSeasonalAQI(profile, month);
    const dailyVariance = (rng() - 0.5) * profile.baseVariance;
    const weatherEffect = (rng() - 0.5) * 30; // random weather impact

    const aqi = Math.max(15, Math.min(500, Math.round(baseAQI + dailyVariance + weatherEffect)));
    data.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      aqi,
    });
  }

  return data;
}

/**
 * Generate hourly data for the last 24 hours
 */
export function generateHourlyData(cityKey) {
  const profile = CITY_PROFILES[cityKey];
  const now = new Date();
  const data = [];
  const rng = seededRandom(cityKey.length * 300 + now.getDate());

  for (let i = 23; i >= 0; i--) {
    const hour = (now.getHours() - i + 24) % 24;
    const baseAQI = getSeasonalAQI(profile, now.getMonth());
    const diurnal = getDiurnalFactor(hour);
    const noise = (rng() - 0.5) * 25;

    const aqi = Math.max(15, Math.min(500, Math.round(baseAQI * diurnal + noise)));
    const time = `${hour.toString().padStart(2, '0')}:00`;
    data.push({ time, hour, aqi });
  }

  return data;
}

/**
 * Generate pollutant breakdown for a city
 */
export function generatePollutantBreakdown(cityKey) {
  const profile = CITY_PROFILES[cityKey];
  const now = new Date();
  const baseAQI = getSeasonalAQI(profile, now.getMonth());
  const rng = seededRandom(cityKey.length * 700 + now.getDate());

  const result = {};
  for (const [name, config] of Object.entries(POLLUTANT_RATIOS)) {
    const variation = 0.7 + rng() * 0.6;
    result[name] = {
      value: Math.round(baseAQI * config.factor * variation * 10) / 10,
      unit: config.unit,
    };
  }
  return result;
}

/**
 * Get current city-level AQI (average of all stations)
 */
export function getCityAQI(cityKey) {
  const city = CITIES[cityKey];
  if (!city) return 0;

  let total = 0;
  city.stations.forEach((_, i) => {
    total += generateStationAQI(cityKey, i).aqi;
  });
  return Math.round(total / city.stations.length);
}

/**
 * Get all cities' AQI summary
 */
export function getAllCityAQIs() {
  const result = {};
  for (const key of Object.keys(CITIES)) {
    result[key] = {
      ...CITIES[key],
      currentAQI: getCityAQI(key),
      stationData: CITIES[key].stations.map((station, i) => ({
        ...station,
        ...generateStationAQI(key, i),
      })),
    };
  }
  return result;
}

/**
 * Multi-city comparison data (last 7 days)
 */
export function getMultiCityComparison() {
  const result = {};
  for (const key of Object.keys(CITIES)) {
    result[key] = {
      name: CITIES[key].name,
      data: generateHistoricalData(key, 7),
      currentAQI: getCityAQI(key),
    };
  }
  return result;
}
