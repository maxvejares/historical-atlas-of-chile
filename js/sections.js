import * as M from './manifest.js';

// Static page-bottom sections wired to the nav:
//   #sources  → drill-into source documents (canonical 5-group taxonomy:
//               primary government, compiled academic, specialized
//               institutional, foreign/academic secondary, pending
//               attribution review)
//   #about    → project description, methodology link, contact
//
// The sources registry filters by the active variable when one is selected,
// surfacing only the sources that back that variable. The unfiltered view
// returns when no variable is active. Wired via the exported
// `setActiveVariable(id)` setter, called by app.js on every variable change.


// Canonical source groupings (D1/D2/D3 polish). Documents are classified by
// substring match against the document name; first match wins. The order
// reflects the conceptual hierarchy of evidentiary primacy:
//   primary_government → original Chilean government publications
//   compiled_academic  → academic compilations (DLW, Mamalakis, et al.)
//   institutional      → trade-association and sectoral bulletins
//   secondary_academic → foreign and secondary academic monographs
//   pending_attribution → variables whose source attribution is still under
//                         review (M018 null-source-document fallback)
const SOURCE_GROUPS = [
  { id: 'primary_government', name: 'Primary Chilean government publications',
    blurb: 'Censuses, statistical yearbooks, ministerial reports, and government compilations issued by Chilean state agencies.' },
  { id: 'compiled_academic', name: 'Compiled academic statistics',
    blurb: 'Long-run series compiled from primary archives by economic historians: Mamalakis; Aldana; Molina; Sinopsis retrospectivas.' },
  { id: 'institutional', name: 'Specialized institutional sources',
    blurb: 'Bulletins and yearbooks from Chilean trade associations and sectoral institutions: Sociedad Nacional de Agricultura, SOFOFA, Boletín del Trabajo.' },
  { id: 'secondary_academic', name: 'Foreign and academic secondary sources',
    blurb: 'Academic monographs and reference databases compiled outside the Chilean government corpus: Bauer, Cariola/Sunkel, Biblioteca del Congreso Nacional, project working files.' },
  { id: 'pending_attribution', name: 'Source pending attribution',
    blurb: 'Published series whose underlying primary source is not yet established. These remain visible, but the atlas does not assert a source it cannot trace. Where a series originated in a secondary compilation that has been withdrawn, or in a working file with no recorded provenance, it is held here until a primary (or accepted historical) source is confirmed.' },
];

const GROUP_RULES = [
  ['primary_government', [
    /\banuario\b/i, /\bsinopsis estad/i, /\bcenso\b/i, /\bcensus\b/i,
    /\bmemoria\b/i, /\bpresupuesto\b/i, /\bcatastro\b/i, /\brol de aval/i,
  ]],
  ['compiled_academic', [
    /\bmamalakis\b/i,
    /\baldana\b/i, /\bmolina\b/i, /\bmiquel\b/i, /\bmartner\b/i,
  ]],
  ['institutional', [
    /\bsociedad nacional/i, /\bsofofa\b/i, /\bbolet[ií]n del trabajo\b/i,
    /\bsna\b/i,
  ]],
  ['secondary_academic', [
    /\bbauer\b/i, /\bbiblioteca del congreso\b/i, /\bcariola\b/i,
    /\bsunkel\b/i, /v[ée]jares/i,
  ]],
];

function classifyDocument(docName) {
  if (!docName || docName === '(unattributed)') return 'pending_attribution';
  for (const [groupId, patterns] of GROUP_RULES) {
    if (patterns.some(p => p.test(docName))) return groupId;
  }
  // Fallback: unrecognized document with a real name still counts as cited.
  // Treat as secondary_academic rather than pending; pending is reserved for
  // the genuinely-attribution-less variables.
  return 'secondary_academic';
}

// Build the sources registry as an array of group objects, optionally
// filtered to a single variable id.
function buildSourceRegistry(filterVar) {
  const groupMap = Object.fromEntries(SOURCE_GROUPS.map(g => [g.id, { ...g, docs: {}, pendingVars: [] }]));
  for (const v of M.manifest()) {
    if (v.published === false) continue;
    if (filterVar && v.id !== filterVar) continue;
    const docs = (v.source_documents && v.source_documents.length)
      ? v.source_documents
      : (v.source_document ? [v.source_document] : []);
    if (!docs.length) {
      groupMap.pending_attribution.pendingVars.push({
        id: v.id, label: v.display_label || v.label,
        status: v.source_attribution_status || null,
      });
      continue;
    }
    for (const d of docs) {
      const groupId = classifyDocument(d);
      const group = groupMap[groupId];
      group.docs[d] = group.docs[d] || { name: d, variables: [] };
      group.docs[d].variables.push({ id: v.id, label: v.display_label || v.label });
    }
  }
  return SOURCE_GROUPS.map(spec => {
    const g = groupMap[spec.id];
    const docs = Object.values(g.docs).sort((a, b) => a.name.localeCompare(b.name));
    const docCount = docs.length;
    const varCount = docs.reduce((n, d) => n + d.variables.length, 0) + g.pendingVars.length;
    return { ...spec, docs, pendingVars: g.pendingVars, docCount, varCount };
  });
}

function escapeS(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
}

function renderDocItem(d) {
  return `
    <li class="src-doc">
      <details class="src-doc-details">
        <summary>
          <span class="sd-name">${escapeS(d.name)}</span>
          <span class="sd-count caption num">${d.variables.length} variable${d.variables.length === 1 ? '' : 's'}</span>
        </summary>
        <ul class="sd-vars">
          ${d.variables.slice().sort((a, b) => a.label.localeCompare(b.label)).map(v => `
            <li><a href="#variable=${encodeURIComponent(v.id)}">${escapeS(v.label)}</a></li>
          `).join('')}
        </ul>
      </details>
    </li>`;
}

// Human-readable reason for a pending source_attribution_status.
const PENDING_STATUS_REASON = {
  no_recoverable_source: 'no recoverable source',
  no_family_no_source: 'no recoverable source',
  source_pending_no_braun: 'prior source withdrawn; primary pending',
  source_attribution_missing: 'source attribution incomplete',
  pending: 'source pending',
};

function renderPendingItem(varList) {
  if (!varList.length) return '';
  return `
    <li class="src-doc src-doc-pending">
      <details class="src-doc-details">
        <summary>
          <span class="sd-name sd-pending-label">Source pending attribution</span>
          <span class="sd-count caption num">${varList.length} variable${varList.length === 1 ? '' : 's'}</span>
        </summary>
        <ul class="sd-vars">
          ${varList.slice().sort((a, b) => a.label.localeCompare(b.label)).map(v => {
            const reason = v.status && PENDING_STATUS_REASON[v.status];
            return `<li><a href="#variable=${encodeURIComponent(v.id)}">${escapeS(v.label)}</a>${
              reason ? ` <span class="caption" style="color:var(--ink-muted)">— ${escapeS(reason)}</span>` : ''
            }</li>`;
          }).join('')}
        </ul>
      </details>
    </li>`;
}

function renderGroup(g, expandedByDefault) {
  const isPending = g.id === 'pending_attribution';
  const empty = g.docCount === 0 && g.pendingVars.length === 0;
  if (empty) return '';
  return `
    <details class="src-group ${isPending ? 'src-group-pending' : ''}" data-group="${g.id}" ${expandedByDefault ? 'open' : ''}>
      <summary>
        <span class="src-group-name serif">${g.name}</span>
        <span class="src-group-meta caption num">${g.docCount} document${g.docCount === 1 ? '' : 's'} · ${g.varCount} variable${g.varCount === 1 ? '' : 's'}</span>
      </summary>
      <p class="src-group-blurb">${escapeS(g.blurb)}</p>
      <ul class="src-doc-list">
        ${g.docs.map(renderDocItem).join('')}
        ${isPending ? renderPendingItem(g.pendingVars) : ''}
      </ul>
    </details>`;
}

function renderRegistry(groups, filterVar) {
  if (filterVar) {
    const meta = M.byId(filterVar);
    const label = meta ? (meta.display_label || meta.label) : filterVar;
    const banner = `
      <div class="src-filter-banner">
        Showing sources for <strong>${escapeS(label)}</strong>.
        <button type="button" class="src-filter-clear">Show all sources</button>
      </div>`;
    return banner + groups.map(g => renderGroup(g, true)).join('');
  }
  return groups.map(g => renderGroup(g, false)).join('');
}

export function createSections(host) {
  const sc = M.scope() || { start: 1840, end: 1990 };
  let activeVariable = null;

  host.classList.add('static-sections');
  host.innerHTML = `
    <section id="sources" class="static-section">
      <div class="ss-overline overline">Sources</div>
      <h2 class="ss-title serif">Where the data come from</h2>
      <p class="ss-body">
        Every chart and map cites its primary source. The atlas draws on
        the corpus below — Chilean censuses and statistical yearbooks,
        ministerial reports, academic compilations, sectoral bulletins —
        organized by the kind of evidence each contributes. Pick any group
        to expand; pick any document to see which variables it backs.
      </p>
      <div class="src-registry"></div>
      <p class="ss-foot caption">Historical administrative borders are sourced from <em>La Política en el Espacio</em>.</p>
    </section>

    <section id="about" class="static-section">
      <h2 class="ss-title serif">A research tool for a century and a half of Chilean records</h2>
      <p class="ss-body">
        The Historical Atlas of Chile compiles, reconciles, and publishes
        Chilean economic, political, and social data from ${sc.start} to ${sc.end},
        drawing on historical censuses, statistical yearbooks, ministerial
        reports, and academic compilations. The atlas is free for academic,
        journalistic, and pedagogical use.
      </p>
      <p class="ss-body">
        The database contains 95,466 observations drawn from 164 source documents,
        covering 138 indicator families across five geographic levels (department,
        province, national, city, and macro-region). Every observation carries a
        quality flag and a source citation. The extraction pipeline, audit
        framework, and known limitations are documented in the methodology.
      </p>
      <p class="ss-body">
        <strong>Citation:</strong> V&eacute;jares, Maximiliano. 2026.
        <em>Historical Atlas of Chile, 1810&ndash;1990: Database and Methodology, Version 1.0.</em>
        Johns Hopkins University.
      </p>
      <p class="ss-foot caption">Contact: <a href="mailto:maxvejares@jhu.edu">maxvejares@jhu.edu</a>.</p>
    </section>

    <section id="resources" class="static-section">
      <div class="ss-overline overline">Other data</div>
      <h2 class="ss-title serif">Looking for something else?</h2>
      <p class="ss-body">
        This atlas is deliberately focused: subnational (department and province)
        Chilean statistics for ${sc.start}&ndash;${sc.end}, compiled from primary
        records. For national long-run series, cross-country comparison, or data
        after 1990, the resources below are the best starting points.
      </p>

      <h3 style="font-weight:600; margin:22px 0 8px; font-size:16px;">Looking for data after 1990? Current official statistics</h3>
      <ul style="list-style:none; padding:0; margin:0; display:grid; gap:10px;">
        <li style="font-size:14px;"><a href="https://www.ine.gob.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Instituto Nacional de Estad&iacute;sticas (INE)</a> &mdash; censuses, demography, prices, employment.</li>
        <li style="font-size:14px;"><a href="https://www.sinim.gov.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">SINIM</a> &mdash; municipal data for every Chilean municipality (finance, education, health, social).</li>
        <li style="font-size:14px;"><a href="https://www.bcentral.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Banco Central de Chile</a> &mdash; macroeconomic, monetary, and financial series.</li>
        <li style="font-size:14px;"><a href="https://centroestudios.mineduc.cl/datos-abiertos/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">MINEDUC &middot; Centro de Estudios</a> &mdash; open education data (enrollment, schools, teachers), 1992&ndash;present.</li>
        <li style="font-size:14px;"><a href="https://deis.minsal.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">DEIS &middot; Ministerio de Salud</a> &mdash; vital statistics, hospital discharges, health data.</li>
        <li style="font-size:14px;"><a href="https://observatorio.ministeriodesarrollosocial.gob.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Observatorio Social &middot; CASEN</a> &mdash; poverty, income, and social conditions.</li>
        <li style="font-size:14px;"><a href="https://www.servel.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Servicio Electoral (SERVEL)</a> &mdash; electoral rolls and results.</li>
        <li style="font-size:14px;"><a href="https://datos.gob.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">datos.gob.cl</a> &mdash; the Chilean government open-data portal.</li>
      </ul>

      <h3 style="font-weight:600; margin:22px 0 8px; font-size:16px;">National &amp; comparative historical series</h3>
      <ul style="list-style:none; padding:0; margin:0; display:grid; gap:10px;">
        <li style="font-size:14px;"><a href="https://ebooks.ediciones.uc.cl/library/publication/chile-1810-2010-la-republica-en-cifras-historical-statistics-1668796634" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">D&iacute;az, L&uuml;ders &amp; Wagner (2016), <em>Chile 1810&ndash;2010. La Rep&uacute;blica en cifras</em></a> &mdash; the definitive national historical-statistics compendium.</li>
        <li style="font-size:14px;"><a href="https://www.economia.uc.cl/docs/doctra/dt-187.pdf" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Braun et al. (1998), <em>Econom&iacute;a Chilena 1810&ndash;1995</em></a> &mdash; its freely available predecessor (PUC).</li>
        <li style="font-size:14px;"><a href="https://www.lac.ox.ac.uk/research-projects/moxlad-database" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">MOxLAD</a> &mdash; comparable Latin American economic series, 1870&ndash;2010.</li>
        <li style="font-size:14px;"><a href="https://clio-infra.eu/Countries/Chile.html" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">CLIO-Infra (Chile)</a> &mdash; global historical indicators (GDP, population, wages, inequality).</li>
        <li style="font-size:14px;"><a href="https://www.rug.nl/ggdc/historicaldevelopment/maddison/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Maddison Project</a> &mdash; long-run GDP per capita.</li>
        <li style="font-size:14px;"><a href="https://wid.world/country/chile/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">World Inequality Database (Chile)</a> &mdash; income and wealth inequality.</li>
      </ul>

      <h3 style="font-weight:600; margin:22px 0 8px; font-size:16px;">Primary sources &amp; companion scholarship</h3>
      <ul style="list-style:none; padding:0; margin:0; display:grid; gap:10px;">
        <li style="font-size:14px;"><a href="https://www.memoriachilena.gob.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Memoria Chilena</a> &mdash; digitized censuses, yearbooks, and historical documents (Biblioteca Nacional).</li>
        <li style="font-size:14px;"><a href="https://www.bcn.cl/" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600;">Biblioteca del Congreso Nacional (BCN)</a> &mdash; legislation, electoral and territorial history.</li>
        <li style="font-size:14px;">Llorca-Ja&ntilde;a, M. (ed.) (2026), <em>Historia econ&oacute;mica regional de Chile</em> (Fondo de Cultura Econ&oacute;mica) &mdash; companion regional economic history.</li>
      </ul>
      <p class="ss-foot caption">Links open in a new tab. This atlas is not affiliated with these sources; they are listed as a service to researchers.</p>
    </section>

    <section id="downloads" class="static-section">
      <h2 class="ss-title serif">Downloads</h2>
      <p class="ss-body">
        All data, documentation, and boundary files are free for academic,
        journalistic, and pedagogical use.
      </p>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:20px; margin:24px 0;">
        <div style="background:var(--surface); border:1px solid var(--rule); border-radius:var(--radius); padding:20px;">
          <p style="font-weight:600; margin-bottom:8px;">Dataset (CSV)</p>
          <p style="font-size:13px; color:var(--ink-muted); margin-bottom:12px;">
            95,466 observations in long format. 13-column canonical schema.
            Excludes Braun et al.&nbsp;(1998), available separately from PUC.
          </p>
          <a href="data/chile_historical_database_v1.csv" download
             style="color:var(--accent); font-weight:600;">Download CSV (19 MB)</a>
        </div>
        <div style="background:var(--surface); border:1px solid var(--rule); border-radius:var(--radius); padding:20px;">
          <p style="font-weight:600; margin-bottom:8px;">Codebook (PDF)</p>
          <p style="font-size:13px; color:var(--ink-muted); margin-bottom:12px;">
            128 indicator families with definitions, units, geographic coverage,
            year ranges, and primary sources.
          </p>
          <a href="data/codebook_v1.pdf" download
             style="color:var(--accent); font-weight:600;">Download Codebook</a>
        </div>
        <div style="background:var(--surface); border:1px solid var(--rule); border-radius:var(--radius); padding:20px;">
          <p style="font-weight:600; margin-bottom:8px;">Methodology (Word)</p>
          <p style="font-size:13px; color:var(--ink-muted); margin-bottom:12px;">
            Source corpus, extraction pipeline, tiered audit protocol,
            quality-flag definitions, geographic schema, known limitations.
          </p>
          <a href="data/methodology_v1.docx" download
             style="color:var(--accent); font-weight:600;">Download Methodology</a>
        </div>
      </div>
    </section>
  `;

  const registryEl = host.querySelector('.src-registry');

  function paint() {
    const groups = buildSourceRegistry(activeVariable);
    registryEl.innerHTML = renderRegistry(groups, activeVariable);
    // Wire variable links inside the freshly-painted registry
    registryEl.querySelectorAll('a[href^="#variable="]').forEach(a => {
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
        window.dispatchEvent(new CustomEvent('atlas:nav', { detail: { scale, variable } }));
      });
    });
    // Wire the "show all" filter-clear button
    const clearBtn = registryEl.querySelector('.src-filter-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        activeVariable = null;
        paint();
      });
    }
  }

  paint();

  return {
    setActiveVariable(id) {
      if (id === activeVariable) return;
      activeVariable = id || null;
      paint();
    },
  };
}
