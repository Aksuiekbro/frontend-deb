"use client"

import Footer from "@/components/Footer"

export default function RatingPage() {
  // Leaderboard disabled: backend has no rating field

  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 35%' }}>
        <img src="/images/senate/ceremony-baptism.webp" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
        <section className="db-hero" style={{ height: 220 }}>
          <div className="db-hero__content db-container" style={{ paddingBottom: 28 }}>
            <h1 className="db-hero__title" style={{ fontSize: 'clamp(28px,4vw,44px)' }}>Rating</h1>
          </div>
        </section>

        <div className="db-container" style={{ padding: '32px 24px 72px' }}>
          <div className="db-panel content-panel relative overflow-hidden text-center">
            <h2
              aria-hidden="true"
              className="pointer-events-none select-none font-[var(--db-font-display)]"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 24,
                fontSize: 'clamp(48px, 9vw, 96px)',
                fontWeight: 700,
                color: 'var(--db-accent)',
                opacity: 0.18,
              }}
            >
              Champions
            </h2>
            <div className="relative z-10" style={{ padding: '96px 0 48px' }}>
              <p className="text-[18px]" style={{ color: 'var(--db-muted)' }}>Leaderboard coming soon</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
