export interface SocialProfileResponse {
    socialPlatform: SocialPlatform;
    handle: string;
}

export enum SocialPlatform {
    INSTAGRAM = "INSTAGRAM",
    TWITTER = "TWITTER",
    YOUTUBE = "YOUTUBE",
    WHATSAPP = "WHATSAPP",
    LINKEDIN = "LINKEDIN",
    FACEBOOK = "FACEBOOK",
    TELEGRAM = "TELEGRAM",
    TIKTOK = "TIKTOK",
    DISCORD = "DISCORD",
    OTHER = "OTHER"
}

export interface SocialProfileRequest {
    platform: SocialPlatform;
    handle: string;
    isPublic?: boolean;
}