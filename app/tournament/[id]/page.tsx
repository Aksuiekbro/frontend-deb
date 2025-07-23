"use client"

import { useState, useEffect, useRef } from "react"
import Header from "../../../components/Header"

export default function TournamentDetailPage() {
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
  const [invitedUsers, setInvitedUsers] = useState([
    { id: 1, name: 'Who Has Access', avatar: '/avatar1.jpg' },
    { id: 2, name: 'Who Has Access', avatar: '/avatar2.jpg' },
    { id: 3, name: 'Who Has Access', avatar: '/avatar3.jpg' }
  ])
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

  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      // Здесь будет логика отправки приглашения
      console.log('Inviting user:', inviteEmail)
      setInviteEmail('')
    }
  }

  const handleRemoveUser = (userId: number) => {
    setInvitedUsers(invitedUsers.filter(user => user.id !== userId))
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/tournament/invite/123`
    navigator.clipboard.writeText(link)
    // Можно добавить уведомление об успешном копировании
  }

  const handleAddPost = () => {
    const isAnnouncement = modalContext === 'announcements'
    const isValidAnnouncement = isAnnouncement && postTitle.trim() && postDescription.trim()
    const isValidOther = !isAnnouncement // Schedule and map just need images
    
    if (isValidAnnouncement || isValidOther) {
      // Здесь будет логика добавления поста
      const postData = modalContext === 'announcements' 
        ? { title: postTitle, description: postDescription, images: postImages, type: modalContext }
        : { images: postImages, type: modalContext }
      console.log(`Adding ${modalContext}:`, postData)
      
      if (modalContext === 'announcements') {
        setPostTitle('')
        setPostDescription('')
      }
      setPostImages([])
      setIsAddPostModalOpen(false)
      setModalContext('')
    }
  }

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const newImages = Array.from(files)
      setPostImages(prev => [...prev, ...newImages])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    handleImageUpload(files)
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

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Page Title */}
      <section className="px-12 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[#0D1321] text-[48px] font-bold">Tournament: Lorem ipsum dolores sit amit</h1>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="px-6 py-3 bg-[#3E5C76] text-white rounded-lg hover:bg-[#2D3748] text-[16px] font-medium transition-colors"
          >
            Invite
          </button>
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
              {/* Empty state for announcements */}
              <div className="text-center text-[#9a8c98] text-[16px] py-20">
                No announcements yet
              </div>
              
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
                <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-6">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vel turpis urna. Duis vulputate egestas sodales. Phasellus lectus tortor, fringilla sed est 
                  non, accumsan maximus nisl. Pellentesque dapibus, est quis congue maximus, leo nisl dictum augue, dapibus dapibus nisl ex eget nulla. Aliquam tempus, 
                  sem vulputate sagittis scelerisque, urna risus efficitur nisl, nec imperdiet quam arcu nec odio. Phasellus ut consequat turpis, vitae gravida lorem. Donec 
                  molestudda nisl sit amet aliquam ornare. Donec tincidunt eros ut tellus sagittis, eu lobortis tellus consequat. Fusce commodo viverra dolor, vitae ultrices orci 
                  mollis eget. Vivamus interdum tortor a elit dignissim iaculis. Fusce tincidunt nisl quis tellus pharetra, id varius neque porttitor. Curabitur tincidunt enim 
                  dapibus eros ullamcorper, at gravida ligula mattis. Fusce odio nisl, ornare eget tortor in, gravida mattis neque.
                </p>

                {/* Dates and Location */}
                <div className="flex space-x-12 mb-8">
                  <div>
                    <h3 className="text-[#0D1321] text-[18px] font-bold mb-2">Dates</h3>
                    <p className="text-[#4a4e69] text-[16px]">November 25, 2024 - February 10, 2025</p>
                  </div>
                  <div>
                    <h3 className="text-[#0D1321] text-[18px] font-bold mb-2">Location</h3>
                    <p className="text-[#4a4e69] text-[16px]">Astana, Mynbaeva 48</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-300 mb-8" />

              {/* Announcements and Schedule */}
              <div className="grid grid-cols-2 gap-8">
                {/* Announcements */}
                <div>
                  <h2 className="text-[#0D1321] text-[24px] font-bold mb-6">Announcements</h2>
                  <div className="text-[#0D1321] text-[18px] leading-relaxed">
                    <p className="mb-2">объявления и распис</p>
                    <p>пусть стоят как и стояли</p>
                  </div>
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
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">team1</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Nurasyl</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Nurasyl</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">NIS PhMD</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Alma</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Almaty</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">87756278927</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[1] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[1] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">realme</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Madiar</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Madiar</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">NIS HBD</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Altpa</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Astana</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[2] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(2)}
                      >
                        {checkInStatus[2] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Supreme</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Zhekse...</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Zhekse...</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[3] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(3)}
                      >
                        {checkInStatus[3] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Babniki</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Abdulla</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Abdulla</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[4] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(4)}
                      >
                        {checkInStatus[4] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Soslik</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Taldybai</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Taldybai</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[5] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[5] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Wasabi</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Rafaketch</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Rafaketch</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[5] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[5] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Tallfayev</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Karibozin</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Karibozin</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[5] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[5] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">15454351312</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Bubek</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Bubek</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[5] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[5] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">505</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Besktas</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Besktas</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[5] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[5] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">HZHZHZ</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Z. Abdulla</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Z. Abdulla</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[5] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[5] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">Rasega</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Nurasyl</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]">T. Nurasyl</td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-[#4a4e69]"></td>
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <span 
                        className={`text-lg cursor-pointer ${checkInStatus[5] ? 'text-green-500' : 'text-red-500'}`}
                        onClick={() => toggleCheckIn(1)}
                      >
                        {checkInStatus[5] ? '✓' : '✕'}
                      </span>
                    </td>
                  </tr>
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
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">T. Salybay</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Alma</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">87756278927</td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <span 
                          className={`text-lg cursor-pointer ${checkInStatus[10] ? 'text-green-500' : 'text-red-500'}`}
                          onClick={() => toggleCheckIn(10)}
                        >
                          {checkInStatus[10] ? '✓' : '✕'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">A. Gurgabay</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Aitpa</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">87756278927</td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <span 
                          className={`text-lg cursor-pointer ${checkInStatus[11] ? 'text-green-500' : 'text-red-500'}`}
                          onClick={() => toggleCheckIn(11)}
                        >
                          {checkInStatus[11] ? '✓' : '✕'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">рудольф</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">87756278927</td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <span 
                          className={`text-lg cursor-pointer ${checkInStatus[12] ? 'text-green-500' : 'text-red-500'}`}
                          onClick={() => toggleCheckIn(12)}
                        >
                          {checkInStatus[12] ? '✓' : '✕'}
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">K. Butov</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Плюсплюс</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">87756278927</td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <span 
                          className={`text-lg cursor-pointer ${checkInStatus[4] ? 'text-green-500' : 'text-red-500'}`}
                          onClick={() => toggleCheckIn(4)}
                        >
                          {checkInStatus[4] ? '✓' : '✕'}
                        </span>
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
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Hooley</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Alma</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">208</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">T. Salybay</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Qyrandar</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Aitpa</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">991A</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">A. Gurgabay</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">45For45</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Rudolf</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">121B</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Fate Sealers</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">PlusPlus</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">12</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">K. Butov</td>
                    </tr>
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
              <article className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[#0D1321] text-[24px] font-bold mb-2">Tournament Schedule Update</h3>
                    <div className="flex items-center text-[#9a8c98] text-[14px] space-x-4">
                      <span>Posted by Admin</span>
                      <span>•</span>
                      <span>November 20, 2024</span>
                      <span>•</span>
                      <span>3:45 PM</span>
                    </div>
                  </div>
                  <span className="bg-[#3E5C76] text-white px-3 py-1 rounded-full text-[12px] font-medium">
                    Important
                  </span>
                </div>
                <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">
                  Due to venue availability changes, Round 3 has been rescheduled to start at 2:00 PM instead of 1:30 PM. 
                  Please make sure all participants and judges are informed about this change. The break between rounds 
                  has been extended to 45 minutes to accommodate lunch.
                </p>
                <div className="flex items-center space-x-4 text-[#9a8c98] text-[14px]">
                  <button className="hover:text-[#3E5C76] transition-colors">
                    <span className="mr-1">👍</span> 12 likes
                  </button>
                  <button className="hover:text-[#3E5C76] transition-colors">
                    <span className="mr-1">💬</span> 3 comments
                  </button>
                </div>
              </article>

              <article className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[#0D1321] text-[24px] font-bold mb-2">New Judge Assignment</h3>
                    <div className="flex items-center text-[#9a8c98] text-[14px] space-x-4">
                      <span>Posted by Tournament Director</span>
                      <span>•</span>
                      <span>November 19, 2024</span>
                      <span>•</span>
                      <span>10:20 AM</span>
                    </div>
                  </div>
                  <span className="bg-[#9a8c98] text-white px-3 py-1 rounded-full text-[12px] font-medium">
                    Update
                  </span>
                </div>
                <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">
                  We are pleased to announce that Professor Elena Mikhailova from Nazarbayev University will be joining 
                  our judging panel for the final rounds. She brings over 15 years of debate experience and will be 
                  presiding over the semi-final matches.
                </p>
                <div className="flex items-center space-x-4 text-[#9a8c98] text-[14px]">
                  <button className="hover:text-[#3E5C76] transition-colors">
                    <span className="mr-1">👍</span> 8 likes
                  </button>
                  <button className="hover:text-[#3E5C76] transition-colors">
                    <span className="mr-1">💬</span> 1 comment
                  </button>
                </div>
              </article>

              <article className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[#0D1321] text-[24px] font-bold mb-2">Lunch and Refreshments</h3>
                    <div className="flex items-center text-[#9a8c98] text-[14px] space-x-4">
                      <span>Posted by Organizers</span>
                      <span>•</span>
                      <span>November 18, 2024</span>
                      <span>•</span>
                      <span>4:15 PM</span>
                    </div>
                  </div>
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-[12px] font-medium">
                    Info
                  </span>
                </div>
                <p className="text-[#4a4e69] text-[16px] leading-relaxed mb-4">
                  Complimentary lunch will be provided in the main cafeteria from 12:00 PM to 1:30 PM. We have 
                  vegetarian and halal options available. Please bring your participant badge for identification.
                </p>
                <div className="flex items-center space-x-4 text-[#9a8c98] text-[14px]">
                  <button className="hover:text-[#3E5C76] transition-colors">
                    <span className="mr-1">👍</span> 15 likes
                  </button>
                  <button className="hover:text-[#3E5C76] transition-colors">
                    <span className="mr-1">💬</span> 5 comments
                  </button>
                </div>
              </article>
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
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#3E5C76] transition-colors cursor-pointer"
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
                
                {/* Display uploaded images */}
                {postImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {postImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setPostImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title and Description - Only for Announcements */}
              {modalContext === 'announcements' && (
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

            {/* Invite Tab Content */}
            {inviteModalTab === 'invite' && (
              <div className="mb-6">
                <div className="flex">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#3E5C76] text-[#4a4e69]"
                    onKeyPress={(e) => e.key === 'Enter' && handleInviteUser()}
                  />
                  <button
                    onClick={handleInviteUser}
                    className="px-6 py-3 bg-[#3E5C76] text-white rounded-r-lg hover:bg-[#2D3748] font-medium transition-colors"
                  >
                    Invite
                  </button>
                </div>
              </div>
            )}

            {/* Copy Link Tab Content */}
            {inviteModalTab === 'copy-link' && (
              <div className="mb-6">
                <div className="flex">
                  <input
                    type="text"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/tournament/invite/123`}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-[#4a4e69]"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="px-6 py-3 bg-[#3E5C76] text-white rounded-r-lg hover:bg-[#2D3748] font-medium transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Who Has Access Section */}
            <div>
              <h3 className="text-[#0D1321] text-[16px] font-medium mb-4">Who Has Access</h3>
              <div className="space-y-3">
                {invitedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-[#4a4e69] text-[16px]">{user.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-[#9a8c98] hover:text-red-500 text-[14px] font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 