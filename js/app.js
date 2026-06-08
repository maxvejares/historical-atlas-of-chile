import * as M from './manifest.js';
import { createHeader } from './header.js';
import { createHero } from './hero.js';
import { createTopicGrid } from './topic_grid.js';
import { createBrowseNav } from './browse_nav.js';
import { createControlStrip } from './control_strip.js';
import { createChart } from './chart.js';
import { createMapView } from './map_view.js';
import { createFooter } from './footer.js';
import { createSections } from './sections.js';

// Orchestrator. Mount order: header, hero, topic grid, control strip,
// chart/map, footer. Manifest must load first.


function readHashState() {
  const p = new URLSearchParams(location.hash.slice(1));
  // Comparison deep links carry `variables=a,b,c` (UX2 B.4); the singular
  // `variable=` is still accepted for single-series links and citations.
  const list = (p.get('variables') || '').split(',').map(s => s.trim()).filter(Boolean);
  const variable = p.get('variable') || list[0] || null;
  return {
    scale:    p.get('scale'),
    variable,
    variables: list,
    year:     p.get('year') ? +p.get('year') : null,
    pc:       p.get('pc') === '1',
  };
}

function writeHashState(s) {
  const p = new URLSearchParams();
  if (s.scale)    p.set('scale', s.scale);
  // Serialize a comparison set as `variables=`; a single series as `variable=`.
  if (Array.isArray(s.variables) && s.variables.length > 1) {
    p.set('variables', s.variables.join(','));
  } else if (s.variable) {
    p.set('variable', s.variable);
  }
  if (s.year != null) p.set('year', String(s.year));
  if (s.perCapita) p.set('pc', '1');
  const newHash = '#' + p.toString();
  if (location.hash !== newHash) history.replaceState(null, '', newHash);
}

// Does this manifest entry express a per-capita identity (so a deep link to it
// should land on its count sibling with the toggle ON)? Used for Addendum-5
// citation persistence. Checks id stem and label/unit tokens.
function isPerCapitaVariant(meta) {
  if (!meta) return false;
  const id = (meta.id || '').toLowerCase();
  if (/_pc$|_per_capita|_per_1000|_rate_per/.test(id)) return true;
  const txt = `${meta.display_label || ''} ${meta.label || ''} ${meta.display_unit || ''} ${meta.unit || ''}`.toLowerCase();
  return /per capita|per 1,000|per 1000|per 100,000|per 100\b/.test(txt);
}

async function _atlasInit() {
  await M.loadManifest();

  // Tie page title + meta description to the canonical platform window
  // (manifest_globals.json, M024) so the strings stay in sync with the data
  // layer when the window changes. Falls back to the manifest scope shim if
  // manifest_globals.json is absent.
  const sc = M.scope();
  if (sc) {
    const span = `${sc.start}–${sc.end}`;
    document.title = `Historical Atlas of Chile, ${span}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        'content',
        `A historical archive of Chilean economic, political, and social data, ${span}. ` +
        `A century and a half of records compiled from over a dozen sources, free to browse, ` +
        `compare, visualize, and download.`
      );
    }
  }

  const root = document.getElementById('root');
  root.innerHTML = `
    <header id="hdr"></header>
    <section id="hero-section"></section>
    <div class="ornamental-rule" aria-hidden="true">
      <span class="orn-line"></span>
      <span class="orn-glyph">·&nbsp;·&nbsp;·</span>
      <span class="orn-line"></span>
    </div>
    <section id="topic-section"></section>
    <div class="browse-heading">
      <h2 class="bh-title">Explore the full dataset</h2>
      <p class="bh-sub">Browse 135 indicator families across 14 thematic categories, three geographic levels, and 156 source documents.</p>
    </div>
    <section id="browse-section"></section>
    <section id="control-section"></section>
    <section id="canvas-section" class="canvas">
      <div id="chart-host" style="display:none"></div>
      <div id="map-host" style="display:none"></div>
      <div id="empty-host" class="canvas-empty">Pick a topic above to begin, or use the controls.</div>
    </section>
    <div id="static-sections-host"></div>
    <footer id="ftr"></footer>
  `;
  const sections = createSections(document.getElementById('static-sections-host'));
  createHeader(document.getElementById('hdr'));

  // Smooth-scroll for in-page nav anchors. Wired AFTER header/sections render
  // so the link nodes exist.
  document.querySelectorAll('.site-header nav a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id === 'topics' ? document.getElementById('topic-section')
                                     : document.getElementById(id);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  const chart = createChart(document.getElementById('chart-host'));
  const mapView = createMapView(document.getElementById('map-host'));

  function showFor(scale) {
    document.getElementById('empty-host').style.display = 'none';
    if (scale === 'national') {
      document.getElementById('chart-host').style.display = 'block';
      document.getElementById('map-host').style.display = 'none';
    } else {
      document.getElementById('chart-host').style.display = 'none';
      document.getElementById('map-host').style.display = 'block';
    }
  }

  // A comparison set restored from a deep link (UX2 B.4). Consumed by the next
  // control-strip emit so the chart mounts with the overlay variables; any
  // later control-strip interaction resets the comparison to a single series.
  let pendingCompareIds = [];

  const strip = createControlStrip(document.getElementById('control-section'), {
    onSelect: (state) => {
      if (!state.variable) return;
      const compareIds = (state.scale === 'national') ? pendingCompareIds : [];
      pendingCompareIds = [];
      const variables = compareIds.length ? [state.variable, ...compareIds] : null;
      writeHashState({ ...state, variables });
      showFor(state.scale);
      if (state.scale === 'national') {
        chart.mount({ id: state.variable, scale: 'national', perCapita: state.perCapita, compareIds });
      } else {
        mapView.render({ scale: state.scale, variable: state.variable, year: state.year, perCapita: state.perCapita });
      }
      // Filter the sources section to the active variable so users can see
      // which sources back the chart/map they're currently viewing.
      sections.setActiveVariable(state.variable);
    },
  });

  createHero(document.getElementById('hero-section'));

  createTopicGrid(document.getElementById('topic-section'), {
    onSelect: ({ topic, variable }) => {
      if (!variable) return;
      const meta = M.byId(variable);
      const scale = meta.scale_availability.national ? 'national' : (meta.scale_availability.department ? 'department' : (meta.scale_availability.province ? 'province' : 'commune'));
      strip.setSelection({ scale, variable });
      document.getElementById('control-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });

  // Full dataset browser (Topics / Geography / Sources / Search)
  createBrowseNav(document.getElementById('browse-section'), {
    onSelect: ({ variable }) => {
      if (!variable) return;
      const meta = M.byId(variable);
      if (!meta) return;
      const scale = meta.scale_availability.national ? 'national' : (meta.scale_availability.department ? 'department' : (meta.scale_availability.province ? 'province' : 'commune'));
      strip.setSelection({ scale, variable });
      document.getElementById('control-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });

  // Initial mount: hash state -> default total_population
  const h = readHashState();
  // Resolve the requested id through the canonical pointer. A retired
  // per-capita variant (#variable=enfranchised_per_capita) resolves to its
  // count sibling; when the requested variant is per-capita, open with the
  // toggle ON so the deep link reproduces the per-capita view (Addendum 5e).
  let requestedId = h.variable;
  let initPC = h.pc ? true : null;
  if (requestedId && M.byId(requestedId)) {
    const canon = M.resolveCanonical(requestedId);
    if (canon && canon.id !== requestedId) {
      if (isPerCapitaVariant(M.byId(requestedId))) initPC = true;
      requestedId = canon.id;
    }
  }
  const defaultId = (requestedId && M.byId(requestedId)) ? requestedId
                  : (M.byId('total_population') ? 'total_population'
                  : (M.listForScale('national')[0] && M.listForScale('national')[0].id));
  // Comparison deep link: resolve the overlay variables (national only).
  let initCompare = [];
  if (h.variables.length > 1) {
    initCompare = h.variables.slice(1)
      .map(id => { const c = M.resolveCanonical(id); return c ? c.id : id; })
      .filter(id => M.byId(id) && id !== defaultId);
  }
  if (defaultId) {
    const meta = M.byId(defaultId);
    let scale = h.scale || (meta.scale_availability.national ? 'national' : (meta.scale_availability.department ? 'department' : (meta.scale_availability.province ? 'province' : 'commune')));
    if (initCompare.length) scale = 'national';  // comparison is a national-chart feature
    pendingCompareIds = initCompare;
    // Thread the hash year through so a deep link / pasted citation
    // (#...&year=1875) renders that year instead of the slider's default
    // (addendum 4a). The control strip honors it only when it is valid for the
    // indicator; otherwise it falls back to the first valid year.
    strip.mount({ scale, variable: defaultId, category: meta.topic_category || meta.category,
      year: (initCompare.length ? null : (h.variable === defaultId ? h.year : null)), perCapita: initPC });
  } else {
    strip.mount({ scale: h.scale || 'national' });
  }

  createFooter(document.getElementById('ftr'), { lastUpdated: new Date().toISOString().slice(0, 10) });

  // Source-page variable clicks: re-mount the control strip on the chosen var.
  window.addEventListener('atlas:nav', (e) => {
    const { scale, variable } = e.detail || {};
    if (!variable) return;
    strip.setSelection({ scale, variable });
    document.getElementById('control-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Comparison changes inside the chart broadcast their variable set so it can
  // be serialized into the URL hash and thus shared/cited (UX2 B.4).
  window.addEventListener('atlas:compare', (e) => {
    const { scale, variables, perCapita } = e.detail || {};
    if (!Array.isArray(variables) || !variables.length) return;
    writeHashState({ scale, variable: variables[0], variables, perCapita });
  });
}

// Skip-to-content link (UX2 E): a keyboard user can jump past the header
// straight to the controls. Hidden until focused (CSS .skip-link). Injected
// rather than baked into the shell so it survives every bundle rebuild.
function installSkipLink() {
  if (document.querySelector('.skip-link')) return;
  const a = document.createElement('a');
  a.className = 'skip-link';
  a.href = '#control-section';
  a.textContent = 'Skip to content';
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const t = document.getElementById('control-section');
    if (!t) return;
    t.setAttribute('tabindex', '-1');
    t.focus();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.body.insertBefore(a, document.body.firstChild);
}
try { installSkipLink(); } catch (_) {}

// File-protocol guard. The maps fetch their geojson geometry at runtime
// (map_view.js loadGeoJSON), and browsers block file://→file:// fetches as a
// cross-origin request (origin 'null'). The bundle inlines the manifest and
// window_data, so national time-series charts work when the file is opened by
// double-click, but every department/province choropleth fails silently: the
// basemap loads, the overlay never paints, the legend stays empty. Detect the
// file: protocol and show a non-blocking banner telling the user to serve the
// page over http instead. The rest of the page still works.
function showFileProtocolBanner() {
  if (location.protocol !== 'file:') return;
  if (document.getElementById('file-proto-banner')) return;
  const bar = document.createElement('div');
  bar.id = 'file-proto-banner';
  bar.setAttribute('role', 'alert');
  bar.style.cssText = 'position:sticky;top:0;z-index:9999;background:#7A1E2B;color:#FBF3F3;'
    + 'padding:10px 16px;font:14px/1.45 -apple-system,Segoe UI,Roboto,sans-serif;'
    + 'border-bottom:2px solid #4E0F18;box-shadow:0 1px 4px rgba(0,0,0,.18)';
  bar.innerHTML = '<strong>Open via a local server, not by double-clicking</strong> — '
    + 'maps cannot load over <code>file://</code> URLs. From the <code>gis_platform/</code> '
    + 'folder run <code>python3 -m http.server 8767</code>, then open '
    + '<code>http://localhost:8767/historical_atlas_of_chile.html</code>. '
    + '(National charts still work here; only the department and province maps need the server.)';
  document.body.insertBefore(bar, document.body.firstChild);
}
try { showFileProtocolBanner(); } catch (_) {}

_atlasInit().catch(function(err) {
  console.error(err);
  document.getElementById('root').innerHTML = `<div style="padding:48px;font-family:sans-serif">Failed to initialize: ${err.message}</div>`;
});
