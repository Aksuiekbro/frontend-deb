"use client"

import { MapPin, Calendar } from "lucide-react"
import { useState } from "react"

export default function MyTournamentsPage() {
  const [activeTab, setActiveTab] = useState('Past')

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
        <h1 className="text-[#0D1321] text-[48px] font-bold mb-8">My Tournaments</h1>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-300 mb-8">
          {['Past', 'Ongoing', 'Upcoming'].map((tab) => (
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
        {/* Tournament Cards */}
        <div className="space-y-6">
          {[1, 2].map((item) => (
            <div key={item} className="bg-[#0D1321] rounded-[16px] p-8">
              {/* Tournament Info */}
              <div className="flex items-start mb-6">
                <div className="w-[150px] h-[150px] bg-[#FFFFFF] rounded-full mr-6 overflow-hidden flex-shrink-0 relative">
                  <img 
                    src="/the-talking-logo.png" 
                    alt="The Talking Logo"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#FFFFFF] text-[32px] font-medium mb-2">AITU Kerek</h3>
                  <div className="text-[#9a8c98] text-[16px] font-normal space-y-1 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>Almaty, Zhandosov 52</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>10.11.2027</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">БПА</span>
                    <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">АПА</span>
                    <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">АПА</span>
                    <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">А</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#9a8c98] text-[16px] font-normal mb-4 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pulvinar nisl vitae mi congue, eu egestas urna rutrum. 
                Mauris eros velit, pellentesque vel scelerisque risus viverra. Vivamus eros velit, pellentesque ne...
              </p>

              {/* Actions */}
              <div className="flex flex-col items-start">
                <a href="#" className="text-[#FFFFFF] underline hover:text-[#748CAB] text-[14px] font-normal mb-3">
                  More...
                </a>
                <a href="/tournament/1" className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal inline-block text-center">
                  Show Details
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 