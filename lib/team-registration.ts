import type { TeamRequest } from "@/types/tournament/team"
import { DebateFormat } from "@/types/tournament/tournament"
import { Role, type UserResponse } from "@/types/user/user"

type TeamRegistrationInput = {
  teamName: string
  clubName: string
  speakerOneUsername: string
  speakerTwoUsername: string
  maxInvitedParticipants?: number
}

export function getMaxInvitedParticipants(preliminaryFormat?: DebateFormat): number {
  return preliminaryFormat === DebateFormat.KP ? 2 : 1
}

export function buildTeamRegistrationPayload(
  currentUser: Pick<UserResponse, "profileId" | "role">,
  input: TeamRegistrationInput,
): TeamRequest {
  if (currentUser.role !== Role.PARTICIPANT) {
    throw new Error("Only participant accounts can register a team.")
  }

  if (!currentUser.profileId) {
    throw new Error("Your participant profile is missing. Please sign in again.")
  }

  const invitedParticipants = [
    input.speakerOneUsername.trim(),
    input.speakerTwoUsername.trim(),
  ].filter(Boolean)

  if (
    input.maxInvitedParticipants !== undefined &&
    invitedParticipants.length > input.maxInvitedParticipants
  ) {
    throw new Error(`This debate format supports ${input.maxInvitedParticipants} teammate invitation(s).`)
  }

  return {
    name: input.teamName.trim(),
    club: input.clubName.trim(),
    creatorId: currentUser.profileId,
    invitedParticipants: invitedParticipants.length > 0 ? invitedParticipants : undefined,
  }
}
