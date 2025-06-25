import { Crown } from "lucide-react"
import Header from "../../components/Header"

export default function RatingPage() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Leader Board */}
      <section className="px-8 py-12">
        <div className="relative">
          <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
            Champions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12 justify-items-center relative z-10 pt-32 w-[90%] mx-auto">
            {/* 2nd Place */}
            <div className="bg-white rounded-[12px] overflow-hidden shadow-lg relative w-full order-2 md:order-1">
              <div className="h-[96px] bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 relative">
                <span className="absolute top-4 right-4 text-[#22223b] text-[56px] font-bold">2nd</span>
              </div>
              <div className="p-6 pt-[48px]">
                <div
                  className="w-[96px] h-[96px] bg-[#c9ada7] absolute left-4 top-[48px] z-10"
                  style={{
                    clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
                    transform: "rotate(30deg)",
                  }}
                ></div>
                <h6 className="text-[#4a4e69] text-[30px] font-medium mb-6 text-center">Kris Robertson</h6>
                <div className="flex justify-between mb-6">
                  <div className="text-center">
                    <div className="text-[#4a4e69] text-[30px] font-medium">20</div>
                    <div className="text-[#9a8c98] text-[20px] font-medium">debates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#4a4e69] text-[30px] font-medium">1829</div>
                    <div className="text-[#9a8c98] text-[20px] font-medium">Average Score</div>
                  </div>
                </div>
                <button className="border border-[#4a4e69] text-[#4a4e69] px-6 py-3 rounded-[8px] hover:bg-[#4a4e69] hover:text-[#FFFFFF] w-full text-[16px] font-normal">
                  Profile
                </button>
              </div>
            </div>

            {/* 1st Place */}
            <div className="bg-white rounded-[12px] shadow-lg relative w-full transform md:-translate-y-8 order-1 md:order-2">
              <Crown className="absolute -top-[64px] left-1/2 transform -translate-x-1/2 w-[48px] h-[48px] text-[#fca311] z-20" />
              <div className="h-[96px] bg-gradient-to-r from-yellow-300 via-yellow-200 to-green-300 relative rounded-t-[12px]">
                <span className="absolute top-4 right-4 text-[#22223b] text-[56px] font-bold">1st</span>
              </div>
              <div className="p-6 pt-[48px]">
                <div
                  className="w-[96px] h-[96px] bg-[#c9ada7] absolute left-4 top-[48px] z-10"
                  style={{
                    clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
                    transform: "rotate(30deg)",
                  }}
                ></div>
                <h6 className="text-[#4a4e69] text-[30px] font-medium mb-6 text-center">Baubek Negrov</h6>
                <div className="flex justify-between mb-6">
                  <div className="text-center">
                    <div className="text-[#4a4e69] text-[30px] font-medium">20</div>
                    <div className="text-[#9a8c98] text-[20px] font-medium">debates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#4a4e69] text-[30px] font-medium">1829</div>
                    <div className="text-[#9a8c98] text-[20px] font-medium">Average Score</div>
                  </div>
                </div>
                <button className="border border-[#4a4e69] text-[#4a4e69] px-6 py-3 rounded-[8px] hover:bg-[#4a4e69] hover:text-[#FFFFFF] w-full text-[16px] font-normal">
                  Profile
                </button>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="bg-white rounded-[12px] overflow-hidden shadow-lg relative w-full order-3 md:order-3">
              <div className="h-[96px] bg-gradient-to-r from-red-400 via-pink-300 to-red-300 relative">
                <span className="absolute top-4 right-4 text-[#22223b] text-[56px] font-bold">3rd</span>
              </div>
              <div className="p-6 pt-[48px]">
                <div
                  className="w-[96px] h-[96px] bg-[#c9ada7] absolute left-4 top-[48px] z-10"
                  style={{
                    clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
                    transform: "rotate(30deg)",
                  }}
                ></div>
                <h6 className="text-[#4a4e69] text-[30px] font-medium mb-6 text-center">Real Nigga</h6>
                <div className="flex justify-between mb-6">
                  <div className="text-center">
                    <div className="text-[#4a4e69] text-[30px] font-medium">20</div>
                    <div className="text-[#9a8c98] text-[20px] font-medium">debates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#4a4e69] text-[30px] font-medium">993</div>
                    <div className="text-[#9a8c98] text-[20px] font-medium">Average Score</div>
                  </div>
                </div>
                <button className="border border-[#4a4e69] text-[#4a4e69] px-6 py-3 rounded-[8px] hover:bg-[#4a4e69] hover:text-[#FFFFFF] w-full text-[16px] font-normal">
                  Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="px-8 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 mb-4 px-6 py-4">
            <div className="text-[#9a8c98] text-[16px] font-medium">Name</div>
            <div></div>
            <div className="text-[#9a8c98] text-[16px] font-medium text-center">Rating</div>
            <div className="text-[#9a8c98] text-[16px] font-medium text-center">Mean point</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {/* 1st Place - Yellow border */}
            <div className="grid grid-cols-4 gap-4 items-center bg-white rounded-[8px] p-4 border-l-4 border-yellow-400">
              <div className="flex items-center space-x-3">
                <span className="text-[#4a4e69] text-[18px] font-medium">1</span>
                <div className="w-[40px] h-[40px] bg-[#c9ada7] rounded-full"></div>
              </div>
              <div className="text-[#4a4e69] text-[16px] font-medium">Baubek Negrov</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">1750</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">1829</div>
            </div>

            {/* 2nd Place - Blue border */}
            <div className="grid grid-cols-4 gap-4 items-center bg-white rounded-[8px] p-4 border-l-4 border-blue-400">
              <div className="flex items-center space-x-3">
                <span className="text-[#4a4e69] text-[18px] font-medium">2</span>
                <div className="w-[40px] h-[40px] bg-[#c9ada7] rounded-full"></div>
              </div>
              <div className="text-[#4a4e69] text-[16px] font-medium">Kris Robertson</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">1550</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">98</div>
            </div>

            {/* 3rd Place - Red border */}
            <div className="grid grid-cols-4 gap-4 items-center bg-white rounded-[8px] p-4 border-l-4 border-red-400">
              <div className="flex items-center space-x-3">
                <span className="text-[#4a4e69] text-[18px] font-medium">3</span>
                <div className="w-[40px] h-[40px] bg-[#c9ada7] rounded-full"></div>
              </div>
              <div className="text-[#4a4e69] text-[16px] font-medium">Real Nigga</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">993</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">99</div>
            </div>

            {/* 4th Place - Gray border */}
            <div className="grid grid-cols-4 gap-4 items-center bg-white rounded-[8px] p-4 border-l-4 border-gray-300">
              <div className="flex items-center space-x-3">
                <span className="text-[#4a4e69] text-[18px] font-medium">4</span>
                <div className="w-[40px] h-[40px] bg-[#c9ada7] rounded-full"></div>
              </div>
              <div className="text-[#4a4e69] text-[16px] font-medium">Hanna</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">993</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">99</div>
            </div>

            {/* 5th Place - Gray border */}
            <div className="grid grid-cols-4 gap-4 items-center bg-white rounded-[8px] p-4 border-l-4 border-gray-300">
              <div className="flex items-center space-x-3">
                <span className="text-[#4a4e69] text-[18px] font-medium">5</span>
                <div className="w-[40px] h-[40px] bg-[#c9ada7] rounded-full"></div>
              </div>
              <div className="text-[#4a4e69] text-[16px] font-medium">Robertso</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">993</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">99</div>
            </div>

            {/* 6th Place - Gray border */}
            <div className="grid grid-cols-4 gap-4 items-center bg-white rounded-[8px] p-4 border-l-4 border-gray-300">
              <div className="flex items-center space-x-3">
                <span className="text-[#4a4e69] text-[18px] font-medium">6</span>
                <div className="w-[40px] h-[40px] bg-[#c9ada7] rounded-full"></div>
              </div>
              <div className="text-[#4a4e69] text-[16px] font-medium">Alex Nigga</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">993</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">99</div>
            </div>

            {/* 7th Place - Gray border */}
            <div className="grid grid-cols-4 gap-4 items-center bg-white rounded-[8px] p-4 border-l-4 border-gray-300">
              <div className="flex items-center space-x-3">
                <span className="text-[#4a4e69] text-[18px] font-medium">7</span>
                <div className="w-[40px] h-[40px] bg-[#c9ada7] rounded-full"></div>
              </div>
              <div className="text-[#4a4e69] text-[16px] font-medium">monkey D Lyfu</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">993</div>
              <div className="text-[#4a4e69] text-[16px] font-medium text-center">99</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 