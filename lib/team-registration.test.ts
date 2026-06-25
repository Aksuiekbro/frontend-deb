import { buildTeamRegistrationPayload, getMaxInvitedParticipants } from "./team-registration"
import { DebateFormat } from "@/types/tournament/tournament"
import { Role } from "@/types/user/user"

describe("buildTeamRegistrationPayload", () => {
  it("uses the participant profile id as creatorId and sends invited usernames as strings", () => {
    expect(buildTeamRegistrationPayload(
      { profileId: 42, role: Role.PARTICIPANT },
      {
        teamName: " kaprichoza ",
        clubName: " KTL ",
        speakerOneUsername: " Arman ",
        speakerTwoUsername: " Aisha ",
      },
    )).toEqual({
      name: "kaprichoza",
      club: "KTL",
      creatorId: 42,
      invitedParticipants: ["Arman", "Aisha"],
    })
  })

  it("omits invitedParticipants when speaker usernames are blank", () => {
    expect(buildTeamRegistrationPayload(
      { profileId: 42, role: Role.PARTICIPANT },
      {
        teamName: "Team A",
        clubName: "KTL",
        speakerOneUsername: " ",
        speakerTwoUsername: "",
      },
    )).toEqual({
      name: "Team A",
      club: "KTL",
      creatorId: 42,
    })
  })

  it("rejects organizer accounts before submitting a team registration", () => {
    expect(() => buildTeamRegistrationPayload(
      { profileId: 7, role: Role.ORGANIZER },
      {
        teamName: "Team A",
        clubName: "KTL",
        speakerOneUsername: "",
        speakerTwoUsername: "",
      },
    )).toThrow("Only participant accounts can register a team.")
  })

  it("limits invited usernames by debate format", () => {
    expect(getMaxInvitedParticipants(DebateFormat.APF)).toBe(1)
    expect(getMaxInvitedParticipants(DebateFormat.BPF)).toBe(1)
    expect(getMaxInvitedParticipants(DebateFormat.KP)).toBe(2)

    expect(() => buildTeamRegistrationPayload(
      { profileId: 42, role: Role.PARTICIPANT },
      {
        teamName: "Team A",
        clubName: "KTL",
        speakerOneUsername: "Arman",
        speakerTwoUsername: "Aisha",
        maxInvitedParticipants: getMaxInvitedParticipants(DebateFormat.APF),
      },
    )).toThrow("This debate format supports 1 teammate invitation(s).")
  })
})
