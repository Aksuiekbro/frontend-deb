import { MatchResponse } from "../match";
import { DebateFormat } from "../tournament";

export interface SimpleRoundResponse {
    id: number;
    name: string;
    customFormat: DebateFormat;
    roundNumber: number;
}

export interface RoundResponse extends SimpleRoundResponse {
    matches: MatchResponse[];
}

export interface RoundUpdateRequest {
    name?: string;
    customFormat?: DebateFormat;
    matchesArePublic?: boolean;
}