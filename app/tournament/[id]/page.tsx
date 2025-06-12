"use client"

import { useState, useEffect, useRef } from "react"
import Header from "../../../components/Header"

export default function TournamentDetailPage() {
  const [activeTab, setActiveTab] = useState('Main Info')
  const [isMainInfoDropdownOpen, setIsMainInfoDropdownOpen] = useState(false)
  const [selectedMainInfoOption, setSelectedMainInfoOption] = useState('Main info')
  const [isResultsDropdownOpen, setIsResultsDropdownOpen] = useState(false)
  const [selectedResultsOption, setSelectedResultsOption] = useState('APF')
  const [resultsSubTab, setResultsSubTab] = useState('Speaker Score')
  const [selectedRound, setSelectedRound] = useState('1/16')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const resultsDropdownRef = useRef<HTMLDivElement>(null)

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
        <h1 className="text-[#0D1321] text-[48px] font-bold mb-8">Tournament: Lorem ipsum dolores sit amit</h1>
        
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
              <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    setSelectedMainInfoOption('Main info')
                    setIsMainInfoDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[16px] text-[#4a4e69] hover:bg-gray-100 hover:text-[#0D1321]"
                >
                  Main info
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
          {['teams', 'Judges', 'Pairing and Matches'].map((tab) => (
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
        </div>
      </section>

      {/* Main Content */}
      <div className="px-12 pb-16">
        <div className="bg-white rounded-lg border border-gray-300">
          {/* Main Info Tab Content */}
          {activeTab === 'Main Info' && (
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
          {activeTab === 'teams' && (
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
                      <span className="text-gray-400 text-lg">—</span>
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
                      <span className="text-green-500 text-lg">✓</span>
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
                      <span className="text-green-500 text-lg">✓</span>
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
                      <span className="text-red-500 text-xl">✕</span>
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
                      <span className="text-gray-400 text-lg">—</span>
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
                      <span className="text-gray-400 text-lg">—</span>
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
                      <span className="text-gray-400 text-lg">—</span>
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
                      <span className="text-gray-400 text-lg">—</span>
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
                      <span className="text-gray-400 text-lg">—</span>
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
                      <span className="text-gray-400 text-lg">—</span>
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
                      <span className="text-gray-400 text-lg">—</span>
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
                        <input type="checkbox" className="w-5 h-5 text-[#3E5C76] bg-gray-100 border-gray-300 rounded focus:ring-[#3E5C76] focus:ring-2" />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">A. Gurgabay</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Aitpa</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">87756278927</td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <input type="checkbox" checked className="w-5 h-5 text-[#3E5C76] bg-gray-100 border-gray-300 rounded focus:ring-[#3E5C76] focus:ring-2" readOnly />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">рудольф</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">87756278927</td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <input type="checkbox" checked className="w-5 h-5 text-[#3E5C76] bg-gray-100 border-gray-300 rounded focus:ring-[#3E5C76] focus:ring-2" readOnly />
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">K. Butov</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Плюсплюс</td>
                      <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">87756278927</td>
                      <td className="border border-gray-300 px-6 py-4 text-center">
                        <span className="text-red-500 text-xl font-bold">✕</span>
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
                {selectedResultsOption === 'APF' && resultsSubTab === 'Speaker Score' && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 rounded-2xl overflow-hidden">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction 1</th>
                          <th className="border border-gray-300 px-6 py-4 text-left text-[#0D1321] font-medium text-[16px]">Fraction 2</th>
                          <th className="border border-gray-300 px-6 py-4 text-center text-[#0D1321] font-medium text-[16px]">Winner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Данные для раунда 1/16 */}
                        {selectedRound === '1/16' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Ermuratov B.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Hooler</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">Hooler</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Iskander L.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Goner</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">Goner</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Trarala M.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">CL clan</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">CL clan</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Byubs K.</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Cookeu</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">Cookeu</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/8 */}
                        {selectedRound === '1/8' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooler</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Goner</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">Hooler</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">CL clan</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Cookeu</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">CL clan</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для раунда 1/4 */}
                        {selectedRound === '1/4' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooler</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">CL clan</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">Hooler</td>
                          </tr>
                        )}
                        
                        {/* Данные для раунда 1/2 */}
                        {selectedRound === '1/2' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooler</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">Finalist Team</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
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
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">T. Salybay</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Qyrandar</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">A. Gurgabay</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Goner</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">L. Lomonosov</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">CL clan</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
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
                {selectedResultsOption === 'BPF' && (
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
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">T. Salybay</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">BPF Team 2</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">2</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px]">BPF Judge 2</td>
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
                
                {/* LD Tables */}
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
                        </tr>
                      </thead>
                      <tbody>
                        {/* Данные для раунда 1/16 */}
                        {selectedRound === '1/16' && (
                          <>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">Hooley</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">1</td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">LD Team 2</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">0</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">1</td>
                              <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">2</td>
                            </tr>
                          </>
                        )}
                        
                        {/* Данные для других раундов */}
                        {selectedRound !== '1/16' && (
                          <tr className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] font-medium">LD Team {selectedRound}</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center">—</td>
                            <td className="border border-gray-300 px-6 py-4 text-[#4a4e69] text-[16px] text-center font-medium">{selectedRound === '1/8' ? 2 : selectedRound === '1/4' ? 3 : 4}</td>
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
                    <button 
                      className={`px-4 py-2 ${resultsSubTab === 'Results' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                      onClick={() => setResultsSubTab('Results')}
                    >
                      {selectedResultsOption} Results
                    </button>
                    <button 
                      className={`px-4 py-2 ${resultsSubTab === 'Speaker Score' ? 'bg-white text-[#0D1321]' : 'text-white hover:bg-[#3E5C76]'} rounded text-[14px] font-medium transition-colors`}
                      onClick={() => setResultsSubTab('Speaker Score')}
                    >
                      {selectedResultsOption} Speaker Score
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 