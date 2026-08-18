// OWID-style landing grid: 10 topic cards. Counts come from the manifest.
// Click jumps to a representative landing variable.
//
// Chunk 2.2 (finding D2-05): six landings were re-pointed because their
// previous targets (cpi_index, wheat_production, copper_production,
// total_labor_force, primary_school_enrollment, exports_in_current_dollars)
// were withdrawn as unattributable — they rendered with no row in master,
// long_master, staging or extractions. Each now points at the best-covered
// surviving indicator in its topic. The build gate caught this; pickLanding()
// below would have fallen back silently.
//
// R3 (2026-08-02): Trade now has ZERO indicators. copper_export_duty_nat was
// itself unsourced and is withdrawn. The card renders empty until MOVE 2
// extraction supplies a citable trade series. Do not borrow one from Economy.
// Prior note, retained:
// Trade is the one to watch: `copper_export_duty_nat` carries 5 cells, and it
// is the ONLY surviving trade indicator. That topic was built almost entirely
// on series nothing on disk could source.

import * as M from './manifest.js';

export const TOPICS = [
  // Landings must point at a LIVE, CLEAN canonical id — not a retired/merged
  // alias, a dropped id, OR a series fenced off by a render guard. economy was
  // real_gdp_per_capita (retired → real_gdp). fiscal was fiscal_revenue_of_gdp
  // (absent from the manifest); revenue_of_gdp was a wrong first fix — it is
  // marked complete but carries data_quality_flag=unit_splice_corruption and is
  // real_gdp and the sectoral/ratio GDP series were discarded (no primary source
  // before national accounting begins ~1940). Land Economy on cpi_index: a
  // primary-sourced (DGE/INE) macro series, complete and national.
  { id: "economy",        label: "Economy",        landing: "municipal_presupuesto_pesos",                   desc: "Prices, fiscal accounts, trade, exchange rates." },
  { id: "demography",     label: "Demography",     landing: "total_population",            desc: "Population, vital statistics, urbanization." },
  { id: "politics",       label: "Politics",       landing: "n_legislators",               desc: "Suffrage, legislators, elections, franchise reform." },
  { id: "agriculture",    label: "Agriculture",    landing: "existencias_bovinos_cabezas",            desc: "Crops, estates, agrarian structure, peasants." },
  { id: "mining",         label: "Mining",         landing: "salitre_production_tons",           desc: "Copper, coal, gold, silver, saltpeter, sulfur." },
  { id: "labor",          label: "Labor",          landing: "peasant",           desc: "Workforce, occupational composition, participation." },
  { id: "education",      label: "Education",      landing: "total_school_enrollment",   desc: "Schools, students, literacy, enrollment." },
  { id: "infrastructure", label: "Infrastructure", landing: "railway_network_length",      desc: "Railways, telephones, ports, electricity." },
  { id: "housing",        label: "Housing",        landing: "viviendas_total_1992",        desc: "Dwellings, tenure, water, sewerage, electricity (1992)." },
  // Landing moved off `totexp` on 2026-08-03: that series came wholly from
  // `Data Chile complete.xlsx`, which decision 3 fenced, so it no longer exists
  // in the catalog. `muni_total_revenue` is the widest-coverage fiscal series
  // that survives, at 577 observations.
  { id: "fiscal",         label: "Fiscal",         landing: "muni_total_revenue", desc: "Revenue, expenditure, debt, taxes." },
  { id: "trade",          label: "Trade",          landing: "comercio_total_pesos",  desc: "Exports, imports, trade composition." },
];

function pickLanding(t) {
  // Try declared landing variable first; if missing or hidden, fall back to first complete-tier var in topic
  const declared = M.byId(t.landing);
  if (declared && declared.published !== false) return declared;
  const list = M.listByTopic(t.id);
  return list.find(v => v.published === "complete")
      || list.find(v => v.published === "partial")
      || list[0]
      || null;
}

function pickExamples(t, n = 3) {
  return M.listByTopic(t.id).slice(0, n).map(v => v.display_label || v.label);
}

export function createTopicGrid(host, { onSelect }) {
  host.classList.add('topic-grid-section');
  // Drop cap on topic descriptions tested visually 2026-04-30; reverted —
  // four typographic levels per card (name, count, drop cap, body, examples)
  // pushed the design past data-tool into precious territory. To re-enable,
  // set host.setAttribute('data-dropcap', 'on'). CSS rule remains in app.css.
  const counts = M.topicCounts();
  const stats = M.stats();
  // Unit counts from the all-vintage geography index (the strip's old "70+"
  // and "25" were hand-written and stale; 2026-08-18 second audit).
  const geo = M.geographyCounts();

  const cards = TOPICS.map(t => {
    const n = counts[t.id] || 0;
    const examples = pickExamples(t);
    return `
      <button class="topic-card" data-topic="${t.id}">
        <span class="tc-label">${t.label}</span>
        <span class="tc-count num">${n} indicator${n === 1 ? '' : 's'}</span>
        <span class="tc-desc">${t.desc}</span>
        <span class="tc-examples">${examples.join(' · ')}</span>
      </button>
    `;
  }).join('');

  host.innerHTML = `
    <div class="topic-grid">${cards}</div>
    <div class="dataset-strip topic-strip">
      <div class="stat"><span class="v num">${stats.year_span}</span><span class="l">years</span></div>
      <div class="stat"><span class="v num">${(stats.n_variables_total ?? Object.values(counts).reduce((a, b) => a + b, 0)).toLocaleString('en-US')}</span><span class="l">indicators</span></div>
      <div class="stat"><span class="v num">${stats.n_census_years}</span><span class="l">census waves</span></div>
      ${geo.department ? `<div class="stat"><span class="v num">${geo.department}</span><span class="l">departments, all vintages</span></div>` : ''}
      ${geo.province ? `<div class="stat"><span class="v num">${geo.province}</span><span class="l">provinces, all vintages</span></div>` : ''}
      <div class="stat"><span class="v num">${(stats.n_source_documents ?? 0).toLocaleString('en-US')}</span><span class="l">source documents</span></div>
    </div>
  `;

  host.querySelectorAll('.topic-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = TOPICS.find(x => x.id === btn.dataset.topic);
      if (!t) return;
      const landing = pickLanding(t);
      if (!landing) return;
      onSelect && onSelect({ topic: t.id, variable: landing.id });
    });
  });
}
