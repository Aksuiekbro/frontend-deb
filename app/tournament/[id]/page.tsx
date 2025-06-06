"use client"

import { useState, useEffect, useRef } from "react"
import Header from "../../../components/Header"

export default function TournamentDetailPage() {
  const [activeTab, setActiveTab] = useState('Main Info')
  const [isMainInfoDropdownOpen, setIsMainInfoDropdownOpen] = useState(false)
  const [selectedMainInfoOption, setSelectedMainInfoOption] = useState('Main info')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMainInfoDropdownOpen(false)
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
          {['teams', 'Judges', 'Pairing and Matches', 'Results and Statistics'].map((tab) => (
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
        </div>
      </section>

      {/* Main Content */}
      <div className="px-12 pb-16">
        <div className="bg-white rounded-lg border border-gray-300 p-8">
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
      </div>
    </div>
  )
} 