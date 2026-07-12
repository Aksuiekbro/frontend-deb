\set ON_ERROR_STOP on

BEGIN;

DELETE FROM match_participant_score
WHERE match_id IN (
    SELECT m.id
    FROM "match" m
    JOIN round r ON r.id = m.round_id
    JOIN round_group rg ON rg.id = r.round_group_id
    WHERE rg.tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106)
);

DELETE FROM debater_matchup_history
WHERE debater1_id IN (
    SELECT tp.id FROM tournament_participant tp
    JOIN team t ON t.id = tp.team_id
    WHERE t.tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106)
) OR debater2_id IN (
    SELECT tp.id FROM tournament_participant tp
    JOIN team t ON t.id = tp.team_id
    WHERE t.tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106)
);

DELETE FROM team_matchup_history
WHERE team1_id IN (SELECT id FROM team WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106))
   OR team2_id IN (SELECT id FROM team WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106));

DELETE FROM "match"
WHERE round_id IN (
    SELECT r.id FROM round r
    JOIN round_group rg ON rg.id = r.round_group_id
    WHERE rg.tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106)
);

DELETE FROM round_debater
WHERE round_id IN (
    SELECT r.id FROM round r
    JOIN round_group rg ON rg.id = r.round_group_id
    WHERE rg.tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106)
);

DELETE FROM round_team
WHERE round_id IN (
    SELECT r.id FROM round r
    JOIN round_group rg ON rg.id = r.round_group_id
    WHERE rg.tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106)
);

DELETE FROM round
WHERE round_group_id IN (
    SELECT id FROM round_group WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106)
);
DELETE FROM round_group WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106);
DELETE FROM tournament_participant
WHERE team_id IN (SELECT id FROM team WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106));
DELETE FROM team WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106);
DELETE FROM tournament_organizer WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106);
DELETE FROM user_tournament_role WHERE tournament_id IN (9101, 9102, 9103, 9104, 9105, 9106);
DELETE FROM tournament WHERE id IN (9101, 9102, 9103, 9104, 9105, 9106);

DELETE FROM user_authority WHERE user_id IN (SELECT id FROM _user WHERE username = 'solborg' OR username ~ '^solbp(0[1-9]|1[0-6])$');
DELETE FROM participant_profile
WHERE id IN (
    SELECT p.id FROM profile p JOIN _user u ON u.id = p.user_id
    WHERE u.username = 'solborg' OR u.username ~ '^solbp(0[1-9]|1[0-6])$'
);
DELETE FROM organizer_profile
WHERE id IN (
    SELECT p.id FROM profile p JOIN _user u ON u.id = p.user_id
    WHERE u.username = 'solborg' OR u.username ~ '^solbp(0[1-9]|1[0-6])$'
);
DELETE FROM profile WHERE user_id IN (SELECT id FROM _user WHERE username = 'solborg' OR username ~ '^solbp(0[1-9]|1[0-6])$');
DELETE FROM _user WHERE username = 'solborg' OR username ~ '^solbp(0[1-9]|1[0-6])$';

COMMIT;
