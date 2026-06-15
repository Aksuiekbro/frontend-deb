import { TagResponse } from "./tag";
import { OrganizerProfileResponse } from "./user/profile";
import { SimpleUserResponse } from "./user/user";
import { UrlResponse } from "./util/url";

export interface NewsResponse {
    id: number;
    author: OrganizerProfileResponse;
    user: SimpleUserResponse;
    thumbnailUrl: UrlResponse;
    images: UrlResponse[];
    title: string;
    content: string;
    tags: TagResponse[];
    timestamp: string;
}

export interface NewsRequest {
    title: string;
    content: string;
    tags: string[];
}

export interface NewsGetParams {
    searchTitle?: string;
    tags?: string[];
    authorId?: number;
}
