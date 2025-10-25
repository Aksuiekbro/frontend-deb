import { DebateFormat } from "../tournament";
import { SimpleRoundResponse } from "./round";

export interface RoundGroupResponse {
    id: number;
    type: RoundGroupType;
    format: DebateFormat;
    rounds: SimpleRoundResponse;
    currentRoundNumber: number;
}

export enum RoundGroupType {
    PRELIMINARY = "PRELIMINARY",
    TEAM_ELIMINATION = "TEAM_ELIMINATION",
    SOLO_ELIMINATION = "SOLO_ELIMINATION"
}