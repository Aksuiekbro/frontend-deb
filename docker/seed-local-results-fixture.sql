-- Dev-only local fixture for checking organizer Results and Statistics views.
--
-- Apply while the Docker stack is up:
--   docker exec -i debetter-postgres psql -U debetter_user -d debetter < docker/seed-local-results-fixture.sql
--
-- Login:
--   username = Tursymbayev
--   password = password123
--
-- Open:
--   http://localhost:3000/tournament/53

DO $$
DECLARE
  organizer_profile_id bigint;
BEGIN
  SELECT p.id INTO organizer_profile_id
  FROM profile p
  JOIN _user u ON u.id = p.user_id
  WHERE u.username = 'Tursymbayev'
  LIMIT 1;

  IF organizer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Run docker/seed-tursymbayev-edit-fixture.sql before this fixture.';
  END IF;

  UPDATE tournament
  SET description = 'Local fixture for checking organizer result entry, preliminary standings, speaker details, and win counts.',
      started = true,
      finished = false,
      disabled = false,
      main_organizer_id = organizer_profile_id
  WHERE id = 53;

  INSERT INTO user_tournament_role (user_id, tournament_id, role)
  VALUES (1001, 53, 'FULL')
  ON CONFLICT (tournament_id, user_id) DO UPDATE
    SET role = EXCLUDED.role;

  INSERT INTO club (id, name)
  VALUES
    (5301, 'Birminem Club'),
    (5302, 'Dorn Club'),
    (5303, 'Lunariya Club'),
    (5304, 'Narnia Club')
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name;

  INSERT INTO team (id, name, active, checked_in, disqualified, preliminary_score, club_id, tournament_id)
  VALUES
    (5301, 'Birminem', true, true, false, 303, 5301, 53),
    (5302, 'Dorn', true, true, false, 301, 5302, 53),
    (5303, 'Lunariya', true, true, false, 297, 5303, 53),
    (5304, 'Narnia', true, true, false, 291, 5304, 53)
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        active = EXCLUDED.active,
        checked_in = EXCLUDED.checked_in,
        disqualified = EXCLUDED.disqualified,
        preliminary_score = EXCLUDED.preliminary_score,
        club_id = EXCLUDED.club_id,
        tournament_id = EXCLUDED.tournament_id;

  INSERT INTO _user (id, username, password, email, first_name, last_name, role, created_at)
  VALUES
    (5311, 'fixture_arman', 'local-fixture-password-5311', 'fixture_arman@debetter.local', 'Arman', 'Armanov', 'PARTICIPANT', now()),
    (5312, 'fixture_aisha', 'local-fixture-password-5312', 'fixture_aisha@debetter.local', 'Aisha', 'Aishova', 'PARTICIPANT', now()),
    (5313, 'fixture_boris', 'local-fixture-password-5313', 'fixture_boris@debetter.local', 'Boris', 'Borisov', 'PARTICIPANT', now()),
    (5314, 'fixture_dana', 'local-fixture-password-5314', 'fixture_dana@debetter.local', 'Dana', 'Danova', 'PARTICIPANT', now()),
    (5315, 'fixture_sara', 'local-fixture-password-5315', 'fixture_sara@debetter.local', 'Sara', 'Sarina', 'PARTICIPANT', now()),
    (5316, 'fixture_miras', 'local-fixture-password-5316', 'fixture_miras@debetter.local', 'Miras', 'Mirasov', 'PARTICIPANT', now()),
    (5317, 'fixture_leila', 'local-fixture-password-5317', 'fixture_leila@debetter.local', 'Leila', 'Leilova', 'PARTICIPANT', now()),
    (5318, 'fixture_timur', 'local-fixture-password-5318', 'fixture_timur@debetter.local', 'Timur', 'Timurov', 'PARTICIPANT', now())
  ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        password = EXCLUDED.password,
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role;

  INSERT INTO profile (id, user_id)
  VALUES
    (5311, 5311),
    (5312, 5312),
    (5313, 5313),
    (5314, 5314),
    (5315, 5315),
    (5316, 5316),
    (5317, 5317),
    (5318, 5318)
  ON CONFLICT (id) DO UPDATE
    SET user_id = EXCLUDED.user_id;

  INSERT INTO participant_profile (id, rating)
  VALUES
    (5311, 0),
    (5312, 0),
    (5313, 0),
    (5314, 0),
    (5315, 0),
    (5316, 0),
    (5317, 0),
    (5318, 0)
  ON CONFLICT (id) DO UPDATE
    SET rating = EXCLUDED.rating;

  INSERT INTO tournament_participant (id, speaker_score, participant_profile_id, team_id)
  VALUES
    (5311, 153, 5311, 5301),
    (5312, 150, 5312, 5301),
    (5313, 151, 5313, 5302),
    (5314, 150, 5314, 5302),
    (5315, 149, 5315, 5303),
    (5316, 148, 5316, 5303),
    (5317, 145, 5317, 5304),
    (5318, 146, 5318, 5304)
  ON CONFLICT (id) DO UPDATE
    SET speaker_score = EXCLUDED.speaker_score,
        participant_profile_id = EXCLUDED.participant_profile_id,
        team_id = EXCLUDED.team_id;

  INSERT INTO judge (id, checked_in, email, full_name, phone_number, times_judged, tournament_id)
  VALUES
    (5301, true, 'judge1@debetter.local', 'Judge 1', null, 1, 53),
    (5302, true, 'judge2@debetter.local', 'Judge 2', null, 1, 53),
    (5303, true, 'judge3@debetter.local', 'Judge 3', null, 1, 53),
    (5304, true, 'judge4@debetter.local', 'Judge 4', null, 1, 53)
  ON CONFLICT (id) DO UPDATE
    SET checked_in = EXCLUDED.checked_in,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone_number = EXCLUDED.phone_number,
        times_judged = EXCLUDED.times_judged,
        tournament_id = EXCLUDED.tournament_id;

  INSERT INTO round_group (id, current_round_number, format, type, tournament_id)
  VALUES (5301, 2, 0, 'PRELIMINARY', 53)
  ON CONFLICT (id) DO UPDATE
    SET current_round_number = EXCLUDED.current_round_number,
        format = EXCLUDED.format,
        type = EXCLUDED.type,
        tournament_id = EXCLUDED.tournament_id;

  INSERT INTO round (id, custom_format, matches_are_public, name, round_number, round_group_id)
  VALUES
    (5311, 0, true, 'Round 1', 1, 5301),
    (5312, 0, true, 'Round 2', 2, 5301)
  ON CONFLICT (id) DO UPDATE
    SET custom_format = EXCLUDED.custom_format,
        matches_are_public = EXCLUDED.matches_are_public,
        name = EXCLUDED.name,
        round_number = EXCLUDED.round_number,
        round_group_id = EXCLUDED.round_group_id;

  DELETE FROM round_team
  WHERE round_id IN (5311, 5312)
    AND team_id IN (5301, 5302, 5303, 5304);

  INSERT INTO round_team (round_id, team_id)
  VALUES
    (5311, 5301), (5311, 5302), (5311, 5303), (5311, 5304),
    (5312, 5301), (5312, 5302), (5312, 5303), (5312, 5304);

  INSERT INTO match (
    id,
    completed,
    is_bye,
    location,
    start_time,
    team1_score,
    team1_won,
    team2_score,
    team2_won,
    judge_id,
    round_id,
    team1_id,
    team2_id
  )
  VALUES
    (53101, true, false, 'Room A', '2026-07-03 10:00:00', 151, true, 145, false, 5301, 5311, 5301, 5302),
    (53102, true, false, 'Room B', '2026-07-03 10:00:00', 144, true, 140, false, 5302, 5311, 5303, 5304),
    (53103, true, false, 'Room A', '2026-07-03 11:00:00', 152, false, 153, true, 5303, 5312, 5301, 5303),
    (53104, true, false, 'Room B', '2026-07-03 11:00:00', 156, true, 151, false, 5304, 5312, 5302, 5304)
  ON CONFLICT (id) DO UPDATE
    SET completed = EXCLUDED.completed,
        is_bye = EXCLUDED.is_bye,
        location = EXCLUDED.location,
        start_time = EXCLUDED.start_time,
        team1_score = EXCLUDED.team1_score,
        team1_won = EXCLUDED.team1_won,
        team2_score = EXCLUDED.team2_score,
        team2_won = EXCLUDED.team2_won,
        judge_id = EXCLUDED.judge_id,
        round_id = EXCLUDED.round_id,
        team1_id = EXCLUDED.team1_id,
        team2_id = EXCLUDED.team2_id;

  PERFORM setval('_user_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM _user) + 50, 5400));
  PERFORM setval('profile_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM profile) + 50, 5400));
  PERFORM setval('club_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM club) + 50, 5400));
  PERFORM setval('team_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM team) + 50, 5400));
  PERFORM setval('tournament_participant_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM tournament_participant) + 50, 5400));
  PERFORM setval('judge_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM judge) + 50, 5400));
  PERFORM setval('round_group_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM round_group) + 50, 5400));
  PERFORM setval('round_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM round) + 50, 5400));
  PERFORM setval('match_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM match) + 50, 53200));
END $$;
