// Data-aware national time series.
//
// The chart reads the manifest entry for the variable and adapts:
//   - cadence: annual -> continuous line; census -> dots+thin segments;
//              irregular -> dots only, no connecting line
//   - magnitude.hint == 'log' -> log y-axis (with linear/log toggle)
//   - year_range -> x-domain clamped to variable, not 1810-1995
//   - sparse window (< 8 obs) -> caption with n=K, broken segments, no fill
//   - title (serif) names the variable; one caption names units. No subtitle.
//
// Annotations rail:
//   - 32px strip ABOVE plot area, never overlapping data
//   - greedy collision-avoidance: priority-sorted, drop labels that don't fit
//   - hover grows dot, pinned tooltip card
//   - dashed verticals across the plot are GONE.

import * as M from './manifest.js';
import { attachCiteButton } from './citation.js';

const FMT_INT  = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const FMT_2    = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const FMT_PCT  = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });

function formatValue(v, fmt) {
  if (v == null || Number.isNaN(v)) return '—';
  if (fmt === 'rate' || fmt === 'share') return FMT_PCT.format(v) + (Math.abs(v) <= 1 ? '' : '%');
  if (Math.abs(v) >= 1e9) return FMT_2.format(v / 1e9) + 'B';
  if (Math.abs(v) >= 1e6) return FMT_2.format(v / 1e6) + 'M';
  if (Math.abs(v) >= 1e3) return FMT_2.format(v / 1e3) + 'K';
  return FMT_INT.format(v);
}

function unitLabel(meta) {
  const fmt = meta.format_hint;
  if (fmt === 'rate')     return 'rate';
  if (fmt === 'share')    return 'share';
  if (fmt === 'currency') return 'currency, as recorded';
  if (fmt === 'index')    return 'index';
  return 'count';
}

function pickEvents(allEvents, [a, b]) {
  return allEvents.filter(e => e.year >= a && e.year <= b);
}

// Greedy collision avoidance for annotation labels.
//
// Three rows above the dot baseline. Priority-sorted (1 = most important).
// For each event we try centered-above-the-dot, then offset right, then
// offset left, on each of three rows in turn. Per-row we keep an interval
// list of [x, x+w] occupied ranges; a candidate position is rejected if it
// overlaps any placed interval on that row by more than 2px.
//
// Events that don't fit anywhere are hidden but the dot still renders. The
// label is delivered via the hover tooltip — the .ev-dot's mouseenter
// handler reads e.name from the events.json registry.
//
// Label width estimate uses Inter ~6.6px/char average at 11px size + 6px
// padding. Slightly conservative to avoid overlap; better to hide one
// extra label than to ship overprinting.
function placeLabels(events, xScale, plotLeft, plotRight) {
  const ROWS = 3;
  const ROW_GAP = 2;
  const sorted = [...events].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.year - b.year;
  });
  const intervalsPerRow = Array.from({ length: ROWS }, () => []);
  const placed = [];

  function overlaps(row, x, w) {
    const a = x, b = x + w;
    for (const [pa, pb] of intervalsPerRow[row]) {
      if (a < pb - ROW_GAP && b > pa + ROW_GAP) return true;
    }
    return false;
  }

  for (const e of sorted) {
    const x = xScale(e.year);
    const labelW = Math.max(36, e.name.length * 6.6 + 10);
    const candidates = [
      x - labelW / 2,   // centered above dot (preferred)
      x + 6,            // right of dot
      x - labelW - 6,   // left of dot
    ];
    let placedRow = -1, placedX = null;
    for (let r = 0; r < ROWS; r++) {
      for (const cx of candidates) {
        if (cx < plotLeft || cx + labelW > plotRight) continue;
        if (!overlaps(r, cx, labelW)) {
          placedRow = r; placedX = cx;
          intervalsPerRow[r].push([cx, cx + labelW]);
          break;
        }
      }
      if (placedRow !== -1) break;
    }
    placed.push({
      ...e,
      x,
      row: placedRow,
      labelX: placedX,
      labelW,
      hidden: placedRow === -1,
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
      <h2></h2>
      <div class="units"></div>
      <div class="variable-def" style="display:none"></div>
    </div>
    <div class="chart-svg-wrap">
      <svg class="chart" viewBox="0 0 960 380" preserveAspectRatio="none"></svg>
      <div class="chart-readout" style="display:none"></div>
      <div class="event-tip" style="display:none"></div>
    </div>
    <div class="chart-source-block"></div>
    <div class="chart-sparse-note" style="display:none"></div>
    <div class="chart-actions"></div>
  `;

  const titleEl = host.querySelector('h2');
  const unitsEl = host.querySelector('.units');
  const defEl = host.querySelector('.variable-def');
  const svgEl = host.querySelector('svg.chart');
  const readout = host.querySelector('.chart-readout');
  const sourceBlock = host.querySelector('.chart-source-block');
  const sparseEl = host.querySelector('.chart-sparse-note');
  const tipEl = host.querySelector('.event-tip');
  const actionsEl = host.querySelector('.chart-actions');
  const optLin = host.querySelector('.opt-lin');
  const optLog = host.querySelector('.opt-log');

  // Cite + CSV download buttons
  const cite = attachCiteButton(actionsEl, () => ({ scale: state.scale, variable: state.id, year: null, perCapita: false }));
  const csvBtn = document.createElement('button');
  csvBtn.className = 'csv-btn';
  csvBtn.textContent = 'Download CSV';
  csvBtn.addEventListener('click', () => downloadCSV());
  actionsEl.appendChild(csvBtn);

  function downloadCSV() {
    if (!state.id) return;
    const series = getSeries();
    if (!series) return;
    const meta = series.meta;
    const rows = [['year', meta.id, 'unit', 'source_type']];
    for (const [y, v] of series.pairs) rows.push([y, v, state.scale, meta.source_type]);
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${meta.id}_${state.scale}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  let state = { id: null, scale: null, scaleType: 'linear', defaultLog: false };

  optLin.addEventListener('click', () => { state.scaleType = 'linear'; optLin.classList.add('is-active'); optLog.classList.remove('is-active'); render(); });
  optLog.addEventListener('click', () => { state.scaleType = 'log';    optLog.classList.add('is-active'); optLin.classList.remove('is-active'); render(); });

  function getSeries() {
    const meta = M.byId(state.id);
    if (!meta) return null;
    if (state.scale === 'national') {
      const nt = window._data.national_timeseries[state.id];
      if (!nt) return null;
      const pairs = nt.years.map((y, i) => [y, nt.values[i]])
        .filter(([_, v]) => v != null && !Number.isNaN(v));
      return { meta, pairs };
    }
    // dept / province scale: aggregate by year (sum across units, mean for rate-like)
    const block = state.scale === 'department' ? window._data.department_data : window._data.province_data;
    const out = [];
    for (const [yStr, units] of Object.entries(block.data || {})) {
      const y = +yStr;
      const vals = [];
      for (const u of Object.values(units)) {
        if (u[state.id] != null && !Number.isNaN(u[state.id])) vals.push(+u[state.id]);
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

  function render() {
    if (!state.id) return;
    const series = getSeries();
    const meta = series && series.meta;
    if (!series || !series.pairs.length) {
      titleEl.textContent = meta ? meta.label : '';
      unitsEl.textContent = '';
      svgEl.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#94918A" font-family="Source Serif 4" font-style="italic" font-size="16">No observations at this scale.</text>';
      sourceEl.textContent = '';
      sparseEl.style.display = 'none';
      return;
    }

    const blk = meta.scales[state.scale];
    const cadence = blk.cadence;
    // Sparse tier: dots-only override, regardless of cadence
    const tier = meta.published;
    const renderingMode = (tier === 'sparse')
      ? 'dots'
      : (blk.rendering_mode || ({annual: 'line', census: 'dots_with_line', irregular: 'dots'}[cadence]));
    // ONE title (Fraunces) + ONE units caption (cadence + format only).
    // Source line below the chart carries provenance; we don't repeat it
    // in the chart head. The variable-def slot remains in the DOM for
    // future authored definitions but is not auto-populated.
    titleEl.textContent = meta.display_label || meta.label;
    unitsEl.textContent = `${unitLabel(meta)} · ${cadence === 'annual' ? 'annual series' : cadence === 'census' ? 'census-year series' : 'irregular series'}`;
    defEl.style.display = 'none';
    defEl.textContent = '';

    const W = 960, H = 380;
    // Annotation rail occupies the top 78px: 3 rows of labels (12px each,
    // 36px) + 6px gap + 32px breathing + 4px dot baseline + dot radius.
    // Plot area starts below the rail.
    const RAIL_H = 78;
    const M_TOP = RAIL_H;
    const M_RIGHT = 24;
    const M_BOTTOM = 28;
    const M_LEFT = 56;
    const plotW = W - M_LEFT - M_RIGHT;
    const plotH = H - M_TOP - M_BOTTOM;

    const xs = series.pairs.map(p => p[0]);
    const ys = series.pairs.map(p => p[1]);
    const xMin = blk.year_range[0], xMax = blk.year_range[1];
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

    // Y gridlines + ticks
    const yTicks = effectiveLog ? logTicks(yDomain) : niceTicks(yDomain[0], yDomain[1], 5);
    svg += '<g class="chart-grid">';
    for (const t of yTicks) {
      const yy = yScale(t);
      svg += `<line x1="${M_LEFT}" x2="${M_LEFT + plotW}" y1="${yy}" y2="${yy}"/>`;
    }
    svg += '</g>';
    svg += '<g class="chart-axis">';
    for (const t of yTicks) {
      const yy = yScale(t);
      svg += `<text x="${M_LEFT - 8}" y="${yy + 3}" text-anchor="end">${formatValue(t, meta.format_hint)}</text>`;
    }
    svg += '</g>';

    // X axis: decade ticks, century emphasized
    svg += '<g class="chart-axis">';
    const decadeStart = Math.ceil(xMin / 10) * 10;
    for (let yr = decadeStart; yr <= xMax; yr += 10) {
      const xx = xScale(yr);
      const isCentury = yr % 100 === 0;
      svg += `<line x1="${xx}" x2="${xx}" y1="${M_TOP + plotH}" y2="${M_TOP + plotH + (isCentury ? 6 : 3)}" stroke="${isCentury ? '#0E1A2B' : '#D9D2C2'}" stroke-width="${isCentury ? 1 : 0.75}"/>`;
      if (isCentury || (xMax - xMin <= 50 && yr % 10 === 0)) {
        svg += `<text x="${xx}" y="${M_TOP + plotH + 18}" text-anchor="middle">${yr}</text>`;
      }
    }
    svg += '</g>';

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
        const d = series.pairs.map(([x, y], i) => (i === 0 ? 'M' : 'L') + xScale(x) + ',' + yScale(y)).join(' ');
        svg += `<path class="chart-line" d="${d}" stroke="${dataColor}"/>`;
      }
      svg += drawDots();
    } else {
      svg += drawDots();
    }

    // Annotations rail. Rail spans top RAIL_H of the SVG. Dot baseline sits
    // 6px above plot; three label rows stack above the dots. NO overprinting
    // and NO lines crossing the data plot.
    const railBaselineY = M_TOP - 8;            // dot row, just above plot top
    const railRowSpacing = 13;                  // px between label rows
    const railTopRow = railBaselineY - 14;      // y of row 0 (closest to baseline)
    const railEvents = pickEvents(M.events(), [xMin, xMax]);
    const placed = placeLabels(railEvents, xScale, M_LEFT + 4, M_LEFT + plotW - 4);
    svg += `<g class="event-rail">`;
    svg += `<line class="baseline" x1="${M_LEFT}" x2="${M_LEFT + plotW}" y1="${railBaselineY}" y2="${railBaselineY}"/>`;
    for (const e of placed) {
      const fill = ({war: 'var(--event-war)', political: 'var(--event-political)', economic: 'var(--event-economic)', institutional: 'var(--event-institutional)'})[e.category] || 'var(--ink-muted)';
      svg += `<circle class="ev-dot${e.hidden ? ' is-hidden-label' : ''}" data-year="${e.year}" cx="${e.x}" cy="${railBaselineY}" r="3.5" fill="${fill}"/>`;
      if (!e.hidden) {
        const ly = railTopRow - e.row * railRowSpacing;
        const labelCx = e.labelX + e.labelW / 2;
        // Leader: short vertical from label baseline down toward dot
        svg += `<line class="ev-leader" x1="${labelCx}" x2="${labelCx}" y1="${ly + 3}" y2="${ly + 6}" stroke-opacity="0.4"/>`;
        svg += `<text class="ev-label priority-${e.priority}" x="${labelCx}" y="${ly}" text-anchor="middle">${escapeXML(e.name)}</text>`;
      }
    }
    svg += `</g>`;

    svgEl.innerHTML = svg;

    // Sparse caption
    if (series.pairs.length < 8) {
      sparseEl.style.display = 'block';
      sparseEl.textContent = `n = ${series.pairs.length} observation${series.pairs.length === 1 ? '' : 's'}; broken segments shown for gaps.`;
    } else {
      sparseEl.style.display = 'none';
    }

    // Single-line source block. Original source · coverage · compiler. The
    // brief asks for one organized line, not a three-line stack of metadata.
    const docName = meta.source_document || (meta.source_documents || [])[0] || M.sourceTypeName(meta.source_type);
    const nYrs = blk.valid_years.length;
    const yrSpan = blk.year_range[1] - blk.year_range[0] + 1;
    const covPct = Math.round((nYrs / Math.max(1, yrSpan)) * 100);
    sourceBlock.innerHTML = `
      <span class="src-original serif-i">${escapeXML(docName)}</span>
      <span class="src-sep">·</span>
      <span class="src-coverage num">${nYrs} of ${yrSpan} years (${covPct}%)</span>
      <span class="src-sep">·</span>
      <span class="src-compiler">Compiled by Maximiliano Véjares</span>
    `;

    // Default log toggle if manifest hints log AND user hasn't explicitly chosen linear
    if (state.defaultLog && state.scaleType !== 'log' && state.scaleType !== 'linear') {
      // no-op; toggle defaults set on mount
    }

    // Event hover wiring
    svgEl.querySelectorAll('.ev-dot').forEach(node => {
      node.addEventListener('mouseenter', (ev) => {
        const yr = +node.dataset.year;
        const e = M.events().find(x => x.year === yr);
        if (!e) return;
        tipEl.style.display = 'block';
        tipEl.innerHTML = `<span class="e-yr num">${e.year}</span>
          <div class="e-name">${escapeXML(e.name)}</div>
          <div class="e-desc">${escapeXML(e.short_description)}</div>
          <div class="e-cat overline" style="color: ${ ({war:'var(--event-war)',political:'var(--event-political)',economic:'var(--event-economic)',institutional:'var(--event-institutional)'})[e.category] || 'var(--ink-muted)'}">${e.category}</div>`;
        const r = svgEl.getBoundingClientRect();
        const px = (node.cx.baseVal.value / 960) * r.width + 12;
        const py = (node.cy.baseVal.value / 380) * r.height + 12;
        tipEl.style.left = Math.min(px, r.width - 240) + 'px';
        tipEl.style.top = py + 'px';
      });
      node.addEventListener('mouseleave', () => { tipEl.style.display = 'none'; });
    });
  }

  return {
    mount({ id, scale }) {
      state.id = id;
      state.scale = scale;
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

function breakSegments(pairs, gapMultiple) {
  if (pairs.length < 2) return [pairs];
  const diffs = [];
  for (let i = 1; i < pairs.length; i++) diffs.push(pairs[i][0] - pairs[i-1][0]);
  const med = diffs.slice().sort((a,b) => a-b)[Math.floor(diffs.length / 2)];
  const segs = [[pairs[0]]];
  for (let i = 1; i < pairs.length; i++) {
    if (pairs[i][0] - pairs[i-1][0] > med * gapMultiple) segs.push([pairs[i]]);
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
  const tier = meta.published === 'partial' ? ' Partial coverage; gaps shown as broken segments.'
             : meta.published === 'sparse' ? ' Sparse coverage; rendered as discrete points without a connecting line.'
             : '';
  return `${cad.charAt(0).toUpperCase() + cad.slice(1)} of ${ttl}, ${a}–${b}. Compiled from ${src}.${tier}`;
}

function escapeXML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
