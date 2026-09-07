import { SimpleTeamResponse } from "@/types/tournament/team";
import { SimpleTournamentResponse } from "@/types/tournament/tournament";
import { SimpleUserResponse } from "@/types/user/user";

export type OrganizerInvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export interface OrganizerInvitationResponse {
    id: number;
    inviter: SimpleUserResponse;
    invitee: SimpleUserResponse;
    tournament: SimpleTournamentResponse;
    timestamp: string;
    accepted: boolean | null;
    status: OrganizerInvitationStatus;
}

export interface ParticipantInvitationResponse {
    id: number;
    inviter: SimpleUserResponse;
    invitee: SimpleUserResponse;
    tournament: SimpleTournamentResponse;
    team: SimpleTeamResponse;
    timestamp: string;
    accepted: boolean;
}

export interface OrganizerInvitationRequest {
    inviteeUsername: string;
    tournamentId: number;
}

export interface ParticipantInvitationRequest {
    inviteeUsername: string;
    teamId: number;
}
