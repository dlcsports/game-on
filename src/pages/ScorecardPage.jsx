import { useEffect, useState } from "react";
import { Layout } from "../components/Layout.jsx";
import { GamesTable } from "../components/GamesTable.jsx";
import { StandingsTable } from "../components/StandingsTable.jsx";
import { fetchGames, fetchHouses } from "../lib/data.js";
import { isSupabaseConfigured } from "../lib/supabase.js";

export function ScorecardPage({ variant }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const meta = {
    outdoor: {
      heading: "Outdoor",
      intro: "Cricket, futsal, padel, and badminton — team sizes and placement points.",
      caption: "Outdoor games — placement points",
      category: "outdoor",
    },
    indoor: {
      heading: "Indoor",
      intro: "Table tennis, foosball, carrom, and chess — team sizes and placement points.",
      caption: "Indoor games — placement points",
      category: "indoor",
    },
    points: {
      heading: "Points table",
      intro: "Full score card for every Game On sport and game.",
      caption: "Full Game On score card",
      category: null,
    },
    standings: {
      heading: "House standings",
      intro: "Combined points across outdoor and indoor events. Updated as results are confirmed.",
    },
  }[variant];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!isSupabaseConfigured) {
          throw new Error("Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env");
        }
        if (variant === "standings") {
          const houses = await fetchHouses();
          if (!cancelled) setData({ houses });
        } else {
          const games = await fetchGames(meta.category);
          if (!cancelled) setData({ games });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [variant, meta.category]);

  return (
    <Layout heroDesc="Outdoor & indoor results, placement points, and house standings.">
      <h2 className="section-head">{meta.heading}</h2>
      <p className="panel-intro">{meta.intro}</p>

      {loading && <p className="admin-meta">Loading…</p>}
      {error && <p className="admin-flash admin-flash--error">{error}</p>}

      {!loading && !error && variant === "standings" && (
        <StandingsTable houses={data.houses} />
      )}
      {!loading && !error && variant !== "standings" && (
        <>
          <GamesTable games={data.games} caption={meta.caption} />
          {variant === "points" && (
            <div className="legend" aria-hidden="true">
              <span>
                <i className="swatch swatch--winner" /> Winner points
              </span>
              <span>
                <i className="swatch swatch--runner" /> Runner-up points
              </span>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
