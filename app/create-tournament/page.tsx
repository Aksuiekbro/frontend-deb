import Header from "@/components/Header"
import HostDebate from "@/components/host/HostDebate"

export default function CreateTournamentPage() {
  return (
    <div className="min-h-screen bg-[#F1F1F1] font-hikasami">
      <Header />
      <main className="container mx-auto max-w-[1280px] px-8 py-8">
        <HostDebate />
      </main>
    </div>
  )
}


