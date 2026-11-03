import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout.jsx";
import {
  deleteGame,
  deleteHouse,
  fetchGames,
  fetchHouses,
  isAdminUser,
  saveGame,
  saveHouse,
} from "../lib/data.js";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

const SECTIONS = [
  { id: "outdoor", label: "Outdoor games", filter: "outdoor" },
  { id: "indoor", label: "Indoor games", filter: "indoor" },
  { id: "all", label: "All games", filter: null },
  { id: "houses", label: "House standings", filter: "houses" },
];

function emptyGame(category) {
  return {
    id: "",
    name: "",
    team_size: "",
    teams_label: "",
    winner_points: 0,
    runner_up_points: 0,
    category: category || "outdoor",
    sort_order: 0,
  };
}

function emptyHouse() {
  return { id: "", name: "", outdoor_points: 0, indoor_points: 0, sort_order: 0 };
}

export function AdminPage() {
  const [user, setUser] = useState(null);
  const [adminOk, setAdminOk] = useState(false);
  const [booting, setBooting] = useState(true);
  const [section, setSection] = useState("outdoor");
  const [flash, setFlash] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const [games, setGames] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);

  const showFlash = (message, type) => {
    setFlash({ message, type });
    setTimeout(() => setFlash(null), 4500);
  };

  const refresh = useCallback(async () => {
    if (!adminOk) return;
    setLoading(true);
    try {
      if (section === "houses") {
        setHouses(await fetchHouses());
      } else {
        const filter = section === "indoor" ? "indoor" : section === "outdoor" ? "outdoor" : null;
        setGames(await fetchGames(filter));
      }
    } catch (e) {
      showFlash(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [adminOk, section]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBooting(false);
      return;
    }
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUser(u);
      if (u) {
        try {
          setAdminOk(await isAdminUser(u));
        } catch {
          setAdminOk(false);
        }
      }
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    const fd = new FormData(e.target);
    const email = fd.get("email");
    const password = fd.get("password");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
      return;
    }
    const ok = await isAdminUser(data.user);
    if (!ok) {
      await supabase.auth.signOut();
      setLoginError("This account is not an admin.");
      return;
    }
    setAdminOk(true);
    setUser(data.user);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdminOk(false);
    setUser(null);
  }

  if (!isSupabaseConfigured) {
    return (
      <Layout adminActive heroTitle="Admin" heroDesc="Manage games and house standings.">
        <p className="table-load-error">
          Copy <code>.env.example</code> to <code>.env</code> and set VITE_SUPABASE_* variables.
        </p>
        <p className="admin-meta">
          <Link to="/">← Score card</Link>
        </p>
      </Layout>
    );
  }

  if (booting) {
    return (
      <Layout adminActive heroTitle="Admin" heroDesc="Manage games and house standings.">
        <p className="admin-meta">Loading session…</p>
      </Layout>
    );
  }

  if (!user || !adminOk) {
    return (
      <Layout adminActive heroTitle="Admin" heroDesc="Sign in to edit Supabase data.">
        <div className="login-card">
          <h2 className="section-head" style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>
            Admin sign in
          </h2>
          {loginError && (
            <p className="admin-flash admin-flash--error" role="alert">
              {loginError}
            </p>
          )}
          <form onSubmit={handleLogin}>
            <label>
              Email
              <input type="email" name="email" required autoComplete="username" />
            </label>
            <label>
              Password
              <input type="password" name="password" required autoComplete="current-password" />
            </label>
            <button type="submit" className="btn-solid">
              Sign in
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout adminActive heroTitle="Admin" heroDesc="Changes save to Supabase and appear on the score card.">
      {flash && (
        <div className={`admin-flash admin-flash--${flash.type}`} role="status">
          {flash.message}
        </div>
      )}

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <h2>Sections</h2>
          <ul className="admin-menu">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={section === s.id ? "is-active" : ""}
                  onClick={() => setSection(s.id)}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="admin-user">{user.email}</p>
          <button type="button" className="btn-ghost" style={{ width: "100%", marginTop: "0.5rem" }} onClick={signOut}>
            Sign out
          </button>
        </aside>

        <div className="admin-main">
          {loading && <p className="admin-meta">Loading…</p>}
          {section !== "houses" && (
            <GamesAdmin
              games={games}
              section={section}
              onSave={async (row) => {
                await saveGame(row);
                showFlash("Game saved.", "ok");
                refresh();
              }}
              onDelete={async (id) => {
                if (!confirm("Delete this game?")) return;
                await deleteGame(id);
                showFlash("Game deleted.", "ok");
                refresh();
              }}
              onAdd={() => {
                const cat = section === "indoor" ? "indoor" : "outdoor";
                setGames([emptyGame(section === "all" ? "outdoor" : cat), ...games]);
              }}
            />
          )}
          {section === "houses" && (
            <HousesAdmin
              houses={houses}
              onSave={async (row) => {
                await saveHouse(row);
                showFlash("House saved.", "ok");
                refresh();
              }}
              onDelete={async (id) => {
                if (!confirm("Delete this house?")) return;
                await deleteHouse(id);
                showFlash("House deleted.", "ok");
                refresh();
              }}
              onAdd={() => setHouses([emptyHouse(), ...houses])}
            />
          )}
        </div>
      </div>
    </Layout>
  );
}

function GamesAdmin({ games, section, onSave, onDelete, onAdd }) {
  const title =
    section === "indoor" ? "Indoor games" : section === "outdoor" ? "Outdoor games" : "All games";

  return (
    <>
      <div className="admin-toolbar">
        <h2>{title}</h2>
        <button type="button" className="btn-solid" onClick={onAdd}>
          Add game
        </button>
      </div>
      <div className="card">
        <div className="card-bar" />
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Team size</th>
                <th>Teams</th>
                <th className="num">Winner</th>
                <th className="num">Runner-up</th>
                <th>Category</th>
                <th>Order</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {games.map((g, idx) => (
                <GameRow key={g.id || `new-${idx}`} game={g} onSave={onSave} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function GameRow({ game, onSave, onDelete }) {
  const [row, setRow] = useState(game);
  useEffect(() => setRow(game), [game]);

  const set = (field, value) => setRow((r) => ({ ...r, [field]: value }));

  return (
    <tr>
      <td>
        <input value={row.name} onChange={(e) => set("name", e.target.value)} />
      </td>
      <td>
        <input value={row.team_size} onChange={(e) => set("team_size", e.target.value)} />
      </td>
      <td>
        <input value={row.teams_label} onChange={(e) => set("teams_label", e.target.value)} />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={row.winner_points}
          onChange={(e) => set("winner_points", e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={row.runner_up_points}
          onChange={(e) => set("runner_up_points", e.target.value)}
        />
      </td>
      <td>
        <select value={row.category} onChange={(e) => set("category", e.target.value)}>
          <option value="outdoor">Outdoor</option>
          <option value="indoor">Indoor</option>
        </select>
      </td>
      <td>
        <input
          type="number"
          style={{ width: "4rem" }}
          value={row.sort_order}
          onChange={(e) => set("sort_order", e.target.value)}
        />
      </td>
      <td className="row-actions">
        <button type="button" className="btn-solid" onClick={() => onSave(row)}>
          Save
        </button>
        {row.id && (
          <button type="button" className="btn-danger" onClick={() => onDelete(row.id)}>
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

function HousesAdmin({ houses, onSave, onDelete, onAdd }) {
  return (
    <>
      <div className="admin-toolbar">
        <h2>House standings</h2>
        <button type="button" className="btn-solid" onClick={onAdd}>
          Add house
        </button>
      </div>
      <div className="card">
        <div className="card-bar" />
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>House</th>
                <th className="num">Outdoor</th>
                <th className="num">Indoor</th>
                <th className="num">Total</th>
                <th>Order</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {houses.map((h, idx) => (
                <HouseRow key={h.id || `new-${idx}`} house={h} onSave={onSave} onDelete={onDelete} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function HouseRow({ house, onSave, onDelete }) {
  const [row, setRow] = useState(house);
  useEffect(() => setRow(house), [house]);
  const total = Number(row.outdoor_points) + Number(row.indoor_points);

  return (
    <tr>
      <td>
        <input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={row.outdoor_points}
          onChange={(e) => setRow({ ...row, outdoor_points: e.target.value })}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          value={row.indoor_points}
          onChange={(e) => setRow({ ...row, indoor_points: e.target.value })}
        />
      </td>
      <td className="num">{total || "—"}</td>
      <td>
        <input
          type="number"
          style={{ width: "4rem" }}
          value={row.sort_order}
          onChange={(e) => setRow({ ...row, sort_order: e.target.value })}
        />
      </td>
      <td className="row-actions">
        <button type="button" className="btn-solid" onClick={() => onSave(row)}>
          Save
        </button>
        {row.id && (
          <button type="button" className="btn-danger" onClick={() => onDelete(row.id)}>
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}
