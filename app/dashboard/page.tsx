import { ChevronLeft, ChevronRight, Crown } from "lucide-react"
import Header from "../../components/Header"

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Hero Section with User Welcome */}
      <section className="text-center py-8">
        <h1 className="text-[#0D1321] text-[56px] font-bold mb-8">Welcome to DeBetter</h1>

        <div className="bg-[#0D1321] rounded-[16px] mx-8 py-16 px-8 relative">
          <h2 className="text-[#FFFFFF] text-[46px] font-semibold mb-8">
            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">DeBetter</span> - website for{" "}
            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">debates</span> organisation
          </h2>

          <div className="flex justify-center space-x-4 mb-8">
            <a href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal text-center">
              Join Debates
            </a>
            <button className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal">
              Host Debate
            </button>
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-[8px] h-[8px] bg-[#4a4e69] rounded-full"></div>
            <div className="w-[8px] h-[8px] bg-[#FFFFFF] rounded-full"></div>
            <div className="w-[8px] h-[8px] bg-[#4a4e69] rounded-full"></div>
          </div>
        </div>
      </section>

      {/* User Welcome Back Section */}
      <section className="px-8 py-8">
        <div className="bg-[#0D1321] rounded-[16px] p-8 relative overflow-hidden">
          {/* Background illustration */}
          <div className="absolute inset-0 overflow-hidden rounded-[16px]">
            <img 
              src="/images/image 57.png" 
              alt="Debate background illustration" 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-[#0D1321] bg-opacity-60"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-[#c9ada7] rounded-full"></div>
              <h3 className="text-[#FFFFFF] text-[36px] font-semibold">Welcome Back <span className="text-[#748CAB]">User112003!</span></h3>
            </div>

            <div className="flex space-x-4 mb-8">
              <button className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal">
                My Profile
              </button>
              <button className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal">
                My Tournaments
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-[#FFFFFF] text-[24px] font-medium mb-4">Your Stats</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                  </div>
                  <div>
                    <div className="text-[#FFFFFF] text-[20px] font-medium">12</div>
                    <div className="text-[#9a8c98] text-[14px]">Tournaments</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                  </div>
                  <div>
                    <div className="text-[#FFFFFF] text-[20px] font-medium">12</div>
                    <div className="text-[#9a8c98] text-[14px]">Active Tournaments</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                  </div>
                  <div>
                    <div className="text-[#FFFFFF] text-[20px] font-medium">12</div>
                    <div className="text-[#9a8c98] text-[14px]">Average Score</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                    <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                  </div>
                  <div>
                    <div className="text-[#FFFFFF] text-[20px] font-medium">12</div>
                    <div className="text-[#9a8c98] text-[14px]">Ranking</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Debates */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8">Upcoming Debates</h3>

        <div className="relative">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg z-10">
            <ChevronLeft className="w-[24px] h-[24px] text-[#4a4e69]" />
          </button>

          <div className="flex space-x-6 overflow-hidden">
            {[1, 2].map((item) => (
              <div key={item} className="bg-[#0D1321] rounded-[12px] p-6 flex-1 min-w-0">
                <h4 className="text-[#FFFFFF] text-[30px] font-medium mb-2">AITU Kerek</h4>
                <p className="text-[#9a8c98] mb-1 text-[16px] font-normal">Almaty, Zhandosov 52</p>
                <p className="text-[#9a8c98] mb-4 text-[16px] font-normal">10.11.2027</p>

                <div className="flex space-x-2 mb-6">
                  <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">БПА</span>
                  <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">АПА</span>
                  <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">БПА</span>
                  {item === 1 && (
                    <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">А</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-start">
                    <a href="#" className="text-[#FFFFFF] underline hover:text-[#83c5be] text-[14px] font-normal">
                      More...
                    </a>
                  </div>
                  <div className="flex justify-start">
                    <a href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#748cab] text-[14px] font-normal text-center">
                      Join Debates
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg z-10">
            <ChevronRight className="w-[24px] h-[24px] text-[#4a4e69]" />
          </button>
        </div>
      </section>

      {/* Past Debates Section */}
      <section className="px-8 py-12">
        <div className="bg-[#3E5C76] rounded-[16px] p-8 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <h3 className="text-[#748CAB] text-[120px] font-bold opacity-30 select-none">
              Past debates
            </h3>
          </div>
          
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Past Debate Card 1 */}
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[12px] p-6 h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative z-10">
                  <h4 className="text-white text-[24px] font-semibold mb-2">aitu kerek</h4>
                  <p className="text-white/80 text-[14px] mb-1">Almaty, Zhandosov 52</p>
                  <p className="text-white/80 text-[14px] mb-4">29 Aug 2023</p>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex space-x-2 mb-4">
                      <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Sponsor: K. Carlos</span>
                      <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Organization: I. Janie</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past Debate Card 2 */}
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-[12px] p-6 h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative z-10">
                  <h4 className="text-white text-[24px] font-semibold mb-2">Shyn Zhurek</h4>
                  <p className="text-white/80 text-[14px] mb-1">Almaty</p>
                  <p className="text-white/80 text-[14px] mb-4">12 Jul 2023</p>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex space-x-2 mb-4">
                      <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Sponsor: Carlos</span>
                      <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Organization: udin</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Past Debate Card 3 */}
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-[12px] p-6 h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="relative z-10">
                  <h4 className="text-white text-[24px] font-semibold mb-2">tartiip</h4>
                  <p className="text-white/80 text-[14px] mb-1">Almaty, Tole bi 59</p>
                  <p className="text-white/80 text-[14px] mb-4">4 Apr 2023</p>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex space-x-2 mb-4">
                      <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Sponsor: K. Carlos</span>
                      <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Organization: ...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8">Testimonials</h3>

        <div className="relative">
          <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg z-10">
            <ChevronLeft className="w-[24px] h-[24px] text-[#4a4e69]" />
          </button>

          <div className="flex space-x-6 overflow-hidden">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white border border-[#9a8c98] rounded-[12px] p-6 flex-1 min-w-0">
                <div className="w-[64px] h-[64px] bg-[#c9ada7] rounded-full mx-auto mb-4"></div>
                <h6 className="text-[#0D1321] text-[20px] font-medium text-center mb-1">Zheksembek Abdolla</h6>
                <p className="text-[#0D1321] text-[14px] font-normal text-center mb-4">Debatter</p>
                <p className="text-[#0D1321] text-[14px] font-normal text-center leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi posuere ipsum vel mattis mollis. In sit
                  amet orci ac dui viverra lobortis ac at mi. Nulla a enim rutrum, vehicula.
                </p>
              </div>
            ))}
          </div>

          <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg z-10">
            <ChevronRight className="w-[24px] h-[24px] text-[#4a4e69]" />
          </button>
        </div>
      </section>

      {/* Leader Board */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8">Leader Board</h3>

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
              </div>
            </div>

            {/* 3rd Place */}
            <div className="bg-white rounded-[12px] overflow-hidden shadow-lg relative w-full order-3">
              <div className="h-[96px] bg-gradient-to-r from-orange-400 via-red-300 to-pink-300 relative">
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
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 