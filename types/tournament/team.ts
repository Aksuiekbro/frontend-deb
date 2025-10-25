import { SimpleTournamentParticipantResponse } from "./tournament-participant";

export interface SimpleTeamResponse {
    id: number;
    name: string;
    club: ClubResponse;
}

export interface ClubResponse {
    id: number;
    name: string;
}

export interface TeamResponse extends SimpleTeamResponse {
    preliminaryScore: number;
    active: boolean;
    checkedIn: boolean;
    disqualified: boolean;
    members: SimpleTournamentParticipantResponse[]
}

export interface ParticipantSelectorRequest {
    id?: number;
    username?: string;
}

export interface TeamRequest {
    name: string;
    club: string;
    creatorId: number;
    invitedParticipants?: ParticipantSelectorRequest[];
}

export interface TeamUpdateOrganizerRequest {
    name?: string;
}

export interface TeamUpdateParticipantRequest {
    name?: string;
    club?: string;
}