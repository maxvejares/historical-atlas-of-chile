// OWID-style landing grid: 10 topic cards. Counts come from the manifest.
// Click jumps to a representative landing variable.

import * as M from './manifest.js';

const TOPICS = [
  { id: "economy",        label: "Economy",        landing: "real_gdp_per_capita",         desc: "GDP, growth, exchange rates, sectoral shares." },
  { id: "demography",     label: "Demography",     landing: "total_population",            desc: "Population, vital statistics, urbanization." },
  { id: "politics",       label: "Politics",       landing: "n_legislators",               desc: "Suffrage, legislators, elections, franchise reform." },
  { id: "agriculture",    label: "Agriculture",    landing: "wheat_production",            desc: "Crops, estates, agrarian structure, peasants." },
  { id: "mining",         label: "Mining",         landing: "copper_production",           desc: "Copper, coal, gold, silver, saltpeter, sulfur." },
  { id: "labor",          label: "Labor",          landing: "total_labor_force",           desc: "Workforce, occupational composition, participation." },
  { id: "education",      label: "Education",      landing: "primary_school_enrollment",   desc: "Schools, students, literacy, enrollment." },
  { id: "infrastructure", label: "Infrastructure", landing: "railway_network_length",      desc: "Railways, telephones, ports, electricity." },
  { id: "fiscal",         label: "Fiscal",         landing: "fiscal_revenue_of_gdp",       desc: "Revenue, expenditure, debt, taxes." },
  { id: "trade",          label: "Trade",          landing: "trade_openness_of_gdp",       desc: "Exports, imports, trade composition, openness." },
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
      <div class="stat"><span class="v num">${Object.values(counts).reduce((a, b) => a + b, 0)}</span><span class="l">indicators</span></div>
      <div class="stat"><span class="v num">${stats.n_census_years}</span><span class="l">census waves</span></div>
      <div class="stat"><span class="v num">52</span><span class="l">departments</span></div>
      <div class="stat"><span class="v num">25</span><span class="l">provinces</span></div>
      <div class="stat"><span class="v num">~145</span><span class="l">source documents</span></div>
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
