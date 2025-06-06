"use client"

import { MapPin, Calendar } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import Header from "../../components/Header"

interface Tournament {
  id: number
  name: string
  location: string
  date: string
  tags: string[]
  description: string
  imageUrl: string
}

export default function MyTournamentsPage() {
  const [activeTab, setActiveTab] = useState('Past')
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({})

  const tournaments: Tournament[] = [
    {
      id: 1,
      name: "AITU Kerek",
      location: "Almaty, Zhandosov 52",
      date: "10.11.2024",
      tags: ["БПА", "АПА", "АПА", "А"],
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum pulvinar nisl vitae mi congue, eu egestas urna rutrum. Mauris eros velit, pellentesque vel scelerisque risus viverra. Vivamus eros velit, pellentesque ne...",
      imageUrl: "/the-talking-logo.png"
    },
    {
      id: 2,
      name: "Kazakhstan Open Debate Championship",
      location: "Astana, Mynbaeva 48",
      date: "15.12.2024",
      tags: ["БПА", "АПА", "Открытый"],
      description: "Престижный национальный чемпионат по дебатам, собирающий лучшие команды со всего Казахстана. Участники будут обсуждать актуальные социально-политические темы в формате британских парламентских дебатов...",
      imageUrl: "/the-talking-logo.png"
    }
  ]

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

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
          {tournaments.map((tournament) => (
            <div key={tournament.id} className="bg-[#0D1321] rounded-[16px] p-8">
              {/* Tournament Info */}
              <div className="flex items-start mb-6">
                <div className="w-[150px] h-[150px] bg-[#FFFFFF] rounded-full mr-6 overflow-hidden flex-shrink-0 relative">
                  {!imageErrors[tournament.id] ? (
                    <Image 
                      src={tournament.imageUrl} 
                      alt={`${tournament.name} tournament logo - debate competition in ${tournament.location.split(',')[0]}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                      priority={tournament.id === 1}
                      onError={() => setImageErrors(prev => ({ ...prev, [tournament.id]: true }))}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-[#FFFFFF] text-[32px] font-medium mb-2">{tournament.name}</h3>
                  <div className="text-[#9a8c98] text-[16px] font-normal space-y-1 mb-4">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{tournament.date}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {tournament.tags.map((tag, index) => (
                      <span key={index} className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#9a8c98] text-[16px] font-normal mb-4 leading-relaxed">
                {tournament.description}
              </p>

              {/* Actions */}
              <div className="flex flex-col items-start">
                <a href="#" className="text-[#FFFFFF] underline hover:text-[#748CAB] text-[14px] font-normal mb-3">
                  More...
                </a>
                <a href={`/tournament/${tournament.id}`} className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal inline-block text-center">
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