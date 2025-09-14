"use client"

import { Crown } from "lucide-react"
import Header from "../../components/Header"
import { useEffect, useState } from "react"
import { useLeaderboard } from "../../hooks/use-api"
import { LoadingState, LeaderboardSkeleton } from "../../components/ui/loading"
import { ErrorState } from "../../components/ui/error"
import Link from "next/link"

export default function RatingPage() {
  const [animateGradients, setAnimateGradients] = useState(false)

  // API hook for leaderboard
  const { leaderboard, isLoading, error } = useLeaderboard(10)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateGradients(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Leader Board */}
      <section className="px-8 py-12">
        <div className="relative">
          <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
            Champions
          </h3>

          <LoadingState
            isLoading={isLoading}
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12 justify-items-center relative z-10 pt-32 w-[90%] mx-auto">
                <LeaderboardSkeleton />
                <LeaderboardSkeleton />
                <LeaderboardSkeleton />
              </div>
            }
          >
            {error ? (
              <ErrorState
                error={error}
                onRetry={() => window.location.reload()}
                message="Failed to load leaderboard"
              />
            ) : leaderboard && leaderboard.content.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12 justify-items-center relative z-10 pt-32 w-[90%] mx-auto">
                {/* Top 3 Special Display */}
                {leaderboard.content.slice(0, 3).map((user, index) => {
                  const position = index + 1
                  const gradients = [
                    'linear-gradient(to right, #0D1321, #3E5C76)', // 1st place
                    'linear-gradient(to right, #3E5C76, #748CAB)', // 2nd place
                    'linear-gradient(to right, #748CAB, #c9ada7)', // 3rd place
                  ]
                  const orders = ['order-1 md:order-2', 'order-2 md:order-1', 'order-3'] // 1st, 2nd, 3rd

                  return (
                    <div
                      key={user.id}
                      className={`bg-white rounded-[12px] overflow-hidden shadow-lg relative w-full ${orders[index]} ${position === 1 ? 'transform md:-translate-y-8' : ''}`}
                    >
                      {position === 1 && (
                        <Crown className="absolute -top-[64px] left-1/2 transform -translate-x-1/2 w-[48px] h-[48px] text-[#fca311] z-20" />
                      )}
                      <div className={`h-[96px] relative overflow-hidden ${position === 1 ? 'rounded-t-[12px]' : ''}`}>
                        <div
                          className={`h-full transition-all duration-1000 ${position === 1 ? 'rounded-t-[12px]' : ''}`}
                          style={{
                            background: gradients[index],
                            width: animateGradients ? '100%' : '0%',
                            transform: 'translateX(0)',
                            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        />
                        <span className="absolute top-4 right-4 text-[#22223b] text-[56px] font-bold">
                          {position === 1 ? '1st' : position === 2 ? '2nd' : '3rd'}
                        </span>
                      </div>
                      <div className="p-6 pt-[48px]">
                        <div
                          className="w-[96px] h-[96px] bg-[#c9ada7] absolute left-4 top-[48px] z-10"
                          style={{
                            clipPath: "polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)",
                            transform: "rotate(30deg)",
                          }}
                        ></div>
                        <h6 className="text-[#4a4e69] text-[30px] font-medium mb-6 text-center">
                          {user.firstName} {user.lastName}
                        </h6>
                        <div className="flex justify-between mb-6">
                          <div className="text-center">
                            <div className="text-[#4a4e69] text-[30px] font-medium">
                              {user.tournamentsParticipated || 0}
                            </div>
                            <div className="text-[#9a8c98] text-[20px] font-medium">tournaments</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[#4a4e69] text-[30px] font-medium">
                              {user.rating || 0}
                            </div>
                            <div className="text-[#9a8c98] text-[20px] font-medium">Rating</div>
                          </div>
                        </div>
                        <Link
                          href={`/profile/${user.id}`}
                          className="border border-[#4a4e69] text-[#4a4e69] px-6 py-3 rounded-[8px] hover:bg-[#4a4e69] hover:text-[#FFFFFF] w-full text-[16px] font-normal text-center block transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-[#4a4e69] text-[18px]">No leaderboard data available yet</p>
                <p className="text-[#9a8c98] text-[14px] mt-2">
                  Participate in tournaments to see rankings
                </p>
              </div>
            )}

            {/* Remaining Users (4th position onwards) */}
            {leaderboard && leaderboard.content.length > 3 && (
              <div className="mt-16 w-full max-w-4xl mx-auto">
                <h4 className="text-[#0D1321] text-[32px] font-bold mb-8 text-center">Other Top Performers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leaderboard.content.slice(3).map((user, index) => (
                    <div key={user.id} className="bg-white rounded-[12px] p-6 shadow-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#c9ada7] rounded-full flex items-center justify-center text-white font-bold">
                            {index + 4}
                          </div>
                          <div>
                            <h6 className="text-[#4a4e69] text-[18px] font-medium">
                              {user.firstName} {user.lastName}
                            </h6>
                            <p className="text-[#9a8c98] text-[14px]">
                              {user.tournamentsParticipated || 0} tournaments
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#4a4e69] text-[24px] font-bold">
                            {user.rating || 0}
                          </div>
                          <p className="text-[#9a8c98] text-[12px]">Rating</p>
                        </div>
                      </div>
                      <Link
                        href={`/profile/${user.id}`}
                        className="mt-4 border border-[#4a4e69] text-[#4a4e69] px-4 py-2 rounded-[8px] hover:bg-[#4a4e69] hover:text-[#FFFFFF] w-full text-[14px] font-normal text-center block transition-colors"
                      >
                        View Profile
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </LoadingState>
        </div>
      </section>
    </div>
  )
} 