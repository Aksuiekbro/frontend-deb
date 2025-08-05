"use client"

import { ChevronLeft, ChevronRight, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"

export default function Component() {
  const router = useRouter()
  const [visibleGradients, setVisibleGradients] = useState<{[key: string]: boolean}>({})
  const gradientRefs = useRef<{[key: string]: HTMLDivElement | null}>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleGradients(prev => ({
              ...prev,
              [entry.target.id]: true
            }))
          }
        })
      },
      { threshold: 0.3 }
    )

    Object.values(gradientRefs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      {/* Header */}
      <header className="flex items-center justify-between px-12 py-4">
        <div className="flex items-center space-x-16">
          <div className="text-[#0D1321] text-[45px] font-bold font-hikasami">DB</div>
          <nav className="flex space-x-12">
            <Link href="/join" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
              Join Debates
            </Link>
            <Link href="/rating" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
              Rating
            </Link>
            <Link href="/news" className="text-[#4a4e69] hover:text-[#22223b] text-[16px] font-normal">
              News
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <select
              className="border border-[#3E5C76] rounded-[8px] px-4 py-2 text-[#0D1321] bg-white text-[14px] font-medium appearance-none bg-no-repeat bg-right bg-[length:16px] pr-10 hover:border-[#748CAB] focus:outline-none focus:ring-2 focus:ring-[#3E5C76] focus:ring-opacity-20 transition-all duration-200 cursor-pointer min-w-[100px] shadow-sm"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%233E5C76%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")',
              }}
            >
              <option>🇺🇸 English</option>
              <option>🇷🇺 Русский</option>
              <option>🇰🇿 Қазақша</option>
            </select>
          </div>
          <button 
            onClick={() => router.push('/auth?mode=register')}
            className="bg-[#3E5C76] text-white px-6 py-3 rounded-lg hover:bg-[#22223b] text-[14px] font-normal"
          >
            Registration
          </button>
          <button 
            onClick={() => router.push('/auth?mode=login')}
            className="border border-[#4a4e69] text-[#4a4e69] px-6 py-3 rounded-lg hover:bg-[#4a4e69] hover:text-white text-[14px] font-normal"
          >
            Log In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-8">
        <h1 className="text-[#0D1321] text-[56px] font-bold mb-8">Welcome to DeBetter</h1>

        <div className="bg-[#0D1321] rounded-[16px] mx-8 py-16 px-8 relative">
          <h2 className="text-[#FFFFFF] text-[46px] font-semibold mb-8">
            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">DeBetter</span> - website for{" "}
            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">debates</span> organisation
          </h2>

          <div className="flex justify-center space-x-4 mb-8">
            <Link href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal text-center">
              Join Debates
            </Link>
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
                  <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">БПА</span>
                  <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">АПА</span>
                  <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">БПА</span>
                  {item === 1 && (
                    <span className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal">А</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-start">
                    <a href="#" className="text-[#FFFFFF] underline hover:text-[#83c5be] text-[14px] font-normal">
                      More...
                    </a>
                  </div>
                  <div className="flex justify-start">
                    <Link href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#748cab] text-[14px] font-normal text-center">
                      Join Debates
                    </Link>
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
                  amet orci ac dui viverra lobortis ac at mi. Nulla a enim rutrum, vehicula. And I simply want to end
                  this shill! Hahahahahaha
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
              <div 
                className="h-[96px] relative overflow-hidden"
                id="gradient-2nd"
                ref={el => gradientRefs.current['gradient-2nd'] = el}
              >
                <div 
                  className="h-full transition-all duration-1000"
                  style={{
                    background: 'linear-gradient(to right, #3E5C76, #748CAB)',
                    width: visibleGradients['gradient-2nd'] ? '100%' : '0%',
                    transform: 'translateX(0)',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <span className="absolute top-4 right-4 text-[#22223b] text-[56px] font-bold">2nd</span>
              </div>
              <div className="p-6 pt-[48px]">
                <div
                  className="w-[64px] h-[64px] bg-[#c9ada7] absolute left-4 top-[64px] z-10"
                  style={{
                    clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
                    transform: "rotate(90deg)",
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
              <div 
                className="h-[96px] relative rounded-t-[12px] overflow-hidden"
                id="gradient-1st"
                ref={el => gradientRefs.current['gradient-1st'] = el}
              >
                <div 
                  className="h-full transition-all duration-1000 rounded-t-[12px]"
                  style={{
                    background: 'linear-gradient(to right, #0D1321, #3E5C76)',
                    width: visibleGradients['gradient-1st'] ? '100%' : '0%',
                    transform: 'translateX(0)',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <span className="absolute top-4 right-4 text-[#22223b] text-[56px] font-bold">1st</span>
              </div>
              <div className="p-6 pt-[48px]">
                <div
                  className="w-[64px] h-[64px] bg-[#c9ada7] absolute left-4 top-[64px] z-10"
                  style={{
                    clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
                    transform: "rotate(90deg)",
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

            {/* 3rd Place */}
            <div className="bg-white rounded-[12px] overflow-hidden shadow-lg relative w-full order-3">
              <div 
                className="h-[96px] relative overflow-hidden"
                id="gradient-3rd"
                ref={el => gradientRefs.current['gradient-3rd'] = el}
              >
                <div 
                  className="h-full transition-all duration-1000"
                  style={{
                    background: 'linear-gradient(to right, #748CAB, #c9ada7)',
                    width: visibleGradients['gradient-3rd'] ? '100%' : '0%',
                    transform: 'translateX(0)',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
                <span className="absolute top-4 right-4 text-[#22223b] text-[56px] font-bold">3rd</span>
              </div>
              <div className="p-6 pt-[48px]">
                <div
                  className="w-[64px] h-[64px] bg-[#c9ada7] absolute left-4 top-[64px] z-10"
                  style={{
                    clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
                    transform: "rotate(90deg)",
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
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D1321] text-[#FFFFFF] py-16 mt-16">
        <div className="px-8">
          <div className="text-center mb-8">
            <div className="text-[45px] font-bold font-hikasami mb-4">DB</div>
            <div className="flex justify-center space-x-4 mb-8">
              <a
                href="#"
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[36px] h-[36px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[24px] h-[24px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-[48px] h-[48px] bg-[#FFFFFF] rounded-full flex items-center justify-center hover:bg-[#83c5be] transition-colors"
              >
                <svg className="w-[24px] h-[24px] text-[#22223b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex justify-between items-center text-[14px] font-normal">
            <div>Contact us: debetter@gmail.com</div>
            <div>© 2025 all rights reserved</div>
            <div>Privacy Policy</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
