-- Optional seed (run after schema.sql). Safe to re-run with truncate if needed.

insert into public.games (name, team_size, teams_label, winner_points, runner_up_points, category, sort_order)
values
  ('Cricket', '6 players', '15 teams', 140, 70, 'outdoor', 1),
  ('Futsal', '6 players', '10 teams', 140, 70, 'outdoor', 2),
  ('Padel', '2 players', '20 teams', 60, 30, 'outdoor', 3),
  ('Badminton', '2 players', '20 teams', 60, 30, 'outdoor', 4),
  ('Table Tennis', '4 players', '16 teams', 80, 40, 'indoor', 1),
  ('Foosball', '2 players', '30 teams', 50, 25, 'indoor', 2),
  ('Carrom', '2 players', '12 teams', 40, 20, 'indoor', 3),
  ('Chess', '1 player', '20 players', 50, 25, 'indoor', 4);

insert into public.houses (name, outdoor_points, indoor_points, sort_order)
values
  ('House Phoenix', 0, 0, 1),
  ('House Falcon', 0, 0, 2),
  ('House Titan', 0, 0, 3),
  ('House Nova', 0, 0, 4);
