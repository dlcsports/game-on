(function () {
  const root = document.getElementById("admin-app");
  let flashTimer;
  let section = "games-outdoor";
  let gameFilter = "outdoor";

  function esc(s) {
    return window.GameOnData.escapeHtml(s);
  }

  function showFlash(message, type) {
    clearTimeout(flashTimer);
    const el = document.getElementById("admin-flash");
    if (!el) return;
    el.className = `admin-flash admin-flash--${type}`;
    el.textContent = message;
    el.hidden = false;
    flashTimer = setTimeout(() => {
      el.hidden = true;
    }, 4500);
  }

  function shell(content) {
    return `
      <header class="topbar">
        <a class="brand" href="../index.html" aria-label="Back to score card">
          <span class="brand-mark" aria-hidden="true">DLC</span>
          <span class="brand-text">
            <span class="brand-sub">dubizzlelabs</span>
            <span class="brand-title">GAMING CLUB</span>
          </span>
        </a>
        <nav class="topbar-nav" aria-label="Primary">
          <a class="btn-outline" href="../index.html">Score card</a>
          <span class="btn-outline is-active" aria-current="page">Admin</span>
        </nav>
      </header>
      <section class="hero">
        <p class="hero-kicker">Play · Compete · Connect</p>
        <h1>Admin</h1>
        <p class="hero-desc">Manage games, points, and house standings in Supabase.</p>
      </section>
      <div id="admin-flash" class="admin-flash" hidden></div>
      ${content}
      <footer>
        <strong>DLC | dubizzlelabs Gaming Club</strong> · Admin panel
      </footer>`;
  }

  function loginView(loginError) {
    root.innerHTML = shell(`
      <div class="login-card">
        <h2 class="section-head" style="margin-bottom:1rem;font-size:1.5rem">Admin sign in</h2>
        <p class="admin-meta">Sign in with your Supabase Auth email. Your user must exist in <code>admin_profiles</code> (see <code>supabase/admin-first-user.sql</code>).</p>
        ${loginError ? `<p class="admin-flash admin-flash--error" role="alert">${esc(loginError)}</p>` : ""}
        <form id="login-form">
          <label>Email
            <input type="email" name="email" required autocomplete="username" />
          </label>
          <label>Password
            <input type="password" name="password" required autocomplete="current-password" />
          </label>
          <button type="submit" class="btn-solid" id="login-submit">Sign in</button>
        </form>
      </div>`);

    document.getElementById("login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("login-submit");
      const fd = new FormData(e.target);
      btn.disabled = true;
      btn.textContent = "Signing in…";
      try {
        const user = await window.GameOnAdmin.signIn(fd.get("email"), fd.get("password"));
        const ok = await window.GameOnAdmin.isAdminUser(user);
        if (!ok) {
          await window.GameOnAdmin.signOut();
          loginView("This account is not an admin. Ask an owner to add you to admin_profiles.");
          return;
        }
        await renderDashboard(user);
      } catch (err) {
        loginView(err.message || "Sign in failed.");
      } finally {
        if (btn.isConnected) {
          btn.disabled = false;
          btn.textContent = "Sign in";
        }
      }
    });
  }

  function notConfiguredView() {
    root.innerHTML = shell(`
      <p class="table-load-error">Copy <code>js/config.example.js</code> to <code>js/config.js</code> and add your Supabase URL and anon key.</p>
      <p class="admin-meta"><a href="../index.html">← Back to score card</a></p>`);
  }

  function sidebarItems() {
    const items = [
      { id: "games-outdoor", label: "Outdoor games" },
      { id: "games-indoor", label: "Indoor games" },
      { id: "games-all", label: "All games" },
      { id: "houses", label: "House standings" },
    ];
    return items
      .map(
        (item) =>
          `<li><button type="button" data-section="${item.id}" class="${section === item.id ? "is-active" : ""}">${item.label}</button></li>`
      )
      .join("");
  }

  function gamesTableRows(games) {
    return games
      .map(
        (g) => `
      <tr data-id="${g.id}">
        <td><input name="name" value="${esc(g.name)}" /></td>
        <td><input name="team_size" value="${esc(g.team_size)}" /></td>
        <td><input name="teams_label" value="${esc(g.teams_label)}" /></td>
        <td><input name="winner_points" type="number" min="0" value="${g.winner_points}" /></td>
        <td><input name="runner_up_points" type="number" min="0" value="${g.runner_up_points}" /></td>
        <td>
          <select name="category">
            <option value="outdoor"${g.category === "outdoor" ? " selected" : ""}>Outdoor</option>
            <option value="indoor"${g.category === "indoor" ? " selected" : ""}>Indoor</option>
          </select>
        </td>
        <td><input name="sort_order" type="number" value="${g.sort_order}" style="width:4rem" /></td>
        <td class="row-actions">
          <button type="button" class="btn-solid btn-save-game">Save</button>
          <button type="button" class="btn-danger btn-del-game">Delete</button>
        </td>
      </tr>`
      )
      .join("");
  }

  function housesTableRows(houses) {
    return houses
      .map(
        (h) => `
      <tr data-id="${h.id}">
        <td><input name="name" value="${esc(h.name)}" /></td>
        <td><input name="outdoor_points" type="number" min="0" value="${h.outdoor_points}" /></td>
        <td><input name="indoor_points" type="number" min="0" value="${h.indoor_points}" /></td>
        <td class="num">${h.outdoor_points + h.indoor_points}</td>
        <td><input name="sort_order" type="number" value="${h.sort_order}" style="width:4rem" /></td>
        <td class="row-actions">
          <button type="button" class="btn-solid btn-save-house">Save</button>
          <button type="button" class="btn-danger btn-del-house">Delete</button>
        </td>
      </tr>`
      )
      .join("");
  }

  async function renderGamesPanel(user) {
    const filter =
      section === "games-indoor" ? "indoor" : section === "games-outdoor" ? "outdoor" : null;
    gameFilter = filter || "outdoor";
    const title =
      section === "games-indoor"
        ? "Indoor games"
        : section === "games-outdoor"
          ? "Outdoor games"
          : "All games";

    const games = await window.GameOnAdmin.listGames(filter);

    document.getElementById("admin-main").innerHTML = `
      <div class="admin-toolbar">
        <h2>${title}</h2>
        <div class="admin-actions">
          <button type="button" class="btn-solid" id="btn-add-game">Add game</button>
        </div>
      </div>
      <div class="card">
        <div class="card-bar"></div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Team size</th>
                <th>Teams</th>
                <th class="num">Winner</th>
                <th class="num">Runner-up</th>
                <th>Category</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="games-body">${gamesTableRows(games)}</tbody>
          </table>
        </div>
      </div>`;

    document.getElementById("btn-add-game").addEventListener("click", () => {
      const tbody = document.getElementById("games-body");
      const cat = filter || "outdoor";
      const tr = document.createElement("tr");
      tr.dataset.id = "";
      tr.innerHTML = `
        <td><input name="name" placeholder="Game name" /></td>
        <td><input name="team_size" placeholder="6 players" /></td>
        <td><input name="teams_label" placeholder="15 teams" /></td>
        <td><input name="winner_points" type="number" min="0" value="0" /></td>
        <td><input name="runner_up_points" type="number" min="0" value="0" /></td>
        <td>
          <select name="category">
            <option value="outdoor"${cat === "outdoor" ? " selected" : ""}>Outdoor</option>
            <option value="indoor"${cat === "indoor" ? " selected" : ""}>Indoor</option>
          </select>
        </td>
        <td><input name="sort_order" type="number" value="0" style="width:4rem" /></td>
        <td class="row-actions">
          <button type="button" class="btn-solid btn-save-game">Save</button>
        </td>`;
      tbody.prepend(tr);
    });

    bindGameRowActions(user);
  }

  async function renderHousesPanel(user) {
    const houses = await window.GameOnAdmin.listHouses();
    document.getElementById("admin-main").innerHTML = `
      <div class="admin-toolbar">
        <h2>House standings</h2>
        <div class="admin-actions">
          <button type="button" class="btn-solid" id="btn-add-house">Add house</button>
        </div>
      </div>
      <div class="card">
        <div class="card-bar"></div>
        <div class="table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>House</th>
                <th class="num">Outdoor pts</th>
                <th class="num">Indoor pts</th>
                <th class="num">Total</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="houses-body">${housesTableRows(houses)}</tbody>
          </table>
        </div>
      </div>`;

    document.getElementById("btn-add-house").addEventListener("click", () => {
      const tbody = document.getElementById("houses-body");
      const tr = document.createElement("tr");
      tr.dataset.id = "";
      tr.innerHTML = `
        <td><input name="name" placeholder="House name" /></td>
        <td><input name="outdoor_points" type="number" min="0" value="0" /></td>
        <td><input name="indoor_points" type="number" min="0" value="0" /></td>
        <td class="num">0</td>
        <td><input name="sort_order" type="number" value="0" style="width:4rem" /></td>
        <td class="row-actions">
          <button type="button" class="btn-solid btn-save-house">Save</button>
        </td>`;
      tbody.prepend(tr);
    });

    bindHouseRowActions(user);
  }

  function validateGame(payload) {
    if (!payload.name?.trim()) return "Game name is required.";
    if (!payload.team_size?.trim()) return "Team size is required.";
    if (!payload.teams_label?.trim()) return "Teams label is required.";
    if (Number(payload.winner_points) < 0 || Number.isNaN(Number(payload.winner_points))) {
      return "Winner points must be a non-negative number.";
    }
    return null;
  }

  function validateHouse(payload) {
    if (!payload.name?.trim()) return "House name is required.";
    return null;
  }

  function rowPayload(tr) {
    const get = (name) => tr.querySelector(`[name="${name}"]`)?.value;
    return {
      id: tr.dataset.id || null,
      name: get("name"),
      team_size: get("team_size"),
      teams_label: get("teams_label"),
      winner_points: get("winner_points"),
      runner_up_points: get("runner_up_points"),
      category: get("category"),
      sort_order: get("sort_order"),
    };
  }

  function housePayload(tr) {
    const get = (name) => tr.querySelector(`[name="${name}"]`)?.value;
    return {
      id: tr.dataset.id || null,
      name: get("name"),
      outdoor_points: get("outdoor_points"),
      indoor_points: get("indoor_points"),
      sort_order: get("sort_order"),
    };
  }

  function bindGameRowActions() {
    document.querySelectorAll(".btn-save-game").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        try {
          const payload = rowPayload(tr);
          const errMsg = validateGame(payload);
          if (errMsg) {
            showFlash(errMsg, "error");
            return;
          }
          btn.disabled = true;
          const id = await window.GameOnAdmin.saveGame(payload);
          tr.dataset.id = id;
          showFlash("Game saved — changes appear on the public score card.", "ok");
        } catch (err) {
          showFlash(err.message || "Save failed.", "error");
        } finally {
          btn.disabled = false;
        }
      });
    });
    document.querySelectorAll(".btn-del-game").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        const id = tr.dataset.id;
        if (!id) {
          tr.remove();
          return;
        }
        if (!confirm("Delete this game?")) return;
        try {
          await window.GameOnAdmin.deleteGame(id);
          tr.remove();
          showFlash("Game deleted.", "ok");
        } catch (err) {
          showFlash(err.message || "Delete failed.", "error");
        }
      });
    });
  }

  function bindHouseRowActions() {
    document.querySelectorAll(".btn-save-house").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        try {
          const payload = housePayload(tr);
          const errMsg = validateHouse(payload);
          if (errMsg) {
            showFlash(errMsg, "error");
            return;
          }
          btn.disabled = true;
          const id = await window.GameOnAdmin.saveHouse(payload);
          tr.dataset.id = id;
          const totalCell = tr.querySelector("td.num");
          if (totalCell && !totalCell.querySelector("input")) {
            const o = Number(tr.querySelector('[name="outdoor_points"]').value) || 0;
            const i = Number(tr.querySelector('[name="indoor_points"]').value) || 0;
            totalCell.textContent = o + i;
          }
          showFlash("House saved — standings update on the public site.", "ok");
        } catch (err) {
          showFlash(err.message || "Save failed.", "error");
        } finally {
          btn.disabled = false;
        }
      });
    });
    document.querySelectorAll(".btn-del-house").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tr = btn.closest("tr");
        const id = tr.dataset.id;
        if (!id) {
          tr.remove();
          return;
        }
        if (!confirm("Delete this house?")) return;
        try {
          await window.GameOnAdmin.deleteHouse(id);
          tr.remove();
          showFlash("House deleted.", "ok");
        } catch (err) {
          showFlash(err.message || "Delete failed.", "error");
        }
      });
    });
  }

  async function renderDashboard(user) {
    root.innerHTML = shell(`
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <h2>Sections</h2>
          <ul class="admin-menu" id="admin-menu">${sidebarItems()}</ul>
          <p class="admin-user">${esc(user.email)}</p>
          <button type="button" class="btn-ghost" id="btn-sign-out" style="width:100%;margin-top:0.5rem">Sign out</button>
        </aside>
        <div class="admin-main" id="admin-main"></div>
      </div>`);

    document.getElementById("admin-menu").addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-section]");
      if (!btn) return;
      section = btn.dataset.section;
      document.querySelectorAll("#admin-menu button").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.section === section);
      });
      await loadSection(user);
    });

    document.getElementById("btn-sign-out").addEventListener("click", async () => {
      await window.GameOnAdmin.signOut();
      loginView();
    });

    document.getElementById("admin-main").addEventListener("input", (e) => {
      const tr = e.target.closest("tr");
      if (!tr || !e.target.matches('[name="outdoor_points"], [name="indoor_points"]')) return;
      const totalCell = tr.querySelector("td.num");
      if (!totalCell || totalCell.querySelector("input")) return;
      const o = Number(tr.querySelector('[name="outdoor_points"]')?.value) || 0;
      const i = Number(tr.querySelector('[name="indoor_points"]')?.value) || 0;
      totalCell.textContent = o + i;
    });

    await loadSection(user);
  }

  async function loadSection(user) {
    if (section === "houses") {
      await renderHousesPanel(user);
    } else {
      await renderGamesPanel(user);
    }
  }

  async function boot() {
    if (!window.GameOnSupabase.isConfigured()) {
      notConfiguredView();
      return;
    }

    root.innerHTML = shell(`<p class="admin-meta" style="text-align:center">Loading session…</p>`);

    try {
      const user = await window.GameOnAdmin.getSessionUser();
      if (!user) {
        loginView();
        return;
      }

      const ok = await window.GameOnAdmin.isAdminUser(user);
      if (!ok) {
        await window.GameOnAdmin.signOut();
        loginView("This account is not an admin.");
        return;
      }

      await renderDashboard(user);
    } catch (err) {
      loginView(err.message || "Could not start admin panel.");
    }
  }

  boot();
})();
