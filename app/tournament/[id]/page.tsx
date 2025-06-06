"use client"

import { useState } from "react"

export default function TournamentDetailPage() {
  const [activeTab, setActiveTab] = useState('Main Info')

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-4">
        <div className="flex items-center space-x-16">
          <div className="text-[#0D1321] text-[45px] font-bold font-hikasami">DB</div>
          <nav className="flex space-x-12">
            <a href="#" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
              Join Debates
            </a>
            <a href="#" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
              Rating
            </a>
          </nav>
        </div>
        <div className="flex items-center space-x-6">
          <select
            className="border border-[#9a8c98] rounded-[4px] px-4 py-2 text-[#4a4e69] bg-white text-[16px] font-normal appearance-none bg-no-repeat bg-right bg-[length:12px] pr-8"
            style={{
              backgroundImage:
                'url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"%3E%3Cpath fill="%23666" d="M2 0L0 2h4zm0 5L0 3h4z"/%3E%3C/svg>\')',
            }}
          >
            <option>English</option>
          </select>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#9a8c98] rounded-full"></div>
            <span className="text-[#0D1321] text-[16px] font-normal">User1120023</span>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <section className="px-12 py-8">
        <h1 className="text-[#0D1321] text-[48px] font-bold mb-8">Tournament: Lorem ipsum dolores sit amit</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-8">
          {['Main Info', 'teams', 'Judges', 'Pairing and Matches', 'Results and Statistics'].map((tab) => (
            <button
              key={tab}
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
                <p className="text-[#4a4e69] text-[16px]">11.25.2052-10.02.5020</p>
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