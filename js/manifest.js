// Manifest queries. The manifest is the single source of truth for
// "what years exist for variable X at scale Y", "is this annual or census",
// "should the chart use log scale", "is this variable available at scale Y".

let _manifest = null;
let _byId = null;
let _stats = null;
let _events = null;
let _scope = null;   // {start, end} from manifest_globals.json (M024)
let _relatedTo = null;  // canonical id -> {alternate_source, retired_into, alternate_currency}

export async function loadManifest() {
  if (_manifest) return _manifest;
  // Bundle-aware: when this runs inside the self-contained atlas bundle the
  // data is already present as window.__INLINE_* globals; otherwise (dev mode)
  // it is fetched from data/. The build script needs no structural rewrite.
  const [m, s, e, g] = await Promise.all([
    window.__INLINE_variable_manifest !== undefined
      ? Promise.resolve(window.__INLINE_variable_manifest)
      : fetch('data/variable_manifest.json').then(r => r.json()),
    window.__INLINE_dataset_stats !== undefined
      ? Promise.resolve(window.__INLINE_dataset_stats)
      : fetch('data/dataset_stats.json').then(r => r.json()),
    window.__INLINE_events !== undefined
      ? Promise.resolve(window.__INLINE_events)
      : fetch('data/events.json').then(r => r.json()),
    // manifest_globals declares the platform analytical window per M024.
    // Non-fatal: if absent the UI falls back to dataset_stats.year_range.
    window.__INLINE_manifest_globals !== undefined
      ? Promise.resolve(window.__INLINE_manifest_globals)
      : fetch('data/manifest_globals.json').then(r => r.ok ? r.json() : null).catch(() => null),
  ]);
  // Source-disable overlay (reversible, no data deleted). Indicators whose id
  // is in window.__DISABLED_INDICATORS are dropped from the catalog entirely,
  // so they vanish from every enumeration (topic grid, browse nav, national
  // chart picker, hero counts, search) and byId cannot resolve them. The id
  // list is generated from variable_manifest.json source attribution by
  // scripts/apply_source_disable.py (driven by curation/disabled_sources.json)
  // and injected into the bundle by build_atlas_bundle.py. Absent/empty list
  // => the full catalog, unfiltered.
  const _disabledIds = (typeof window !== 'undefined' && Array.isArray(window.__DISABLED_INDICATORS))
    ? window.__DISABLED_INDICATORS : [];
  // _full = the resolution universe: every indicator except source-disabled
  // ones. byId / resolveCanonical / relatedTo index this FULL set, so a direct
  // URL to a retired, alternate-variant, or alternate-currency indicator still
  // resolves and the "Related series" links still point somewhere.
  const _full = _disabledIds.length
    ? (() => { const ds = new Set(_disabledIds); return m.filter(v => !ds.has(v.id)); })()
    : m;
  _stats = s;
  _events = e;
  if (g && Number.isFinite(g.platform_scope_start) && Number.isFinite(g.platform_scope_end)) {
    _scope = { start: g.platform_scope_start, end: g.platform_scope_end };
  } else if (s && Array.isArray(s.year_range) && s.year_range.length === 2) {
    _scope = { start: s.year_range[0], end: s.year_range[1] };
  } else {
    _scope = { start: 1840, end: 1990 };
  }
  _byId = new Map(_full.map(v => [v.id, v]));
  // Also index by display_id and by aliases so URLs that cite a renamed or
  // retired indicator still resolve. (curation overlay 01 — duplicates &
  // renames keep the canonical entry but add display_id + aliases lists;
  // a citation pasted before the rename should not 404.)
  for (const v of _full) {
    if (v.display_id && !_byId.has(v.display_id)) _byId.set(v.display_id, v);
    if (Array.isArray(v.aliases)) {
      for (const a of v.aliases) {
        if (a && !_byId.has(a)) _byId.set(a, v);
      }
    }
    // Retired indicators carry a `merged_into` pointer to their canonical;
    // make the canonical reachable by the retired name.
    if (v.presentation_status === 'retired' && v.merged_into) {
      const target = _byId.get(v.merged_into);
      // Note: we do NOT overwrite the original mapping for v.id, because
      // pages that load by the retired ID should still find the retired
      // entry (with its own metadata) and decide how to render it.
    }
  }
  // Reverse index: canonical id -> the ids that point at it. The forward
  // pointers (variant_of, merged_into, currency_view_of) are set by
  // apply_curation_01_duplicates.py; the canonical does not know its
  // alternates, so we invert the relation here for the "Related series" footer.
  // Built from _full so the canonical can still link to hidden alternates.
  _relatedTo = new Map();
  const bucket = (canon, key, id) => {
    if (!canon) return;
    let r = _relatedTo.get(canon);
    if (!r) { r = { alternate_source: [], retired_into: [], alternate_currency: [] }; _relatedTo.set(canon, r); }
    r[key].push(id);
  };
  for (const v of _full) {
    if (v.variant_of) bucket(v.variant_of, 'alternate_source', v.id);
    if (v.merged_into) bucket(v.merged_into, 'retired_into', v.id);
    if (v.currency_view_of) bucket(v.currency_view_of, 'alternate_currency', v.id);
  }
  // _manifest = the BROWSE-VISIBLE catalog: the full set minus indicators that
  // should never appear in the topic grid, browse nav, search, national picker,
  // or hero counts — retired entries, alternate-source / alternate-currency
  // variants of a canonical series, and unit_splice_corruption ratio series
  // whose values are not yet reconciled (curation tasks 3 & 5). All of these
  // remain reachable by direct URL through _byId above.
  const _HIDDEN_STATUS = new Set(['retired', 'alternate_variant', 'alternate_currency']);
  _manifest = _full.filter(v =>
    !_HIDDEN_STATUS.has(v.presentation_status) &&
    v.data_quality_flag !== 'unit_splice_corruption'
  );
  return _manifest;
}

export function manifest() { return _manifest; }
export function stats()    { return _stats; }
export function events()   { return _events; }
export function scope()    { return _scope; }   // {start, end}

export function byId(id) { return _byId.get(id); }

// Related-series reverse index for the canonical `id`, or null if it has none.
// Returns { alternate_source: [...ids], retired_into: [...ids], alternate_currency: [...ids] }.
export function relatedTo(id) {
  return (_relatedTo && _relatedTo.get(id)) || null;
}

// Resolve to a canonical entry, following retired→merged_into and
// alternate_variant→variant_of pointers. Returns the entry the platform
// should render when the user asks for `id`.
export function resolveCanonical(id) {
  let v = _byId.get(id);
  if (!v) return null;
  // Walk one hop for retirement/variant indirection. Two hops would only
  // happen if the curation memo has chains, which it does not.
  if (v.presentation_status === 'retired' && v.merged_into) {
    const canon = _byId.get(v.merged_into);
    if (canon) return canon;
  }
  return v;
}

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

// ── Temporal classification — the single source of truth ────────────────────
// The same id can be a time series at one scale and a snapshot at another
// (total_population is annual at national, census-cadence at province, a
// three-point snapshot at commune), so temporal type is a property of the
// (indicator, scale) PAIR, never a global tag on the indicator.
//
// yearsForScale returns that scale's distinct observed years, sorted. The
// picker badge ("3 years: 1865, 1875, 1885") reads it directly.
export function yearsForScale(meta, scale) {
  const blk = meta && meta.scales && meta.scales[scale];
  if (blk && Array.isArray(blk.valid_years) && blk.valid_years.length) {
    return [...new Set(blk.valid_years)].sort((a, b) => a - b);
  }
  return [];
}

// classifyTemporal returns 'series', 'sparse', or 'snapshot' for the active
// scale. Rule: count distinct years in that scale's valid_years — 4+ is a
// series, exactly 1 is a snapshot, 2 or 3 is sparse. When the scale carries no
// explicit year list, fall back to published_by_scale[scale]. EVERY consumer
// (picker grouping, coverage badge, year scrubber, play control, sparkline,
// chart rendering mode) calls this one function, so they can never disagree.
export function classifyTemporal(meta, scale) {
  if (!meta) return 'snapshot';
  const n = yearsForScale(meta, scale).length;
  if (n === 0) {
    const pub = (meta.published_by_scale && meta.published_by_scale[scale]) || null;
    if (pub === 'cross_section') return 'snapshot';
    if (pub === 'sparse') return 'sparse';
    if (pub === 'partial' || pub === 'complete') return 'series';
    return 'snapshot';
  }
  if (n >= 4) return 'series';
  if (n === 1) return 'snapshot';
  return 'sparse';
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

// Coverage-tier badge for browse cards and the chart head. Reads the
// `published` tier (reliable after the curation tier-rebadge pass). Returns
// {label, cls} or null when no badge is warranted (complete coverage). `cls`
// reuses the existing .variable-flag styling: is-warning for sparse/single-
// year/withheld, is-soft for the gentler partial case.
export function tierBadge(published) {
  switch (published) {
    case 'sparse':        return { label: 'SPARSE COVERAGE',  cls: 'is-warning' };
    case 'cross_section': return { label: 'SINGLE YEAR',      cls: 'is-warning' };
    case 'partial':       return { label: 'PARTIAL COVERAGE', cls: 'is-soft' };
    case false:           return { label: 'WITHHELD — UNDER REVIEW', cls: 'is-warning' };
    default:              return null; // 'complete' or unknown -> no badge
  }
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

// Resolved source line for the chart/map source block and citation. The
// curated citation lives in `source_documents` (plural); `source_document`
// (singular) is what the renderers historically read first and still carries
// filename-style shorthand for some indicators (UX2 C6). Prefer the cleaned
// `source_documents[0]` over `source_document` when both exist and disagree;
// otherwise fall back through the singular field and the source-type name.
// Honest pending-attribution surface. A published series with no concrete
// source document is "pending", not blank and not guessable: surfacing the
// source_type fallback here leaked "Díaz, Lüders & Wagner" / "Multiple primary
// sources (compilation)" onto series whose real (purged-secondary) provenance
// could not be honestly re-cited. `source_attribution_status` records why.
export const PENDING_ATTRIBUTION_LABEL = 'Source pending attribution';
export function hasConcreteSource(meta) {
  if (!meta) return false;
  const docs = Array.isArray(meta.source_documents) ? meta.source_documents : [];
  const first = docs.find(d => d && String(d).trim());
  return Boolean(first || (meta.source_document && String(meta.source_document).trim()));
}

// A series is pending when it carries no concrete source document. The absence
// of a document is authoritative; source_attribution_status names the reason
// (no_recoverable_source, source_pending_no_braun, source_attribution_missing,
// no_family_no_source) for the UI to surface.
export function isPendingAttribution(meta) {
  return Boolean(meta) && !hasConcreteSource(meta);
}

export function sourceLine(meta) {
  if (!meta) return '';
  const docs = Array.isArray(meta.source_documents) ? meta.source_documents : [];
  const clean = docs[0];
  const single = meta.source_document;
  if (clean && single && clean !== single) return clean;
  // Never substitute a source_type guess for a missing citation — that is the
  // blank-fallback leak. An uncited series reads as honestly pending.
  return single || clean || PENDING_ATTRIBUTION_LABEL;
}

// Source-type readable name
export function sourceTypeName(t) {
  return ({
    census: "Chilean Census",
    anuario: "Anuario Estadístico de Chile",
    memoria: "Memoria ministerial",
    sinopsis: "Sinopsis Estadística de Chile",
    mamalakis: "Mamalakis, Historical Statistics of Chile",
    compiled: "Multiple primary sources (compilation)",
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
