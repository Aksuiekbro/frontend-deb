import { TagResponse } from "../tag";
import { ParticipantProfileResponse } from "../user/profile";
import { SimpleUserResponse } from "../user/user";

export interface FeedbackResponse {
    id: number;
    title: string;
    content: string;
    timestamp: string;
    edited: boolean;
    author: ParticipantProfileResponse;
    user: SimpleUserResponse;
    tags: TagResponse[]
}

export interface FeedbackRequest {
    title?: string;
    content?: string;
}

export interface FeedbackGetParams {
    searchTitle?: string;
    tags?: string[];
    edited?: boolean;
    timestampFrom?: string;
    timestampTo?: string;
}