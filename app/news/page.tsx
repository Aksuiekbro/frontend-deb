import Header from "../../components/Header"

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Main Content */}
      <div className="relative px-8 py-12">
        {/* Background Text */}
        <div className="relative">
          <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
            Past debates
          </h3>

          {/* News Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto pt-32">
          {/* Card 1 - aitu kerek */}
          <div className="bg-white rounded-[16px] overflow-hidden shadow-lg">
            <div className="h-[200px] bg-gradient-to-br from-orange-600 to-red-700 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-[32px] font-semibold">aitu kerek</h3>
                <p className="text-[16px] opacity-90">NIS PhMD, Zhamakaeva 145</p>
                <p className="text-[16px] opacity-90">04.04.2025</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between text-[14px] text-[#4a4e69]">
                <span>Sponsor: N. Kartos</span>
                <span>Organizator: L. Lame</span>
              </div>
            </div>
          </div>

          {/* Card 2 - Shyn Zhurek */}
          <div className="bg-white rounded-[16px] overflow-hidden shadow-lg">
            <div className="h-[200px] bg-gradient-to-br from-green-600 to-teal-700 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-[32px] font-semibold">Shyn Zhurek</h3>
                <p className="text-[16px] opacity-90">NIS PhMD, Zhamakaeva 145</p>
                <p className="text-[16px] opacity-90">04.04.2025</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between text-[14px] text-[#4a4e69]">
                <span>Sponsor: Kratos</span>
                <span>Organizator: L. Lokh</span>
              </div>
            </div>
          </div>

          {/* Card 3 - tartiip */}
          <div className="bg-white rounded-[16px] overflow-hidden shadow-lg">
            <div className="h-[200px] bg-gradient-to-br from-blue-600 to-indigo-700 relative">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-[32px] font-semibold">tartiip</h3>
                <p className="text-[16px] opacity-90">NIS PhMD, Zhamakaeva 145</p>
                <p className="text-[16px] opacity-90">04.04.2025</p>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between text-[14px] text-[#4a4e69]">
                <span>Sponsor: N. Kartos</span>
                <span>Organizator: L. Lokh</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
} 