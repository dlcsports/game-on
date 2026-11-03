(function () {
  function fmtPoints(n) {
    if (n === 0 || n === null || n === undefined) return "—";
    return String(n);
  }

  function renderGamesTable(games, caption) {
    const rows = games
      .map(
        (g) => `
      <tr>
        <td class="game">${escapeHtml(g.name)}</td>
        <td>${escapeHtml(g.team_size)}</td>
        <td>${escapeHtml(g.teams_label)}</td>
        <td class="num points-winner">${g.winner_points}</td>
        <td class="num points-runner">${g.runner_up_points}</td>
      </tr>`
      )
      .join("");

    return `
      <table>
        <caption>${escapeHtml(caption)}</caption>
        <thead>
          <tr>
            <th scope="col">Game</th>
            <th scope="col">Team size</th>
            <th scope="col">Total teams</th>
            <th scope="col" class="num">Winner</th>
            <th scope="col" class="num">Runner-up</th>
          </tr>
        </thead>
        <tbody>${rows || emptyRow(5)}</tbody>
      </table>`;
  }

  function renderStandingsTable(houses) {
    const sorted = [...houses].sort((a, b) => {
      const totalA = a.outdoor_points + a.indoor_points;
      const totalB = b.outdoor_points + b.indoor_points;
      if (totalB !== totalA) return totalB - totalA;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

    const rows = sorted
      .map((h, i) => {
        const total = h.outdoor_points + h.indoor_points;
        const leader = i === 0 && total > 0 ? " leader" : "";
        return `
      <tr class="${leader.trim()}">
        <td class="rank num">${i + 1}</td>
        <td class="house-name">${escapeHtml(h.name)}</td>
        <td class="num total-points">${fmtPoints(total)}</td>
        <td class="num">${fmtPoints(h.outdoor_points)}</td>
        <td class="num">${fmtPoints(h.indoor_points)}</td>
      </tr>`;
      })
      .join("");

    return `
      <table>
        <caption>Game On house standings</caption>
        <thead>
          <tr>
            <th scope="col" class="num">Rank</th>
            <th scope="col">House</th>
            <th scope="col" class="num">Total</th>
            <th scope="col" class="num">Outdoor</th>
            <th scope="col" class="num">Indoor</th>
          </tr>
        </thead>
        <tbody>${rows || emptyRow(5)}</tbody>
      </table>`;
  }

  function emptyRow(cols) {
    return `<tr><td colspan="${cols}" class="table-load-error">No rows yet.</td></tr>`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function fetchGamesFromSupabase(category) {
    const client = window.GameOnSupabase.getClient();
    let q = client.from("games").select("*").order("sort_order", { ascending: true });
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function fetchHousesFromSupabase() {
    const client = window.GameOnSupabase.getClient();
    const { data, error } = await client
      .from("houses")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function fetchGamesStatic(category) {
    const path =
      category === "outdoor"
        ? "tables/outdoor.html"
        : category === "indoor"
          ? "tables/indoor.html"
          : "tables/points.html";
    const res = await fetch(path);
    if (!res.ok) throw new Error(res.statusText);
    return { html: await res.text() };
  }

  async function fetchStandingsStatic() {
    const res = await fetch("tables/house-standings.html");
    if (!res.ok) throw new Error(res.statusText);
    return { html: await res.text() };
  }

  async function loadPublicView(view) {
    const useDb = window.GameOnSupabase.isConfigured();

    if (view.type === "standings") {
      if (useDb) {
        const houses = await fetchHousesFromSupabase();
        return renderStandingsTable(houses);
      }
      const staticData = await fetchStandingsStatic();
      return staticData.html;
    }

    if (useDb) {
      const games = await fetchGamesFromSupabase(view.category || null);
      return renderGamesTable(games, view.caption);
    }

    const staticData = await fetchGamesStatic(view.category);
    return staticData.html;
  }

  window.GameOnData = {
    loadPublicView,
    renderGamesTable,
    renderStandingsTable,
    fetchGamesFromSupabase,
    fetchHousesFromSupabase,
    escapeHtml,
  };
})();
