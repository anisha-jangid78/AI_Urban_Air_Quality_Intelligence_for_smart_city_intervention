import './style.css';
import L from 'leaflet';
import { Chart, registerables } from 'chart.js';
import { createIcons, icons } from 'lucide';
import { CITIES, getAQICategory, getAQIColor } from './data/cities.js';
import {
  getAllCityAQIs,
  getCityAQI,
  generateHistoricalData,
  generateHourlyData,
  generatePollutantBreakdown,
  getMultiCityComparison,
} from './data/aqiData.js';
import { getSourceAttribution, getEnforcementActions } from './data/sources.js';
import { generateForecast, analyzeTrend } from './ai/predictor.js';
import { generateHealthAdvisories, getCityHealthSummary } from './ai/healthRisk.js';

Chart.register(...registerables);

// ─── App State ───────────────────────────────────────────────
const state = {
  currentCity: 'delhi',
  currentView: 'dashboard',
  map: null,
  charts: {},
  markers: [],
};

// ─── DOM Refs ────────────────────────────────────────────────
const viewContainer = document.getElementById('view-container');
const citySelect = document.getElementById('city-select');
const topBarCity = document.getElementById('top-bar-city');
const topAqiBadge = document.getElementById('top-aqi-badge');
const topAqiLabel = document.getElementById('top-aqi-label');
const viewTitle = document.getElementById('view-title');
const lastUpdated = document.getElementById('last-updated');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

// ─── Chart Defaults ──────────────────────────────────────────
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.elements.point.radius = 3;
Chart.defaults.elements.point.hoverRadius = 6;
Chart.defaults.animation.duration = 800;
Chart.defaults.animation.easing = 'easeOutQuart';

// ─── Initialize ──────────────────────────────────────────────
function init() {
  setupEventListeners();
  // Small delay for visual loading effect
  setTimeout(() => {
    updateTopBar();
    renderView(state.currentView);
    updateLastUpdated();
    createIcons({ icons });
  }, 800);
}

function setupEventListeners() {
  // Nav buttons
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      setActiveNav(btn);
      switchView(view);
    });
  });

  // City selector
  citySelect.addEventListener('change', (e) => {
    state.currentCity = e.target.value;
    updateTopBar();
    renderView(state.currentView);
    updateLastUpdated();
  });

  // Mobile menu toggle
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar on nav click (mobile)
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  });
}

function setActiveNav(activeBtn) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}

function switchView(view) {
  state.currentView = view;
  const titles = {
    dashboard: 'Dashboard',
    map: 'AQI Geospatial Map',
    forecast: 'AI Forecast Engine',
    sources: 'Source Attribution',
    health: 'Health Advisory',
    enforcement: 'Enforcement Intelligence',
    compare: 'Multi-City Comparison',
  };
  viewTitle.textContent = titles[view] || 'Dashboard';
  renderView(view);
}

function updateTopBar() {
  const city = CITIES[state.currentCity];
  const aqi = getCityAQI(state.currentCity);
  const cat = getAQICategory(aqi);

  topBarCity.textContent = city.name;
  topAqiBadge.textContent = aqi;
  topAqiBadge.style.background = cat.bgColor;
  topAqiBadge.style.color = cat.color;
  topAqiLabel.innerHTML = `${cat.label} <i data-lucide="${cat.icon}" style="width: 14px; height: 14px; vertical-align: middle; display: inline-block;"></i>`;
  createIcons({ icons });
}

function updateLastUpdated() {
  const now = new Date();
  lastUpdated.textContent = `Updated: ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
}

// ─── Destroy Charts ──────────────────────────────────────────
function destroyCharts() {
  Object.values(state.charts).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') chart.destroy();
  });
  state.charts = {};
}

// ─── View Renderers ──────────────────────────────────────────
function renderView(view) {
  destroyCharts();

  // Destroy map if switching away
  if (view !== 'map' && state.map) {
    state.map.remove();
    state.map = null;
  }

  const renderers = {
    dashboard: renderDashboard,
    map: renderMap,
    forecast: renderForecast,
    sources: renderSources,
    health: renderHealth,
    enforcement: renderEnforcement,
    compare: renderCompare,
  };

  const renderer = renderers[view];
  if (renderer) {
    renderer();
    createIcons({ icons });
  }
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════
function renderDashboard() {
  const cityKey = state.currentCity;
  const city = CITIES[cityKey];
  const aqi = getCityAQI(cityKey);
  const cat = getAQICategory(aqi);
  const trend = analyzeTrend(cityKey);
  const pollutants = generatePollutantBreakdown(cityKey);
  const sources = getSourceAttribution(cityKey);
  const health = getCityHealthSummary(cityKey, aqi);

  viewContainer.innerHTML = `
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card blue stagger-1">
        <div class="kpi-label">Current AQI</div>
        <div class="kpi-value" style="color:${cat.color}">${aqi}</div>
        <div class="kpi-sub">${cat.label} <i data-lucide="${cat.icon}" style="width: 14px; height: 14px; vertical-align: middle; display: inline-block;"></i></div>
        <div class="kpi-icon"><i data-lucide="thermometer"></i></div>
      </div>
      <div class="kpi-card purple stagger-2">
        <div class="kpi-label">7-Day Trend</div>
        <div class="kpi-value" style="display: flex; align-items: center;"><i data-lucide="${trend.directionIcon}" style="width: 32px; height: 32px; color: ${trend.direction === 'worsening' ? 'var(--accent-red)' : trend.direction === 'improving' ? 'var(--accent-green)' : 'var(--accent-yellow)'}"></i></div>
        <div class="kpi-sub">
          <span class="trend-badge ${trend.direction === 'worsening' ? 'up' : trend.direction === 'improving' ? 'down' : 'stable'}">
            ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}%
          </span>
          ${trend.direction}
        </div>
        <div class="kpi-icon"><i data-lucide="bar-chart-3"></i></div>
      </div>
      <div class="kpi-card warm stagger-3">
        <div class="kpi-label">Health Risk</div>
        <div class="kpi-value" style="color:${health.overallRisk.color}">${health.overallScore}</div>
        <div class="kpi-sub">${health.overallRisk.label} · ${health.criticalAlerts} alerts</div>
        <div class="kpi-icon"><i data-lucide="heart-pulse"></i></div>
      </div>
      <div class="kpi-card cool stagger-4">
        <div class="kpi-label">Active Stations</div>
        <div class="kpi-value">${city.stations.length}</div>
        <div class="kpi-sub">${city.name} monitoring network</div>
        <div class="kpi-icon"><i data-lucide="activity"></i></div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="dashboard-grid">
      <div class="glass-card stagger-5">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="trending-up" class="card-title-icon"></i> 24-Hour AQI Trend</span>
        </div>
        <div class="chart-container">
          <canvas id="hourly-chart"></canvas>
        </div>
      </div>
      <div class="glass-card stagger-6">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="activity" class="card-title-icon"></i> Pollutant Breakdown</span>
        </div>
        <div class="chart-container">
          <canvas id="pollutant-chart"></canvas>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="glass-card stagger-7">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="scan-search" class="card-title-icon"></i> Top Pollution Sources</span>
        </div>
        ${sources.slice(0, 5).map(s => `
          <div class="source-bar">
            <span class="source-icon"><i data-lucide="${s.icon}"></i></span>
            <div class="source-info">
              <div class="source-name">${s.label}</div>
              <div class="source-progress">
                <div class="source-progress-bar" style="width:${s.percentage}%; background: ${s.percentage > 25 ? 'linear-gradient(90deg, #ef4444, #f97316)' : s.percentage > 15 ? 'linear-gradient(90deg, #eab308, #f97316)' : 'var(--gradient-accent)'}"></div>
              </div>
            </div>
            <span class="source-percentage">${s.percentage}%</span>
          </div>
        `).join('')}
      </div>
      <div class="glass-card stagger-8">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="calendar" class="card-title-icon"></i> 30-Day History</span>
        </div>
        <div class="chart-container">
          <canvas id="history-chart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render charts
  renderHourlyChart(cityKey);
  renderPollutantChart(pollutants);
  renderHistoryChart(cityKey);
}

function renderHourlyChart(cityKey) {
  const data = generateHourlyData(cityKey);
  const ctx = document.getElementById('hourly-chart');
  if (!ctx) return;

  state.charts.hourly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.time),
      datasets: [{
        label: 'AQI',
        data: data.map(d => d.aqi),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: data.map(d => getAQIColor(d.aqi)),
        pointBorderColor: 'transparent',
        pointRadius: 3,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const cat = getAQICategory(ctx.parsed.y);
              return `AQI: ${ctx.parsed.y} (${cat.label})`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, maxTicksLimit: 8, font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { size: 11 } } },
      }
    }
  });
}

function renderPollutantChart(pollutants) {
  const ctx = document.getElementById('pollutant-chart');
  if (!ctx) return;

  const labels = Object.keys(pollutants);
  const values = labels.map(k => pollutants[k].value);
  const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#ef4444'];

  state.charts.pollutant = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels.map((l, i) => `${l} (${pollutants[l].value} ${pollutants[l].unit})`),
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + '30'),
        borderColor: colors,
        borderWidth: 2,
        hoverBorderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 11 }, padding: 10 },
        },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
        }
      },
    }
  });
}

function renderHistoryChart(cityKey) {
  const data = generateHistoricalData(cityKey, 30);
  const ctx = document.getElementById('history-chart');
  if (!ctx) return;

  state.charts.history = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'Daily AQI',
        data: data.map(d => d.aqi),
        backgroundColor: data.map(d => getAQIColor(d.aqi) + '50'),
        borderColor: data.map(d => getAQIColor(d.aqi)),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const cat = getAQICategory(ctx.parsed.y);
              return `AQI: ${ctx.parsed.y} (${cat.label})`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45, maxTicksLimit: 10, font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { size: 11 } } },
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// MAP VIEW
// ═══════════════════════════════════════════════════════════════
function renderMap() {
  const cityKey = state.currentCity;
  const city = CITIES[cityKey];
  const allData = getAllCityAQIs();
  const cityData = allData[cityKey];

  viewContainer.innerHTML = `<div class="map-wrapper"><div id="aqi-map"></div></div>`;

  // Initialize Leaflet map
  setTimeout(() => {
    state.map = L.map('aqi-map', {
      zoomControl: true,
      attributionControl: true,
    }).setView([city.lat, city.lng], city.zoom);

    // Dark map tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(state.map);

    // Listen to popup opens to instantiate Lucide icons inside popup popups
    state.map.on('popupopen', () => {
      createIcons({ icons });
    });

    // Add station markers
    cityData.stationData.forEach(station => {
      const cat = getAQICategory(station.aqi);

      // Custom AQI marker
      const icon = L.divIcon({
        className: '',
        html: `<div class="aqi-marker" style="background:${cat.color}; box-shadow: 0 0 20px ${cat.color}50">${station.aqi}</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([station.lat, station.lng], { icon }).addTo(state.map);

      // Build pollutant rows
      const pollutantRows = Object.entries(station.pollutants).map(([name, data]) =>
        `<div class="popup-pollutant">
          <span class="popup-pollutant-name">${name}</span>
          <span class="popup-pollutant-value">${data.value} ${data.unit}</span>
        </div>`
      ).join('');

      marker.bindPopup(`
        <div class="station-popup">
          <h3>${station.name}</h3>
          <div class="popup-zone">${station.zone} · ${station.id}</div>
          <div class="popup-aqi" style="background:${cat.bgColor}; color:${cat.color}">
            ${station.aqi} <span style="font-size:0.6em">${cat.label}</span>
          </div>
          <div class="popup-pollutants">${pollutantRows}</div>
        </div>
      `, { maxWidth: 280 });
    });

    // Add vulnerable location markers
    if (city.vulnerableLocations) {
      city.vulnerableLocations.forEach(loc => {
        const iconHtml = loc.type === 'hospital'
          ? '<i data-lucide="building-2" style="width:20px; height:20px; color:#ef4444; display:block;"></i>'
          : loc.type === 'school'
            ? '<i data-lucide="graduation-cap" style="width:20px; height:20px; color:#3b82f6; display:block;"></i>'
            : '<i data-lucide="heart-handshake" style="width:20px; height:20px; color:#ec4899; display:block;"></i>';

        const icon = L.divIcon({
          className: '',
          html: `<div style="filter:drop-shadow(0 0 4px rgba(0,0,0,0.5))">${iconHtml}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });

        L.marker([loc.lat, loc.lng], { icon }).addTo(state.map)
          .bindPopup(`<div class="station-popup"><h3>${loc.name}</h3><div class="popup-zone">Vulnerable: ${loc.type}</div></div>`);
      });
    }

    // Add AQI heat circles
    cityData.stationData.forEach(station => {
      const cat = getAQICategory(station.aqi);
      L.circle([station.lat, station.lng], {
        radius: 1500,
        color: cat.color,
        fillColor: cat.color,
        fillOpacity: 0.08,
        weight: 1,
        opacity: 0.3,
      }).addTo(state.map);
    });

    createIcons({ icons });
    state.map.invalidateSize();
  }, 100);
}

// ═══════════════════════════════════════════════════════════════
// FORECAST VIEW
// ═══════════════════════════════════════════════════════════════
function renderForecast() {
  const cityKey = state.currentCity;
  const forecast = generateForecast(cityKey);
  const trend = analyzeTrend(cityKey);
  const aqi = getCityAQI(cityKey);
  const cat = getAQICategory(aqi);

  // Get forecasts at key intervals
  const forecast24 = forecast[23];
  const forecast48 = forecast[47];
  const forecast72 = forecast[71];

  viewContainer.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card blue stagger-1">
        <div class="kpi-label">Now</div>
        <div class="kpi-value" style="color:${cat.color}">${aqi}</div>
        <div class="kpi-sub">${cat.label}</div>
        <div class="kpi-icon"><i data-lucide="map-pin"></i></div>
      </div>
      <div class="kpi-card purple stagger-2">
        <div class="kpi-label">+24 Hours</div>
        <div class="kpi-value" style="color:${getAQIColor(forecast24.aqi)}">${forecast24.aqi}</div>
        <div class="kpi-sub">${getAQICategory(forecast24.aqi).label} · ${forecast24.confidence}% conf.</div>
        <div class="kpi-icon"><i data-lucide="brain-circuit"></i></div>
      </div>
      <div class="kpi-card warm stagger-3">
        <div class="kpi-label">+48 Hours</div>
        <div class="kpi-value" style="color:${getAQIColor(forecast48.aqi)}">${forecast48.aqi}</div>
        <div class="kpi-sub">${getAQICategory(forecast48.aqi).label} · ${forecast48.confidence}% conf.</div>
        <div class="kpi-icon"><i data-lucide="calendar"></i></div>
      </div>
      <div class="kpi-card cool stagger-4">
        <div class="kpi-label">+72 Hours</div>
        <div class="kpi-value" style="color:${getAQIColor(forecast72.aqi)}">${forecast72.aqi}</div>
        <div class="kpi-sub">${getAQICategory(forecast72.aqi).label} · ${forecast72.confidence}% conf.</div>
        <div class="kpi-icon"><i data-lucide="calendar"></i></div>
      </div>
    </div>

    <div class="glass-card stagger-5 mb-3">
      <div class="glass-card-header">
        <span class="glass-card-title"><i data-lucide="brain-circuit" class="card-title-icon"></i> 72-Hour AI Forecast with Confidence Interval</span>
      </div>
      <div class="forecast-controls">
        <button class="forecast-btn active" data-hours="24" id="fc-24">24 Hours</button>
        <button class="forecast-btn" data-hours="48" id="fc-48">48 Hours</button>
        <button class="forecast-btn" data-hours="72" id="fc-72">72 Hours</button>
      </div>
      <div class="chart-container tall">
        <canvas id="forecast-chart"></canvas>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="glass-card stagger-6">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="bar-chart-3" class="card-title-icon"></i> Trend Analysis</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">7-Day Average</span>
          <span class="stat-value" style="color:${getAQIColor(trend.recentAvg)}">${trend.recentAvg}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Prior 7-Day Average</span>
          <span class="stat-value">${trend.priorAvg}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Change</span>
          <span class="stat-value">
            <span class="trend-badge ${trend.direction === 'worsening' ? 'up' : trend.direction === 'improving' ? 'down' : 'stable'}">
              ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}% <i data-lucide="${trend.directionIcon}" style="width: 14px; height: 14px; vertical-align: middle; display: inline-block;"></i>
            </span>
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Peak (14d)</span>
          <span class="stat-value" style="color:${getAQIColor(trend.peak.value)}">${trend.peak.value} <span style="font-size:0.7em;color:var(--text-muted)">${trend.peak.day}</span></span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Trough (14d)</span>
          <span class="stat-value" style="color:${getAQIColor(trend.trough.value)}">${trend.trough.value} <span style="font-size:0.7em;color:var(--text-muted)">${trend.trough.day}</span></span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Volatility Index</span>
          <span class="stat-value">${trend.volatility}</span>
        </div>
      </div>
      <div class="glass-card stagger-7">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="cloud-sun" class="card-title-icon"></i> Weather Impact on Forecast</span>
        </div>
        <div class="chart-container">
          <canvas id="weather-impact-chart"></canvas>
        </div>
      </div>
    </div>
  `;

  // Render forecast chart
  renderForecastChart(forecast, 24);

  // Forecast controls
  document.querySelectorAll('.forecast-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.forecast-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const hours = parseInt(btn.dataset.hours);
      destroyCharts();
      renderForecastChart(forecast, hours);
      renderWeatherImpactChart(forecast, hours);
    });
  });

  renderWeatherImpactChart(forecast, 24);
}

function renderForecastChart(forecast, hours) {
  const ctx = document.getElementById('forecast-chart');
  if (!ctx) return;

  const subset = forecast.slice(0, hours);
  const tickInterval = hours <= 24 ? 3 : hours <= 48 ? 6 : 8;

  state.charts.forecast = new Chart(ctx, {
    type: 'line',
    data: {
      labels: subset.map(f => f.label),
      datasets: [
        {
          label: 'Predicted AQI',
          data: subset.map(f => f.aqi),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.05)',
          fill: false,
          tension: 0.3,
          borderWidth: 2.5,
          pointBackgroundColor: subset.map(f => getAQIColor(f.aqi)),
          pointBorderColor: 'transparent',
          pointRadius: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'Upper Bound',
          data: subset.map(f => f.upper),
          borderColor: 'rgba(239,68,68,0.3)',
          backgroundColor: 'rgba(239,68,68,0.06)',
          fill: '+1',
          tension: 0.3,
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
        },
        {
          label: 'Lower Bound',
          data: subset.map(f => f.lower),
          borderColor: 'rgba(34,197,94,0.3)',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.3,
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { font: { size: 11 } } },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            afterLabel: (ctx) => {
              if (ctx.datasetIndex === 0) {
                const f = forecast[ctx.dataIndex];
                return `Confidence: ${f.confidence}%\nWeather: ${f.weatherImpact}`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, maxTicksLimit: Math.ceil(hours / tickInterval), font: { size: 10 } },
        },
        y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { size: 11 } } },
      }
    }
  });
}

function renderWeatherImpactChart(forecast, hours) {
  const ctx = document.getElementById('weather-impact-chart');
  if (!ctx) return;

  const subset = forecast.slice(0, hours);
  const weatherMap = { Adverse: 1, Neutral: 0, Favorable: -1 };

  state.charts.weather = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: subset.filter((_, i) => i % 3 === 0).map(f => f.label),
      datasets: [{
        label: 'Weather Impact',
        data: subset.filter((_, i) => i % 3 === 0).map(f => weatherMap[f.weatherImpact]),
        backgroundColor: subset.filter((_, i) => i % 3 === 0).map(f =>
          f.weatherImpact === 'Adverse' ? 'rgba(239,68,68,0.4)' :
            f.weatherImpact === 'Favorable' ? 'rgba(34,197,94,0.4)' : 'rgba(234,179,8,0.3)'
        ),
        borderColor: subset.filter((_, i) => i % 3 === 0).map(f =>
          f.weatherImpact === 'Adverse' ? '#ef4444' :
            f.weatherImpact === 'Favorable' ? '#22c55e' : '#eab308'
        ),
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,0.95)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed.y;
              return val > 0 ? 'Adverse (↑ pollution)' : val < 0 ? 'Favorable (↓ pollution)' : 'Neutral';
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45, maxTicksLimit: 8, font: { size: 10 } } },
        y: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          ticks: {
            callback: v => v > 0 ? 'Adverse' : v < 0 ? 'Favorable' : 'Neutral',
            font: { size: 10 },
          },
          min: -1.5,
          max: 1.5,
        },
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// SOURCES VIEW
// ═══════════════════════════════════════════════════════════════
function renderSources() {
  const cityKey = state.currentCity;
  const city = CITIES[cityKey];
  const sources = getSourceAttribution(cityKey);
  const aqi = getCityAQI(cityKey);

  viewContainer.innerHTML = `
    <div class="section-title stagger-1"><i data-lucide="scan-search" class="card-title-icon"></i> Pollution Source Attribution — ${city.name}</div>
    <div class="section-subtitle stagger-2">
      AI-powered decomposition of pollution sources with confidence scores. Attribution is based on seasonal emission inventories, traffic density, land use patterns, and meteorological conditions.
    </div>

    <div class="dashboard-grid">
      <div class="glass-card stagger-3">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="bar-chart-3" class="card-title-icon"></i> Source Contribution (%)</span>
        </div>
        <div class="chart-container tall">
          <canvas id="source-pie-chart"></canvas>
        </div>
      </div>
      <div class="glass-card stagger-4">
        <div class="glass-card-header">
          <span class="glass-card-title"><i data-lucide="list" class="card-title-icon"></i> Detailed Breakdown</span>
        </div>
        ${sources.map(s => `
          <div class="source-bar">
            <span class="source-icon"><i data-lucide="${s.icon}"></i></span>
            <div class="source-info">
              <div class="source-name">${s.label}</div>
              <div class="source-progress">
                <div class="source-progress-bar" style="width:${s.percentage}%; background: ${s.percentage > 25 ? 'linear-gradient(90deg, #ef4444, #f97316)' : s.percentage > 15 ? 'linear-gradient(90deg, #eab308, #f97316)' : 'var(--gradient-accent)'}"></div>
              </div>
            </div>
            <span class="source-percentage">${s.percentage}%</span>
            <span class="source-confidence">${s.confidence}% conf.</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Source pie chart
  const ctx = document.getElementById('source-pie-chart');
  if (ctx) {
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#22c55e', '#eab308', '#f97316', '#ef4444'];
    state.charts.sourcePie = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: sources.map(s => s.label),
        datasets: [{
          data: sources.map(s => s.percentage),
          backgroundColor: colors.map(c => c + '40'),
          borderColor: colors,
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            cornerRadius: 8,
          }
        },
        scales: {
          r: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { display: false },
          }
        }
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// HEALTH VIEW
// ═══════════════════════════════════════════════════════════════
function renderHealth() {
  const cityKey = state.currentCity;
  const city = CITIES[cityKey];
  const aqi = getCityAQI(cityKey);
  const health = getCityHealthSummary(cityKey, aqi);

  viewContainer.innerHTML = `
    <div class="section-title stagger-1"><i data-lucide="heart-pulse" class="card-title-icon"></i> Health Advisory — ${city.name}</div>
    <div class="section-subtitle stagger-2">
      AI-generated health risk assessments based on current AQI levels and population vulnerability mapping.
      Risk scores (0-100) account for location type, exposed population, and pollutant concentrations.
    </div>

    <div class="kpi-grid">
      <div class="kpi-card warm stagger-3">
        <div class="kpi-label">Overall Risk Score</div>
        <div class="kpi-value" style="color:${health.overallRisk.color}">${health.overallScore}/100</div>
        <div class="kpi-sub">${health.overallRisk.label}</div>
        <div class="kpi-icon"><i data-lucide="${health.overallRisk.icon}"></i></div>
      </div>
      <div class="kpi-card blue stagger-4">
        <div class="kpi-label">Critical Alerts</div>
        <div class="kpi-value">${health.criticalAlerts}</div>
        <div class="kpi-sub">Locations at high risk</div>
        <div class="kpi-icon"><i data-lucide="triangle-alert"></i></div>
      </div>
      <div class="kpi-card purple stagger-5">
        <div class="kpi-label">Vulnerable Population</div>
        <div class="kpi-value">${(health.totalVulnerablePopulation / 1000000).toFixed(1)}M</div>
        <div class="kpi-sub">~15% of ${city.name} population</div>
        <div class="kpi-icon"><i data-lucide="users"></i></div>
      </div>
    </div>

    <div class="stagger-6">
      ${health.advisories.map((a, i) => `
        <div class="advisory-card stagger-${Math.min(i + 3, 8)}">
          <div class="advisory-icon"><i data-lucide="${a.icon}"></i></div>
          <div class="advisory-content">
            <div class="advisory-title">${a.title}</div>
            <div class="advisory-population">${a.population}</div>
            <div class="advisory-message">${a.message}</div>
          </div>
          <div class="advisory-risk">
            <div class="risk-score" style="color:${a.riskLevel.color}">${a.riskScore}</div>
            <div class="risk-label" style="background:${a.riskLevel.color}20; color:${a.riskLevel.color}">${a.riskLevel.label}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// ENFORCEMENT VIEW
// ═══════════════════════════════════════════════════════════════
function renderEnforcement() {
  const cityKey = state.currentCity;
  const city = CITIES[cityKey];
  const aqi = getCityAQI(cityKey);
  const cat = getAQICategory(aqi);
  const actions = getEnforcementActions(cityKey, aqi);

  viewContainer.innerHTML = `
    <div class="section-title stagger-1"><i data-lucide="shield-check" class="card-title-icon"></i> Enforcement Intelligence — ${city.name}</div>
    <div class="section-subtitle stagger-2">
      AI-prioritized enforcement actions based on current AQI (${aqi} — ${cat.label}), pollution source attribution, and geospatial evidence.
      Actions are ranked by expected impact on AQI reduction and urgency.
    </div>

    <div class="kpi-grid">
      <div class="kpi-card warm stagger-3">
        <div class="kpi-label">Current AQI</div>
        <div class="kpi-value" style="color:${cat.color}">${aqi}</div>
        <div class="kpi-sub">${cat.label}</div>
        <div class="kpi-icon"><i data-lucide="thermometer"></i></div>
      </div>
      <div class="kpi-card blue stagger-4">
        <div class="kpi-label">Pending Actions</div>
        <div class="kpi-value">${actions.length}</div>
        <div class="kpi-sub">AI-generated recommendations</div>
        <div class="kpi-icon"><i data-lucide="list-todo"></i></div>
      </div>
      <div class="kpi-card purple stagger-5">
        <div class="kpi-label">Critical Actions</div>
        <div class="kpi-value" style="color:var(--accent-red)">${actions.filter(a => a.priority === 'Critical').length}</div>
        <div class="kpi-sub">Require immediate attention</div>
        <div class="kpi-icon"><i data-lucide="alert-octagon"></i></div>
      </div>
    </div>

    <div class="glass-card stagger-6" style="overflow-x:auto">
      <div class="glass-card-header">
        <span class="glass-card-title"><i data-lucide="list-todo" class="card-title-icon"></i> Prioritized Action Plan</span>
      </div>
      <table class="enforcement-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Source</th>
            <th>Action</th>
            <th>Priority</th>
            <th>Impact Timeline</th>
            <th>Target Area</th>
            <th>Urgency</th>
          </tr>
        </thead>
        <tbody>
          ${actions.map(a => `
            <tr>
              <td style="color:var(--text-muted)">${a.id}</td>
              <td><span style="margin-right:6px; display: inline-block; vertical-align: middle;"><i data-lucide="${a.sourceIcon}" style="width: 14px; height: 14px;"></i></span> ${a.source} <span style="color:var(--text-muted); font-size:0.75rem">(${a.sourcePercentage}%)</span></td>
              <td style="max-width:300px">${a.action}</td>
              <td><span class="priority-badge ${a.priority.toLowerCase()}">${a.priority}</span></td>
              <td style="color:var(--text-secondary)">${a.impact}</td>
              <td style="color:var(--text-secondary)">${a.area}</td>
              <td style="font-weight:600; color:${aqi > 300 ? 'var(--accent-red)' : aqi > 200 ? 'var(--accent-orange)' : 'var(--accent-yellow)'}">${a.urgency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// COMPARE VIEW
// ═══════════════════════════════════════════════════════════════
function renderCompare() {
  const comparison = getMultiCityComparison();
  const cityEntries = Object.entries(comparison);

  // Sort by AQI descending
  cityEntries.sort((a, b) => b[1].currentAQI - a[1].currentAQI);

  viewContainer.innerHTML = `
    <div class="section-title stagger-1"><i data-lucide="bar-chart-3" class="card-title-icon"></i> Multi-City AQI Comparison</div>
    <div class="section-subtitle stagger-2">
      Compare air quality across India's major metropolitan areas. Click a city card to switch the active city.
    </div>

    <div class="compare-grid">
      ${cityEntries.map(([key, data], i) => {
    const cat = getAQICategory(data.currentAQI);
    return `
          <div class="city-compare-card stagger-${Math.min(i + 3, 8)} ${key === state.currentCity ? 'selected' : ''}" data-city="${key}">
            <div class="city-compare-name">${data.name}</div>
            <div class="city-compare-state">${CITIES[key].state} · Pop. ${(CITIES[key].population / 1000000).toFixed(1)}M</div>
            <div class="city-compare-aqi" style="color:${cat.color}">${data.currentAQI}</div>
            <div class="city-compare-label" style="background:${cat.bgColor}; color:${cat.color}">${cat.label} <i data-lucide="${cat.icon}" style="width: 14px; height: 14px; vertical-align: middle; display: inline-block;"></i></div>
          </div>
        `;
  }).join('')}
    </div>

    <div class="glass-card stagger-7">
      <div class="glass-card-header">
        <span class="glass-card-title"><i data-lucide="calendar" class="card-title-icon"></i> 7-Day AQI Comparison</span>
      </div>
      <div class="chart-container tall">
        <canvas id="compare-chart"></canvas>
      </div>
    </div>

    <div class="glass-card stagger-8 mt-3">
      <div class="glass-card-header">
        <span class="glass-card-title"><i data-lucide="trophy" class="card-title-icon"></i> City Rankings</span>
      </div>
      <table class="enforcement-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>City</th>
            <th>Current AQI</th>
            <th>Category</th>
            <th>Stations</th>
            <th>Population</th>
          </tr>
        </thead>
        <tbody>
          ${cityEntries.map(([key, data], i) => {
    const cat = getAQICategory(data.currentAQI);
    return `
              <tr>
                <td style="font-weight:700; color:${i === 0 ? 'var(--accent-red)' : 'var(--text-muted)'}">#${i + 1}</td>
                <td style="font-weight:600">${data.name}</td>
                <td><span style="color:${cat.color}; font-family:'JetBrains Mono',monospace; font-weight:700">${data.currentAQI}</span></td>
                <td><span class="priority-badge ${data.currentAQI > 300 ? 'critical' : data.currentAQI > 200 ? 'high' : data.currentAQI > 100 ? 'medium' : 'low'}">${cat.label}</span></td>
                <td>${CITIES[key].stations.length}</td>
                <td>${(CITIES[key].population / 1000000).toFixed(1)}M</td>
              </tr>
            `;
  }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // City card click handler
  document.querySelectorAll('.city-compare-card').forEach(card => {
    card.addEventListener('click', () => {
      state.currentCity = card.dataset.city;
      citySelect.value = state.currentCity;
      updateTopBar();
      renderCompare();
    });
  });

  // Comparison chart
  const ctx = document.getElementById('compare-chart');
  if (ctx) {
    const colors = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e'];

    state.charts.compare = new Chart(ctx, {
      type: 'line',
      data: {
        labels: cityEntries[0][1].data.map(d => d.label),
        datasets: cityEntries.map(([key, data], i) => ({
          label: data.name,
          data: data.data.map(d => d.aqi),
          borderColor: colors[i % colors.length],
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: colors[i % colors.length],
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { font: { size: 12 }, padding: 16 } },
          tooltip: {
            backgroundColor: 'rgba(17,24,39,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { font: { size: 11 } } },
        }
      }
    });
  }
}

// ─── Boot ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
