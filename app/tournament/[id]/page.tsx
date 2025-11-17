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
import { useTournamentVisibility } from "@/hooks/tournament/useTournamentVisibility"
import { useImageUpload } from "@/hooks/tournament/useImageUpload"
import { useRoundSelection } from "@/hooks/tournament/useRoundSelection"
import { useTournament, useTournamentParticipants, useTournamentTeams, useTournamentAnnouncements, useNews, useCurrentUser } from "@/hooks/use-api"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Role } from "@/types/user/user"

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

  const tournamentMembers = participants?.content.slice(0, 5).map(participant => ({
    id: participant.id,
    name: `${participant.user.firstName} ${participant.user.lastName}`,
    avatar: participant.user.imageUrl?.url || '/avatar-placeholder.jpg'
  })) || []
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
  const [judgeForm, setJudgeForm] = useState({ name: '', club: '', phone: '' })
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
          const body = {
            title: postTitle,
            content: postDescription,
            tags: [`tournament:${tournamentId}`, selectedNewsCategory],
          }
          await api.createNews(body as any, thumbnail, images)
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

  const handleAddJudge = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasAllFields = Object.values(judgeForm).every((value) => value.trim())

    if (!hasAllFields) {
      toast({
        title: 'Missing information',
        description: 'Please fill in name, club, and phone.',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Judge submitted',
      description: 'This action will be wired to the backend soon.'
    })

    setJudgeForm({ name: '', club: '', phone: '' })
    setIsAddJudgeModalOpen(false)
  }


  const canManageTeams = currentUser?.role === Role.ORGANIZER

  const closeJudgeModal = () => {
    setIsAddJudgeModalOpen(false)
    setJudgeForm({ name: '', club: '', phone: '' })
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
    { tags: [`tournament:${tournamentId}`] } as any,
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
          />
        )}

        {activeTab === 'Judges' && (
          <JudgesSection onAddJudge={() => setIsAddJudgeModalOpen(true)} />
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

      {activeTab === 'Feedback' && <FeedbackSection />}

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
      />
    </div>
  )
}
