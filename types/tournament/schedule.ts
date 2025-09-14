import { UrlResponse } from "../util/url";

export interface ScheduleResponse {
    id: number;
    name: string;
    description: string;
    imageUrl: UrlResponse;
}

export interface ScheduleRequest {
    name?: string;
    description?: string;
}