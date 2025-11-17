import { TagResponse } from "../tag";
import { UrlResponse } from "../util/url";

export interface SimpleTournamentResponse {
    id: number;
    name: string;
    description: string;
    imageUrl: UrlResponse;
    league: TournamentLeague;
    preliminaryFormat: DebateFormat;
    teamElimintationFormat: DebateFormat;
    tags: TagResponse[];
}

export enum TournamentLeague {
    SCHOOL = "SCHOOL",
    UNIVERSITY = "UNIVERSITY"
}

export enum DebateFormat {
    APF = "APF",
    BPF = "BPF",
    KP = "KP",
    LD = "LD"
}

export interface TournamentResponse extends SimpleTournamentResponse {
    startDate: string;
    endDate: string;
    registrationDeadline: string;
    location: string;
    teamLimit: number;
    enabled?: boolean;
}

export interface DebateFormatRequest {
    format: DebateFormat;
}

export interface TournamentRequest {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    registrationDeadline?: string;
    location?: string;
    league?: TournamentLeague;
    teamLimit?: number;
    preliminaryFormat?: DebateFormat;
    teamEliminationFormat?: DebateFormat;
    preliminaryRoundCount?: number;
    eliminationRoundCount?: number;
}

export interface TournamentGetParams {
    searchName?: string;
    searchLocation?: string;
    tags?: string[];
    startDateFrom?: string;
    startDateTo?: string;
    registrationDeadlineFrom?: string;
    registrationDeadlineTo?: string;
    league?: TournamentLeague;
    nonFull?: boolean;
}