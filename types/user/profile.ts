import { SimpleTournamentResponse } from "../tournament/tournament";

export interface OrganizerProfileResponse {
    organizedTournaments: SimpleTournamentResponse[];
    coOrganizedTournaments: SimpleTournamentResponse[];
}

export interface ParticipantProfileResponse {
    city: CityResponse;
    institution: InstitutionResponse;
    rating: number;
}

export interface CityResponse {
    id: number;
    name: string;
}

export interface InstitutionResponse {
    id: number;
    name: string;
}

export interface CityRequest {
    name: string;
}

export interface InstitutionRequest {
    name: string;
}

export interface CityGetParams {
    searchName?: string;
}

export interface InstitutionGetParams {
    searchName?: string;
}