// Manifest queries. The manifest is the single source of truth for
// "what years exist for variable X at scale Y", "is this annual or census",
// "should the chart use log scale", "is this variable available at scale Y".

let _manifest = null;
let _byId = null;
let _stats = null;
let _events = null;

export async function loadManifest() {
  if (_manifest) return _manifest;
  const [m, s, e] = await Promise.all([
    fetch('data/variable_manifest.json').then(r => r.json()),
    fetch('data/dataset_stats.json').then(r => r.json()),
    fetch('data/events.json').then(r => r.json()),
  ]);
  _manifest = m;
  _stats = s;
  _events = e;
  _byId = new Map(m.map(v => [v.id, v]));
  return _manifest;
}

export function manifest() { return _manifest; }
export function stats()    { return _stats; }
export function events()   { return _events; }

export function byId(id) { return _byId.get(id); }

export function listForScale(scale, includeHidden = false) {
  return _manifest.filter(v =>
    v.scale_availability[scale] && (includeHidden || v.published !== false)
  );
}

export function categoriesForScale(scale) {
  const out = new Map();
  for (const v of listForScale(scale)) {
    if (!out.has(v.category)) out.set(v.category, []);
    out.get(v.category).push(v);
  }
  return out;
}

export function scaleBlock(id, scale) {
  const v = byId(id);
  if (!v) return null;
  return v.scales[scale] || null;
}

// Snap a year to the nearest valid year for (id, scale).
export function snapYear(id, scale, year) {
  const blk = scaleBlock(id, scale);
  if (!blk || !blk.valid_years.length) return null;
  let best = blk.valid_years[0];
  let bestDelta = Math.abs(best - year);
  for (const y of blk.valid_years) {
    const d = Math.abs(y - year);
    if (d < bestDelta) { best = y; bestDelta = d; }
  }
  return best;
}

// Cadence label for the slider caption.
export function cadenceLabel(id, scale) {
  const v = byId(id);
  const blk = scaleBlock(id, scale);
  if (!v || !blk) return '';
  const [a, b] = blk.year_range;
  const cad = blk.cadence;
  const src = (v.source_documents && v.source_documents[0])
    || ({census: 'Chilean census + INE', anuario: 'Anuarios Estadísticos', mamalakis: 'Mamalakis 1976', sinopsis: 'Sinopsis Estadísticas'}[v.source_type] || 'Mixed sources');
  if (cad === 'annual') return `Annual, ${a}–${b} · ${src}`;
  if (cad === 'census') return `Census years, ${a}–${b} · ${src}`;
  return `Irregular sampling, ${blk.valid_years.length} observation${blk.valid_years.length === 1 ? '' : 's'} ${a}–${b} · ${src}`;
}

// Is this variable a single-year cross-section?
export function isCrossSection(id, scale) {
  const blk = scaleBlock(id, scale);
  return !!blk && blk.valid_years.length <= 1;
}

// Should the chart render log y-axis by default?
export function isLogByDefault(id, scale) {
  const blk = scaleBlock(id, scale);
  if (!blk) return false;
  if (blk.magnitude_hint === 'log') return true;
  if (blk.magnitude_hint === 'linear') return false;
  return blk.magnitude && blk.magnitude.hint === 'log';
}

// Cross-section detection
export function isCrossSectionVariable(id) {
  const v = byId(id);
  if (!v) return false;
  return v.commit_status === 'cross_section';
}

// Filter list by topic_category (closed list of 10)
export function listByTopic(topic, scale = null, includeHidden = false) {
  return _manifest.filter(v =>
    v.topic_category === topic &&
    (includeHidden || v.published !== false) &&
    (!scale || v.scale_availability[scale])
  );
}

// Topic counts (for the landing grid)
export function topicCounts() {
  const out = {};
  for (const v of _manifest) {
    if (v.published === false) continue;
    out[v.topic_category] = (out[v.topic_category] || 0) + 1;
  }
  return out;
}

// Per-capita rules
export function perCapitaMode(id) {
  const v = byId(id);
  return v ? v.per_capita_default : "default_raw";
}

// Tier badge string
export function tierLabel(id) {
  const v = byId(id);
  if (!v) return null;
  if (v.published === "complete") return null;  // no badge
  if (v.published === false) return "HIDDEN";
  return String(v.published).toUpperCase();
}

// Source-type readable name
export function sourceTypeName(t) {
  return ({
    census: "Chilean Census",
    anuario: "Anuario Estadístico de Chile",
    memoria: "Memoria ministerial",
    sinopsis: "Sinopsis Estadística de Chile",
    diaz_luders_wagner: "Díaz, Lüders & Wagner (2016)",
    compiled: "Compiled / multi-source",
  }[t] || t);
}

// Disabled-state caption
export function disabledCaption(id, currentScale) {
  const v = byId(id);
  if (!v) return null;
  if (v.scale_availability[currentScale]) return null;
  const available = Object.entries(v.scale_availability).filter(([_, ok]) => ok).map(([s]) => s);
  if (available.length === 0) return `${v.display_label || v.label} — coming soon`;
  return `${v.display_label || v.label} — switch to ${available[0]} scale`;
}
