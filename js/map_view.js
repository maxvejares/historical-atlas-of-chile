// Map view: Leaflet choropleth with corrected coverage, oxblood ramp,
// typeset legend, fixed top-right info card, tightened bbox.
//
// Coverage fix (P1 in AUDIT.md): observed = number of geometry features
// that successfully matched a data value, NOT the size of the data dict.

import * as M from './manifest.js';
import { attachCiteButton } from './citation.js';

// National-aggregate sidecar (Addendum 3): a map from subnational indicator id
// to {verdict, series:{year:value}}. Bundle-aware (inline global over file://,
// fetch in dev). Cached after first load; a missing file degrades gracefully
// (no sparkline rather than an error).
let _nationalAggregates = null;
async function loadNationalAggregates() {
  if (_nationalAggregates) return _nationalAggregates;
  if (typeof window !== 'undefined' && window.__INLINE_national_aggregates !== undefined) {
    _nationalAggregates = window.__INLINE_national_aggregates || {};
    return _nationalAggregates;
  }
  try {
    _nationalAggregates = await fetch('data/national_aggregates.json').then(r => r.ok ? r.json() : {});
  } catch (_) {
    _nationalAggregates = {};
  }
  return _nationalAggregates;
}

const SEQ = ['#F5EFE6', '#ECDDD1', '#D9B3AE', '#C2867F', '#A8504F', '#8E2C36', '#6E1822'];
const NO_DATA_FILL = '#F2EEE5';
const NO_DATA_STROKE = '#C9C0AC';
const HOVER_STROKE = '#0E1A2B';

// Territory zone styling (unorganized/frontier/disputed areas)
const TERRITORY_STYLES = {
  frontier:    { fillColor: '#E8D8A0', fillOpacity: 0.25, color: '#B89B5E', weight: 0.8, dashArray: '4 3' },
  unorganized: { fillColor: '#DDD8C8', fillOpacity: 0.20, color: '#A89870', weight: 0.6, dashArray: '3 4' },
  disputed:    { fillColor: '#D8C0C0', fillOpacity: 0.20, color: '#A07070', weight: 0.6, dashArray: '3 4' },
};
function isTerritory(f) {
  const tt = f.properties && f.properties.territory_type;
  return tt && tt !== 'organized';
}

// Mainland-only bounds. Chile is a long thin strip, so the bbox is dominated
// vertically; the [s,w]→[n,e] corners must clamp tightly enough that Leaflet
// doesn't auto-zoom out to show neighbors. Spec: [[-56,-76],[-17.5,-66.5]].
const MAINLAND_BOUNDS = [[-56.0, -76.0], [-17.5, -66.5]];
const MAINLAND_PADDING = [20, 20];
const CENSUS_GEO_YEARS_DEPT = [1833, 1843, 1854, 1865, 1875, 1885, 1895, 1907, 1920];
const CENSUS_GEO_YEARS_PROV = [1826, 1833, 1843, 1854, 1865, 1875, 1885, 1895, 1907, 1920, 1924];

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

// ── Data-key-to-canonical-code crosswalks ──────────────────────────
// window_data.js keys geographic_unit strings verbatim (lowercased).
// These include numeric DLW codes, parenthetical province suffixes,
// multi-word display names, and spelling variants.  GeoJSON features
// carry canonical `dcode` / `pcode` string properties.  The crosswalks
// below map every known data key to the canonical code so the choropleth
// can join data → geometry reliably.
//
// Any data key NOT in the crosswalk is assumed to already be canonical
// (identity fallback).  Keys that map to null are explicitly excluded
// from the panel (post-WoP territories, modern regions, aggregates).

const DEPT_KEY_TO_DCODE = {
  // ── Numeric DLW codes (1.0–52.0) ──
  '1.0': 'copiapo', '2.0': 'vallenar', '3.0': 'freirina', '4.0': 'chanaral',
  '5.0': 'serena', '6.0': 'elqui', '7.0': 'coquimbo', '8.0': 'ovalle',
  '9.0': 'combarbala', '10.0': 'illapel', '11.0': 'sanfelipe', '12.0': 'putaendo',
  '13.0': 'losandes', '14.0': 'laligua', '15.0': 'petorca', '16.0': 'valparaiso',
  '17.0': 'quillota', '18.0': 'casablanca', '19.0': 'limache', '20.0': 'santiago',
  '21.0': 'victoria', '22.0': 'melipilla', '23.0': 'rancagua', '24.0': 'caupolican',
  '25.0': 'sanfernando', '26.0': 'curico', '27.0': 'talca', '28.0': 'lontue',
  '29.0': 'constitucion', '30.0': 'linares', '31.0': 'parral', '32.0': 'cauquenes',
  '33.0': 'itata', '34.0': 'chillan', '35.0': 'sancarlos', '36.0': 'concepcion',
  '37.0': 'talcahuano', '38.0': 'lautaro', '39.0': 'rere', '40.0': 'puchacay',
  '41.0': 'coelemu', '42.0': 'arauco', '43.0': 'nacimiento', '44.0': 'laja',
  '45.0': 'angol', '46.0': 'union', '47.0': 'valdivia', '48.0': 'osorno',
  '49.0': 'llanquihue', '50.0': 'carelmapu', '51.0': 'ancud', '52.0': 'castro',
  // ── Parenthetical province suffixes ──
  'ancud (chiloe)': 'ancud', 'andes (aconcagua)': 'losandes',
  'carelmapu (llanquihue)': 'carelmapu', 'castro (chiloe)': 'castro',
  'coelemu (concepcion)': 'coelemu', 'combarbala (coquimbo)': 'combarbala',
  'concepcion (concepcion)': 'concepcion', 'copiapo (atacama)': 'copiapo',
  'coquimbo (coquimbo)': 'coquimbo', 'elqui (coquimbo)': 'elqui',
  'freirina (atacama)': 'freirina', 'illapel (coquimbo)': 'illapel',
  'lautaro (concepcion)': 'lautaro', 'llanquihue (llanquihue)': 'llanquihue',
  'osorno (llanquihue)': 'osorno', 'ovalle (coquimbo)': 'ovalle',
  'petorca (aconcagua)': 'petorca', 'puchacay (concepcion)': 'puchacay',
  'putaendo (aconcagua)': 'putaendo', 'rere (concepcion)': 'rere',
  'san_felipe (aconcagua)': 'sanfelipe', 'serena (coquimbo)': 'serena',
  'talcahuano (concepcion)': 'talcahuano', 'vallenar (atacama)': 'vallenar',
  'caldera (atacama)': 'chanaral', 'ligua (aconcagua)': 'laligua',
  'quinchao (chiloe)': 'quinchao',
  // ── Multi-word display names ──
  'la serena': 'serena', 'la ligua': 'laligua', 'san carlos': 'sancarlos',
  'san felipe': 'sanfelipe', 'los andes': 'losandes',
  // ── Concatenated/alternate forms ──
  'laserena': 'serena', 'lalaja': 'laja', 'launion': 'union',
  'lavictoria': 'victoria',
  // ── Spelling variants ──
  'puchacai': 'puchacay', 'talcaguano': 'talcahuano',
  'casa-blanca': 'casablanca', 'yungay': 'itata', 'yungai': 'itata',
  'andes': 'losandes', 'ligua': 'laligua',
  // ── Non-panel departments (map to GeoJSON dcode, not null) ──
  'antofagasta': 'antofagasta', 'antofagasta (depto)': 'antofagasta',
  'antofagasta (departamento)': 'antofagasta',
  'arica': 'arica', '[arica': 'arica',
  'magallanes': 'magallanes', 'magallanes (depto)': 'magallanes',
  'magallanes (departamento)': 'magallanes',
  'tacna': 'tacna', 'tacna (departamento)': 'tacna',
  'tarapaca': 'tarapaca', 'tarapacá': 'tarapaca',
  'tarapacá (departamento)': 'tarapaca', 'tarapaca (departamento)': 'tarapaca',
  'pisagua': 'pisagua',
  'iquique': 'pisagua',  // Iquique dept created 1927 (renamed from Tarapacá); pre-1927 data → pisagua feature
  'taltal': 'taltal', 'tocopilla': 'tocopilla',
  'bulnes': 'bulnes', 'búlnes': 'bulnes',
  'cachapoal': 'cachapoal', 'canete': 'canete', 'cañete': 'canete',
  'caldera': 'chanaral', 'chanco': 'chanco',
  'collipulli': 'collipulli', 'curacautin': 'curacautín',
  'curepto': 'curepto', 'imperial': 'laimperial', 'laimperial': 'laimperial',
  'la imperial': 'laimperial',
  'llaima': 'llaima', 'lebu': 'lebu',
  'loncomilla': 'loncomilla', 'maipo': 'maipo',
  'mariluan': 'mariluán', 'mariluán': 'mariluán',
  'mulchen': 'mulchen', 'mulchén': 'mulchen',
  'riobueno': 'ríobueno', 'río bueno': 'ríobueno', 'rio bueno': 'ríobueno',
  'sanantonio': 'sanantonio', 'san antonio': 'sanantonio',
  'santacruz': 'santacruz', 'santa cruz': 'santacruz',
  'santarosa': 'santarosa',
  'temuco': 'temuco', 'traiguen': 'traiguen', 'traiguén': 'traiguen',
  'tome': 'coelemu', 'tomé': 'coelemu',  // Tomé dept created 1927 (renamed from Coelemu); pre-1927 data → coelemu feature
  'villarica': 'villarrica', 'villarrica': 'villarrica',
  'vichuquen': 'vichuquén', 'vichuquén': 'vichuquén',
  'quinchao': 'quinchao', 'quinchao (chiloe)': 'quinchao',
  'aysen': 'aysen', 'aysén': 'aysen', 'aisén': 'aysen', 'aisen': 'aysen',
  'loa': 'antofagasta', 'el loa': 'antofagasta',  // El Loa created 1924 (from Antofagasta); pre-1924 data → antofagasta feature
  'tarata': 'tacna',  // Tarata subdelegation in Tacna province
  'pitrufquén': 'laimperial', 'pitrufquen': 'laimperial',  // Created 1927; pre-1927 → La Imperial
  'isla de pascua': 'magallanes',  // No own polygon; fallback to Magallanes
  // ── DLW disambiguation names ──
  'lautaro_biobio': 'laja',  // DLW name for La Laja (Biobío prov)
  'lautaro (concepción)': 'lautaro',
  'victoria (santiago)': 'victoria',
  // ── (departamento) suffix variants ──
  'arauco (departamento)': 'arauco', 'concepción (departamento)': 'concepcion',
  'coquimbo (departamento)': 'coquimbo', 'curicó (departamento)': 'curico',
  'linares (departamento)': 'linares', 'llanquihue (departamento)': 'llanquihue',
  'santiago (departamento)': 'santiago', 'talca (departamento)': 'talca',
  'tarapacá (departamento)': 'tarapaca', 'valdivia (departamento)': 'valdivia',
  'valparaíso (departamento)': 'valparaiso',
  'losanjeles': 'laja', 'los angeles': 'laja', 'los ángeles': 'laja',
  'adica': 'arica',  // OCR garble
};

const PROV_KEY_TO_PCODE = {
  // ── Accent / spelling variants ──
  'aisén': 'aysen', 'aisen': 'aysen', 'aysen': 'aysen',
  'aysén': 'aysen',
  'biobío': 'biobio', 'bío-bío': 'biobio', 'bio-bio': 'biobio',
  'cautín': 'cautin', 'chiloé': 'chiloe', 'concepción': 'concepcion',
  'curicó': 'curico', 'tarapacá': 'tarapaca', 'valparaíso': 'valparaiso',
  'ñuble': 'nuble',
  // ── Display-form names ──
  "o'higgins": 'ohiggins', "general libertador b. o' higgins": 'ohiggins',
  'generallibertadorbohiggins': 'ohiggins',
  'región metropolitana': 'santiago', 'regionmetropolitana': 'santiago',
  'de la araucanía': null, 'delaaraucania': null,
  'de los lagos': null, 'deloslagos': null,
  't. de magallanes': 'magallanes', 'tdemagallanes': 'magallanes',
  // ── Aggregates (skip) ──
  'total republica': null, 'totalrepublica': null,
  'tocopilla': null,
};

/** Resolve a data key to canonical dcode. Returns null for excluded keys. */
function resolveDcode(key) {
  if (key in DEPT_KEY_TO_DCODE) return DEPT_KEY_TO_DCODE[key];
  return key; // identity fallback — key is already a panel dcode
}

/** Resolve a data key to canonical pcode. Returns null for excluded keys. */
function resolvePcode(key) {
  if (key in PROV_KEY_TO_PCODE) return PROV_KEY_TO_PCODE[key];
  return key;
}

/** Extract the canonical code from a GeoJSON feature. */
function featureCode(f, scale) {
  if (scale === 'department') {
    // Prefer dcode property (string panel key); fall back to normalizeKey
    if (f.properties.dcode && typeof f.properties.dcode === 'string') return f.properties.dcode;
    return normalizeKey(f.properties.department || f.properties.name || '');
  }
  // Province: pcode may be string (1854+) or numeric (legacy 1865–1920)
  if (f.properties.pcode && typeof f.properties.pcode === 'string') return f.properties.pcode;
  // Numeric pcode → fall back to normalizeKey on display name
  return normalizeKey(f.properties.provincia || f.properties.name || '');
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

function fmt(v, fmtHint, displayUnit) {
  if (v == null || Number.isNaN(v)) return '—';
  if (displayUnit === '%') {
    return (Math.abs(v) <= 1 ? (v * 100).toFixed(1) : v.toFixed(1)) + '%';
  }
  if (fmtHint === 'share' && Math.abs(v) <= 1) {
    return (v * 100).toFixed(1) + '%';
  }
  if (Math.abs(v) >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  if (Math.abs(v) >= 1)   return Math.round(v).toLocaleString();
  return v.toFixed(2);
}

export function createMapView(host) {
  host.classList.add('map-block');
  host.innerHTML = `
    <div class="map-frame">
      <div class="map-sparkline" style="display:none"></div>
      <div id="leaflet-map"></div>
      <div class="boundary-notice" style="display:none"></div>
      <div class="map-coverage-banner" style="display:none"></div>
      <div class="pc-notice" style="display:none"></div>
      <div class="map-coverage-caption" style="display:none"></div>
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
    <div class="chart-alt-note variable-flag is-warning" style="display:none"></div>
    <div class="map-research-note variable-flag is-soft" style="display:none"></div>
    <div class="map-source-block"></div>
    <div class="chart-related" style="display:none"></div>
    <div class="chart-actions"></div>
  `;
  const mapEl = host.querySelector('#leaflet-map');
  const sparkEl = host.querySelector('.map-sparkline');
  const relatedEl = host.querySelector('.chart-related');
  const altNoteEl = host.querySelector('.chart-alt-note');

  // National-aggregate sparkline above the choropleth (Addendum 3, layout i).
  // Anchors the mapped year inside the national trend: an ~80px full-width
  // sparkline with a vertical marker at `state.year`. Respects the per-capita
  // toggle (divide by national population for the year, snapping if irregular),
  // draws meta.breaks as faint dashes, and on click opens the full national
  // chart for the indicator via the existing atlas:nav cross-scale cascade.
  function nationalPop(year) {
    const pop = (window._data.national_timeseries || {}).total_population;
    if (!pop || !pop.years) return null;
    let best = null, bestD = Infinity;
    for (let i = 0; i < pop.years.length; i++) {
      const d = Math.abs(pop.years[i] - year);
      if (d < bestD) { bestD = d; best = pop.values[i]; }
    }
    return (best > 0) ? best : null;
  }

  function renderSparkline(meta, scale, year, perCapita) {
    const agg = (_nationalAggregates || {})[meta.id];
    if (!agg) { sparkEl.style.display = 'none'; sparkEl.innerHTML = ''; return; }
    sparkEl.style.display = 'block';
    if (agg.verdict === 'not_defined' || !agg.series || !Object.keys(agg.series).length) {
      sparkEl.innerHTML = `<div class="spark-caption">National aggregate not defined for this indicator</div>`;
      return;
    }
    // Build (year, value) pairs, applying the per-capita transform if on.
    let pairs = Object.entries(agg.series)
      .map(([y, v]) => [+y, +v])
      .filter(([y, v]) => Number.isFinite(y) && Number.isFinite(v))
      .sort((a, b) => a[0] - b[0]);
    let unitLine = perCapita ? 'national total · per 100,000' : 'national total';
    if (perCapita) {
      pairs = pairs.map(([y, v]) => { const p = nationalPop(y); return p ? [y, (v / p) * 1e5] : null; })
                   .filter(Boolean);
    }
    if (!pairs.length) { sparkEl.innerHTML = `<div class="spark-caption">National aggregate unavailable</div>`; return; }

    const W = 1000, H = 80, mL = 6, mR = 44, mT = 10, mB = 14;
    const plotW = W - mL - mR, plotH = H - mT - mB;
    const xs = pairs.map(p => p[0]), ys = pairs.map(p => p[1]);
    let xMin = Math.min(...xs), xMax = Math.max(...xs);
    if (xMin === xMax) { xMin -= 1; xMax += 1; }
    let yMin = Math.min(...ys), yMax = Math.max(...ys);
    if (yMin === yMax) { yMin -= 1; yMax += 1; }
    const xS = x => mL + ((x - xMin) / (xMax - xMin)) * plotW;
    const yS = v => mT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    const d = pairs.map(([x, v], i) => (i ? 'L' : 'M') + xS(x).toFixed(1) + ',' + yS(v).toFixed(1)).join(' ');
    let svg = `<svg class="spark-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="National trend; click to open the national chart">`;
    // Break dashes
    for (const b of (Array.isArray(meta.breaks) ? meta.breaks : [])) {
      if (b.year == null || b.year < xMin || b.year > xMax) continue;
      const bx = xS(b.year);
      svg += `<line x1="${bx.toFixed(1)}" y1="${mT}" x2="${bx.toFixed(1)}" y2="${mT + plotH}" stroke="#94918A" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>`;
    }
    svg += `<path d="${d}" fill="none" stroke="#7A1E2B" stroke-width="1.5"/>`;
    // Year marker
    if (year != null && year >= xMin && year <= xMax) {
      const mx = xS(year);
      svg += `<line x1="${mx.toFixed(1)}" y1="${mT}" x2="${mx.toFixed(1)}" y2="${mT + plotH}" stroke="#0E1A2B" stroke-width="1"/>`;
      // dot at the nearest observed point
      let near = pairs[0], nd = Infinity;
      for (const p of pairs) { const dd = Math.abs(p[0] - year); if (dd < nd) { nd = dd; near = p; } }
      svg += `<circle cx="${xS(near[0]).toFixed(1)}" cy="${yS(near[1]).toFixed(1)}" r="2.5" fill="#0E1A2B"/>`;
    }
    // End-value label
    const lastV = pairs[pairs.length - 1][1];
    svg += `<text x="${W - mR + 4}" y="${(yS(lastV) + 3).toFixed(1)}" font-size="11" fill="#6E6A60">${fmt(lastV, perCapita ? 'rate' : meta.format_hint, perCapita ? '' : meta.display_unit)}</text>`;
    svg += `</svg>`;
    sparkEl.innerHTML = `<div class="spark-label">${escapeHTML(unitLine)} · ${escapeHTML(meta.display_label || meta.label)} — click for the national chart</div>${svg}`;
  }

  // Click the sparkline -> open the full national chart for this indicator
  // (national sibling when one exists; otherwise the same id via the cascade).
  sparkEl.addEventListener('click', () => {
    if (!lastState.variable) return;
    const agg = (_nationalAggregates || {})[lastState.variable];
    if (!agg || agg.verdict === 'not_defined') return;
    const target = agg.sibling_id || lastState.variable;
    window.dispatchEvent(new CustomEvent('atlas:nav', { detail: { scale: 'national', variable: target } }));
  });

  // "Related series" footer (same pattern as chart.js). Alternate-source and
  // alternate-currency variants available at the current scale become links;
  // retired (merged_into) ids are not linked (they redirect to the canonical).
  // When the displayed entry is itself an alternate, a note links back to the
  // canonical.
  function renderRelatedSeries(meta, scale) {
    const canonId = meta.variant_of || meta.currency_view_of || meta.merged_into;
    const canon = canonId ? M.byId(canonId) : null;
    if (canon) {
      const kind = meta.variant_of ? 'an alternate-source variant'
                 : meta.currency_view_of ? 'an alternate-currency view'
                 : 'a retired duplicate';
      altNoteEl.innerHTML = `This is ${kind} of `
        + `<a href="#" data-rel-id="${escapeHTML(canon.id)}" data-rel-scale="${escapeHTML(scale)}">`
        + `${escapeHTML(canon.display_label || canon.label)}</a>. `
        + `The canonical series may have different coverage.`;
      altNoteEl.style.display = '';
    } else {
      altNoteEl.style.display = 'none';
      altNoteEl.innerHTML = '';
    }
    const rel = M.relatedTo(meta.id);
    const links = [];
    if (rel) {
      const seen = new Set();
      for (const id of [...rel.alternate_source, ...rel.alternate_currency]) {
        if (seen.has(id)) continue;
        seen.add(id);
        const alt = M.byId(id);
        if (!alt) continue;
        if (alt.scale_availability && !alt.scale_availability[scale]) continue;
        const name = alt.display_label || alt.label;
        const sub = (alt.curated_subtitle || '').trim();
        links.push(`<a href="#" data-rel-id="${escapeHTML(id)}" data-rel-scale="${escapeHTML(scale)}"`
          + `${sub ? ` title="${escapeHTML(sub)}"` : ''}>${escapeHTML(name)}</a>`);
      }
    }
    if (links.length) {
      relatedEl.innerHTML = `<span class="label">Related series:</span> ` + links.join(' · ');
      relatedEl.style.display = 'block';
    } else {
      relatedEl.style.display = 'none';
      relatedEl.innerHTML = '';
    }
  }

  host.addEventListener('click', (e) => {
    const a = e.target.closest('[data-rel-id]');
    if (!a) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('atlas:nav',
      { detail: { scale: a.dataset.relScale || null, variable: a.dataset.relId } }));
  });
  const infoEl = host.querySelector('.map-info-card');
  const researchNoteEl = host.querySelector('.map-research-note');
  const legend = host.querySelector('.map-legend');
  const srcBlock = host.querySelector('.map-source-block');
  const noticeEl = host.querySelector('.boundary-notice');
  const covCaptionEl = host.querySelector('.map-coverage-caption');
  const covBannerEl = host.querySelector('.map-coverage-banner');
  const pcNoticeEl = host.querySelector('.pc-notice');
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
    const valueHead = meta.display_label || meta.label || meta.id;
    const measUnit = meta.display_unit || '';
    const rows = [['geographic_unit', 'year', valueHead, 'unit']];
    for (const [u, vars] of Object.entries(yd)) {
      if (vars[meta.id] != null) rows.push([u, lastState.year, vars[meta.id], measUnit]);
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
      minZoom: 4, maxZoom: 9,
      maxBounds: [[-58, -82], [-15, -60]],   // hard pan clamp around Chile
      maxBoundsViscosity: 1.0,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO &middot; Boundaries: La Política en el Espacio',
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);
    map.fitBounds(MAINLAND_BOUNDS, { animate: false, padding: MAINLAND_PADDING });
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
    const resolve = scale === 'department' ? resolveDcode : resolvePcode;
    const out = {};
    for (const [unit, vars] of Object.entries(yearData)) {
      if (vars[variable] == null || Number.isNaN(vars[variable])) continue;
      const code = resolve(unit);
      if (code === null) continue; // excluded from panel
      let v = +vars[variable];
      if (perCapita) {
        // Per-capita uses each unit's SAME-YEAR population. The denominator is
        // stored under `totalpop` in the department blocks but under
        // `total_population` in the province blocks, so read whichever is
        // present (UX2 A.2: province per-capita previously always declined
        // because only `totalpop` was checked). If neither exists for this
        // unit/year, omit the unit rather than present the raw count as a rate.
        const pop = (vars.totalpop > 0) ? vars.totalpop
                  : (vars.total_population > 0 ? vars.total_population : 0);
        if (!(pop > 0)) continue;
        v = (v / pop) * 1e5;
      }
      out[code] = v;
    }
    return out;
  }

  // Default state: instead of an empty placeholder, summarize the current
  // year's distribution. Highest unit, median, n populated. Hovering replaces
  // it with the hovered unit's value; mouseout restores the default.
  function setInfoDefault(distribution, meta, year, perCapita) {
    if (!distribution || !distribution.entries.length) {
      infoEl.classList.add('is-empty');
      infoEl.innerHTML = `<div class="mic-name">No data at this scale, year</div>
        <div class="mic-meta">Try another year</div>
        <div class="mic-value">—</div>`;
      return;
    }
    infoEl.classList.remove('is-empty');
    const fmtUnit = perCapita ? '%' : meta.display_unit;
    const fmtHint = perCapita ? 'rate' : meta.format_hint;
    const top = distribution.entries[0];
    const med = distribution.median;
    infoEl.innerHTML = `
      <div class="mic-overline overline">${year} distribution</div>
      <div class="mic-default-row">
        <span class="mic-default-label">Highest</span>
        <span class="mic-default-value num">${fmt(top.value, fmtHint, fmtUnit)}</span>
      </div>
      <div class="mic-default-name">${escapeHTML(top.name)}</div>
      <div class="mic-default-row">
        <span class="mic-default-label">Median</span>
        <span class="mic-default-value num">${fmt(med, fmtHint, fmtUnit)}</span>
      </div>
      <div class="mic-default-row">
        <span class="mic-default-label">Populated</span>
        <span class="mic-default-value num">${distribution.entries.length} of ${distribution.total}</span>
      </div>
      <div class="mic-default-hint">Hover a unit for its value · click to pin</div>
    `;
  }

  function setInfo(name, year, value, meta, perCapita) {
    infoEl.classList.remove('is-empty');
    const valStr = perCapita ? fmt(value, 'rate', '%') : fmt(value, meta.format_hint, meta.display_unit);
    infoEl.innerHTML = `<div class="mic-name serif">${name}</div>
      <div class="mic-meta">${year} · ${(meta.display_label || meta.label)}</div>
      <div class="mic-value num">${valStr}</div>
      <div class="mic-value-sub">${perCapita ? 'per 100,000 population' : mapUnitCaption(meta)}</div>`;
  }

  // Map unit caption (M032 / polish C1). Two-tier fallback chain:
  //   1. meta.curated_subtitle if non-empty (author override; same field
  //      that drives the chart subtitle).
  //   2. meta.display_unit, with a format_hint fallback for variables
  //      that have no explicit unit string.
  // Map captions are short by convention (legend title carries the variable
  // name; tooltip already shows the value); the chart's tripartite
  // unit/year-range/coverage formula is intentionally NOT used here.
  function mapUnitCaption(meta) {
    if (meta.curated_subtitle) return meta.curated_subtitle;
    return meta.display_unit || (meta.format_hint === 'count' ? 'count' : (meta.format_hint || ''));
  }

  function setInfoTerritory(label, note) {
    infoEl.classList.remove('is-empty');
    infoEl.innerHTML = `<div class="mic-name serif" style="color:#888">${label}</div>
      <div class="mic-meta" style="font-style:italic">${note || 'No administrative data'}</div>`;
  }

  function escapeHTML(s) {
    return String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  }

  async function render({ scale, variable, year, perCapita = false }) {
    // Defensive diagnostic: surface the call shape to the console so a stuck
    // map can be debugged from DevTools. Cheap; only logs when this function
    // is invoked at all.
    try { console.log('[map_view] render called', { scale, variable, year, perCapita }); } catch (_) {}

    // Never hide the entire host — that strands the user with no explanation.
    // Show an explanatory placeholder inside the host instead.
    host.style.display = '';

    // Reset the related-series footer + sparkline; repopulated below.
    relatedEl.style.display = 'none'; relatedEl.innerHTML = '';
    altNoteEl.style.display = 'none'; altNoteEl.innerHTML = '';
    sparkEl.style.display = 'none'; sparkEl.innerHTML = '';
    researchNoteEl.style.display = 'none'; researchNoteEl.textContent = '';
    await loadNationalAggregates();

    if (!variable) {
      mapEl.innerHTML = '<div class="map-empty-state">No variable selected. Pick a variable from the control strip above.</div>';
      srcBlock.textContent = '';
      return;
    }
    if (scale !== 'department' && scale !== 'province') {
      mapEl.innerHTML = `<div class="map-empty-state">Map view is for department and province scale; '${escapeHTML(scale)}' is a national-scale variable. Use the chart instead.</div>`;
      srcBlock.textContent = '';
      return;
    }
    const meta = M.byId(variable);
    if (!meta) {
      mapEl.innerHTML = `<div class="map-empty-state">Variable '${escapeHTML(variable)}' not found in manifest. <a href="#" onclick="location.hash='';location.reload();return false;">Reset to default</a></div>`;
      srcBlock.textContent = '';
      return;
    }
    renderRelatedSeries(meta, scale);
    // Research-construct soft caption (UX2 Addendum 2c): kept browsable, tagged.
    if (meta.catalog_visibility === 'research_only') {
      researchNoteEl.style.display = '';
      researchNoteEl.textContent = 'Research-construct indicator — derived from the Chilean landholding dataset; included for transparency.';
    } else {
      researchNoteEl.style.display = 'none';
      researchNoteEl.textContent = '';
    }
    if (year == null) {
      // Try to fall back to the variable's most recent valid year at this scale.
      const blk = meta.scales && meta.scales[scale];
      const vy = (blk && blk.valid_years) || [];
      if (vy.length) {
        year = vy[Math.floor(vy.length / 2)];
        try { console.log('[map_view] year was null; falling back to median valid_year', year); } catch (_) {}
      } else {
        mapEl.innerHTML = `<div class="map-empty-state">No observations for "${escapeHTML(meta.display_label || meta.label)}" at ${scale} scale. Try a different variable or scale.</div>`;
        srcBlock.textContent = '';
        return;
      }
    }

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
      srcBlock.textContent = `Could not load geometry for ${scale} ${year}: ${err.message}`;
      return;
    }
    // Per-capita denominator handling (audit 5.3). The denominator is each
    // unit's SAME-YEAR population; buildValueMap omits units lacking it. If
    // NO unit has a denominator for this year, decline per-capita entirely and
    // fall back to raw counts with a notice rather than show an empty map.
    let effectivePerCapita = perCapita;
    let pcDeclined = false;
    let values = buildValueMap(scale, year, variable, perCapita);
    if (perCapita && Object.keys(values).length === 0) {
      effectivePerCapita = false;
      pcDeclined = true;
      values = buildValueMap(scale, year, variable, false);
    }
    perCapita = effectivePerCapita;
    try { console.log('[map_view] buildValueMap →', Object.keys(values).length, 'units have values for', variable, 'at', scale, year); } catch (_) {}

    // If buildValueMap returned ZERO units with data, render a clear empty-
    // state explaining what happened. Don't fall through to a blank Leaflet
    // map with no choropleth.
    if (Object.keys(values).length === 0) {
      const blk = meta.scales && meta.scales[scale];
      const vy = (blk && blk.valid_years) || [];
      const otherYears = vy.filter(y => y !== year).slice(0, 6);
      const yearList = otherYears.length
        ? `<p>This variable has data at: ${otherYears.join(', ')}${vy.length > 6 ? ', ...' : ''}. Try moving the slider.</p>`
        : `<p>No years are available for this variable at ${scale} scale.</p>`;
      mapEl.innerHTML = `
        <div class="map-empty-state">
          <strong>No data for "${escapeHTML(meta.display_label || meta.label)}" at ${scale} scale, year ${year}.</strong>
          ${yearList}
        </div>`;
      // Still update the source block so the user knows what they were trying to view
      const docName = M.sourceLine(meta);
      srcBlock.innerHTML = `<span class="src-original serif-i">${escapeHTML(docName || '(no source listed)')}</span>`;
      return;
    }

    // Compute matched intersection for coverage (P1 fix) AND build a sorted
    // distribution so the info card's default state can show highest/median.
    // Territory features (frontier/unorganized/disputed) are excluded from
    // coverage counts — they carry no administrative data.
    const nameField = scale === 'department' ? 'department' : 'provincia';
    let matched = 0;
    const matchedValues = [];
    const matchedEntries = []; // {name, value} for every matched feature
    for (const f of geoJSON.features) {
      if (isTerritory(f)) continue; // skip territory zones for coverage
      const displayName = f.properties[nameField] || f.properties.name;
      const code = featureCode(f, scale);
      const v = values[code];
      if (v != null && !Number.isNaN(v)) {
        matched++;
        matchedValues.push(v);
        matchedEntries.push({ name: displayName, value: v });
      }
    }
    const total = geoJSON.features.filter(f => !isTerritory(f)).length;
    const pct = total > 0 ? Math.round((matched / total) * 100) : 0;
    matchedEntries.sort((a, b) => b.value - a.value);
    const sortedVals = [...matchedValues].sort((a, b) => a - b);
    const median = sortedVals.length
      ? (sortedVals.length % 2
          ? sortedVals[(sortedVals.length - 1) / 2]
          : (sortedVals[sortedVals.length / 2 - 1] + sortedVals[sortedVals.length / 2]) / 2)
      : null;
    const distribution = { entries: matchedEntries, median, total };

    // Quantile breaks on matched values only
    const positives = matchedValues.filter(v => v > 0);
    const breaks = positives.length >= 6 ? quantileBreaks(positives, 7) : [];
    const min = matchedValues.length ? Math.min(...matchedValues) : 0;
    const max = matchedValues.length ? Math.max(...matchedValues) : 1;

    if (layer) { map.removeLayer(layer); layer = null; }
    pinned = null;
    layer = L.geoJSON(geoJSON, {
      style: f => {
        // Territory zones get distinct styling (not data-driven)
        if (isTerritory(f)) {
          const tt = f.properties.territory_type;
          return TERRITORY_STYLES[tt] || TERRITORY_STYLES.unorganized;
        }
        const code = featureCode(f, scale);
        const v = values[code];
        if (v == null) return { fillColor: NO_DATA_FILL, fillOpacity: 0.7, color: NO_DATA_STROKE, weight: 0.6, dashArray: '2 3' };
        const c = breaks.length ? colorFor(v, breaks) : SEQ[Math.min(SEQ.length - 1, Math.floor(((v - min) / Math.max(1, max - min)) * SEQ.length))];
        return { fillColor: c, fillOpacity: 0.86, color: '#FAFAF7', weight: 0.5 };
      },
      onEachFeature: (f, ly) => {
        // Territory zones: show label on hover but no data
        if (isTerritory(f)) {
          const label = f.properties.province || f.properties.department || 'Unorganized territory';
          const note = f.properties.note || '';
          ly.on('mouseover', () => {
            if (pinned) return;
            ly.setStyle({ weight: 1.5, color: '#666' });
            setInfoTerritory(label, note);
          });
          ly.on('mouseout', () => {
            if (pinned) return;
            layer.resetStyle(ly);
            setInfoDefault(distribution, meta, year, perCapita);
          });
          return;
        }
        const code = featureCode(f, scale);
        const v = values[code];
        const displayName = f.properties[nameField] || f.properties.name;
        ly.on('mouseover', () => {
          if (pinned) return;
          ly.setStyle({ weight: 1.5, color: HOVER_STROKE });
          ly.bringToFront();
          if (v != null) setInfo(displayName, year, v, meta, perCapita); else setInfoDefault(distribution, meta, year, perCapita);
        });
        ly.on('mouseout', () => {
          if (pinned) return;
          layer.resetStyle(ly);
          setInfoDefault(distribution, meta, year, perCapita);
        });
        ly.on('click', () => {
          if (pinned === ly) { pinned = null; layer.resetStyle(ly); setInfoDefault(distribution, meta, year, perCapita); return; }
          if (pinned) layer.resetStyle(pinned);
          pinned = ly;
          ly.setStyle({ weight: 2, color: HOVER_STROKE });
          if (v != null) setInfo(displayName, year, v, meta, perCapita); else setInfoDefault(distribution, meta, year, perCapita);
        });
      },
    }).addTo(map);

    // Tighten bbox to mainland Chile (don't fitBounds to GeoJSON which may extend offshore)
    map.fitBounds(MAINLAND_BOUNDS, { animate: false, padding: MAINLAND_PADDING });

    // Default info-card state shows the distribution summary for this view.
    setInfoDefault(distribution, meta, year, perCapita);

    // Legend
    legend.style.display = 'block';
    legend.querySelector('.ml-overline').textContent = scale.charAt(0).toUpperCase() + scale.slice(1) + 's, ' + year;
    legend.querySelector('.ml-title').textContent = (meta.display_label || meta.label) + (perCapita ? ' (per 100,000)' : '');
    legend.querySelector('.ml-units').textContent = perCapita ? 'rate per 100,000 population' : mapUnitCaption(meta);
    legend.querySelector('.ml-ramp').innerHTML = SEQ.map(c => `<span style="background:${c}"></span>`).join('');
    legend.querySelector('.ml-min').textContent = fmt(min, perCapita ? 'rate' : meta.format_hint, perCapita ? '' : meta.display_unit);
    legend.querySelector('.ml-max').textContent = fmt(max, perCapita ? 'rate' : meta.format_hint, perCapita ? '' : meta.display_unit);
    const cov = legend.querySelector('.ml-cov');
    cov.style.display = 'none';

    // Single-line source block.
    const docName = M.sourceLine(meta);
    srcBlock.innerHTML = `
      <span class="src-original serif-i">${escapeHTML(docName)}</span>
      <span class="src-sep">·</span>
      <span class="src-compiler">Compiled by Maximiliano Véjares</span>
    `;

    // Track for cite/CSV
    lastState = { scale, variable, year, perCapita };

    // National-aggregate sparkline above the map (Addendum 3).
    renderSparkline(meta, scale, year, perCapita);

    // ── Item 1: coverage caption + sub-40% banner ────────────────────────
    // Name how many units in the active geometry frame carry data. The count
    // is the matched intersection of geometry features and data (P1 fix),
    // already computed above as `matched` / `total`.
    const scaleNoun = scale === 'department' ? 'departments' : 'provinces';
    covCaptionEl.style.display = 'block';
    covCaptionEl.textContent = `${matched} of ${total} ${scaleNoun} mapped · ${year}` +
      (perCapita ? ' · per capita' : '');
    if (total > 0 && pct < 40) {
      // A choropleth this sparse misleads (the eye reads blank units as low,
      // not absent). Draw it, but only behind a prominent banner.
      covBannerEl.style.display = 'block';
      covBannerEl.setAttribute('style',
        'display:block;margin:8px 0;padding:10px 12px;border:1px solid #7A1E2B;' +
        'border-left:4px solid #7A1E2B;background:#F7ECEC;color:#5A1620;' +
        'font-size:13px;line-height:1.4;border-radius:3px');
      covBannerEl.innerHTML = `<strong>Low coverage (${pct}%).</strong> ` +
        `Only ${matched} of ${total} ${scaleNoun} have data for ${year}. ` +
        `Blank units are <em>missing</em>, not zero — do not read this map as a complete distribution. ` +
        `Try a census year, or use the time series for the units that do have data.`;
    } else {
      covBannerEl.style.display = 'none';
    }

    // ── Item 4: per-capita denominator notice ────────────────────────────
    if (pcDeclined) {
      pcNoticeEl.style.display = 'block';
      pcNoticeEl.setAttribute('style',
        'display:block;margin:8px 0;padding:8px 12px;border:1px solid #B89B5E;' +
        'background:#FBF6EA;color:#6B5A2E;font-size:13px;line-height:1.4;border-radius:3px');
      pcNoticeEl.textContent =
        `Per-capita unavailable for ${year}: no population denominator exists at the ${scale} level for this year. ` +
        `Showing raw counts instead.`;
    } else if (perCapita) {
      pcNoticeEl.style.display = 'block';
      pcNoticeEl.setAttribute('style',
        'display:block;margin:6px 0;font-size:12px;color:#6B6357;font-style:italic');
      pcNoticeEl.textContent = `Per-capita rates use each unit's ${year} population as the denominator (per 100,000).`;
    } else {
      pcNoticeEl.style.display = 'none';
    }

    // ── Item 2: boundary-vintage notice ──────────────────────────────────
    // Subtle notice when the geometry year is merely the closest available;
    // a LOUD notice when the slider year is more than one frame interval past
    // the latest available frame (post-1928 data on pre-1928 boundaries).
    const yrs = scale === 'department' ? CENSUS_GEO_YEARS_DEPT : CENSUS_GEO_YEARS_PROV;
    const geoYear = nearestGeoYear(year, yrs);
    const latestFrame = yrs[yrs.length - 1];
    const lastInterval = yrs[yrs.length - 1] - yrs[yrs.length - 2];
    if (year - latestFrame > lastInterval) {
      noticeEl.style.display = 'block';
      noticeEl.setAttribute('style',
        'display:block;margin:8px 0;padding:10px 12px;border:1px solid #7A1E2B;' +
        'border-left:4px solid #7A1E2B;background:#F7ECEC;color:#5A1620;' +
        'font-size:13px;line-height:1.4;border-radius:3px');
      noticeEl.innerHTML = `<strong>Boundaries predate the data by ${year - latestFrame} years.</strong> ` +
        `The latest available ${scale} geometry is ${latestFrame}; ${year} data is drawn on ${latestFrame} borders. ` +
        `Chile reorganized its provinces and departments after 1928, so these unit boundaries do not match the ${year} administrative map.`;
    } else if (geoYear !== year) {
      noticeEl.style.display = 'block';
      noticeEl.removeAttribute('style');
      noticeEl.textContent = `Showing ${geoYear} boundaries (closest available to ${year}).`;
    } else {
      noticeEl.style.display = 'none';
    }
  }

  return { render };
}
