// Citation generator. Per Part 2 of the brief, citations center the
// ORIGINAL SOURCE; the compiler credit is separate and below. Templates
// pick by source_type. Provides APA + Chicago + plain-text variants.

import * as M from './manifest.js';
import { PROJECT_NAME } from './header.js';

const TODAY = () => new Date().toISOString().slice(0, 10);

function stableUrl(state) {
  const base = location.origin + location.pathname;
  const hash = `scale=${state.scale}&variable=${state.variable}` +
               (state.year != null ? `&year=${state.year}` : '') +
               (state.perCapita ? `&pc=1` : '');
  return `${base}#${hash}`;
}

function escape(s) { return String(s ?? ''); }

// Year-specific source tweaks (e.g. census year, anuario tomo)
function originalCitation(meta, state) {
  const docs = meta.source_documents || [];
  const primary = meta.source_document || (docs[0] || '');
  const yr = state.year || (meta.scales[state.scale]?.year_range?.[0] ?? '');
  switch (meta.source_type) {
    case 'census':
      return `Chilean Census, ${yr || 'multiple years'}.`;
    case 'anuario':
      return primary || `Anuario Estadístico de Chile, ${yr}.`;
    case 'memoria':
      return primary || `Memoria del Ministerio (${yr}).`;
    case 'sinopsis':
      return primary || `Sinopsis Estadística de Chile, ${yr}.`;
    case 'diaz_luders_wagner':
      return 'Díaz, J., Lüders, R., & Wagner, G. (2016). La República en Cifras: Chile 1810–2010.';
    default:
      return primary || 'Aggregated multi-source compilation.';
  }
}

export function buildCitation(meta, state, format = 'apa') {
  const original = originalCitation(meta, state);
  const variable = meta.display_label || meta.label;
  const url = stableUrl(state);
  const compiler = "Maximiliano Véjares";
  const accessed = TODAY();

  if (format === 'apa') {
    if (meta.source_type === 'diaz_luders_wagner') {
      return `Díaz, J., Lüders, R., & Wagner, G. (2016). La República en Cifras: Chile 1810–2010. Variable: ${variable}. Accessed via ${PROJECT_NAME}, ${accessed}. ${url}`;
    }
    return `${original} Variable: ${variable}. Accessed via ${PROJECT_NAME}, ${accessed}. ${url}`;
  }
  if (format === 'chicago') {
    if (meta.source_type === 'diaz_luders_wagner') {
      return `Díaz, José, Rolf Lüders, and Gert Wagner. La República en Cifras: Chile 1810–2010. 2016. Variable: "${variable}." Accessed via ${PROJECT_NAME}, ${accessed}. ${url}.`;
    }
    return `${original} Variable: "${variable}." Accessed via ${PROJECT_NAME}, ${accessed}. ${url}.`;
  }
  // plain
  return `${original}\nVariable: ${variable}\nCompiled by ${compiler}\nAccessed: ${accessed}\n${url}`;
}

// "Cite this view" UI: a small inline button that opens a popover.
export function attachCiteButton(host, getState) {
  const btn = document.createElement('button');
  btn.className = 'cite-btn';
  btn.textContent = 'Cite this view';

  const pop = document.createElement('div');
  pop.className = 'cite-popover';
  pop.style.display = 'none';

  function render() {
    const state = getState();
    const meta = state.variable ? M.byId(state.variable) : null;
    if (!meta) {
      pop.innerHTML = `<div class="cite-empty">Select a variable first.</div>`;
      return;
    }
    const apa = buildCitation(meta, state, 'apa');
    const chi = buildCitation(meta, state, 'chicago');
    pop.innerHTML = `
      <div class="cite-head">
        <span class="overline">Cite</span>
        <button class="cite-close" aria-label="Close">×</button>
      </div>
      <div class="cite-fmt">
        <button class="cite-tab is-active" data-fmt="apa">APA</button>
        <button class="cite-tab" data-fmt="chicago">Chicago</button>
      </div>
      <div class="cite-body" data-current="apa">${escape(apa)}</div>
      <div class="cite-actions">
        <button class="cite-copy">Copy</button>
        <a class="cite-link" href="#" target="_blank">Permalink</a>
      </div>
    `;
    pop.querySelector('.cite-link').href = stableUrl(state);
    pop.querySelectorAll('.cite-tab').forEach(t => t.addEventListener('click', () => {
      pop.querySelectorAll('.cite-tab').forEach(x => x.classList.toggle('is-active', x === t));
      const fmt = t.dataset.fmt;
      pop.querySelector('.cite-body').dataset.current = fmt;
      pop.querySelector('.cite-body').textContent = buildCitation(meta, state, fmt);
    }));
    pop.querySelector('.cite-copy').addEventListener('click', async () => {
      const txt = pop.querySelector('.cite-body').textContent;
      try { await navigator.clipboard.writeText(txt); pop.querySelector('.cite-copy').textContent = 'Copied'; setTimeout(() => pop.querySelector('.cite-copy').textContent = 'Copy', 1500); } catch {}
    });
    pop.querySelector('.cite-close').addEventListener('click', () => { pop.style.display = 'none'; });
  }

  btn.addEventListener('click', () => {
    if (pop.style.display === 'none') { render(); pop.style.display = 'block'; }
    else                                pop.style.display = 'none';
  });

  host.appendChild(btn);
  host.appendChild(pop);
  return { rerender: render };
}
