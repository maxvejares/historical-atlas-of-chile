// Variable-aware year slider.
//
// Range clamps to manifest.scales[scale].valid_years; ticks render one notch
// per valid year (sparser ticks for census, denser for annual — the visual
// sparsity itself communicates cadence). Drag and click snap to nearest valid.
// On variable change the slider re-mounts with the new valid_years and the
// year resets to the closest valid year to the previously-selected year.

import * as M from './manifest.js';

const CENSUS = new Set([1865, 1875, 1885, 1895, 1907, 1920, 1930, 1940, 1952, 1960, 1970, 1982, 1992]);

export function createYearSlider(host, { onChange }) {
  host.classList.add('year-slider-wrap');
  host.innerHTML = `
    <div class="year-slider-row">
      <span class="ys-label">Year</span>
      <span class="ys-year num"></span>
      <div class="year-slider-track" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="0">
        <div class="baseline"></div>
        <div class="thumb"></div>
      </div>
    </div>
    <div class="year-slider-cad"></div>
  `;
  const yearEl = host.querySelector('.ys-year');
  const trackEl = host.querySelector('.year-slider-track');
  const thumbEl = host.querySelector('.thumb');
  const cadEl = host.querySelector('.year-slider-cad');

  let years = [];
  let year = null;

  function pctFor(y) {
    if (years.length === 0) return 0;
    if (years.length === 1) return 50;
    const lo = years[0], hi = years[years.length - 1];
    if (hi === lo) return 50;
    return ((y - lo) / (hi - lo)) * 100;
  }

  function nearestYear(pct) {
    if (years.length === 0) return null;
    if (years.length === 1) return years[0];
    const lo = years[0], hi = years[years.length - 1];
    const target = lo + (pct / 100) * (hi - lo);
    let best = years[0], bestD = Math.abs(years[0] - target);
    for (const y of years) {
      const d = Math.abs(y - target);
      if (d < bestD) { best = y; bestD = d; }
    }
    return best;
  }

  function renderTicks() {
    // Remove old ticks
    trackEl.querySelectorAll('.tick').forEach(t => t.remove());
    for (const y of years) {
      const tick = document.createElement('div');
      tick.className = 'tick' + (CENSUS.has(y) ? ' census' : '');
      tick.style.left = pctFor(y) + '%';
      trackEl.insertBefore(tick, thumbEl);
    }
  }

  function setYear(y) {
    if (y === year) return;
    year = y;
    yearEl.textContent = y == null ? '—' : String(y);
    if (y == null) { thumbEl.style.display = 'none'; return; }
    thumbEl.style.display = 'block';
    thumbEl.style.left = pctFor(y) + '%';
    trackEl.setAttribute('aria-valuenow', String(y));
    onChange && onChange(year);
  }

  trackEl.addEventListener('click', e => {
    const r = trackEl.getBoundingClientRect();
    const pct = ((e.clientX - r.left) / r.width) * 100;
    const y = nearestYear(pct);
    if (y != null) setYear(y);
  });
  let dragging = false;
  trackEl.addEventListener('mousedown', e => { dragging = true; });
  window.addEventListener('mouseup', () => { dragging = false; });
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const r = trackEl.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    const y = nearestYear(pct);
    if (y != null && y !== year) setYear(y);
  });
  trackEl.addEventListener('keydown', e => {
    const i = years.indexOf(year);
    if (i < 0) return;
    if (e.key === 'ArrowLeft' && i > 0) { setYear(years[i - 1]); e.preventDefault(); }
    if (e.key === 'ArrowRight' && i < years.length - 1) { setYear(years[i + 1]); e.preventDefault(); }
  });

  return {
    mount({ id, scale, preferYear }) {
      const blk = M.scaleBlock(id, scale);
      if (!blk || !blk.valid_years.length) {
        years = []; year = null;
        renderTicks();
        thumbEl.style.display = 'none';
        yearEl.textContent = '—';
        cadEl.textContent = M.cadenceLabel(id, scale) || 'No observations at this scale';
        trackEl.setAttribute('aria-valuemin', '0'); trackEl.setAttribute('aria-valuemax', '0');
        onChange && onChange(null);
        return;
      }
      years = [...blk.valid_years].sort((a,b) => a - b);
      const target = preferYear ?? years[Math.floor(years.length / 2)];
      const snapped = M.snapYear(id, scale, target);
      renderTicks();
      cadEl.textContent = M.cadenceLabel(id, scale);
      trackEl.setAttribute('aria-valuemin', String(years[0]));
      trackEl.setAttribute('aria-valuemax', String(years[years.length - 1]));
      year = null; // force change
      setYear(snapped);
    },
    year() { return year; },
  };
}
