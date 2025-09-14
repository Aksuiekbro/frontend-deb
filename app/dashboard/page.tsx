import { ChevronLeft, ChevronRight, Crown } from "lucide-react"
import Link from "next/link"
import Header from "../../components/Header"
import { useCurrentUser, useUpcomingTournaments, useLeaderboard, useTournaments } from "../../hooks/use-api"
import { LoadingState, UserStatsSkeleton, TournamentCardSkeleton, LeaderboardSkeleton } from "../../components/ui/loading"
import { ErrorState, EmptyState } from "../../components/ui/error"

export default function Dashboard() {
  // API hooks
  const { user: currentUser, isLoading: userLoading, error: userError } = useCurrentUser()
  const { upcomingTournaments, isLoading: upcomingLoading, error: upcomingError } = useUpcomingTournaments(6)
  const { leaderboard, isLoading: leaderboardLoading, error: leaderboardError } = useLeaderboard(3)

  // Get past tournaments
  const currentDate = new Date().toISOString().split('T')[0]
  const { tournaments: pastTournamentsData, isLoading: pastLoading, error: pastError } = useTournaments(
    { startDateTo: currentDate },
    { page: 0, size: 6, sort: ['startDate,desc'] }
  )

  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />

      {/* Hero Section with User Welcome */}
      <section className="text-center py-8">
        <LoadingState
          isLoading={userLoading}
          fallback={<div className="h-16 bg-gray-200 animate-pulse mx-8 rounded"></div>}
        >
          {userError ? (
            <h1 className="text-[#0D1321] text-[56px] font-bold mb-8">Welcome to DeBetter</h1>
          ) : (
            <h1 className="text-[#0D1321] text-[56px] font-bold mb-8">
              Welcome back, {currentUser?.firstName || 'User'}!
            </h1>
          )}
        </LoadingState>

        <div className="bg-[#0D1321] rounded-[16px] mx-8 py-16 px-8 relative">
          <h2 className="text-[#FFFFFF] text-[46px] font-semibold mb-8">
            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">DeBetter</span> - website for{" "}
            <span className="text-[#748CAB] font-hikasami text-[46px] font-semibold">debates</span> organisation
          </h2>

          <div className="flex justify-center space-x-4 mb-8">
            <Link href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal text-center">
              Join Debates
            </Link>
            <Link href="/create-tournament" className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal">
              Host Debate
            </Link>
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
            <LoadingState
              isLoading={userLoading}
              fallback={<UserStatsSkeleton />}
            >
              {userError ? (
                <ErrorState
                  error={userError}
                  onRetry={() => window.location.reload()}
                  message="Failed to load user profile"
                />
              ) : currentUser ? (
                <>
                  <div className="flex items-center space-x-4 mb-6">
                    {currentUser.imageUrl ? (
                      <img
                        src={currentUser.imageUrl.url}
                        alt={`${currentUser.firstName} ${currentUser.lastName} profile`}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[#c9ada7] rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                      </div>
                    )}
                    <h3 className="text-[#FFFFFF] text-[36px] font-semibold">
                      Welcome Back <span className="text-[#748CAB]">{currentUser.firstName} {currentUser.lastName}!</span>
                    </h3>
                  </div>

                  <div className="flex space-x-4 mb-8">
                    <Link href={`/profile/${currentUser.id}`} className="bg-[#4a4e69] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#748cab] text-[16px] font-normal">
                      My Profile
                    </Link>
                    <Link href="/my-tournaments" className="border border-[#FFFFFF] text-[#FFFFFF] px-6 py-3 rounded-[8px] hover:bg-[#FFFFFF] hover:text-[#22223b] text-[16px] font-normal">
                      My Tournaments
                    </Link>
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
                          <div className="text-[#FFFFFF] text-[20px] font-medium">{currentUser.tournamentsParticipated || 0}</div>
                          <div className="text-[#9a8c98] text-[14px]">Tournaments</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                        </div>
                        <div>
                          <div className="text-[#FFFFFF] text-[20px] font-medium">{upcomingTournaments?.content?.length || 0}</div>
                          <div className="text-[#9a8c98] text-[14px]">Upcoming</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                        </div>
                        <div>
                          <div className="text-[#FFFFFF] text-[20px] font-medium">{currentUser.rating || 0}</div>
                          <div className="text-[#9a8c98] text-[14px]">Rating</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                          <div className="w-6 h-6 bg-[#748CAB] rounded"></div>
                        </div>
                        <div>
                          <div className="text-[#FFFFFF] text-[20px] font-medium">-</div>
                          <div className="text-[#9a8c98] text-[14px]">Ranking</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Welcome to DeBetter!"
                  description="Please log in to view your personalized dashboard"
                  actionText="Login"
                  actionHref="/auth"
                />
              )}
            </LoadingState>
          </div>
        </div>
      </section>

      {/* Upcoming Debates */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8">Upcoming Debates</h3>

        <LoadingState
          isLoading={upcomingLoading}
          fallback={
            <div className="flex space-x-6 overflow-hidden">
              {[1, 2].map(i => (
                <TournamentCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          {upcomingError ? (
            <ErrorState
              error={upcomingError}
              onRetry={() => window.location.reload()}
              message="Failed to load upcoming tournaments"
            />
          ) : upcomingTournaments && upcomingTournaments.content.length > 0 ? (
            <div className="relative">
              <div className="flex space-x-6 overflow-hidden">
                {upcomingTournaments.content.slice(0, 2).map((tournament) => {
                  const formattedDate = new Date(tournament.startDate).toLocaleDateString('en-GB')

                  return (
                    <div key={tournament.id} className="bg-[#0D1321] rounded-[12px] p-6 flex-1 min-w-0">
                      <h4 className="text-[#FFFFFF] text-[30px] font-medium mb-2">{tournament.name}</h4>
                      <p className="text-[#9a8c98] mb-1 text-[16px] font-normal">{tournament.location}</p>
                      <p className="text-[#9a8c98] mb-4 text-[16px] font-normal">{formattedDate}</p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {tournament.tags.map((tag, index) => (
                          <span key={index} className="bg-[#FFFFFF] text-[#22223b] px-3 py-1 rounded text-[14px] font-normal cursor-default">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-start">
                          <Link href={`/tournament/${tournament.id}`} className="text-[#FFFFFF] underline hover:text-[#83c5be] text-[14px] font-normal">
                            More...
                          </Link>
                        </div>
                        <div className="flex justify-start">
                          <Link href="/join" className="inline-block bg-[#4a4e69] text-[#FFFFFF] px-4 py-2 rounded hover:bg-[#748cab] text-[14px] font-normal text-center">
                            Join Debates
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No upcoming tournaments"
              description="Check back later for new tournaments to join"
              actionText="Browse All Tournaments"
              actionHref="/tournaments"
            />
          )}
        </LoadingState>
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
            <LoadingState
              isLoading={pastLoading}
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-300 animate-pulse rounded-[12px] h-48"></div>
                  ))}
                </div>
              }
            >
              {pastError ? (
                <ErrorState
                  error={pastError}
                  onRetry={() => window.location.reload()}
                  message="Failed to load past tournaments"
                />
              ) : pastTournamentsData && pastTournamentsData.content.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pastTournamentsData.content.slice(0, 3).map((tournament, index) => {
                    const gradients = [
                      'from-orange-500 to-red-600',
                      'from-green-500 to-teal-600',
                      'from-purple-500 to-blue-600',
                      'from-pink-500 to-rose-600',
                      'from-blue-500 to-indigo-600',
                      'from-yellow-500 to-orange-600'
                    ]
                    const gradient = gradients[index % gradients.length]
                    const formattedDate = new Date(tournament.startDate).toLocaleDateString('en-GB')

                    return (
                      <div key={tournament.id} className={`bg-gradient-to-br ${gradient} rounded-[12px] p-6 h-48 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        <div className="relative z-10">
                          <h4 className="text-white text-[24px] font-semibold mb-2">{tournament.name}</h4>
                          <p className="text-white/80 text-[14px] mb-1">{tournament.location}</p>
                          <p className="text-white/80 text-[14px] mb-4">{formattedDate}</p>
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex flex-wrap gap-1 mb-4">
                              <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Format: {tournament.debateFormat}</span>
                              <span className="bg-white text-black px-2 py-1 rounded text-[12px]">Teams: {tournament.currentTeamCount}</span>
                            </div>
                            <Link
                              href={`/tournament/${tournament.id}`}
                              className="text-white underline hover:text-white/80 text-[12px]"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No past tournaments"
                  description="Your tournament history will appear here"
                  actionText="Join a Tournament"
                  actionHref="/tournaments"
                />
              )}
            </LoadingState>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-8 py-12">
        <h3 className="text-[#0D1321] text-[38px] font-semibold mb-8">Community Highlights</h3>

        <LoadingState
          isLoading={leaderboardLoading}
          fallback={
            <div className="flex space-x-6 overflow-hidden">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 animate-pulse rounded-[12px] py-8 px-6 flex-1 min-w-0 h-48"></div>
              ))}
            </div>
          }
        >
          {leaderboardError ? (
            <div className="bg-white border border-[#9a8c98] rounded-[12px] py-8 px-6 text-center">
              <p className="text-[#0D1321] text-[16px] font-normal">Unable to load community highlights</p>
            </div>
          ) : leaderboard && leaderboard.content.length > 0 ? (
            <div className="relative">
              <div className="flex space-x-6 overflow-hidden">
                {leaderboard.content.slice(0, 3).map((user, index) => {
                  const achievements = [
                    'Top Debater',
                    'Rising Star',
                    'Active Participant'
                  ]

                  return (
                    <div key={user.id} className="bg-white border border-[#9a8c98] rounded-[12px] py-8 px-6 flex-1 min-w-0">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl.url}
                          alt={`${user.firstName} ${user.lastName}`}
                          className="w-[64px] h-[64px] rounded-full mx-auto mb-4 object-cover"
                        />
                      ) : (
                        <div className="w-[64px] h-[64px] bg-[#c9ada7] rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                      )}
                      <h6 className="text-[#0D1321] text-[20px] font-medium text-center mb-1">
                        {user.firstName} {user.lastName}
                      </h6>
                      <p className="text-[#0D1321] text-[14px] font-normal text-center mb-4">
                        {achievements[index]} • Rating: {user.rating || 0}
                      </p>
                      <p className="text-[#0D1321] text-[14px] font-normal text-center leading-relaxed">
                        Participated in {user.tournamentsParticipated || 0} tournaments and achieved excellent results in debate competitions.
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#9a8c98] rounded-[12px] py-8 px-6 text-center">
              <p className="text-[#0D1321] text-[16px] font-normal">Community highlights will appear here as users participate in tournaments</p>
            </div>
          )}
        </LoadingState>
      </section>

      {/* Leader Board */}
      <section className="px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[#0D1321] text-[38px] font-semibold">Leader Board</h3>
          <Link href="/rating" className="text-[#4a4e69] underline hover:text-[#748CAB] text-[16px] font-normal">
            View Full Leaderboard
          </Link>
        </div>

        <LoadingState
          isLoading={leaderboardLoading}
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12 justify-items-center relative z-10 pt-16 w-[90%] mx-auto">
              <LeaderboardSkeleton />
              <LeaderboardSkeleton />
              <LeaderboardSkeleton />
            </div>
          }
        >
          {leaderboardError ? (
            <ErrorState
              error={leaderboardError}
              onRetry={() => window.location.reload()}
              message="Failed to load leaderboard"
            />
          ) : leaderboard && leaderboard.content.length > 0 ? (
            <div className="relative">
              <h3 className="text-[#c9ada7] text-[96px] font-semibold text-center mb-8 opacity-20 absolute inset-0 z-0 flex items-start justify-center pt-8">
                Champions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-12 justify-items-center relative z-10 pt-32 w-[90%] mx-auto">
                {leaderboard.content.slice(0, 3).map((user, index) => {
                  const position = index + 1
                  const gradients = [
                    'from-yellow-300 via-yellow-200 to-green-300', // 1st place
                    'from-blue-400 via-blue-300 to-cyan-300',      // 2nd place
                    'from-orange-400 via-red-300 to-pink-300',     // 3rd place
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
                      <div className={`h-[96px] bg-gradient-to-r ${gradients[index]} relative ${position === 1 ? 'rounded-t-[12px]' : ''}`}>
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
                            <div className="text-[#4a4e69] text-[30px] font-medium">{user.tournamentsParticipated || 0}</div>
                            <div className="text-[#9a8c98] text-[20px] font-medium">tournaments</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[#4a4e69] text-[30px] font-medium">{user.rating || 0}</div>
                            <div className="text-[#9a8c98] text-[20px] font-medium">Rating</div>
                          </div>
                        </div>
                        <Link
                          href={`/profile/${user.id}`}
                          className="border border-[#4a4e69] text-[#4a4e69] px-4 py-2 rounded-[8px] hover:bg-[#4a4e69] hover:text-[#FFFFFF] w-full text-[14px] font-normal text-center block transition-colors"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No leaderboard data available"
              description="Participate in tournaments to see rankings"
              actionText="Browse Tournaments"
              actionHref="/tournaments"
            />
          )}
        </LoadingState>
      </section>
    </div>
  )
} 