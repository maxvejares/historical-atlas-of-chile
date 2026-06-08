// Data-aware national time series.
//
// The chart reads the manifest entry for the variable and adapts:
//   - cadence: annual -> continuous line; census -> dots+thin segments;
//              irregular -> dots only, no connecting line
//   - magnitude.hint == 'log' -> log y-axis (with linear/log toggle)
//   - year_range -> x-domain clamped to variable, not 1840-1990
//   - sparse window (< 8 obs) -> caption with n=K, broken segments, no fill
//   - title (serif) names the variable; one caption names units. No subtitle.
//
// Annotations rail:
//   - 32px strip ABOVE plot area, never overlapping data
//   - greedy collision-avoidance: priority-sorted, drop labels that don't fit
//   - hover grows dot, pinned tooltip card
//   - dashed verticals across the plot are GONE.
//
// Comparison mode (issue #12):
//   - "+ Compare" opens a same-scale variable picker; each added variable
//     becomes its own coloured line with a legend chip.
//   - axis handling: a shared linear axis when every series carries the same
//     unit; otherwise an indexed view (each series rebased to 100 at its
//     first observation) so unlike units stay comparable.
//   - the CSV download exports just the comparison set as a wide table.

import * as M from './manifest.js';
import { attachCiteButton } from './citation.js';

const FMT_INT  = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const FMT_2    = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const FMT_PCT  = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

// Comparison palette — colorblind-safe, distinct per overlaid series.
const COMPARE_PALETTE = ['#0E1A2B', '#7A3B2E', '#2E5A6E', '#4A6A3A', '#6E4A7A', '#8A5A2E'];
const MAX_COMPARE = 6; // primary + up to 5 overlays

// Data-quality-flag human caption + severity. Shared by the single-series and
// comparison renders (UX2 B.1: dq warnings must survive comparison mode).
const DQ_FLAG_LABELS = {
  unit_splice_corruption: 'Data integrity warning: values exceed unit ceiling — do not cite until reconciled.',
  single_cell_corruption: 'Note: one anomalous cell drives the axis; remaining series is interpretable.',
  single_cross_section: 'Single-year snapshot — not a time series.',
  currency_mixed_vintage: 'Nominal currency crosses one or more peso reforms; the series mixes vintages.',
  methodological_break_1976: 'Methodological break in 1976 (INE labor-force survey redesign).',
  scheduled_for_merge: 'Scheduled to merge into a canonical indicator in the next curation pass.',
  scheduled_for_retirement: 'Scheduled for retirement — use the canonical indicator instead.',
  scheduled_for_rename: 'Scheduled for rename in the next curation pass.',
  deflator_convention_drift: 'Deflator base year shifts across publication periods.',
  potentially_unit_splice: 'May share the unit-splice pattern of similar ratio series; verify before citing.',
  source_attribution_missing: 'Source attribution is missing for this series.',
  urban_rural_definition_drift: 'The urban/rural classification varied across the source years.',
  unit_mixed_across_period: 'Reporting unit changes across the period; inspect cell-level attribution.',
  unit_unclear: 'Unit information is incomplete or unclear; verify before citing.',
  sparse_observations: 'Sparse observation coverage in this series.',
  sparse_early_observations: 'Sparse coverage in the early years of the series.',
  alternate_source_variant: 'Alternate-source variant of a canonical indicator.',
  series_endpoint_methodological: 'Series endpoint reflects a source/methodology change, not a data gap.',
  anomalous_early_values: 'Early-period values are implausibly high; treat with skepticism.',
};
function dqFlagLabel(dqf) {
  return DQ_FLAG_LABELS[dqf] || `Caveat: ${dqf.replace(/_/g, ' ')}`;
}
function dqSeverity(dqf) {
  return (dqf === 'unit_splice_corruption' || dqf === 'single_cell_corruption') ? 'blocker' : 'warning';
}

function formatValue(v, fmt, displayUnit) {
  if (v == null || Number.isNaN(v)) return '—';
  // Pure percentage axis (display_unit literally "%"): scale fractions to %.
  if (displayUnit === '%') {
    return FMT_PCT.format(Math.abs(v) <= 1 ? v * 100 : v) + '%';
  }
  // Share variables stored as fractions in [0,1] still render as %.
  if (fmt === 'share' && Math.abs(v) <= 1) {
    return FMT_PCT.format(v * 100) + '%';
  }
  if (Math.abs(v) >= 1e9) return FMT_2.format(v / 1e9) + 'B';
  if (Math.abs(v) >= 1e6) return FMT_2.format(v / 1e6) + 'M';
  if (Math.abs(v) >= 1e3) return FMT_2.format(v / 1e3) + 'K';
  if (Math.abs(v) >= 1)   return FMT_INT.format(v);
  return FMT_2.format(v);
}

function unitLabel(meta) {
  if (meta.display_unit) return meta.display_unit;
  const fmt = meta.format_hint;
  if (fmt === 'share')    return '%';
  if (fmt === 'rate')     return '%';
  if (fmt === 'currency') return 'pesos';
  if (fmt === 'index')    return 'index, base = 100';
  return '';
}

// Chart subtitle. Three-tier fallback chain (M032 / polish C1):
//   1. meta.curated_subtitle if non-empty (author override).
//   2. Auto-built from {unit, year-range, coverage tier}, comma-joined.
//      Tier segment drops when coverage is `complete` (filler noise);
//      shows "partial coverage" / "sparse coverage" otherwise.
//   3. Empty string when none of the above produces text.
//
// Cadence (annual / census-year / irregular) used to live in the subtitle
// but was redundant with the source line at the bottom and the visual
// rendering itself (line vs dots). It now lives only on the source line.
function chartSubtitle(meta, blk) {
  if (meta.curated_subtitle) return meta.curated_subtitle;
  const unit = unitLabel(meta);
  const yr = blk && blk.year_range;
  const yrStr = (yr && yr[0] != null && yr[1] != null)
    ? (yr[0] === yr[1] ? `${yr[0]}` : `${yr[0]}–${yr[1]}`)
    : '';
  return [unit, yrStr].filter(Boolean).join(', ');
}

function pickEvents(allEvents, [a, b]) {
  return allEvents.filter(e => e.year >= a && e.year <= b);
}

// Annotation rail collision resolver.
//
// Hard constraint: each label is ALWAYS centered on its dot's x-coordinate
// (xScale(event.year)). The dot–label association must be unambiguous
// visually; horizontal drift breaks that. Collisions are resolved
// VERTICALLY only — we drop to the next row.
//
// Up to MAX_ROWS (3). If a label can't fit on any row, the dot still
// renders (so the user knows there's an event there) but the label is
// hidden until hover.
//
// Priority order (1 = most important) gets first pick of row 0.
function placeLabels(events, xScale, plotLeft, plotRight) {
  const MAX_ROWS = 3;
  const ROW_GAP_PX = 4;
  const sorted = [...events].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.year - b.year;
  });
  const rows = Array.from({ length: MAX_ROWS }, () => []); // intervals [x0, x1]
  const placed = [];

  function fits(row, lo, hi) {
    for (const [pa, pb] of rows[row]) {
      if (lo < pb + ROW_GAP_PX && hi > pa - ROW_GAP_PX) return false;
    }
    return true;
  }

  for (const e of sorted) {
    const xc = xScale(e.year);                   // dot center
    const labelW = Math.max(36, e.name.length * 6.6 + 8);
    const lo = xc - labelW / 2;
    const hi = xc + labelW / 2;
    let row = -1;
    if (lo >= plotLeft && hi <= plotRight) {
      for (let r = 0; r < MAX_ROWS; r++) {
        if (fits(r, lo, hi)) { row = r; rows[r].push([lo, hi]); break; }
      }
    }
    placed.push({
      ...e,
      x: xc,
      row,
      labelLo: lo,
      labelHi: hi,
      labelW,
      hidden: row === -1,
    });
  }
  return placed;
}

export function createChart(host) {
  host.classList.add('chart-block');
  host.innerHTML = `
    <div class="chart-head">
      <span class="scale-toggle">
        <span class="opt opt-lin is-active">Linear</span>
        <span class="opt opt-log">Log</span>
      </span>
      <div class="variable-flag is-warning chart-alt-note" style="display:none"></div>
      <h2></h2>
      <span class="variable-flag tier-badge" style="display:none"></span>
      <div class="units"></div>
      <div class="chart-legend" style="display:none"></div>
      <div class="variable-def" style="display:none"></div>
      <div class="chart-related" style="display:none"></div>
    </div>
    <div class="chart-svg-wrap">
      <svg class="chart" viewBox="0 0 1200 510"></svg>
      <div class="chart-readout" style="display:none"></div>
      <div class="event-tip" style="display:none"></div>
    </div>
    <div class="chart-source-block"></div>
    <div class="chart-sparse-note" style="display:none"></div>
    <div class="chart-actions"></div>
  `;

  const titleEl = host.querySelector('h2');
  const tierBadgeEl = host.querySelector('.tier-badge');
  const unitsEl = host.querySelector('.units');
  const legendEl = host.querySelector('.chart-legend');
  const defEl = host.querySelector('.variable-def');
  const relatedEl = host.querySelector('.chart-related');
  const altNoteEl = host.querySelector('.chart-alt-note');
  const svgEl = host.querySelector('svg.chart');

  // Shared "Related series" renderer (chart head). Surfaces alternate-source
  // and alternate-currency variants as navigation links, and — when the user
  // is on an alternate itself — a note linking back to the canonical. Retired
  // (merged_into) ids are intentionally not linked: they redirect to the
  // canonical, so a link would round-trip the user back to where they are.
  function renderRelatedSeries(meta, scale) {
    // Reverse direction: the displayed entry is itself an alternate/retired.
    const canonId = meta.variant_of || meta.currency_view_of || meta.merged_into;
    const canon = canonId ? M.byId(canonId) : null;
    if (canon) {
      const kind = meta.variant_of ? 'an alternate-source variant'
                 : meta.currency_view_of ? 'an alternate-currency view'
                 : 'a retired duplicate';
      altNoteEl.innerHTML = `This is ${kind} of `
        + `<a href="#" data-rel-id="${escapeXML(canon.id)}" data-rel-scale="${escapeXML(scale)}">`
        + `${escapeXML(canon.display_label || canon.label)}</a>. `
        + `The canonical series may have different coverage.`;
      altNoteEl.style.display = '';
    } else {
      altNoteEl.style.display = 'none';
      altNoteEl.innerHTML = '';
    }

    // Forward direction: the canonical points to its alternates available at
    // the current scale (a province-only variant is not offered on a dept view).
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
        links.push(`<a href="#" data-rel-id="${escapeXML(id)}" data-rel-scale="${escapeXML(scale)}"`
          + `${sub ? ` title="${escapeXML(sub)}"` : ''}>${escapeXML(name)}</a>`);
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

  // One delegated handler for every related/canonical link in the chart head.
  host.addEventListener('click', (e) => {
    const a = e.target.closest('[data-rel-id]');
    if (!a) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('atlas:nav',
      { detail: { scale: a.dataset.relScale || null, variable: a.dataset.relId } }));
  });
  const readout = host.querySelector('.chart-readout');
  const sourceBlock = host.querySelector('.chart-source-block');
  const sparseEl = host.querySelector('.chart-sparse-note');
  const tipEl = host.querySelector('.event-tip');
  const actionsEl = host.querySelector('.chart-actions');
  const optLin = host.querySelector('.opt-lin');
  const optLog = host.querySelector('.opt-log');

  // Cite + CSV download buttons
  const cite = attachCiteButton(actionsEl, () => ({ scale: state.scale, variable: state.id, year: null, perCapita: state.perCapita, compareIds: state.compareIds.slice() }));

  // UX2 B.4: comparison state must round-trip through the URL hash so a
  // comparison can be shared and cited. Broadcast the active variable set
  // whenever the comparison changes; app.js writes it into the hash as
  // `variables=a,b,c`.
  function notifyCompare() {
    window.dispatchEvent(new CustomEvent('atlas:compare', { detail: {
      scale: state.scale,
      variables: [state.id, ...state.compareIds].filter(Boolean),
      perCapita: state.perCapita,
    }}));
  }
  const csvBtn = document.createElement('button');
  csvBtn.className = 'csv-btn';
  csvBtn.textContent = 'Download CSV';
  csvBtn.addEventListener('click', () => downloadCSV());
  actionsEl.appendChild(csvBtn);

  // Compare button + same-scale variable picker (issue #12)
  const compareBtn = document.createElement('button');
  compareBtn.className = 'compare-btn';
  compareBtn.textContent = '+ Compare';
  compareBtn.addEventListener('click', () => toggleComparePanel());
  actionsEl.appendChild(compareBtn);
  const comparePanel = document.createElement('div');
  comparePanel.className = 'compare-panel';
  comparePanel.style.display = 'none';
  actionsEl.appendChild(comparePanel);

  function buildComparePanel() {
    const list = M.listForScale(state.scale).slice().sort((a, b) =>
      (a.category || '').localeCompare(b.category || '') ||
      (a.display_label || a.label || '').localeCompare(b.display_label || b.label || ''));
    let cat = null, html = '';
    for (const v of list) {
      if (v.category !== cat) {
        cat = v.category;
        html += `<div class="cp-cat">${escapeXML(cat || 'Other')}</div>`;
      }
      const isPrimary = v.id === state.id;
      const isOn = state.compareIds.includes(v.id);
      const cls = 'cp-item' + (isPrimary ? ' is-primary' : '') + (isOn ? ' is-on' : '');
      const mark = isPrimary ? 'base' : (isOn ? 'remove' : 'add');
      html += `<div class="${cls}" data-id="${v.id}"><span>${escapeXML(v.display_label || v.label)}</span><span class="cp-mark">${mark}</span></div>`;
    }
    if (state.compareIds.length >= MAX_COMPARE - 1) {
      html = `<div class="cp-note">Up to ${MAX_COMPARE - 1} variables can be compared. Remove one to add another.</div>` + html;
    }
    comparePanel.innerHTML = html;
    comparePanel.querySelectorAll('.cp-item:not(.is-primary)').forEach(node => {
      node.addEventListener('click', () => {
        const id = node.dataset.id;
        if (state.compareIds.includes(id)) {
          state.compareIds = state.compareIds.filter(x => x !== id);
        } else {
          if (state.compareIds.length >= MAX_COMPARE - 1) return;
          state.compareIds.push(id);
        }
        render();
        buildComparePanel();
        notifyCompare();
      });
    });
  }

  function toggleComparePanel() {
    if (comparePanel.style.display === 'none') {
      buildComparePanel();
      comparePanel.style.display = 'block';
    } else {
      comparePanel.style.display = 'none';
    }
  }

  function writeCSV(rows, name) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function downloadCSV() {
    if (!state.id) return;
    const series = activeSeries();
    if (!series.length) return;
    // Single variable: the long-format export, unchanged.
    if (series.length === 1) {
      const meta = series[0].meta;
      const valueHead = meta.display_label || meta.label || meta.id;
      const unit = meta.display_unit || '';
      const rows = [['year', valueHead, 'unit', 'scale', 'source_type']];
      for (const [y, v] of series[0].pairs) rows.push([y, v, unit, state.scale, meta.source_type]);
      writeCSV(rows, `${meta.id}_${state.scale}.csv`);
      return;
    }
    // Comparison set: a wide table, one column per selected variable. UX2 B.3:
    // the header carried raw snake_case ids and never declared the per-series
    // unit. Head each value column with the human label plus its unit so the
    // second (and later) series' unit is explicit, matching the single-variable
    // export. The raw id stays in the filename.
    const years = [...new Set(series.flatMap(s => s.pairs.map(p => p[0])))].sort((a, b) => a - b);
    const maps = series.map(s => new Map(s.pairs));
    const colHead = s => {
      const lbl = s.meta.display_label || s.meta.label || s.id;
      const unit = s.meta.display_unit || '';
      return unit ? `${lbl} (${unit})` : lbl;
    };
    const rows = [['year', ...series.map(colHead)]];
    for (const y of years) rows.push([y, ...maps.map(m => (m.has(y) ? m.get(y) : ''))]);
    writeCSV(rows, `comparison_${state.scale}.csv`);
  }

  let state = { id: null, scale: null, scaleType: 'linear', defaultLog: false, compareIds: [], perCapita: false };
  // Render-time geometry shared with the crosshair interaction
  let _renderCtx = null; // { pairs, xScale, yScale, meta, W, H, M_LEFT, M_TOP, plotW, plotH, xMin, xMax }

  optLin.addEventListener('click', () => { state.scaleType = 'linear'; optLin.classList.add('is-active'); optLog.classList.remove('is-active'); render(); });
  optLog.addEventListener('click', () => { state.scaleType = 'log';    optLog.classList.add('is-active'); optLin.classList.remove('is-active'); render(); });

  // Resolve {meta, pairs} for any variable id at a given scale.
  function seriesFor(id, scale) {
    const meta = M.byId(id);
    if (!meta) return null;
    if (scale === 'national') {
      const nt = window._data.national_timeseries[id];
      if (!nt) return null;
      const pairs = nt.years.map((y, i) => [y, nt.values[i]])
        .filter(([_, v]) => v != null && !Number.isNaN(v));
      return { meta, pairs };
    }
    // dept / province / commune scale: aggregate by year (sum across units, mean for rate-like)
    const block = scale === 'department' ? window._data.department_data
                : scale === 'commune'    ? window._data.commune_data
                : window._data.province_data;
    if (!block) return [];
    const out = [];
    for (const [yStr, units] of Object.entries(block.data || {})) {
      const y = +yStr;
      const vals = [];
      for (const u of Object.values(units)) {
        if (u[id] != null && !Number.isNaN(u[id])) vals.push(+u[id]);
      }
      if (!vals.length) continue;
      const agg = (meta.format_hint === 'rate' || meta.format_hint === 'share')
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : vals.reduce((a, b) => a + b, 0);
      out.push([y, agg]);
    }
    out.sort((a, b) => a[0] - b[0]);
    return { meta, pairs: out };
  }

  function getSeries() {
    return seriesFor(state.id, state.scale);
  }

  // The primary plus every comparison variable, each with its palette color.
  function activeSeries() {
    const ids = [state.id, ...state.compareIds];
    const out = [];
    ids.forEach((id, i) => {
      const s = seriesFor(id, state.scale);
      if (s && s.pairs.length) out.push({ id, meta: s.meta, pairs: s.pairs, color: COMPARE_PALETTE[i % COMPARE_PALETTE.length] });
    });
    return out;
  }

  // Legend chips for comparison mode; hidden when only the primary is shown.
  function renderLegend() {
    if (state.compareIds.length === 0) {
      legendEl.style.display = 'none';
      legendEl.innerHTML = '';
      return;
    }
    const ids = [state.id, ...state.compareIds].filter(Boolean);
    legendEl.style.display = 'flex';
    legendEl.innerHTML = ids.map((id, i) => {
      const m = M.byId(id);
      const color = COMPARE_PALETTE[i % COMPARE_PALETTE.length];
      const lbl = m ? (m.display_label || m.label) : id;
      const rm = i === 0 ? '' : `<span class="lg-remove" data-id="${id}" title="Remove">×</span>`;
      return `<span class="lg-item"><span class="lg-swatch" style="background:${color}"></span>${escapeXML(lbl)}${rm}</span>`;
    }).join('');
    legendEl.querySelectorAll('.lg-remove').forEach(node => {
      node.addEventListener('click', () => {
        state.compareIds = state.compareIds.filter(x => x !== node.dataset.id);
        render();
        notifyCompare();
      });
    });
  }

  // Event-rail hover wiring, shared by the single and comparison renders.
  function wireEventHover() {
    svgEl.querySelectorAll('.ev-dot').forEach(node => {
      node.addEventListener('mouseenter', () => {
        const yr = +node.dataset.year;
        const e = M.events().find(x => x.year === yr);
        if (!e) return;
        const vline = svgEl.querySelector(`.ev-vline[data-year="${yr}"]`);
        if (vline) vline.setAttribute('stroke-opacity', '0.55');
        node.setAttribute('r', '5.5');
        tipEl.style.display = 'block';
        tipEl.innerHTML = `<span class="e-yr num">${e.year}</span>
          <div class="e-name">${escapeXML(e.name)}</div>
          <div class="e-desc">${escapeXML(e.short_description)}</div>
          <div class="e-cat overline" style="color: ${ ({war:'var(--event-war)',political:'var(--event-political)',economic:'var(--event-economic)',institutional:'var(--event-institutional)'})[e.category] || 'var(--ink-muted)'}">${e.category}</div>`;
        const r = svgEl.getBoundingClientRect();
        const px = (node.cx.baseVal.value / 1200) * r.width + 12;
        const py = (node.cy.baseVal.value / 510) * r.height + 12;
        tipEl.style.left = Math.min(px, r.width - 240) + 'px';
        tipEl.style.top = py + 'px';
      });
      node.addEventListener('mouseleave', () => {
        const yr = +node.dataset.year;
        const vline = svgEl.querySelector(`.ev-vline[data-year="${yr}"]`);
        if (vline) vline.setAttribute('stroke-opacity', '0');
        node.setAttribute('r', '3.5');
        tipEl.style.display = 'none';
      });
    });
  }

  // X-axis tick band, shared by both renders.
  function xAxisSvg(xScale, xMin, xMax, M_TOP, plotH) {
    let svg = '<g class="chart-axis">';
    const tickStart = Math.ceil(xMin / 5) * 5;
    for (let yr = tickStart; yr <= xMax; yr += 5) {
      const xx = xScale(yr);
      const isCentury = yr % 100 === 0;
      const isDecade = yr % 10 === 0;
      const tickLen = isCentury ? 6 : (isDecade ? 4 : 3);
      svg += `<line x1="${xx}" x2="${xx}" y1="${M_TOP + plotH}" y2="${M_TOP + plotH + tickLen}" stroke="${isCentury ? '#0E1A2B' : '#D9D2C2'}" stroke-width="${isCentury ? 1 : 0.75}"/>`;
      if (isDecade) svg += `<text x="${xx}" y="${M_TOP + plotH + 18}" text-anchor="middle">${yr}</text>`;
    }
    return svg + '</g>';
  }

  // Event-rail SVG, shared by both renders.
  function eventRailSvg(xScale, xMin, xMax, M_TOP, plotW, plotH) {
    const railBaselineY = M_TOP - 6;
    let svg = `<g class="event-rail"><line class="baseline" x1="${M_LEFT_C}" x2="${M_LEFT_C + plotW}" y1="${railBaselineY}" y2="${railBaselineY}"/>`;
    for (const e of pickEvents(M.events(), [xMin, xMax])) {
      const ex = xScale(e.year);
      const fill = ({war: 'var(--event-war)', political: 'var(--event-political)', economic: 'var(--event-economic)', institutional: 'var(--event-institutional)'})[e.category] || 'var(--ink-muted)';
      svg += `<circle class="ev-dot" data-year="${e.year}" cx="${ex}" cy="${railBaselineY}" r="3.5" fill="${fill}"/>`;
      svg += `<line class="ev-vline" data-year="${e.year}" x1="${ex}" x2="${ex}" y1="${railBaselineY + 4}" y2="${M_TOP + plotH}" stroke="${fill}" stroke-width="1" stroke-dasharray="3,3" stroke-opacity="0" pointer-events="none"/>`;
    }
    return svg + '</g>';
  }
  const M_LEFT_C = 84; // shared left margin

  // X-domain follows the data's own span (snapped out to 5-year ticks) rather
  // than a fixed 1810–1990 platform rail, so a series that covers only part of
  // the period is never marooned in empty whitespace.
  function dataXDomain(xs) {
    let lo = Math.min(...xs), hi = Math.max(...xs);
    if (!isFinite(lo) || !isFinite(hi)) return [1810, 1990];
    if (lo === hi) { lo -= 5; hi += 5; }
    return [Math.floor(lo / 5) * 5, Math.ceil(hi / 5) * 5];
  }

  function render() {
    if (!state.id) return;
    renderLegend();
    if (state.compareIds.length > 0) {
      // Comparison mode: the related-series footer is single-variable context.
      relatedEl.style.display = 'none'; relatedEl.innerHTML = '';
      altNoteEl.style.display = 'none'; altNoteEl.innerHTML = '';
      renderMulti();
      return;
    }
    renderSingle();
  }

  function renderSingle() {
    let series = getSeries();
    const meta = series && series.meta;
    if (!series || !series.pairs.length) {
      titleEl.textContent = meta ? meta.label : '';
      if (tierBadgeEl) tierBadgeEl.style.display = 'none';
      unitsEl.textContent = '';
      svgEl.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#94918A" font-family="Source Serif 4" font-style="italic" font-size="16">No observations at this scale.</text>';
      sourceBlock.textContent = '';
      sparseEl.style.display = 'none';
      if (meta) renderRelatedSeries(meta, state.scale);
      return;
    }

    // Data-quality gate: a `unit_splice_corruption` series carries impossible
    // values (e.g. a "%" share contaminated with peso-level magnitudes from a
    // bad merge, or a tonnage series mixing tons and kilograms). These are
    // already excluded from the catalog (manifest.js / browse_nav.js); this
    // guards the only remaining path — a direct deep-link URL — so the
    // contaminated values are never plotted as if they were reliable.
    if ((meta.data_quality_flag || '').trim() === 'unit_splice_corruption') {
      titleEl.textContent = meta.display_label || meta.label;
      if (tierBadgeEl) tierBadgeEl.style.display = 'none';
      unitsEl.textContent = '';
      defEl.innerHTML = `<div class="variable-flag is-${dqSeverity('unit_splice_corruption')}">${escapeXML(dqFlagLabel('unit_splice_corruption'))}</div>`
        + `<div class="variable-def-text">This series is withheld pending unit reconciliation: its recorded values mix incompatible units and are not yet reliable, so the chart is not drawn.</div>`;
      defEl.style.display = 'block';
      svgEl.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#94918A" font-family="Source Serif 4" font-style="italic" font-size="16">Withheld pending unit reconciliation.</text>';
      sourceBlock.textContent = '';
      sparseEl.style.display = 'none';
      renderRelatedSeries(meta, state.scale);
      return;
    }

    const blk = meta.scales[state.scale];

    // Per-capita transform (UX2 A.1). The national chart previously ignored the
    // toggle entirely. When per-capita is on at national scale, divide each
    // year's value by that year's national population (per 100,000 people) so
    // the toggle actually does something. The denominator is the national
    // total_population series; years without a denominator are dropped. The
    // population indicator itself is exempt (dividing it by itself is noise).
    let dispUnit = meta.display_unit, dispFmt = meta.format_hint, pcActive = false;
    if (state.perCapita && state.scale === 'national' && meta.id !== 'total_population') {
      const popS = (window._data.national_timeseries || {}).total_population;
      if (popS && popS.years) {
        const popMap = new Map(popS.years.map((y, i) => [y, popS.values[i]]));
        const pc = series.pairs
          .map(([y, v]) => { const p = popMap.get(y); return (p > 0) ? [y, (v / p) * 1e5] : null; })
          .filter(Boolean);
        if (pc.length) {
          series = { meta, pairs: pc };
          dispUnit = 'per 100,000 people';
          dispFmt = 'rate';
          pcActive = true;
        }
      }
    }

    const cadence = blk.cadence;
    // Time series draws a connecting line; dots mark real observations for
    // census/irregular cadences.
    let renderingMode = blk.rendering_mode
      || ({annual: 'line', census: 'dots_with_line', irregular: 'dots_with_line'}[cadence])
      || 'dots_with_line';
    // A sparse series (2–3 observations at this scale) renders as bare dots at
    // the observed years — a connecting line across decade gaps fakes
    // interpolation. classifyTemporal is the single arbiter, shared with the
    // picker, the badges, and the map. For denser series an explicit 'dots'
    // mode is still upgraded to dots_with_line (the audited census rendering).
    const temporalClass = M.classifyTemporal(meta, state.scale);
    if (temporalClass === 'sparse') {
      renderingMode = 'dots';
    } else if (renderingMode === 'dots') {
      renderingMode = 'dots_with_line';
    }
    // ONE title (Fraunces) + ONE units caption (cadence + format only).
    // Source line below the chart carries provenance; we don't repeat it
    // in the chart head.
    titleEl.textContent = meta.display_label || meta.label;
    // Coverage-tier badge (audit 3.1/5.1): complete -> none; partial/sparse/
    // single-year -> a small badge so the reader knows the coverage class.
    const tb = M.tierBadge(meta.published);
    if (tb) {
      tierBadgeEl.className = `variable-flag tier-badge ${tb.cls}`;
      tierBadgeEl.textContent = tb.label;
      tierBadgeEl.style.display = '';
    } else {
      tierBadgeEl.style.display = 'none';
    }
    unitsEl.textContent = pcActive
      ? `${meta.display_label || meta.label} per 100,000 people, ${blk.year_range[0]}–${blk.year_range[1]}`
      : chartSubtitle(meta, blk);
    // Authored definition + data-quality flag are surfaced in the chart
    // head under the units line. Curation overlay sets meta.definition for
    // all 257 indicators (apply_curation_04_definitions.py).
    const defText = (meta.definition || '').trim();
    const dqf = (meta.data_quality_flag || '').trim();
    const covText = (meta.coverage_statement || '').trim();
    const researchOnly = meta.catalog_visibility === 'research_only';
    if (defText || dqf || researchOnly || covText) {
      let html = '';
      if (researchOnly) {
        html += `<div class="variable-flag is-soft research-note">Research-construct indicator — derived from the Chilean landholding dataset; included for transparency.</div>`;
      }
      if (dqf) {
        html += `<div class="variable-flag is-${dqSeverity(dqf)}">${escapeXML(dqFlagLabel(dqf))}</div>`;
      }
      if (defText) {
        html += `<div class="variable-def-text">${escapeXML(defText)}</div>`;
      }
      // Explicit coverage statement (curation overlay 04): tells the reader how
      // complete the series is (units covered, year span) before they use it.
      if (covText) {
        html += `<div class="variable-def-text variable-coverage-text">Coverage: ${escapeXML(covText)}</div>`;
      }
      defEl.innerHTML = html;
      defEl.style.display = 'block';
    } else {
      defEl.style.display = 'none';
      defEl.innerHTML = '';
    }
    renderRelatedSeries(meta, state.scale);

    const W = 1200, H = 510;
    // Annotation rail: dots-only (labels removed), 24px for dot baseline + breathing.
    const RAIL_H = 24;
    const M_TOP = RAIL_H;
    const M_RIGHT = 24;
    const M_BOTTOM = 28;
    const M_LEFT = 84;
    const plotW = W - M_LEFT - M_RIGHT;
    const plotH = H - M_TOP - M_BOTTOM;

    const xs = series.pairs.map(p => p[0]);
    const ys = series.pairs.map(p => p[1]);
    // X-domain is the variable's own data span (see dataXDomain): a chart
    // shows only from where its data begins to where it ends.
    const [xMin, xMax] = dataXDomain(xs);
    let yMin = Math.min(...ys), yMax = Math.max(...ys);

    // Decide scale type
    const useLog = (state.scaleType === 'log') || (state.scaleType === 'auto' && blk.magnitude.hint === 'log');
    const positive = ys.every(v => v > 0);
    const effectiveLog = useLog && positive;

    let yDomain;
    if (effectiveLog) {
      const lo = Math.min(...ys.filter(v => v > 0));
      yDomain = [lo / 1.5, yMax * 1.05];
    } else {
      const pad = (yMax - yMin) * 0.05 || Math.abs(yMax) * 0.05 || 1;
      yDomain = [yMin - pad, yMax + pad];
      if (yMin >= 0 && yDomain[0] < 0) yDomain[0] = 0;
    }

    const xScale = (year) => M_LEFT + ((year - xMin) / Math.max(1, xMax - xMin)) * plotW;
    const yScale = effectiveLog
      ? (v) => {
          const lo = Math.log10(yDomain[0]), hi = Math.log10(yDomain[1]);
          return M_TOP + plotH - ((Math.log10(Math.max(v, yDomain[0])) - lo) / (hi - lo)) * plotH;
        }
      : (v) => M_TOP + plotH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH;

    // Build SVG content
    let svg = '';

    // Y ticks (no horizontal gridlines — labels only)
    const yTicks = effectiveLog ? logTicks(yDomain) : niceTicks(yDomain[0], yDomain[1], 5);
    svg += '<g class="chart-axis">';
    for (const t of yTicks) {
      const yy = yScale(t);
      svg += `<text x="${M_LEFT - 8}" y="${yy + 3}" text-anchor="end">${formatValue(t, dispFmt, dispUnit)}</text>`;
    }
    svg += '</g>';

    // X axis: a tick every 5 years (decades and centuries emphasized); a
    // year label every 10 years so the labels stay legible across the full
    // 1810–1990 span.
    svg += xAxisSvg(xScale, xMin, xMax, M_TOP, plotH);

    // Data color: ink default; manifest.accent overrides per-variable.
    // Oxblood (var(--accent)) is reserved for hover and selection only.
    const dataColor = meta.accent || '#0E1A2B';

    // Cadence-aware / rendering_mode-aware data rendering
    const drawDots = () => {
      let s = '';
      for (const [x, y] of series.pairs) s += `<circle class="chart-dot" cx="${xScale(x)}" cy="${yScale(y)}" r="3.5" fill="${dataColor}"/>`;
      return s;
    };
    if (renderingMode === 'line') {
      const segs = breakSegments(series.pairs, 1.5);
      for (const seg of segs) {
        const d = seg.map(([x, y], i) => (i === 0 ? 'M' : 'L') + xScale(x) + ',' + yScale(y)).join(' ');
        svg += `<path class="chart-line" d="${d}" stroke="${dataColor}"/>`;
      }
    } else if (renderingMode === 'step' || renderingMode === 'dots_with_line') {
      if (renderingMode === 'step') {
        let d = '';
        for (let i = 0; i < series.pairs.length; i++) {
          const [x, y] = series.pairs[i];
          if (i === 0) d += `M${xScale(x)},${yScale(y)}`;
          else d += `H${xScale(x)}V${yScale(y)}`;
        }
        svg += `<path class="chart-line" d="${d}" stroke="${dataColor}"/>`;
      } else {
        // dots_with_line (census / irregular): connect observations but break
        // the line at interior gaps longer than the modal sampling interval,
        // so the chart never interpolates visually across a hole. (audit 3.2)
        const segs = breakSegments(series.pairs, 1.5);
        for (const seg of segs) {
          const d = seg.map(([x, y], i) => (i === 0 ? 'M' : 'L') + xScale(x) + ',' + yScale(y)).join(' ');
          svg += `<path class="chart-line" d="${d}" stroke="${dataColor}"/>`;
        }
      }
      svg += drawDots();
    } else {
      svg += drawDots();
    }

    // Break-rule annotations. Curation overlay (apply_curation_03_breaks.py)
    // attaches per-indicator break events covering currency reforms
    // (1925/1960/1975), boundary changes (1883, 1928, 1974), methodological
    // shifts (1976 ENE redesign), and source transitions. Each break is
    // drawn as a thin vertical dashed line at its year, with a hover-tooltip
    // showing the break label and description.
    svg += breaksSvg(Array.isArray(meta.breaks) ? meta.breaks : [], xScale, xMin, xMax, M_TOP, plotH);

    // Annotation rail. Each label is centered horizontally on its dot's
    // x-coordinate. Collisions are resolved VERTICALLY by stacking up to
    // three rows; labels that don't fit anywhere are hidden but the dot
    // remains, with the name available on hover.
    svg += eventRailSvg(xScale, xMin, xMax, M_TOP, plotW, plotH);

    svgEl.innerHTML = svg;

    // Sparse caption — hidden (internal quality info, not for end users)
    sparseEl.style.display = 'none';

    // Single-line source block. Original source · coverage · compiler. The
    // brief asks for one organized line, not a three-line stack of metadata.
    const docName = M.sourceLine(meta);
    sourceBlock.innerHTML = `
      <span class="src-original serif-i">${escapeXML(docName)}</span>
      <span class="src-sep">·</span>
      <span class="src-compiler">Compiled by Maximiliano Véjares</span>
    `;

    // Store render context for crosshair interaction
    _renderCtx = { pairs: series.pairs, xScale, yScale, meta, dispFmt, dispUnit, W, H, M_LEFT, M_TOP, M_RIGHT, M_BOTTOM, plotW, plotH, xMin, xMax };

    // Event hover wiring: show tooltip + vertical line on mouseenter
    wireEventHover();
  }

  // Comparison render: two or more variables overlaid as coloured lines.
  // A shared linear axis is used when every series carries the same unit;
  // otherwise each series is rebased to 100 at its first observation so
  // unlike units stay comparable on one axis.
  function renderMulti() {
    const series = activeSeries();
    if (series.length < 2) { renderSingle(); return; }

    const unitOf = (s) => s.meta.display_unit || s.meta.format_hint || '';
    const indexed = new Set(series.map(unitOf)).size > 1;

    const plot = series.map(s => {
      let pairs = s.pairs;
      if (indexed) {
        const base = s.pairs.find(p => p[1] != null && p[1] !== 0 && !Number.isNaN(p[1]));
        const b = base ? base[1] : null;
        pairs = b ? s.pairs.map(([y, v]) => [y, (v / b) * 100]) : s.pairs;
      }
      return { ...s, plotPairs: pairs };
    });

    titleEl.textContent = 'Variable comparison';
    if (tierBadgeEl) tierBadgeEl.style.display = 'none';
    unitsEl.textContent = indexed
      ? 'Indexed: first observation of each series = 100'
      : (series[0].meta.display_unit || unitLabel(series[0].meta) || '');

    // UX2 B.1: data-quality warnings must survive comparison mode. Collect the
    // dq flag of every series and render one combined caveat block above the
    // plot, naming which series each caveat applies to, so a reader overlaying
    // a flagged series against a clean one still sees the warning.
    const flagged = series
      .map(s => ({ label: s.meta.display_label || s.meta.label, dqf: (s.meta.data_quality_flag || '').trim() }))
      .filter(s => s.dqf);
    if (flagged.length) {
      defEl.innerHTML = flagged.map(s =>
        `<div class="variable-flag is-${dqSeverity(s.dqf)}">${escapeXML(s.label)}: ${escapeXML(dqFlagLabel(s.dqf))}</div>`
      ).join('');
      defEl.style.display = 'block';
    } else {
      defEl.style.display = 'none';
      defEl.innerHTML = '';
    }

    const W = 1200, H = 510;
    const RAIL_H = 24, M_TOP = RAIL_H, M_RIGHT = 24, M_BOTTOM = 28, M_LEFT = 84;
    const plotW = W - M_LEFT - M_RIGHT;
    const plotH = H - M_TOP - M_BOTTOM;

    const allX = plot.flatMap(s => s.plotPairs.map(p => p[0]));
    const allY = plot.flatMap(s => s.plotPairs.map(p => p[1])).filter(v => v != null && !Number.isNaN(v));
    if (!allY.length) { renderSingle(); return; }

    const [xMin, xMax] = dataXDomain(allX);
    let yMin = Math.min(...allY), yMax = Math.max(...allY);

    const useLog = (state.scaleType === 'log') && allY.every(v => v > 0);
    let yDomain;
    if (useLog) {
      yDomain = [Math.min(...allY.filter(v => v > 0)) / 1.5, yMax * 1.05];
    } else {
      const pad = (yMax - yMin) * 0.05 || Math.abs(yMax) * 0.05 || 1;
      yDomain = [yMin - pad, yMax + pad];
      if (yMin >= 0 && yDomain[0] < 0) yDomain[0] = 0;
    }

    const xScale = (year) => M_LEFT + ((year - xMin) / Math.max(1, xMax - xMin)) * plotW;
    const yScale = useLog
      ? (v) => {
          const lo = Math.log10(yDomain[0]), hi = Math.log10(yDomain[1]);
          return M_TOP + plotH - ((Math.log10(Math.max(v, yDomain[0])) - lo) / (hi - lo)) * plotH;
        }
      : (v) => M_TOP + plotH - ((v - yDomain[0]) / (yDomain[1] - yDomain[0])) * plotH;

    let svg = '';

    // Y ticks
    const yTicks = useLog ? logTicks(yDomain) : niceTicks(yDomain[0], yDomain[1], 5);
    svg += '<g class="chart-axis">';
    for (const t of yTicks) {
      const yy = yScale(t);
      const label = indexed ? FMT_INT.format(t)
        : formatValue(t, series[0].meta.format_hint, series[0].meta.display_unit);
      svg += `<text x="${M_LEFT - 8}" y="${yy + 3}" text-anchor="end">${label}</text>`;
    }
    svg += '</g>';

    // X ticks
    svg += xAxisSvg(xScale, xMin, xMax, M_TOP, plotH);

    // One coloured line + dots per series.
    for (const s of plot) {
      const segs = breakSegments(s.plotPairs, 1.5);
      for (const seg of segs) {
        if (seg.length === 1) {
          const [x, y] = seg[0];
          svg += `<circle class="chart-dot" cx="${xScale(x)}" cy="${yScale(y)}" r="3.5" fill="${s.color}"/>`;
          continue;
        }
        const d = seg.map(([x, y], i) => (i === 0 ? 'M' : 'L') + xScale(x) + ',' + yScale(y)).join(' ');
        svg += `<path class="chart-line" d="${d}" stroke="${s.color}"/>`;
      }
      for (const [x, y] of s.plotPairs) {
        svg += `<circle class="chart-dot" cx="${xScale(x)}" cy="${yScale(y)}" r="3" fill="${s.color}"/>`;
      }
    }

    // UX2 B.2: break annotations were drawn only in single-series mode. Draw
    // the union of every series' breaks here so a reform line (e.g. the 1960
    // escudo) is not lost when a series is viewed in comparison.
    const unionBreaks = [];
    const seenBreak = new Set();
    for (const s of series) {
      for (const b of (Array.isArray(s.meta.breaks) ? s.meta.breaks : [])) {
        if (b.year == null) continue;
        const k = `${b.year}|${b.label || ''}`;
        if (seenBreak.has(k)) continue;
        seenBreak.add(k);
        unionBreaks.push(b);
      }
    }
    svg += breaksSvg(unionBreaks, xScale, xMin, xMax, M_TOP, plotH);

    // Event rail
    svg += eventRailSvg(xScale, xMin, xMax, M_TOP, plotW, plotH);

    svgEl.innerHTML = svg;
    sparseEl.style.display = 'none';
    sourceBlock.innerHTML = `
      <span class="src-original serif-i">${series.length} series compared</span>
      <span class="src-sep">·</span>
      <span class="src-compiler">Compiled by Maximiliano Véjares</span>
    `;

    // Crosshair is disabled in comparison mode; the legend and dots carry
    // the per-series identification.
    _renderCtx = null;
    onChartMouseLeave();
    wireEventHover();
  }

  // ── Crosshair interaction: hover the plot area to read values ──────────
  // Translates mouse x position to the nearest data point, shows a vertical
  // crosshair line and the value in the readout badge (top-right).
  const svgWrap = host.querySelector('.chart-svg-wrap');

  function onChartMouseMove(e) {
    if (!_renderCtx || !_renderCtx.pairs.length) return;
    const { pairs, xScale, yScale, meta, dispFmt, dispUnit, W, H, M_LEFT, M_TOP, plotW, plotH, xMin, xMax } = _renderCtx;
    const rect = svgEl.getBoundingClientRect();
    // Mouse x in SVG coordinate space
    const mouseXPct = (e.clientX - rect.left) / rect.width;
    const svgX = mouseXPct * W;
    // Clamp to plot area
    if (svgX < M_LEFT || svgX > M_LEFT + plotW) { onChartMouseLeave(); return; }
    // Convert svgX to year
    const yearFloat = xMin + ((svgX - M_LEFT) / plotW) * (xMax - xMin);
    // Find nearest data point
    let best = pairs[0], bestDist = Math.abs(pairs[0][0] - yearFloat);
    for (const p of pairs) {
      const d = Math.abs(p[0] - yearFloat);
      if (d < bestDist) { best = p; bestDist = d; }
    }
    const [yr, val] = best;
    const px = xScale(yr);
    const py = yScale(val);
    // Update or create crosshair elements inside the SVG
    let crossG = svgEl.querySelector('.crosshair-g');
    if (!crossG) {
      crossG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      crossG.classList.add('crosshair-g');
      crossG.innerHTML = `
        <circle class="ch-dot" r="5" fill="var(--accent)" stroke="var(--paper)" stroke-width="2" pointer-events="none"/>
      `;
      svgEl.appendChild(crossG);
    }
    const dot = crossG.querySelector('.ch-dot');
    dot.setAttribute('cx', px); dot.setAttribute('cy', py);
    crossG.style.display = '';
    // Show readout
    readout.style.display = 'block';
    readout.innerHTML = `<span class="yr">${yr}</span><span class="val">${formatValue(val, dispFmt, dispUnit)}</span>`;
  }

  function onChartMouseLeave() {
    const crossG = svgEl.querySelector('.crosshair-g');
    if (crossG) crossG.style.display = 'none';
    readout.style.display = 'none';
  }

  svgWrap.addEventListener('mousemove', onChartMouseMove);
  svgWrap.addEventListener('mouseleave', onChartMouseLeave);

  return {
    mount({ id, scale, perCapita = false, compareIds = [] }) {
      state.id = id;
      state.scale = scale;
      state.perCapita = perCapita;
      // Restore a deep-linked comparison set (UX2 B.4); drop the primary and any
      // unknown/duplicate ids. Empty for a normal single-variable mount.
      const seen = new Set([id]);
      state.compareIds = (compareIds || []).filter(cid => {
        if (!cid || seen.has(cid) || !M.byId(cid)) return false;
        seen.add(cid); return true;
      }).slice(0, MAX_COMPARE - 1);
      comparePanel.style.display = 'none';
      state.defaultLog = M.isLogByDefault(id, scale);
      state.scaleType = state.defaultLog ? 'log' : 'linear';
      if (state.defaultLog) { optLog.classList.add('is-active'); optLin.classList.remove('is-active'); }
      else                  { optLin.classList.add('is-active'); optLog.classList.remove('is-active'); }
      render();
    },
  };
}

// --- helpers ---

function niceTicks(lo, hi, n = 5) {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const step = Math.pow(10, Math.floor(Math.log10(span / n)));
  const err = (n / span) * step;
  let stepM = step;
  if (err <= 0.15) stepM *= 10;
  else if (err <= 0.35) stepM *= 5;
  else if (err <= 0.75) stepM *= 2;
  const t0 = Math.ceil(lo / stepM) * stepM;
  const out = [];
  for (let v = t0; v <= hi + 1e-9; v += stepM) out.push(+v.toFixed(10));
  return out;
}

function logTicks(domain) {
  const lo = Math.floor(Math.log10(domain[0]));
  const hi = Math.ceil(Math.log10(domain[1]));
  const out = [];
  for (let p = lo; p <= hi; p++) out.push(Math.pow(10, p));
  return out;
}

// Most common year-to-year spacing in a series — its natural sampling cadence.
function modalGap(diffs) {
  const counts = new Map();
  for (const d of diffs) counts.set(d, (counts.get(d) || 0) + 1);
  let best = diffs[0], bestN = 0;
  for (const [d, n] of counts) {
    if (n > bestN || (n === bestN && d < best)) { best = d; bestN = n; }
  }
  return best;
}

// Split a series into segments, breaking wherever an interior gap exceeds the
// MODAL sampling interval (times gapMultiple). Threshold is computed per-series
// off its own cadence, so annual, census, and irregular series each break only
// at genuine holes and the line never interpolates across a gap. (audit 3.2)
function breakSegments(pairs, gapMultiple) {
  if (pairs.length < 2) return [pairs];
  const diffs = [];
  for (let i = 1; i < pairs.length; i++) diffs.push(pairs[i][0] - pairs[i-1][0]);
  const threshold = modalGap(diffs) * (gapMultiple || 1.5);
  const segs = [[pairs[0]]];
  for (let i = 1; i < pairs.length; i++) {
    if (pairs[i][0] - pairs[i-1][0] > threshold) segs.push([pairs[i]]);
    else segs[segs.length - 1].push(pairs[i]);
  }
  return segs;
}

function autoDef(meta, blk) {
  const ttl = (meta.display_label || meta.label).toLowerCase();
  const [a, b] = blk.year_range;
  const cad = blk.cadence === 'annual' ? 'annual observations'
            : blk.cadence === 'census' ? 'census-year observations'
            : 'irregular observations';
  const src = M.sourceTypeName(meta.source_type);
  return `${cad.charAt(0).toUpperCase() + cad.slice(1)} of ${ttl}, ${a}–${b}. Compiled from ${src}.`;
}

function escapeXML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// Break-rule annotations as thin vertical dashed lines with a hover title.
// Shared by the single-series and comparison renders (UX2 B.2).
function breaksSvg(breaksList, xScale, xMin, xMax, M_TOP, plotH) {
  if (!breaksList || !breaksList.length) return '';
  let svg = '<g class="chart-breaks">';
  for (const b of breaksList) {
    if (b.year == null || b.year < xMin || b.year > xMax) continue;
    const bx = xScale(b.year);
    const sevColor = b.severity === 'blocker' ? '#7A1E2B' : (b.severity === 'warning' ? '#7A1E2B' : '#94918A');
    const dash = b.severity === 'informational' ? '2,3' : '4,3';
    const safeLabel = escapeXML(`${b.year} — ${b.label || ''}`);
    const safeDesc = escapeXML(b.description || '');
    svg += `<g class="chart-break" data-year="${b.year}">`;
    svg += `<line x1="${bx}" y1="${M_TOP}" x2="${bx}" y2="${M_TOP + plotH}" stroke="${sevColor}" stroke-width="1" stroke-dasharray="${dash}" opacity="0.55"/>`;
    svg += `<title>${safeLabel}\n${safeDesc}</title>`;
    svg += `<text x="${bx + 3}" y="${M_TOP + 10}" font-size="10" fill="${sevColor}" opacity="0.7">${b.year}</text>`;
    svg += `</g>`;
  }
  return svg + '</g>';
}
