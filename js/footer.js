// Footer carries author/lab/institution credit (only place NZIPL appears)
// and the basemap attribution. Per user, the rest of the platform reads
// without NZIPL framing — this is a side project.
const VERSION = "1.0";

export function createFooter(host, { lastUpdated } = {}) {
  const year = new Date().getFullYear();
  host.classList.add('site-footer');
  host.innerHTML = `
    <div class="inner">
      <div class="footer-credit">
        <div class="fc-author">Maximiliano Véjares</div>
        <div class="fc-lab">Net Zero Industrial Policy Lab · Johns Hopkins University</div>
        <div class="fc-email"><a href="mailto:maxvejares@jhu.edu">maxvejares@jhu.edu</a></div>
        <div class="fc-meta caption">${year} · v${VERSION} · Last updated ${lastUpdated || new Date().toISOString().slice(0,10)}</div>
      </div>
    </div>
  `;
}
