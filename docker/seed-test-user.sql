-- Dev-only test login for the DeBetter backend.
--
-- WHY THIS EXISTS: seeds one known account so you can log in without going through register.
-- (The backend's register had two bugs — a NULL-password insert and an id-sequence collision —
-- both now fixed in the source-built image; see below.)
--
-- Apply (stack must be up):
--   docker exec -i debetter-postgres psql -U debetter_user -d debetter < docker/seed-test-user.sql
--
-- Then log in with:  username = testadmin   password = password123   (role ORGANIZER)
--
-- The hash below is bcrypt(cost 10) of 'password123'. BCryptPasswordEncoder accepts the $2y$ variant.
-- Survives restarts because compose sets SPRING_JPA_HIBERNATE_DDL_AUTO=update; a `compose down -v`
-- wipes the volume, after which you re-run this file.

INSERT INTO _user (id, username, password, email, first_name, last_name, role, created_at)
VALUES (1, 'testadmin', '$2y$10$YHlTu0C.WE3QX16rdoPMZuymVumNoW2HFuaE4rfR18fmwSQIMYjaS',
        'test@debetter.local', 'Test', 'Admin', 'ORGANIZER', now())
ON CONFLICT (id) DO UPDATE
    SET password = EXCLUDED.password,
        username = EXCLUDED.username,
        role     = EXCLUDED.role;

-- Seeding a fixed id=1 does NOT advance Hibernate's _user_seq, so the first real registration
-- would generate id=1 and collide with this row. Push the sequence safely past the seeded id.
SELECT setval('_user_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM _user) + 50, 1000));
