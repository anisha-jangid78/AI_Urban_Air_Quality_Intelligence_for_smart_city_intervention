// Pollution source attribution data per city
// Each source has a base contribution percentage that varies by season and time of day

const SOURCE_PROFILES = {
  delhi: {
    vehicular: { base: 28, winter: 32, summer: 26, monsoon: 22, icon: 'car' },
    industrial: { base: 22, winter: 24, summer: 23, monsoon: 18, icon: 'factory' },
    construction: { base: 12, winter: 10, summer: 16, monsoon: 6, icon: 'hard-hat' },
    cropBurning: { base: 8, winter: 22, summer: 2, monsoon: 0, icon: 'flame' },
    domestic: { base: 10, winter: 14, summer: 8, monsoon: 7, icon: 'home' },
    dustResuspension: { base: 12, winter: 8, summer: 18, monsoon: 5, icon: 'wind' },
    powerPlants: { base: 8, winter: 10, summer: 7, monsoon: 6, icon: 'zap' },
  },
  mumbai: {
    vehicular: { base: 35, winter: 38, summer: 34, monsoon: 30, icon: 'car' },
    industrial: { base: 25, winter: 27, summer: 26, monsoon: 22, icon: 'factory' },
    construction: { base: 15, winter: 12, summer: 18, monsoon: 8, icon: 'hard-hat' },
    cropBurning: { base: 0, winter: 0, summer: 0, monsoon: 0, icon: 'flame' },
    domestic: { base: 8, winter: 10, summer: 7, monsoon: 6, icon: 'home' },
    dustResuspension: { base: 10, winter: 6, summer: 14, monsoon: 3, icon: 'wind' },
    powerPlants: { base: 7, winter: 7, summer: 8, monsoon: 6, icon: 'zap' },
  },
  bengaluru: {
    vehicular: { base: 40, winter: 42, summer: 39, monsoon: 35, icon: 'car' },
    industrial: { base: 18, winter: 20, summer: 19, monsoon: 15, icon: 'factory' },
    construction: { base: 18, winter: 14, summer: 22, monsoon: 10, icon: 'hard-hat' },
    cropBurning: { base: 2, winter: 4, summer: 1, monsoon: 0, icon: 'flame' },
    domestic: { base: 7, winter: 9, summer: 6, monsoon: 5, icon: 'home' },
    dustResuspension: { base: 10, winter: 6, summer: 14, monsoon: 4, icon: 'wind' },
    powerPlants: { base: 5, winter: 5, summer: 6, monsoon: 4, icon: 'zap' },
  },
  kolkata: {
    vehicular: { base: 30, winter: 33, summer: 29, monsoon: 25, icon: 'car' },
    industrial: { base: 25, winter: 28, summer: 25, monsoon: 20, icon: 'factory' },
    construction: { base: 12, winter: 10, summer: 15, monsoon: 7, icon: 'hard-hat' },
    cropBurning: { base: 5, winter: 12, summer: 2, monsoon: 0, icon: 'flame' },
    domestic: { base: 12, winter: 15, summer: 10, monsoon: 9, icon: 'home' },
    dustResuspension: { base: 8, winter: 5, summer: 12, monsoon: 3, icon: 'wind' },
    powerPlants: { base: 8, winter: 9, summer: 8, monsoon: 6, icon: 'zap' },
  },
  chennai: {
    vehicular: { base: 38, winter: 40, summer: 37, monsoon: 33, icon: 'car' },
    industrial: { base: 22, winter: 24, summer: 23, monsoon: 18, icon: 'factory' },
    construction: { base: 16, winter: 13, summer: 20, monsoon: 9, icon: 'hard-hat' },
    cropBurning: { base: 1, winter: 2, summer: 0, monsoon: 0, icon: 'flame' },
    domestic: { base: 8, winter: 10, summer: 7, monsoon: 6, icon: 'home' },
    dustResuspension: { base: 10, winter: 6, summer: 14, monsoon: 4, icon: 'wind' },
    powerPlants: { base: 5, winter: 5, summer: 6, monsoon: 4, icon: 'zap' },
  },
};

const SOURCE_LABELS = {
  vehicular: 'Vehicular Emissions',
  industrial: 'Industrial Activity',
  construction: 'Construction Dust',
  cropBurning: 'Crop/Stubble Burning',
  domestic: 'Domestic Sources',
  dustResuspension: 'Road Dust & Resuspension',
  powerPlants: 'Thermal Power Plants',
};

function getSeason(month) {
  if (month >= 10 || month <= 1) return 'winter';
  if (month >= 2 && month <= 5) return 'summer';
  if (month >= 6 && month <= 8) return 'monsoon';
  return 'autumn';
}

/**
 * Get source attribution for a city (with seasonal adjustment)
 */
export function getSourceAttribution(cityKey) {
  const sources = SOURCE_PROFILES[cityKey];
  if (!sources) return [];

  const month = new Date().getMonth();
  const season = getSeason(month);

  const result = [];
  let total = 0;

  for (const [key, profile] of Object.entries(sources)) {
    const seasonVal = profile[season] || profile.base;
    // Add slight randomness for realism
    const val = seasonVal + (Math.random() - 0.5) * 3;
    total += val;
    result.push({
      id: key,
      label: SOURCE_LABELS[key],
      icon: profile.icon,
      rawValue: val,
      confidence: Math.round(75 + Math.random() * 20),
    });
  }

  // Normalize to 100%
  result.forEach(item => {
    item.percentage = Math.round((item.rawValue / total) * 100);
  });

  // Sort by percentage descending
  result.sort((a, b) => b.percentage - a.percentage);

  return result;
}

/**
 * Get enforcement recommendations based on top pollution sources
 */
export function getEnforcementActions(cityKey, currentAQI) {
  const sources = getSourceAttribution(cityKey);
  const topSources = sources.slice(0, 3);

  const ACTIONS = {
    vehicular: [
      { action: 'Deploy anti-pollution squads at major traffic intersections', priority: 'High', impact: 'Immediate', area: 'All zones' },
      { action: 'Enforce odd-even vehicle restrictions in CBD area', priority: 'Critical', impact: '24-48 hours', area: 'Central zones' },
      { action: 'Increase frequency of public transport services', priority: 'Medium', impact: '1-2 weeks', area: 'City-wide' },
      { action: 'Strict PUC check drives on commercial vehicles', priority: 'High', impact: 'Immediate', area: 'Industrial corridors' },
    ],
    industrial: [
      { action: 'Inspect industrial emission compliance in flagged zones', priority: 'Critical', impact: '48-72 hours', area: 'Industrial zones' },
      { action: 'Issue show-cause notices to non-compliant units', priority: 'High', impact: '1 week', area: 'Flagged units' },
      { action: 'Mandate emission monitoring system upgrades', priority: 'Medium', impact: '1-3 months', area: 'All industrial areas' },
    ],
    construction: [
      { action: 'Mandate water sprinkling at all active construction sites', priority: 'High', impact: 'Immediate', area: 'All zones' },
      { action: 'Halt construction activities during peak AQI hours', priority: 'Critical', impact: 'Immediate', area: 'Residential zones' },
      { action: 'Deploy mobile dust monitoring units near major projects', priority: 'Medium', impact: '24 hours', area: 'Flagged sites' },
    ],
    cropBurning: [
      { action: 'Deploy satellite-guided patrol to stubble burning hotspots', priority: 'Critical', impact: 'Immediate', area: 'Peripheral zones' },
      { action: 'Activate subsidized crop residue management machinery', priority: 'High', impact: '1-2 weeks', area: 'Agricultural belt' },
      { action: 'Issue penalties to detected burn sites via geotagged evidence', priority: 'High', impact: '24 hours', area: 'Satellite-detected zones' },
    ],
    domestic: [
      { action: 'Distribute clean cooking fuel vouchers in slum areas', priority: 'Medium', impact: '2-4 weeks', area: 'Low-income zones' },
      { action: 'Awareness campaign on clean fuel alternatives', priority: 'Low', impact: '1-3 months', area: 'City-wide' },
    ],
    dustResuspension: [
      { action: 'Deploy mechanical road sweeping in high-dust corridors', priority: 'High', impact: 'Immediate', area: 'Major arterials' },
      { action: 'Water-spray tanker deployment on unpaved roads', priority: 'High', impact: 'Immediate', area: 'Peripheral areas' },
    ],
    powerPlants: [
      { action: 'Review emission compliance of nearby thermal plants', priority: 'Medium', impact: '1-2 weeks', area: 'Plant vicinity' },
      { action: 'Coordinate with state power board for load shifting', priority: 'Low', impact: '1 month', area: 'Regional' },
    ],
  };

  const recommendations = [];
  let id = 1;
  topSources.forEach(source => {
    const actions = ACTIONS[source.id] || [];
    actions.forEach(act => {
      recommendations.push({
        id: id++,
        source: source.label,
        sourceIcon: source.icon,
        sourcePercentage: source.percentage,
        ...act,
        urgency: currentAQI > 300 ? 'Immediate' : currentAQI > 200 ? 'Within 24 hours' : 'Scheduled',
      });
    });
  });

  return recommendations;
}

export { SOURCE_PROFILES, SOURCE_LABELS };
