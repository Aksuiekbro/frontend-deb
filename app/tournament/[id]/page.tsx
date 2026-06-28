"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import { useParams } from "next/navigation"
import { AddJudgeModal } from "@/components/tournament/AddJudgeModal"
import { AddPostModal } from "@/components/tournament/AddPostModal"
import { FeedbackSection } from "@/components/tournament/FeedbackSection"
import { InviteModal } from "@/components/tournament/InviteModal"
import { JudgesSection } from "@/components/tournament/JudgesSection"
import { MainInfoSection } from "@/components/tournament/MainInfoSection"
import { NewsSection } from "@/components/tournament/NewsSection"
import { PairingsSection } from "@/components/tournament/PairingsSection"
import type { FormatOption as PairingFormatOption, StageId as PairingStageId } from "@/components/tournament/PairingsSection"
import { ResultsSection } from "@/components/tournament/ResultsSection"
import { TeamsSection } from "@/components/tournament/TeamsSection"
import { TournamentHeader } from "@/components/tournament/TournamentHeader"
import { TournamentTabs } from "@/components/tournament/TournamentTabs"
import { EditTeamModal } from "@/components/tournament/EditTeamModal"
import { useTournamentVisibility } from "@/hooks/tournament/useTournamentVisibility"
import { useImageUpload } from "@/hooks/tournament/useImageUpload"
import { useRoundSelection } from "@/hooks/tournament/useRoundSelection"
import {
  useTournament,
  useTournamentParticipants,
  useTournamentTeams,
  useTournamentAnnouncements,
  useTournamentSchedules,
  useTournamentJudges,
  useTournamentOrganizers,
  useTournamentFeedbacks,
  useNews,
  useCurrentUser,
} from "@/hooks/use-api"
import { api } from "@/lib/api"
import { readResponseError } from "@/lib/http-error"
import { useToast } from "@/hooks/use-toast"
import { Role } from "@/types/user/user"
import type { MatchResultRequest, MatchUpdateRequest } from "@/types/tournament/match"
import type { SimpleTeamResponse, TeamResponse, TeamUpdateOrganizerRequest } from "@/types/tournament/team"
import type { JudgeRequest, JudgeResponse } from "@/types/tournament/judge"
import type { NewsRequest } from "@/types/news"
import type { AnnouncementRequest } from "@/types/tournament/announcement/announcement"
import type { ScheduleRequest } from "@/types/tournament/schedule"
import { DebateFormat } from "@/types/tournament/tournament"
import { RoundGroupType } from "@/types/tournament/round/round-group"

const ROUND_GROUP_TYPE_BY_STAGE: Record<PairingStageId, RoundGroupType> = {
  preliminary: RoundGroupType.PRELIMINARY,
  team: RoundGroupType.TEAM_ELIMINATION,
  solo: RoundGroupType.SOLO_ELIMINATION,
}

const DEBATE_FORMAT_BY_OPTION: Record<PairingFormatOption, DebateFormat> = {
  APF: DebateFormat.APF,
  BPF: DebateFormat.BPF,
  LD: DebateFormat.LD,
}

const TOURNAMENT_ROSTER_PAGEABLE = { page: 0, size: 100 }

export default function TournamentDetailPage() {
  const params = useParams()
  const tournamentId = parseInt(params.id as string)
  const { user: currentUser } = useCurrentUser()
  const { toast } = useToast()

  // API hooks
  const { tournament, isLoading: tournamentLoading, error: tournamentError, mutate: mutateTournament } = useTournament(tournamentId)
  const { participants } = useTournamentParticipants(tournamentId)
  const { teams, isLoading: teamsLoading, error: teamsError, mutate: mutateTeams } = useTournamentTeams(
    tournamentId,
    TOURNAMENT_ROSTER_PAGEABLE
  )
  const {
    announcements,
    isLoading: announcementsLoading,
    error: announcementsError,
    mutate: mutateAnnouncements,
  } = useTournamentAnnouncements(tournamentId)
  const {
    schedules,
    isLoading: schedulesLoading,
    error: schedulesError,
    mutate: mutateSchedules,
  } = useTournamentSchedules(tournamentId)
  const { judges, isLoading: judgesLoading, error: judgesError, mutate: mutateJudges } = useTournamentJudges(
    tournamentId,
    TOURNAMENT_ROSTER_PAGEABLE
  )
  const { organizers } = useTournamentOrganizers(tournamentId)
  const { feedbacks, isLoading: feedbacksLoading, error: feedbacksError, mutate: mutateFeedbacks } = useTournamentFeedbacks(
    tournamentId,
    undefined,
    { page: 0, size: 20, sort: ['timestamp,desc'] }
  )

  const [activeTab, setActiveTab] = useState('Main Info')
  const [isMainInfoDropdownOpen, setIsMainInfoDropdownOpen] = useState(false)
  const [selectedMainInfoOption, setSelectedMainInfoOption] = useState<'Announcements' | 'Schedule' | 'Map'>('Announcements')
  const [isResultsDropdownOpen, setIsResultsDropdownOpen] = useState(false)
  const [selectedResultsOption, setSelectedResultsOption] = useState<'APF' | 'BPF' | 'LD'>('APF')
  const [resultsSubTab, setResultsSubTab] = useState<'Speaker Score' | 'Results'>('Speaker Score')
  const [selectedPairingStage, setSelectedPairingStage] = useState<PairingStageId>('preliminary')
  const [selectedRound, setSelectedRound] = useState('Round 1')
  const [bpfSubTab] = useState('BPF Results')
  const [activeResultsSection, setActiveResultsSection] = useState('APF Speaker Score')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [teamEditModalData, setTeamEditModalData] = useState<{ id: number; name: string; club: string; speakerUsernames: string[] } | null>(null)
  const [isSavingTeam, setIsSavingTeam] = useState(false)
  const [startingTournament, setStartingTournament] = useState(false)

  const {
    imagePreviews,
    uploadErrors,
    postImages,
    dzAnimate,
    formatBytes,
    handleImageUpload,
    handleDragOver,
    handleDrop,
    removeImageByKey,
    resetUploads,
  } = useImageUpload()

  const tournamentMembers = participants?.content.slice(0, 5) ?? []
  const [inviteModalTab, setInviteModalTab] = useState<'invite' | 'copy-link'>('invite')  
  const [checkInStatus, setCheckInStatus] = useState<{[key: number]: boolean}>({})
  
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false)
  const [isAddJudgeModalOpen, setIsAddJudgeModalOpen] = useState(false)
  const [modalContext, setModalContext] = useState<'announcements' | 'schedule' | 'map' | 'news' | ''>('')
  const [postTitle, setPostTitle] = useState('')
  const [postDescription, setPostDescription] = useState('')
  const [postSubmitting, setPostSubmitting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [judgeModalMode, setJudgeModalMode] = useState<'add' | 'edit'>('add')
  const [judgeForm, setJudgeForm] = useState<JudgeRequest>({ fullName: '', email: '', phoneNumber: '' })
  const [editingJudge, setEditingJudge] = useState<JudgeResponse | null>(null)
  const [judgeSubmitting, setJudgeSubmitting] = useState(false)
  const [judgeError, setJudgeError] = useState<string | null>(null)
  const [updatingJudgeId, setUpdatingJudgeId] = useState<number | null>(null)
  const [deletingJudgeId, setDeletingJudgeId] = useState<number | null>(null)
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null)
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null)
  const [submittingResults, setSubmittingResults] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsDropdownRef = useRef<HTMLDivElement>(null)
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<'Important' | 'Update' | 'Info'>('Info')

  const { isTournamentEnabled, toggleTournamentLoading, handleTournamentToggle } = useTournamentVisibility({
    tournament,
    toast,
  })

  const ELIMINATION_ROUND_NAMES = new Set(['1/16', '1/8', '1/4', '1/2'])
  const effectiveStage: PairingStageId = activeTab === 'Results and Statistics'
    ? selectedResultsOption === 'LD'
      ? 'solo'
      : ELIMINATION_ROUND_NAMES.has(activeResultsSection)
        ? 'team'
        : 'preliminary'
    : selectedPairingStage

  const {
    selectedRoundGroupId,
    selectedRoundId,
    selectedRoundNumber,
    currentRoundNumber,
    rounds,
    matches,
    isLoading: matchesLoading,
    error: matchesError,
    mutate: mutateMatches,
    mutateRoundGroups,
    mutateRounds,
  } = useRoundSelection({
    tournamentId,
    selectedStage: effectiveStage,
    selectedRoundLabel: selectedRound,
    pageable: { page: 0, size: 50 },
  })

  const resultStorageKey =
    typeof selectedRoundGroupId === 'number' && typeof selectedRoundId === 'number'
      ? `tournament:${tournamentId}:round-group:${selectedRoundGroupId}:round:${selectedRoundId}:match-results`
      : undefined

  const handleAddPost = async () => {
    const isAnnouncement = modalContext === 'announcements'
    const isSchedule = modalContext === 'schedule'
    const isMap = modalContext === 'map'
    const isNews = modalContext === 'news'
    const title = postTitle.trim()
    const description = postDescription.trim()
    const [primaryImage, ...extraImages] = postImages

    if (isMap) {
      const message = 'Map uploads are not supported by the backend yet.'
      setPostError(message)
      toast({
        title: 'Map upload unavailable',
        description: message,
        variant: 'destructive',
      })
      return
    }

    if (!title || !description || !primaryImage) {
      setPostError('Please add a title, description, and image.')
      return
    }

    try {
      setPostSubmitting(true)
      setPostError(null)

      if (isAnnouncement) {
        const body: AnnouncementRequest = { title, content: description }
        const response = await api.createAnnouncement(tournamentId, body, primaryImage)
        if (!response.ok) throw new Error(await readResponseError(response, {
          fallback: 'Failed to add announcement',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
        await mutateAnnouncements()
      } else if (isSchedule) {
        const body: ScheduleRequest = { name: title, description }
        const response = await api.addSchedule(tournamentId, body, primaryImage)
        if (!response.ok) throw new Error(await readResponseError(response, {
          fallback: 'Failed to add schedule',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
        await mutateSchedules()
      } else if (isNews) {
        const body: NewsRequest = {
          title,
          content: description,
          tags: [`tournament:${tournamentId}`, selectedNewsCategory],
        }
        const response = await api.createNews(body, primaryImage, extraImages)
        if (!response.ok) throw new Error(await readResponseError(response, {
          fallback: 'Failed to add news',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
        await mutateNews()
      } else {
        return
      }

      toast({
        title: 'Content submitted',
        description: `${title} has been added.`,
      })
      setPostTitle('')
      setPostDescription('')
      resetUploads()
      setIsAddPostModalOpen(false)
      setModalContext('')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to submit content'
      setPostError(message)
      console.error('Failed to submit content', e)
      toast({
        title: 'Failed to submit content',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setPostSubmitting(false)
    }
  }

  const handleSubmitJudge = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { fullName, email, phoneNumber } = judgeForm
    const hasAllFields = [fullName, email, phoneNumber].every((value) => Boolean(value && value.trim()))

    if (!hasAllFields) {
      toast({
        title: 'Missing information',
        description: 'Please fill in name, email, and phone.',
        variant: 'destructive'
      })
      return
    }

    setJudgeSubmitting(true)
    setJudgeError(null)

    try {
      const judgePayload = {
        fullName: fullName?.trim(),
        email: email?.trim(),
        phoneNumber: phoneNumber?.trim(),
        ...(judgeModalMode === 'edit' && editingJudge ? { checkedIn: editingJudge.checkedIn } : {}),
      }
      const response = judgeModalMode === 'edit' && editingJudge
        ? await api.updateJudge(tournamentId, editingJudge.id, judgePayload)
        : await api.addJudge(tournamentId, judgePayload)

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: judgeModalMode === 'edit' ? 'Failed to update judge' : 'Failed to add judge',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      toast({
        title: judgeModalMode === 'edit' ? 'Judge updated' : 'Judge submitted',
        description: judgeModalMode === 'edit' ? 'The judge details have been updated.' : 'The judge has been added to the roster.'
      })

      await mutateJudges()
      setJudgeForm({ fullName: '', email: '', phoneNumber: '' })
      setEditingJudge(null)
      setJudgeModalMode('add')
      setIsAddJudgeModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : judgeModalMode === 'edit' ? 'Failed to update judge' : 'Failed to add judge'
      setJudgeError(message)
      toast({
        title: judgeModalMode === 'edit' ? 'Failed to update judge' : 'Failed to add judge',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setJudgeSubmitting(false)
    }
  }

  const openAddJudgeModal = () => {
    setJudgeModalMode('add')
    setEditingJudge(null)
    setJudgeForm({ fullName: '', email: '', phoneNumber: '' })
    setJudgeError(null)
    setIsAddJudgeModalOpen(true)
  }

  const openEditJudgeModal = (judge: JudgeResponse) => {
    setJudgeModalMode('edit')
    setEditingJudge(judge)
    setJudgeForm({
      fullName: judge.fullName,
      email: judge.email || '',
      phoneNumber: judge.phoneNumber || '',
    })
    setJudgeError(null)
    setIsAddJudgeModalOpen(true)
  }

  const handleToggleJudgeCheckIn = async (judge: JudgeResponse) => {
    if (!isOrganizer) {
      toast({
        title: 'Insufficient permissions',
        description: 'Only organizers can check judges in.',
        variant: 'destructive',
      })
      return
    }

    const nextCheckedIn = !judge.checkedIn

    try {
      setUpdatingJudgeId(judge.id)
      const response = await api.updateJudge(tournamentId, judge.id, {
        fullName: judge.fullName,
        email: judge.email || undefined,
        phoneNumber: judge.phoneNumber || undefined,
        checkedIn: nextCheckedIn,
      })

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: nextCheckedIn ? 'Failed to check judge in' : 'Failed to uncheck judge',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateJudges()
      toast({
        title: nextCheckedIn ? 'Judge checked in' : 'Judge unchecked',
        description: `${judge.fullName} has been ${nextCheckedIn ? 'checked in' : 'unchecked'}.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to update judge check-in', error)
      toast({
        title: nextCheckedIn ? 'Failed to check judge in' : 'Failed to uncheck judge',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setUpdatingJudgeId(null)
    }
  }

  const handleDeleteJudge = async (judge: JudgeResponse) => {
    if (!isOrganizer) {
      toast({
        title: 'Insufficient permissions',
        description: 'Only organizers can remove judges.',
        variant: 'destructive',
      })
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${judge.fullName}?`)
    if (!confirmed) return

    try {
      setDeletingJudgeId(judge.id)
      const response = await api.deleteJudge(tournamentId, judge.id)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to remove judge',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateJudges()
      toast({
        title: 'Judge removed',
        description: `${judge.fullName} has been removed.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to remove judge', error)
      toast({
        title: 'Failed to remove judge',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setDeletingJudgeId(null)
    }
  }

  const handleAddAnnouncementComment = async (announcementId: number, content: string) => {
    const trimmedContent = content.trim()
    if (!trimmedContent) return

    try {
      const response = await api.addAnnouncementComment(tournamentId, announcementId, { content: trimmedContent })
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to add comment',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateAnnouncements()
      toast({
        title: 'Comment added',
        description: 'Your comment has been added.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment'
      console.error('Failed to add announcement comment', error)
      toast({
        title: 'Failed to add comment',
        description: message,
        variant: 'destructive',
      })
      throw error
    }
  }


  const isOrganizer = Boolean(
    currentUser &&
    organizers?.some((organizer) => organizer.id === currentUser.id)
  )
  const canManageTeams = isOrganizer

  useEffect(() => {
    if (!teams?.content) return

    setCheckInStatus((prev) => {
      let changed = false
      const next = { ...prev }

      teams.content.forEach((team) => {
        const teamWithCheckIn = team as SimpleTeamResponse & { checkedIn?: boolean }
        const nextValue = typeof teamWithCheckIn.checkedIn === 'boolean'
          ? teamWithCheckIn.checkedIn
          : (prev[team.id] ?? false)

        if (next[team.id] !== nextValue) {
          next[team.id] = nextValue
          changed = true
        }
      })

      return changed ? next : prev
    })
  }, [teams?.content])

  const handleToggleCheckIn = async (teamId: number) => {
    if (!canManageTeams) {
      toast({
        title: 'Insufficient permissions',
        description: 'Only organizers can check teams in.',
        variant: 'destructive',
      })
      return
    }

    const wasCheckedIn = checkInStatus[teamId] ?? false
    const nextCheckedIn = !wasCheckedIn

    setCheckInStatus((prev) => ({
      ...prev,
      [teamId]: nextCheckedIn,
    }))

    try {
      const response = nextCheckedIn
        ? await api.checkInTeam(tournamentId, teamId)
        : await api.uncheckInTeam(tournamentId, teamId)

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: nextCheckedIn ? 'Failed to check team in' : 'Failed to uncheck team',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateTeams()
      toast({
        title: nextCheckedIn ? 'Team checked in' : 'Team unchecked',
        description: nextCheckedIn ? 'The team has been checked in.' : 'The team has been unchecked.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      setCheckInStatus((prev) => ({
        ...prev,
        [teamId]: wasCheckedIn,
      }))
      console.error('Failed to update team check-in', error)
      toast({
        title: nextCheckedIn ? 'Failed to check team in' : 'Failed to uncheck team',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleDisqualifyTeam = async (teamId: number) => {
    if (!canManageTeams) {
      toast({
        title: 'Insufficient permissions',
        description: 'Only organizers can disqualify teams.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.disqualifyTeam(tournamentId, teamId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to disqualify team',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateTeams()
      toast({
        title: 'Team disqualified',
        description: 'The team has been disqualified.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to disqualify team', error)
      toast({
        title: 'Failed to disqualify team',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleRequalifyTeam = async (teamId: number) => {
    if (!canManageTeams) {
      toast({
        title: 'Insufficient permissions',
        description: 'Only organizers can requalify teams.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.requalifyTeam(tournamentId, teamId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to requalify team',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateTeams()
      toast({
        title: 'Team requalified',
        description: 'The team has been restored.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to requalify team', error)
      toast({
        title: 'Failed to requalify team',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleStartTournament = async () => {
    if (!isOrganizer || startingTournament) return

    try {
      setStartingTournament(true)
      const response = await api.startTournament(tournamentId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to start tournament',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      toast({
        title: 'Tournament started',
        description: 'Pairings and tournament workflow can now proceed.',
      })
      await Promise.all([
        mutateTournament?.(),
        mutateMatches?.(),
      ])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to start tournament', error)
      toast({
        title: 'Failed to start tournament',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setStartingTournament(false)
    }
  }

  const handleProceedToNextRound = async () => {
    if (!isOrganizer) return

    if (typeof selectedRoundGroupId !== 'number') {
      toast({
        title: 'Select a round first',
        description: 'Round data is still loading.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await api.proceedToNextRound(tournamentId, selectedRoundGroupId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to proceed to the next round',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      const nextRoundNumber = (currentRoundNumber ?? selectedRoundNumber ?? 0) + 1
      const nextRound = rounds?.find((round) => round.roundNumber === nextRoundNumber)

      await Promise.all([
        mutateRoundGroups?.(),
        mutateRounds?.(),
        mutateMatches?.(),
      ])

      if (nextRound) {
        setSelectedRound(nextRound.name)
      }

      toast({
        title: 'Round advanced',
        description: nextRound
          ? `${nextRound.name} is now active. Randomize it when you are ready.`
          : 'The tournament has proceeded to the next round.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to proceed to next round', error)
      toast({
        title: 'Failed to advance round',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const getSelectedRoundIds = () => {
    if (typeof selectedRoundGroupId === 'number' && typeof selectedRoundId === 'number') {
      return { roundGroupId: selectedRoundGroupId, roundId: selectedRoundId }
    }

    toast({
      title: 'Select a round first',
      description: 'Round data is still loading.',
      variant: 'destructive',
    })
    return null
  }

  const handleSubmitResults = async (results: MatchResultRequest[]) => {
    if (!isOrganizer || submittingResults) return false

    if (!results.length) {
      toast({
        title: 'No results to submit',
        description: 'Enter scores for the current round before submitting.',
        variant: 'destructive',
      })
      return false
    }

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return false

    try {
      setSubmittingResults(true)
      const response = await api.submitMatchResults(
        tournamentId,
        selectedIds.roundGroupId,
        selectedIds.roundId,
        results,
      )

      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to submit results',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await Promise.all([
        mutateMatches?.(),
        mutateRoundGroups?.(),
        mutateRounds?.(),
      ])
      toast({
        title: 'Results submitted',
        description: 'The current round results have been saved.',
      })
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to submit match results', error)
      toast({
        title: 'Failed to submit results',
        description: message,
        variant: 'destructive',
      })
      return false
    } finally {
      setSubmittingResults(false)
    }
  }

  const handleRandomizePairings = async () => {
    if (!isOrganizer) return

    if (!tournament?.started) {
      toast({
        title: 'Start tournament first',
        description: 'Start the tournament before randomizing pairings.',
        variant: 'destructive',
      })
      return
    }

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return

    try {
      const response = await api.randomizeMatches(tournamentId, selectedIds.roundGroupId, selectedIds.roundId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to randomize pairings',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateMatches?.()
      toast({
        title: 'Pairings randomized',
        description: 'The selected round pairings have been regenerated.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to randomize pairings', error)
      toast({
        title: 'Failed to randomize pairings',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleSubmitPairings = async () => {
    if (!isOrganizer) return

    if (!tournament?.started) {
      toast({
        title: 'Start tournament first',
        description: 'Start the tournament before publishing pairings.',
        variant: 'destructive',
      })
      return
    }

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return

    try {
      const response = await api.publishMatches(tournamentId, selectedIds.roundGroupId, selectedIds.roundId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to publish pairings',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateMatches?.()
      toast({
        title: 'Pairings published',
        description: 'The selected round pairings are now visible.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to publish pairings', error)
      toast({
        title: 'Failed to publish pairings',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateMatchRoom = async (matchId: number, location: string) => {
    await handleUpdateMatch(matchId, { location: location.trim() || null }, 'Room updated', 'The match room has been saved.')
  }

  const handleUpdateMatch = async (
    matchId: number,
    payload: MatchUpdateRequest,
    successTitle = 'Match updated',
    successDescription = 'The match changes have been saved.',
  ) => {
    if (!isOrganizer) return

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return

    try {
      setSavingMatchId(matchId)
      const response = await api.updateMatch(tournamentId, selectedIds.roundGroupId, selectedIds.roundId, matchId, payload)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to update match',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateMatches?.()
      toast({
        title: successTitle,
        description: successDescription,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to update match', error)
      toast({
        title: 'Failed to update match',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSavingMatchId(null)
    }
  }

  const handleClearMatches = async () => {
    if (!isOrganizer) return

    const selectedIds = getSelectedRoundIds()
    if (!selectedIds) return

    try {
      const response = await api.clearMatches(tournamentId, selectedIds.roundGroupId, selectedIds.roundId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to clear matches',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateMatches?.()
      toast({
        title: 'Matches cleared',
        description: 'The selected round matches have been removed.',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to clear matches', error)
      toast({
        title: 'Failed to clear matches',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const handleChangeStageFormat = async (stage: PairingStageId, nextFormat: PairingFormatOption) => {
    if (!isOrganizer) return

    try {
      const response = await api.changeRoundGroupFormat(
        tournamentId,
        { format: DEBATE_FORMAT_BY_OPTION[nextFormat] },
        { roundGroupType: ROUND_GROUP_TYPE_BY_STAGE[stage] },
      )
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to update round format',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }

      await mutateMatches?.()
      toast({
        title: 'Round format updated',
        description: `The ${stage} round group now uses ${nextFormat}.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to update round format', error)
      toast({
        title: 'Failed to update round format',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const closeJudgeModal = () => {
    setIsAddJudgeModalOpen(false)
    setJudgeModalMode('add')
    setEditingJudge(null)
    setJudgeForm({ fullName: '', email: '', phoneNumber: '' })
    setJudgeError(null)
  }

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!canManageTeams) {
      toast({
        title: 'Insufficient permissions',
        description: 'Only organizers can remove teams.',
        variant: 'destructive'
      })
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${teamName}?`)
    if (!confirmed) return

    try {
      setDeletingTeamId(teamId)
      const response = await api.removeTeam(tournamentId, teamId)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to remove team',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }
      await mutateTeams()
      toast({
        title: 'Team removed',
        description: `${teamName} has been removed.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to remove team', error)
      toast({
        title: 'Failed to remove team',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setDeletingTeamId(null)
    }
  }

  const handleEditTeam = (team: SimpleTeamResponse) => {
    const detailedTeam = team as TeamResponse
    const speakerUsernames = Array.isArray(detailedTeam.members)
      ? detailedTeam.members.map((member) => member.user.username)
      : []

    setTeamEditModalData({
      id: team.id,
      name: team.name,
      club: team.club?.name ?? "",
      speakerUsernames,
    })
  }

  const handleSaveEditedTeam = async ({ name, club, speakerUsernames }: { name: string; club: string; speakerUsernames: string[] }) => {
    if (!teamEditModalData || isSavingTeam) return

    const trimmedName = name.trim()
    const trimmedClub = club.trim()
    const trimmedSpeakers = speakerUsernames.map((speaker) => speaker.trim()).filter(Boolean)
    const currentSpeakers = teamEditModalData.speakerUsernames.map((speaker) => speaker.trim()).filter(Boolean)
    const payload: TeamUpdateOrganizerRequest = {}

    if (trimmedName && trimmedName !== teamEditModalData.name) {
      payload.name = trimmedName
    }

    if (trimmedClub !== teamEditModalData.club) {
      payload.club = trimmedClub
    }

    if (trimmedSpeakers.join('\n') !== currentSpeakers.join('\n')) {
      if (new Set(trimmedSpeakers).size !== trimmedSpeakers.length) {
        toast({
          title: 'Duplicate participant',
          description: 'A participant can only appear once in the same team.',
          variant: 'destructive',
        })
        return
      }

      if (trimmedSpeakers.length === 0) {
        toast({
          title: 'Missing participants',
          description: 'Add at least one participant before saving.',
          variant: 'destructive',
        })
        return
      }

      payload.members = trimmedSpeakers
    }

    if (!Object.keys(payload).length) {
      toast({
        title: 'No changes to save',
        description: 'Update the team details before saving.',
      })
      return
    }

    try {
      setIsSavingTeam(true)
      const response = await api.updateTeam_Organizer(tournamentId, teamEditModalData.id, payload)
      if (!response.ok) {
        throw new Error(await readResponseError(response, {
          fallback: 'Failed to update team',
          unauthorized: 'You do not have permission to perform this action.',
          serverError: 'Server error. Please try again later.',
        }))
      }
      await mutateTeams()
      toast({
        title: 'Team updated',
        description: `${payload.name ?? teamEditModalData.name} (${trimmedClub || 'No club'}) has been updated.`,
      })
      setTeamEditModalData(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again later.'
      console.error('Failed to update team', error)
      toast({
        title: 'Failed to update team',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsSavingTeam(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMainInfoDropdownOpen(false)
      }
      if (resultsDropdownRef.current && !resultsDropdownRef.current.contains(event.target as Node)) {
        setIsResultsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Tournament-specific news
  const { news, isLoading: newsLoading, error: newsError, mutate: mutateNews } = useNews(
    { tags: [`tournament:${tournamentId}`] },
    { page: 0, size: 20, sort: ['timestamp,desc'] }
  )

  const handleMainInfoOptionSelect = (option: 'Announcements' | 'Schedule' | 'Map') => {
    setSelectedMainInfoOption(option)
    setIsMainInfoDropdownOpen(false)
    setActiveTab('Main Info')
  }

  const handleResultsOptionSelect = (option: 'APF' | 'BPF' | 'LD') => {
    setSelectedResultsOption(option)
    setIsResultsDropdownOpen(false)
    setActiveTab('Results and Statistics')

    if (option === 'LD') {
      setActiveResultsSection('1/16')
      setSelectedRound('1/16')
    } else {
      setActiveResultsSection(`${option} Speaker Score`)
      setResultsSubTab('Speaker Score')
      // APF/BPF use the preliminary "Round N" rounds. Reset away from any stale
      // elimination round (e.g. "1/16" left over from LD) to the active round so the
      // results table doesn't render empty.
      setSelectedRound(`Round ${currentRoundNumber ?? selectedRoundNumber ?? 1}`)
    }
  }

  const openContentModal = (context: 'announcements' | 'schedule' | 'map' | 'news') => {
    if (context === 'map') {
      toast({
        title: 'Map upload unavailable',
        description: 'Map uploads are not supported by the backend yet.',
        variant: 'destructive',
      })
      return
    }

    setPostError(null)
    setModalContext(context)
    setIsAddPostModalOpen(true)
  }

  const closeAddPostModal = () => {
    setIsAddPostModalOpen(false)
    setModalContext('')
    setPostTitle('')
    setPostDescription('')
    setPostError(null)
    resetUploads()
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">

      <TournamentHeader
        tournamentName={tournament?.name}
        tournamentLoading={tournamentLoading}
        tournamentError={tournamentError}
        isOrganizer={isOrganizer}
        isTournamentEnabled={isTournamentEnabled}
        toggleTournamentLoading={toggleTournamentLoading}
        onToggleTournament={handleTournamentToggle}
        onOpenInvite={isOrganizer ? () => setIsInviteModalOpen(true) : undefined}
        onStartTournament={isOrganizer && !tournament?.started ? handleStartTournament : undefined}
        startTournamentLoading={startingTournament}
      />

      <section className="px-12">
        <TournamentTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedMainInfoOption={selectedMainInfoOption}
          isMainInfoDropdownOpen={isMainInfoDropdownOpen}
          onToggleMainInfoDropdown={() => setIsMainInfoDropdownOpen((prev) => !prev)}
          onMainInfoOptionSelect={handleMainInfoOptionSelect}
          mainInfoDropdownRef={dropdownRef}
          selectedResultsOption={selectedResultsOption}
          isResultsDropdownOpen={isResultsDropdownOpen}
          onToggleResultsDropdown={() => setIsResultsDropdownOpen((prev) => !prev)}
          onResultsOptionSelect={handleResultsOptionSelect}
          resultsDropdownRef={resultsDropdownRef}
        />
      </section>

      <div className="px-12 pb-16">
        {activeTab === 'Main Info' && (
          <MainInfoSection
            selectedOption={selectedMainInfoOption}
            tournament={tournament}
            tournamentLoading={tournamentLoading}
            tournamentError={tournamentError}
            announcements={announcements}
            announcementsLoading={announcementsLoading}
            announcementsError={announcementsError}
            schedules={schedules}
            schedulesLoading={schedulesLoading}
            schedulesError={schedulesError}
            onOpenModal={isOrganizer ? openContentModal : undefined}
            onAddAnnouncementComment={currentUser ? handleAddAnnouncementComment : undefined}
          />
        )}

        {activeTab === 'Teams' && (
          <TeamsSection
            teams={teams}
            teamsLoading={teamsLoading}
            teamsError={teamsError}
            checkInStatus={checkInStatus}
            onToggleCheckIn={canManageTeams ? handleToggleCheckIn : undefined}
            onDeleteTeam={canManageTeams ? (teamId => {
              const team = teams?.content.find((t) => t.id === teamId)
              if (team) {
                void handleDeleteTeam(teamId, team.name)
              }
            }) : undefined}
            onEditTeam={canManageTeams ? handleEditTeam : undefined}
            onDisqualifyTeam={canManageTeams ? handleDisqualifyTeam : undefined}
            onRequalifyTeam={canManageTeams ? handleRequalifyTeam : undefined}
          />
        )}

        {activeTab === 'Judges' && (
          <JudgesSection
            judges={judges}
            judgesLoading={judgesLoading}
            judgesError={judgesError}
            onAddJudge={isOrganizer ? openAddJudgeModal : undefined}
            onToggleJudgeCheckIn={isOrganizer ? handleToggleJudgeCheckIn : undefined}
            onEditJudge={isOrganizer ? openEditJudgeModal : undefined}
            onDeleteJudge={isOrganizer ? handleDeleteJudge : undefined}
            updatingJudgeId={updatingJudgeId}
            deletingJudgeId={deletingJudgeId}
          />
        )}

        {activeTab === 'Pairing and Matches' && (
          <PairingsSection
            matches={matches}
            rounds={rounds}
            teams={teams}
            judges={judges}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            selectedStage={selectedPairingStage}
            selectedRound={selectedRound}
            selectedRoundNumber={selectedRoundNumber}
            currentRoundNumber={currentRoundNumber}
            onSelectStage={setSelectedPairingStage}
            onSelectRound={setSelectedRound}
            onProceedToNextRound={isOrganizer ? handleProceedToNextRound : undefined}
            onRandomizePairings={isOrganizer ? handleRandomizePairings : undefined}
            onSubmitPairings={isOrganizer ? handleSubmitPairings : undefined}
            onClearMatches={isOrganizer ? handleClearMatches : undefined}
            onChangeStageFormat={isOrganizer ? handleChangeStageFormat : undefined}
            onUpdateMatchRoom={isOrganizer ? handleUpdateMatchRoom : undefined}
            onUpdateMatch={isOrganizer ? handleUpdateMatch : undefined}
            savingMatchId={savingMatchId}
            resultStorageKey={resultStorageKey}
          />
        )}

        {activeTab === 'Results and Statistics' && (
          <ResultsSection
            selectedResultsOption={selectedResultsOption}
            resultsSubTab={resultsSubTab}
            onResultsSubTabChange={setResultsSubTab}
            bpfSubTab={bpfSubTab}
            activeResultsSection={activeResultsSection}
            onActiveResultsSectionChange={setActiveResultsSection}
            selectedRound={selectedRound}
            onSelectedRoundChange={setSelectedRound}
            rounds={rounds}
            teams={teams}
            teamsLoading={teamsLoading}
            teamsError={teamsError}
            matches={matches}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            selectedRoundNumber={selectedRoundNumber}
            currentRoundNumber={currentRoundNumber}
            canManageTeams={!!canManageTeams}
            onDeleteTeam={handleDeleteTeam}
            deletingTeamId={deletingTeamId}
            onSubmitResults={isOrganizer ? handleSubmitResults : undefined}
            isSubmittingResults={submittingResults}
            resultStorageKey={resultStorageKey}
          />
        )}
      </div>

      {activeTab === 'News' && (
        <NewsSection
          news={news}
          newsLoading={newsLoading}
          newsError={newsError}
          onAddNews={isOrganizer ? () => openContentModal('news') : undefined}
        />
      )}

      {activeTab === 'Feedback' && (
        <FeedbackSection
          tournamentId={tournamentId}
          feedbacks={feedbacks}
          feedbacksLoading={feedbacksLoading}
          feedbacksError={feedbacksError}
          onFeedbackAdded={mutateFeedbacks}
        />
      )}

      <EditTeamModal
        isOpen={!!teamEditModalData}
        teamName={teamEditModalData?.name}
        clubName={teamEditModalData?.club}
        speakerUsernames={teamEditModalData?.speakerUsernames}
        isSaving={isSavingTeam}
        onClose={() => setTeamEditModalData(null)}
        onSave={handleSaveEditedTeam}
      />

      <AddPostModal
        isOpen={isAddPostModalOpen}
        modalContext={modalContext}
        postTitle={postTitle}
        postDescription={postDescription}
        selectedNewsCategory={selectedNewsCategory}
        imagePreviews={imagePreviews}
        uploadErrors={uploadErrors}
        isSubmitting={postSubmitting}
        errorMessage={postError}
        dzAnimate={dzAnimate}
        formatBytes={formatBytes}
        onClose={closeAddPostModal}
        onSubmit={handleAddPost}
        onTitleChange={setPostTitle}
        onDescriptionChange={setPostDescription}
        onCategoryChange={setSelectedNewsCategory}
        onImageUpload={handleImageUpload}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onRemoveImage={removeImageByKey}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        members={tournamentMembers}
        activeTab={inviteModalTab}
        onTabChange={setInviteModalTab}
        onClose={() => setIsInviteModalOpen(false)}
      />

      <AddJudgeModal
        isOpen={isAddJudgeModalOpen}
        form={judgeForm}
        onClose={closeJudgeModal}
        onSubmit={handleSubmitJudge}
        onChange={(field, value) => setJudgeForm((prev) => ({ ...prev, [field]: value }))}
        isSubmitting={judgeSubmitting}
        errorMessage={judgeError}
        title={judgeModalMode === 'edit' ? 'Edit Judge' : 'Add Judge'}
        submitLabel={judgeModalMode === 'edit' ? 'Save Judge' : 'Submit'}
      />
    </div>
  )
}
