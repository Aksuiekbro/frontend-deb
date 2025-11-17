"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Header from "../../../components/Header"
import { useTournament, useTournamentParticipants, useTournamentTeams, useTournamentAnnouncements, useRoundGroups, useRounds, useMatches, useNews, useCurrentUser } from "../../../hooks/use-api"
import { api } from "../../../lib/api"
import { LoadingState, Skeleton } from "../../../components/ui/loading"
import { ErrorState } from "../../../components/ui/error"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Role } from "@/types/user/user"

export default function TournamentDetailPage() {
  const params = useParams()
  const tournamentId = parseInt(params.id as string)
  const { user: currentUser } = useCurrentUser()
  const { toast } = useToast()

  // API hooks
  const { tournament, isLoading: tournamentLoading, error: tournamentError } = useTournament(tournamentId)
  const { participants, isLoading: participantsLoading, error: participantsError } = useTournamentParticipants(tournamentId)
  const { teams, isLoading: teamsLoading, error: teamsError } = useTournamentTeams(tournamentId)
  const { announcements, isLoading: announcementsLoading, error: announcementsError } = useTournamentAnnouncements(tournamentId)

  const [activeTab, setActiveTab] = useState('Main Info')
  const [isMainInfoDropdownOpen, setIsMainInfoDropdownOpen] = useState(false)
  const [selectedMainInfoOption, setSelectedMainInfoOption] = useState('Announcements')
  const [isResultsDropdownOpen, setIsResultsDropdownOpen] = useState(false)
  const [selectedResultsOption, setSelectedResultsOption] = useState('APF')
  const [resultsSubTab, setResultsSubTab] = useState('Speaker Score')
  const [selectedRound, setSelectedRound] = useState('1/16')
  const [bpfSubTab, setBpfSubTab] = useState('BPF Results')
  // Add new state for active section (mutually exclusive)
  const [activeResultsSection, setActiveResultsSection] = useState('APF Speaker Score')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitedUsers, setInvitedUsers] = useState([])
  const [imagePreviews, setImagePreviews] = useState<Array<{
    key: string
    name: string
    sizeBytes: number
    src: string
    progress: number
    status: 'loading' | 'done' | 'error'
    error?: string
  }>>([])
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [dzAnimate, setDzAnimate] = useState(false)

  const MAX_SIZE = 10 * 1024 * 1024 // 10MB
  const CHECK_ICON_URL = 'http://localhost:3845/assets/34c9396e092463c20579b8768a873faee7143b0b.svg'

  function formatBytes(bytes: number) {
    return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
  }

  // Get tournament organizers and participants for invited users
  const tournamentMembers = participants?.content.slice(0, 5).map(participant => ({
    id: participant.id,
    name: `${participant.user.firstName} ${participant.user.lastName}`,
    avatar: participant.user.imageUrl?.url || '/avatar-placeholder.jpg'
  })) || []
  const [inviteModalTab, setInviteModalTab] = useState('invite')  
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
  const [modalContext, setModalContext] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postDescription, setPostDescription] = useState('')
  const [postImages, setPostImages] = useState<File[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsDropdownRef = useRef<HTMLDivElement>(null)

  // Pairing & Matches: selected IDs for round group and round
  const [selectedRoundGroupId, setSelectedRoundGroupId] = useState<number | null>(null)
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null)

  // News modal: category tag
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<'Important' | 'Update' | 'Info'>('Info')
  const [isTournamentEnabled, setIsTournamentEnabled] = useState(false)
  const [toggleTournamentLoading, setToggleTournamentLoading] = useState(false)

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
        setPostImages([])
        setIsAddPostModalOpen(false)
        setModalContext('')
      }
    } catch (e) {
      console.error('Failed to submit content', e)
    }
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return
    const nextErrors: string[] = []
    const validFiles: File[] = []
    const nextPreviews: typeof imagePreviews = []

    Array.from(files).forEach((file) => {
      const key = `${file.name}-${file.lastModified}-${file.size}`
      if (!file.type.startsWith('image/')) {
        nextErrors.push(`${file.name}: not an image`)
        return
      }
      if (file.size > MAX_SIZE) {
        nextErrors.push(`${file.name}: exceeds 10MB`)
        return
      }
      validFiles.push(file)
      nextPreviews.push({ key, name: file.name, sizeBytes: file.size, src: '', progress: 0, status: 'loading' })

      const reader = new FileReader()
      reader.onprogress = (e) => {
        if (!e.lengthComputable) return
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100))
        setImagePreviews((prev) => prev.map(p => p.key === key ? { ...p, progress: pct } : p))
      }
      reader.onload = () => {
        const src = typeof reader.result === 'string' ? reader.result : ''
        setImagePreviews((prev) => prev.map(p => p.key === key ? { ...p, src, progress: 100, status: 'done' } : p))
        // trigger dropzone right-border slide animation on load complete
        setDzAnimate(true)
        setTimeout(() => setDzAnimate(false), 800)
      }
      reader.onerror = () => {
        setImagePreviews((prev) => prev.map(p => p.key === key ? { ...p, status: 'error', error: 'Failed to load preview' } : p))
      }
      reader.readAsDataURL(file)
    })

    if (nextErrors.length) setUploadErrors(nextErrors)
    if (nextPreviews.length) setImagePreviews((prev) => [...prev, ...nextPreviews])
    if (validFiles.length) setPostImages((prev) => [...prev, ...validFiles])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    handleImageUpload(files)
  }

  const removeImageByKey = (key: string) => {
    setImagePreviews((prev) => prev.filter(p => p.key !== key))
    setPostImages((prev) => prev.filter(f => `${f.name}-${f.lastModified}-${f.size}` !== key))
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

  useEffect(() => {
    return () => {
      setImagePreviews([])
    }
  }, [])

  // Fetch round groups/rounds/matches IDs based on UI selection
  const { roundGroups } = useRoundGroups(tournamentId)

  useEffect(() => {
    if (!roundGroups || roundGroups.length === 0) return
    const isElimination = ['1/16', '1/8', '1/4', '1/2'].includes(selectedRound)
    const preferredType = isElimination ? 'TEAM_ELIMINATION' : 'PRELIMINARY'
    const preferredGroup = roundGroups.find(rg => rg.type === preferredType) || roundGroups[0]
    if (preferredGroup && preferredGroup.id !== selectedRoundGroupId) {
      setSelectedRoundGroupId(preferredGroup.id)
    }
  }, [roundGroups, selectedRound, selectedRoundGroupId])

  const { rounds } = useRounds(tournamentId, selectedRoundGroupId ?? undefined)

  useEffect(() => {
    if (!rounds || rounds.length === 0) return
    // Try match by name first (e.g., '1/16', '1/8', ...)
    let next = rounds.find(r => r.name === selectedRound)
    // Fallback to roundNumber if UI label is like 'Round N'
    if (!next && selectedRound.startsWith('Round ')) {
      const num = parseInt(selectedRound.replace('Round ', ''))
      if (!Number.isNaN(num)) {
        next = rounds.find(r => r.roundNumber === num)
      }
    }
    // Fallback to first round
    next = next || rounds[0]
    if (next && next.id !== selectedRoundId) {
      setSelectedRoundId(next.id)
    }
  }, [rounds, selectedRound, selectedRoundId])

  const { matches, isLoading: matchesLoading, error: matchesError } = useMatches(
    tournamentId,
    selectedRoundGroupId ?? undefined,
    selectedRoundId ?? undefined,
    { page: 0, size: 50 }
  )

  // Tournament-specific news
  const { news, isLoading: newsLoading, error: newsError, mutate: mutateNews } = useNews(
    { tags: [`tournament:${tournamentId}`] } as any,
    { page: 0, size: 20, sort: ['timestamp,desc'] }
  )

  useEffect(() => {
    if (typeof tournament?.enabled === 'boolean') {
      setIsTournamentEnabled(tournament.enabled)
    }
  }, [tournament?.enabled])

  const isOrganizer = currentUser?.role === Role.ORGANIZER

  const handleTournamentToggle = async (nextValue: boolean) => {
    if (!tournament) return
    const previousValue = isTournamentEnabled
    setIsTournamentEnabled(nextValue)
    setToggleTournamentLoading(true)

    try {
      const response = nextValue
        ? await api.enableTournament(tournament.id)
        : await api.disableTournament(tournament.id)

      if (!response.ok) {
        throw new Error("Failed to update tournament visibility")
      }

      toast({
        title: nextValue ? "Tournament enabled" : "Tournament disabled",
        description: nextValue
          ? `${tournament.name} is now visible to participants.`
          : `${tournament.name} is now hidden from participants.`,
      })
    } catch (error) {
      console.error("Failed to toggle tournament status", error)
      setIsTournamentEnabled(previousValue)
      toast({
        title: "Unable to update tournament",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setToggleTournamentLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Page Title */}
      <section className="px-12 py-8">
        <div className="flex justify-between items-center mb-8">
          {tournamentLoading ? (
            <Skeleton className="h-12 w-96" />
          ) : tournamentError ? (
            <h1 className="text-[#0D1321] text-[48px] font-bold">Tournament: Error loading data</h1>
          ) : (
            <h1 className="text-[#0D1321] text-[48px] font-bold">Tournament: {tournament?.name || "Unknown Tournament"}</h1>
          )}
          <div className="flex items-center gap-4">
            {isOrganizer && (
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm font-medium text-[#0D1321]">
                  {isTournamentEnabled ? "Tournament enabled" : "Tournament disabled"}
                </span>
                <Switch
                  checked={isTournamentEnabled}
                  onCheckedChange={handleTournamentToggle}
                  disabled={toggleTournamentLoading || tournamentLoading}
                  aria-label="Toggle tournament visibility"
                />
              </div>
            )}
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="px-6 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
            >
              Invite
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div role="tablist" className="flex border-b border-gray-300 mb-8">
          {/* Main Info Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              role="tab"
              aria-selected={activeTab === 'Main Info'}
              aria-controls="main-info-panel"
              tabIndex={activeTab === 'Main Info' ? 0 : -1}
              onClick={() => {
                setActiveTab('Main Info')
                setIsMainInfoDropdownOpen(!isMainInfoDropdownOpen)
              }}
              className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'Main Info'
                  ? 'text-[#0D1321] border-[#0D1321]'
                  : 'text-[#9a8c98] border-transparent hover:text-[#4a4e69]'
              }`}
            >
              {selectedMainInfoOption}
              <svg 
                className={`w-4 h-4 transition-transform ${isMainInfoDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isMainInfoDropdownOpen && (
              <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[160px]">
                <button
                  onClick={() => {
                    setSelectedMainInfoOption('Announcements')
                    setIsMainInfoDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
                >
                  Announcements
                </button>
                <button
                  onClick={() => {
                    setSelectedMainInfoOption('Schedule')
                    setIsMainInfoDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
                >
                  Schedule
                </button>
                <button
                  onClick={() => {
                    setSelectedMainInfoOption('Map')
                    setIsMainInfoDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
                >
                  Map
                </button>
              </div>
            )}
          </div>

          {/* Other Tabs */}
          {['Teams', 'Judges', 'Pairing and Matches'].map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`${tab.toLowerCase().replace(/\s+/g, '-')}-panel`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-[#0D1321] border-[#0D1321]'
                  : 'text-[#9a8c98] border-transparent hover:text-[#4a4e69]'
              }`}
            >
              {tab}
            </button>
          ))}

          {/* Results and Statistics Dropdown */}
          <div className="relative" ref={resultsDropdownRef}>
            <button
              role="tab"
              aria-selected={activeTab === 'Results and Statistics'}
              aria-controls="results-and-statistics-panel"
              tabIndex={activeTab === 'Results and Statistics' ? 0 : -1}
              onClick={() => {
                setActiveTab('Results and Statistics')
                setIsResultsDropdownOpen(!isResultsDropdownOpen)
              }}
              className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'Results and Statistics'
                  ? 'text-[#0D1321] border-[#0D1321]'
                  : 'text-[#9a8c98] border-transparent hover:text-[#4a4e69]'
              }`}
            >
              Results and Statistics
              <svg 
                className={`w-4 h-4 transition-transform ${isResultsDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isResultsDropdownOpen && (
              <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setSelectedResultsOption('APF')
                    setIsResultsDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
                >
                  APF
                </button>
                <button
                  onClick={() => {
                    setSelectedResultsOption('BPF')
                    setIsResultsDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
                >
                  BPF
                </button>
                <button
                  onClick={() => {
                    setSelectedResultsOption('LD')
                    setActiveResultsSection('1/16')
                    setSelectedRound('1/16')
                    setIsResultsDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
                >
                  LD
                </button>
              </div>
            )}
          </div>

          {/* News and Feedback Tabs */}
          {['News', 'Feedback'].map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`${tab.toLowerCase()}-panel`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-[18px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-[#0D1321] border-[#0D1321]'
                  : 'text-[#9a8c98] border-transparent hover:text-[#4a4e69]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <div className="px-12 pb-16">
        {/* Announcements Content */}
        {activeTab === 'Main Info' && selectedMainInfoOption === 'Announcements' && (
          <div>
            <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Announcements</h2>
            <div className="relative bg-[#E5E5E5] rounded-lg border border-gray-300 min-h-[400px] p-6">
              <LoadingState
                isLoading={announcementsLoading}
                fallback={<Skeleton className="h-32 w-full" />} children={undefined}></LoadingState>
                {announcementsError ? (
                  <div className="text-center text-red-500 text-[16px] py-20">
                    Failed to load announcements
                  </div>
                ) : announcements && announcements.content.length > 0 ? (
                  <div className="space-y-6">
                    {announcements.content.map((announcement) => (
                      <div key={announcement.id} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-[#0D1321] text-[20px] font-bold">{announcement.title}</h3>
                          <span className="text-[#9a8c98] text-[14px]">
                            {new Date(announcement.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">{announcement.content}</p>
                        {announcement.user && (
                          <div className="text-[#9a8c98] text-[14px]">
                            Posted by {announcement.user.firstName} {announcement.user.lastName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-[#9a8c98] text-[16px] py-20">
                    No announcements yet
                  </div>
                )}
              
              {/* Add announcement button */}
              <button 
                onClick={() => {
                  setIsAddPostModalOpen(true)
                  setModalContext('announcements')
                }}
                className="absolute bottom-6 right-6 w-12 h-12 bg-[#0D1321] text-white rounded-full flex items-center justify-center hover:bg-[#22223b] transition-colors shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Schedule Content */}
        {activeTab === 'Main Info' && selectedMainInfoOption === 'Schedule' && (
          <div>
            <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Schedule</h2>
            <div className="relative bg-white rounded-lg border border-gray-300 min-h-[500px] p-6">
              {/* Schedule content area */}
              <div className="h-full">
                {/* Schedule will be populated here */}
              </div>
              
              {/* Add schedule button */}
              <button 
                onClick={() => {
                  setIsAddPostModalOpen(true)
                  setModalContext('schedule')
                }}
                className="absolute bottom-6 right-6 w-12 h-12 bg-[#0D1321] text-white rounded-full flex items-center justify-center hover:bg-[#22223b] transition-colors shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Map Content */}
        {activeTab === 'Main Info' && selectedMainInfoOption === 'Map' && (
          <div>
            <h2 className="text-[#0D1321] text-[32px] font-bold mb-6">Map</h2>
            <div className="relative bg-[#E5E5E5] rounded-lg border border-gray-300 min-h-[400px] p-6">
              <div className="text-center text-[#9a8c98] text-[16px] py-20">
                Map will be displayed here
              </div>
              
              {/* Add map button */}
              <button 
                onClick={() => {
                  setIsAddPostModalOpen(true)
                  setModalContext('map')
                }}
                className="absolute bottom-6 right-6 w-12 h-12 bg-[#0D1321] text-white rounded-full flex items-center justify-center hover:bg-[#22223b] transition-colors shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-300">
          {/* Main Info Tab Content - Original content when no specific option selected */}
          {activeTab === 'Main Info' && !['Announcements', 'Schedule', 'Map'].includes(selectedMainInfoOption) && (
            <div className="p-8">
              {/* Details Section */}
              <div className="mb-8">
                <h2 className="text-[#0D1321] text-[24px] font-bold mb-4">Details</h2>
                <LoadingState
                  isLoading={tournamentLoading}
                  fallback={<Skeleton className="h-24 w-full" />}
                >
                  {tournamentError ? (
                    <p className="text-red-500 text-[16px]">Unable to load tournament details</p>
                  ) : tournament ? (
                    <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-6">
                      {tournament.description || "No description available for this tournament."}
                    </p>
                  ) : (
                    <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-6">
                      Tournament details will appear here once loaded.
                    </p>
                  )}
                </LoadingState>

                {/* Dates and Location */}
                <div className="flex space-x-12 mb-8">
                  <div>
                    <h3 className="text-[#0D1321] text-[18px] font-bold mb-2">Dates</h3>
                    <LoadingState
                      isLoading={tournamentLoading}
                      fallback={<Skeleton className="h-6 w-48" />}
                    >
                      <p className="text-[#4a4e69] text-[16px]">
                        {tournament ? (
                          tournament.endDate ?
                            `${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}` :
                            new Date(tournament.startDate).toLocaleDateString()
                        ) : "Tournament dates TBA"}
                      </p>
                    </LoadingState>
                  </div>
                  <div>
                    <h3 className="text-[#0D1321] text-[18px] font-bold mb-2">Location</h3>
                    <LoadingState
                      isLoading={tournamentLoading}
                      fallback={<Skeleton className="h-6 w-32" />}
                    >
                      <p className="text-[#4a4e69] text-[16px]">
                        {tournament?.location || "Location TBA"}
                      </p>
                    </LoadingState>
                  </div>
                </div>
              </div>

              <hr className="border-gray-300 mb-8" />

              {/* Announcements and Schedule */}
              <div className="grid grid-cols-2 gap-8">
                {/* Announcements */}
                <div>
                  <h2 className="text-[#0D1321] text-[24px] font-bold mb-6">Announcements</h2>
                  <LoadingState
                    isLoading={announcementsLoading}
                    fallback={<Skeleton className="h-20 w-full" />}
                  >
                    {announcementsError ? (
                      <p className="text-red-500 text-[16px]">Unable to load announcements</p>
                    ) : announcements && announcements.content.length > 0 ? (
                      <div className="text-[#0D1321] text-[18px] leading-relaxed space-y-4">
                        {announcements.content.slice(0, 3).map((announcement) => (
                          <div key={announcement.id} className="border-b border-gray-200 pb-2 mb-2 last:border-b-0">
                            <h4 className="font-medium text-[16px] mb-1">{announcement.title}</h4>
                            <p className="text-[14px] text-[#4a4e69]">{announcement.content}</p>
                            <span className="text-[12px] text-[#9a8c98]">
                              {new Date(announcement.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[#9a8c98] text-[16px] py-8">
                        No announcements yet
                      </div>
                    )}
                  </LoadingState>
                </div>

                {/* Schedule */}
                <div>
                  <h2 className="text-[#0D1321] text-[24px] font-bold mb-6">Schedule</h2>
                  <div className="bg-gray-500 h-80 rounded-lg"></div>
                </div>
              </div>
            </div>
          )}

          {/* Teams Tab Content */}
          {activeTab === 'Teams' && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Team Name</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Speaker 1</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Speaker 2</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Study Location</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Club</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">City</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Number</th>
                    <th className="border border-gray-300 px-4 py-3 text-left text-[#0D1321] font-medium">Check In</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                        <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                        <td className="border border-gray-300 px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                        <td className="border border-gray-300 px-4 py-3 text-center"><Skeleton className="h-4 w-4 mx-auto" /></td>
                      </tr>
                    ))
                  ) : teamsError ? (
                    <tr>
                      <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-red-500">
                        Failed to load teams
                      </td>
                    </tr>
                  ) : teams && teams.content.length > 0 ? (
                    teams.content.map((team) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{team.name}</td>
                        <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">{team.club.name || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <span
                            className={`text-lg cursor-pointer ${checkInStatus[team.id] ? 'text-green-500' : 'text-red-500'}`}
                            onClick={() => toggleCheckIn(team.id)}
                          >
                            {checkInStatus[team.id] ? '✓' : '✕'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-[#4a4e69]">
                        No teams registered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Judges Tab Content */}
          {activeTab === 'Judges' && (
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Name</th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Club</th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Number</th>
                      <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Check In</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={4} className="border border-gray-300 px-6 py-8 text-center text-[#4a4e69]">
                        No judges assigned yet
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Add Judge Button */}
              <div className="absolute bottom-6 right-6">
                <button className="w-14 h-14 bg-[#3E5C76] hover:bg-[#2D3748] text-white rounded-full flex items-center justify-center shadow-lg transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Pairing and Matches' && (
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction 1</th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction 2</th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Room</th>
                      <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchesLoading ? (
                      <tr>
                        <td colSpan={4} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">Loading matches...</td>
                      </tr>
                    ) : matchesError ? (
                      <tr>
                        <td colSpan={4} className="border border-gray-300 px-6 py-6 text-center text-red-500">Failed to load matches</td>
                      </tr>
                    ) : matches && matches.content.length > 0 ? (
                      matches.content.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{m.team1?.name ?? '-'}</td>
                          <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{m.team2?.name ?? '-'}</td>
                          <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{m.location ?? '-'}</td>
                          <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">{m.judge?.fullName ?? '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="border border-gray-300 px-6 py-6 text-center text-[#4a4e69]">No matches</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-8 mb-8">
                <button className="px-8 py-3 border-2 border-gray-400 text-gray-600 rounded-lg hover:bg-gray-50 text-[16px] font-medium transition-colors">
                  Randomize
                </button>
                <button className="px-8 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors">
                  Submit
                </button>
              </div>
              
              {/* Round Navigation */}
              <div className="bg-[#0D1321] rounded-lg p-4">
                <div className="flex items-center justify-center gap-2">
                  <button className="px-4 py-2 bg-white text-[#0D1321] rounded text-[14px] font-medium">
                    Round 1
                  </button>
                  <button className="px-4 py-2 text-white hover:bg-[#3E5C76] rounded text-[14px] font-medium transition-colors">
                    Round 2
                  </button>
                  <button className="px-4 py-2 text-white hover:bg-[#3E5C76] rounded text-[14px] font-medium transition-colors">
                    Round 3
                  </button>
                  <button className="px-4 py-2 text-white hover:bg-[#3E5C76] rounded text-[14px] font-medium transition-colors">
                    Round 4
                  </button>
                  <span className="text-white mx-2">|</span>
                  <button 
                    className={`px-3 py-2 ${selectedRound === '1/16' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                    onClick={() => setSelectedRound('1/16')}
                  >
                    1/16
                  </button>
                  <button 
                    className={`px-3 py-2 ${selectedRound === '1/8' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                    onClick={() => setSelectedRound('1/8')}
                  >
                    1/8
                  </button>
                  <button 
                    className={`px-3 py-2 ${selectedRound === '1/4' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                    onClick={() => setSelectedRound('1/4')}
                  >
                    1/4
                  </button>
                  <button 
                    className={`px-3 py-2 ${selectedRound === '1/2' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                    onClick={() => setSelectedRound('1/2')}
                  >
                    1/2
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Results and Statistics' && (
            <div className="p-8">
              {/* Format Header */}
              <h2 className="text-[#0D1321] text-[32px] font-bold mb-8">{selectedResultsOption}</h2>
              

              
              {/* Results Table */}
              <div className="relative">
                {/* Speaker Score Table for APF */}
                {selectedResultsOption === 'APF' && activeResultsSection === 'APF Speaker Score' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Speaker</th>
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction name</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 1</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 2</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 3</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 4</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Overall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Данные для раунда 1/16 */}
                        {selectedRound === '1/16' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Ermuratov B.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Hooler</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">100</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Iskander L.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Goner</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">544</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Trarala M.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">CL clan</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">-54</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Byubs K.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Cookeu</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">losk</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/8 */}
                        {selectedRound === '1/8' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Ermuratov B.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Hooler</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">150</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Iskander L.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Goner</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">320</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/4 */}
                        {selectedRound === '1/4' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Ermuratov B.</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Hooler</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">200</td>
                          </tr>
                        )}
                        
                        {/* Данные для раунда 1/2 */}
                        {selectedRound === '1/2' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Ermuratov B.</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Hooler</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">250</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Speaker Score Table for BPF */}
                {selectedResultsOption === 'BPF' && bpfSubTab === 'BPF Speaker Score' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Speaker</th>
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction name</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 1</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 2</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 3</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 4</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Overall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Данные для раунда 1/16 */}
                        {selectedRound === '1/16' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Johnson A.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Team Alpha</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">85</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">78</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">82</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">79</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">324</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Smith B.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Team Beta</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">76</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">81</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">77</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">83</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">317</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Wilson C.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Team Gamma</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">72</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">75</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">74</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">71</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">292</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/8 */}
                        {selectedRound === '1/8' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Johnson A.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Team Alpha</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">87</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">84</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">86</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">85</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">342</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Smith B.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Team Beta</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">78</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">80</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">79</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">82</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">319</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/4 */}
                        {selectedRound === '1/4' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Johnson A.</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Team Alpha</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">89</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">88</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">90</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">87</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">354</td>
                          </tr>
                        )}
                        
                        {/* Данные для раунда 1/2 */}
                        {selectedRound === '1/2' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Johnson A.</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Team Alpha</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">91</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">90</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">92</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">89</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">362</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Results Table for APF */}
                {selectedResultsOption === 'APF' && resultsSubTab === 'Results' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 1</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 2</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 3</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 4</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Данные для раунда 1/16 */}
                        {selectedRound === '1/16' && (
                          <>
                            <tr className="bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]">
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px]">T. Salybay</td>
                            </tr>
                            <tr className="bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]">
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] font-medium">Qyrandar</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px]">A. Gurgabay</td>
                            </tr>
                            <tr className="bg-gradient-to-r from-[#748CAB] to-[#8a9ba8] hover:from-[#8a9ba8] hover:to-[#9cacba]">
                              <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] font-medium">Goner</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px] text-center font-medium">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#0D1321] text-[16px]">L. Lomonosov</td>
                            </tr>
                            <tr className="bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]">
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] font-medium">CL clan</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px]">K. Butov</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/8 */}
                        {selectedRound === '1/8' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">2</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">T. Salybay</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">CL clan</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">A. Gurgabay</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/4 */}
                        {selectedRound === '1/4' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">3</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                          </tr>
                        )}
                        
                        {/* Данные для раунда 1/2 */}
                        {selectedRound === '1/2' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">4</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">K. Butov</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* BPF Tables */}
                {selectedResultsOption === 'BPF' && bpfSubTab === 'BPF Results' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 1</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 2</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 3</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 4</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Данные для раунда 1/16 */}
                        {selectedRound === '1/16' && (
                          <>
                            <tr className="bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]">
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px]">T. Salybay</td>
                            </tr>
                            <tr className="bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]">
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] font-medium">Qyrandar</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px]">A. Gurgabay</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">45For45</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Fate Sealers</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">K. Butov</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для других раундов */}
                        {selectedRound !== '1/16' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">BPF Team {selectedRound}</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">{selectedRound === '1/8' ? 2 : selectedRound === '1/4' ? 3 : 4}</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">BPF Judge {selectedRound}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                
                {/* LD Table */}
                {selectedResultsOption === 'LD' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction Name</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 1</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 2</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 3</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Round 4</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Win Count</th>
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Judge Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Данные для раунда 1/16 */}
                        {selectedRound === '1/16' && (
                          <>
                            <tr className="bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]">
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px]">T. Salybay</td>
                            </tr>
                            <tr className="bg-gradient-to-r from-[#0D1321] to-[#1a1a2e] hover:from-[#1a1a2e] hover:to-[#2d2d3a]">
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] font-medium">Qyrandar</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-white text-[16px]">A. Gurgabay</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">45For45</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Fate Sealers</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">K. Butov</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/8 */}
                        {selectedRound === '1/8' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">2</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">T. Salybay</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">45For45</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">A. Gurgabay</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/4 */}
                        {selectedRound === '1/4' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">3</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                          </tr>
                        )}
                        
                        {/* Данные для раунда 1/2 */}
                        {selectedRound === '1/2' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">4</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">K. Butov</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* Submit Button */}
                <div className="flex justify-end mt-8 mb-8">
                  <button className="px-8 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors">
                    Submit
                  </button>
                </div>
                
                {/* Navigation Tabs */}
                <div className="bg-[#0D1321] rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2">
                    {/* Show format tabs only for APF and BPF */}
                    {selectedResultsOption !== 'LD' && (
                      <>
                        <button 
                          className={`px-4 py-2 ${activeResultsSection === 'APF Results' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                          onClick={() => {
                            setActiveResultsSection('APF Results')
                            setResultsSubTab('Results')
                          }}
                        >
                          {selectedResultsOption} Results
                        </button>
                        <button 
                          className={`px-4 py-2 ${activeResultsSection === 'APF Speaker Score' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                          onClick={() => {
                            setActiveResultsSection('APF Speaker Score')
                            setResultsSubTab('Speaker Score')
                          }}
                        >
                          {selectedResultsOption} Speaker Score
                        </button>
                        <span className="text-white mx-2">|</span>
                      </>
                    )}
                    
                    {/* Round selection buttons */}
                    <button 
                      className={`px-3 py-2 ${activeResultsSection === '1/16' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                      onClick={() => {
                        setActiveResultsSection('1/16')
                        setSelectedRound('1/16')
                      }}
                    >
                      1/16
                    </button>
                    <button 
                      className={`px-3 py-2 ${activeResultsSection === '1/8' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                      onClick={() => {
                        setActiveResultsSection('1/8')
                        setSelectedRound('1/8')
                      }}
                    >
                      1/8
                    </button>
                    <button 
                      className={`px-3 py-2 ${activeResultsSection === '1/4' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                      onClick={() => {
                        setActiveResultsSection('1/4')
                        setSelectedRound('1/4')
                      }}
                    >
                      1/4
                    </button>
                    <button 
                      className={`px-3 py-2 ${activeResultsSection === '1/2' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                      onClick={() => {
                        setActiveResultsSection('1/2')
                        setSelectedRound('1/2')
                      }}
                    >
                      1/2
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* News Tab Content */}
      {activeTab === 'News' && (
        <div className="p-8">
          <div className="space-y-6">
            {/* News Header */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[#0D1321] text-[32px] font-bold">Tournament News</h2>
              <button 
                onClick={() => {
                  setIsAddPostModalOpen(true)
                  setModalContext('news')
                }}
                className="px-6 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
              >
                Add News
              </button>
            </div>

            {/* News Items */}
            <div className="space-y-6">
              {newsLoading ? (
                <div className="space-y-4">
                  <div className="h-28 bg-gray-100 rounded" />
                  <div className="h-28 bg-gray-100 rounded" />
                  <div className="h-28 bg-gray-100 rounded" />
                </div>
              ) : newsError ? (
                <div className="text-center text-red-500">Failed to load news</div>
              ) : news && news.content.length > 0 ? (
                news.content.map((n) => {
                  const tags = (n.tags || []).map(t => t.name)
                  const category = tags.find(t => !t.startsWith('tournament:')) || 'Info'
                  const badgeClass = category === 'Important' ? 'bg-[#3E5C76] text-white' : category === 'Update' ? 'bg-[#9a8c98] text-white' : 'bg-green-500 text-white'
                  const dt = new Date(n.timestamp)
                  const dateStr = dt.toLocaleDateString()
                  const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  const authorName = n.user ? `${n.user.firstName} ${n.user.lastName ?? ''}`.trim() : 'Organizer'
                  return (
                    <article key={n.id} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-[#0D1321] text-[24px] font-bold mb-2">{n.title}</h3>
                          <div className="flex items-center text-[#9a8c98] text-[14px] space-x-4">
                            <span>Posted by {authorName}</span>
                            <span>•</span>
                            <span>{dateStr}</span>
                            <span>•</span>
                            <span>{timeStr}</span>
                          </div>
                        </div>
                        <span className={`${badgeClass} px-3 py-1 rounded-full text-[12px] font-medium`}>
                          {category}
                        </span>
                      </div>
                      <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">{n.content}</p>
                    </article>
                  )
                })
              ) : (
                <div className="text-center text-[#9a8c98]">No news yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Tab Content */}
      {activeTab === 'Feedback' && (
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Feedback Header */}
            <div className="text-center mb-8">
              <h2 className="text-[#0D1321] text-[32px] font-bold mb-4">Tournament Feedback</h2>
              <p className="text-[#4a4e69] text-[18px]">
                Your feedback helps us improve future tournaments. Please share your thoughts and suggestions.
              </p>
            </div>

            {/* Feedback Form */}
            <div className="bg-white rounded-lg border border-gray-300 p-8 mb-8">
              <h3 className="text-[#0D1321] text-[24px] font-bold mb-6">Submit Feedback</h3>
              
              <form className="space-y-6">
                {/* Rating Section */}
                <div>
                  <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                    Overall Tournament Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="text-3xl text-gray-300 hover:text-yellow-400 transition-colors"
                      >
                        ⭐
                      </button>
                    ))}
                    <span className="ml-4 text-[#9a8c98] text-[14px]">Click to rate</span>
                  </div>
                </div>

                {/* Category Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                      Organization Quality
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]">
                      <option value="">Select rating</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                      Judge Quality
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]">
                      <option value="">Select rating</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                      Venue & Facilities
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]">
                      <option value="">Select rating</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                      Communication
                    </label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]">
                      <option value="">Select rating</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="average">Average</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                    Additional Comments & Suggestions
                  </label>
                  <textarea
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69] resize-vertical"
                    placeholder="Please share your detailed feedback, suggestions for improvement, or any issues you encountered..."
                  ></textarea>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-[#0D1321] text-[16px] font-medium mb-3">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
                  >
                    Submit Feedback
                  </button>
                </div>
              </form>
            </div>

            {/* Previous Feedback */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-[#0D1321] text-[24px] font-bold mb-6">Recent Feedback</h3>
              
              <div className="space-y-6">
                {/* Comment 1 */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  {/* Header with logo and username */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src="/placeholder-user.jpg" 
                        alt="Niceass profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-12 h-12 bg-gradient-to-br from-[#3E5C76] to-[#748CAB] rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">N</span>
                      </div>
                    </div>
                    <h4 className="text-[#0D1321] text-[18px] font-semibold">Niceass</h4>
                  </div>
                  
                  {/* Comment content */}
                  <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">
                    Actually I love debetter it is very simple and minimalistic. The design is very human!
                  </p>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-6 text-[#9a8c98] text-[14px]">
                        <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V7a2 2 0 012-2s0 0 0 0 1.53-.027 2.06-.06l5.474-.279a2 2 0 011.94 1.472c.087.462.087.957 0 1.419L14 10z" />
                          </svg>
                          <span>Like</span>
                        </button>
                        <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2m0-12V2m7 10h4.764a2 2 0 001.789-2.894l-3.5-7A2 2 0 0015.263 1h-4.017c-.163 0-.326.02-.485.06L7 2" />
                          </svg>
                          <span>Dislike</span>
                        </button>
                        <span className="text-[#9a8c98]">2 min</span>
                        <button className="hover:text-[#3E5C76] transition-colors">Reply</button>
                        <button className="flex items-center space-x-1 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                      </div>
                      
                  {/* View Replies */}
                  <button className="mt-3 text-[#9a8c98] text-[14px] hover:text-[#3E5C76] transition-colors">
                    View Replies (4)
                  </button>
                </div>

                {/* Comment 2 */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src="/placeholder-user.jpg" 
                        alt="Hair_ass profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-12 h-12 bg-gradient-to-br from-[#9a8c98] to-[#4a4e69] rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">H</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <h4 className="text-[#0D1321] text-[18px] font-semibold">Hair_ass</h4>
                      </div>
                      <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">
                        Actually I love debetter it is very simple and minimalistic. The design is very human!
                      </p>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-6 text-[#9a8c98] text-[14px]">
                        <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V7a2 2 0 012-2s0 0 0 0 1.53-.027 2.06-.06l5.474-.279a2 2 0 011.94 1.472c.087.462.087.957 0 1.419L14 10z" />
                          </svg>
                          <span>Like</span>
                        </button>
                        <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2m0-12V2m7 10h4.764a2 2 0 001.789-2.894l-3.5-7A2 2 0 0015.263 1h-4.017c-.163 0-.326.02-.485.06L7 2" />
                          </svg>
                          <span>Dislike</span>
                        </button>
                        <span className="text-[#9a8c98]">5 min</span>
                        <button className="hover:text-[#3E5C76] transition-colors">Reply</button>
                        <button className="flex items-center space-x-1 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment 3 */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src="/placeholder-user.jpg" 
                        alt="Tournament Expert profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-12 h-12 bg-gradient-to-br from-[#0D1321] to-[#3E5C76] rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">TE</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <h4 className="text-[#0D1321] text-[18px] font-semibold">Tournament Expert</h4>
                      </div>
                      <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">
                        The tournament structure was well-organized and the judging criteria were clear. Great experience overall for both participants and spectators.
                      </p>
                      
                      {/* Action buttons */}
                      <div className="flex items-center space-x-6 text-[#9a8c98] text-[14px]">
                        <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V7a2 2 0 012-2s0 0 0 0 1.53-.027 2.06-.06l5.474-.279a2 2 0 011.94 1.472c.087.462.087.957 0 1.419L14 10z" />
                          </svg>
                          <span>Like</span>
                        </button>
                        <button className="flex items-center space-x-2 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2m0-12V2m7 10h4.764a2 2 0 001.789-2.894l-3.5-7A2 2 0 0015.263 1h-4.017c-.163 0-.326.02-.485.06L7 2" />
                          </svg>
                          <span>Dislike</span>
                        </button>
                        <span className="text-[#9a8c98]">1 day</span>
                        <button className="hover:text-[#3E5C76] transition-colors">Reply</button>
                        <button className="flex items-center space-x-1 hover:text-[#3E5C76] transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {isAddPostModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#0D1321] text-[32px] font-bold">
                {modalContext === 'announcements' ? 'Add Announcement' : 
                 modalContext === 'schedule' ? 'Add Schedule Item' : 
                 modalContext === 'map' ? 'Add Map Item' : 
                 modalContext === 'news' ? 'Add News' : 'Add Content'}
              </h2>
              <button
                onClick={() => {
                  setIsAddPostModalOpen(false)
                  setModalContext('')
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddPost(); }} className="space-y-6">
              {/* Image Upload Section */}
              <div>
                <label className="block text-[#9a8c98] text-[18px] font-medium mb-4">
                  Attach Images
                </label>
                <div className="md:flex md:items-start md:gap-6">
                  <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#3E5C76] transition-colors cursor-pointer w-full md:flex-1 md:min-h-[360px] ${dzAnimate ? 'dz-animate' : ''}`}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  
                  <div className="flex flex-col items-center space-y-4">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-[#4a4e69]">
                      <p className="text-[18px] font-medium mb-2">Drag and Drop here</p>
                      <p className="text-[16px] mb-2">or</p>
                      <p className="text-[#3E5C76] text-[16px] font-medium hover:underline">Browse files</p>
                    </div>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                  />
                </div>
                
                {/* File list (Figma-style) */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 md:mt-0 md:w-[260px] space-y-4">
                    {imagePreviews.map((img) => {
                      const ext = img.name.includes('.') ? img.name.split('.').pop()?.toUpperCase() : ''
                      return (
                        <div key={img.key} className="relative">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-md border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                              {img.src ? (
                                <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[12px] font-medium text-[#0D1321]">{ext}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[20px] text-[#0D1321] font-medium truncate" title={img.name}>{img.name}</div>
                              <div className="text-[14px] text-[#0D1321]/60">{formatBytes(img.sizeBytes)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => (img.status === 'done' ? undefined : removeImageByKey(img.key))}
                              className={`ml-auto w-6 h-6 aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center ${img.status === 'done' ? '' : 'bg-black/60 text-white'}`}
                              aria-label={img.status === 'done' ? 'Uploaded' : 'Remove'}
                              title={img.status === 'done' ? 'Uploaded' : 'Remove'}
                            >
                              {img.status === 'done' ? (
                                <img src={CHECK_ICON_URL} alt="Uploaded" className="w-full h-full object-contain" />
                              ) : (
                                '×'
                              )}
                            </button>
                          </div>
                          {img.status !== 'done' && (
                            <div className="ml-[76px] mt-1 h-1 bg-gray-200 rounded">
                              <div className="h-1 bg-[#3E5C76] rounded" style={{ width: `${img.progress}%` }} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                </div>
                {uploadErrors.length > 0 && (
                  <ul className="mt-2 text-[12px] text-red-600 space-y-1">
                    {uploadErrors.map((e, i) => (<li key={i}>{e}</li>))}
                  </ul>
                )}
              </div>

              {/* Title and Description - For Announcements and News */}
              {(modalContext === 'announcements' || modalContext === 'news') && (
                <>
                  {/* Title Input */}
                  <div>
                    <label className="block text-[#4a4e69] text-[16px] font-medium mb-3">
                      Title
                    </label>
                    <input
                      type="text"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                      placeholder="Enter post title"
                      required
                    />
                  </div>

                  {/* Description Input */}
                  <div>
                    <label className="block text-[#4a4e69] text-[16px] font-medium mb-3">
                      Description
                    </label>
                    <textarea
                      value={postDescription}
                      onChange={(e) => setPostDescription(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69] resize-vertical"
                      placeholder="Enter post description"
                      required
                    />
                  </div>
                  {/* Category for News */}
                  {modalContext === 'news' && (
                    <div>
                      <label className="block text-[#4a4e69] text-[16px] font-medium mb-3">
                        Category
                      </label>
                      <select
                        value={selectedNewsCategory}
                        onChange={(e) => setSelectedNewsCategory(e.target.value as any)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                      >
                        <option value="Important">Important</option>
                        <option value="Update">Update</option>
                        <option value="Info">Info</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[18px] font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[#0D1321] text-[24px] font-bold">Invite</h2>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex mb-6">
              <button
                onClick={() => setInviteModalTab('invite')}
                className={`flex-1 text-center py-2 border-b-2 font-medium transition-colors ${
                  inviteModalTab === 'invite'
                    ? 'border-[#0D1321] text-[#0D1321]'
                    : 'border-gray-300 text-[#9a8c98] hover:text-[#4a4e69]'
                }`}
              >
                Invite
              </button>
              <button
                onClick={() => setInviteModalTab('copy-link')}
                className={`flex-1 text-center py-2 border-b-2 font-medium transition-colors ${
                  inviteModalTab === 'copy-link'
                    ? 'border-[#0D1321] text-[#0D1321]'
                    : 'border-gray-300 text-[#9a8c98] hover:text-[#4a4e69]'
                }`}
              >
                Copy link
              </button>
            </div>

            {/* Who Has Access Section */}
            <div>
              <h3 className="text-[#0D1321] text-[16px] font-medium mb-4">Who Has Access</h3>
              <div className="space-y-3">
                {tournamentMembers.length > 0 ? (
                  tournamentMembers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-[#4a4e69] text-[16px]">{user.name}</span>
                      </div>
                      <span className="text-[#9a8c98] text-[14px]">
                        Participant
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[#9a8c98] text-[14px] py-4">
                    No tournament members yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 