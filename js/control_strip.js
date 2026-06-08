// Control strip: scale tabs · category · variable · year slider.
// Disabled options carry inline captions (C2). Cross-scale cascade (C3)
// auto-resolves selection when the user switches scale and the current
// variable isn't available there.

import * as M from './manifest.js';
import { createYearSlider } from './year_slider.js';

const SCALES = ['national', 'department', 'province', 'commune'];

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
      <div class="dropdown var-dropdown" data-control="variable">
        <span class="label">Variable</span>
        <button type="button" class="var-trigger" aria-haspopup="listbox" aria-expanded="false">
          <span class="var-trigger-label"></span>
          <span class="var-trigger-badge"></span>
        </button>
        <ul class="var-listbox" role="listbox" tabindex="-1" hidden></ul>
      </div>
      <div data-control="slider"></div>
      <div class="cs-aux">
        <label class="toggle pc-toggle" style="display:none">
          <input type="checkbox" data-control="pc">
          <span class="toggle-label">Per 100,000</span>
        </label>
      </div>
    </div>
  `;
  const tabsEl = host.querySelector('.scale-tabs');
  const catSelect = host.querySelector('[data-control="category"] select');
  const varDropdown = host.querySelector('[data-control="variable"]');
  const varTrigger = varDropdown.querySelector('.var-trigger');
  const varTriggerLabel = varDropdown.querySelector('.var-trigger-label');
  const varTriggerBadge = varDropdown.querySelector('.var-trigger-badge');
  const varListbox = varDropdown.querySelector('.var-listbox');
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

  const state = { scale: 'national', category: null, variable: null, year: null, pillar: null, perCapita: false,
    // 4a year-default machinery. _lastSliderVar tracks the variable the slider
    // was last mounted for, so we can tell an indicator change (year -> first
    // valid year) from a scale-only change (keep the current year). _explicitYear
    // is set when a deep link / citation supplied an explicit &year=; it is
    // honored once if valid, then consumed.
    _lastSliderVar: null, _explicitYear: false };

  function refreshScaleTabs() {
    // Hide scale tabs when variable is only available at one level
    if (!state.variable) { tabsEl.style.display = ''; return; }
    const meta = M.byId(state.variable);
    if (!meta) { tabsEl.style.display = ''; return; }
    const available = SCALES.filter(s => meta.scale_availability[s]);
    if (available.length <= 1) {
      tabsEl.style.display = 'none';
    } else {
      tabsEl.style.display = '';
      // Disable tabs for unavailable scales
      tabsEl.querySelectorAll('button').forEach(b => {
        const avail = meta.scale_availability[b.dataset.scale];
        b.disabled = !avail;
        b.style.opacity = avail ? '' : '0.35';
        b.style.cursor = avail ? '' : 'default';
      });
    }
  }

  function refreshPCToggle() {
    if (!state.variable) { pcWrap.style.display = 'none'; return; }
    const meta = M.byId(state.variable);
    const mode = meta && meta.per_capita_default;
    // Per-capita doctrine (Addendum 5): the toggle renders wherever per-capita
    // is meaningful — i.e. for every mode except 'not_applicable' (which is
    // reserved for rates, shares, prices, indices, and presence indicators).
    // 'default_pc' opens on; 'user_choice' and 'default_raw' open off.
    if (mode && mode !== 'not_applicable') {
      pcWrap.style.display = '';
      if (!state._pcUserSet) state.perCapita = (mode === 'default_pc');
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
      const t = v.topic_category || v.category;
      if (!cats.has(t)) cats.set(t, []);
      cats.get(t).push(v);
    }
    const keys = [...cats.keys()].sort();
    const topicLabel = c => (c ? c.charAt(0).toUpperCase() + c.slice(1) : c);
    catSelect.innerHTML = keys.map(c => `<option value="${c}">${topicLabel(c)}</option>`).join('');
    if (!state.category || !cats.has(state.category)) state.category = keys[0] || null;
    if (state.category) catSelect.value = state.category;
  }

  // Custom variable dropdown. Native <select> can't carry separate styled
  // badge spans inside <option>, so coverage tiers were concatenated as
  // ` — PARTIAL` / ` — SPARSE` strings into the option label (B1). The
  // custom listbox below renders each row as label + badge so the badge
  // can be styled independently of the variable name.
  let varOptions = [];
  let varHighlight = -1;
  // Picker grouping: the snapshot ("Single year") group is collapsible. Default
  // expanded so nothing is hidden on first view; the grouping itself is the
  // proactive signal.
  let snapshotCollapsed = false;

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function badgeForOption(v) {
    // User-facing COVERAGE signal (not the internal quality flags, which stay
    // hidden): tell the reader before they click that an indicator is a
    // single-year snapshot or has thin coverage AT THE CURRENT SCALE. The
    // manifest already records this per scale (scales[scale].valid_years and
    // published_by_scale); we only render what it carries.
    return coverageBadge(v, state.scale);
  }

  function coverageBadge(v, scale) {
    const blk = v.scales && v.scales[scale];
    if (blk && Array.isArray(blk.valid_years) && blk.valid_years.length === 1) {
      return { tier: 'snapshot', label: `${blk.valid_years[0]} only` };
    }
    const pub = (v.published_by_scale && v.published_by_scale[scale]) || v.published;
    if (pub === 'cross_section') return { tier: 'snapshot', label: 'single year' };
    if (pub === 'sparse') return { tier: 'sparse', label: 'sparse' };
    if (pub === 'partial') return { tier: 'partial', label: 'partial' };
    return null;
  }

  // One option row. `i` is the index into varOptions (so keyboard highlight and
  // selection stay correct even with group headers interleaved in the DOM).
  function optionRowHTML(v, i) {
    const name = escapeHTML(v.display_label || v.label);
    const badge = badgeForOption(v);
    const badgeHTML = badge
      ? `<span class="opt-badge tier-${badge.tier}">${badge.label}</span>`
      : '';
    // Proactive temporal cue for sparse rows: spell out the actual observed
    // years so the reader sees a thin 2–3 point series BEFORE clicking. The
    // existing per-scale coverage badge stays in place alongside this.
    let yearsHTML = '';
    if (M.classifyTemporal(v, state.scale) === 'sparse') {
      const ys = M.yearsForScale(v, state.scale);
      yearsHTML = `<span class="opt-years">${ys.length} years: ${ys.join(', ')}</span>`;
    }
    const sel = v.id === state.variable ? ' aria-selected="true"' : '';
    const hl  = i === varHighlight ? ' is-highlighted' : '';
    return `<li role="option" class="var-option${hl}" data-id="${escapeHTML(v.id)}"${sel}>
      <span class="opt-label">${name}</span>${badgeHTML}${yearsHTML}
    </li>`;
  }

  // Render the picker as two mode groups, classified with classifyTemporal at
  // the CURRENT scale: a "Time series" group first (series + sparse), then a
  // collapsible "Single year" group (snapshots). varOptions is pre-sorted
  // series-then-snapshot in populateVariables, so the indices are contiguous
  // and keyboard order matches what the eye sees. Re-runs on every scale change
  // (setScale -> populateVariables), so an indicator moves groups live.
  function renderVarListbox() {
    const series = [], snaps = [];
    varOptions.forEach((v, i) => {
      (M.classifyTemporal(v, state.scale) === 'snapshot' ? snaps : series).push({ v, i });
    });
    let html = '';
    if (series.length) {
      html += `<li class="var-group-head" role="presentation">Time series</li>`;
      html += series.map(({ v, i }) => optionRowHTML(v, i)).join('');
    }
    if (snaps.length) {
      html += `<li class="var-group-head var-group-toggle" role="presentation" data-toggle="snapshot" aria-expanded="${!snapshotCollapsed}">`
        + `<span class="vg-label">Single year</span> <span class="vg-count">${snaps.length}</span>`
        + `<span class="vg-chev">${snapshotCollapsed ? '▸' : '▾'}</span></li>`;
      if (!snapshotCollapsed) html += snaps.map(({ v, i }) => optionRowHTML(v, i)).join('');
    }
    if (!series.length && !snaps.length) {
      html = `<li class="var-group-head" role="presentation">No indicators at this scale</li>`;
    }
    varListbox.innerHTML = html;
  }

  function isNavigable(i) {
    const v = varOptions[i];
    if (!v) return false;
    // A collapsed snapshot row is not keyboard-reachable until expanded.
    if (snapshotCollapsed && M.classifyTemporal(v, state.scale) === 'snapshot') return false;
    return true;
  }

  function renderVarTrigger() {
    const cur = varOptions.find(v => v.id === state.variable);
    if (!cur) { varTriggerLabel.textContent = ''; varTriggerBadge.style.display = 'none'; varTriggerBadge.textContent = ''; return; }
    varTriggerLabel.textContent = cur.display_label || cur.label;
    // On-selection coverage note (e.g. "1952 only"): the same per-scale signal
    // the picker rows carry, so the reader sees it after choosing too.
    const b = coverageBadge(cur, state.scale);
    if (b) {
      varTriggerBadge.textContent = b.label;
      varTriggerBadge.className = `var-trigger-badge opt-badge tier-${b.tier}`;
      varTriggerBadge.style.display = '';
    } else {
      varTriggerBadge.style.display = 'none';
      varTriggerBadge.textContent = '';
    }
  }

  function setVarOpen(open) {
    if (open) {
      varListbox.hidden = false;
      varTrigger.setAttribute('aria-expanded', 'true');
      varHighlight = Math.max(0, varOptions.findIndex(v => v.id === state.variable));
      // If the selected indicator is a snapshot, expand the Single-year group
      // so the highlighted row is visible rather than hidden behind the collapse.
      const cur = varOptions[varHighlight];
      if (cur && M.classifyTemporal(cur, state.scale) === 'snapshot') snapshotCollapsed = false;
      renderVarListbox();
      // scroll the highlighted row into view
      const node = varListbox.querySelector('.is-highlighted');
      if (node) node.scrollIntoView({ block: 'nearest' });
    } else {
      varListbox.hidden = true;
      varTrigger.setAttribute('aria-expanded', 'false');
    }
  }

  function selectVarById(id) {
    if (!varOptions.find(v => v.id === id)) return;
    state.variable = id;
    state._pcUserSet = false;
    renderVarTrigger();
    renderVarListbox();
    setVarOpen(false);
    refreshScaleTabs();
    refreshPCToggle();
    refreshSlider();
    emit();
  }

  function moveHighlight(delta) {
    if (!varOptions.length) return;
    if (varListbox.hidden) { setVarOpen(true); return; }
    let i = varHighlight;
    for (let k = 0; k < varOptions.length; k++) {
      i = (i + delta + varOptions.length) % varOptions.length;
      if (isNavigable(i)) break;
    }
    varHighlight = i;
    renderVarListbox();
    const node = varListbox.querySelector('.is-highlighted');
    if (node) node.scrollIntoView({ block: 'nearest' });
  }

  varTrigger.addEventListener('click', e => {
    e.stopPropagation();
    setVarOpen(varListbox.hidden);
  });
  varTrigger.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { moveHighlight(1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { moveHighlight(-1); e.preventDefault(); }
    else if (e.key === 'Enter' || e.key === ' ') {
      if (varListbox.hidden) { setVarOpen(true); }
      else if (varHighlight >= 0) { selectVarById(varOptions[varHighlight].id); }
      e.preventDefault();
    } else if (e.key === 'Escape' && !varListbox.hidden) {
      setVarOpen(false); e.preventDefault();
    }
  });
  varListbox.addEventListener('click', e => {
    // Clicking the "Single year" header toggles the collapsible group.
    const tg = e.target.closest('.var-group-toggle');
    if (tg) { snapshotCollapsed = !snapshotCollapsed; renderVarListbox(); return; }
    const li = e.target.closest('.var-option');
    if (!li) return;
    selectVarById(li.dataset.id);
  });
  varListbox.addEventListener('mousemove', e => {
    const li = e.target.closest('.var-option');
    if (!li) return;
    // Index by id, not DOM position — group-header <li>s are interleaved.
    const i = varOptions.findIndex(v => v.id === li.dataset.id);
    if (i >= 0 && i !== varHighlight) {
      varHighlight = i;
      renderVarListbox();
    }
  });
  document.addEventListener('click', e => {
    if (varListbox.hidden) return;
    if (varDropdown.contains(e.target)) return;
    setVarOpen(false);
  });

  function populateVariables() {
    const vars = listForCurrentScale().filter(v => (v.topic_category || v.category) === state.category);
    // Sort by mode (time series first, single-year snapshots last), then
    // alphabetically within each group — matches the two-group render order so
    // keyboard navigation tracks the visible order. Reclassified at the current
    // scale, so a scale change re-sorts the list (an indicator can move groups).
    const snapRank = v => (M.classifyTemporal(v, state.scale) === 'snapshot' ? 1 : 0);
    vars.sort((a, b) =>
      (snapRank(a) - snapRank(b)) ||
      (a.display_label || a.label).localeCompare(b.display_label || b.label));
    varOptions = vars;
    if (!state.variable || !vars.find(v => v.id === state.variable)) {
      state.variable = vars[0]?.id || null;
    }
    renderVarTrigger();
    renderVarListbox();
  }

  function refreshSlider() {
    if (!state.variable) return;
    const meta = M.byId(state.variable);
    const blk = meta && meta.scales[state.scale];
    if (!blk) return;
    // National scale renders a chart over the full year range; the slider
    // has no chart-relevant function. Hide the entire slider host.
    if (state.scale === 'national') {
      sliderHost.style.display = 'none';
      state.year = null;
      return;
    }
    sliderHost.style.display = '';
    if (blk.valid_years && blk.valid_years.length === 1) {
      // Cross-section: hide slider DOM, show badge
      sliderInner.style.display = 'none';
      crossBadge.style.display = 'flex';
      crossBadge.querySelector('.ys-year').textContent = String(blk.valid_years[0]);
      crossBadge.querySelector('.year-slider-cad').textContent = M.cadenceLabel(state.variable, state.scale);
      state.year = blk.valid_years[0];
      state._lastSliderVar = state.variable;
      state._explicitYear = false;
      return;
    }
    crossBadge.style.display = 'none';
    sliderInner.style.display = '';
    // 4a: choose the year the slider should open on.
    //   1. a valid explicit deep-link / citation year wins (citation persistence);
    //   2. otherwise, on an indicator change (or when no year is set yet) open on
    //      the FIRST valid year — not the slider's median default, which the user
    //      perceived as a "random year";
    //   3. on a scale-only change keep the current year (it is still meaningful).
    const vy = blk.valid_years || [];
    const varChanged = state._lastSliderVar !== state.variable;
    let preferYear;
    if (state._explicitYear && state.year != null && vy.includes(state.year)) {
      preferYear = state.year;
    } else if (varChanged || state.year == null) {
      preferYear = vy[0];
    } else {
      preferYear = state.year;
    }
    state._lastSliderVar = state.variable;
    state._explicitYear = false;
    slider.mount({ id: state.variable, scale: state.scale, preferYear });
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
      state.category = meta.topic_category || meta.category;
      catSelect.value = state.category;
      populateVariables();
      state.variable = prevVar;
      renderVarTrigger();
      renderVarListbox();
    } else {
      populateVariables();
      if (meta && !meta.scale_availability[scale]) {
        flash(`Switched: ${meta.label} not available at ${scale} scale.`);
      }
    }
    refreshScaleTabs();
    refreshPCToggle();
    refreshSlider();
    emit();
  }

  function emit() {
    // Cross-section variables set state.year directly in refreshSlider;
    // do not let the (unmounted) slider clobber it back to null.
    // National scale has no slider mounted; state.year stays null.
    const meta = state.variable ? M.byId(state.variable) : null;
    const blk = meta && meta.scales[state.scale];
    const isCross = !!(blk && blk.valid_years && blk.valid_years.length === 1);
    if (!isCross && state.scale !== 'national') state.year = slider.year();
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
  pcToggle.addEventListener('change', () => {
    state.perCapita = pcToggle.checked;
    state._pcUserSet = true;
    emit();
  });

  return {
    mount({ scale = 'national', variable = null, category = null, year = null, perCapita = null } = {}) {
      state.scale = scale;
      state.category = category;
      state.variable = variable;
      // A deep link / citation may carry per-capita intent (#...&pc=1, or a
      // retired per-capita variant that resolved to its count sibling). Honor
      // it as a user-set choice so refreshPCToggle does not overwrite it with
      // the indicator's default. (UX2 / Addendum 5e citation persistence.)
      if (perCapita != null) { state.perCapita = !!perCapita; state._pcUserSet = true; }
      else { state._pcUserSet = false; }
      // A deep link / pasted citation may carry an explicit year; stash it so
      // refreshSlider honors it once (if valid) before defaulting to the first
      // valid year (4a). _lastSliderVar starts null so the first mount counts as
      // an indicator change.
      state.year = year;
      state._explicitYear = (year != null);
      state._lastSliderVar = null;
      tabsEl.querySelectorAll('button').forEach(b => b.classList.toggle('is-active', b.dataset.scale === scale));
      populateCategories();
      populateVariables();
      refreshScaleTabs();
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
      state.category = meta.topic_category || meta.category;
      populateCategories();
      state.variable = meta.id;
      populateVariables();
      refreshScaleTabs();
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
