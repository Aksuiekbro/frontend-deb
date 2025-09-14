import { SocialProfileResponse } from "../util/socials/social-profile";

export interface JudgeResponse {
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string;
    socialProfiles: SocialProfileResponse[];
    checkedIn: boolean;
}

export interface JudgeRequest {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
}

export interface JudgeGetParams {
    searchFullName?: string;
    searchEmail?: string;
    searchSocialProfileHandle?: string;
    phoneNumber?: string;
    checkedIn?: boolean;
}