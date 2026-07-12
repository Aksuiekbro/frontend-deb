\set ON_ERROR_STOP on

BEGIN;

INSERT INTO tournament (
    id, name, description, start_date, end_date, registration_deadline, location, league,
    preliminary_format, team_elimination_format, team_limit, main_organizer_id,
    started, finished, disabled
)
SELECT v.id, v.name, 'Local-only synthetic tournament integrity fixture',
       TIMESTAMP '2027-01-10 09:00:00', TIMESTAMP '2027-01-12 18:00:00',
       TIMESTAMP '2027-01-09 18:00:00', 'Local Docker', 'UNIVERSITY',
       v.preliminary_format, v.elimination_format, 32, p.id, true, false, false
FROM (VALUES
    (9101::bigint, 'SOL Backend APF', 'APF', 'APF'),
    (9102::bigint, 'SOL Backend BPF', 'BPF', 'BPF'),
    (9103::bigint, 'SOL Backend LD', 'LD', 'LD'),
    (9104::bigint, 'SOL Backend No LD', 'APF', 'APF'),
    (9105::bigint, 'SOL Backend Legacy LD Gate', 'APF', 'APF'),
    (9106::bigint, 'SOL Backend Mixed Formats', 'APF', 'BPF')
) AS v(id, name, preliminary_format, elimination_format)
JOIN profile p ON true
JOIN _user u ON u.id = p.user_id AND u.username = 'solborg';

INSERT INTO tournament_organizer (tournament_id, organizer_id)
SELECT t.id, p.id
FROM tournament t
JOIN profile p ON true
JOIN _user u ON u.id = p.user_id AND u.username = 'solborg'
WHERE t.id IN (9101, 9102, 9103, 9104, 9105, 9106);

INSERT INTO user_tournament_role (tournament_id, user_id, role)
SELECT t.id, u.id, 'FULL'
FROM tournament t
JOIN _user u ON u.username = 'solborg'
WHERE t.id IN (9101, 9102, 9103, 9104, 9105, 9106);

INSERT INTO round_group (id, tournament_id, type, format, current_round_number) VALUES
    (91011, 9101, 'PRELIMINARY', 0, 1),
    (91012, 9101, 'TEAM_ELIMINATION', 0, NULL),
    (91021, 9102, 'PRELIMINARY', 1, 1),
    (91022, 9102, 'TEAM_ELIMINATION', 1, NULL),
    (91032, 9103, 'SOLO_ELIMINATION', 3, 1),
    (91041, 9104, 'PRELIMINARY', 0, 1),
    (91042, 9104, 'TEAM_ELIMINATION', 0, NULL),
    (91051, 9105, 'PRELIMINARY', 0, 1),
    (91052, 9105, 'TEAM_ELIMINATION', 0, NULL),
    (91053, 9105, 'SOLO_ELIMINATION', 3, NULL),
    (91061, 9106, 'PRELIMINARY', 0, 1),
    (91062, 9106, 'TEAM_ELIMINATION', 1, 1),
    (91063, 9106, 'SOLO_ELIMINATION', 3, 1);

INSERT INTO round (id, name, round_group_id, round_number, matches_are_public, custom_format) VALUES
    (910111, 'Preliminary 1', 91011, 1, true, NULL),
    (910121, 'Semifinal', 91012, 1, false, NULL),
    (910122, 'Final', 91012, 2, false, NULL),
    (910211, 'Preliminary 1', 91021, 1, true, NULL),
    (910221, 'Semifinal', 91022, 1, false, NULL),
    (910222, 'Final', 91022, 2, false, NULL),
    (910321, 'Semifinal', 91032, 1, true, NULL),
    (910322, 'Final', 91032, 2, false, NULL),
    (910411, 'Preliminary 1', 91041, 1, true, NULL),
    (910421, 'Final', 91042, 1, false, NULL),
    (910511, 'Preliminary 1', 91051, 1, true, NULL),
    (910521, 'Final', 91052, 1, false, NULL),
    (910531, 'Final', 91053, 1, false, NULL),
    (910611, 'Preliminary 1', 91061, 1, true, NULL),
    (910621, 'Semifinal', 91062, 1, true, NULL),
    (910622, 'Final', 91062, 2, false, NULL),
    (910631, 'Semifinal', 91063, 1, true, NULL),
    (910632, 'Final', 91063, 2, false, NULL);

INSERT INTO team (id, name, tournament_id, preliminary_score, active, checked_in, disqualified) VALUES
    (9101101, 'APF A', 9101, 0, true, true, false),
    (9101102, 'APF B', 9101, 0, true, true, false),
    (9101103, 'APF C', 9101, 0, true, true, false),
    (9101104, 'APF D', 9101, 0, true, true, false),
    (9102101, 'BPF A', 9102, 0, true, true, false),
    (9102102, 'BPF B', 9102, 0, true, true, false),
    (9102103, 'BPF C', 9102, 0, true, true, false),
    (9102104, 'BPF D', 9102, 0, true, true, false),
    (9102105, 'BPF E', 9102, 0, true, true, false),
    (9102106, 'BPF F', 9102, 0, true, true, false),
    (9102107, 'BPF G', 9102, 0, true, true, false),
    (9102108, 'BPF H', 9102, 0, true, true, false),
    (9103101, 'LD A', 9103, 0, true, true, false),
    (9103102, 'LD B', 9103, 0, true, true, false),
    (9103103, 'LD C', 9103, 0, true, true, false),
    (9103104, 'LD D', 9103, 0, true, true, false),
    (9104101, 'No LD A', 9104, 0, true, true, false),
    (9104102, 'No LD B', 9104, 0, true, true, false),
    (9104103, 'No LD C', 9104, 0, true, true, false),
    (9104104, 'No LD D', 9104, 0, true, true, false),
    (9105101, 'Legacy A', 9105, 141, true, true, false),
    (9105102, 'Legacy B', 9105, 137, true, true, false),
    (9105103, 'Legacy C', 9105, 145, true, true, false),
    (9105104, 'Legacy D', 9105, 133, true, true, false),
    (9106101, 'Mixed A', 9106, 0, true, true, false),
    (9106102, 'Mixed B', 9106, 0, true, true, false),
    (9106103, 'Mixed C', 9106, 0, true, true, false),
    (9106104, 'Mixed D', 9106, 0, true, true, false);

WITH seed(id, team_id, username, speaker_score) AS (VALUES
    (91011011::bigint, 9101101::bigint, 'solbp01', 0),
    (91011012, 9101101, 'solbp02', 0),
    (91011013, 9101102, 'solbp03', 0),
    (91011014, 9101102, 'solbp04', 0),
    (91011015, 9101103, 'solbp05', 0),
    (91011016, 9101103, 'solbp06', 0),
    (91011017, 9101104, 'solbp07', 0),
    (91011018, 9101104, 'solbp08', 0),
    (91021011, 9102101, 'solbp01', 0),
    (91021012, 9102101, 'solbp02', 0),
    (91021013, 9102102, 'solbp03', 0),
    (91021014, 9102102, 'solbp04', 0),
    (91021015, 9102103, 'solbp05', 0),
    (91021016, 9102103, 'solbp06', 0),
    (91021017, 9102104, 'solbp07', 0),
    (91021018, 9102104, 'solbp08', 0),
    (91021019, 9102105, 'solbp09', 0),
    (91021020, 9102105, 'solbp10', 0),
    (91021021, 9102106, 'solbp11', 0),
    (91021022, 9102106, 'solbp12', 0),
    (91021023, 9102107, 'solbp13', 0),
    (91021024, 9102107, 'solbp14', 0),
    (91021025, 9102108, 'solbp15', 0),
    (91021026, 9102108, 'solbp16', 0),
    (91031011, 9103101, 'solbp01', 10),
    (91031012, 9103102, 'solbp02', 20),
    (91031013, 9103103, 'solbp03', 30),
    (91031014, 9103104, 'solbp04', 40),
    (91041011, 9104101, 'solbp09', 0),
    (91041012, 9104101, 'solbp10', 0),
    (91041013, 9104102, 'solbp11', 0),
    (91041014, 9104102, 'solbp12', 0),
    (91041015, 9104103, 'solbp13', 0),
    (91041016, 9104103, 'solbp14', 0),
    (91041017, 9104104, 'solbp15', 0),
    (91041018, 9104104, 'solbp16', 0),
    (91051011, 9105101, 'solbp01', 70),
    (91051012, 9105101, 'solbp02', 71),
    (91051013, 9105102, 'solbp03', 68),
    (91051014, 9105102, 'solbp04', 69),
    (91051015, 9105103, 'solbp05', 72),
    (91051016, 9105103, 'solbp06', 73),
    (91051017, 9105104, 'solbp07', 66),
    (91051018, 9105104, 'solbp08', 67),
    (91061011, 9106101, 'solbp09', 0),
    (91061012, 9106101, 'solbp10', 0),
    (91061013, 9106102, 'solbp11', 0),
    (91061014, 9106102, 'solbp12', 0),
    (91061015, 9106103, 'solbp13', 0),
    (91061016, 9106103, 'solbp14', 0),
    (91061017, 9106104, 'solbp15', 0),
    (91061018, 9106104, 'solbp16', 0)
)
INSERT INTO tournament_participant (id, team_id, participant_profile_id, speaker_score)
SELECT seed.id, seed.team_id, p.id, seed.speaker_score
FROM seed
JOIN _user u ON u.username = seed.username
JOIN profile p ON p.user_id = u.id;

INSERT INTO round_team (round_id, team_id)
SELECT 910111, id FROM team WHERE tournament_id = 9101
UNION ALL SELECT 910211, id FROM team WHERE tournament_id = 9102
UNION ALL SELECT 910411, id FROM team WHERE tournament_id = 9104
UNION ALL SELECT 910511, id FROM team WHERE tournament_id = 9105;

INSERT INTO round_team (round_id, team_id)
SELECT 910611, id FROM team WHERE tournament_id = 9106
UNION ALL SELECT 910621, id FROM team WHERE tournament_id = 9106;

INSERT INTO round_debater (round_id, debater_id)
SELECT 910321, id FROM tournament_participant WHERE team_id BETWEEN 9103101 AND 9103104
UNION ALL
SELECT 910631, id FROM tournament_participant WHERE team_id BETWEEN 9106101 AND 9106102;

INSERT INTO "match" (
    id, round_id, completed, is_bye, team1_id, team2_id, team3_id, team4_id,
    team1_score, team2_score, team3_score, team4_score,
    team1_won, team2_won, team3_won, team4_won
) VALUES
    (9101111, 910111, false, false, 9101101, 9101102, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9101112, 910111, false, false, 9101103, 9101104, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9102111, 910211, false, false, 9102101, 9102102, 9102103, 9102104, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9102112, 910211, false, false, 9102105, 9102106, 9102107, 9102108, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9104111, 910411, false, false, 9104101, 9104102, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9104112, 910411, false, false, 9104103, 9104104, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9105111, 910511, true, false, 9105101, 9105102, NULL, NULL, 141, 137, NULL, NULL, true, false, NULL, NULL),
    (9105112, 910511, true, false, 9105103, 9105104, NULL, NULL, 145, 133, NULL, NULL, true, false, NULL, NULL),
    (9106111, 910611, false, false, 9106101, 9106102, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9106112, 910611, false, false, 9106103, 9106104, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    (9106211, 910621, false, false, 9106101, 9106102, 9106103, 9106104, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO "match" (
    id, round_id, completed, is_bye, debater1_id, debater2_id,
    debater1_score, debater2_score
) VALUES
    (9103211, 910321, false, false, 91031011, 91031012, NULL, NULL),
    (9103212, 910321, false, false, 91031013, 91031014, NULL, NULL),
    (9106311, 910631, false, false, 91061011, 91061012, NULL, NULL),
    (9106312, 910631, false, false, 91061013, 91061014, NULL, NULL);

SELECT setval('match_seq', GREATEST((SELECT MAX(id) FROM "match"), 1) + 50, true);
SELECT setval('team_matchup_history_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM team_matchup_history), 1) + 50, true);
SELECT setval('debater_matchup_history_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM debater_matchup_history), 1) + 50, true);
SELECT setval('match_participant_score_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM match_participant_score), 1) + 50, true);

COMMIT;
