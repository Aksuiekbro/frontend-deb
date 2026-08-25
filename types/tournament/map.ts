import { UrlResponse } from "../util/url";

export interface TournamentMapResponse {
    id: number;
    title: string;
    description: string;
    imageUrl: UrlResponse;
}

export interface TournamentMapRequest {
    title: string;
    description: string;
}

export type TournamentMapUpdateRequest = Partial<TournamentMapRequest>;
