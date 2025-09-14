import { ParticipantProfileResponse } from "../user/profile";
import { SimpleUserResponse } from "../user/user";
import { SimpleTeamResponse } from "./team";

export interface SimpleTournamentParticipantResponse {
    id: number;
    speakerScore: number;
    participantProfile: ParticipantProfileResponse;
    user: SimpleUserResponse
}

export interface TournamentParticipantResponse extends SimpleTournamentParticipantResponse {
    team: SimpleTeamResponse
}

export interface TournamentParticipantGetParams {
    searchUsername?: string;
    searchFirstName?: string;
    searchLastName?: string;
    searchEmail?: string;
    minSpeakerScore?: number;
    maxSpeakerScore?: number;
}