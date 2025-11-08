import { NewsGetParams, NewsRequest, NewsResponse } from "@/types/news";
import { Pageable, PageResult } from "@/types/page";
import { AnnouncementRequest, AnnouncementResponse } from "@/types/tournament/announcement/announcement";
import { CommentRequest, CommentResponse } from "@/types/tournament/announcement/comment";
import { FeedbackGetParams, FeedbackRequest, FeedbackResponse } from "@/types/tournament/feedback";
import { JudgeGetParams, JudgeRequest, JudgeResponse } from "@/types/tournament/judge";
import { MatchResponse, MatchResultRequest } from "@/types/tournament/match";
import { RoundResponse, RoundUpdateRequest, SimpleRoundResponse } from "@/types/tournament/round/round";
import { RoundGroupResponse, RoundGroupType } from "@/types/tournament/round/round-group";
import { ScheduleRequest, ScheduleResponse } from "@/types/tournament/schedule";
import { SimpleTeamResponse, TeamRequest, TeamResponse, TeamUpdateOrganizerRequest, TeamUpdateParticipantRequest } from "@/types/tournament/team";
import { DebateFormatRequest, SimpleTournamentResponse, TournamentGetParams, TournamentRequest, TournamentResponse } from "@/types/tournament/tournament";
import { SimpleTournamentParticipantResponse, TournamentParticipantGetParams, TournamentParticipantResponse } from "@/types/tournament/tournament-participant";
import { CityResponse, InstitutionResponse, OrganizerProfileResponse, ParticipantProfileResponse } from "@/types/user/profile";
import { SimpleUserResponse, UserGetParams, UserLoginRequest, UserRegistrationRequest, UserResponse, UserUpdateRequest } from "@/types/user/user";
import { OrganizerInvitationRequest, OrganizerInvitationResponse, ParticipantInvitationRequest, ParticipantInvitationResponse } from "@/types/util/request/invitation";
import { SocialPlatform, SocialProfileRequest } from "@/types/util/socials/social-profile";
import { register } from "module";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(url: string, options?: RequestInit): Promise<Response> {
    const isFormData = options?.body instanceof FormData;

    const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: {
            ...options?.headers,
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
        },
        credentials: "include"
    });

    return res;
}

async function get<T>(endpoint: string, params?: Record<string, any>): Promise<Response> {
    const query = params ? buildQuery(params) : "";
    return request<T>(`${endpoint}${query}`);
}

async function getPageable<T>(endpoint: string, params?: Record<string, any>, pageable?: Pageable): Promise<Response> {
    const queryParams = {
        ...(params ?? {}),
        ...(pageable?.page !== undefined ? {page: pageable.page} : {}),
        ...(pageable?.size !== undefined ? {size: pageable.size} : {}),
        ...(pageable?.sort ? {sort: pageable.sort} : {})
    };

    return request<PageResult<T>>(`${endpoint}${buildQuery(queryParams)}`);
}

async function post<T>(
    endpoint: string,
    body?: any,
    params?: Record<string, any>
): Promise<Response> {
    const query = params ? buildQuery(params) : "";
    return request<T>(`${endpoint}${query}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
    });
}

export async function postMultipart<T>(
    endpoint: string,
    dto?: any,
    files?: Record<string, File | File[]>,
    params?: Record<string, any>
): Promise<Response> {
    const query = params ? buildQuery(params) : "";
    const formData = new FormData();

    if (dto) {
        formData.append(
        "data",
        new Blob([JSON.stringify(dto)], { type: "application/json" })
        );
    }

    if (files) {
        Object.entries(files).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((file) => formData.append(key, file));
            } else {
                formData.append(key, value);
            }
        });
    }

    return request<T>(`${endpoint}${query}`, {
        method: "POST",
        body: formData
    });
}
  

async function patch<T>(
    endpoint: string,
    body?: any,
    params?: Record<string, any>
): Promise<Response> {
    const query = params ? buildQuery(params) : "";
    return request<T>(`${endpoint}${query}`, {
        method: "PATCH",
        body: body ? JSON.stringify(body) : undefined,
    });
}

export async function patchMultipart<T>(
    endpoint: string,
    dto?: any,
    files?: Record<string, File | File[]>,
    params?: Record<string, any>
  ): Promise<Response> {
    const query = params ? buildQuery(params) : "";
    const formData = new FormData();
  
    if (dto) {
      formData.append(
        "data",
        new Blob([JSON.stringify(dto)], { type: "application/json" })
      );
    }
  
    if (files) {
      Object.entries(files).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((file) => formData.append(key, file));
        } else {
          formData.append(key, value);
        }
      });
    }
  
    return request<T>(`${endpoint}${query}`, {
      method: "PATCH",
      body: formData,
    });
  }
  

export async function deleteReq<T>(
    endpoint: string,
    params?: Record<string, any>
): Promise<Response> {
    const query = params ? buildQuery(params) : "";
    return request<T>(`${endpoint}${query}`, {
      method: "DELETE",
    });
}

function buildQuery(params: Record<string, any>): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        search.append(key, String(value));
      }
    });
    return search.toString() ? `?${search.toString()}` : "";
}

export const api = {
    //AUTH
    register: (body: UserRegistrationRequest) => post<UserResponse>("/auth/register", body),
    login: (body: UserLoginRequest) => post<UserResponse>("/auth/login", body),
    logout: () => post<void>("/auth/logout"),

    //USERS
    getUsers: (params?: UserGetParams, pageable?: Pageable) => getPageable<UserResponse>("/users", params, pageable),
    getUser: (id: number) => get<UserResponse>(`/users/${id}`),
    getMe: () => get<UserResponse>("/users/me"),

    updateUser: (id: number, body: UserUpdateRequest) => patch<UserResponse>(`/users/${id}`, body),
    updateProfilePicture: (id: number, body: FormData) => patchMultipart<UserResponse>(`/users/${id}/profile-picture`, body),
    updateMyProfilePicture: (body: FormData) => patchMultipart<UserResponse>("/users/me/profile-picture", body),

    deleteProfilePicture: (id: number) => deleteReq<void>(`/users/${id}/profile-picture`),
    deleteMyProfilePicture: () => deleteReq<void>("/users/me/profile-picture"),

    updateSocialProfiles: (id: number, newProfiles: SocialProfileRequest[]) => patch<void>(`/users/${id}/social-profiles`, newProfiles),
    updateMySocialProfiles: (newProfiles: SocialProfileRequest[]) => patch<void>("/users/me/social-profiles", newProfiles),

    removeSocialProfiles: (id: number, platforms: SocialPlatform) => deleteReq<void>(`/users/${id}/social-profiles`),
    removeMySocialProfiles: (platforms: SocialPlatform) => deleteReq<void>(`/users/me/social-profiles}`),

    //PROFILES
    getOrganizerProfile: (id: number) => get<OrganizerProfileResponse>(`/organizer-profiles/${id}`),

    getParticipantProfile: (id: number) => get<ParticipantProfileResponse>(`/participant-profiles/${id}`),

    getCities: (searchName: string, pageable?: Pageable) => getPageable<CityResponse>("/cities", {searchName}, pageable),
    getInstitutions: (searchName: string, pageable?: Pageable) => getPageable<InstitutionResponse>("/institutions", {searchName}, pageable),

    //NEWS
    getNewses: (params?: NewsGetParams, pageable?: Pageable) => getPageable<NewsResponse>("/news", params, pageable),
    getNews: (id: number) => get<NewsResponse>(`/news/${id}`),
    
    createNews: (body: NewsRequest, thumbnail: File, images: File[]) => postMultipart<NewsResponse>("/news", body, {thumbnail, images}),

    updateNews: (id: number, body: NewsRequest, thumbnail: File, images: File[]) => patchMultipart<NewsResponse>(`/news/${id}`, body, {thumbnail, images}),

    deleteNews: (id: number) => deleteReq<void>(`/news/${id}`),

    //TOURNAMENTS
    getTournaments: (params?: TournamentGetParams, pageable?: Pageable) => getPageable<SimpleTournamentResponse>("/tournaments", params, pageable),
    getTournament: (id: number) => get<TournamentResponse>(`/tournaments/${id}`),

    createTournament: (body: TournamentRequest, image: File) => postMultipart<TournamentResponse>("/tournaments", body, {image}),

    updateTournament: (id: number, body: TournamentRequest, image: File) => patchMultipart<TournamentResponse>(`/tournaments/${id}`, body, {image}),

    deleteTournament: (id: number) => deleteReq<void>(`/tournaments/${id}`),

    getMainOrganizer: (id: number) => get<UserResponse>(`/tournaments/${id}/main-organizer`),
    getOrganizers: (id: number) => get<SimpleUserResponse[]>(`/tournaments/${id}/organizers`),

    removeOrganizer: (id: number, organizerId: number) => deleteReq<void>(`/tournaments/${id}/organizers/${organizerId}`),

    enableTournament: (id: number) => patch<void>(`/tournaments/${id}/enable`),
    disableTournament: (id: number) => patch<void>(`/tournaments/${id}/disable`),

    checkInTeam: (id: number, teamId: number) => patch<void>(`/tournaments/${id}/teams/${teamId}/check-in`),
    uncheckInTeam: (id: number, teamId: number) => patch<void>(`/tournaments/${id}/teams/${teamId}/uncheck-in`),

    disqualifyTeam: (id: number, teamId: number) => patch<void>(`/tournaments/${id}/teams/${teamId}/disqualify`),
    requalifyTeam: (id: number, teamId: number) => patch<void>(`/tournaments/${id}/teams/${teamId}/requalify`),

    removeTeam: (id: number, teamId: number) => deleteReq<void>(`/tournaments/${id}/teams/${teamId}`),

    startTournament: (id: number) => patch<void>(`/tournaments/${id}/start`),

    //ROUND GROUPS
    getRoundGroups: (tournamentId: number) => get<RoundGroupResponse[]>(`/tournaments/${tournamentId}/round-groups`),

    changeRoundGroupFormat: (tournamentId: number, body: DebateFormatRequest, params: {roundGroupType: RoundGroupType}) => patch<void>(`/tournaments/${tournamentId}/round-groups`, body, params),

    proceedToNextRound: (tournamentId: number, roundGroupId: number) => patch<void>(`/tournaments/${tournamentId}/round-groups/${roundGroupId}/proceed`),

    //ROUNDS
    getRounds: (tournamentId: number, roundGroupId: number) => get<SimpleRoundResponse[]>(`/tournaments/${tournamentId}/round-groups/${roundGroupId}/rounds`),

    getRound: (tournamentId: number, roundGroupId: number, id: number) => get<RoundResponse>(`/tournaments/${tournamentId}/round-groups/${roundGroupId}/rounds/${id}`),

    updateRound: (tournamentId: number, roundGroupId: number, id: number, body: RoundUpdateRequest) => patch<void>(`/tournaments/${tournamentId}/round-groups/${roundGroupId}/rounds/${id}`, body),

    deleteRound: (tournamentId: number, roundGroupId: number, id: number) => deleteReq<void>(`/tournaments/${tournamentId}/round-groups/${roundGroupId}/rounds/${id}`),

    //MATCHES
    getMatches: (tournamentId: number, roundGroupId: number, roundId: number, pageable?: Pageable) => getPageable<MatchResponse>(`/tournaments/${tournamentId}/round-groups/${roundGroupId}/rounds/${roundId}/matches`, pageable),

    submitMatchResults: (tournamentId: number, roundGroupId: number, roundId: number, body: MatchResultRequest[]) => patch<void>(`/tournaments/${tournamentId}/round-groups/${roundGroupId}/rounds/${roundId}/matches/results`, body),

    //TEAMS
    getTeams: (tournamentId: number, pageable?: Pageable) => getPageable<SimpleTeamResponse>(`/tournaments/${tournamentId}/teams`, pageable),
    getTeam: (tournamentId: number, id: number) => get<TeamResponse>(`/tournaments/${tournamentId}/teams/${id}`),

    registerTeam: (tournamentId: number, body: TeamRequest) => post<void>(`/tournaments/${tournamentId}/teams`, body),

    updateTeam_Organizer: (tournamentId: number, id: number, body: TeamUpdateOrganizerRequest) => patch<void>(`/tournaments/${tournamentId}/teams/${id}/organizer-update`, body),
    updateTeam_Participant: (tournamentId: number, id: number, body: TeamUpdateParticipantRequest) => patch<void>(`/tournaments/${tournamentId}/teams/${id}/participant-update`, body),

    //TOURNAMENT PARTICIPANTS
    getTournamentParticipants: (tournamentId: number, params?: TournamentParticipantGetParams, pageable?: Pageable) => getPageable<SimpleTournamentParticipantResponse>(`/tournaments/${tournamentId}/participants`, params, pageable),
    getTournamentParticipant: (tournamentId: number, participantId: number) => get<TournamentParticipantResponse>(`/tournaments/${tournamentId}/participants/${participantId}`),

    //ANNOUNCEMENTS
    getAnnouncements: (tournamentId: number, authorId?: number, pageable?: Pageable) => getPageable<AnnouncementResponse>(`/tournaments/${tournamentId}/announcements`, {authorId}, pageable),
    getAnnouncement: (tournamentId: number, id: number) => get<AnnouncementResponse>(`/tournaments/${tournamentId}/announcements/${id}`),

    createAnnouncement: (tournamentId: number, body: AnnouncementRequest, image: File) => postMultipart<void>(`/tournaments/${tournamentId}/announcements`, body, {image}),

    updateAnnouncement: (tournamentId: number, id: number, body: AnnouncementRequest, image: File) => patchMultipart<void>(`/tournaments/${tournamentId}/announcements/${id}`, body, {image}),

    deleteAnnouncement: (tournamentId: number, id: number) => deleteReq<void>(`/tournaments/${tournamentId}/announcements/${id}`),

    getAnnouncementComments: (tournamentId: number, id: number, pageable?: Pageable) => getPageable<CommentResponse>(`/tournaments/${tournamentId}/announcements/${id}/comments`, pageable),

    addAnnouncementComment: (tournamentId: number, id: number, body: CommentRequest) => post<void>(`/tournaments/${tournamentId}/announcements/${id}/comments`, body),

    deleteAnnouncementComment: (tournamentId: number, id: number, commentId: number) => deleteReq<void>(`/tournaments/${tournamentId}/announcements/${id}/comments/${commentId}`),

    //JUDGES
    getJudges: (tournamentId: number, params?: JudgeGetParams, pageable?: Pageable) => getPageable<JudgeResponse>(`/tournaments/${tournamentId}/judges`, params, pageable),
    getJudge: (tournamentId: number, id: number) => get<JudgeResponse>(`/tournaments/${tournamentId}/judges/${id}`),

    addJudge: (tournamentId: number, body: JudgeRequest) => post<JudgeResponse>(`/tournaments/${tournamentId}/judges`, body),

    updateJudge: (tournamentId: number, id: number, body: JudgeRequest) => patch<JudgeResponse>(`/tournaments/${tournamentId}/judges/${id}`, body),

    deleteJudge: (tournamentId: number, id: number) => deleteReq<void>(`/tournaments/${tournamentId}/judges/${id}`),

    //SCHEDULES
    getSchedules: (tournamentId: number) => get<ScheduleResponse[]>(`/tournaments/${tournamentId}/schedules`),
    getSchedule: (tournamentId: number, id: number) => get<ScheduleResponse>(`/tournaments/${tournamentId}/schedules/${id}`),

    addSchedule: (tournamentId: number, body: ScheduleRequest, image: File) => postMultipart<ScheduleResponse>(`/tournaments/${tournamentId}/schedules`, body, {image}),

    deleteSchedule: (tournamentId: number, id: number) => deleteReq<void>(`/tournaments/${tournamentId}/schedules/${id}`),

    //FEEDBACKS
    getFeedbacks: (tournamentId: number, params?: FeedbackGetParams, pageable?: Pageable) => getPageable<FeedbackResponse>(`/tournaments/${tournamentId}/feedbacks`, params, pageable),
    getFeedback: (tournamentId: number, id: number) => get<FeedbackResponse>(`/tournaments/${tournamentId}/feedbacks/${id}`),

    addFeedback: (tournamentId: number, body: FeedbackRequest) => post<FeedbackResponse>(`/tournaments/${tournamentId}/feedbacks`, body),

    updateFeedback: (tournamentId: number, id: number, body: FeedbackRequest) => patch<FeedbackResponse>(`/tournaments/${tournamentId}/feedbacks/${id}`, body),

    deleteFeedback: (tournamentId: number, id: number) => deleteReq<void>(`/tournaments/${tournamentId}/feedbacks/${id}`),

    //INVITATIONS
    getSentOrganizerInvitations: (pageable?: Pageable) => getPageable<OrganizerInvitationResponse>(`/organizer-invitations/sent`, pageable),
    getReceivedOrganizerInvitations: (pageable?: Pageable) => getPageable<OrganizerInvitationResponse>(`/organizer-invitations/received`, pageable),

    sendOrganizerInvitation: (body: OrganizerInvitationRequest) => post<void>(`/organizer-invitations`, body),

    acceptOrganizerInvitation: (id: number) => post<void>(`/organizer-invitations/${id}/accept`),
    rejectOrganizerInvitation: (id: number) => post<void>(`/organizer-invitations/${id}/reject`),

    getSentParticipantInvitations: (pageable?: Pageable) => getPageable<ParticipantInvitationResponse>(`/participant-invitations/sent`, pageable),
    getReceivedParticipantInvitations: (pageable?: Pageable) => getPageable<ParticipantInvitationResponse>(`/participant-invitations/received`, pageable),

    sendParticipantInvitation: (body: ParticipantInvitationRequest) => post<void>(`/participant-invitations`, body),

    acceptParticipantInvitation: (id: number) => post<void>(`/participant-invitations/${id}/accept`),
    rejectParticipantInvitation: (id: number) => post<void>(`/participant-invitations/${id}/reject`),
}