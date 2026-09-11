import HostDebate from "@/components/host/HostDebate"
import Footer from "@/components/Footer"

export default function CreateTournamentPage() {
  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 55%' }}>
        <img src="/images/senate/senate-assembly.png" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
        <section className="db-hero" style={{ height: 220 }} />
        <div className="cd-wrap">
          <HostDebate />
        </div>
      </main>

      <Footer />
    </>
  )
}
