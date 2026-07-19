import { CITIES, getAQICategory } from '../data/cities.js';

/**
 * Health Risk Scoring Engine
 * Combines AQI levels with population vulnerability data
 */

const RISK_LEVELS = [
  { min: 0, max: 25, label: 'Minimal', color: '#22c55e', icon: 'circle-check' },
  { min: 26, max: 50, label: 'Low', color: '#84cc16', icon: 'circle-check' },
  { min: 51, max: 70, label: 'Moderate', color: '#eab308', icon: 'circle-alert' },
  { min: 71, max: 85, label: 'High', color: '#f97316', icon: 'triangle-alert' },
  { min: 86, max: 100, label: 'Critical', color: '#ef4444', icon: 'octagon-alert' },
];

const VULNERABILITY_WEIGHTS = {
  hospital: 1.3,
  school: 1.25,
  elderly: 1.4,
  outdoor_workers: 1.35,
  general: 1.0,
};

function getRiskLevel(score) {
  return RISK_LEVELS.find(r => score >= r.min && score <= r.max) || RISK_LEVELS[RISK_LEVELS.length - 1];
}

/**
 * Calculate health risk score for a location
 * Score 0-100 based on AQI and vulnerability factors
 */
function calculateRiskScore(aqi, vulnerabilityType = 'general') {
  // Normalize AQI to 0-100 scale
  let baseScore = Math.min(100, (aqi / 500) * 100);

  // Apply vulnerability multiplier
  const weight = VULNERABILITY_WEIGHTS[vulnerabilityType] || 1.0;
  let adjustedScore = baseScore * weight;

  // Non-linear scaling: higher AQI has exponentially more risk
  if (aqi > 300) adjustedScore *= 1.2;
  else if (aqi > 200) adjustedScore *= 1.1;

  return Math.min(100, Math.round(adjustedScore));
}

/**
 * Generate health advisories for a city
 */
export function generateHealthAdvisories(cityKey, cityAQI) {
  const city = CITIES[cityKey];
  if (!city) return [];

  const aqiCategory = getAQICategory(cityAQI);
  const advisories = [];

  // General population advisory
  advisories.push({
    type: 'general',
    icon: 'shield-alert',
    title: `AQI ${aqiCategory.label} — General Advisory`,
    message: aqiCategory.advice,
    riskScore: calculateRiskScore(cityAQI, 'general'),
    riskLevel: getRiskLevel(calculateRiskScore(cityAQI, 'general')),
    population: 'General Population',
  });

  // Vulnerable location advisories
  if (city.vulnerableLocations) {
    city.vulnerableLocations.forEach(loc => {
      const score = calculateRiskScore(cityAQI, loc.type);
      const risk = getRiskLevel(score);
      
      let advice = '';
      if (loc.type === 'hospital') {
        advice = cityAQI > 200
          ? `Patients at ${loc.name} should remain indoors. ICU ventilation systems should be set to recirculation mode.`
          : `Standard precautions. Sensitive patients at ${loc.name} should limit outdoor exposure.`;
      } else if (loc.type === 'school') {
        advice = cityAQI > 200
          ? `All outdoor activities at ${loc.name} should be suspended. Consider early dismissal if AQI > 300.`
          : cityAQI > 100
            ? `Outdoor PE and sports at ${loc.name} should be limited to 30 minutes.`
            : `Normal activities can continue at ${loc.name}. Monitor for sensitive children.`;
      } else if (loc.type === 'elderly') {
        advice = cityAQI > 150
          ? `Residents at ${loc.name} should stay indoors with air purifiers. Close all windows.`
          : `Limit outdoor walks at ${loc.name} to early morning hours when AQI is typically lower.`;
      }

      advisories.push({
        type: loc.type,
        icon: loc.type === 'hospital' ? 'building-2' : loc.type === 'school' ? 'graduation-cap' : 'heart-handshake',
        title: loc.name,
        message: advice,
        riskScore: score,
        riskLevel: risk,
        population: loc.type === 'hospital' ? 'Patients & Staff'
          : loc.type === 'school' ? 'Students & Teachers'
            : 'Elderly Residents',
        lat: loc.lat,
        lng: loc.lng,
      });
    });
  }

  // Outdoor workers advisory (always present)
  const outdoorScore = calculateRiskScore(cityAQI, 'outdoor_workers');
  advisories.push({
    type: 'outdoor_workers',
    icon: 'hard-hat',
    title: 'Outdoor Workers Advisory',
    message: cityAQI > 200
      ? 'All outdoor workers should be provided N95 masks. Rotate shifts to limit exposure. Construction activities should cease if AQI > 350.'
      : cityAQI > 100
        ? 'Outdoor workers should take regular breaks in enclosed areas. Masks recommended for prolonged exposure.'
        : 'Standard precautions for outdoor work. Stay hydrated and monitor air quality updates.',
    riskScore: outdoorScore,
    riskLevel: getRiskLevel(outdoorScore),
    population: 'Construction & Outdoor Workers',
  });

  // Sort by risk score descending
  advisories.sort((a, b) => b.riskScore - a.riskScore);

  return advisories;
}

/**
 * City-wide health risk summary
 */
export function getCityHealthSummary(cityKey, cityAQI) {
  const advisories = generateHealthAdvisories(cityKey, cityAQI);
  const avgRisk = Math.round(advisories.reduce((sum, a) => sum + a.riskScore, 0) / advisories.length);
  const criticalCount = advisories.filter(a => a.riskScore > 70).length;
  const highestRisk = advisories[0];

  return {
    overallRisk: getRiskLevel(avgRisk),
    overallScore: avgRisk,
    criticalAlerts: criticalCount,
    highestRiskLocation: highestRisk ? highestRisk.title : 'N/A',
    advisories,
    totalVulnerablePopulation: Math.round(CITIES[cityKey]?.population * 0.15 || 0), // ~15% vulnerable
  };
}

export { RISK_LEVELS, getRiskLevel };
