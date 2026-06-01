// Citation generator. Per Part 2 of the brief, citations center the
// ORIGINAL SOURCE; the compiler credit is separate and below. Templates
// pick by source_type. Provides APA + Chicago + plain-text variants.

import * as M from './manifest.js';
import { PROJECT_NAME } from './header.js';

const TODAY = () => new Date().toISOString().slice(0, 10);

function stableUrl(state) {
  const base = location.origin + location.pathname;
  const compare = Array.isArray(state.compareIds) && state.compareIds.length;
  const varPart = compare
    ? `variables=${[state.variable, ...state.compareIds].join(',')}`
    : `variable=${state.variable}`;
  const hash = `scale=${state.scale}&${varPart}` +
               (state.year != null ? `&year=${state.year}` : '') +
               (state.perCapita ? `&pc=1` : '');
  return `${base}#${hash}`;
}

function escape(s) { return String(s ?? ''); }

// Year-specific source tweaks (e.g. census year, anuario tomo)
function originalCitation(meta, state) {
  // Prefer the cleaned `source_documents[0]` over the filename-shorthand
  // `source_document` (UX2 C6); M.sourceLine encodes that preference.
  const primary = M.sourceLine(meta);
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

// Source types we extracted from government / institutional primary sources.
// Only these carry an atlas permalink in their citation — academic
// compilations (Díaz-Lüders-Wagner, Mamalakis, Braun, …) are already
// accessible at their original source, so no link to the atlas is added.
const PRIMARY_SOURCE_TYPES = ['census', 'anuario', 'memoria', 'sinopsis'];

export function buildCitation(meta, state, format = 'apa') {
  const original = originalCitation(meta, state);
  const variable = meta.display_label || meta.label;
  const compiler = "Maximiliano Véjares";
  const accessed = TODAY();
  const isPrimary = PRIMARY_SOURCE_TYPES.includes(meta.source_type);
  const link = isPrimary ? ' ' + stableUrl(state) : '';

  if (format === 'apa') {
    if (meta.source_type === 'diaz_luders_wagner') {
      return `Díaz, J., Lüders, R., & Wagner, G. (2016). La República en Cifras: Chile 1810–2010. Variable: ${variable}. Accessed via ${PROJECT_NAME}, ${accessed}.`;
    }
    return `${original} Variable: ${variable}. Accessed via ${PROJECT_NAME}, ${accessed}.${link}`;
  }
  if (format === 'chicago') {
    if (meta.source_type === 'diaz_luders_wagner') {
      return `Díaz, José, Rolf Lüders, and Gert Wagner. La República en Cifras: Chile 1810–2010. 2016. Variable: "${variable}." Accessed via ${PROJECT_NAME}, ${accessed}.`;
    }
    return `${original} Variable: "${variable}." Accessed via ${PROJECT_NAME}, ${accessed}.${link}`;
  }
  // plain
  return `${original}\nVariable: ${variable}\nCompiled by ${compiler}\nAccessed: ${accessed}${isPrimary ? '\n' + stableUrl(state) : ''}`;
}

// Comparison citation (UX2 B.4). The single-variable cite named only the
// primary; a comparison view must enumerate every overlaid series, each on its
// own line with its own source, then carry one shared accessed-line + the
// shareable comparison URL.
export function buildComparisonCitation(state, format = 'apa') {
  const ids = [state.variable, ...(state.compareIds || [])].filter(Boolean);
  const accessed = TODAY();
  const lines = ids.map(id => {
    const m = M.byId(id);
    if (!m) return null;
    const original = originalCitation(m, { ...state, variable: id });
    const variable = m.display_label || m.label;
    return format === 'chicago'
      ? `${original} Variable: "${variable}."`
      : `${original} Variable: ${variable}.`;
  }).filter(Boolean);
  const body = lines.join('\n');
  return `${body}\nAccessed via ${PROJECT_NAME}, ${accessed}.\n${stableUrl(state)}`;
}

// "Cite this view" UI: a small inline button that opens a popover.
export function attachCiteButton(host, getState) {
  const btn = document.createElement('button');
  btn.className = 'cite-btn';
  btn.textContent = 'Cite this view';

  const pop = document.createElement('div');
  pop.className = 'cite-popover';
  pop.style.display = 'none';
  // Accessibility (UX2 E.2): the popover is a labelled, dismissible dialog.
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'true');
  pop.setAttribute('aria-label', 'Cite this view');

  // Citation builder: comparison view enumerates every series; single view
  // uses the per-variable template.
  function citationFor(state, fmt) {
    const isCompare = Array.isArray(state.compareIds) && state.compareIds.length;
    if (isCompare) return buildComparisonCitation(state, fmt);
    const meta = M.byId(state.variable);
    return meta ? buildCitation(meta, state, fmt) : '';
  }

  function render() {
    const state = getState();
    if (!state.variable || !M.byId(state.variable)) {
      pop.innerHTML = `<div class="cite-empty">Select a variable first.</div>`;
      return;
    }
    const apa = citationFor(state, 'apa');
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
      </div>
    `;
    pop.querySelectorAll('.cite-tab').forEach(t => t.addEventListener('click', () => {
      pop.querySelectorAll('.cite-tab').forEach(x => x.classList.toggle('is-active', x === t));
      const fmt = t.dataset.fmt;
      pop.querySelector('.cite-body').dataset.current = fmt;
      pop.querySelector('.cite-body').textContent = citationFor(state, fmt);
    }));
    pop.querySelector('.cite-copy').addEventListener('click', async () => {
      const txt = pop.querySelector('.cite-body').textContent;
      try { await navigator.clipboard.writeText(txt); pop.querySelector('.cite-copy').textContent = 'Copied'; setTimeout(() => pop.querySelector('.cite-copy').textContent = 'Copy', 1500); } catch {}
    });
    pop.querySelector('.cite-close').addEventListener('click', closePopover);
  }

  function openPopover() {
    render();
    pop.style.display = 'block';
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onOutsideClick, true);
    // Move focus into the dialog (the close button is a safe first stop).
    const focusTarget = pop.querySelector('.cite-close');
    if (focusTarget) focusTarget.focus();
  }

  function closePopover() {
    if (pop.style.display === 'none') return;
    pop.style.display = 'none';
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onOutsideClick, true);
    // Return focus to the trigger so keyboard context is not lost (E.2).
    btn.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closePopover(); }
  }
  function onOutsideClick(e) {
    if (pop.contains(e.target) || e.target === btn) return;
    closePopover();
  }

  btn.addEventListener('click', () => {
    if (pop.style.display === 'none') openPopover();
    else                              closePopover();
  });

  host.appendChild(btn);
  host.appendChild(pop);
  return { rerender: render };
}
