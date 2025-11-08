"use client"

import { Crown } from "lucide-react"
import Header from "../../components/Header"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function RatingPage() {
  const [animateGradients, setAnimateGradients] = useState(false)

  // Leaderboard disabled: backend has no rating field

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateGradients(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Leader Board (disabled) */}
      <section className="px-8 py-12">
        <div className="relative">
          <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
            Champions
          </h3>
          <div className="relative z-10 pt-32 w-[90%] mx-auto text-center">
            <p className="text-[#4a4e69] text-[18px]">Leaderboard coming soon</p>
          </div>
        </div>
      </section>
    </div>
  )
} 