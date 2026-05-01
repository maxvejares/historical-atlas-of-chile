// Header. Project title is "Historical Atlas of Chile" (final). Date range
// rendered in Fraunces small caps, muted ink, em-spaced em-dash separator.
// Author and institutional credits live in the footer per the brief.
export const PROJECT_NAME = "Historical Atlas of Chile";
export const PROJECT_NAME_CITATION = "Historical Atlas of Chile"; // italicized in citations downstream

export function createHeader(host) {
  host.classList.add('site-header');
  host.innerHTML = `
    <div class="inner">
      <a class="mark" href="#">
        <span class="mark-name">${PROJECT_NAME}</span>
        <span class="mark-sub">1845&#8201;&#8212;&#8201;1995</span>
      </a>
      <nav>
        <a href="#topics">Topics</a>
        <a href="#sources">Sources</a>
        <a href="AUDIT.md">Methodology</a>
        <a href="data/chile_master_data.csv">Data</a>
        <a href="#about">About</a>
      </nav>
    </div>
  `;
}
