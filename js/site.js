const SECTION_LINKS = [
  { id: "outdoor", href: "index.html", label: "Outdoor" },
  { id: "indoor", href: "indoor.html", label: "Indoor" },
  { id: "points", href: "points.html", label: "Points table" },
  { id: "standings", href: "house-standings.html", label: "House standings" },
];

function renderSectionNav(activeId) {
  const items = SECTION_LINKS.map(
    ({ id, href, label }) => `
    <li class="tab" role="presentation">
      <a class="tab-link${id === activeId ? " is-active" : ""}" href="${href}"${id === activeId ? ' aria-current="page"' : ""}>${label}</a>
    </li>`
  ).join("");

  return `
    <nav class="section-nav" aria-label="Score card sections">
      <ul class="tablist" role="list">${items}</ul>
    </nav>`;
}

async function mountPublicTable(view, mount) {
  try {
    mount.innerHTML = await window.GameOnData.loadPublicView(view);
  } catch (err) {
    console.error(err);
    mount.innerHTML = `<p class="table-load-error">Could not load data. Check Supabase config or use a local server for static tables.</p>`;
  }
}

async function initPage(config) {
  const root = document.getElementById("app");
  if (!root) return;

  document.title = `${config.pageTitle} · DLC Gaming Club`;

  root.innerHTML = `
    <header class="topbar">
      <a class="brand" href="index.html" aria-label="DLC Gaming Club home">
        <span class="brand-mark" aria-hidden="true">DLC</span>
        <span class="brand-text">
          <span class="brand-sub">dubizzlelabs</span>
          <span class="brand-title">GAMING CLUB</span>
        </span>
      </a>
      <nav class="topbar-nav" aria-label="Primary">
        <a class="btn-outline" href="https://github.com/dlcsports">Events</a>
        <span class="btn-outline is-active" aria-current="page">Score card</span>
        <a class="btn-outline" href="admin/">Admin</a>
      </nav>
    </header>

    <section class="hero">
      <p class="hero-kicker">Play · Compete · Connect</p>
      <h1>Game On</h1>
      <p class="hero-desc">Outdoor &amp; indoor results, placement points, and house standings.</p>
    </section>

    ${renderSectionNav(config.navId)}

    <h2 class="section-head">${config.heading}</h2>
    <p class="panel-intro">${config.intro}</p>

    <div class="card">
      <div class="card-bar" aria-hidden="true"></div>
      <div class="table-scroll" id="table-mount"></div>
    </div>

    ${
      config.showLegend
        ? `<div class="legend" aria-hidden="true">
      <span><i class="swatch swatch--winner"></i> Winner points</span>
      <span><i class="swatch swatch--runner"></i> Runner-up points</span>
    </div>`
        : ""
    }

    <footer>
      <strong>DLC | dubizzlelabs Gaming Club</strong> · Game On score card
    </footer>`;

  await mountPublicTable(config.view, document.getElementById("table-mount"));
}

const configEl = document.getElementById("page-config");
if (configEl) {
  initPage(JSON.parse(configEl.textContent));
}
