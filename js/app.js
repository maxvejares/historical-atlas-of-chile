// Orchestrator. Mount order: header, hero, topic grid, control strip,
// chart/map, footer. Manifest must load first.

import * as M from './manifest.js';
import { createHeader } from './header.js';
import { createHero } from './hero.js';
import { createTopicGrid } from './topic_grid.js';
import { createControlStrip } from './control_strip.js';
import { createChart } from './chart.js';
import { createMapView } from './map_view.js';
import { createFooter } from './footer.js';
import { createSections } from './sections.js';

function readHashState() {
  const p = new URLSearchParams(location.hash.slice(1));
  return {
    scale:    p.get('scale'),
    variable: p.get('variable'),
    year:     p.get('year') ? +p.get('year') : null,
    pc:       p.get('pc') === '1',
  };
}

function writeHashState(s) {
  const p = new URLSearchParams();
  if (s.scale)    p.set('scale', s.scale);
  if (s.variable) p.set('variable', s.variable);
  if (s.year != null) p.set('year', String(s.year));
  if (s.perCapita) p.set('pc', '1');
  const newHash = '#' + p.toString();
  if (location.hash !== newHash) history.replaceState(null, '', newHash);
}

async function main() {
  await M.loadManifest();

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
    <section id="control-section"></section>
    <section id="canvas-section" class="canvas">
      <div id="chart-host" style="display:none"></div>
      <div id="map-host" style="display:none"></div>
      <div id="empty-host" class="canvas-empty">Pick a topic above to begin, or use the controls.</div>
    </section>
    <div id="static-sections-host"></div>
    <footer id="ftr"></footer>
  `;
  createSections(document.getElementById('static-sections-host'));
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

  const strip = createControlStrip(document.getElementById('control-section'), {
    onSelect: (state) => {
      if (!state.variable) return;
      writeHashState(state);
      showFor(state.scale);
      if (state.scale === 'national') {
        chart.mount({ id: state.variable, scale: 'national' });
      } else {
        mapView.render({ scale: state.scale, variable: state.variable, year: state.year, perCapita: state.perCapita });
      }
    },
  });

  createHero(document.getElementById('hero-section'));

  createTopicGrid(document.getElementById('topic-section'), {
    onSelect: ({ topic, variable }) => {
      if (!variable) return;
      const meta = M.byId(variable);
      const scale = meta.scale_availability.national ? 'national' : (meta.scale_availability.department ? 'department' : 'province');
      strip.setSelection({ scale, variable });
      document.getElementById('control-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });

  // Initial mount: hash state -> default total_population
  const h = readHashState();
  const defaultId = (h.variable && M.byId(h.variable)) ? h.variable
                  : (M.byId('total_population') ? 'total_population'
                  : (M.listForScale('national')[0] && M.listForScale('national')[0].id));
  if (defaultId) {
    const meta = M.byId(defaultId);
    const scale = h.scale || (meta.scale_availability.national ? 'national' : (meta.scale_availability.department ? 'department' : 'province'));
    strip.mount({ scale, variable: defaultId, category: meta.category });
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
}

main().catch(err => {
  console.error(err);
  document.getElementById('root').innerHTML = `<div style="padding:48px;font-family:sans-serif">Failed to initialize: ${err.message}</div>`;
});
