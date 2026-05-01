// Static page-bottom sections wired to the nav:
//   #sources  → drill-into source documents (groups -> docs -> variables backed)
//   #about    → project description, methodology link, contact

import * as M from './manifest.js';

// Build a structured source registry from the manifest. Group is source_type;
// each group lists actual document names with the variables they back.
function buildSourceRegistry() {
  const groups = {};
  for (const v of M.manifest()) {
    if (v.published === false) continue;
    const t = v.source_type;
    groups[t] = groups[t] || { type: t, docs: {} };
    const docs = (v.source_documents && v.source_documents.length)
      ? v.source_documents
      : (v.source_document ? [v.source_document] : ["(unattributed)"]);
    for (const d of docs) {
      groups[t].docs[d] = groups[t].docs[d] || { name: d, variables: [] };
      groups[t].docs[d].variables.push({ id: v.id, label: v.display_label || v.label });
    }
  }
  // Convert to sorted arrays
  return Object.values(groups)
    .map(g => ({
      type: g.type,
      typeName: M.sourceTypeName(g.type),
      docs: Object.values(g.docs).sort((a, b) => a.name.localeCompare(b.name)),
      docCount: Object.keys(g.docs).length,
      varCount: Object.values(g.docs).reduce((n, d) => n + d.variables.length, 0),
    }))
    .sort((a, b) => b.varCount - a.varCount);
}

function renderSourcesGroup(g) {
  return `
    <details class="src-group" data-type="${g.type}">
      <summary>
        <span class="src-group-name serif">${g.typeName}</span>
        <span class="src-group-meta caption num">${g.docCount} document${g.docCount === 1 ? '' : 's'} · ${g.varCount} variable${g.varCount === 1 ? '' : 's'}</span>
      </summary>
      <ul class="src-doc-list">
        ${g.docs.map(d => `
          <li class="src-doc">
            <details class="src-doc-details">
              <summary>
                <span class="sd-name">${escape(d.name)}</span>
                <span class="sd-count caption num">${d.variables.length} variable${d.variables.length === 1 ? '' : 's'}</span>
              </summary>
              <ul class="sd-vars">
                ${d.variables.slice().sort((a, b) => a.label.localeCompare(b.label)).map(v => `
                  <li><a href="#variable=${encodeURIComponent(v.id)}">${escape(v.label)}</a></li>
                `).join('')}
              </ul>
            </details>
          </li>
        `).join('')}
      </ul>
    </details>
  `;
}

function escape(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
}

export function createSections(host) {
  const groups = buildSourceRegistry();
  const totalDocs = groups.reduce((n, g) => n + g.docCount, 0);

  host.classList.add('static-sections');
  host.innerHTML = `
    <section id="sources" class="static-section">
      <div class="ss-overline overline">Sources</div>
      <h2 class="ss-title serif">Where the data come from</h2>
      <p class="ss-body">
        Every chart and map cites its primary source. The atlas draws on
        ${totalDocs} historical documents — censuses, statistical yearbooks,
        ministerial reports, academic compilations. Click any group to expand;
        click any document to see which variables it backs.
      </p>
      <div class="src-registry">
        ${groups.map(renderSourcesGroup).join('')}
      </div>
      <p class="ss-foot caption">Historical administrative borders are sourced from <em>La Política en el Espacio</em>.</p>
    </section>

    <section id="about" class="static-section">
      <div class="ss-overline overline">About</div>
      <h2 class="ss-title serif">A research tool for a century and a half of Chilean records</h2>
      <p class="ss-body">
        The Historical Atlas of Chile compiles, reconciles, and publishes
        Chilean economic, political, and social data from 1845 to 1995,
        drawing on historical censuses, statistical yearbooks, ministerial
        reports, and academic compilations. The atlas is free for academic,
        journalistic, and pedagogical use.
      </p>
      <p class="ss-body">
        Methodology and the build pipeline are documented under <a href="AUDIT.md">Methodology</a>.
        Raw data downloads in CSV are linked from each chart and map; bulk
        access is available via the <a href="data/chile_master_data.csv">canonical CSV</a>.
      </p>
      <p class="ss-foot caption">Contact: <a href="mailto:maxvejares@jhu.edu">maxvejares@jhu.edu</a>.</p>
    </section>
  `;

  // Wire variable links to the existing hash router so clicking a variable
  // in the source list takes the user straight to that view.
  host.querySelectorAll('a[href^="#variable="]').forEach(a => {
    a.addEventListener('click', (e) => {
      const m = a.getAttribute('href').match(/^#variable=([^&]+)/);
      if (!m) return;
      const variable = decodeURIComponent(m[1]);
      const meta = M.byId(variable);
      if (!meta) return;
      e.preventDefault();
      const scale = meta.scale_availability.national ? 'national'
                  : (meta.scale_availability.department ? 'department' : 'province');
      location.hash = `scale=${scale}&variable=${encodeURIComponent(variable)}`;
      // Trigger the existing app re-mount via a custom event the orchestrator
      // listens for. If absent, the user can refresh; otherwise we reload.
      window.dispatchEvent(new CustomEvent('atlas:nav', { detail: { scale, variable } }));
    });
  });
}
