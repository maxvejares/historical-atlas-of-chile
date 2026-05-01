// Control strip: scale tabs · category · variable · year slider.
// Disabled options carry inline captions (C2). Cross-scale cascade (C3)
// auto-resolves selection when the user switches scale and the current
// variable isn't available there.

import * as M from './manifest.js';
import { createYearSlider } from './year_slider.js';

const SCALES = ['national', 'department', 'province'];

export function createControlStrip(host, { onSelect }) {
  host.classList.add('control-strip');
  host.innerHTML = `
    <div class="inner">
      <div class="scale-tabs" role="tablist">
        ${SCALES.map(s => `<button data-scale="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('')}
      </div>
      <div class="dropdown" data-control="category">
        <span class="label">Category</span>
        <select></select>
      </div>
      <div class="dropdown" data-control="variable">
        <span class="label">Variable</span>
        <select></select>
      </div>
      <div data-control="slider"></div>
      <div class="cs-aux">
        <label class="toggle pc-toggle" style="display:none">
          <input type="checkbox" data-control="pc">
          <span class="toggle-label">Per 100,000</span>
        </label>
        <label class="toggle cb-toggle">
          <input type="checkbox" data-control="cb">
          <span class="toggle-label">Colorblind</span>
        </label>
      </div>
    </div>
  `;
  const tabsEl = host.querySelector('.scale-tabs');
  const catSelect = host.querySelector('[data-control="category"] select');
  const varSelect = host.querySelector('[data-control="variable"] select');
  const sliderHost = host.querySelector('[data-control="slider"]');
  const pcToggle = host.querySelector('[data-control="pc"]');
  const pcWrap = host.querySelector('.pc-toggle');
  // Wrap slider in an inner container so we can swap it for a cross-section badge.
  sliderHost.innerHTML = `
    <div class="ys-inner"></div>
    <div class="cross-section-badge" style="display:none">
      <span class="ys-label">Cross-section</span>
      <span class="ys-year num"></span>
      <span class="year-slider-cad"></span>
    </div>
  `;
  const sliderInner = sliderHost.querySelector('.ys-inner');
  const crossBadge = sliderHost.querySelector('.cross-section-badge');
  const slider = createYearSlider(sliderInner, { onChange: y => emit() });

  const state = { scale: 'national', category: null, variable: null, year: null, pillar: null, perCapita: false };

  function refreshPCToggle() {
    if (!state.variable) { pcWrap.style.display = 'none'; return; }
    const meta = M.byId(state.variable);
    const mode = meta && meta.per_capita_default;
    if (mode === 'default_pc' || mode === 'user_choice') {
      pcWrap.style.display = '';
      // Default state per mode
      if (mode === 'default_pc' && !state._pcUserSet) state.perCapita = true;
      if (mode === 'user_choice' && !state._pcUserSet) state.perCapita = false;
      pcToggle.checked = !!state.perCapita;
    } else {
      pcWrap.style.display = 'none';
      state.perCapita = false;
    }
  }

  function listForCurrentScale() {
    let list = M.listForScale(state.scale);
    if (state.pillar) list = list.filter(v => (v.pillar_tags || []).includes(state.pillar));
    return list;
  }

  function populateCategories() {
    const cats = new Map();
    for (const v of listForCurrentScale()) {
      if (!cats.has(v.category)) cats.set(v.category, []);
      cats.get(v.category).push(v);
    }
    const keys = [...cats.keys()].sort();
    catSelect.innerHTML = keys.map(c => `<option value="${c}">${c}</option>`).join('');
    if (!state.category || !cats.has(state.category)) state.category = keys[0] || null;
    if (state.category) catSelect.value = state.category;
  }

  function populateVariables() {
    const vars = listForCurrentScale().filter(v => v.category === state.category);
    // Group by tier: complete, then partial, then sparse. Within tier, alphabetical.
    const tierOrder = { complete: 0, partial: 1, sparse: 2 };
    vars.sort((a, b) => {
      const ta = tierOrder[a.published] ?? 9;
      const tb = tierOrder[b.published] ?? 9;
      if (ta !== tb) return ta - tb;
      return (a.display_label || a.label).localeCompare(b.display_label || b.label);
    });
    varSelect.innerHTML = vars.map(v => {
      let badge = '';
      if (v.published === 'partial')      badge = ' — PARTIAL';
      else if (v.published === 'sparse')  badge = ' — SPARSE';
      else if (v.commit_status === 'cross_section') badge = ' — CROSS-SECTION';
      return `<option value="${v.id}">${v.display_label || v.label}${badge}</option>`;
    }).join('');
    if (!state.variable || !vars.find(v => v.id === state.variable)) state.variable = vars[0]?.id || null;
    varSelect.value = state.variable || '';
  }

  function refreshSlider() {
    if (!state.variable) return;
    const meta = M.byId(state.variable);
    const blk = meta && meta.scales[state.scale];
    if (!blk) return;
    if (blk.valid_years && blk.valid_years.length === 1) {
      // Cross-section: hide slider DOM, show badge
      sliderInner.style.display = 'none';
      crossBadge.style.display = 'flex';
      crossBadge.querySelector('.ys-year').textContent = String(blk.valid_years[0]);
      crossBadge.querySelector('.year-slider-cad').textContent = M.cadenceLabel(state.variable, state.scale);
      state.year = blk.valid_years[0];
      return;
    }
    crossBadge.style.display = 'none';
    sliderInner.style.display = '';
    slider.mount({ id: state.variable, scale: state.scale, preferYear: state.year });
    state.year = slider.year();
  }

  function setScale(scale) {
    if (scale === state.scale) return;
    const prevVar = state.variable;
    state.scale = scale;
    tabsEl.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b.dataset.scale === scale));

    populateCategories();

    // Cross-scale cascade: try to keep the variable; otherwise jump to first available
    const meta = prevVar ? M.byId(prevVar) : null;
    if (meta && meta.scale_availability[scale]) {
      state.category = meta.category;
      catSelect.value = state.category;
      populateVariables();
      state.variable = prevVar;
      varSelect.value = prevVar;
    } else {
      populateVariables();
      if (meta && !meta.scale_availability[scale]) {
        flash(`Switched: ${meta.label} not available at ${scale} scale.`);
      }
    }
    refreshPCToggle();
    refreshSlider();
    emit();
  }

  function emit() {
    // Cross-section variables set state.year directly in refreshSlider;
    // do not let the (unmounted) slider clobber it back to null.
    const meta = state.variable ? M.byId(state.variable) : null;
    const blk = meta && meta.scales[state.scale];
    const isCross = !!(blk && blk.valid_years && blk.valid_years.length === 1);
    if (!isCross) state.year = slider.year();
    onSelect && onSelect({ ...state });
  }

  function flash(msg) {
    let el = host.querySelector('.cs-flash');
    if (!el) {
      el = document.createElement('div');
      el.className = 'cs-flash';
      el.style.cssText = 'flex-basis:100%; padding:6px 0; font-size:12px; color:var(--ink-muted); border-top:1px solid var(--hairline);';
      host.querySelector('.inner').appendChild(el);
    }
    el.textContent = msg;
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
  }

  tabsEl.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => setScale(b.dataset.scale));
  });
  catSelect.addEventListener('change', () => {
    state.category = catSelect.value;
    populateVariables();
    refreshPCToggle();
    refreshSlider();
    emit();
  });
  varSelect.addEventListener('change', () => {
    state.variable = varSelect.value;
    state._pcUserSet = false; // reset user override when variable changes
    refreshPCToggle();
    refreshPCToggle();
    refreshSlider();
    emit();
  });
  pcToggle.addEventListener('change', () => {
    state.perCapita = pcToggle.checked;
    state._pcUserSet = true;
    emit();
  });

  return {
    mount({ scale = 'national', variable = null, category = null } = {}) {
      state.scale = scale;
      state.category = category;
      state.variable = variable;
      tabsEl.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b.dataset.scale === scale));
      populateCategories();
      populateVariables();
      refreshSlider();
      emit();
    },
    setSelection({ scale, variable, pillar }) {
      const meta = variable ? M.byId(variable) : null;
      if (!meta) return;
      const targetScale = meta.scale_availability.national ? 'national' : (meta.scale_availability.province ? 'province' : 'department');
      state.scale = scale || targetScale;
      state.pillar = pillar || null;
      tabsEl.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b.dataset.scale === state.scale));
      state.category = meta.category;
      populateCategories();
      state.variable = meta.id;
      populateVariables();
      varSelect.value = meta.id;
      refreshSlider();
      emit();
    },
    setPillar(pillar) {
      state.pillar = pillar;
      populateCategories();
      populateVariables();
      refreshSlider();
      emit();
    },
    state() { return { ...state }; },
  };
}
