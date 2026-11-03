import { Link, NavLink } from "react-router-dom";

const SECTIONS = [
  { to: "/", label: "Outdoor", end: true },
  { to: "/indoor", label: "Indoor" },
  { to: "/points", label: "Points table" },
  { to: "/house-standings", label: "House standings" },
];

export function Layout({ children, heroTitle = "Game On", heroDesc, adminActive }) {
  return (
    <div className="page">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="DLC Gaming Club home">
          <span className="brand-mark" aria-hidden="true">
            DLC
          </span>
          <span className="brand-text">
            <span className="brand-sub">dubizzlelabs</span>
            <span className="brand-title">GAMING CLUB</span>
          </span>
        </Link>
        <nav className="topbar-nav" aria-label="Primary">
          <a className="btn-outline" href="https://github.com/dlcsports">
            Events
          </a>
          {!adminActive && (
            <span className="btn-outline is-active" aria-current="page">
              Score card
            </span>
          )}
          <Link className={`btn-outline${adminActive ? " is-active" : ""}`} to="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <section className="hero">
        <p className="hero-kicker">Play · Compete · Connect</p>
        <h1>{heroTitle}</h1>
        {heroDesc && <p className="hero-desc">{heroDesc}</p>}
      </section>

      {!adminActive && (
        <nav className="section-nav" aria-label="Score card sections">
          <ul className="tablist" role="list">
            {SECTIONS.map(({ to, label, end }) => (
              <li className="tab" key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => `tab-link${isActive ? " is-active" : ""}`}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {children}

      <footer>
        <strong>DLC | dubizzlelabs Gaming Club</strong> · Game On score card
      </footer>
    </div>
  );
}
