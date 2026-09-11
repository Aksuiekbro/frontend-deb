"use client"

import OrganizerBelow from "@/components/organizer/OrganizerBelow"
import HomeTop from "@/components/home/HomeTop"
import WelcomeCard from "@/components/organizer/WelcomeCard"
import Footer from "@/components/Footer"
import { useCurrentUser } from "../../hooks/use-api"

export default function OrganizerHomePage() {
  const { user: currentUser } = useCurrentUser()
  return (
    <>
      <div className="db-page-backdrop" aria-hidden="true" style={{ ['--db-backdrop-focal' as string]: '50% 35%' }}>
        <img src="/images/senate/plaza-assembly.jpg" alt="" />
        <div className="db-page-backdrop__scrim" />
      </div>
      <a className="db-skip-link" href="#main">Skip to content</a>

      <main id="main">
        {/* Use the same top sections as the public homepage (without testimonials) */}
        <HomeTop
          includeTestimonials={false}
          aboveUpcoming={<WelcomeCard userId={currentUser?.id} username={currentUser?.firstName} />}
        />
        {/* Keep everything below Testimonials from the organizer design */}
        <div className="flex justify-center py-6"><OrganizerBelow /></div>
      </main>

      <Footer />
    </>
  )
}
