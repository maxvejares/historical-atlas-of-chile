// Tool-first researcher hero. Two-column layout with the Lira painting
// to the right; full-color, hairline border, no parallax / no filters.

import * as M from './manifest.js';

export function createHero(host) {
  const counts = M.topicCounts();
  const nVars = Object.values(counts).reduce((a, b) => a + b, 0);
  const nTopics = Object.keys(counts).length;
  const indicatorClaim = Math.floor(nVars / 10) * 10 + "+";
  const sc = M.scope();
  const stats = M.stats();
  const yMin = (sc && sc.start) ?? (stats && stats.year_range && stats.year_range[0]);
  const yMax = (sc && sc.end)   ?? (stats && stats.year_range && stats.year_range[1]);
  const span = (yMin != null && yMax != null) ? `${yMin}–${yMax}` : '';

  host.classList.add('hero');
  host.innerHTML = `
    <div class="hero-text">
      <div class="kicker">Chile · ${span}</div>
      <h1>Explore Chile's economic, political, and social history through <em>data</em>.</h1>
      <p class="pillars">A century and a half of Chilean records. Browse, compare, visualize, download.</p>
      <p class="blurb">Department, province, and national series compiled from over a dozen historical Chilean sources. ${indicatorClaim} indicators across ${nTopics} topics, free to use for research, journalism, or teaching.</p>
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
