import { JudgeResponse } from "./judge";
import { SimpleTeamResponse } from "./team";
import { SimpleTournamentParticipantResponse } from "./tournament-participant";

export interface MatchResponse {
    id: number;
    team1?: SimpleTeamResponse | null;
    team2?: SimpleTeamResponse | null;
    team3?: SimpleTeamResponse | null;
    team4?: SimpleTeamResponse | null;
    debater1?: SimpleTournamentParticipantResponse | null;
    debater2?: SimpleTournamentParticipantResponse | null;
    location?: string | null;
    startTime?: string | null;
    judge?: JudgeResponse | null;
    team1Score?: number | null;
    team2Score?: number | null;
    team3Score?: number | null;
    team4Score?: number | null;
    team1Won?: boolean | null;
    team2Won?: boolean | null;
    team3Won?: boolean | null;
    team4Won?: boolean | null;
    winnerTeamId?: number | null;
    winningTeamIds?: number[] | null;
    debater1Score?: number | null;
    debater2Score?: number | null;
    completed: boolean;
}

export interface ParticipantScoreRequest {
    participantId: number;
    score: number;
}

export interface TeamResultRequest {
    teamId: number;
    won?: boolean;
    participantScores: ParticipantScoreRequest[];
}

export interface MatchResultRequest {
    matchId: number;
    teamResults?: TeamResultRequest[];
    participantScores?: ParticipantScoreRequest[];
}

export interface MatchUpdateRequest {
    location?: string | null;
    startTime?: string | null;
    judgeId?: number | null;
    team1Id?: number | null;
    team2Id?: number | null;
    team3Id?: number | null;
    team4Id?: number | null;
    debater1Id?: number | null;
    debater2Id?: number | null;
}
