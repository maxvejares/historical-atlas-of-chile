// Browse navigation: three modes (Topic, Geography, Source) + search.
// Replaces the flat topic_grid.js with a hierarchical drill-down browser
// that surfaces the full 138-family dataset.

import * as M from './manifest.js';
import { TOPICS } from './topic_grid.js';

let _taxonomy = null;
let _sourceIndex = null;

// The closed list of 10 topics is the canonical taxonomy (README governance
// rule), carried on every manifest entry as `topic_category`. TOPIC_LABEL maps
// the lowercase topic id to its display label so browse, search, the control
// strip, and the landing hero all show the same names.
const TOPIC_LABEL = Object.fromEntries(TOPICS.map(t => [t.id, t.label]));
const TOPIC_DESC = Object.fromEntries(TOPICS.map(t => [t.id, t.desc]));
function topicLabel(topicId) {
  if (!topicId) return null;
  return TOPIC_LABEL[topicId] || (topicId.charAt(0).toUpperCase() + topicId.slice(1));
}

// Openable counts for a family: number of publishable variables and the sum of
// their observations across scales. taxonomy.json's n_variables/n_observations
// count every master row in the family (including non-curated variables), which
// overstates what a user can actually open (diagnostic 2.2.2). These counts are
// computed from the publishable manifest variables only.
function familyOpenable(familyId) {
  const vars = varsForFamily(familyId);
  let obs = 0;
  for (const v of vars) {
    for (const sc of Object.values(v.scales || {})) {
      if (sc && typeof sc.n_observations === 'number') obs += sc.n_observations;
    }
  }
  return { vars: vars.length, obs };
}

// Dominant topic_category of a family's publishable variables, or null.
function familyTopic(familyId) {
  const counts = {};
  for (const v of varsForFamily(familyId)) {
    const t = v.topic_category;
    if (t) counts[t] = (counts[t] || 0) + 1;
  }
  let best = null, bestN = -1;
  for (const [t, n] of Object.entries(counts)) {
    if (n > bestN) { best = t; bestN = n; }
  }
  return best;
}

async function loadTaxonomy() {
  // Bundle-aware: inline global in the atlas bundle, fetch in dev mode.
  if (!_taxonomy) _taxonomy = window.__INLINE_taxonomy !== undefined
    ? window.__INLINE_taxonomy
    : await fetch('data/taxonomy.json').then(r => r.json());
  return _taxonomy;
}

async function loadSourceIndex() {
  if (!_sourceIndex) _sourceIndex = window.__INLINE_source_index !== undefined
    ? window.__INLINE_source_index
    : await fetch('data/source_index.json').then(r => r.json());
  return _sourceIndex;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function escHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function fmtNum(n) {
  return n >= 1000 ? n.toLocaleString('en-US') : String(n);
}

// Find variables in the manifest that belong to a given family
function varsForFamily(familyId) {
  const manifest = M.manifest();
  if (!manifest) return [];
  // Match by checking if the variable's category or id relates to the family
  // The manifest doesn't store family_id directly, so we use the window._variableToFamily map
  const vToF = window._variableToFamily || {};
  return manifest.filter(v => vToF[v.id] === familyId && isPublishable(v));
}

// Curation filter — drop indicators that should not surface in browse.
// Reads fields set by the curation overlay scripts (apply_curation_NN.py).
function isPublishable(v) {
  if (!v) return false;
  // Retired and alternate-variant indicators stay reachable by URL but do
  // not appear in browse grids. (concept_duplication_resolution.md)
  const ps = v.presentation_status;
  if (ps === 'retired' || ps === 'alternate_variant') return false;
  // Indicators with whole-series unit-splice corruption are suppressed
  // until upstream reconciliation lands. (audit Finding 2.1)
  if (v.data_quality_flag === 'unit_splice_corruption') return false;
  return true;
}

// Family filter — drop auto-stem placeholder families with template labels
// (e.g. "Auto Gasto Gobierno Yyyy"). These are uncurated buckets whose data
// is reachable through proper canonical indicators or via the dataset
// download. Showing them in browse misleads the user.
function isPublishableFamily(fam) {
  if (!fam) return false;
  const id = fam.id || '';
  if (id.startsWith('auto_')) return false;
  const label = (fam.label || '').toLowerCase();
  if (label.startsWith('auto ') || label.includes('yyyy')) return false;
  return true;
}

// Year-coverage of a variable: the largest count of distinct valid years
// across its available scales. 1 (or 0) means a single-year cross-section;
// 2+ means a time series.
function variableYearCount(v) {
  let max = 0;
  for (const s of Object.values((v && v.scales) || {})) {
    const n = ((s && s.valid_years) || []).length;
    if (n > max) max = n;
  }
  return max;
}

// Search across manifest variables + taxonomy families
function searchEntries(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const manifest = M.manifest() || [];
  const results = [];

  // Search manifest variables (direct match in label/id)
  for (const v of manifest) {
    if (v.published === false) continue;
    if (!isPublishable(v)) continue;
    const label = (v.display_label || v.label || '').toLowerCase();
    const id = (v.id || '').toLowerCase();
    if (label.includes(q) || id.includes(q)) {
      results.push({ type: 'variable', item: v, score: label.startsWith(q) ? 2 : 1 });
    }
  }

  // Search taxonomy families
  if (_taxonomy) {
    for (const fam of _taxonomy.families) {
      if (!isPublishableFamily(fam)) continue;
      // Drop families with no curated/publishable variable: they search-hit but
      // dead-end on a no-variables page (diagnostic 2.5.1). The topic browse
      // already hides these; search must too.
      if (varsForFamily(fam.id).length === 0) continue;
      const label = fam.label.toLowerCase();
      const id = fam.id.toLowerCase();
      if (label.includes(q) || id.includes(q)) {
        results.push({ type: 'family', item: fam, score: label.startsWith(q) ? 2 : 1 });
      }
    }
    // Search categories
    for (const cat of _taxonomy.categories) {
      if (cat.label.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q)) {
        results.push({ type: 'category', item: cat, score: 0 });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 30);
}

// ─── Tab: Topic ────────────────────────────────────────────────────────────

function renderTopicTab(container, { onSelectVariable, typeFilter }) {
  const tax = _taxonomy;
  if (!tax) { container.innerHTML = '<p>Loading taxonomy...</p>'; return; }

  // State: which topic is expanded
  let expandedCat = null;

  // Bucket every publishable family (auto-stem placeholders and zero-curated
  // families dropped) under the dominant topic_category of its publishable
  // variables. The 10 canonical topics are the single source of truth shared
  // with the landing hero and the control strip; the legacy taxonomy.json
  // category list is no longer surfaced.
  const familiesByTopic = {};
  for (const f of tax.families) {
    if (!isPublishableFamily(f)) continue;
    if (varsForFamily(f.id).length === 0) continue;
    const t = familyTopic(f.id);
    if (!t) continue;
    (familiesByTopic[t] = familiesByTopic[t] || []).push(f);
  }

  function render() {
    const cards = TOPICS.map(topic => {
      const families = familiesByTopic[topic.id] || [];
      // Topics with no publishable family are omitted entirely.
      if (families.length === 0) return '';
      const isExpanded = expandedCat === topic.id;
      const familyList = isExpanded ? `
        <div class="cat-families">
          ${families.map(fam => {
            const o = familyOpenable(fam.id);
            return `
            <button class="fam-row" data-family="${escHTML(fam.id)}">
              <span class="fam-label">${escHTML(fam.label)}</span>
              <span class="fam-meta">${o.vars} var${o.vars === 1 ? '' : 's'} · ${fmtNum(o.obs)} obs</span>
              <span class="fam-geo">${fam.geo_levels.join(', ')}</span>
            </button>`;
          }).join('')}
        </div>` : '';

      const visibleObs = families.reduce((sum, f) => sum + familyOpenable(f.id).obs, 0);
      return `
        <div class="cat-card ${isExpanded ? 'is-expanded' : ''}" data-cat="${topic.id}">
          <button class="cat-header">
            <span class="cat-label">${escHTML(topic.label)}</span>
            <span class="cat-meta">${families.length} ${families.length === 1 ? 'family' : 'families'} · ${fmtNum(visibleObs)} observations</span>
            <span class="cat-desc">${escHTML(topic.desc)}</span>
            <span class="cat-chevron">${isExpanded ? '▾' : '▸'}</span>
          </button>
          ${familyList}
        </div>
      `;
    }).filter(Boolean).join('');

    container.innerHTML = `<div class="topic-browser">${cards}</div>`;

    // Bind events
    container.querySelectorAll('.cat-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.closest('.cat-card').dataset.cat;
        expandedCat = expandedCat === catId ? null : catId;
        render();
      });
    });

    container.querySelectorAll('.fam-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const famId = btn.dataset.family;
        showFamilyDrilldown(container, famId, { onSelectVariable, onBack: render, typeFilter });
      });
    });
  }

  render();
}

function showFamilyDrilldown(container, familyId, { onSelectVariable, onBack, typeFilter }) {
  const allVars = varsForFamily(familyId);
  const vars = allVars.filter(typeFilter || (() => true));
  const famInfo = _taxonomy?.families.find(f => f.id === familyId);
  const label = famInfo ? famInfo.label : familyId;

  if (vars.length === 0) {
    const filteredOut = allVars.length > 0;
    if (!filteredOut) {
      // Empty family (zero publishable variables). These are unreachable through
      // the topic grid and search (both already filter them out), so the old
      // "no curated variables yet" page was dead code (UX2 C.1). If a family
      // page is somehow requested for an empty family, redirect to the topic
      // landing rather than render the dead end. Do NOT re-expose empties.
      onBack();
      return;
    }
    // Reachable case: all variables hidden by the current data-type filter.
    container.innerHTML = `
      <div class="family-drilldown">
        <button class="back-btn">&larr; Back to topics</button>
        <h3 class="fd-title">${escHTML(label)}</h3>
        <p class="fd-info">No variables in this family match the current data-type filter. Switch the filter above to see them.</p>
        ${famInfo ? `<p class="fd-meta">Units: ${famInfo.units} · Source: ${famInfo.source_type} · Levels: ${famInfo.geo_levels.join(', ')}</p>` : ''}
      </div>
    `;
  } else {
    // Show variable list
    const varList = vars.map(v => {
      const scales = Object.entries(v.scale_availability || {}).filter(([_, ok]) => ok).map(([s]) => s);
      const tb = M.tierBadge(v.published);
      const tierHTML = tb ? `<span class="variable-flag vr-tier ${tb.cls}">${tb.label}</span>` : '';
      // Research-construct chip (UX2 Addendum 2c): a landholding-derived
      // indicator kept browsable for transparency, not a general public series.
      const researchHTML = v.catalog_visibility === 'research_only'
        ? `<span class="variable-flag vr-tier is-soft">RESEARCH CONSTRUCT</span>` : '';
      return `
        <button class="var-row" data-var="${escHTML(v.id)}">
          <span class="vr-label">${escHTML(v.display_label || v.label)}</span>
          <span class="vr-scales">${scales.join(', ')}</span>
          ${tierHTML}
          ${researchHTML}
          ${v.curated_subtitle ? `<span class="vr-sub">${escHTML(v.curated_subtitle)}</span>` : ''}
        </button>
      `;
    }).join('');

    container.innerHTML = `
      <div class="family-drilldown">
        <button class="back-btn">&larr; Back to topics</button>
        <h3 class="fd-title">${escHTML(label)}</h3>
        ${famInfo ? `<p class="fd-meta">${famInfo.n_variables} variables · ${fmtNum(famInfo.n_observations)} observations · ${famInfo.geo_levels.join(', ')}</p>` : ''}
        <div class="fd-vars">${varList}</div>
      </div>
    `;
  }

  container.querySelector('.back-btn').addEventListener('click', onBack);
  container.querySelectorAll('.var-row').forEach(btn => {
    btn.addEventListener('click', () => onSelectVariable(btn.dataset.var));
  });
}

// ─── Tab: Geography ────���───────────────────────────────────────────────────

function renderGeoTab(container, { onSelectVariable, typeFilter }) {
  const tf = typeFilter || (() => true);
  const manifest = M.manifest() || [];

  // Count variables available at each level
  const levels = ['national', 'province', 'department'];
  const counts = {};
  for (const lvl of levels) {
    counts[lvl] = manifest.filter(v => v.published !== false && v.scale_availability[lvl] && tf(v) && isPublishable(v)).length;
  }

  let selectedLevel = null;

  function render() {
    if (!selectedLevel) {
      container.innerHTML = `
        <div class="geo-browser">
          <p class="geo-intro">Browse variables by the geographic level at which they are available.</p>
          ${levels.map(lvl => `
            <button class="geo-level-btn" data-level="${lvl}">
              <span class="gl-label">${lvl.charAt(0).toUpperCase() + lvl.slice(1)}</span>
              <span class="gl-count">${counts[lvl]} variables</span>
              <span class="gl-desc">${{national: 'Country-level time series', province: 'Data at the province level', department: 'Data at the department level'}[lvl]}</span>
            </button>
          `).join('')}
        </div>
      `;
      container.querySelectorAll('.geo-level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedLevel = btn.dataset.level;
          render();
        });
      });
    } else {
      // Show all variables at this level, grouped by category
      const vars = manifest.filter(v => v.published !== false && v.scale_availability[selectedLevel] && tf(v) && isPublishable(v));
      const catMap = new Map();
      for (const v of vars) {
        const cat = topicLabel(v.topic_category) || v.category || 'Other';
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat).push(v);
      }

      const groups = [...catMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      const html = groups.map(([cat, vs]) => `
        <div class="geo-group">
          <h4 class="geo-group-label">${escHTML(cat)} <span class="geo-group-count">(${vs.length})</span></h4>
          ${vs.map(v => `
            <button class="var-row" data-var="${escHTML(v.id)}">
              <span class="vr-label">${escHTML(v.display_label || v.label)}</span>
            </button>
          `).join('')}
        </div>
      `).join('');

      container.innerHTML = `
        <div class="geo-drilldown">
          <button class="back-btn">&larr; Back to levels</button>
          <h3 class="fd-title">${selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)} scale</h3>
          <p class="fd-meta">${vars.length} variables available</p>
          ${html}
        </div>
      `;

      container.querySelector('.back-btn').addEventListener('click', () => {
        selectedLevel = null;
        render();
      });
      container.querySelectorAll('.var-row').forEach(btn => {
        btn.addEventListener('click', () => onSelectVariable(btn.dataset.var));
      });
    }
  }

  render();
}

// ─── Tab: Source ───────────────────────────────────────────────────────────

function renderSourceTab(container, { onSelectVariable }) {
  if (!_sourceIndex) { container.innerHTML = '<p>Loading source index...</p>'; return; }

  let expandedGroup = null;

  function render() {
    const groups = _sourceIndex.groups.map(g => {
      const isExpanded = expandedGroup === g.id;
      const docs = isExpanded
        ? _sourceIndex.documents.filter(d => d.group === g.id).slice(0, 20)
        : [];
      const docList = isExpanded ? `
        <div class="src-docs">
          ${docs.map(d => `
            <div class="src-doc-row">
              <span class="sd-name">${escHTML(d.document.slice(0, 80))}</span>
              <span class="sd-meta">${d.n_tables} tables · ${fmtNum(d.n_rows)} rows${d.year_range ? ` · ${d.year_range[0]}–${d.year_range[1]}` : ''}</span>
            </div>
          `).join('')}
          ${_sourceIndex.documents.filter(d => d.group === g.id).length > 20 ? '<p class="sd-more">...and more in the downloadable dataset</p>' : ''}
        </div>` : '';

      return `
        <div class="src-group ${isExpanded ? 'is-expanded' : ''}" data-group="${escHTML(g.id)}">
          <button class="src-header">
            <span class="sg-label">${escHTML(g.id)}</span>
            <span class="sg-meta">${g.n_documents} documents · ${fmtNum(g.n_rows)} rows</span>
            <span class="cat-chevron">${isExpanded ? '▾' : '▸'}</span>
          </button>
          ${docList}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="source-browser">
        <p class="src-intro">Browse data by original source document. The database draws on ${_sourceIndex.documents.length} distinct source documents.</p>
        ${groups}
      </div>
    `;

    container.querySelectorAll('.src-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.closest('.src-group').dataset.group;
        expandedGroup = expandedGroup === gid ? null : gid;
        render();
      });
    });
  }

  render();
}

// ─── Search ────��───────────────────────────────────────────────────────────

function renderSearch(container, { onSelectVariable, typeFilter }) {
  const tf = typeFilter || (() => true);
  let timeout = null;

  container.innerHTML = `
    <div class="search-panel">
      <input type="search" class="search-input" placeholder="Search variables, families, topics..." autocomplete="off">
      <div class="search-results"></div>
    </div>
  `;

  const input = container.querySelector('.search-input');
  const resultsEl = container.querySelector('.search-results');

  function doSearch() {
    const q = input.value;
    const results = searchEntries(q).filter(r => r.type !== 'variable' || tf(r.item));
    if (!results.length && q.length > 0) {
      resultsEl.innerHTML = '<p class="sr-empty">No results found.</p>';
      return;
    }
    if (!q) { resultsEl.innerHTML = ''; return; }

    resultsEl.innerHTML = results.map(r => {
      if (r.type === 'variable') {
        const v = r.item;
        return `<button class="sr-row" data-var="${escHTML(v.id)}">
          <span class="sr-type">Variable</span>
          <span class="sr-label">${escHTML(v.display_label || v.label)}</span>
          <span class="sr-cat">${escHTML(topicLabel(v.topic_category) || v.category || '')}</span>
        </button>`;
      } else if (r.type === 'family') {
        return `<button class="sr-row sr-family" data-family="${escHTML(r.item.id)}">
          <span class="sr-type">Family</span>
          <span class="sr-label">${escHTML(r.item.label)}</span>
          <span class="sr-cat">${r.item.n_observations} obs</span>
        </button>`;
      } else {
        return `<button class="sr-row sr-cat-row" data-cat="${escHTML(r.item.id)}">
          <span class="sr-type">Category</span>
          <span class="sr-label">${escHTML(r.item.label)}</span>
        </button>`;
      }
    }).join('');

    resultsEl.querySelectorAll('.sr-row[data-var]').forEach(btn => {
      btn.addEventListener('click', () => onSelectVariable(btn.dataset.var));
    });
  }

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(doSearch, 200);
  });
}

// ─── Main export ─────��─────────────────────────────────────────────────────

export async function createBrowseNav(host, { onSelect }) {
  // Load data in parallel
  const [tax, src] = await Promise.all([loadTaxonomy(), loadSourceIndex()]);

  host.classList.add('browse-nav-section');

  const tabs = ['Topics', 'Geography', 'Sources', 'Search'];
  let activeTab = 'Topics';

  // Data-type filter: separate time-series variables (2+ years) from
  // single-year cross-sections so browsing one never surfaces the other.
  let dataTypeFilter = 'all'; // 'all' | 'series' | 'cross'
  const TYPE_OPTIONS = [['all', 'All data'], ['series', 'Time series'], ['cross', 'Cross-section']];
  function typeFilter(v) {
    if (dataTypeFilter === 'all') return true;
    const n = variableYearCount(v);
    return dataTypeFilter === 'cross' ? n <= 1 : n >= 2;
  }

  function onSelectVariable(varId) {
    if (!varId) return;
    const meta = M.byId(varId);
    if (!meta) return;
    onSelect && onSelect({ variable: varId });
  }

  function render() {
    host.innerHTML = `
      <div class="browse-nav">
        <div class="bn-tabs" role="tablist">
          ${tabs.map(t => `<button class="bn-tab ${t === activeTab ? 'is-active' : ''}" data-tab="${t}">${t}</button>`).join('')}
        </div>
        <div class="bn-filter" role="tablist">
          ${TYPE_OPTIONS.map(([k, lbl]) => `<button class="bn-type ${k === dataTypeFilter ? 'is-active' : ''}" data-type="${k}">${lbl}</button>`).join('')}
        </div>
        <div class="bn-panel"></div>
      </div>
    `;

    const panel = host.querySelector('.bn-panel');

    // Render active tab content
    switch (activeTab) {
      case 'Topics':
        renderTopicTab(panel, { onSelectVariable, typeFilter });
        break;
      case 'Geography':
        renderGeoTab(panel, { onSelectVariable, typeFilter });
        break;
      case 'Sources':
        renderSourceTab(panel, { onSelectVariable });
        break;
      case 'Search':
        renderSearch(panel, { onSelectVariable, typeFilter });
        break;
    }

    // Bind data-type filter clicks
    host.querySelectorAll('.bn-type').forEach(btn => {
      btn.addEventListener('click', () => {
        dataTypeFilter = btn.dataset.type;
        render();
      });
    });

    // Bind tab clicks
    host.querySelectorAll('.bn-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        render();
      });
    });
  }

  render();
}
