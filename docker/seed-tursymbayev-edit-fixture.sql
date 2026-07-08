-- Dev-only local fixture for testing organizer announcement edits.
--
-- Apply while the Docker stack is up:
--   docker exec -i debetter-postgres psql -U debetter_user -d debetter < docker/seed-tursymbayev-edit-fixture.sql
--
-- Login:
--   username = Tursymbayev
--   password = password123
--
-- This intentionally creates a tiny local fixture instead of copying the production DB.

DO $$
DECLARE
  profile_id bigint;
  known_password_hash text := '$2y$10$YHlTu0C.WE3QX16rdoPMZuymVumNoW2HFuaE4rfR18fmwSQIMYjaS';
  alternate_password_hash text := 'disabled-local-password-hash-for-tursymbayev-fixture';
BEGIN
  -- The local schema currently has a unique password constraint. Free the known
  -- password hash from any other local test account before assigning it here.
  UPDATE _user
  SET password = alternate_password_hash
  WHERE username <> 'Tursymbayev'
    AND password = known_password_hash;

  INSERT INTO _user (id, username, password, email, first_name, last_name, role, created_at)
  VALUES (
    1001,
    'Tursymbayev',
    known_password_hash,
    'tursymbayev@debetter.local',
    'Nurassyl',
    'Tursymbayev',
    'ORGANIZER',
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET username = EXCLUDED.username,
        password = EXCLUDED.password,
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role;

  SELECT id INTO profile_id FROM profile WHERE user_id = 1001 LIMIT 1;

  IF profile_id IS NULL THEN
    profile_id := 1001;
    INSERT INTO profile (id, user_id)
    VALUES (profile_id, 1001)
    ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;
  END IF;

  INSERT INTO organizer_profile (id)
  VALUES (profile_id)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO tournament (
    id,
    name,
    description,
    league,
    preliminary_format,
    team_elimination_format,
    start_date,
    end_date,
    registration_deadline,
    location,
    team_limit,
    started,
    finished,
    disabled,
    main_organizer_id
  )
  VALUES (
    53,
    'Climate Tech or Climate Trap: Can Innovation Alone',
    'Local fixture for testing announcement image editing.',
    'SCHOOL',
    'APF',
    'APF',
    '2026-06-27 00:00:00',
    '2026-06-28 00:00:00',
    '2026-06-26 00:00:00',
    'Almaty, Kazakhstan',
    32,
    true,
    false,
    false,
    profile_id
  )
  ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        league = EXCLUDED.league,
        preliminary_format = EXCLUDED.preliminary_format,
        team_elimination_format = EXCLUDED.team_elimination_format,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        registration_deadline = EXCLUDED.registration_deadline,
        location = EXCLUDED.location,
        team_limit = EXCLUDED.team_limit,
        started = EXCLUDED.started,
        finished = EXCLUDED.finished,
        disabled = EXCLUDED.disabled,
        main_organizer_id = EXCLUDED.main_organizer_id;

  DELETE FROM tournament_organizer
  WHERE tournament_id = 53
    AND organizer_id = profile_id;

  INSERT INTO tournament_organizer (tournament_id, organizer_id)
  VALUES (53, profile_id);

  INSERT INTO announcement (
    id,
    title,
    content,
    hidden,
    timestamp,
    last_edited,
    author_id,
    last_editor_id,
    tournament_id,
    image_id
  )
  VALUES (
    2,
    'мен круасавчик',
    'туууф' || chr(10) || 'сондай' || chr(10) || '570',
    false,
    '2026-06-19 14:22:02',
    '2026-06-19 14:22:02',
    profile_id,
    profile_id,
    53,
    null
  )
  ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
        content = EXCLUDED.content,
        hidden = EXCLUDED.hidden,
        author_id = EXCLUDED.author_id,
        last_editor_id = EXCLUDED.last_editor_id,
        tournament_id = EXCLUDED.tournament_id,
        image_id = EXCLUDED.image_id;

  PERFORM setval('_user_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM _user) + 50, 1051));
  PERFORM setval('profile_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM profile) + 50, 1051));
  PERFORM setval('tournament_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM tournament) + 50, 1051));
  PERFORM setval('announcement_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM announcement) + 50, 1051));
END $$;
