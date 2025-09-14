import { JudgeResponse } from "./judge";
import { SimpleTeamResponse } from "./team";
import { SimpleTournamentParticipantResponse } from "./tournament-participant";

export interface MatchResponse {
    id: number;
    team1: SimpleTeamResponse;
    team2: SimpleTeamResponse;
    team3: SimpleTeamResponse;
    team4: SimpleTeamResponse;
    debater1: SimpleTournamentParticipantResponse;
    debater2: SimpleTournamentParticipantResponse;
    location: string;
    startTime: string;
    judge: JudgeResponse;
    team1Score: number;
    team2Score: number;
    team3Score: number;
    team4Score: number;
    debater1Score: number;
    debater2Score: number;
    completed: boolean;
}

export interface ParticipantScoreRequest {
    participantId: number;
    score: number;
}

export interface TeamResultRequest {
    teamId: number;
    participantScores: ParticipantScoreRequest[];
}

export interface MatchResultRequest {
    matchId: number;
    teamResults?: TeamResultRequest[];
    participantScores?: ParticipantScoreRequest[];
}