export const CITIES = {
  delhi: {
    name: 'Delhi',
    state: 'Delhi NCR',
    lat: 28.6139,
    lng: 77.2090,
    population: 32941000,
    zoom: 11,
    stations: [
      { id: 'DEL-01', name: 'Anand Vihar', lat: 28.6469, lng: 77.3164, zone: 'East Delhi' },
      { id: 'DEL-02', name: 'ITO', lat: 28.6289, lng: 77.2474, zone: 'Central Delhi' },
      { id: 'DEL-03', name: 'Dwarka Sec-8', lat: 28.5700, lng: 77.0688, zone: 'South-West Delhi' },
      { id: 'DEL-04', name: 'RK Puram', lat: 28.5631, lng: 77.1736, zone: 'South Delhi' },
      { id: 'DEL-05', name: 'Rohini', lat: 28.7324, lng: 77.1085, zone: 'North-West Delhi' },
      { id: 'DEL-06', name: 'Mundka', lat: 28.6810, lng: 77.0297, zone: 'West Delhi' },
      { id: 'DEL-07', name: 'Nehru Nagar', lat: 28.5684, lng: 77.2505, zone: 'South-East Delhi' },
      { id: 'DEL-08', name: 'Bawana', lat: 28.7764, lng: 77.0511, zone: 'North Delhi' },
      { id: 'DEL-09', name: 'Punjabi Bagh', lat: 28.6703, lng: 77.1301, zone: 'West Delhi' },
      { id: 'DEL-10', name: 'Okhla Phase-2', lat: 28.5309, lng: 77.2710, zone: 'South-East Delhi' },
    ],
    vulnerableLocations: [
      { type: 'hospital', name: 'AIIMS Delhi', lat: 28.5672, lng: 77.2100 },
      { type: 'school', name: 'DPS RK Puram', lat: 28.5621, lng: 77.1756 },
      { type: 'hospital', name: 'Safdarjung Hospital', lat: 28.5687, lng: 77.2066 },
      { type: 'school', name: 'Modern School Barakhamba', lat: 28.6318, lng: 77.2286 },
      { type: 'elderly', name: 'Old Age Home Vasant Kunj', lat: 28.5200, lng: 77.1600 },
    ]
  },
  mumbai: {
    name: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0760,
    lng: 72.8777,
    population: 21297000,
    zoom: 11,
    stations: [
      { id: 'MUM-01', name: 'Bandra Kurla Complex', lat: 19.0596, lng: 72.8656, zone: 'Western Suburbs' },
      { id: 'MUM-02', name: 'Colaba', lat: 18.9067, lng: 72.8147, zone: 'South Mumbai' },
      { id: 'MUM-03', name: 'Andheri', lat: 19.1136, lng: 72.8697, zone: 'Western Suburbs' },
      { id: 'MUM-04', name: 'Borivali', lat: 19.2283, lng: 72.8567, zone: 'North Mumbai' },
      { id: 'MUM-05', name: 'Mazgaon', lat: 18.9628, lng: 72.8430, zone: 'Central Mumbai' },
      { id: 'MUM-06', name: 'Worli', lat: 19.0177, lng: 72.8152, zone: 'South-Central' },
      { id: 'MUM-07', name: 'Chembur', lat: 19.0623, lng: 72.9012, zone: 'Eastern Suburbs' },
      { id: 'MUM-08', name: 'Malad', lat: 19.1860, lng: 72.8485, zone: 'Western Suburbs' },
    ],
    vulnerableLocations: [
      { type: 'hospital', name: 'KEM Hospital', lat: 19.0004, lng: 72.8418 },
      { type: 'school', name: 'Cathedral School', lat: 18.9318, lng: 72.8320 },
      { type: 'hospital', name: 'Lilavati Hospital', lat: 19.0509, lng: 72.8296 },
    ]
  },
  bengaluru: {
    name: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9716,
    lng: 77.5946,
    population: 13193000,
    zoom: 11,
    stations: [
      { id: 'BLR-01', name: 'BTM Layout', lat: 12.9166, lng: 77.6101, zone: 'South Bengaluru' },
      { id: 'BLR-02', name: 'Peenya', lat: 13.0302, lng: 77.5188, zone: 'North-West' },
      { id: 'BLR-03', name: 'Silk Board', lat: 12.9170, lng: 77.6230, zone: 'South-East' },
      { id: 'BLR-04', name: 'Hebbal', lat: 13.0358, lng: 77.5970, zone: 'North Bengaluru' },
      { id: 'BLR-05', name: 'Jayanagar', lat: 12.9308, lng: 77.5838, zone: 'Central-South' },
      { id: 'BLR-06', name: 'Whitefield', lat: 12.9698, lng: 77.7500, zone: 'East Bengaluru' },
      { id: 'BLR-07', name: 'City Railway Station', lat: 12.9784, lng: 77.5712, zone: 'Central' },
    ],
    vulnerableLocations: [
      { type: 'hospital', name: 'Manipal Hospital', lat: 12.9599, lng: 77.6485 },
      { type: 'school', name: 'Bishop Cotton School', lat: 12.9580, lng: 77.5930 },
    ]
  },
  kolkata: {
    name: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5726,
    lng: 88.3639,
    population: 15134000,
    zoom: 11,
    stations: [
      { id: 'KOL-01', name: 'Victoria Memorial', lat: 22.5448, lng: 88.3426, zone: 'South Kolkata' },
      { id: 'KOL-02', name: 'Jadavpur', lat: 22.4991, lng: 88.3702, zone: 'South-East' },
      { id: 'KOL-03', name: 'Bidhannagar', lat: 22.5828, lng: 88.4134, zone: 'East Kolkata' },
      { id: 'KOL-04', name: 'Fort William', lat: 22.5563, lng: 88.3429, zone: 'Central Kolkata' },
      { id: 'KOL-05', name: 'Rabindra Bharati', lat: 22.6050, lng: 88.3730, zone: 'North Kolkata' },
      { id: 'KOL-06', name: 'Ballygunge', lat: 22.5280, lng: 88.3640, zone: 'South Kolkata' },
    ],
    vulnerableLocations: [
      { type: 'hospital', name: 'SSKM Hospital', lat: 22.5393, lng: 88.3453 },
      { type: 'school', name: 'La Martiniere Kolkata', lat: 22.5550, lng: 88.3528 },
    ]
  },
  chennai: {
    name: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    population: 11235000,
    zoom: 11,
    stations: [
      { id: 'CHN-01', name: 'Alandur', lat: 13.0032, lng: 80.2043, zone: 'South Chennai' },
      { id: 'CHN-02', name: 'Manali', lat: 13.1665, lng: 80.2619, zone: 'North Chennai' },
      { id: 'CHN-03', name: 'Velachery', lat: 12.9815, lng: 80.2180, zone: 'South Chennai' },
      { id: 'CHN-04', name: 'Anna Nagar', lat: 13.0850, lng: 80.2101, zone: 'Central Chennai' },
      { id: 'CHN-05', name: 'Kodungaiyur', lat: 13.1268, lng: 80.2500, zone: 'North Chennai' },
      { id: 'CHN-06', name: 'T. Nagar', lat: 13.0418, lng: 80.2341, zone: 'Central-South' },
    ],
    vulnerableLocations: [
      { type: 'hospital', name: 'Apollo Hospital', lat: 13.0067, lng: 80.2206 },
      { type: 'school', name: 'PSBB School', lat: 13.0400, lng: 80.2300 },
    ]
  }
};

export const AQI_CATEGORIES = [
  { min: 0, max: 50, label: 'Good', color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)', icon: 'smile', advice: 'Air quality is satisfactory. Enjoy outdoor activities.' },
  { min: 51, max: 100, label: 'Satisfactory', color: '#84cc16', bgColor: 'rgba(132,204,22,0.15)', icon: 'smile', advice: 'Acceptable quality. Unusually sensitive people should reduce prolonged outdoor exertion.' },
  { min: 101, max: 200, label: 'Moderate', color: '#eab308', bgColor: 'rgba(234,179,8,0.15)', icon: 'meh', advice: 'May cause breathing discomfort for sensitive groups. Limit prolonged outdoor exertion.' },
  { min: 201, max: 300, label: 'Poor', color: '#f97316', bgColor: 'rgba(249,115,22,0.15)', icon: 'frown', advice: 'May cause breathing discomfort to most people. Avoid prolonged outdoor exertion.' },
  { min: 301, max: 400, label: 'Very Poor', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', icon: 'skull', advice: 'May cause respiratory illness on prolonged exposure. Avoid outdoor activity.' },
  { min: 401, max: 500, label: 'Severe', color: '#991b1b', bgColor: 'rgba(153,27,27,0.15)', icon: 'skull', advice: 'Serious health impacts. Stay indoors. Close windows and use air purifiers.' },
];

export function getAQICategory(aqi) {
  return AQI_CATEGORIES.find(c => aqi >= c.min && aqi <= c.max) || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

export function getAQIColor(aqi) {
  return getAQICategory(aqi).color;
}
