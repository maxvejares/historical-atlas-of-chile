// Map view: Leaflet choropleth with corrected coverage, oxblood ramp,
// typeset legend, fixed top-right info card, tightened bbox.
//
// Coverage fix (P1 in AUDIT.md): observed = number of geometry features
// that successfully matched a data value, NOT the size of the data dict.

import * as M from './manifest.js';
import { attachCiteButton } from './citation.js';

const SEQ = ['#F5EFE6', '#ECDDD1', '#D9B3AE', '#C2867F', '#A8504F', '#8E2C36', '#6E1822'];
const NO_DATA_FILL = '#F2EEE5';
const NO_DATA_STROKE = '#C9C0AC';
const HOVER_STROKE = '#0E1A2B';

const MAINLAND_BOUNDS = [[-56.0, -75.7], [-17.5, -66.4]]; // [[s, w], [n, e]] — mainland Chile + 50km
const CENSUS_GEO_YEARS_DEPT = [1865, 1875, 1885, 1895, 1907, 1920];
const CENSUS_GEO_YEARS_PROV = [1865, 1875, 1885, 1895, 1907, 1920, 1924];

function nearestGeoYear(year, available) {
  let best = available[0], bestD = Math.abs(best - year);
  for (const y of available) {
    const d = Math.abs(y - year);
    if (d < bestD) { best = y; bestD = d; }
  }
  return best;
}

function normalizeKey(s) {
  if (!s) return '';
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function quantileBreaks(values, n) {
  const sorted = [...values].sort((a, b) => a - b);
  const out = [];
  for (let i = 1; i < n; i++) {
    out.push(sorted[Math.min(Math.floor((i / n) * sorted.length), sorted.length - 1)]);
  }
  return out;
}

function colorFor(v, breaks) {
  if (v == null || Number.isNaN(v)) return NO_DATA_FILL;
  for (let i = 0; i < breaks.length; i++) if (v <= breaks[i]) return SEQ[i];
  return SEQ[SEQ.length - 1];
}

function fmt(v, fmtHint) {
  if (v == null || Number.isNaN(v)) return '—';
  if (fmtHint === 'rate' || fmtHint === 'share') {
    return (Math.abs(v) <= 1 ? (v * 100).toFixed(1) : v.toFixed(1)) + '%';
  }
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return Math.round(v).toLocaleString();
}

export function createMapView(host) {
  host.classList.add('map-block');
  host.innerHTML = `
    <div class="map-frame">
      <div id="leaflet-map"></div>
      <div class="boundary-notice" style="display:none"></div>
    </div>
    <div class="map-side">
      <div class="map-legend" style="display:none">
        <div class="ml-overline"></div>
        <div class="ml-title"></div>
        <div class="ml-units"></div>
        <div class="ml-ramp"></div>
        <div class="ml-axis"><span class="ml-min num"></span><span class="ml-max num"></span></div>
        <div class="ml-cov"></div>
      </div>
      <div class="map-info-card is-empty">
        <div class="mic-name">Hover a unit</div>
        <div class="mic-meta">Click to pin</div>
        <div class="mic-value">—</div>
      </div>
    </div>
    <div class="map-source-block"></div>
    <div class="chart-actions"></div>
  `;
  const mapEl = host.querySelector('#leaflet-map');
  const infoEl = host.querySelector('.map-info-card');
  const legend = host.querySelector('.map-legend');
  const srcBlock = host.querySelector('.map-source-block');
  const noticeEl = host.querySelector('.boundary-notice');
  const actionsEl = host.querySelector('.chart-actions');

  let lastState = { scale: null, variable: null, year: null, perCapita: false };
  attachCiteButton(actionsEl, () => lastState);
  const csvBtn = document.createElement('button');
  csvBtn.className = 'csv-btn';
  csvBtn.textContent = 'Download CSV';
  csvBtn.addEventListener('click', () => downloadCSV());
  actionsEl.appendChild(csvBtn);

  function downloadCSV() {
    if (!lastState.variable || !lastState.year) return;
    const meta = M.byId(lastState.variable);
    if (!meta) return;
    const block = lastState.scale === 'department' ? window._data.department_data : window._data.province_data;
    const yd = block.data[String(lastState.year)] || {};
    const rows = [['unit', 'year', meta.id]];
    for (const [u, vars] of Object.entries(yd)) {
      if (vars[meta.id] != null) rows.push([u, lastState.year, vars[meta.id]]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${meta.id}_${lastState.scale}_${lastState.year}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // Lazy init: a Leaflet map created in a display:none container renders at
  // 0x0 and never recovers. We defer construction until the first render.
  let map = null;
  let layer = null;
  let pinned = null;
  const geoCache = new Map();

  function ensureMap() {
    if (map) return map;
    map = L.map(mapEl, {
      zoomControl: true,
      attributionControl: true,
      minZoom: 3, maxZoom: 9,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);
    map.fitBounds(MAINLAND_BOUNDS, { animate: false });
    return map;
  }

  async function loadGeoJSON(scale, year) {
    const yrs = scale === 'department' ? CENSUS_GEO_YEARS_DEPT : CENSUS_GEO_YEARS_PROV;
    const geoYear = nearestGeoYear(year, yrs);
    const key = `${scale}_${geoYear}`;
    if (geoCache.has(key)) return geoCache.get(key);
    const path = `data/${scale === 'department' ? 'departments' : 'provinces'}_${geoYear}.geojson`;
    const r = await fetch(path);
    if (!r.ok) throw new Error(`GeoJSON fetch failed: ${path} -> ${r.status}`);
    const j = await r.json();
    geoCache.set(key, j);
    return j;
  }

  function buildValueMap(scale, year, variable, perCapita) {
    const block = scale === 'department' ? window._data.department_data : window._data.province_data;
    const yearData = block.data[String(year)];
    if (!yearData) return {};
    const out = {};
    for (const [unit, vars] of Object.entries(yearData)) {
      if (vars[variable] == null || Number.isNaN(vars[variable])) continue;
      let v = +vars[variable];
      if (perCapita && vars.totalpop > 0) v = (v / vars.totalpop) * 1e5;
      out[normalizeKey(unit)] = v;
    }
    return out;
  }

  function setInfoEmpty() {
    infoEl.classList.add('is-empty');
    infoEl.innerHTML = `<div class="mic-name">Hover a unit</div>
      <div class="mic-meta">Click to pin</div>
      <div class="mic-value">—</div>`;
  }

  function setInfo(name, year, value, meta, perCapita) {
    infoEl.classList.remove('is-empty');
    const valStr = perCapita ? fmt(value, 'rate') : fmt(value, meta.format_hint);
    infoEl.innerHTML = `<div class="mic-name serif">${name}</div>
      <div class="mic-meta">${year} · ${(meta.display_label || meta.label)}</div>
      <div class="mic-value num">${valStr}</div>
      <div class="mic-value-sub">${perCapita ? 'per 100,000 population' : (meta.format_hint === 'count' ? 'count' : meta.format_hint)}</div>`;
  }

  async function render({ scale, variable, year, perCapita = false }) {
    if (!variable || (scale !== 'department' && scale !== 'province') || year == null) {
      host.style.display = 'none';
      return;
    }
    host.style.display = '';
    const meta = M.byId(variable);
    if (!meta) return;

    // Construct/refresh map. invalidateSize handles host transitions
    // (display:none -> visible; resize) which would otherwise leave the
    // tile layer stuck at 0x0.
    ensureMap();
    requestAnimationFrame(() => map && map.invalidateSize());

    let geoJSON;
    try {
      geoJSON = await loadGeoJSON(scale, year);
    } catch (err) {
      console.error(err);
      srcEl.textContent = `Could not load geometry for ${scale} ${year}: ${err.message}`;
      return;
    }
    const values = buildValueMap(scale, year, variable, perCapita);

    // Compute matched intersection for coverage (P1 fix)
    const nameField = scale === 'department' ? 'department' : 'provincia';
    let matched = 0;
    const matchedValues = [];
    for (const f of geoJSON.features) {
      const nk = normalizeKey(f.properties[nameField] || f.properties.name);
      const v = values[nk];
      if (v != null && !Number.isNaN(v)) { matched++; matchedValues.push(v); }
    }
    const total = geoJSON.features.length;
    const pct = total > 0 ? Math.round((matched / total) * 100) : 0;

    // Quantile breaks on matched values only
    const positives = matchedValues.filter(v => v > 0);
    const breaks = positives.length >= 6 ? quantileBreaks(positives, 7) : [];
    const min = matchedValues.length ? Math.min(...matchedValues) : 0;
    const max = matchedValues.length ? Math.max(...matchedValues) : 1;

    if (layer) { map.removeLayer(layer); layer = null; }
    pinned = null;
    layer = L.geoJSON(geoJSON, {
      style: f => {
        const nk = normalizeKey(f.properties[nameField] || f.properties.name);
        const v = values[nk];
        if (v == null) return { fillColor: NO_DATA_FILL, fillOpacity: 0.7, color: NO_DATA_STROKE, weight: 0.6, dashArray: '2 3' };
        const c = breaks.length ? colorFor(v, breaks) : SEQ[Math.min(SEQ.length - 1, Math.floor(((v - min) / Math.max(1, max - min)) * SEQ.length))];
        return { fillColor: c, fillOpacity: 0.86, color: '#FAFAF7', weight: 0.5 };
      },
      onEachFeature: (f, ly) => {
        const nk = normalizeKey(f.properties[nameField] || f.properties.name);
        const v = values[nk];
        const displayName = f.properties[nameField] || f.properties.name;
        ly.on('mouseover', () => {
          if (pinned) return;
          ly.setStyle({ weight: 1.5, color: HOVER_STROKE });
          ly.bringToFront();
          if (v != null) setInfo(displayName, year, v, meta, perCapita); else setInfoEmpty();
        });
        ly.on('mouseout', () => {
          if (pinned) return;
          layer.resetStyle(ly);
          setInfoEmpty();
        });
        ly.on('click', () => {
          if (pinned === ly) { pinned = null; layer.resetStyle(ly); setInfoEmpty(); return; }
          if (pinned) layer.resetStyle(pinned);
          pinned = ly;
          ly.setStyle({ weight: 2, color: HOVER_STROKE });
          if (v != null) setInfo(displayName, year, v, meta, perCapita); else setInfoEmpty();
        });
      },
    }).addTo(map);

    // Tighten bbox to mainland Chile (don't fitBounds to GeoJSON which may extend offshore)
    map.fitBounds(MAINLAND_BOUNDS, { animate: false });

    // Legend
    legend.style.display = 'block';
    legend.querySelector('.ml-overline').textContent = scale.charAt(0).toUpperCase() + scale.slice(1) + 's, ' + year;
    legend.querySelector('.ml-title').textContent = (meta.display_label || meta.label) + (perCapita ? ' (per 100,000)' : '');
    legend.querySelector('.ml-units').textContent = perCapita ? 'rate per 100,000 population' : (meta.format_hint || 'count');
    legend.querySelector('.ml-ramp').innerHTML = SEQ.map(c => `<span style="background:${c}"></span>`).join('');
    legend.querySelector('.ml-min').textContent = fmt(min, perCapita ? 'rate' : meta.format_hint);
    legend.querySelector('.ml-max').textContent = fmt(max, perCapita ? 'rate' : meta.format_hint);
    const cov = legend.querySelector('.ml-cov');
    cov.textContent = `${matched} of ${total} ${scale}s · ${pct}% coverage · ${year}`;
    cov.classList.toggle('warn', pct < 60);

    // Single-line source block.
    const docName = meta.source_document || (meta.source_documents || [])[0] || M.sourceTypeName(meta.source_type);
    srcBlock.innerHTML = `
      <span class="src-original serif-i">${docName}</span>
      <span class="src-sep">·</span>
      <span class="src-coverage num">${matched} of ${total} ${scale}s (${pct}%), ${year}</span>
      <span class="src-sep">·</span>
      <span class="src-compiler">Compiled by Maximiliano Véjares</span>
      <span class="src-sep">·</span>
      <span class="src-compiler">Borders: La Política en el Espacio</span>
    `;

    // Track for cite/CSV
    lastState = { scale, variable, year, perCapita };

    // Boundary-change notice: if the geometry's year differs from the slider year
    const yrs = scale === 'department' ? CENSUS_GEO_YEARS_DEPT : CENSUS_GEO_YEARS_PROV;
    const geoYear = nearestGeoYear(year, yrs);
    if (geoYear !== year) {
      noticeEl.style.display = 'block';
      noticeEl.textContent = `Showing ${geoYear} boundaries (closest available to ${year}).`;
    } else {
      noticeEl.style.display = 'none';
    }
  }

  return { render };
}
