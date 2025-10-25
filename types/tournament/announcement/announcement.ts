import { TagResponse } from "@/types/tag";
import { OrganizerProfileResponse } from "@/types/user/profile";
import { SimpleUserResponse } from "@/types/user/user";
import { UrlResponse } from "@/types/util/url";
import { CommentResponse } from "./comment";

export interface AnnouncementResponse {
    id: number;
    title: string;
    content: string;
    imageUrl: UrlResponse;
    timestamp: string;
    author: OrganizerProfileResponse;
    user: SimpleUserResponse;
    comments: CommentResponse[];
    tags: TagResponse[];
}

export interface AnnouncementRequest {
    title?: string;
    content?: string;
}