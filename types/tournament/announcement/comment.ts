import { SimpleUserResponse } from "@/types/user/user";

export interface CommentResponse {
    id: number;
    content: string;
    timestamp: string;
    author: SimpleUserResponse;
}

export interface CommentRequest {
    content: string;
}