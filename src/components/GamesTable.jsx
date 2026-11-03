export function GamesTable({ games, caption }) {
  return (
    <div className="card">
      <div className="card-bar" aria-hidden="true" />
      <div className="table-scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Game</th>
              <th scope="col">Team size</th>
              <th scope="col">Total teams</th>
              <th scope="col" className="num">
                Winner
              </th>
              <th scope="col" className="num">
                Runner-up
              </th>
            </tr>
          </thead>
          <tbody>
            {games.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-load-error">
                  No games yet.
                </td>
              </tr>
            ) : (
              games.map((g) => (
                <tr key={g.id}>
                  <td className="game">{g.name}</td>
                  <td>{g.team_size}</td>
                  <td>{g.teams_label}</td>
                  <td className="num points-winner">{g.winner_points}</td>
                  <td className="num points-runner">{g.runner_up_points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
