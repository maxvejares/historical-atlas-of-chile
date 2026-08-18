// Tool-first researcher hero. Two-column layout with the Lira painting
// to the right; full-color, hairline border, no parallax / no filters.

import * as M from './manifest.js';

export function createHero(host) {
  const counts = M.topicCounts();
  const nTopics = Object.keys(counts).length;
  const stats = M.stats() || {};
  // One indicator counter for the whole site: dataset_stats.n_variables_total,
  // recomputed from the post-curation manifest (browse-visible entries) by
  // regenerate_ui_data.py Step D4. The hero used to sum topicCounts() while
  // the Downloads card read a pre-curation stats file, so the page disagreed
  // with itself (1,033 vs 1,032, against a manifest of 1,036).
  const indicatorClaim = stats.n_variables_total != null
    ? stats.n_variables_total.toLocaleString('en-US')
    : Object.values(counts).reduce((a, b) => a + b, 0).toLocaleString('en-US');
  const nSources = stats.n_source_documents != null
    ? stats.n_source_documents.toLocaleString('en-US') : 'many';
  const levelText = M.scaleListText() || 'national, department, and province';
  const sc = M.scope();
  const yMin = (sc && sc.start) ?? (stats && stats.year_range && stats.year_range[0]);
  const yMax = (sc && sc.end)   ?? (stats && stats.year_range && stats.year_range[1]);
  const span = (yMin != null && yMax != null) ? `${yMin}–${yMax}` : '';

  host.classList.add('hero');
  host.innerHTML = `
    <div class="hero-text">
      <div class="kicker">Chile · ${span}</div>
      <h1>Explore Chile's economic, political, and social history through <em>data</em>.</h1>
      <p class="pillars">A century and a half of Chilean records. Browse, compare, visualize, download.</p>
      <p class="blurb">Series at the ${levelText} level, compiled from ${nSources} historical Chilean sources. ${indicatorClaim} indicators across ${nTopics} topics, free to use for research, journalism, or teaching.</p>
    </div>
    <figure class="hero-figure">
      <img
        src="images/lira_paisaje_800.jpg"
        srcset="images/lira_paisaje_400.jpg 400w, images/lira_paisaje_800.jpg 800w, images/lira_paisaje.jpg 915w"
        sizes="(max-width: 1023px) 100vw, 480px"
        width="480" height="293"
        alt="Painting by Pedro Lira (1845–1912) showing the Chilean central valley with cattle in the foreground and the Andes cordillera in the background."
        loading="eager"
      >
      <figcaption>Pedro Lira (1845–1912), <em>Paisaje con cordillera y vacunos</em>. Public domain. Image: Museo Nacional de Bellas Artes (MNBA), Santiago.</figcaption>
    </figure>
  `;
}
