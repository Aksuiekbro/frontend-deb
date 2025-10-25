import { SocialProfileResponse } from "../util/socials/social-profile";
import { UrlResponse } from "../util/url";
import { CityRequest, InstitutionRequest } from "./profile";

export interface SimpleUserResponse {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    imageUrl?: UrlResponse;
    role: Role;
}

export enum Role {
    ORGANIZER = "ORGANIZER",
    PARTICIPANT = "PARTICIPANT"
}

export interface UserResponse extends SimpleUserResponse {
    email: string;
    profileId: number;
    socialProfiles: SocialProfileResponse[];
    createdAt: string;
}

export interface UserRegistrationRequest {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    city?: CityRequest;
    institution?: InstitutionRequest;
}

export interface UserLoginRequest {
    username: string;
    password: string;
    rememberMe: boolean;
}

export interface UserUpdateRequest {
    username?: string;
    oldPassword?: string;
    newPassword?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    city?: CityRequest;
    institution?: InstitutionRequest;
}

export interface UserGetParams {
    searchUsername?: string;
    searchFirstName?: string;
    searchLastName?: string;
    searchEmail?: string;
    searchSocialProfileHandle?: string;
    role?: Role;
}