import { fmtPoints, sortHouses } from "../lib/data.js";

export function StandingsTable({ houses }) {
  const sorted = sortHouses(houses);

  return (
    <div className="card">
      <div className="card-bar" aria-hidden="true" />
      <div className="table-scroll">
        <table>
          <caption>Game On house standings</caption>
          <thead>
            <tr>
              <th scope="col" className="num">
                Rank
              </th>
              <th scope="col">House</th>
              <th scope="col" className="num">
                Total
              </th>
              <th scope="col" className="num">
                Outdoor
              </th>
              <th scope="col" className="num">
                Indoor
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-load-error">
                  No houses yet.
                </td>
              </tr>
            ) : (
              sorted.map((h, i) => {
                const total = h.outdoor_points + h.indoor_points;
                const leader = i === 0 && total > 0;
                return (
                  <tr key={h.id} className={leader ? "leader" : ""}>
                    <td className="rank num">{i + 1}</td>
                    <td className="house-name">{h.name}</td>
                    <td className="num total-points">{fmtPoints(total)}</td>
                    <td className="num">{fmtPoints(h.outdoor_points)}</td>
                    <td className="num">{fmtPoints(h.indoor_points)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
