"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import { useParams } from "next/navigation"
import Header from "@/components/Header"
import { AddJudgeModal } from "@/components/tournament/AddJudgeModal"
import { AddPostModal } from "@/components/tournament/AddPostModal"
import { FeedbackSection } from "@/components/tournament/FeedbackSection"
import { InviteModal } from "@/components/tournament/InviteModal"
import { JudgesSection } from "@/components/tournament/JudgesSection"
import { MainInfoSection } from "@/components/tournament/MainInfoSection"
import { NewsSection } from "@/components/tournament/NewsSection"
import { PairingsSection } from "@/components/tournament/PairingsSection"
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
  useTournamentJudges,
  useTournamentFeedbacks,
  useNews,
  useCurrentUser,
} from "@/hooks/use-api"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Role } from "@/types/user/user"
import type { SimpleTeamResponse, TeamUpdateParticipantRequest } from "@/types/tournament/team"
import type { JudgeRequest } from "@/types/tournament/judge"
import type { NewsRequest } from "@/types/news"

export default function TournamentDetailPage() {
  const params = useParams()
  const tournamentId = parseInt(params.id as string)
  const { user: currentUser } = useCurrentUser()
  const { toast } = useToast()

  // API hooks
  const { tournament, isLoading: tournamentLoading, error: tournamentError } = useTournament(tournamentId)
  const { participants } = useTournamentParticipants(tournamentId)
  const { teams, isLoading: teamsLoading, error: teamsError, mutate: mutateTeams } = useTournamentTeams(tournamentId)
  const { announcements, isLoading: announcementsLoading, error: announcementsError } = useTournamentAnnouncements(tournamentId)
  const { judges, isLoading: judgesLoading, error: judgesError, mutate: mutateJudges } = useTournamentJudges(tournamentId)
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
  const [selectedRound, setSelectedRound] = useState('1/16')
  const [bpfSubTab] = useState('BPF Results')
  const [activeResultsSection, setActiveResultsSection] = useState('APF Speaker Score')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [teamEditModalData, setTeamEditModalData] = useState<{ id: number; name: string; club: string } | null>(null)
  const [isSavingTeam, setIsSavingTeam] = useState(false)

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
  // Check-in state for each participant row
  const [checkInStatus, setCheckInStatus] = useState<{[key: number]: boolean}>({})
  
  // Toggle check-in status for a participant
  const toggleCheckIn = (participantId: number) => {
    setCheckInStatus(prev => ({
      ...prev,
      [participantId]: !prev[participantId]
    }))
  }
  
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false)
  const [isAddJudgeModalOpen, setIsAddJudgeModalOpen] = useState(false)
  const [modalContext, setModalContext] = useState<'announcements' | 'schedule' | 'map' | 'news' | ''>('')
  const [postTitle, setPostTitle] = useState('')
  const [postDescription, setPostDescription] = useState('')
  const [judgeForm, setJudgeForm] = useState<JudgeRequest>({ fullName: '', email: '', phoneNumber: '' })
  const [judgeSubmitting, setJudgeSubmitting] = useState(false)
  const [judgeError, setJudgeError] = useState<string | null>(null)
  const [deletingTeamId, setDeletingTeamId] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsDropdownRef = useRef<HTMLDivElement>(null)
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<'Important' | 'Update' | 'Info'>('Info')

  const { isTournamentEnabled, toggleTournamentLoading, handleTournamentToggle } = useTournamentVisibility({
    tournament,
    toast,
  })

  const {
    matches,
    isLoading: matchesLoading,
    error: matchesError,
  } = useRoundSelection({
    tournamentId,
    selectedRoundLabel: selectedRound,
    pageable: { page: 0, size: 50 },
  })

  const handleAddPost = async () => {
    const isAnnouncement = modalContext === 'announcements'
    const isNews = modalContext === 'news'
    const isValidAnnouncement = isAnnouncement && postTitle.trim() && postDescription.trim()
    const isValidNews = isNews && postTitle.trim() && postDescription.trim() && postImages.length > 0
    const isValidOther = !isAnnouncement && !isNews // Schedule and map just need images

    try {
      if (isValidAnnouncement || isValidNews || isValidOther) {
        if (isNews) {
          const [thumbnail, ...images] = postImages
          const body: NewsRequest = {
            title: postTitle.trim(),
            content: postDescription.trim(),
            tags: [`tournament:${tournamentId}`, selectedNewsCategory],
          }
          await api.createNews(body, thumbnail, images)
          await mutateNews()
        }

        if (isAnnouncement) {
          // reset text fields for announcements form
          setPostTitle('')
          setPostDescription('')
        }
        // reset common fields
        resetUploads()
        setIsAddPostModalOpen(false)
        setModalContext('')
      }
    } catch (e) {
      console.error('Failed to submit content', e)
    }
  }

  const handleAddJudge = async (event: FormEvent<HTMLFormElement>) => {
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
      const response = await api.addJudge(tournamentId, {
        fullName: fullName?.trim(),
        email: email?.trim(),
        phoneNumber: phoneNumber?.trim(),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to add judge')
      }

      toast({
        title: 'Judge submitted',
        description: 'The judge has been added to the roster.'
      })

      await mutateJudges()
      setJudgeForm({ fullName: '', email: '', phoneNumber: '' })
      setIsAddJudgeModalOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add judge'
      setJudgeError(message)
      toast({
        title: 'Failed to add judge',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setJudgeSubmitting(false)
    }
  }


  const canManageTeams = currentUser?.role === Role.ORGANIZER
  const isDebater = currentUser?.role === Role.PARTICIPANT

  const closeJudgeModal = () => {
    setIsAddJudgeModalOpen(false)
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
      await api.removeTeam(tournamentId, teamId)
      await mutateTeams()
      toast({
        title: 'Team removed',
        description: `${teamName} has been removed.`,
      })
    } catch (error) {
      console.error('Failed to remove team', error)
      toast({
        title: 'Failed to remove team',
        description: 'Please try again later.',
        variant: 'destructive'
      })
    } finally {
      setDeletingTeamId(null)
    }
  }

  const handleEditTeam = (team: SimpleTeamResponse) => {
    setTeamEditModalData({
      id: team.id,
      name: team.name,
      club: team.club?.name ?? "",
    })
  }

  const handleSaveEditedTeam = async ({ name, club }: { name: string; club: string }) => {
    if (!teamEditModalData || isSavingTeam) return

    const trimmedName = name.trim()
    const trimmedClub = club.trim()
    const payload: TeamUpdateParticipantRequest = {}

    if (trimmedName && trimmedName !== teamEditModalData.name) {
      payload.name = trimmedName
    }

    if (trimmedClub !== teamEditModalData.club) {
      payload.club = trimmedClub
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
      await api.updateTeam_Participant(tournamentId, teamEditModalData.id, payload)
      await mutateTeams()
      toast({
        title: 'Team updated',
        description: `${payload.name ?? teamEditModalData.name} (${trimmedClub || 'No club'}) has been updated.`,
      })
      setTeamEditModalData(null)
    } catch (error) {
      console.error('Failed to update team', error)
      toast({
        title: 'Failed to update team',
        description: 'Please try again later.',
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

  const isOrganizer = currentUser?.role === Role.ORGANIZER

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
    }
  }

  const openContentModal = (context: 'announcements' | 'schedule' | 'map' | 'news') => {
    setModalContext(context)
    setIsAddPostModalOpen(true)
  }

  const closeAddPostModal = () => {
    setIsAddPostModalOpen(false)
    setModalContext('')
    resetUploads()
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      <TournamentHeader
        tournamentName={tournament?.name}
        tournamentLoading={tournamentLoading}
        tournamentError={tournamentError}
        isOrganizer={isOrganizer}
        isTournamentEnabled={isTournamentEnabled}
        toggleTournamentLoading={toggleTournamentLoading}
        onToggleTournament={handleTournamentToggle}
        onOpenInvite={() => setIsInviteModalOpen(true)}
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
            onOpenModal={openContentModal}
          />
        )}

        {activeTab === 'Teams' && (
          <TeamsSection
            teams={teams}
            teamsLoading={teamsLoading}
            teamsError={teamsError}
            checkInStatus={checkInStatus}
            onToggleCheckIn={toggleCheckIn}
            onDeleteTeam={canManageTeams ? (teamId => {
              const team = teams?.content.find((t) => t.id === teamId)
              if (team) {
                void handleDeleteTeam(teamId, team.name)
              }
            }) : undefined}
            onEditTeam={isDebater ? handleEditTeam : undefined}
            isDebaterView={isDebater}
          />
        )}

        {activeTab === 'Judges' && (
          <JudgesSection
            judges={judges}
            judgesLoading={judgesLoading}
            judgesError={judgesError}
            onAddJudge={() => setIsAddJudgeModalOpen(true)}
          />
        )}

        {activeTab === 'Pairing and Matches' && (
          <PairingsSection
            matches={matches}
            matchesLoading={matchesLoading}
            matchesError={matchesError}
            selectedRound={selectedRound}
            onSelectRound={setSelectedRound}
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
            teams={teams}
            teamsLoading={teamsLoading}
            teamsError={teamsError}
            canManageTeams={!!canManageTeams}
            onDeleteTeam={handleDeleteTeam}
            deletingTeamId={deletingTeamId}
          />
        )}
      </div>

      {activeTab === 'News' && (
        <NewsSection
          news={news}
          newsLoading={newsLoading}
          newsError={newsError}
          onAddNews={() => openContentModal('news')}
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
        onSubmit={handleAddJudge}
        onChange={(field, value) => setJudgeForm((prev) => ({ ...prev, [field]: value }))}
        isSubmitting={judgeSubmitting}
        errorMessage={judgeError}
      />
    </div>
  )
}
